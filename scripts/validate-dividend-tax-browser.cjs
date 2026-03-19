const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3200";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createPayload() {
  return {
    residency: "residente",
    sources: [
      {
        id: "empresa-principal",
        name: "Empresa principal",
        monthlyAmount: 120000,
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
      faturamentoAnual: 2400000,
      margemLucroPercentual: 35,
      folhaAnual: 300000,
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

async function runApiChecks() {
  const payload = createPayload();
  const calcResponse = await fetch(`${baseUrl}/api/dividend-tax/calculate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert(calcResponse.ok, `calculate endpoint failed with ${calcResponse.status}`);

  const calcJson = await calcResponse.json();
  assert(calcJson?.success === true, "calculate endpoint did not return success=true");
  assert(calcJson?.result?.totalTaxDue > 0, "calculate endpoint returned empty tax result");

  const reportResponse = await fetch(`${baseUrl}/api/dividend-tax/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input: payload,
      leadName: "Teste Codex",
    }),
  });
  assert(reportResponse.ok, `report endpoint failed with ${reportResponse.status}`);
  const reportType = reportResponse.headers.get("content-type") || "";
  assert(
    reportType.includes("application/pdf") || reportType.includes("text/html"),
    `unexpected report content-type: ${reportType}`,
  );

  const unique = Date.now();
  const leadResponse = await fetch(`${baseUrl}/api/dividend-tax/lead`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      nome: "Teste Codex",
      email: `teste-codex-${unique}@example.com`,
      telefone: "51999999999",
      consentimento: true,
      simulationSummary: {
        totalAnnualDividends: calcJson.result.totalAnnualDividends,
        totalTaxDue: calcJson.result.totalTaxDue,
        netAnnualDividends: calcJson.result.netAnnualDividends,
        impactPercentage: calcJson.result.impactPercentage,
      },
    }),
  });
  assert(leadResponse.ok, `lead endpoint failed with ${leadResponse.status}`);

  console.log("PASS: API /calculate, /report e /lead");
}

async function fillCurrencyInput(input, value) {
  await input.click();
  await input.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await input.fill(String(value));
}

async function runBrowserChecks() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/calculadora-tributacao-dividendos-2026`, {
    waitUntil: "networkidle",
  });

  const mainInput = page.locator("#dividend-simulation-form input").first();
  await fillCurrencyInput(mainInput, "120000");
  await page.getByRole("button", { name: "Ver meu impacto tributario" }).click();
  await page.getByText("Como pagar menos imposto sobre dividendos").waitFor({ timeout: 20000 });
  await page.getByText("Leve este diagnostico com voce").waitFor({ timeout: 20000 });

  await page.goto(`${baseUrl}/calculadora-tributacao-dividendos-2026`, {
    waitUntil: "networkidle",
  });
  await page
    .locator("xpath=//label[contains(., 'Tem mais fontes de renda/dividendos financeiros?')]/following::button[normalize-space()='Sim'][1]")
    .click();

  const detailedCard = page.locator("text=Quando voce preencher valores aqui").locator("..");
  const detailedInputs = detailedCard.locator("input");
  await fillCurrencyInput(detailedInputs.nth(0), "Empresa detalhada");
  await fillCurrencyInput(detailedInputs.nth(1), "60000");
  await page.getByRole("button", { name: "Ver meu impacto tributario" }).click();
  await page.getByText("Como pagar menos imposto sobre dividendos").waitFor({ timeout: 20000 });
  assert(
    !(await page.getByText("Preencha o valor da retirada para simular.").isVisible().catch(() => false)),
    "UI still blocks detailed-source scenario with zero main withdrawal",
  );

  console.log("PASS: fluxo browser com fonte principal e com fontes detalhadas");
  await browser.close();
}

async function main() {
  await runApiChecks();
  await runBrowserChecks();
  console.log("Dividend tax browser validation completed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
