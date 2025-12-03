// Tipos TypeScript para Wealth Planning Tool - LDC Capital
// Baseado em report_detailed.md, report.md e report_scenario_management.md

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

export type Suitability = "Conservador" | "Moderado" | "Moderado-Agressivo" | "Agressivo";
export type InvestmentObjective = "Preservar capital" | "Acumular Recursos" | "Especular";
export type MaritalStatus = "Solteiro" | "Casado" | "Divorciado" | "União Estável" | "Viúvo";
export type TaxConsideration = "Sem considerar I.R" | "Considerando I.R";
export type ProjectType = "Pessoal" | "Familiar";
export type ScenarioStatus = "draft" | "published";

// ============================================================================
// 1. DADOS PESSOAIS E FAMILIARES (Seção 1.1 do report_detailed.md)
// ============================================================================

export interface Dependent {
  name: string;
  age: number;
  observations?: string;
}

export interface PersonalData {
  name: string; // Nome do cliente (F6)
  age: number; // Idade atual em anos (I6)
  dependents: Dependent[]; // Lista de dependentes (D7-G7)
  retirementAge: number; // Idade de aposentadoria desejada (I7)
  lifeExpectancy: number; // Linha de vida - expectativa de vida (I8)
  maritalStatus: MaritalStatus; // Estado civil (H9)
  profession?: string; // Profissão atual (H10)
  suitability: Suitability; // Perfil de risco (I10)
  healthStatus?: string; // Estado de saúde e expectativa de longevidade
  otherAdvisors?: string; // Outros profissionais que assessoram (advogados, contadores)
}

// ============================================================================
// 2. INFORMAÇÕES FINANCEIRAS BÁSICAS (Seção 1.2 do report_detailed.md)
// ============================================================================

export interface FinancialData {
  monthlyFamilyExpense: number; // Despesa familiar mensal (F13)
  desiredMonthlyRetirementIncome: number; // Renda mensal desejada na aposentadoria (I13)
  monthlySavings: number; // Poupança mensal (F14)
  expectedMonthlyRetirementRevenues: number; // Receitas mensais previstas na aposentadoria (I14)
  investmentObjective: InvestmentObjective; // Objetivo dos Investimentos (H15)
  emergencyReserve?: number; // Reserva de emergência (6 meses de despesas recomendado)
  currentAnnualIncome?: number; // Renda anual atual
  taxBracket?: string; // Faixa de tributação atual
}

// ============================================================================
// 3. COMPOSIÇÃO DA CARTEIRA ATUAL (Seção 1.3 do report_detailed.md)
// ============================================================================

export interface PortfolioAsset {
  name: string; // Nome do ativo (ex: "Carteira", "Previdência")
  value: number; // Valor atual em R$ (coluna R$)
  percentage: number; // % da carteira (calculado automaticamente)
  cdiRate: number; // Rentabilidade (% CDI) - ex: 0.097 = 9.7% ao ano
}

export interface Portfolio {
  assets: PortfolioAsset[]; // Lista de ativos
  total: number; // Total da carteira (soma dos valores)
  taxConsideration: TaxConsideration; // I.R considerado (I23)
  immediateLiquidityNeeds: number; // Necessidade de liquidez imediata (%) (I23)
}

// ============================================================================
// 4. BENS MÓVEIS E IMÓVEIS (Seção 1.5 do report_detailed.md)
// ============================================================================

export interface Asset {
  name: string; // Nome do bem (ex: "Casa Própria", "Veículo")
  value: number; // Valor estimado do bem (F26)
  sellable: boolean; // Vendável? (Sim/Não) (H26)
  rentalIncome?: number; // Renda de aluguel mensal (I26)
}

export interface Assets {
  items: Asset[];
  total: number; // Total dos bens (soma dos valores)
}

// ============================================================================
// 5. PROJETOS PESSOAIS E FAMILIARES (Seção 1.6 do report_detailed.md)
// ============================================================================

export interface Project {
  type: ProjectType; // P/F (Pessoal/Familiar)
  name: string; // Nome do projeto
  amount: number; // Montante desejado
  deadline: number; // Prazo em anos até a realização
}

export interface Projects {
  items: Project[];
}

// ============================================================================
// 6. DÍVIDAS E FINANCIAMENTOS (Seção 1.6 do report_detailed.md)
// ============================================================================

export interface Debt {
  description: string; // Descrição da dívida
  balance: number; // Saldo devedor
  term: number; // Prazo para saldar (em anos)
  hasLifeInsurance: boolean; // Com Seguro de Vida? (Sim/Não)
}

export interface Debts {
  items: Debt[];
  total: number; // Total das dívidas
}

// ============================================================================
// 7. OUTRAS RECEITAS (Seção 1.6 do report_detailed.md)
// ============================================================================

export interface OtherRevenue {
  source: string; // Fonte (FGTS, aluguel, seguros de vida, INSS, etc.)
  value: number; // Valor
  observations?: string; // Observações
}

export interface OtherRevenues {
  items: OtherRevenue[];
  total: number; // Total das receitas
}

// ============================================================================
// 8. PREMISSAS MACROECONÔMICAS (Seção 1.7 do report_detailed.md)
// ============================================================================

export interface MacroeconomicAssumptions {
  annualInflation: number; // Inflação anual (%) (E41) - ex: 3.5
  annualCDI: number; // CDI anual (%) (F41) - ex: 9.7
  retirementReturnNominal: number; // Rentabilidade aposentadoria sem considerar I.R (%) (H41) - ex: 9.7
  retirementRealRate: number; // Juro real na aposentadoria (%) (I41) - ex: 5.99
}

// ============================================================================
// 9. DADOS COMPLETOS DO CENÁRIO
// ============================================================================

export interface ScenarioData {
  personalData: PersonalData;
  financialData: FinancialData;
  portfolio: Portfolio;
  assets: Assets;
  projects: Projects;
  debts: Debts;
  otherRevenues: OtherRevenues;
  assumptions: MacroeconomicAssumptions;
}

// ============================================================================
// 10. RESULTADOS DE CÁLCULOS - NÃO APOSENTADO
// ============================================================================

export interface YearlyProjection {
  age: number; // Idade no ano
  currentScenario: number; // Cenário 1: Projeção atual (AW)
  maintenanceScenario: number; // Cenário 2: Manutenção do patrimônio (AX)
  consumptionScenario: number; // Cenário 3: Consumo do patrimônio (AY)
}

export interface NotRetiredResults {
  // Cenário 1: Projeção atual
  currentScenario: {
    annualSavings: number; // Poupança anual atual
    retirementAge: number; // Idade de aposentadoria
    projectedCapital: number; // Capital acumulado na aposentadoria
    requiredCapital: number; // Capital necessário
    requiredRate?: number; // Rentabilidade necessária (nominal bruta)
    requiredRealRate?: number; // Rentabilidade necessária (real líquida)
    accumulatedCapital: number; // Capital acumulado na aposentadoria
    withinProfile: boolean; // Se está dentro do perfil de risco
  };
  
  // Cenário 2: Manutenção do patrimônio (viver de renda)
  maintenanceScenario: {
    requiredCapital: number; // Capital necessário para viver de renda
    annualSavings: number; // Poupança anual necessária
    retirementAge: number; // Idade de aposentadoria
    requiredRate?: number; // Rentabilidade necessária (nominal bruta)
    requiredRealRate?: number; // Rentabilidade necessária (real líquida)
    accumulatedCapital: number; // Capital acumulado na aposentadoria
    withinProfile: boolean; // Se está dentro do perfil de risco
  };
  
  // Cenário 3: Consumo do patrimônio
  consumptionScenario: {
    requiredCapital: number; // Capital necessário consumindo patrimônio
    annualSavings: number; // Poupança anual necessária
    retirementAge: number; // Idade de aposentadoria
    requiredRate?: number; // Rentabilidade necessária (nominal bruta)
    requiredRealRate?: number; // Rentabilidade necessária (real líquida)
    accumulatedCapital: number; // Capital acumulado na aposentadoria
    withinProfile: boolean; // Se está dentro do perfil de risco
  };
  
  // Projeções ano a ano
  yearlyProjections: YearlyProjection[];
  
  // Validações
  withinRiskProfile: boolean; // Se a rentabilidade necessária está dentro do perfil de risco
  financialThermometer: number; // Termômetro financeiro (0-10)
  warnings: string[]; // Alertas e sugestões
}

// ============================================================================
// 11. RESULTADOS DE CÁLCULOS - APOSENTADO
// ============================================================================

export interface RetiredResults {
  // Carteira atual
  currentPortfolio: {
    initialCapital: number;
    averageAnnualReturn: number; // Renda média gerada pelo patrimônio
    survivalAge: number; // Idade em que o patrimônio se esgota
    yearlyProjections: Array<{ age: number; balance: number }>;
  };
  
  // Carteira renda vitalícia
  lifetimeIncomePortfolio: {
    initialCapital: number;
    averageAnnualReturn: number;
    survivalAge: number;
    yearlyProjections: Array<{ age: number; balance: number }>;
  };
  
  // Carteira consumo patrimônio financeiro
  financialConsumptionPortfolio: {
    initialCapital: number;
    averageAnnualReturn: number;
    survivalAge: number;
    yearlyProjections: Array<{ age: number; balance: number }>;
  };
  
  // Carteira consumo patrimônio total
  totalConsumptionPortfolio: {
    initialCapital: number;
    averageAnnualReturn: number;
    survivalAge: number;
    yearlyProjections: Array<{ age: number; balance: number }>;
  };
}

// ============================================================================
// 12. PROTEÇÃO FAMILIAR
// ============================================================================

export interface FamilyProtection {
  immediateProtection: number; // Necessidade de proteção imediata
  successionLiquidity: number; // Liquidez necessária para sucessão
  totalProtection: number; // Proteção familiar total
  futureRevenuesPV: number; // Valor presente das receitas futuras
  annualExpenses: number; // Gastos anuais (despesa familiar × 12)
}

// ============================================================================
// 13. RESULTADOS COMPLETOS DE CÁLCULOS
// ============================================================================

export interface CalculationResults {
  notRetired?: NotRetiredResults; // Resultados para não aposentado
  retired?: RetiredResults; // Resultados para aposentado
  familyProtection?: FamilyProtection; // Proteção familiar
  projects?: {
    // Cálculos de projetos (PMT necessário para cada projeto)
    items: Array<{
      projectName: string;
      currentPMT: number; // Contribuição anual no cenário atual
      newPMT?: number; // Contribuição anual no cenário novo
      requiredRate?: number; // Taxa necessária
    }>;
    totalCurrentPMT: number;
    totalNewPMT?: number;
  };
  calculatedAt: Date; // Data do cálculo
}

// ============================================================================
// 14. CENÁRIO COMPLETO (Banco de dados)
// ============================================================================

export interface WealthPlanningScenario {
  id: string;
  title: string;
  clientId: string;
  consultantId: string;
  status: ScenarioStatus;
  personalData: PersonalData;
  financialData: FinancialData;
  portfolio: Portfolio;
  assets: Assets;
  projects: Projects;
  debts: Debts;
  otherRevenues: OtherRevenues;
  assumptions: MacroeconomicAssumptions;
  calculatedResults?: CalculationResults;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 15. CLIENTE
// ============================================================================

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  scenarios?: WealthPlanningScenario[]; // Cenários do cliente (opcional, para queries)
}

// ============================================================================
// 16. TIPOS PARA FORMULÁRIOS E VALIDAÇÃO
// ============================================================================

export interface ScenarioData {
  personalData: PersonalData;
  financialData: FinancialData;
  portfolio: Portfolio;
  assets: Assets;
  projects: Projects;
  debts: Debts;
  otherRevenues: OtherRevenues;
  assumptions: MacroeconomicAssumptions;
}

export interface ScenarioFormData extends ScenarioData {
  title: string; // Título do cenário
  clientId: string; // ID do cliente
}

// ============================================================================
// 17. TIPOS PARA API RESPONSES
// ============================================================================

export interface ClientWithScenarios extends Client {
  scenariosCount: number; // Número de cenários vinculados
}

export interface ScenarioListItem {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  status: ScenarioStatus;
  calculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

