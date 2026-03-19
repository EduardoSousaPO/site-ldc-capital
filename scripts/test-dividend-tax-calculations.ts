import assert from "node:assert/strict";
import { calculateDividendTax } from "../src/lib/dividend-tax/calculator";
import type { DividendTaxSimulationInput } from "../src/lib/dividend-tax/types";

function assertAlmostEqual(actual: number, expected: number, tolerance = 0.01) {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected} (diff: ${diff})`,
  );
}

function createBaseInput(): DividendTaxSimulationInput {
  return {
    residency: "residente",
    sources: [
      {
        id: "src-1",
        name: "Empresa A",
        monthlyAmount: 0,
        monthsReceived: 12,
        sourceType: "empresa_brasil",
      },
    ],
    annualIncomes: {
      otherTaxableAnnualIncome: 0,
      otherExclusiveAnnualIncome: 0,
      otherExemptAnnualIncome: 0,
      excludedFromIrpfmAnnual: 0,
    },
    deductions: {
      includeCalculatedIrrfCredit: true,
      additionalIrrfCredits: 0,
      irpfProgressivePaid: 0,
      offshorePaid: 0,
      definitivePaid: 0,
      manualOtherDeductions: 0,
    },
    enableRedutor: false,
    redutorCompanies: [],
    business: {
      regimeTributario: "lucro_presumido",
      atividadePrincipal: "servicos_geral",
      faturamentoAnual: 2_400_000,
      margemLucroPercentual: 35,
      folhaAnual: 300_000,
      numeroSocios: 1,
      participacaoSocioPercentual: 100,
      percentualDistribuicaoLucro: 100,
      jaPagaJcp: false,
      temHolding: false,
      clubeInvestimento: {
        enabled: false,
        portfolioValue: 0,
        annualDeferredDistributions: 0,
        participantsCount: 3,
        stockAllocationPercent: 67,
        brokerageFeePercent: 0.75,
        annualGrowthPercent: 8,
      },
    },
  };
}

function testIrrfDegrauThreshold() {
  const base = createBaseInput();

  const atThreshold = calculateDividendTax({
    ...base,
    sources: [{ ...base.sources[0], monthlyAmount: 50_000 }],
  });
  assert.equal(atThreshold.irrfMonthlyTotal, 0);
  assert.equal(atThreshold.irrfAnnualTotal, 0);

  const aboveThreshold = calculateDividendTax({
    ...base,
    sources: [{ ...base.sources[0], monthlyAmount: 50_001 }],
  });

  assertAlmostEqual(aboveThreshold.irrfMonthlyTotal, 5_000.1);
  assertAlmostEqual(aboveThreshold.irrfAnnualTotal, 60_001.2);
  console.log("PASS: IRRF efeito degrau por fonte");
}

function testIrrfNonResident() {
  const base = createBaseInput();
  const result = calculateDividendTax({
    ...base,
    residency: "nao_residente",
    sources: [{ ...base.sources[0], monthlyAmount: 1_000 }],
  });

  assertAlmostEqual(result.irrfMonthlyTotal, 100);
  assertAlmostEqual(result.irrfAnnualTotal, 1_200);
  console.log("PASS: IRRF para nao residente sem limiar");
}

function testIrpfmRateBands() {
  const base = createBaseInput();

  const belowTrigger = calculateDividendTax({
    ...base,
    annualIncomes: {
      ...base.annualIncomes,
      otherTaxableAnnualIncome: 600_000,
    },
  });
  assert.equal(belowTrigger.irpfmRate, 0);
  assert.equal(belowTrigger.irpfmGross, 0);

  const ramp = calculateDividendTax({
    ...base,
    annualIncomes: {
      ...base.annualIncomes,
      otherTaxableAnnualIncome: 900_000,
    },
    deductions: {
      ...base.deductions,
      includeCalculatedIrrfCredit: false,
      irpfProgressivePaid: 0,
    },
  });
  assertAlmostEqual(ramp.irpfmRate, 0.05, 0.000001);
  assertAlmostEqual(ramp.irpfmGross, 45_000, 0.01);

  const topBand = calculateDividendTax({
    ...base,
    annualIncomes: {
      ...base.annualIncomes,
      otherTaxableAnnualIncome: 1_200_000,
    },
    deductions: {
      ...base.deductions,
      includeCalculatedIrrfCredit: false,
      irpfProgressivePaid: 0,
    },
  });
  assertAlmostEqual(topBand.irpfmRate, 0.1, 0.000001);
  assertAlmostEqual(topBand.irpfmGross, 120_000, 0.01);

  console.log("PASS: Faixas de aliquota do IRPFM");
}

function testRedutorCappingAndZeroDue() {
  const base = createBaseInput();
  const result = calculateDividendTax({
    ...base,
    annualIncomes: {
      ...base.annualIncomes,
      otherTaxableAnnualIncome: 0,
      otherExemptAnnualIncome: 1_200_000,
    },
    deductions: {
      ...base.deductions,
      includeCalculatedIrrfCredit: false,
      irpfProgressivePaid: 0,
    },
    enableRedutor: true,
    redutorCompanies: [
      {
        id: "red-1",
        name: "Empresa Operacional",
        companyType: "geral",
        lucroContabil: 1_000_000,
        irpjCsllPaid: 450_000,
        dividendsPaidToBeneficiary: 1_000_000,
      },
    ],
  });

  assertAlmostEqual(result.irpfmGross, 120_000, 0.01);
  assertAlmostEqual(result.redutorTotal, 120_000, 0.01);
  assertAlmostEqual(result.irpfmDue, 0, 0.01);
  console.log("PASS: Redutor limitado ao IRPFM devido");
}

function testScenariosAreComparable() {
  const base = createBaseInput();
  const result = calculateDividendTax({
    ...base,
    sources: [{ ...base.sources[0], monthlyAmount: 120_000 }],
    annualIncomes: {
      ...base.annualIncomes,
      otherTaxableAnnualIncome: 120_000,
    },
  });

  assert.equal(result.scenarios.length, 3);
  const scenarioA = result.scenarios.find((item) => item.code === "A_STATUS_QUO");
  const scenarioB = result.scenarios.find((item) => item.code === "B_MIX_OTIMIZADO");
  const scenarioC = result.scenarios.find((item) => item.code === "C_HOLDING");

  assert.ok(scenarioA && scenarioB && scenarioC, "All scenarios must be returned");
  assert.ok(
    Math.min(scenarioB.totalTax, scenarioC.totalTax) <= scenarioA.totalTax,
    "Expected at least one optimized scenario to be <= status quo",
  );
  assert.ok(result.scenarios.some((item) => item.isBest), "Expected a best scenario flag");
  console.log("PASS: Comparativo de cenarios A/B/C");
}

function testScenarioStatusQuoRespectsSourceThresholdPerSource() {
  const base = createBaseInput();
  const result = calculateDividendTax({
    ...base,
    sources: [
      {
        id: "src-main",
        name: "Empresa principal",
        monthlyAmount: 50_000,
        monthsReceived: 12,
        sourceType: "empresa_brasil",
      },
      {
        id: "src-extra",
        name: "Carteira de acoes",
        monthlyAmount: 7_500,
        monthsReceived: 12,
        sourceType: "empresa_brasil",
      },
    ],
    business: {
      ...base.business,
      regimeTributario: "lucro_real",
      faturamentoAnual: 1_875_000,
      margemLucroPercentual: 32,
    },
  });

  const scenarioA = result.scenarios.find((item) => item.code === "A_STATUS_QUO");
  const scenarioB = result.scenarios.find((item) => item.code === "B_MIX_OTIMIZADO");
  const scenarioC = result.scenarios.find((item) => item.code === "C_HOLDING");

  assert.ok(scenarioA && scenarioB && scenarioC, "Expected scenarios A/B/C");
  assertAlmostEqual(result.irrfAnnualTotal, 0, 0.01);
  assertAlmostEqual(scenarioA?.taxBreakdown.irrfDividendos || 0, 0, 0.01);
  assertAlmostEqual(scenarioA?.taxBreakdown.irpfm || 0, result.irpfmDue, 0.01);
  assert.ok(
    (scenarioB?.annualSavingsVsStatusQuo || 0) <= 0 &&
      (scenarioC?.annualSavingsVsStatusQuo || 0) <= 0,
    "Expected no artificial savings when all sources stay at or below R$ 50 mil por fonte",
  );
  console.log("PASS: Cenario A respeita limiar por fonte no status quo");
}

function testRegimeSimulationRespectsSourcePattern() {
  const base = createBaseInput();
  const result = calculateDividendTax({
    ...base,
    sources: [
      {
        id: "src-main",
        name: "Empresa principal",
        monthlyAmount: 50_000,
        monthsReceived: 12,
        sourceType: "empresa_brasil",
      },
      {
        id: "src-extra",
        name: "Carteira de acoes",
        monthlyAmount: 7_500,
        monthsReceived: 12,
        sourceType: "empresa_brasil",
      },
    ],
    annualIncomes: {
      ...base.annualIncomes,
      otherTaxableAnnualIncome: 0,
      otherExclusiveAnnualIncome: 0,
      otherExemptAnnualIncome: 0,
    },
    deductions: {
      ...base.deductions,
      includeCalculatedIrrfCredit: true,
      irpfProgressivePaid: 0,
    },
  });

  assertAlmostEqual(result.irrfAnnualTotal, 0, 0.01);
  result.regimeSimulation.forEach((regime) => {
    assertAlmostEqual(regime.breakdown.irrfDividendos, 0, 0.01);
    assertAlmostEqual(regime.personalTax, result.irpfmDue, 0.01);
  });
  console.log("PASS: Simulador de regimes respeita padrao por fonte");
}

function testInvestmentClubScenario() {
  const base = createBaseInput();
  const result = calculateDividendTax({
    ...base,
    sources: [{ ...base.sources[0], monthlyAmount: 120_000 }],
    annualIncomes: {
      ...base.annualIncomes,
      otherTaxableAnnualIncome: 120_000,
    },
    business: {
      ...base.business,
      clubeInvestimento: {
        enabled: true,
        portfolioValue: 1_500_000,
        annualDeferredDistributions: 600_000,
        participantsCount: 3,
        stockAllocationPercent: 80,
        brokerageFeePercent: 0.75,
        annualGrowthPercent: 8,
      },
    },
  });

  const scenarioD = result.scenarios.find((item) => item.code === "D_CLUBE");
  assert.equal(result.scenarios.length, 4);
  assert.ok(scenarioD, "Expected investment club scenario to be returned");
  assert.ok(result.clubProjection, "Expected club projection to be returned");
  assert.ok(
    (scenarioD?.deferredTaxAnnual || 0) > 0,
    "Expected club scenario to create deferred tax potential",
  );
  assert.ok(
    (result.clubProjection?.summary10Years.netTaxBenefitCumulative || 0) >
      (result.clubProjection?.summary5Years.netTaxBenefitCumulative || 0),
    "Expected 10-year net benefit to exceed 5-year net benefit",
  );
  console.log("PASS: Cenario opcional de clube de investimento");
}

function testScenarioBRespectsJcpRules() {
  const base = createBaseInput();

  const simplesResult = calculateDividendTax({
    ...base,
    sources: [{ ...base.sources[0], monthlyAmount: 120_000 }],
    business: {
      ...base.business,
      regimeTributario: "simples",
      jaPagaJcp: false,
    },
  });
  const simplesScenarioB = simplesResult.scenarios.find((item) => item.code === "B_MIX_OTIMIZADO");
  assert.ok(simplesScenarioB, "Expected scenario B for Simples");
  assertAlmostEqual(simplesScenarioB?.taxBreakdown.irrfJcp || 0, 0, 0.01);
  assert.match(simplesScenarioB?.description || "", /sem JCP no Simples/i);

  const alreadyJcpResult = calculateDividendTax({
    ...base,
    sources: [{ ...base.sources[0], monthlyAmount: 120_000 }],
    business: {
      ...base.business,
      regimeTributario: "lucro_presumido",
      jaPagaJcp: true,
    },
  });
  const alreadyJcpScenarioB = alreadyJcpResult.scenarios.find((item) => item.code === "B_MIX_OTIMIZADO");
  assert.ok(alreadyJcpScenarioB, "Expected scenario B when company already pays JCP");
  assertAlmostEqual(alreadyJcpScenarioB?.taxBreakdown.irrfJcp || 0, 0, 0.01);
  assert.match(alreadyJcpScenarioB?.description || "", /JCP ja tratado/i);

  const presumidoResult = calculateDividendTax({
    ...base,
    sources: [{ ...base.sources[0], monthlyAmount: 120_000 }],
    business: {
      ...base.business,
      regimeTributario: "lucro_presumido",
      jaPagaJcp: false,
    },
  });
  const presumidoScenarioB = presumidoResult.scenarios.find((item) => item.code === "B_MIX_OTIMIZADO");
  assert.ok(presumidoScenarioB, "Expected scenario B in Lucro Presumido");
  assertAlmostEqual(presumidoScenarioB?.taxBreakdown.irrfJcp || 0, 0, 0.01);
  assertAlmostEqual(presumidoScenarioB?.taxBreakdown.beneficioFiscalJcp || 0, 0, 0.01);
  assert.match(presumidoScenarioB?.description || "", /fora do Lucro Real/i);
  console.log("PASS: Cenario B respeita regras de JCP");
}

function testScenarioBIncludesFullProLaboreInIrpfmBase() {
  const base = createBaseInput();
  const result = calculateDividendTax({
    ...base,
    sources: [{ ...base.sources[0], monthlyAmount: 55_000 }],
    business: {
      ...base.business,
      regimeTributario: "lucro_real",
      jaPagaJcp: false,
    },
  });

  const scenarioB = result.scenarios.find((item) => item.code === "B_MIX_OTIMIZADO");
  assert.ok(scenarioB, "Expected scenario B");
  assertAlmostEqual(scenarioB?.taxBreakdown.irpfm || 0, 6_600, 0.01);
  console.log("PASS: Cenario B inclui pro-labore integral na base do IRPFM");
}

function testHoldingIncrementalCostWhenAlreadyExists() {
  const base = createBaseInput();
  const commonInput: DividendTaxSimulationInput = {
    ...base,
    sources: [{ ...base.sources[0], monthlyAmount: 120_000 }],
    annualIncomes: {
      ...base.annualIncomes,
      otherTaxableAnnualIncome: 120_000,
    },
  };

  const withExistingHolding = calculateDividendTax({
    ...commonInput,
    business: {
      ...commonInput.business,
      temHolding: true,
    },
  });
  const withoutHolding = calculateDividendTax({
    ...commonInput,
    business: {
      ...commonInput.business,
      temHolding: false,
    },
  });

  const scenarioWithExistingHolding = withExistingHolding.scenarios.find(
    (item) => item.code === "C_HOLDING",
  );
  const scenarioWithoutHolding = withoutHolding.scenarios.find((item) => item.code === "C_HOLDING");

  assert.ok(scenarioWithExistingHolding, "Expected scenario C with existing holding");
  assert.ok(scenarioWithoutHolding, "Expected scenario C without holding");
  assertAlmostEqual(scenarioWithExistingHolding?.taxBreakdown.custoHolding || 0, 0, 0.01);
  assert.ok(
    (scenarioWithoutHolding?.taxBreakdown.custoHolding || 0) > 0,
    "Expected positive holding cost when structure does not exist",
  );
  console.log("PASS: Custo incremental da holding respeita checkbox");
}

function testAlertsEngineCoverage() {
  const base = createBaseInput();
  const result = calculateDividendTax({
    ...base,
    residency: "nao_residente",
    sources: [
      {
        id: "src-taxed",
        name: "Empresa Distribuidora",
        monthlyAmount: 120_000,
        monthsReceived: 12,
        sourceType: "empresa_brasil",
      },
      {
        id: "src-fii",
        name: "FII XPTO",
        monthlyAmount: 20_000,
        monthsReceived: 12,
        sourceType: "fii_fiagro",
      },
    ],
    business: {
      ...base.business,
      regimeTributario: "simples",
      temHolding: false,
    },
  });

  const alertCodes = new Set(result.alerts.map((item) => item.code));
  assert.ok(alertCodes.has("fontes_excluidas_irpfm"));
  assert.ok(alertCodes.has("nao_residente_irrf"));
  assert.ok(alertCodes.has("simples_inseguranca_juridica"));
  assert.ok(alertCodes.has("oportunidade_holding"));
  console.log("PASS: Engine de alertas contextuais");
}

function testFinancialSourceClassification() {
  const base = createBaseInput();
  const result = calculateDividendTax({
    ...base,
    sources: [
      {
        id: "src-cdb",
        name: "CDB Banco X",
        monthlyAmount: 10_000,
        monthsReceived: 12,
        sourceType: "cdb_rdb_tesouro_titulos",
      },
      {
        id: "src-infra",
        name: "Debenture Incentivada",
        monthlyAmount: 5_000,
        monthsReceived: 12,
        sourceType: "debentures_incentivadas_fi_infra",
      },
    ],
  });

  const cdb = result.sourceBreakdown.find((source) => source.id === "src-cdb");
  const infra = result.sourceBreakdown.find((source) => source.id === "src-infra");

  assert.ok(cdb, "Expected CDB source in breakdown");
  assert.ok(infra, "Expected infra source in breakdown");
  assert.equal(cdb?.monthlyIrrf, 0, "CDB should not use monthly dividend withholding rule");
  assert.equal(cdb?.annualIncludedInIrpfmBase, 120_000, "CDB should compose IRPFM base");
  assert.equal(infra?.annualIncludedInIrpfmBase, 0, "Incentivada should be excluded from base");
  console.log("PASS: Classificacao de fontes financeiras");
}

function runDividendTaxTests() {
  console.log("Running dividend-tax calculations tests...\n");
  testIrrfDegrauThreshold();
  testIrrfNonResident();
  testIrpfmRateBands();
  testRedutorCappingAndZeroDue();
  testScenariosAreComparable();
  testScenarioStatusQuoRespectsSourceThresholdPerSource();
  testRegimeSimulationRespectsSourcePattern();
  testInvestmentClubScenario();
  testScenarioBRespectsJcpRules();
  testScenarioBIncludesFullProLaboreInIrpfmBase();
  testHoldingIncrementalCostWhenAlreadyExists();
  testAlertsEngineCoverage();
  testFinancialSourceClassification();
  console.log("\nAll dividend-tax tests passed.");
}

if (require.main === module) {
  runDividendTaxTests();
}

export { runDividendTaxTests };
