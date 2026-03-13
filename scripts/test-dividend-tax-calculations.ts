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
  assert.ok(alertCodes.has("fii_excluido_irpfm"));
  assert.ok(alertCodes.has("nao_residente_irrf"));
  assert.ok(alertCodes.has("simples_inseguranca_juridica"));
  assert.ok(alertCodes.has("oportunidade_holding"));
  console.log("PASS: Engine de alertas contextuais");
}

function runDividendTaxTests() {
  console.log("Running dividend-tax calculations tests...\n");
  testIrrfDegrauThreshold();
  testIrrfNonResident();
  testIrpfmRateBands();
  testRedutorCappingAndZeroDue();
  testScenariosAreComparable();
  testInvestmentClubScenario();
  testAlertsEngineCoverage();
  console.log("\nAll dividend-tax tests passed.");
}

if (require.main === module) {
  runDividendTaxTests();
}

export { runDividendTaxTests };
