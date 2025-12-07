// Analytics Engine - Cálculos determinísticos

import type { Holding, UserProfile, PolicyProfile, Analytics } from '../types';

export function calculateAnalytics(
  holdings: Array<Holding & { valor: number }>,
  userProfile: UserProfile,
  policyProfile: PolicyProfile
): Analytics {
  const total = holdings.reduce((sum, h) => sum + Number(h.valor), 0);
  
  if (total === 0) {
    return {
      allocation_by_class: {},
      br_vs_exterior: { br: 0, exterior: 0 },
      top_holdings: [],
      concentration_top5: 0,
      concentration_top10: 0,
      complexity_score: 0,
      liquidity_score: 0,
      flags: [],
    };
  }

  // Alocação por classe
  const allocation_by_class: Record<string, number> = {};
  holdings.forEach(h => {
    const pct = (Number(h.valor) / total) * 100;
    allocation_by_class[h.tipo] = (allocation_by_class[h.tipo] || 0) + pct;
  });

  // Brasil vs Exterior
  const brTypes = ['Ação BR', 'ETF BR', 'FII', 'RF Pós', 'RF IPCA', 'Fundo', 'Previdência', 'Caixa'];
  let brTotal = 0;
  let exteriorTotal = 0;

  holdings.forEach(h => {
    const valor = Number(h.valor);
    if (brTypes.includes(h.tipo)) {
      brTotal += valor;
    } else if (h.tipo === 'Exterior') {
      exteriorTotal += valor;
    } else {
      // Outros considerados BR por padrão
      brTotal += valor;
    }
  });

  const br_vs_exterior = {
    br: (brTotal / total) * 100,
    exterior: (exteriorTotal / total) * 100,
  };

  // Top holdings
  const sortedHoldings = [...holdings]
    .sort((a, b) => Number(b.valor) - Number(a.valor))
    .slice(0, 10);

  const top_holdings = sortedHoldings.map(h => ({
    nome: h.nome_raw,
    percentual: (Number(h.valor) / total) * 100,
    tipo: h.tipo,
  }));

  // Concentração
  const top5Total = sortedHoldings.slice(0, 5).reduce((sum, h) => sum + Number(h.valor), 0);
  const top10Total = sortedHoldings.slice(0, 10).reduce((sum, h) => sum + Number(h.valor), 0);
  const concentration_top5 = (top5Total / total) * 100;
  const concentration_top10 = (top10Total / total) * 100;

  // Complexidade (fundos + previdência = caixa preta)
  const complexTypes = ['Fundo', 'Previdência'];
  const complexTotal = holdings
    .filter(h => complexTypes.includes(h.tipo))
    .reduce((sum, h) => sum + Number(h.valor), 0);
  const complexity_score = (complexTotal / total) * 100;

  // Liquidez (proxy: % em classes de liquidez alta)
  // Assumir: Ações, ETFs, FIIs, Exterior = alta liquidez
  // RF, Fundos, Previdência = média/baixa (depende do bucket se fornecido)
  const highLiquidityTypes = ['Ação BR', 'ETF BR', 'FII', 'Exterior', 'Caixa'];
  const highLiquidityTotal = holdings
    .filter(h => highLiquidityTypes.includes(h.tipo) || h.liquidez_bucket === 'alta')
    .reduce((sum, h) => sum + Number(h.valor), 0);
  const liquidity_score = (highLiquidityTotal / total) * 100;

  // Flags
  const flags: string[] = [];

  if (concentration_top5 > 45) {
    flags.push('HIGH_CONCENTRATION_TOP5');
  }

  if (br_vs_exterior.exterior < policyProfile.config.target_exterior_min) {
    flags.push('LOW_GLOBAL_DIVERSIFICATION');
  }

  if (complexity_score > policyProfile.config.max_fundos_caixa_preta) {
    flags.push('HIGH_COMPLEXITY_FUNDS');
  }

  if (liquidity_score < policyProfile.config.min_liquidity_high) {
    flags.push('LOW_LIQUIDITY_BUCKET');
  }

  // Risk mismatch: RV muito alta para risco baixa + prazo curto
  const rvTypes = ['Ação BR', 'ETF BR', 'FII', 'Exterior'];
  const rvTotal = holdings
    .filter(h => rvTypes.includes(h.tipo))
    .reduce((sum, h) => sum + Number(h.valor), 0);
  const rvPct = (rvTotal / total) * 100;

  if (
    userProfile.tolerancia_risco === 'baixa' &&
    userProfile.prazo_anos < 5 &&
    rvPct > 50
  ) {
    flags.push('RISK_MISMATCH_OBJECTIVE');
  }

  // Calcular subscores (0-100)
  const subscores = calculateSubscores({
    br_vs_exterior,
    concentration_top5,
    liquidity_score,
    complexity_score,
    holdings,
    total,
    policyProfile,
  });

  return {
    allocation_by_class,
    br_vs_exterior,
    top_holdings,
    concentration_top5,
    concentration_top10,
    complexity_score,
    liquidity_score,
    flags,
    subscores,
  };
}

function calculateSubscores(params: {
  br_vs_exterior: { br: number; exterior: number };
  concentration_top5: number;
  liquidity_score: number;
  complexity_score: number;
  holdings: Array<Holding & { valor: number }>;
  total: number;
  policyProfile: PolicyProfile;
}): Analytics['subscores'] {
  const { br_vs_exterior, concentration_top5, liquidity_score, complexity_score, holdings, total, policyProfile } = params;

  // 1. Global Diversification (0-100)
  // Meta: 10-25% exterior (dependendo do perfil)
  // Score baseado em quão próximo está da meta
  const targetExteriorMin = policyProfile.config.target_exterior_min;
  const targetExteriorMax = Math.max(targetExteriorMin + 10, 25); // Meta flexível
  const exteriorPct = br_vs_exterior.exterior;
  
  let global_diversification: number;
  if (exteriorPct >= targetExteriorMin && exteriorPct <= targetExteriorMax) {
    // Dentro da meta: score alto
    global_diversification = 100;
  } else if (exteriorPct < targetExteriorMin) {
    // Abaixo da meta: penalizar proporcionalmente
    global_diversification = Math.max(0, (exteriorPct / targetExteriorMin) * 60);
  } else {
    // Acima da meta: score médio (não é ideal, mas não é ruim)
    global_diversification = Math.max(60, 100 - ((exteriorPct - targetExteriorMax) * 2));
  }

  // 2. Concentration (0-100)
  // Meta: top5 < 45%
  // Score inverso: quanto menor a concentração, maior o score
  const concentrationTarget = 45;
  let concentration: number;
  if (concentration_top5 <= concentrationTarget) {
    concentration = 100;
  } else {
    // Penalizar: 45% = 100, 60% = 50, 80%+ = 0
    const excess = concentration_top5 - concentrationTarget;
    concentration = Math.max(0, 100 - (excess * 3.33)); // 3.33 = 100/30 (de 45 a 75)
  }

  // 3. Liquidity (0-100)
  // Meta: score ≥ 60
  // Score baseado em quão próximo está da meta
  const liquidityTarget = policyProfile.config.min_liquidity_high;
  let liquidity: number;
  if (liquidity_score >= liquidityTarget) {
    liquidity = 100;
  } else {
    // Penalizar proporcionalmente
    liquidity = Math.max(0, (liquidity_score / liquidityTarget) * 80);
  }

  // 4. Complexity (0-100)
  // Meta: fundos/previdência < X% (max_fundos_caixa_preta)
  // Score inverso: quanto menor a complexidade, maior o score
  const complexityTarget = policyProfile.config.max_fundos_caixa_preta;
  let complexity: number;
  if (complexity_score <= complexityTarget) {
    complexity = 100;
  } else {
    // Penalizar: excesso reduz score
    const excess = complexity_score - complexityTarget;
    complexity = Math.max(0, 100 - (excess * 2)); // Penalidade de 2 pontos por % acima
  }

  // 5. Cost Efficiency (0-100)
  // Heurístico baseado em buckets de custo
  // Assumir: ações/ETFs/FIIs = baixo custo, fundos = médio/alto, previdência = alto
  const lowCostTypes = ['Ação BR', 'ETF BR', 'FII', 'Exterior', 'RF Pós', 'RF IPCA'];
  const mediumCostTypes = ['Fundo'];
  const highCostTypes = ['Previdência'];
  
  let lowCostTotal = 0;
  let mediumCostTotal = 0;
  let highCostTotal = 0;
  
  holdings.forEach(h => {
    const valor = Number(h.valor);
    if (lowCostTypes.includes(h.tipo)) {
      lowCostTotal += valor;
    } else if (mediumCostTypes.includes(h.tipo)) {
      mediumCostTotal += valor;
    } else if (highCostTypes.includes(h.tipo)) {
      highCostTotal += valor;
    } else {
      // Outros: assumir baixo custo
      lowCostTotal += valor;
    }
  });

  const lowCostPct = (lowCostTotal / total) * 100;
  const mediumCostPct = (mediumCostTotal / total) * 100;
  const highCostPct = (highCostTotal / total) * 100;

  // Score: 100 se tudo baixo custo, reduz proporcionalmente
  const cost_efficiency = Math.max(0, 100 - (mediumCostPct * 0.5) - (highCostPct * 1.5));

  return {
    global_diversification: Math.round(global_diversification),
    concentration: Math.round(concentration),
    liquidity: Math.round(liquidity),
    complexity: Math.round(complexity),
    cost_efficiency: Math.round(cost_efficiency),
  };
}

