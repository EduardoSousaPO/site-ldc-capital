import { generateDividendTaxAlerts } from "@/lib/dividend-tax/alerts-engine";
import {
  REDUTOR_TETO_BY_COMPANY_TYPE,
  getSourceTaxTreatment,
} from "@/lib/dividend-tax/constants";
import { TAX_CONSTANTS } from "@/lib/dividend-tax/tax-constants";
import type {
  BusinessActivityType,
  BusinessTaxRegime,
  ClubTaxProjectionResult,
  DividendBusinessContextInput,
  DividendInvestmentClubInput,
  DividendSourceInput,
  DividendTaxSimulationInput,
  DividendTaxSimulationResult,
  IncomeCompositionResult,
  IrpfmDeductionBreakdown,
  RedutorCalculationBreakdown,
  RegimeSimulationResult,
  ScenarioComparisonResult,
  ScenarioTaxBreakdown,
  SourceCalculationResult,
} from "@/lib/dividend-tax/types";

interface SourceRules {
  applyIrrf: boolean;
  includeInIrpfmBase: boolean;
  excludedByLaw: boolean;
}

interface ScenarioIrpfmResult {
  base: number;
  rate: number;
  gross: number;
  deductions: number;
  due: number;
}

interface CorporateTaxEstimate {
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  simplesDAS: number;
  total: number;
  lucroAntesTributos: number;
  lucroPosTributos: number;
}

function getSourceRules(sourceType: SourceCalculationResult["sourceType"]): SourceRules {
  const treatment = getSourceTaxTreatment(sourceType);

  return {
    applyIrrf: treatment.monthlyDividendRule,
    includeInIrpfmBase: treatment.includeInIrpfmBase,
    excludedByLaw: treatment.excludedByLaw,
  };
}

function calculateIrpfmRate(baseAnnualIncome: number): number {
  if (baseAnnualIncome <= TAX_CONSTANTS.IRPFM_LIMIAR_INFERIOR) {
    return 0;
  }

  if (baseAnnualIncome >= TAX_CONSTANTS.IRPFM_LIMIAR_SUPERIOR) {
    return TAX_CONSTANTS.IRPFM_ALIQUOTA_MAXIMA;
  }

  return (
    (baseAnnualIncome - TAX_CONSTANTS.IRPFM_LIMIAR_INFERIOR) /
    (TAX_CONSTANTS.IRPFM_LIMIAR_SUPERIOR - TAX_CONSTANTS.IRPFM_LIMIAR_INFERIOR)
  ) * TAX_CONSTANTS.IRPFM_ALIQUOTA_MAXIMA;
}

function calculateIrpfProgressiveAnnual(annualTaxableIncome: number): number {
  if (annualTaxableIncome <= 0) return 0;

  const faixa =
    TAX_CONSTANTS.IRPF_FAIXAS_ANUAIS_2026.find((item) => annualTaxableIncome <= item.ate) ||
    TAX_CONSTANTS.IRPF_FAIXAS_ANUAIS_2026[TAX_CONSTANTS.IRPF_FAIXAS_ANUAIS_2026.length - 1];
  const impostoTabela = Math.max(0, annualTaxableIncome * faixa.aliquota - faixa.deducao);

  if (annualTaxableIncome <= TAX_CONSTANTS.IRPF_REDUCAO_ANUAL_LIMITE_ISENCAO) {
    return 0;
  }

  if (annualTaxableIncome < TAX_CONSTANTS.IRPF_REDUCAO_ANUAL_LIMITE_FIM) {
    const reducao = Math.max(
      0,
      TAX_CONSTANTS.IRPF_REDUCAO_ANUAL_FORMULA_BASE -
        annualTaxableIncome * TAX_CONSTANTS.IRPF_REDUCAO_ANUAL_FORMULA_MULTIPLICADOR,
    );
    return Math.max(0, impostoTabela - reducao);
  }

  return impostoTabela;
}

function getLucroPresumidoIrpjPresumption(activity: BusinessActivityType): number {
  const map = TAX_CONSTANTS.LP_PRESUNCAO;
  return map[activity];
}

function getLucroPresumidoCsllPresumption(activity: BusinessActivityType): number {
  if (activity === "servicos_geral" || activity === "servicos_regulamentado") {
    return TAX_CONSTANTS.LP_PRESUNCAO_CSLL.servicos;
  }
  return TAX_CONSTANTS.LP_PRESUNCAO_CSLL.geral;
}

function estimateCorporateTaxes(
  business: DividendBusinessContextInput,
  regimeOverride?: BusinessTaxRegime,
): CorporateTaxEstimate {
  const regime = regimeOverride ?? business.regimeTributario;
  const receita = Math.max(0, business.faturamentoAnual);
  const lucroAntesTributos =
    receita * Math.max(0, Math.min(1, business.margemLucroPercentual / 100));

  if (regime === "simples") {
    const aliquota = TAX_CONSTANTS.SIMPLES_ALIQUOTAS_ESTIMADAS[business.atividadePrincipal];
    const simplesDAS = receita * aliquota;
    const lucroPosTributos = Math.max(0, lucroAntesTributos - simplesDAS);

    return {
      irpj: 0,
      csll: 0,
      pis: 0,
      cofins: 0,
      simplesDAS,
      total: simplesDAS,
      lucroAntesTributos,
      lucroPosTributos,
    };
  }

  if (regime === "lucro_presumido") {
    const irpjPresumido = receita * getLucroPresumidoIrpjPresumption(business.atividadePrincipal);
    const irpjAdicionalBase = Math.max(
      0,
      irpjPresumido - TAX_CONSTANTS.IRPJ_ADICIONAL_LIMIAR_ANUAL,
    );
    const irpj =
      irpjPresumido * TAX_CONSTANTS.IRPJ_BASE +
      irpjAdicionalBase * TAX_CONSTANTS.IRPJ_ADICIONAL;

    const csllBase = receita * getLucroPresumidoCsllPresumption(business.atividadePrincipal);
    const csll = csllBase * TAX_CONSTANTS.CSLL_GERAL;

    const pis = receita * TAX_CONSTANTS.PIS_CUMULATIVO;
    const cofins = receita * TAX_CONSTANTS.COFINS_CUMULATIVO;
    const total = irpj + csll + pis + cofins;
    const lucroPosTributos = Math.max(0, lucroAntesTributos - total);

    return {
      irpj,
      csll,
      pis,
      cofins,
      simplesDAS: 0,
      total,
      lucroAntesTributos,
      lucroPosTributos,
    };
  }

  const irpjAdicionalBase = Math.max(
    0,
    lucroAntesTributos - TAX_CONSTANTS.IRPJ_ADICIONAL_LIMIAR_ANUAL,
  );
  const irpj =
    lucroAntesTributos * TAX_CONSTANTS.IRPJ_BASE +
    irpjAdicionalBase * TAX_CONSTANTS.IRPJ_ADICIONAL;
  const csll = lucroAntesTributos * TAX_CONSTANTS.CSLL_GERAL;
  const pis = receita * TAX_CONSTANTS.PIS_NAO_CUMULATIVO;
  const cofins = receita * TAX_CONSTANTS.COFINS_NAO_CUMULATIVO;
  const total = irpj + csll + pis + cofins;
  const lucroPosTributos = Math.max(0, lucroAntesTributos - total);

  return {
    irpj,
    csll,
    pis,
    cofins,
    simplesDAS: 0,
    total,
    lucroAntesTributos,
    lucroPosTributos,
  };
}

function estimatePartnerTargetAnnualDividends(
  input: DividendTaxSimulationInput,
  totalAnnualDividendsFromSources: number,
): number {
  if (totalAnnualDividendsFromSources > 0) {
    return totalAnnualDividendsFromSources;
  }

  const corporate = estimateCorporateTaxes(input.business);
  const distributed = corporate.lucroPosTributos * (input.business.percentualDistribuicaoLucro / 100);
  const partnerShare = distributed * (input.business.participacaoSocioPercentual / 100);

  return Math.max(0, partnerShare);
}

function calculateScenarioIrpfm(
  input: DividendTaxSimulationInput,
  context: {
    taxableAnnualIncome: number;
    exclusiveAnnualIncome: number;
    exemptAnnualIncome: number;
    dividendsAnnual: number;
    exclusionsAnnual: number;
    irrfCreditAnnual: number;
  },
): ScenarioIrpfmResult {
  if (input.residency === "pj") {
    return {
      base: 0,
      rate: 0,
      gross: 0,
      deductions: 0,
      due: 0,
    };
  }

  const base = Math.max(
    0,
    context.taxableAnnualIncome +
      context.exclusiveAnnualIncome +
      context.exemptAnnualIncome +
      context.dividendsAnnual -
      context.exclusionsAnnual,
  );

  const rate = calculateIrpfmRate(base);
  const gross = base * rate;
  const progressiveCredit =
    input.deductions.irpfProgressivePaid > 0
      ? input.deductions.irpfProgressivePaid
      : calculateIrpfProgressiveAnnual(context.taxableAnnualIncome);

  const deductions =
    progressiveCredit +
    context.irrfCreditAnnual +
    input.deductions.additionalIrrfCredits +
    input.deductions.offshorePaid +
    input.deductions.definitivePaid +
    input.deductions.manualOtherDeductions;

  return {
    base,
    rate,
    gross,
    deductions,
    due: Math.max(0, gross - deductions),
  };
}

function calculateSourceBreakdown(
  input: DividendTaxSimulationInput,
): SourceCalculationResult[] {
  return input.sources.map((source) => {
    const rules = getSourceRules(source.sourceType);
    const annualGrossDividends = source.monthlyAmount * source.monthsReceived;

    let monthlyIrrf = 0;
    if (rules.applyIrrf) {
      if (input.residency === "nao_residente") {
        monthlyIrrf = source.monthlyAmount * TAX_CONSTANTS.IRRF_ALIQUOTA;
      } else if (
        input.residency === "residente" &&
        source.monthlyAmount > TAX_CONSTANTS.IRRF_LIMIAR_MENSAL
      ) {
        monthlyIrrf = source.monthlyAmount * TAX_CONSTANTS.IRRF_ALIQUOTA;
      }
    }

    return {
      id: source.id,
      name: source.name,
      sourceType: source.sourceType,
      monthlyAmount: source.monthlyAmount,
      monthsReceived: source.monthsReceived,
      annualGrossDividends,
      annualExcludedByLaw: rules.excludedByLaw ? annualGrossDividends : 0,
      annualIncludedInIrpfmBase: rules.includeInIrpfmBase ? annualGrossDividends : 0,
      monthlyIrrf,
      annualIrrf: monthlyIrrf * source.monthsReceived,
    };
  });
}

function calculateIncomeComposition(
  input: DividendTaxSimulationInput,
  sourceBreakdown: SourceCalculationResult[],
): IncomeCompositionResult {
  const annualIncomes = input.annualIncomes;
  const totalAnnualDividends = sourceBreakdown.reduce(
    (acc, source) => acc + source.annualGrossDividends,
    0,
  );
  const automaticExclusions = sourceBreakdown.reduce(
    (acc, source) => acc + source.annualExcludedByLaw,
    0,
  );

  const rendaGlobalBruta =
    annualIncomes.otherTaxableAnnualIncome +
    annualIncomes.otherExclusiveAnnualIncome +
    annualIncomes.otherExemptAnnualIncome +
    totalAnnualDividends;
  const exclusoesTotais = automaticExclusions + annualIncomes.excludedFromIrpfmAnnual;

  return {
    rendimentosTributaveis: annualIncomes.otherTaxableAnnualIncome,
    rendimentosExclusivos: annualIncomes.otherExclusiveAnnualIncome,
    rendimentosIsentos: annualIncomes.otherExemptAnnualIncome,
    dividendosTotais: totalAnnualDividends,
    exclusoesAutomaticas: automaticExclusions,
    exclusoesManuais: annualIncomes.excludedFromIrpfmAnnual,
    exclusoesTotais,
    rendaGlobalBruta,
    baseIrpfmAnual: Math.max(0, rendaGlobalBruta - exclusoesTotais),
  };
}

function calculateRedutor(
  input: DividendTaxSimulationInput,
  irpfmRate: number,
  irpfmAfterDeductions: number,
): {
  redutorTotal: number;
  breakdown: RedutorCalculationBreakdown[];
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!input.enableRedutor || input.redutorCompanies.length === 0) {
    return {
      redutorTotal: 0,
      breakdown: [],
      warnings,
    };
  }

  let redutorTotal = 0;
  const breakdown = input.redutorCompanies.map((company) => {
    const tetoAplicavel = REDUTOR_TETO_BY_COMPANY_TYPE[company.companyType];
    let aliquotaEfetivaPj = 0;

    if (company.lucroContabil > 0) {
      aliquotaEfetivaPj = company.irpjCsllPaid / company.lucroContabil;
    } else if (company.dividendsPaidToBeneficiary > 0) {
      warnings.push(
        `Empresa ${company.name}: lucro contabil zerado. Redutor pode estar subestimado.`,
      );
    }

    const somaAliquotas = aliquotaEfetivaPj + irpfmRate;
    const excedenteAliquota = Math.max(0, somaAliquotas - tetoAplicavel);
    const creditoRedutor = company.dividendsPaidToBeneficiary * excedenteAliquota;
    redutorTotal += creditoRedutor;

    return {
      companyName: company.name,
      companyType: company.companyType,
      tetoAplicavel,
      aliquotaEfetivaPj,
      aliquotaEfetivaIrpfmDividendos: irpfmRate,
      somaAliquotas,
      excedenteAliquota,
      creditoRedutor,
    };
  });

  return {
    redutorTotal: Math.min(redutorTotal, irpfmAfterDeductions),
    breakdown,
    warnings,
  };
}

function createScenarioBreakdown(base?: Partial<ScenarioTaxBreakdown>): ScenarioTaxBreakdown {
  return {
    irpj: 0,
    csll: 0,
    pis: 0,
    cofins: 0,
    simplesDAS: 0,
    inssPatronal: 0,
    inssSocio: 0,
    irrfDividendos: 0,
    irpfm: 0,
    irrfJcp: 0,
    beneficioFiscalJcp: 0,
    custoHolding: 0,
    custoClube: 0,
    ...base,
  };
}

function calculateClubAnnualCost(clube: DividendInvestmentClubInput): number {
  return Math.max(0, clube.portfolioValue) * Math.max(0, clube.brokerageFeePercent / 100);
}

function createClubProjection(
  clube: DividendInvestmentClubInput,
  annualDirectTaxWithoutDeferment: number,
): ClubTaxProjectionResult | null {
  if (
    !clube.enabled ||
    annualDirectTaxWithoutDeferment <= 0 ||
    clube.portfolioValue < TAX_CONSTANTS.CLUBE_VALOR_MINIMO ||
    clube.annualDeferredDistributions <= 0
  ) {
    return null;
  }

  const growthRate = Math.max(0, clube.annualGrowthPercent / 100);
  const feeRate = Math.max(0, clube.brokerageFeePercent / 100);
  let projectedPortfolioValue = clube.portfolioValue;
  let directTaxAnnual = annualDirectTaxWithoutDeferment;
  const years = Array.from({ length: 10 }, (_, index) => {
    const year = index + 1;
    const clubFeeAnnual = projectedPortfolioValue * feeRate;

    return {
      year,
      projectedPortfolioValue,
      directTaxAnnual,
      clubFeeAnnual,
    };
  });

  let directTaxCumulative = 0;
  let clubFeeCumulative = 0;
  let deferredTaxCumulative = 0;

  const detailedYears = years.map((item) => {
    directTaxCumulative += item.directTaxAnnual;
    clubFeeCumulative += item.clubFeeAnnual;
    deferredTaxCumulative += item.directTaxAnnual;
    const netTaxBenefitCumulative = deferredTaxCumulative - clubFeeCumulative;
    const averageTaxEfficiencyPercent =
      directTaxCumulative > 0 ? (netTaxBenefitCumulative / directTaxCumulative) * 100 : 0;

    const row = {
      year: item.year,
      projectedPortfolioValue: item.projectedPortfolioValue,
      directTaxAnnual: item.directTaxAnnual,
      directTaxCumulative,
      clubFeeAnnual: item.clubFeeAnnual,
      clubFeeCumulative,
      deferredTaxAnnual: item.directTaxAnnual,
      deferredTaxCumulative,
      netTaxBenefitCumulative,
      averageTaxEfficiencyPercent,
    };

    projectedPortfolioValue *= 1 + growthRate;
    directTaxAnnual *= 1 + growthRate;

    return row;
  });

  const summary5YearsSource = detailedYears[4];
  const summary10YearsSource = detailedYears[9];

  return {
    portfolioValue: clube.portfolioValue,
    annualDeferredDistributions: clube.annualDeferredDistributions,
    brokerageFeePercent: clube.brokerageFeePercent,
    annualGrowthPercent: clube.annualGrowthPercent,
    annualDirectTaxWithoutDeferment,
    years: detailedYears,
    summary5Years: {
      horizonYears: 5,
      projectedPortfolioValue: summary5YearsSource.projectedPortfolioValue,
      directTaxCumulative: summary5YearsSource.directTaxCumulative,
      clubFeeCumulative: summary5YearsSource.clubFeeCumulative,
      deferredTaxCumulative: summary5YearsSource.deferredTaxCumulative,
      netTaxBenefitCumulative: summary5YearsSource.netTaxBenefitCumulative,
      averageTaxEfficiencyPercent: summary5YearsSource.averageTaxEfficiencyPercent,
    },
    summary10Years: {
      horizonYears: 10,
      projectedPortfolioValue: summary10YearsSource.projectedPortfolioValue,
      directTaxCumulative: summary10YearsSource.directTaxCumulative,
      clubFeeCumulative: summary10YearsSource.clubFeeCumulative,
      deferredTaxCumulative: summary10YearsSource.deferredTaxCumulative,
      netTaxBenefitCumulative: summary10YearsSource.netTaxBenefitCumulative,
      averageTaxEfficiencyPercent: summary10YearsSource.averageTaxEfficiencyPercent,
    },
  };
}

function createScenarioComparisons(
  input: DividendTaxSimulationInput,
  sourceBreakdown: SourceCalculationResult[],
  totalAnnualDividends: number,
  irpfmDueCurrent: number,
): ScenarioComparisonResult[] {
  const corporate = estimateCorporateTaxes(input.business);
  const monthlyRuleSources = sourceBreakdown.filter((source) =>
    getSourceTaxTreatment(source.sourceType).monthlyDividendRule,
  );
  const annualFromRestructurableSources = monthlyRuleSources.reduce(
    (acc, source) => acc + source.annualGrossDividends,
    0,
  );
  const targetIncomeAnnual = estimatePartnerTargetAnnualDividends(
    input,
    annualFromRestructurableSources,
  );
  const fixedAnnualIncome = Math.max(0, totalAnnualDividends - targetIncomeAnnual);
  const irrfStatusQuo =
    annualFromRestructurableSources > 0
      ? monthlyRuleSources.reduce((acc, source) => acc + source.annualIrrf, 0)
      : input.residency === "nao_residente"
        ? targetIncomeAnnual * TAX_CONSTANTS.IRRF_ALIQUOTA
        : input.residency === "residente" &&
            targetIncomeAnnual / 12 > TAX_CONSTANTS.IRRF_LIMIAR_MENSAL
          ? targetIncomeAnnual * TAX_CONSTANTS.IRRF_ALIQUOTA
          : 0;

  const breakdownA = createScenarioBreakdown({
    irpj: corporate.irpj,
    csll: corporate.csll,
    pis: corporate.pis,
    cofins: corporate.cofins,
    simplesDAS: corporate.simplesDAS,
    irrfDividendos: irrfStatusQuo,
    irpfm: irpfmDueCurrent,
  });

  const totalTaxA = corporate.total + irrfStatusQuo + irpfmDueCurrent;
  const netToPartnerA = Math.max(
    0,
    targetIncomeAnnual + fixedAnnualIncome - irrfStatusQuo - irpfmDueCurrent,
  );
  const baseRateDenominatorA = Math.max(1, targetIncomeAnnual + fixedAnnualIncome + corporate.total);

  const proLaboreAnnual = Math.min(60_000, targetIncomeAnnual);
  const remainingAfterProLabore = Math.max(0, targetIncomeAnnual - proLaboreAnnual);
  const dividendsNoIrrfAnnual = Math.min(
    remainingAfterProLabore,
    TAX_CONSTANTS.IRRF_LIMIAR_MENSAL * 12,
  );
  const canUseAdditionalJcp =
    input.business.regimeTributario === "lucro_real" && !input.business.jaPagaJcp;
  const jcpAnnual = canUseAdditionalJcp
    ? Math.max(0, remainingAfterProLabore - dividendsNoIrrfAnnual)
    : 0;
  const dividendsTaxedAnnualB = Math.max(
    0,
    remainingAfterProLabore - dividendsNoIrrfAnnual - jcpAnnual,
  );
  const inssPatronal = proLaboreAnnual * TAX_CONSTANTS.INSS_PATRONAL;
  const inssSocio =
    Math.min(
      (proLaboreAnnual / 12) * TAX_CONSTANTS.INSS_EMPREGADO_ALIQUOTA,
      TAX_CONSTANTS.INSS_TETO_2026,
    ) * 12;

  const irrfDividendosB =
    input.residency === "nao_residente"
      ? (dividendsNoIrrfAnnual + dividendsTaxedAnnualB) * TAX_CONSTANTS.IRRF_ALIQUOTA
      : dividendsTaxedAnnualB > 0
        ? dividendsTaxedAnnualB * TAX_CONSTANTS.IRRF_ALIQUOTA
        : 0;
  const irrfJcp = jcpAnnual * TAX_CONSTANTS.JCP_IRRF;
  const beneficioFiscalJcp = jcpAnnual * TAX_CONSTANTS.REDUTOR_TETO_GERAL;

  const irpfmB = calculateScenarioIrpfm(input, {
    taxableAnnualIncome: input.annualIncomes.otherTaxableAnnualIncome + proLaboreAnnual,
    exclusiveAnnualIncome: input.annualIncomes.otherExclusiveAnnualIncome + jcpAnnual,
    exemptAnnualIncome: input.annualIncomes.otherExemptAnnualIncome,
    dividendsAnnual: dividendsNoIrrfAnnual + dividendsTaxedAnnualB + fixedAnnualIncome,
    exclusionsAnnual: input.annualIncomes.excludedFromIrpfmAnnual,
    irrfCreditAnnual: irrfDividendosB,
  });

  const corporateTaxB = Math.max(0, corporate.total - beneficioFiscalJcp) + inssPatronal;
  const personalTaxB = inssSocio + irrfDividendosB + irrfJcp + irpfmB.due;
  const totalTaxB = corporateTaxB + personalTaxB;
  const netToPartnerB = Math.max(0, targetIncomeAnnual + fixedAnnualIncome - personalTaxB);

  const breakdownB = createScenarioBreakdown({
    irpj: corporate.irpj,
    csll: corporate.csll,
    pis: corporate.pis,
    cofins: corporate.cofins,
    simplesDAS: corporate.simplesDAS,
    inssPatronal,
    inssSocio,
    irrfDividendos: irrfDividendosB,
    irpfm: irpfmB.due,
    irrfJcp,
    beneficioFiscalJcp,
  });

  const holdingDistributionAnnual = Math.min(
    targetIncomeAnnual,
    TAX_CONSTANTS.IRRF_LIMIAR_MENSAL * 12,
  );
  const deferredAnnual = Math.max(0, targetIncomeAnnual - holdingDistributionAnnual);
  const irrfDividendosC =
    input.residency === "nao_residente"
      ? holdingDistributionAnnual * TAX_CONSTANTS.IRRF_ALIQUOTA
      : 0;
  const irpfmC = calculateScenarioIrpfm(input, {
    taxableAnnualIncome: input.annualIncomes.otherTaxableAnnualIncome,
    exclusiveAnnualIncome: input.annualIncomes.otherExclusiveAnnualIncome,
    exemptAnnualIncome: input.annualIncomes.otherExemptAnnualIncome,
    dividendsAnnual: holdingDistributionAnnual + fixedAnnualIncome,
    exclusionsAnnual: input.annualIncomes.excludedFromIrpfmAnnual,
    irrfCreditAnnual: irrfDividendosC,
  });
  const holdingCostAnnual = input.business.temHolding
    ? 0
    : TAX_CONSTANTS.HOLDING_CUSTO_MENSAL_ESTIMADO * 12;
  const totalTaxC = corporate.total + irrfDividendosC + irpfmC.due + holdingCostAnnual;
  const netToPartnerC = Math.max(
    0,
    targetIncomeAnnual + fixedAnnualIncome - irrfDividendosC - irpfmC.due,
  );
  const deferredTaxAnnual = Math.max(
    0,
    irrfStatusQuo + irpfmDueCurrent - (irrfDividendosC + irpfmC.due),
  );

  const breakdownC = createScenarioBreakdown({
    irpj: corporate.irpj,
    csll: corporate.csll,
    pis: corporate.pis,
    cofins: corporate.cofins,
    simplesDAS: corporate.simplesDAS,
    irrfDividendos: irrfDividendosC,
    irpfm: irpfmC.due,
    custoHolding: holdingCostAnnual,
  });

  const breakEvenMonthly = input.business.temHolding
    ? 0
    : Math.round(
        TAX_CONSTANTS.HOLDING_CUSTO_MENSAL_ESTIMADO /
          TAX_CONSTANTS.HOLDING_BREAK_EVEN_IRRF_ALIQUOTA,
      );
  const scenarioBDescription =
    jcpAnnual > 0
      ? "Pro-labore + dividendos limitados + JCP."
      : input.business.regimeTributario === "simples"
        ? "Pro-labore + dividendos ajustados (sem JCP no Simples)."
        : input.business.jaPagaJcp
          ? "Pro-labore + dividendos ajustados (JCP ja tratado no status atual)."
        : input.business.regimeTributario !== "lucro_real"
          ? "Pro-labore + dividendos ajustados (JCP nao dedutivel fora do Lucro Real)."
          : "Pro-labore + dividendos ajustados.";

  const scenarios: ScenarioComparisonResult[] = [
    {
      code: "A_STATUS_QUO",
      title: "Cenario A - Status Quo",
      description: "Remuneracao integral via dividendos.",
      totalTax: totalTaxA,
      totalTaxRate: (totalTaxA / baseRateDenominatorA) * 100,
      netToPartner: netToPartnerA,
      annualSavingsVsStatusQuo: 0,
      deferredTaxAnnual: 0,
      breakEvenMonthlyDividends: breakEvenMonthly,
      isBest: false,
      taxBreakdown: breakdownA,
    },
    {
      code: "B_MIX_OTIMIZADO",
      title: "Cenario B - Mix Otimizado",
      description: scenarioBDescription,
      totalTax: totalTaxB,
      totalTaxRate:
        (totalTaxB / Math.max(1, targetIncomeAnnual + fixedAnnualIncome + corporateTaxB)) * 100,
      netToPartner: netToPartnerB,
      annualSavingsVsStatusQuo: totalTaxA - totalTaxB,
      deferredTaxAnnual: Math.max(0, irrfStatusQuo - irrfDividendosB),
      breakEvenMonthlyDividends: breakEvenMonthly,
      isBest: false,
      taxBreakdown: breakdownB,
    },
    {
      code: "C_HOLDING",
      title: "Cenario C - Via Holding",
      description: "Diferimento via distribuicao controlada pela holding.",
      totalTax: totalTaxC,
      totalTaxRate:
        (totalTaxC / Math.max(1, targetIncomeAnnual + fixedAnnualIncome + corporate.total)) * 100,
      netToPartner: netToPartnerC,
      annualSavingsVsStatusQuo: totalTaxA - totalTaxC,
      deferredTaxAnnual,
      breakEvenMonthlyDividends: breakEvenMonthly,
      isBest: false,
      taxBreakdown: breakdownC,
    },
  ];

  const clube = input.business.clubeInvestimento;
  if (
    clube.enabled &&
    clube.portfolioValue >= TAX_CONSTANTS.CLUBE_VALOR_MINIMO &&
    clube.annualDeferredDistributions > 0
  ) {
    const clubAnnualEligibleAmount = Math.min(targetIncomeAnnual, clube.annualDeferredDistributions);
    const personalAnnualWithClub = Math.max(0, targetIncomeAnnual - clubAnnualEligibleAmount);
    const monthlyWithClub = personalAnnualWithClub / 12;
    const irrfDividendosD =
      input.residency === "nao_residente"
        ? personalAnnualWithClub * TAX_CONSTANTS.IRRF_ALIQUOTA
        : input.residency === "residente" && monthlyWithClub > TAX_CONSTANTS.IRRF_LIMIAR_MENSAL
          ? personalAnnualWithClub * TAX_CONSTANTS.IRRF_ALIQUOTA
          : 0;

    const irpfmD = calculateScenarioIrpfm(input, {
      taxableAnnualIncome: input.annualIncomes.otherTaxableAnnualIncome,
      exclusiveAnnualIncome: input.annualIncomes.otherExclusiveAnnualIncome,
      exemptAnnualIncome: input.annualIncomes.otherExemptAnnualIncome,
      dividendsAnnual: personalAnnualWithClub + fixedAnnualIncome,
      exclusionsAnnual: input.annualIncomes.excludedFromIrpfmAnnual,
      irrfCreditAnnual: irrfDividendosD,
    });

    const clubCostAnnual = calculateClubAnnualCost(clube);
    const totalTaxD = corporate.total + irrfDividendosD + irpfmD.due + clubCostAnnual;
    const netToPartnerD = Math.max(
      0,
      targetIncomeAnnual + fixedAnnualIncome - irrfDividendosD - irpfmD.due,
    );
    const deferredTaxClubAnnual = Math.max(
      0,
      irrfStatusQuo + irpfmDueCurrent - (irrfDividendosD + irpfmD.due),
    );
    const clubBreakEvenMonthly = Math.round(
      (clubCostAnnual / 12) / TAX_CONSTANTS.HOLDING_BREAK_EVEN_IRRF_ALIQUOTA,
    );

    const breakdownD = createScenarioBreakdown({
      irpj: corporate.irpj,
      csll: corporate.csll,
      pis: corporate.pis,
      cofins: corporate.cofins,
      simplesDAS: corporate.simplesDAS,
      irrfDividendos: irrfDividendosD,
      irpfm: irpfmD.due,
      custoClube: clubCostAnnual,
    });

    scenarios.push({
      code: "D_CLUBE",
      title: "Cenario D - Clube de Investimento",
      description: "Parcela da carteira migrada para clube com reinvestimento e diferimento.",
      totalTax: totalTaxD,
      totalTaxRate:
        (totalTaxD / Math.max(1, targetIncomeAnnual + fixedAnnualIncome + corporate.total)) * 100,
      netToPartner: netToPartnerD,
      annualSavingsVsStatusQuo: totalTaxA - totalTaxD,
      deferredTaxAnnual: deferredTaxClubAnnual,
      breakEvenMonthlyDividends: clubBreakEvenMonthly,
      isBest: false,
      taxBreakdown: breakdownD,
    });
  }

  const bestScenario = scenarios.reduce((best, current) =>
    current.totalTax < best.totalTax ? current : best,
  );

  return scenarios.map((scenario) => ({
    ...scenario,
    isBest: scenario.code === bestScenario.code,
  }));
}

function createRegimeSimulation(
  input: DividendTaxSimulationInput,
  sourceBreakdown: SourceCalculationResult[],
  totalAnnualDividends: number,
): RegimeSimulationResult[] {
  const regimes: BusinessTaxRegime[] = ["simples", "lucro_presumido", "lucro_real"];
  const annualFromRestructurableSources = sourceBreakdown
    .filter((source) => getSourceTaxTreatment(source.sourceType).monthlyDividendRule)
    .reduce((acc, source) => acc + source.annualGrossDividends, 0);
  const irrfFromCurrentSourcePattern = sourceBreakdown.reduce(
    (acc, source) => acc + source.annualIrrf,
    0,
  );

  const results = regimes.map((regime) => {
    const corporate = estimateCorporateTaxes(input.business, regime);
    const targetIncomeAnnual = estimatePartnerTargetAnnualDividends(input, totalAnnualDividends);
    const irrf =
      annualFromRestructurableSources > 0
        ? irrfFromCurrentSourcePattern
        : input.residency === "nao_residente"
          ? targetIncomeAnnual * TAX_CONSTANTS.IRRF_ALIQUOTA
          : input.residency === "residente" &&
              targetIncomeAnnual / 12 > TAX_CONSTANTS.IRRF_LIMIAR_MENSAL
            ? targetIncomeAnnual * TAX_CONSTANTS.IRRF_ALIQUOTA
            : 0;

    const irpfm = calculateScenarioIrpfm(input, {
      taxableAnnualIncome: input.annualIncomes.otherTaxableAnnualIncome,
      exclusiveAnnualIncome: input.annualIncomes.otherExclusiveAnnualIncome,
      exemptAnnualIncome: input.annualIncomes.otherExemptAnnualIncome,
      dividendsAnnual: targetIncomeAnnual,
      exclusionsAnnual: input.annualIncomes.excludedFromIrpfmAnnual,
      irrfCreditAnnual: irrf,
    });

    const personalTax = irrf + irpfm.due;
    const totalTax = corporate.total + personalTax;

    return {
      regime,
      totalTax,
      totalTaxRate: (totalTax / Math.max(1, targetIncomeAnnual + corporate.total)) * 100,
      corporateTax: corporate.total,
      personalTax,
      estimatedNetToPartner: Math.max(0, targetIncomeAnnual - personalTax),
      breakdown: createScenarioBreakdown({
        irpj: corporate.irpj,
        csll: corporate.csll,
        pis: corporate.pis,
        cofins: corporate.cofins,
        simplesDAS: corporate.simplesDAS,
        irrfDividendos: irrf,
        irpfm: irpfm.due,
      }),
      isBest: false,
    } satisfies RegimeSimulationResult;
  });

  const best = results.reduce((bestResult, current) =>
    current.totalTax < bestResult.totalTax ? current : bestResult,
  );
  return results.map((result) => ({ ...result, isBest: result.regime === best.regime }));
}

export function calculateDividendTax(
  input: DividendTaxSimulationInput,
): DividendTaxSimulationResult {
  const sourceBreakdown = calculateSourceBreakdown(input);
  const totalAnnualDividends = sourceBreakdown.reduce(
    (acc, source) => acc + source.annualGrossDividends,
    0,
  );
  const irrfAnnualTotal = sourceBreakdown.reduce((acc, source) => acc + source.annualIrrf, 0);
  const irrfMonthlyTotal = sourceBreakdown.reduce((acc, source) => acc + source.monthlyIrrf, 0);

  const incomeComposition = calculateIncomeComposition(input, sourceBreakdown);
  const irpfmBaseAnnual = incomeComposition.baseIrpfmAnual;
  const irpfmRate = input.residency === "pj" ? 0 : calculateIrpfmRate(irpfmBaseAnnual);
  const irpfmGross = irpfmBaseAnnual * irpfmRate;

  const progressiveCredit =
    input.deductions.irpfProgressivePaid > 0
      ? input.deductions.irpfProgressivePaid
      : calculateIrpfProgressiveAnnual(input.annualIncomes.otherTaxableAnnualIncome);

  const irrfDividendosCredit = input.deductions.includeCalculatedIrrfCredit
    ? irrfAnnualTotal
    : 0;
  const deductionsWithoutRedutor =
    progressiveCredit +
    irrfDividendosCredit +
    input.deductions.additionalIrrfCredits +
    input.deductions.offshorePaid +
    input.deductions.definitivePaid +
    input.deductions.manualOtherDeductions;

  const irpfmAfterDeductions = Math.max(0, irpfmGross - deductionsWithoutRedutor);
  const redutorResult = calculateRedutor(input, irpfmRate, irpfmAfterDeductions);
  const irpfmDue = Math.max(0, irpfmAfterDeductions - redutorResult.redutorTotal);

  const deductionsTotal = deductionsWithoutRedutor + redutorResult.redutorTotal;
  const totalTaxDue = irrfAnnualTotal + irpfmDue;
  const netAnnualDividends = Math.max(0, totalAnnualDividends - totalTaxDue);
  const impactPercentage =
    totalAnnualDividends > 0 ? (totalTaxDue / totalAnnualDividends) * 100 : 0;

  const deductionsBreakdown: IrpfmDeductionBreakdown = {
    irpfProgressivo: progressiveCredit,
    irrfDividendos: irrfDividendosCredit,
    outrosCreditosIrrf: input.deductions.additionalIrrfCredits,
    offshore: input.deductions.offshorePaid,
    tributacaoDefinitiva: input.deductions.definitivePaid,
    outrasDeducoes: input.deductions.manualOtherDeductions,
    redutorTotal: redutorResult.redutorTotal,
    deducoesSemRedutor: deductionsWithoutRedutor,
    deducoesTotais: deductionsTotal,
  };

  const formulaAliquota =
    irpfmBaseAnnual <= TAX_CONSTANTS.IRPFM_LIMIAR_INFERIOR
      ? "Renda anual ate R$ 600.000 -> aliquota 0%"
      : irpfmBaseAnnual >= TAX_CONSTANTS.IRPFM_LIMIAR_SUPERIOR
        ? "Renda anual >= R$ 1.200.000 -> aliquota teto 10%"
        : "Aliquota = ((Renda - 600.000) / 600.000) x 10%";

  const scenarios = createScenarioComparisons(input, sourceBreakdown, totalAnnualDividends, irpfmDue);
  const clubScenario = scenarios.find((scenario) => scenario.code === "D_CLUBE");
  const clubProjection = clubScenario
    ? createClubProjection(input.business.clubeInvestimento, clubScenario.deferredTaxAnnual)
    : null;
  const regimeSimulation = createRegimeSimulation(input, sourceBreakdown, totalAnnualDividends);

  const assumptions: string[] = [
    "Simulacao educacional baseada na Lei 15.270/2025 e parametros informados.",
    "No cenario B foi assumido pro-labore de R$ 5.000/mes com limite de dividendos em R$ 50.000/mes.",
    input.business.temHolding
      ? "No cenario C foi assumido que a holding ja existe no grupo, sem custo incremental de estrutura."
      : "No cenario C foi assumido diferimento via holding com custo mensal estimado de R$ 1.500.",
    "Resultados nao substituem parecer juridico/contabil individual.",
  ];

  if (input.business.clubeInvestimento.enabled) {
    assumptions.splice(
      assumptions.length - 1,
      0,
      `No cenario D foi assumido clube com patrimonio inicial de ${formatCurrency(input.business.clubeInvestimento.portfolioValue)}, taxa anual de ${formatPercent(input.business.clubeInvestimento.brokerageFeePercent)} e diferimento sobre ${formatCurrency(input.business.clubeInvestimento.annualDeferredDistributions)} por ano.`,
    );
    assumptions.splice(
      assumptions.length - 1,
      0,
      "No dashboard do clube, o beneficio representa diferimento (adiamento) de imposto; tributacao de resgate/saida nao foi modelada.",
    );
    if (
      input.business.clubeInvestimento.stockAllocationPercent <
      TAX_CONSTANTS.CLUBE_ACOES_MIN_PERCENTUAL
    ) {
      assumptions.splice(
        assumptions.length - 1,
        0,
        "Como a carteira informada do clube ficou abaixo de 67% em acoes, a tributacao de referencia pode migrar para regra de fundos e deve ser validada com contador/tributarista.",
      );
    }
  }

  const warnings: string[] = [];
  if (input.enableRedutor && input.redutorCompanies.length === 0) {
    warnings.push("Redutor ativado sem empresas informadas. Nenhum credito redutor aplicado.");
  }
  if (
    input.business.clubeInvestimento.enabled &&
    input.business.clubeInvestimento.participantsCount < TAX_CONSTANTS.CLUBE_MIN_COTISTAS
  ) {
    warnings.push(
      "Clube de investimento exige ao menos 3 cotistas. Ajuste a premissa antes de usar o cenario D em decisao real.",
    );
  }
  if (
    input.business.clubeInvestimento.enabled &&
    input.business.clubeInvestimento.portfolioValue < TAX_CONSTANTS.CLUBE_VALOR_MINIMO
  ) {
    warnings.push(
      `Nesta calculadora, o cenario D so e liberado a partir de ${formatCurrency(TAX_CONSTANTS.CLUBE_VALOR_MINIMO)} em bolsa.`,
    );
  }
  if (
    input.business.clubeInvestimento.enabled &&
    (input.business.clubeInvestimento.brokerageFeePercent < TAX_CONSTANTS.CLUBE_TAXA_MIN_PERCENTUAL ||
      input.business.clubeInvestimento.brokerageFeePercent >
        TAX_CONSTANTS.CLUBE_TAXA_MAX_PERCENTUAL)
  ) {
    warnings.push(
      `A taxa anual do clube deve ficar entre ${formatPercent(TAX_CONSTANTS.CLUBE_TAXA_MIN_PERCENTUAL)} e ${formatPercent(TAX_CONSTANTS.CLUBE_TAXA_MAX_PERCENTUAL)} nesta simulacao.`,
    );
  }
  warnings.push(...redutorResult.warnings);

  const partialResult: DividendTaxSimulationResult = {
    totalAnnualDividends,
    irrfAnnualTotal,
    irrfMonthlyTotal,
    irpfmBaseAnnual,
    irpfmRate,
    irpfmGross,
    deductionsTotal,
    irpfmAfterDeductions,
    redutorTotal: redutorResult.redutorTotal,
    irpfmDue,
    totalTaxDue,
    netAnnualDividends,
    impactPercentage,
    incomeComposition,
    irpfmSteps: {
      sujeitoIrpfm: irpfmBaseAnnual > TAX_CONSTANTS.IRPFM_LIMIAR_INFERIOR,
      rendaTotalAnual: irpfmBaseAnnual,
      aliquotaAplicavel: irpfmRate,
      aliquotaAplicavelPercentual: irpfmRate * 100,
      formulaAliquota,
      irpfmBruto: irpfmGross,
      deducoes: deductionsBreakdown,
      irpfmDevido: irpfmDue,
    },
    sourceBreakdown,
    redutorBreakdown: redutorResult.breakdown,
    scenarios,
    clubProjection,
    regimeSimulation,
    alerts: [],
    warnings,
    assumptions,
  };

  const alerts = generateDividendTaxAlerts(input, partialResult);
  return {
    ...partialResult,
    alerts,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
