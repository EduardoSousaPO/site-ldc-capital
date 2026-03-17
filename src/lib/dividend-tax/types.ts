export type BeneficiaryResidency = "residente" | "nao_residente" | "pj";

export type DividendSourceType =
  | "empresa_brasil"
  | "acoes_dividendos"
  | "exterior"
  | "outros"
  | "cdb_rdb_tesouro_titulos"
  | "debentures_comuns"
  | "fundos_etfs_tributaveis"
  | "debentures_incentivadas_fi_infra"
  | "fii_fiagro"
  | "titulos_isentos";

export type RedutorCompanyType = "geral" | "financeira" | "banco";

export type BusinessTaxRegime =
  | "simples"
  | "lucro_presumido"
  | "lucro_real";

export type BusinessActivityType =
  | "comercio"
  | "industria"
  | "servicos_geral"
  | "servicos_regulamentado"
  | "transporte_carga"
  | "transporte_passageiros";

export interface DividendSourceInput {
  id: string;
  name: string;
  monthlyAmount: number;
  monthsReceived: number;
  sourceType: DividendSourceType;
}

export interface DividendAnnualIncomesInput {
  otherTaxableAnnualIncome: number;
  otherExclusiveAnnualIncome: number;
  otherExemptAnnualIncome: number;
  excludedFromIrpfmAnnual: number;
}

export interface DividendDeductionsInput {
  includeCalculatedIrrfCredit: boolean;
  additionalIrrfCredits: number;
  irpfProgressivePaid: number;
  offshorePaid: number;
  definitivePaid: number;
  manualOtherDeductions: number;
}

export interface DividendRedutorCompanyInput {
  id: string;
  name: string;
  companyType: RedutorCompanyType;
  lucroContabil: number;
  irpjCsllPaid: number;
  dividendsPaidToBeneficiary: number;
}

export interface DividendBusinessContextInput {
  regimeTributario: BusinessTaxRegime;
  atividadePrincipal: BusinessActivityType;
  faturamentoAnual: number;
  margemLucroPercentual: number;
  folhaAnual: number;
  numeroSocios: number;
  participacaoSocioPercentual: number;
  percentualDistribuicaoLucro: number;
  jaPagaJcp: boolean;
  temHolding: boolean;
  clubeInvestimento: DividendInvestmentClubInput;
}

export interface DividendInvestmentClubInput {
  enabled: boolean;
  portfolioValue: number;
  annualDeferredDistributions: number;
  participantsCount: number;
  stockAllocationPercent: number;
  brokerageFeePercent: number;
  annualGrowthPercent: number;
}

export interface DividendTaxSimulationInput {
  residency: BeneficiaryResidency;
  sources: DividendSourceInput[];
  annualIncomes: DividendAnnualIncomesInput;
  deductions: DividendDeductionsInput;
  enableRedutor: boolean;
  redutorCompanies: DividendRedutorCompanyInput[];
  business: DividendBusinessContextInput;
}

export interface SourceCalculationResult {
  id: string;
  name: string;
  sourceType: DividendSourceType;
  monthlyAmount: number;
  monthsReceived: number;
  annualGrossDividends: number;
  annualExcludedByLaw: number;
  annualIncludedInIrpfmBase: number;
  monthlyIrrf: number;
  annualIrrf: number;
}

export interface IncomeCompositionResult {
  rendimentosTributaveis: number;
  rendimentosExclusivos: number;
  rendimentosIsentos: number;
  dividendosTotais: number;
  exclusoesAutomaticas: number;
  exclusoesManuais: number;
  exclusoesTotais: number;
  rendaGlobalBruta: number;
  baseIrpfmAnual: number;
}

export interface IrpfmDeductionBreakdown {
  irpfProgressivo: number;
  irrfDividendos: number;
  outrosCreditosIrrf: number;
  offshore: number;
  tributacaoDefinitiva: number;
  outrasDeducoes: number;
  redutorTotal: number;
  deducoesSemRedutor: number;
  deducoesTotais: number;
}

export interface RedutorCalculationBreakdown {
  companyName: string;
  companyType: RedutorCompanyType;
  tetoAplicavel: number;
  aliquotaEfetivaPj: number;
  aliquotaEfetivaIrpfmDividendos: number;
  somaAliquotas: number;
  excedenteAliquota: number;
  creditoRedutor: number;
}

export interface IrpfmStepBreakdown {
  sujeitoIrpfm: boolean;
  rendaTotalAnual: number;
  aliquotaAplicavel: number;
  aliquotaAplicavelPercentual: number;
  formulaAliquota: string;
  irpfmBruto: number;
  deducoes: IrpfmDeductionBreakdown;
  irpfmDevido: number;
}

export interface ScenarioTaxBreakdown {
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  simplesDAS: number;
  inssPatronal: number;
  inssSocio: number;
  irrfDividendos: number;
  irpfm: number;
  irrfJcp: number;
  beneficioFiscalJcp: number;
  custoHolding: number;
  custoClube: number;
}

export type ScenarioCode =
  | "A_STATUS_QUO"
  | "B_MIX_OTIMIZADO"
  | "C_HOLDING"
  | "D_CLUBE";

export interface ScenarioComparisonResult {
  code: ScenarioCode;
  title: string;
  description: string;
  totalTax: number;
  totalTaxRate: number;
  netToPartner: number;
  annualSavingsVsStatusQuo: number;
  deferredTaxAnnual: number;
  breakEvenMonthlyDividends: number;
  isBest: boolean;
  taxBreakdown: ScenarioTaxBreakdown;
}

export interface ClubTaxProjectionYear {
  year: number;
  projectedPortfolioValue: number;
  directTaxAnnual: number;
  directTaxCumulative: number;
  clubFeeAnnual: number;
  clubFeeCumulative: number;
  deferredTaxAnnual: number;
  deferredTaxCumulative: number;
  netTaxBenefitCumulative: number;
  averageTaxEfficiencyPercent: number;
}

export interface ClubTaxProjectionSummary {
  horizonYears: 5 | 10;
  projectedPortfolioValue: number;
  directTaxCumulative: number;
  clubFeeCumulative: number;
  deferredTaxCumulative: number;
  netTaxBenefitCumulative: number;
  averageTaxEfficiencyPercent: number;
}

export interface ClubTaxProjectionResult {
  portfolioValue: number;
  annualDeferredDistributions: number;
  brokerageFeePercent: number;
  annualGrowthPercent: number;
  annualDirectTaxWithoutDeferment: number;
  years: ClubTaxProjectionYear[];
  summary5Years: ClubTaxProjectionSummary;
  summary10Years: ClubTaxProjectionSummary;
}

export interface RegimeSimulationResult {
  regime: BusinessTaxRegime;
  totalTax: number;
  totalTaxRate: number;
  corporateTax: number;
  personalTax: number;
  estimatedNetToPartner: number;
  breakdown: ScenarioTaxBreakdown;
  isBest: boolean;
}

export type AlertSeverity = "warning" | "opportunity" | "success";

export interface DividendTaxAlert {
  code: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  suggestedAction?: string;
  estimatedAnnualSavings?: number;
}

export interface DividendTaxSimulationResult {
  totalAnnualDividends: number;
  irrfAnnualTotal: number;
  irrfMonthlyTotal: number;
  irpfmBaseAnnual: number;
  irpfmRate: number;
  irpfmGross: number;
  deductionsTotal: number;
  irpfmAfterDeductions: number;
  redutorTotal: number;
  irpfmDue: number;
  totalTaxDue: number;
  netAnnualDividends: number;
  impactPercentage: number;
  incomeComposition: IncomeCompositionResult;
  irpfmSteps: IrpfmStepBreakdown;
  sourceBreakdown: SourceCalculationResult[];
  redutorBreakdown: RedutorCalculationBreakdown[];
  scenarios: ScenarioComparisonResult[];
  clubProjection: ClubTaxProjectionResult | null;
  regimeSimulation: RegimeSimulationResult[];
  alerts: DividendTaxAlert[];
  warnings: string[];
  assumptions: string[];
}

export interface DividendTaxSummaryForLead {
  totalAnnualDividends: number;
  totalTaxDue: number;
  netAnnualDividends: number;
  impactPercentage: number;
}
