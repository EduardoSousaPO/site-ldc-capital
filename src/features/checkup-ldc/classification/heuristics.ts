// Classification Heuristics - Sugestão automática de tipos

import type { HoldingType, RawHolding } from '../types';

/**
 * Sugere tipo de holding baseado em heurísticas
 */
export function suggestHoldingType(holding: RawHolding): HoldingType {
  const nome = (holding.nome_ou_codigo || '').toUpperCase();
  
  // FII - Ticker termina com 11
  if (nome.match(/\d{4}11$/)) {
    return 'FII';
  }

  // ETF - Contém "ETF" no nome
  if (nome.includes('ETF') || nome.includes('BOVA') || nome.includes('SMAL') || nome.includes('IVVB')) {
    return 'ETF BR';
  }

  // Tesouro/Renda Fixa
  if (nome.includes('TESOURO') || nome.includes('NTN') || nome.includes('LTN') || nome.includes('LFT')) {
    if (nome.includes('IPCA') || nome.includes('NTN-B')) {
      return 'RF IPCA';
    }
    return 'RF Pós';
  }

  // Previdência
  if (nome.includes('PREVID') || nome.includes('VGBL') || nome.includes('PGBL')) {
    return 'Previdência';
  }

  // Fundos
  if (nome.includes('FUNDO') || nome.includes('FIA') || nome.includes('FIC') || nome.includes('FIM')) {
    return 'Fundo';
  }

  // Exterior - Tickers comuns ou menções
  if (nome.includes('SPY') || nome.includes('QQQ') || nome.includes('VTI') || 
      nome.includes('AAPL') || nome.includes('MSFT') || nome.includes('GOOGL') ||
      nome.includes('EXTERIOR') || nome.includes('INTERNACIONAL') || nome.includes('GLOBAL')) {
    return 'Exterior';
  }

  // Caixa
  if (nome.includes('CAIXA') || nome.includes('CDB') || nome.includes('LCI') || nome.includes('LCA') ||
      nome.includes('POUPANÇA') || nome.includes('POUPANCA')) {
    return 'Caixa';
  }

  // Ação BR - Ticker de 4 letras (padrão B3)
  if (nome.match(/^[A-Z]{4}\d{1,2}$/)) {
    return 'Ação BR';
  }

  // Default
  return 'Outros';
}

/**
 * Aplica tipo a todos os holdings similares (busca por substring)
 */
export function applyTypeToSimilar(
  holdings: Array<RawHolding & { tipo?: HoldingType }>,
  pattern: string,
  type: HoldingType
): Array<RawHolding & { tipo: HoldingType }> {
  const upperPattern = pattern.toUpperCase();
  
  return holdings.map(holding => {
    const nome = (holding.nome_ou_codigo || '').toUpperCase();
    if (nome.includes(upperPattern)) {
      return { ...holding, tipo: type };
    }
    return { ...holding, tipo: (holding.tipo || type) as HoldingType };
  }) as Array<RawHolding & { tipo: HoldingType }>;
}

