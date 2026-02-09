// Tipos adicionais para Wealth Planning v2 — Modo Reunião
// Estende os tipos existentes em wealth-planning.ts sem alterá-los

import type {
  ScenarioData,
  CalculationResults,
  NotRetiredResults,
  PersonalData,
  FinancialData,
  MacroeconomicAssumptions,
} from './wealth-planning';

// ============================================================================
// RANGE INPUTS (coleta por faixas)
// ============================================================================

export interface RangeOption {
  label: string;      // Ex: "R$ 10-20k"
  min: number;        // Ex: 10000
  max: number;        // Ex: 20000
  midpoint: number;   // Ex: 15000 (usado para cálculos)
}

export interface RangeFieldConfig {
  id: string;
  label: string;
  tooltip: string;
  ranges: RangeOption[];
  unit: 'currency' | 'percentage' | 'years';
}

// ============================================================================
// QUICK INPUTS (Modo Reunião — inputs mínimos)
// ============================================================================

export interface QuickInputs {
  // Tela 1: Perfil
  name: string;
  age: number;
  retirementAge: number;
  lifeExpectancy: number;
  suitability: PersonalData['suitability'];
  hasDependents: boolean;
  dependents: PersonalData['dependents'];
  maritalStatus?: PersonalData['maritalStatus'];

  // Tela 2: Vida Financeira
  monthlyExpense: number;
  monthlyExpenseIsRange: boolean;
  desiredMonthlyIncome: number;
  currentPortfolio: number;
  currentPortfolioIsRange: boolean;
  monthlyContribution: number;
  monthlyContributionIsRange: boolean;
  expectedRetirementRevenues: number;
  hasProjects: boolean;
  hasDebts: boolean;

  // Tela 3: Premissas
  nominalReturn: number;
  inflation: number;
  taxDiscount: number;
  calculationMethod: 'perpetuity' | 'swr';
  swrRate: number;
}

// ============================================================================
// CENÁRIOS AUTO-GERADOS
// ============================================================================

export type ScenarioType = 'conservative' | 'base' | 'optimistic';

export interface AutoScenario {
  type: ScenarioType;
  label: string;
  nominalReturn: number;
  inflation: number;
  realRate: number;
  targetCapital: number;
  projectedCapital: number;
  gap: number;
  requiredMonthlyContribution: number;
  requiredRate: number | null;
  reachesGoal: boolean;
  yearsToGoal: number | null; // null se não atinge
  yearlyProjections: Array<{ age: number; capital: number }>;
}

export interface AutoScenariosResult {
  conservative: AutoScenario;
  base: AutoScenario;
  optimistic: AutoScenario;
}

// ============================================================================
// STRESS TESTS
// ============================================================================

export type StressTestType = 'market_crash' | 'high_inflation' | 'longevity' | 'low_returns';

export interface StressTestConfig {
  type: StressTestType;
  label: string;
  description: string;
  params: {
    crashPercent?: number;        // market_crash: % de queda (ex: 0.30 = -30%)
    inflationBoost?: number;      // high_inflation: pp adicionais (ex: 0.04 = +4pp)
    inflationDuration?: number;   // high_inflation: anos de inflação alta
    longevityExtra?: number;      // longevity: anos extras (ex: 10)
    returnReduction?: number;     // low_returns: % de redução no retorno (ex: 0.20 = -20%)
  };
}

export interface StressTestResult {
  type: StressTestType;
  label: string;
  description: string;
  originalCapitalAtRetirement: number;
  stressedCapitalAtRetirement: number;
  originalSurvivalAge: number;
  stressedSurvivalAge: number;
  impactDescription: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// ANÁLISE DE IMPACTO
// ============================================================================

export interface ImpactAnalysisInput {
  type: 'increase_contribution' | 'delay_retirement' | 'reduce_income';
  value: number; // R$/mês para contribution, anos para delay, R$/mês para reduce
}

export interface ImpactAnalysisResult {
  type: ImpactAnalysisInput['type'];
  label: string;
  originalValue: number;
  newValue: number;
  impact: string; // Descrição legível
  yearsAdvanced?: number;     // Quantos anos antecipa IF
  contributionSaved?: number; // R$/mês economizado
  capitalReduced?: number;    // R$ a menos de patrimônio-alvo
}

// ============================================================================
// PLANO DE AÇÃO
// ============================================================================

export interface ActionItem {
  id: string;
  category: 'investment' | 'protection' | 'succession' | 'debt' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  completed: boolean;
}

// ============================================================================
// SUCESSÃO
// ============================================================================

export interface SuccessionItem {
  id: string;
  label: string;
  question: string;
  answer: boolean | null; // null = não respondido
  actionIfNo: string;
  relevanceThreshold?: number; // patrimônio mínimo para ser relevante
}

// ============================================================================
// PROJETOS (tabela simples)
// ============================================================================

export interface QuickProject {
  name: string;
  targetAmount: number;
  deadlineYears: number;
  suggestedMonthlyContribution: number; // calculado
}

// ============================================================================
// RESULTADO COMPLETO V2
// ============================================================================

export interface WealthPlanningV2Result {
  inputs: QuickInputs;
  scenarios: AutoScenariosResult;
  stressTests: StressTestResult[];
  actionPlan: ActionItem[];
  successionItems: SuccessionItem[];
  projects: QuickProject[];
  calculatedAt: Date;
}

// ============================================================================
// DEFAULTS E CONFIGS
// ============================================================================

export const RANGE_CONFIGS: Record<string, RangeOption[]> = {
  monthlyExpense: [
    { label: 'R$ 5-10k', min: 5000, max: 10000, midpoint: 7500 },
    { label: 'R$ 10-20k', min: 10000, max: 20000, midpoint: 15000 },
    { label: 'R$ 20-40k', min: 20000, max: 40000, midpoint: 30000 },
    { label: 'R$ 40-80k', min: 40000, max: 80000, midpoint: 60000 },
    { label: 'R$ 80k+', min: 80000, max: 200000, midpoint: 120000 },
  ],
  currentPortfolio: [
    { label: 'R$ 100-500k', min: 100000, max: 500000, midpoint: 300000 },
    { label: 'R$ 500k-1M', min: 500000, max: 1000000, midpoint: 750000 },
    { label: 'R$ 1-3M', min: 1000000, max: 3000000, midpoint: 2000000 },
    { label: 'R$ 3-5M', min: 3000000, max: 5000000, midpoint: 4000000 },
    { label: 'R$ 5-10M', min: 5000000, max: 10000000, midpoint: 7500000 },
    { label: 'R$ 10M+', min: 10000000, max: 50000000, midpoint: 20000000 },
  ],
  monthlyContribution: [
    { label: 'R$ 0', min: 0, max: 0, midpoint: 0 },
    { label: 'R$ 1-5k', min: 1000, max: 5000, midpoint: 3000 },
    { label: 'R$ 5-10k', min: 5000, max: 10000, midpoint: 7500 },
    { label: 'R$ 10-20k', min: 10000, max: 20000, midpoint: 15000 },
    { label: 'R$ 20-50k', min: 20000, max: 50000, midpoint: 35000 },
    { label: 'R$ 50k+', min: 50000, max: 200000, midpoint: 100000 },
  ],
};

export const DEFAULT_QUICK_INPUTS: QuickInputs = {
  name: '',
  age: 35,
  retirementAge: 55,
  lifeExpectancy: 85,
  suitability: 'Moderado',
  hasDependents: false,
  dependents: [],
  maritalStatus: 'Solteiro',

  monthlyExpense: 15000,
  monthlyExpenseIsRange: true,
  desiredMonthlyIncome: 15000,
  currentPortfolio: 750000,
  currentPortfolioIsRange: true,
  monthlyContribution: 7500,
  monthlyContributionIsRange: true,
  expectedRetirementRevenues: 0,
  hasProjects: false,
  hasDebts: false,

  nominalReturn: 10,
  inflation: 4,
  taxDiscount: 15,
  calculationMethod: 'perpetuity',
  swrRate: 4,
};

export const DEFAULT_STRESS_TESTS: StressTestConfig[] = [
  {
    type: 'market_crash',
    label: 'Crise de Mercado',
    description: 'Queda de 30% no patrimônio no início da IF',
    params: { crashPercent: 0.30 },
  },
  {
    type: 'high_inflation',
    label: 'Inflação Alta',
    description: 'Inflação +4pp acima do esperado por 5 anos',
    params: { inflationBoost: 0.04, inflationDuration: 5 },
  },
  {
    type: 'longevity',
    label: 'Longevidade',
    description: 'Viver 10 anos a mais que o esperado',
    params: { longevityExtra: 10 },
  },
  {
    type: 'low_returns',
    label: 'Retornos Baixos',
    description: 'Rentabilidade 20% menor que o esperado',
    params: { returnReduction: 0.20 },
  },
];
