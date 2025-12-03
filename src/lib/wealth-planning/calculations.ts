// Módulo de cálculos financeiros para Wealth Planning
// Baseado em report_detailed.md - Implementação das fórmulas financeiras

import type {
  ScenarioData,
  NotRetiredResults,
  RetiredResults,
  YearlyProjection,
  CalculationResults,
  FamilyProtection,
} from "@/types/wealth-planning";

// ============================================================================
// FUNÇÕES FINANCEIRAS BÁSICAS
// ============================================================================

/**
 * Calcula taxa real a partir de taxa nominal e inflação
 * Fórmula: (1 + taxa_nominal) / (1 + inflação) - 1
 */
export function calculateRealRate(nominalRate: number, inflation: number): number {
  // Evitar divisão por zero ou valores inválidos
  if (!isFinite(inflation) || inflation === -1 || inflation < 0) {
    return nominalRate / 100; // Retornar taxa nominal como decimal
  }
  const nominalDecimal = nominalRate / 100;
  const inflationDecimal = inflation / 100;
  const realRate = (1 + nominalDecimal) / (1 + inflationDecimal) - 1;
  // Garantir que retorne um número válido
  return isFinite(realRate) ? realRate : nominalDecimal;
}

/**
 * Calcula Valor Futuro (FV) - Fórmula HP12C
 * Fórmula: FV = PV × (1 + i)^n + PMT × [((1 + i)^n - 1) / i]
 * 
 * Convenção de sinais HP12C:
 * - PV negativo = investimento inicial (saída de caixa)
 * - PMT negativo = aportes periódicos (saída de caixa)
 * - FV positivo = valor futuro (entrada de caixa)
 * 
 * @param rate Taxa de juros por período (decimal, ex: 0.0599 para 5.99%)
 * @param nper Número de períodos
 * @param pmt Pagamento por período (negativo para aportes/saídas)
 * @param pv Valor presente (negativo para investimento inicial/saída)
 * @returns Valor futuro (positivo)
 */
export function calculateFutureValue(
  rate: number,
  nper: number,
  pmt: number,
  pv: number
): number {
  if (nper <= 0) return Math.abs(pv);
  
  if (rate === 0 || Math.abs(rate) < 1e-10) {
    // Sem juros: FV = PV + PMT × n
    return Math.abs(-pv - pmt * nper);
  }
  
  const factor = Math.pow(1 + rate, nper);
  // FV = PV × (1+i)^n + PMT × [((1+i)^n - 1) / i]
  // Como PV e PMT são negativos (saídas), FV será positivo
  const fv = -pv * factor - pmt * ((factor - 1) / rate);
  return Math.max(0, fv); // Garantir valor não negativo
}

/**
 * Calcula Valor Presente (PV) de uma anuidade - Fórmula HP12C
 * Fórmula: PV = PMT × [(1 - (1 + i)^-n) / i] + FV × (1 + i)^-n
 * 
 * Convenção de sinais HP12C:
 * - PMT negativo = saques periódicos (saída de caixa)
 * - FV positivo = valor futuro desejado (entrada de caixa)
 * - PV negativo = capital necessário (saída de caixa inicial)
 * 
 * @param rate Taxa de juros por período (decimal)
 * @param nper Número de períodos
 * @param pmt Pagamento por período (negativo para saques/saídas)
 * @param fv Valor futuro desejado (positivo, padrão 0)
 * @returns Valor presente necessário (positivo)
 */
export function calculatePresentValue(
  rate: number,
  nper: number,
  pmt: number,
  fv: number = 0
): number {
  if (nper <= 0) return Math.abs(pmt * nper + fv);
  
  if (rate === 0 || Math.abs(rate) < 1e-10) {
    // Sem juros: PV = PMT × n + FV
    return Math.abs(-pmt * nper - fv);
  }
  
  const discountFactor = Math.pow(1 + rate, -nper);
  // PV = PMT × [(1 - (1+i)^-n) / i] + FV × (1+i)^-n
  // Como PMT é negativo (saques), PV será positivo (capital necessário)
  const pv = -pmt * ((1 - discountFactor) / rate) - fv * discountFactor;
  return Math.max(0, pv); // Garantir valor não negativo
}

/**
 * Calcula Pagamento (PMT) necessário - Fórmula HP12C
 * Fórmula: PMT = [PV × i × (1 + i)^n + FV × i] / [(1 + i)^n - 1]
 * 
 * Convenção de sinais HP12C:
 * - PV negativo = investimento inicial (saída)
 * - FV positivo = valor futuro desejado (entrada)
 * - PMT negativo = aporte periódico necessário (saída)
 * 
 * @param rate Taxa de juros por período (decimal)
 * @param nper Número de períodos
 * @param pv Valor presente (negativo para investimento inicial)
 * @param fv Valor futuro desejado (positivo, padrão 0)
 * @returns Pagamento periódico necessário (negativo para aportes)
 */
export function calculatePayment(
  rate: number,
  nper: number,
  pv: number,
  fv: number = 0
): number {
  if (nper <= 0) return 0;
  
  if (rate === 0 || Math.abs(rate) < 1e-10) {
    // Sem juros: PMT = (PV + FV) / n
    return -(pv + fv) / nper;
  }
  
  const factor = Math.pow(1 + rate, nper);
  // PMT = [PV × i × (1+i)^n + FV × i] / [(1+i)^n - 1]
  // Como PV é negativo, PMT será negativo (aporte necessário)
  const pmt = -(pv * rate * factor + fv * rate) / (factor - 1);
  return pmt;
}

/**
 * Calcula taxa necessária usando método de Newton-Raphson
 * Resolve: FV(rate, nper, pmt, pv) = targetFV
 */
export function calculateRequiredRate(
  nper: number,
  pmt: number,
  pv: number,
  targetFV: number,
  initialGuess: number = 0.05,
  maxIterations: number = 100,
  tolerance: number = 1e-6
): number | null {
  let rate = initialGuess;
  
  for (let i = 0; i < maxIterations; i++) {
    const fv = calculateFutureValue(rate, nper, pmt, pv);
    const error = fv - targetFV;
    
    if (Math.abs(error) < tolerance) {
      return rate;
    }
    
    // Derivada numérica para Newton-Raphson
    const h = 1e-8;
    const fvPlus = calculateFutureValue(rate + h, nper, pmt, pv);
    const derivative = (fvPlus - fv) / h;
    
    if (Math.abs(derivative) < 1e-10) {
      break; // Derivada muito pequena, não converge
    }
    
    rate = rate - error / derivative;
    
    // Limitar taxa entre -0.99 e 10 (evitar valores absurdos)
    rate = Math.max(-0.99, Math.min(10, rate));
  }
  
  return null; // Não convergiu
}

// ============================================================================
// CÁLCULOS PARA NÃO APOSENTADO
// ============================================================================

/**
 * Calcula capital necessário para viver de renda (Cenário 2)
 * Fórmula: Capital = Renda anual desejada / Taxa real
 * Alternativa: Regra dos 4% - Capital = Renda anual desejada / 0.04
 */
export function calculateMaintenanceCapital(
  desiredAnnualIncome: number,
  realRate: number
): number {
  if (realRate <= 0) {
    // Se taxa real for zero ou negativa, usar regra dos 4%
    return desiredAnnualIncome / 0.04;
  }
  return desiredAnnualIncome / realRate;
}

/**
 * Calcula aporte mensal necessário para atingir objetivo
 * Usa fórmula PMT da HP12C com conversão anual → mensal
 * 
 * @param objetivoAposentadoria Valor que se deseja acumular (R$)
 * @param patrimonioAtual Valor já investido atualmente (R$)
 * @param anosAteAposentar Tempo em anos até a aposentadoria
 * @param retornoAnual Retorno anual médio esperado (ex: 0.097 para 9.7%)
 * @returns Aporte mensal necessário (R$)
 */
export function calculateRequiredMonthlyContribution(
  objetivoAposentadoria: number,
  patrimonioAtual: number,
  anosAteAposentar: number,
  retornoAnual: number
): number {
  if (anosAteAposentar <= 0) return 0;
  if (objetivoAposentadoria <= patrimonioAtual) return 0;
  
  // Converter taxa anual para mensal: (1 + i_anual)^(1/12) - 1
  const taxaMensal = Math.pow(1 + retornoAnual, 1/12) - 1;
  const periodosMensais = anosAteAposentar * 12;
  
  // Usar fórmula PMT: PMT = [PV × i × (1+i)^n + FV × i] / [(1+i)^n - 1]
  // PV negativo (patrimônio atual investido), FV positivo (objetivo)
  const pmtMensal = calculatePayment(
    taxaMensal,
    periodosMensais,
    -patrimonioAtual, // PV negativo (investimento inicial)
    objetivoAposentadoria // FV positivo (objetivo)
  );
  
  // PMT retorna negativo (aporte), converter para positivo
  return Math.max(0, -pmtMensal);
}

/**
 * Calcula capital necessário usando regra dos 4%
 * Para gerar R$ X anuais, são necessários aproximadamente R$ X / 0.04
 * 
 * @param desiredAnnualIncome Renda anual desejada
 * @returns Capital necessário usando regra dos 4%
 */
export function calculateCapitalUsing4PercentRule(desiredAnnualIncome: number): number {
  return desiredAnnualIncome / 0.04;
}

/**
 * Calcula capital necessário consumindo patrimônio (Cenário 3)
 * Usa PV de anuidade
 */
export function calculateConsumptionCapital(
  desiredAnnualIncome: number,
  realRate: number,
  yearsInRetirement: number
): number {
  return calculatePresentValue(realRate, yearsInRetirement, -desiredAnnualIncome, 0);
}

/**
 * Projeta patrimônio ano a ano
 */
function projectYearly(
  initialCapital: number,
  realRate: number,
  annualContribution: number,
  retirementAge: number,
  lifeExpectancy: number,
  currentAge: number,
  desiredAnnualIncome: number,
  expectedAnnualRevenues: number
): YearlyProjection[] {
  const projections: YearlyProjection[] = [];
  let capital = initialCapital;
  
  const extraIncomeNeeded = desiredAnnualIncome - expectedAnnualRevenues;
  
  for (let age = currentAge; age <= lifeExpectancy; age++) {
    if (age <= retirementAge) {
      // Antes da aposentadoria: acumula
      capital = capital * (1 + realRate) + annualContribution;
    } else {
      // Depois da aposentadoria: retira renda
      capital = capital * (1 + realRate) - extraIncomeNeeded;
      // Garantir que capital não fique negativo
      if (capital < 0) capital = 0;
    }
    
    // Garantir que o valor seja um número válido
    const validCapital = typeof capital === 'number' && !isNaN(capital) && isFinite(capital) 
      ? Math.max(0, capital) 
      : 0;
    
    projections.push({
      age,
      currentScenario: validCapital,
      maintenanceScenario: 0, // Será calculado separadamente
      consumptionScenario: 0, // Será calculado separadamente
    });
  }
  
  return projections;
}

/**
 * Calcula todos os cenários para não aposentado
 */
export function calculateNotRetired(
  data: ScenarioData
): NotRetiredResults {
  const {
    personalData,
    financialData,
    portfolio,
    assumptions,
  } = data;
  
  // Converter valores mensais para anuais
  const annualSavings = financialData.monthlySavings * 12;
  const desiredAnnualIncome = financialData.desiredMonthlyRetirementIncome * 12;
  const expectedAnnualRevenues = financialData.expectedMonthlyRetirementRevenues * 12;
  
  // Calcular taxa real atual
  // cdiRate já está em decimal (ex: 0.097 para 9.7%), annualCDI está em percentual (ex: 9.7)
  const currentNominalRateDecimal = portfolio.assets[0]?.cdiRate || assumptions.annualCDI / 100;
  const currentNominalRatePercent = currentNominalRateDecimal * 100; // Converter para percentual para calculateRealRate
  const realRateCurrent = calculateRealRate(
    currentNominalRatePercent,
    assumptions.annualInflation
  );
  
  const realRateRetirement = assumptions.retirementRealRate / 100;
  
  // Capital inicial (total da carteira)
  const initialCapital = portfolio.total;
  
  // Anos até aposentadoria
  const yearsToRetirement = personalData.retirementAge - personalData.age;
  
  // Anos na aposentadoria
  const yearsInRetirement = personalData.lifeExpectancy - personalData.retirementAge;
  
  // ========================================================================
  // CENÁRIO 1: Projeção atual
  // ========================================================================
  
  // FV com PV negativo (capital inicial) e PMT negativo (aportes anuais)
  const projectedCapital = calculateFutureValue(
    realRateCurrent,
    yearsToRetirement,
    -annualSavings, // PMT negativo (aportes são saídas)
    -initialCapital // PV negativo (investimento inicial é saída)
  );
  
  const extraIncomeNeeded = desiredAnnualIncome - expectedAnnualRevenues;
  const requiredCapitalMaintenance = calculateMaintenanceCapital(
    extraIncomeNeeded,
    realRateRetirement
  );
  const requiredCapitalConsumption = calculateConsumptionCapital(
    extraIncomeNeeded,
    realRateRetirement,
    yearsInRetirement
  );
  
  // Projeção ano a ano - Cenário 1
  const yearlyProjections = projectYearly(
    initialCapital,
    realRateCurrent,
    annualSavings,
    personalData.retirementAge,
    personalData.lifeExpectancy,
    personalData.age,
    desiredAnnualIncome,
    expectedAnnualRevenues
  );
  
  // ========================================================================
  // CENÁRIO 2: Manutenção do patrimônio
  // ========================================================================
  
  // Calcular PMT necessário para atingir capital de manutenção
  // PMT retorna negativo (aporte necessário), converter para positivo depois
  const requiredPMTMaintenance = calculatePayment(
    realRateCurrent,
    yearsToRetirement,
    -initialCapital, // PV negativo (investimento inicial)
    requiredCapitalMaintenance // FV positivo (objetivo)
  );
  
  // Projeção ano a ano - Cenário 2
  const maintenanceProjections = projectYearly(
    initialCapital,
    realRateCurrent,
    Math.abs(requiredPMTMaintenance), // Aporte anual positivo
    personalData.retirementAge,
    personalData.lifeExpectancy,
    personalData.age,
    desiredAnnualIncome,
    expectedAnnualRevenues
  );
  
  // ========================================================================
  // CENÁRIO 3: Consumo do patrimônio
  // ========================================================================
  
  // Calcular PMT necessário para atingir capital de consumo
  // PMT retorna negativo (aporte necessário), converter para positivo depois
  const requiredPMTConsumption = calculatePayment(
    realRateCurrent,
    yearsToRetirement,
    -initialCapital, // PV negativo (investimento inicial)
    requiredCapitalConsumption // FV positivo (objetivo)
  );
  
  // Projeção ano a ano - Cenário 3
  const consumptionProjections = projectYearly(
    initialCapital,
    realRateCurrent,
    Math.abs(requiredPMTConsumption), // Aporte anual positivo
    personalData.retirementAge,
    personalData.lifeExpectancy,
    personalData.age,
    desiredAnnualIncome,
    expectedAnnualRevenues
  );
  
  // Combinar projeções
  const combinedProjections: YearlyProjection[] = yearlyProjections.map((proj, idx) => {
    const maintenanceVal = maintenanceProjections[idx]?.currentScenario;
    const consumptionVal = consumptionProjections[idx]?.currentScenario;
    
    return {
      ...proj,
      maintenanceScenario: typeof maintenanceVal === 'number' && !isNaN(maintenanceVal) && isFinite(maintenanceVal) 
        ? Math.max(0, maintenanceVal) 
        : 0,
      consumptionScenario: typeof consumptionVal === 'number' && !isNaN(consumptionVal) && isFinite(consumptionVal)
        ? Math.max(0, consumptionVal)
        : 0,
    };
  });
  
  // ========================================================================
  // CALCULAR RENTABILIDADES NECESSÁRIAS PARA CADA CENÁRIO
  // ========================================================================
  
  // Cenário 1: Rentabilidade necessária para atingir capital de manutenção
  // PMT e PV negativos (aportes e investimento inicial são saídas)
  const requiredRateCurrent = calculateRequiredRate(
    yearsToRetirement,
    -annualSavings, // PMT negativo (aportes)
    -initialCapital, // PV negativo (investimento inicial)
    requiredCapitalMaintenance // FV positivo (objetivo)
  );
  
  const requiredRealRateCurrent = requiredRateCurrent
    ? calculateRealRate(requiredRateCurrent * 100, assumptions.annualInflation) * 100
    : undefined;
  
  // Cenário 2: Rentabilidade necessária para manutenção (viver de renda)
  // PMT retorna negativo, usar valor absoluto
  const requiredRateMaintenance = Math.abs(requiredPMTMaintenance) > 0
    ? calculateRequiredRate(
        yearsToRetirement,
        requiredPMTMaintenance, // Já é negativo (aporte necessário)
        -initialCapital, // PV negativo (investimento inicial)
        requiredCapitalMaintenance // FV positivo (objetivo)
      )
    : null;
  
  const requiredRealRateMaintenance = requiredRateMaintenance
    ? calculateRealRate(requiredRateMaintenance * 100, assumptions.annualInflation) * 100
    : undefined;
  
  // Cenário 3: Rentabilidade necessária para consumo
  // PMT retorna negativo, usar valor absoluto
  const requiredRateConsumption = Math.abs(requiredPMTConsumption) > 0
    ? calculateRequiredRate(
        yearsToRetirement,
        requiredPMTConsumption, // Já é negativo (aporte necessário)
        -initialCapital, // PV negativo (investimento inicial)
        requiredCapitalConsumption // FV positivo (objetivo)
      )
    : null;
  
  const requiredRealRateConsumption = requiredRateConsumption
    ? calculateRealRate(requiredRateConsumption * 100, assumptions.annualInflation) * 100
    : undefined;
  
  // ========================================================================
  // TERMÔMETRO FINANCEIRO (0-10)
  // Baseado na relação entre capital projetado e capital necessário
  // ========================================================================
  
  let financialThermometer = 0;
  if (projectedCapital >= requiredCapitalMaintenance) {
    // >= 10: Em linha para viver de renda
    financialThermometer = 10;
  } else if (projectedCapital >= requiredCapitalConsumption) {
    // 7-9: Em linha para manter padrão de vida desejado
    const ratio = (projectedCapital - requiredCapitalConsumption) / 
                  (requiredCapitalMaintenance - requiredCapitalConsumption);
    financialThermometer = 7 + ratio * 3; // Entre 7 e 10
  } else {
    // 0-6: Atenção, padrão de vida ameaçado
    const ratio = projectedCapital / requiredCapitalConsumption;
    financialThermometer = ratio * 7; // Entre 0 e 7
  }
  financialThermometer = Math.max(0, Math.min(10, financialThermometer));
  
  // ========================================================================
  // VALIDAR PERFIL DE RISCO
  // ========================================================================
  
  const suitabilityLimits: Record<string, number> = {
    Conservador: 0.06,
    Moderado: 0.08,
    "Moderado-Agressivo": 0.10,
    Agressivo: 0.15,
  };
  
  const maxRequiredRate = Math.max(
    requiredRateCurrent || 0,
    requiredRateMaintenance || 0,
    requiredRateConsumption || 0
  );
  
  const withinRiskProfile =
    maxRequiredRate <= (suitabilityLimits[personalData.suitability] || 1.0);
  
  // ========================================================================
  // GERAR ALERTAS
  // ========================================================================
  
  const warnings: string[] = [];
  if (projectedCapital < requiredCapitalConsumption) {
    warnings.push(
      "O capital projetado é insuficiente. Considere aumentar a poupança ou adiar a aposentadoria."
    );
  }
  if (!withinRiskProfile) {
    warnings.push(
      `A rentabilidade necessária (${(maxRequiredRate * 100).toFixed(2)}%) está acima do perfil de risco ${personalData.suitability}.`
    );
  }
  if (financialThermometer < 7) {
    warnings.push(
      "Atenção: O padrão de vida desejado pode estar ameaçado. Considere ajustar suas metas."
    );
  }
  
  return {
    currentScenario: {
      annualSavings,
      retirementAge: personalData.retirementAge,
      projectedCapital,
      requiredCapital: requiredCapitalMaintenance,
      requiredRate: requiredRateCurrent ? requiredRateCurrent * 100 : undefined,
      requiredRealRate: requiredRealRateCurrent,
      accumulatedCapital: projectedCapital, // Capital acumulado na aposentadoria
      withinProfile: withinRiskProfile && (requiredRateCurrent || 0) <= (suitabilityLimits[personalData.suitability] || 1.0),
    },
    maintenanceScenario: {
      requiredCapital: requiredCapitalMaintenance,
      annualSavings: Math.abs(requiredPMTMaintenance), // Converter para positivo
      retirementAge: personalData.retirementAge,
      requiredRate: requiredRateMaintenance ? requiredRateMaintenance * 100 : undefined,
      requiredRealRate: requiredRealRateMaintenance,
      accumulatedCapital: requiredCapitalMaintenance,
      withinProfile: withinRiskProfile && (requiredRateMaintenance || 0) <= (suitabilityLimits[personalData.suitability] || 1.0),
    },
    consumptionScenario: {
      requiredCapital: requiredCapitalConsumption,
      annualSavings: Math.abs(requiredPMTConsumption), // Converter para positivo
      retirementAge: personalData.retirementAge,
      requiredRate: requiredRateConsumption ? requiredRateConsumption * 100 : undefined,
      requiredRealRate: requiredRealRateConsumption,
      accumulatedCapital: requiredCapitalConsumption,
      withinProfile: withinRiskProfile && (requiredRateConsumption || 0) <= (suitabilityLimits[personalData.suitability] || 1.0),
    },
    yearlyProjections: combinedProjections,
    withinRiskProfile,
    financialThermometer,
    warnings,
  };
}

// ============================================================================
// CÁLCULOS PARA APOSENTADO
// ============================================================================

/**
 * Calcula projeção para aposentado
 */
export function calculateRetired(
  data: ScenarioData,
  financialCapital: number,
  nonFinancialCapital: number = 0
): RetiredResults {
  const {
    personalData,
    financialData,
    assumptions,
  } = data;
  
  const desiredAnnualIncome = financialData.desiredMonthlyRetirementIncome * 12;
  const expectedAnnualRevenues = financialData.expectedMonthlyRetirementRevenues * 12;
  const extraIncomeNeeded = desiredAnnualIncome - expectedAnnualRevenues;
  
  const realRateCurrent = assumptions.retirementRealRate / 100;
  
  // Simular diferentes carteiras
  const lifetimeIncomeRate = realRateCurrent * 0.9; // Renda vitalícia (um pouco menor)
  const consumptionRate = realRateCurrent * 0.8; // Consumo (mais conservador)
  const totalConsumptionRate = realRateCurrent * 0.75; // Total (mais conservador ainda)
  
  function simulatePortfolio(
    initialCapital: number,
    rate: number,
    years: number,
    currentAge: number
  ): Array<{ age: number; balance: number }> {
    const projections: Array<{ age: number; balance: number }> = [];
    let capital = initialCapital;
    
    for (let age = currentAge; age <= personalData.lifeExpectancy && capital > 0; age++) {
      capital = capital * (1 + rate) - extraIncomeNeeded;
      projections.push({ age, balance: Math.max(0, capital) });
      
      if (capital <= 0) break;
    }
    
    return projections;
  }
  
  const years = personalData.lifeExpectancy - personalData.age;
  
  // Carteira atual
  const currentProjections = simulatePortfolio(
    financialCapital,
    realRateCurrent,
    years,
    personalData.age
  );
  
  // Carteira renda vitalícia
  const lifetimeProjections = simulatePortfolio(
    financialCapital,
    lifetimeIncomeRate,
    years,
    personalData.age
  );
  
  // Carteira consumo financeiro
  const financialConsumptionProjections = simulatePortfolio(
    financialCapital,
    consumptionRate,
    years,
    personalData.age
  );
  
  // Carteira consumo total
  const totalConsumptionProjections = simulatePortfolio(
    financialCapital + nonFinancialCapital,
    totalConsumptionRate,
    years,
    personalData.age
  );
  
  function getAverageReturn(projections: Array<{ age: number; balance: number }>, rate: number): number {
    if (projections.length === 0) return 0;
    const avgCapital = projections.reduce((sum, p) => sum + p.balance, 0) / projections.length;
    return avgCapital * rate;
  }
  
  function getSurvivalAge(projections: Array<{ age: number; balance: number }>): number {
    // Encontrar o último elemento com balance > 0
    let lastPositive: { age: number; balance: number } | undefined;
    for (let i = projections.length - 1; i >= 0; i--) {
      if (projections[i].balance > 0) {
        lastPositive = projections[i];
        break;
      }
    }
    return lastPositive?.age || personalData.age;
  }
  
  return {
    currentPortfolio: {
      initialCapital: financialCapital,
      averageAnnualReturn: getAverageReturn(currentProjections, realRateCurrent),
      survivalAge: getSurvivalAge(currentProjections),
      yearlyProjections: currentProjections,
    },
    lifetimeIncomePortfolio: {
      initialCapital: financialCapital,
      averageAnnualReturn: getAverageReturn(lifetimeProjections, lifetimeIncomeRate),
      survivalAge: getSurvivalAge(lifetimeProjections),
      yearlyProjections: lifetimeProjections,
    },
    financialConsumptionPortfolio: {
      initialCapital: financialCapital,
      averageAnnualReturn: getAverageReturn(financialConsumptionProjections, consumptionRate),
      survivalAge: getSurvivalAge(financialConsumptionProjections),
      yearlyProjections: financialConsumptionProjections,
    },
    totalConsumptionPortfolio: {
      initialCapital: financialCapital + nonFinancialCapital,
      averageAnnualReturn: getAverageReturn(totalConsumptionProjections, totalConsumptionRate),
      survivalAge: getSurvivalAge(totalConsumptionProjections),
      yearlyProjections: totalConsumptionProjections,
    },
  };
}

// ============================================================================
// PROTEÇÃO FAMILIAR
// ============================================================================

/**
 * Calcula necessidade de proteção familiar
 */
export function calculateFamilyProtection(data: ScenarioData): FamilyProtection {
  const {
    financialData,
    assumptions,
    debts,
  } = data;
  
  const annualExpenses = financialData.monthlyFamilyExpense * 12;
  const realRate = assumptions.retirementRealRate / 100;
  
  // Capital para aposentadoria (simplificado)
  const retirementCapital = annualExpenses / realRate;
  
  // Valor presente das receitas futuras (simplificado)
  const futureRevenuesPV = 0; // Pode ser calculado com base em outras receitas
  
  // Necessidade de proteção imediata
  const immediateProtection = retirementCapital - futureRevenuesPV;
  
  // Liquidez para sucessão (12% sobre patrimônio total)
  const totalAssets = data.portfolio.total + data.assets.total;
  const successionLiquidity = totalAssets * 0.12;
  
  // Total de proteção
  const totalProtection = immediateProtection + successionLiquidity;
  
  // Adicionar dívidas sem seguro
  const debtsWithoutInsurance = debts.items
    .filter((d) => !d.hasLifeInsurance)
    .reduce((sum, d) => sum + d.balance, 0);
  
  return {
    immediateProtection: immediateProtection + debtsWithoutInsurance,
    successionLiquidity,
    totalProtection: totalProtection + debtsWithoutInsurance,
    futureRevenuesPV,
    annualExpenses,
  };
}

// ============================================================================
// CÁLCULO COMPLETO
// ============================================================================

/**
 * Executa todos os cálculos para um cenário
 */
export function calculateScenario(data: ScenarioData): CalculationResults {
  const results: CalculationResults = {
    calculatedAt: new Date(),
  };
  
  // Determinar se é aposentado ou não
  const isRetired = data.personalData.age >= data.personalData.retirementAge;
  
  if (!isRetired) {
    // Cálculos para não aposentado
    results.notRetired = calculateNotRetired(data);
  } else {
    // Cálculos para aposentado
    const financialCapital = data.portfolio.total;
    const nonFinancialCapital = data.assets.items
      .filter((a) => a.sellable)
      .reduce((sum, a) => sum + a.value, 0);
    
    results.retired = calculateRetired(data, financialCapital, nonFinancialCapital);
  }
  
  // Proteção familiar (sempre calcula)
  results.familyProtection = calculateFamilyProtection(data);
  
  // Cálculos de projetos
  if (data.projects.items.length > 0) {
    const realRate = calculateRealRate(
      data.assumptions.annualCDI,
      data.assumptions.annualInflation
    );
    
    const projectCalculations = data.projects.items.map((project) => {
      const requiredPMT = calculatePayment(realRate, project.deadline, 0, project.amount);
      return {
        projectName: project.name,
        currentPMT: -requiredPMT,
      };
    });
    
    results.projects = {
      items: projectCalculations,
      totalCurrentPMT: projectCalculations.reduce((sum, p) => sum + p.currentPMT, 0),
    };
  }
  
  return results;
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata percentual
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

