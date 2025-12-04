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
  // Validações de entrada
  if (!isFinite(rate) || !isFinite(nper) || !isFinite(pmt) || !isFinite(pv)) {
    console.warn('calculateFutureValue: Valores não finitos detectados', { rate, nper, pmt, pv });
    return 0;
  }
  
  if (nper <= 0) return Math.max(0, Math.abs(pv));
  
  // Limitar taxa a valores razoáveis (evitar overflow)
  const maxRate = 1.0; // 100% ao ano é o máximo razoável
  const limitedRate = Math.max(-0.99, Math.min(maxRate, rate));
  
  // Limitar número de períodos (evitar overflow)
  const maxPeriods = 100; // Máximo 100 anos
  const limitedNper = Math.max(0, Math.min(maxPeriods, nper));
  
  if (limitedRate === 0 || Math.abs(limitedRate) < 1e-10) {
    // Sem juros: FV = PV + PMT × n
    const fv = Math.abs(-pv - pmt * limitedNper);
    return Math.min(fv, 1e15); // Limitar a 1 quatrilhão (valor máximo razoável)
  }
  
  // Verificar se o fator exponencial vai causar overflow
  const maxFactor = 1e10; // Limite para evitar overflow
  const logFactor = limitedNper * Math.log(1 + limitedRate);
  
  if (logFactor > Math.log(maxFactor)) {
    console.warn('calculateFutureValue: Fator exponencial muito alto, limitando cálculo', {
      rate: limitedRate,
      nper: limitedNper,
      logFactor
    });
    // Retornar um valor máximo razoável baseado em extrapolação linear
    const safeNper = Math.floor(Math.log(maxFactor) / Math.log(1 + limitedRate));
    const safeFactor = Math.pow(1 + limitedRate, safeNper);
    const fv = -pv * safeFactor * Math.pow(1 + limitedRate, limitedNper - safeNper) - pmt * ((safeFactor - 1) / limitedRate);
    return Math.min(Math.max(0, fv), 1e15); // Limitar a 1 quatrilhão
  }
  
  const factor = Math.pow(1 + limitedRate, limitedNper);
  
  // Verificar se o fator é válido
  if (!isFinite(factor) || factor > maxFactor) {
    console.warn('calculateFutureValue: Fator calculado inválido ou muito alto', { factor, rate: limitedRate, nper: limitedNper });
    return Math.min(Math.abs(-pv) + Math.abs(pmt) * limitedNper * 2, 1e15); // Estimativa conservadora
  }
  
  // FV = PV × (1+i)^n + PMT × [((1+i)^n - 1) / i]
  // Como PV e PMT são negativos (saídas), FV será positivo
  const fv = -pv * factor - pmt * ((factor - 1) / limitedRate);
  
  // Validar resultado
  if (!isFinite(fv) || fv < 0) {
    console.warn('calculateFutureValue: Resultado inválido', { fv, rate: limitedRate, nper: limitedNper, pv, pmt });
    return Math.min(Math.abs(-pv) + Math.abs(pmt) * limitedNper, 1e15);
  }
  
  // Limitar valor máximo razoável (1 quatrilhão de reais)
  const maxReasonableValue = 1e15;
  return Math.min(Math.max(0, fv), maxReasonableValue);
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
  
  // Validações de entrada
  if (!isFinite(initialCapital) || !isFinite(realRate) || !isFinite(annualContribution)) {
    console.warn('projectYearly: Valores de entrada inválidos', {
      initialCapital,
      realRate,
      annualContribution
    });
    // Retornar projeção vazia ou com valores zerados
    for (let age = currentAge; age <= lifeExpectancy; age++) {
      projections.push({
        age,
        currentScenario: 0,
        maintenanceScenario: 0,
        consumptionScenario: 0,
      });
    }
    return projections;
  }
  
  // Limitar taxa a valores razoáveis
  const maxRate = 1.0; // 100% ao ano máximo
  const limitedRate = Math.max(-0.99, Math.min(maxRate, realRate));
  
  // Limitar capital inicial e contribuição
  const maxInitialCapital = 1e12; // 1 trilhão máximo
  const maxAnnualContribution = 1e9; // 1 bilhão máximo por ano
  let capital = Math.min(Math.max(0, initialCapital), maxInitialCapital);
  const limitedContribution = Math.min(Math.max(-maxAnnualContribution, annualContribution), maxAnnualContribution);
  
  const extraIncomeNeeded = desiredAnnualIncome - expectedAnnualRevenues;
  const maxReasonableValue = 1e15; // 1 quatrilhão máximo
  
  for (let age = currentAge; age <= lifeExpectancy; age++) {
    if (age <= retirementAge) {
      // Antes da aposentadoria: acumula
      // Verificar se vai causar overflow antes de calcular
      const nextCapital = capital * (1 + limitedRate) + limitedContribution;
      
      if (!isFinite(nextCapital) || nextCapital > maxReasonableValue) {
        // Se ultrapassar o limite, usar extrapolação linear conservadora
        capital = Math.min(capital * 1.1 + limitedContribution, maxReasonableValue);
        console.warn(`projectYearly: Limite atingido na idade ${age}`, { capital: nextCapital });
      } else {
        capital = nextCapital;
      }
    } else {
      // Depois da aposentadoria: retira renda
      const nextCapital = capital * (1 + limitedRate) - extraIncomeNeeded;
      
      if (!isFinite(nextCapital)) {
        capital = 0;
      } else if (nextCapital < 0) {
        capital = 0;
      } else if (nextCapital > maxReasonableValue) {
        capital = maxReasonableValue;
        console.warn(`projectYearly: Limite atingido na idade ${age} (aposentadoria)`, { capital: nextCapital });
      } else {
        capital = nextCapital;
      }
    }
    
    // Garantir que o valor seja um número válido e dentro de limites razoáveis
    const validCapital = typeof capital === 'number' && !isNaN(capital) && isFinite(capital) 
      ? Math.max(0, Math.min(capital, maxReasonableValue))
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
  
  // Validar valores antes de calcular
  if (!isFinite(realRateCurrent) || !isFinite(yearsToRetirement) || !isFinite(annualSavings) || !isFinite(initialCapital)) {
    console.error('calculateNotRetired: Valores inválidos detectados', {
      realRateCurrent,
      yearsToRetirement,
      annualSavings,
      initialCapital
    });
    // Retornar valores padrão seguros
    return {
      currentScenario: {
        annualSavings: 0,
        retirementAge: personalData.retirementAge,
        projectedCapital: initialCapital || 0,
        requiredCapital: 0,
        requiredRate: undefined,
        requiredRealRate: undefined,
        accumulatedCapital: initialCapital || 0,
        withinProfile: false,
      },
      maintenanceScenario: {
        requiredCapital: 0,
        annualSavings: 0,
        retirementAge: personalData.retirementAge,
        requiredRate: undefined,
        requiredRealRate: undefined,
        accumulatedCapital: 0,
        withinProfile: false,
      },
      consumptionScenario: {
        requiredCapital: 0,
        annualSavings: 0,
        retirementAge: personalData.retirementAge,
        requiredRate: undefined,
        requiredRealRate: undefined,
        accumulatedCapital: 0,
        withinProfile: false,
      },
      yearlyProjections: [],
      withinRiskProfile: false,
      financialThermometer: 0,
      warnings: ['Erro nos cálculos: valores de entrada inválidos.'],
    };
  }
  
  // FV com PV negativo (capital inicial) e PMT negativo (aportes anuais)
  const projectedCapital = calculateFutureValue(
    realRateCurrent,
    yearsToRetirement,
    -annualSavings, // PMT negativo (aportes são saídas)
    -initialCapital // PV negativo (investimento inicial é saída)
  );
  
  // Validar resultado do capital projetado
  if (!isFinite(projectedCapital) || projectedCapital < 0) {
    console.error('calculateNotRetired: Capital projetado inválido', { projectedCapital });
  }
  
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
  
  // Função auxiliar para validar e limitar valores monetários
  const validateMonetaryValue = (value: number, defaultValue: number = 0): number => {
    if (!isFinite(value) || value < 0 || value > 1e15) {
      console.warn('Valor monetário inválido ou muito alto, usando valor padrão', { value, defaultValue });
      return defaultValue;
    }
    return value;
  };
  
  // Validar e limitar todos os valores monetários
  const safeProjectedCapital = validateMonetaryValue(projectedCapital, initialCapital);
  const safeRequiredCapitalMaintenance = validateMonetaryValue(requiredCapitalMaintenance);
  const safeRequiredCapitalConsumption = validateMonetaryValue(requiredCapitalConsumption);
  const safeRequiredPMTMaintenance = validateMonetaryValue(Math.abs(requiredPMTMaintenance), 0);
  const safeRequiredPMTConsumption = validateMonetaryValue(Math.abs(requiredPMTConsumption), 0);
  
  // Validar projeções anuais
  const safeYearlyProjections = combinedProjections.map(proj => ({
    ...proj,
    currentScenario: validateMonetaryValue(proj.currentScenario),
    maintenanceScenario: validateMonetaryValue(proj.maintenanceScenario),
    consumptionScenario: validateMonetaryValue(proj.consumptionScenario),
  }));
  
  return {
    currentScenario: {
      annualSavings: validateMonetaryValue(annualSavings, 0),
      retirementAge: personalData.retirementAge,
      projectedCapital: safeProjectedCapital,
      requiredCapital: safeRequiredCapitalMaintenance,
      requiredRate: requiredRateCurrent && isFinite(requiredRateCurrent) 
        ? Math.min(Math.max(0, requiredRateCurrent * 100), 1000) // Limitar a 1000%
        : undefined,
      requiredRealRate: requiredRealRateCurrent && isFinite(requiredRealRateCurrent)
        ? Math.min(Math.max(-100, requiredRealRateCurrent), 1000) // Limitar entre -100% e 1000%
        : undefined,
      accumulatedCapital: safeProjectedCapital,
      withinProfile: withinRiskProfile && (requiredRateCurrent || 0) <= (suitabilityLimits[personalData.suitability] || 1.0),
    },
    maintenanceScenario: {
      requiredCapital: safeRequiredCapitalMaintenance,
      annualSavings: safeRequiredPMTMaintenance,
      retirementAge: personalData.retirementAge,
      requiredRate: requiredRateMaintenance && isFinite(requiredRateMaintenance)
        ? Math.min(Math.max(0, requiredRateMaintenance * 100), 1000)
        : undefined,
      requiredRealRate: requiredRealRateMaintenance && isFinite(requiredRealRateMaintenance)
        ? Math.min(Math.max(-100, requiredRealRateMaintenance), 1000)
        : undefined,
      accumulatedCapital: safeRequiredCapitalMaintenance,
      withinProfile: withinRiskProfile && (requiredRateMaintenance || 0) <= (suitabilityLimits[personalData.suitability] || 1.0),
    },
    consumptionScenario: {
      requiredCapital: safeRequiredCapitalConsumption,
      annualSavings: safeRequiredPMTConsumption,
      retirementAge: personalData.retirementAge,
      requiredRate: requiredRateConsumption && isFinite(requiredRateConsumption)
        ? Math.min(Math.max(0, requiredRateConsumption * 100), 1000)
        : undefined,
      requiredRealRate: requiredRealRateConsumption && isFinite(requiredRealRateConsumption)
        ? Math.min(Math.max(-100, requiredRealRateConsumption), 1000)
        : undefined,
      accumulatedCapital: safeRequiredCapitalConsumption,
      withinProfile: withinRiskProfile && (requiredRateConsumption || 0) <= (suitabilityLimits[personalData.suitability] || 1.0),
    },
    yearlyProjections: safeYearlyProjections,
    withinRiskProfile,
    financialThermometer: Math.max(0, Math.min(10, financialThermometer)),
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

