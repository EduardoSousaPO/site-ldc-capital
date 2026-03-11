import type {
  AlertSeverity,
  DividendTaxSimulationInput,
  DividendTaxSimulationResult,
  ScenarioCode,
  ScenarioTaxBreakdown,
} from "@/lib/dividend-tax/types";
import { formatCurrency, formatPercent } from "@/lib/dividend-tax/calculator";

interface ReportMeta {
  leadName?: string;
  generatedAt?: Date;
  logoBase64?: string;
}

const SCENARIO_META: Record<
  ScenarioCode,
  { title: string; subtitle: string; idealFor: string; badge: string }
> = {
  A_STATUS_QUO: {
    title: "Cenario A",
    subtitle: "Nao mudar nada",
    idealFor: "Quem prefere manter o formato atual.",
    badge: "Base",
  },
  B_MIX_OTIMIZADO: {
    title: "Cenario B",
    subtitle: "Mix otimizado",
    idealFor: "Quem quer reduzir imposto sem abrir nova empresa.",
    badge: "Menor atrito",
  },
  C_HOLDING: {
    title: "Cenario C",
    subtitle: "Via holding",
    idealFor: "Quem aceita diferir retiradas para ganhar eficiencia.",
    badge: "Maior diferimento",
  },
};

const SCENARIO_ORDER: ScenarioCode[] = [
  "A_STATUS_QUO",
  "B_MIX_OTIMIZADO",
  "C_HOLDING",
];

const BREAKDOWN_ROWS: Array<{ key: keyof ScenarioTaxBreakdown; label: string }> = [
  { key: "irpj", label: "IRPJ" },
  { key: "csll", label: "CSLL" },
  { key: "pis", label: "PIS" },
  { key: "cofins", label: "COFINS" },
  { key: "simplesDAS", label: "DAS Simples" },
  { key: "inssPatronal", label: "INSS patronal" },
  { key: "inssSocio", label: "INSS socio" },
  { key: "irrfDividendos", label: "IRRF dividendos" },
  { key: "irrfJcp", label: "IRRF JCP" },
  { key: "irpfm", label: "IRPFM" },
  { key: "beneficioFiscalJcp", label: "Beneficio fiscal JCP" },
  { key: "custoHolding", label: "Custo holding" },
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function widthPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(2, Math.min(100, (value / max) * 100));
}

function severityLabel(severity: AlertSeverity): string {
  if (severity === "warning") return "Atencao";
  if (severity === "opportunity") return "Oportunidade";
  return "Positivo";
}

function severityClass(severity: AlertSeverity): string {
  if (severity === "warning") return "sev-warning";
  if (severity === "opportunity") return "sev-opportunity";
  return "sev-success";
}

export function generateDividendTaxReportHtml(
  input: DividendTaxSimulationInput,
  result: DividendTaxSimulationResult,
  meta?: ReportMeta,
): string {
  const generatedAt = meta?.generatedAt ?? new Date();
  const generatedAtText = generatedAt.toLocaleDateString("pt-BR");
  const leadName = meta?.leadName ? escapeHtml(meta.leadName) : "";
  const logoMarkup = meta?.logoBase64
    ? `<img src="${meta.logoBase64}" alt="LDC Capital" style="height:54px; width:auto;" />`
    : `<div class="logo-fallback">LDC Capital</div>`;

  const orderedScenarios = SCENARIO_ORDER.map((code) =>
    result.scenarios.find((scenario) => scenario.code === code),
  ).filter((scenario): scenario is NonNullable<typeof scenario> => Boolean(scenario));

  const orderedRegimes = ["simples", "lucro_presumido", "lucro_real"]
    .map((regime) => result.regimeSimulation.find((item) => item.regime === regime))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const bestScenario = orderedScenarios.find((scenario) => scenario.isBest) ?? orderedScenarios[0];
  const annualSavings = Math.max(0, bestScenario?.annualSavingsVsStatusQuo ?? 0);
  const beforeMonthlyNet = result.totalAnnualDividends / 12;
  const afterMonthlyTax = result.totalTaxDue / 12;
  const afterMonthlyNet = result.netAnnualDividends / 12;

  const sourceRows = result.sourceBreakdown
    .map(
      (source) => `
      <tr>
        <td>${escapeHtml(source.name)}</td>
        <td>${escapeHtml(source.sourceType)}</td>
        <td class="right">${formatCurrency(source.monthlyAmount)}</td>
        <td class="right">${source.monthsReceived}</td>
        <td class="right">${formatCurrency(source.annualGrossDividends)}</td>
        <td class="right">${formatCurrency(source.annualIrrf)}</td>
      </tr>
    `,
    )
    .join("");

  const incomeItems = [
    {
      label: "Rendimentos tributaveis",
      value: result.incomeComposition.rendimentosTributaveis,
      color: "#2b3550",
    },
    {
      label: "Dividendos",
      value: result.incomeComposition.dividendosTotais,
      color: "#8b9a46",
    },
    {
      label: "Rendimentos exclusivos",
      value: result.incomeComposition.rendimentosExclusivos,
      color: "#4f637f",
    },
    {
      label: "Rendimentos isentos",
      value: result.incomeComposition.rendimentosIsentos,
      color: "#577171",
    },
    {
      label: "Exclusoes",
      value: result.incomeComposition.exclusoesTotais,
      color: "#c94c4c",
    },
  ];
  const incomeMax = Math.max(1, ...incomeItems.map((item) => item.value));
  const incomeBars = incomeItems
    .map(
      (item) => `
      <div class="bar-row">
        <div class="bar-label">${item.label}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${widthPercent(item.value, incomeMax)}%; background:${item.color};"></div>
        </div>
        <div class="bar-value">${formatCurrency(item.value)}</div>
      </div>
    `,
    )
    .join("");

  const scenarioTaxMax = Math.max(1, ...orderedScenarios.map((scenario) => scenario.totalTax));
  const scenarioNetMax = Math.max(1, ...orderedScenarios.map((scenario) => scenario.netToPartner));

  const scenarioCards = orderedScenarios
    .map((scenario) => {
      const metaCard = SCENARIO_META[scenario.code];
      const scenarioTitle = `${metaCard.title} - ${metaCard.subtitle}`;
      const className = scenario.isBest ? "scenario-card recommended" : "scenario-card";

      return `
      <article class="${className}">
        <div class="scenario-top">
          <div>
            <h3>${scenarioTitle}</h3>
            <p class="scenario-badge">${scenario.isBest ? "Recomendado" : metaCard.badge}</p>
          </div>
          <p class="scenario-profile">${metaCard.idealFor}</p>
        </div>
        <div class="scenario-kpis">
          <div>
            <span>Imposto total</span>
            <strong>${formatCurrency(scenario.totalTax)}</strong>
          </div>
          <div>
            <span>Liquido ao socio</span>
            <strong>${formatCurrency(scenario.netToPartner)}</strong>
          </div>
          <div>
            <span>Economia vs A</span>
            <strong>${formatCurrency(Math.max(0, scenario.annualSavingsVsStatusQuo))}</strong>
          </div>
        </div>
        <div class="scenario-bars">
          <div class="mini-bar-row">
            <span>Imposto</span>
            <div class="mini-bar-track">
              <div class="mini-bar-fill tax" style="width:${widthPercent(
                scenario.totalTax,
                scenarioTaxMax,
              )}%"></div>
            </div>
            <span>${formatCurrency(scenario.totalTax)}</span>
          </div>
          <div class="mini-bar-row">
            <span>Liquido</span>
            <div class="mini-bar-track">
              <div class="mini-bar-fill net" style="width:${widthPercent(
                scenario.netToPartner,
                scenarioNetMax,
              )}%"></div>
            </div>
            <span>${formatCurrency(scenario.netToPartner)}</span>
          </div>
        </div>
      </article>
      `;
    })
    .join("");

  const scenarioBreakdownRows = BREAKDOWN_ROWS.map(
    (row) => `
      <tr>
        <td>${row.label}</td>
        ${orderedScenarios
          .map((scenario) => `<td class="right">${formatCurrency(scenario.taxBreakdown[row.key])}</td>`)
          .join("")}
      </tr>
    `,
  ).join("");

  const regimeTaxMax = Math.max(1, ...orderedRegimes.map((regime) => regime.totalTax));
  const regimeRows = orderedRegimes
    .map((regime) => {
      const regimeTitle = regime.regime.replaceAll("_", " ");
      const bestTag = regime.isBest ? "<span class=\"badge-tag\">MENOR CARGA</span>" : "";
      return `
      <tr>
        <td>${escapeHtml(regimeTitle)} ${bestTag}</td>
        <td class="right">${formatCurrency(regime.totalTax)}</td>
        <td class="right">${formatCurrency(regime.corporateTax)}</td>
        <td class="right">${formatCurrency(regime.personalTax)}</td>
        <td class="right">${formatPercent(regime.totalTaxRate)}</td>
      </tr>
      `;
    })
    .join("");

  const regimeBars = orderedRegimes
    .map(
      (regime) => `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(regime.regime.replaceAll("_", " "))}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${widthPercent(regime.totalTax, regimeTaxMax)}%; background:${
            regime.isBest ? "#8b9a46" : "#577171"
          };"></div>
        </div>
        <div class="bar-value">${formatCurrency(regime.totalTax)}</div>
      </div>
    `,
    )
    .join("");

  const alertItems = result.alerts
    .map(
      (alert) => `
      <li class="alert-item ${severityClass(alert.severity)}">
        <div class="alert-header">
          <span class="alert-pill">${severityLabel(alert.severity)}</span>
          <strong>${escapeHtml(alert.title)}</strong>
        </div>
        <p>${escapeHtml(alert.description)}</p>
        ${alert.suggestedAction ? `<p class="hint"><strong>Acao sugerida:</strong> ${escapeHtml(alert.suggestedAction)}</p>` : ""}
      </li>
    `,
    )
    .join("");

  const warnings = result.warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join("");
  const assumptions = result.assumptions
    .map((assumption) => `<li>${escapeHtml(assumption)}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatorio de Impacto Tributario - LDC Capital</title>
  <style>
    @page {
      size: A4;
      margin: 14mm;
    }
    :root {
      --bg: #f5f7f9;
      --card: #ffffff;
      --ink: #1f2a44;
      --muted: #5a677f;
      --line: #dfe5ea;
      --brand: #8b9a46;
      --brand-dark: #6b7a3d;
      --danger: #c94c4c;
      --success: #2f6b38;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: var(--ink);
      background: var(--bg);
      font-size: 11px;
      line-height: 1.5;
    }
    h1, h2, h3 {
      margin: 0;
      color: var(--ink);
      line-height: 1.2;
    }
    h1 { font-size: 21px; }
    h2 { font-size: 16px; margin-bottom: 8px; }
    h3 { font-size: 13px; margin-bottom: 6px; }
    p { margin: 0; }
    .report {
      display: grid;
      gap: 12px;
    }
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      border-bottom: 2px solid var(--brand);
      padding-bottom: 10px;
    }
    .logo-fallback {
      font-weight: 700;
      font-size: 16px;
      color: var(--brand-dark);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px 12px;
      background: #fff;
    }
    .sub {
      margin-top: 2px;
      color: var(--muted);
    }
    .hero {
      background: linear-gradient(135deg, #1f2a44 0%, #2b3a52 70%);
      color: #fff;
      border-radius: 12px;
      padding: 14px;
      display: grid;
      gap: 10px;
    }
    .hero-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 10px;
    }
    .hero-main {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 10px;
      padding: 10px;
    }
    .hero-main .big {
      display: block;
      font-size: 26px;
      font-weight: 700;
      margin: 2px 0;
      color: #ffd7d7;
    }
    .hero-side {
      display: grid;
      gap: 6px;
    }
    .kpi-mini {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      padding: 7px 8px;
    }
    .kpi-mini span {
      display: block;
      font-size: 10px;
      opacity: 0.9;
    }
    .kpi-mini strong {
      font-size: 14px;
    }
    .journey {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .journey-step {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 7px;
      background: #fafcfd;
    }
    .journey-step .n {
      font-weight: 700;
      color: var(--brand-dark);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .journey-step .t {
      margin-top: 2px;
      font-weight: 600;
      font-size: 11px;
    }
    .journey-step .d {
      margin-top: 2px;
      color: var(--muted);
      font-size: 10px;
    }
    .section {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px;
      page-break-inside: avoid;
    }
    .split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .box {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 9px;
      background: #fcfdfd;
    }
    .before-after {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .before-after .before, .before-after .after {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      background: #fff;
    }
    .before-after .after { border-color: #d9deca; background: #f8faf3; }
    .before-after .title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .5px;
      color: var(--muted);
      margin-bottom: 4px;
      font-weight: 700;
    }
    .line-item {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-top: 2px;
    }
    .line-item strong {
      white-space: nowrap;
    }
    .scenario-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .scenario-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      background: #fff;
      display: grid;
      gap: 6px;
    }
    .scenario-card.recommended {
      border: 2px solid var(--brand);
      background: #f7f9ef;
    }
    .scenario-top {
      display: grid;
      gap: 4px;
    }
    .scenario-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .35px;
      background: #eef2dd;
      color: #4f5d2c;
      border-radius: 999px;
      padding: 2px 7px;
    }
    .scenario-profile {
      color: var(--muted);
      font-size: 10px;
    }
    .scenario-kpis {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3px;
    }
    .scenario-kpis span {
      display: block;
      color: var(--muted);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .35px;
    }
    .scenario-kpis strong {
      font-size: 12px;
    }
    .scenario-bars {
      display: grid;
      gap: 4px;
    }
    .mini-bar-row {
      display: grid;
      grid-template-columns: 46px 1fr 90px;
      gap: 6px;
      align-items: center;
      font-size: 10px;
    }
    .mini-bar-track {
      height: 8px;
      border-radius: 999px;
      background: #e9eef2;
      overflow: hidden;
    }
    .mini-bar-fill {
      height: 8px;
      border-radius: 999px;
    }
    .mini-bar-fill.tax { background: var(--danger); }
    .mini-bar-fill.net { background: var(--success); }
    .bar-chart {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      background: #fff;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 150px 1fr 120px;
      gap: 8px;
      align-items: center;
      margin-bottom: 5px;
      font-size: 10px;
    }
    .bar-label {
      font-weight: 600;
      color: #34445f;
    }
    .bar-track {
      height: 9px;
      border-radius: 999px;
      background: #e8edf1;
      overflow: hidden;
    }
    .bar-fill {
      height: 9px;
      border-radius: 999px;
      background: var(--brand);
    }
    .bar-value {
      text-align: right;
      font-weight: 600;
      color: #263248;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-top: 6px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 6px 5px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f4f7fa;
      color: #36435b;
      font-weight: 700;
    }
    tbody tr:nth-child(even) td {
      background: #fcfdff;
    }
    .right {
      text-align: right;
    }
    .badge-tag {
      font-size: 8px;
      font-weight: 700;
      border-radius: 999px;
      background: #eef2dd;
      color: #4f5d2c;
      padding: 1px 5px;
      margin-left: 4px;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .step-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      background: #fff;
    }
    .step-card .k {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .4px;
      color: var(--muted);
      margin-bottom: 3px;
      font-weight: 700;
    }
    .step-card .v {
      font-size: 14px;
      font-weight: 700;
      color: #24324a;
    }
    .list {
      margin: 6px 0 0 16px;
      padding: 0;
    }
    .list li {
      margin-bottom: 4px;
    }
    .alert-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .alert-item {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      background: #fff;
    }
    .alert-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .alert-pill {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: .4px;
      border-radius: 999px;
      padding: 2px 6px;
      font-weight: 700;
    }
    .sev-warning .alert-pill { background: #fee2e2; color: #991b1b; }
    .sev-opportunity .alert-pill { background: #fef3c7; color: #92400e; }
    .sev-success .alert-pill { background: #dcfce7; color: #166534; }
    .hint {
      margin-top: 4px;
      color: #475569;
      font-size: 10px;
    }
    .page-break {
      page-break-before: always;
      margin-top: 0;
    }
    .footer {
      border-top: 1px solid var(--line);
      padding-top: 8px;
      color: #4d5a71;
      font-size: 9px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <main class="report">
    <header class="top-header">
      <div>
        <h1>Relatorio de Tributacao de Dividendos</h1>
        <p class="sub">Lei 15.270/2025 | Simulacao gerada em ${generatedAtText}</p>
        ${leadName ? `<p class="sub">Cliente: ${leadName}</p>` : ""}
      </div>
      ${logoMarkup}
    </header>

    <section class="hero">
      <div class="hero-grid">
        <div class="hero-main">
          <p>Impacto anual estimado com a nova regra</p>
          <span class="big">${formatCurrency(result.totalTaxDue)}</span>
          <p>Equivalente mensal: ${formatCurrency(afterMonthlyTax)}</p>
          <p>Economia potencial recomendada: ${formatCurrency(annualSavings)}</p>
        </div>
        <div class="hero-side">
          <div class="kpi-mini">
            <span>Dividendos anuais</span>
            <strong>${formatCurrency(result.totalAnnualDividends)}</strong>
          </div>
          <div class="kpi-mini">
            <span>Liquido projetado</span>
            <strong>${formatCurrency(result.netAnnualDividends)}</strong>
          </div>
          <div class="kpi-mini">
            <span>Aliquota efetiva</span>
            <strong>${formatPercent(result.impactPercentage)}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="journey">
      <div class="journey-step">
        <p class="n">Etapa 1</p>
        <p class="t">Diagnostico</p>
        <p class="d">Resumo executivo e impacto imediato.</p>
      </div>
      <div class="journey-step">
        <p class="n">Etapa 2</p>
        <p class="t">Composicao da renda</p>
        <p class="d">Quais blocos ativam IRRF e IRPFM.</p>
      </div>
      <div class="journey-step">
        <p class="n">Etapa 3</p>
        <p class="t">Estrategias</p>
        <p class="d">Comparativo A/B/C e recomendacao.</p>
      </div>
      <div class="journey-step">
        <p class="n">Etapa 4</p>
        <p class="t">Detalhamento tecnico</p>
        <p class="d">Regimes, IRPFM completo e alertas.</p>
      </div>
    </section>

    <section class="section">
      <h2>1. Impacto imediato (antes x depois)</h2>
      <div class="before-after">
        <div class="before">
          <p class="title">Antes (2025)</p>
          <div class="line-item"><span>Liquido mensal estimado</span><strong>${formatCurrency(beforeMonthlyNet)}</strong></div>
          <div class="line-item"><span>Imposto sobre dividendos</span><strong>${formatCurrency(0)}</strong></div>
        </div>
        <div class="after">
          <p class="title">Depois (2026)</p>
          <div class="line-item"><span>Liquido mensal estimado</span><strong>${formatCurrency(afterMonthlyNet)}</strong></div>
          <div class="line-item"><span>Imposto mensal total</span><strong>${formatCurrency(afterMonthlyTax)}</strong></div>
        </div>
      </div>
      <div class="split" style="margin-top:8px;">
        <div class="box">
          <p><strong>Melhor cenario atual:</strong> ${escapeHtml(bestScenario?.title || "N/A")}</p>
          <p class="sub">Economia anual potencial vs status quo: ${formatCurrency(annualSavings)}</p>
        </div>
        <div class="box">
          <p><strong>Regime informado:</strong> ${escapeHtml(input.business.regimeTributario)}</p>
          <p class="sub">Atividade principal: ${escapeHtml(input.business.atividadePrincipal)}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>2. Composicao da renda e gatilhos de imposto</h2>
      <div class="split">
        <div class="bar-chart">
          ${incomeBars}
        </div>
        <div class="box">
          <p><strong>IRRF anual total:</strong> ${formatCurrency(result.irrfAnnualTotal)}</p>
          <p><strong>IRPFM devido:</strong> ${formatCurrency(result.irpfmDue)}</p>
          <p><strong>Base IRPFM:</strong> ${formatCurrency(result.irpfmBaseAnnual)}</p>
          <p><strong>Aliquota IRPFM:</strong> ${formatPercent(result.irpfmRate * 100)}</p>
          <p><strong>Redutor aplicado:</strong> ${formatCurrency(result.redutorTotal)}</p>
          <p class="sub" style="margin-top:6px;">
            Renda global bruta: ${formatCurrency(result.incomeComposition.rendaGlobalBruta)} |
            Exclusoes totais: ${formatCurrency(result.incomeComposition.exclusoesTotais)}
          </p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Fonte pagadora</th>
            <th>Tipo</th>
            <th class="right">Mensal</th>
            <th class="right">Meses</th>
            <th class="right">Anual</th>
            <th class="right">IRRF anual</th>
          </tr>
        </thead>
        <tbody>
          ${sourceRows || `<tr><td colspan="6">Sem fontes informadas.</td></tr>`}
        </tbody>
      </table>
    </section>

    <div class="page-break"></div>

    <section class="section">
      <h2>3. Cenarios estrategicos (A, B e C)</h2>
      <div class="scenario-grid">
        ${scenarioCards}
      </div>
    </section>

    <section class="section">
      <h2>Detalhamento tributario por cenario</h2>
      <table>
        <thead>
          <tr>
            <th>Linha</th>
            ${orderedScenarios
              .map((scenario) => `<th class="right">${SCENARIO_META[scenario.code].title}</th>`)
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${scenarioBreakdownRows}
          <tr>
            <td><strong>Total</strong></td>
            ${orderedScenarios
              .map((scenario) => `<td class="right"><strong>${formatCurrency(scenario.totalTax)}</strong></td>`)
              .join("")}
          </tr>
          <tr>
            <td><strong>Aliquota efetiva</strong></td>
            ${orderedScenarios
              .map((scenario) => `<td class="right"><strong>${formatPercent(scenario.totalTaxRate)}</strong></td>`)
              .join("")}
          </tr>
        </tbody>
      </table>
    </section>

    <div class="page-break"></div>

    <section class="section">
      <h2>4. Simulador de regime tributario</h2>
      <div class="split">
        <div class="bar-chart">
          ${regimeBars}
        </div>
        <div class="box">
          <p><strong>Objetivo:</strong> comparar carga total de empresa + socio por regime.</p>
          <p class="sub" style="margin-top:4px;">
            Regime com menor carga: ${
              orderedRegimes.find((regime) => regime.isBest)
                ? escapeHtml(orderedRegimes.find((regime) => regime.isBest)!.regime.replaceAll("_", " "))
                : "N/A"
            }.
          </p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Regime</th>
            <th class="right">Carga total</th>
            <th class="right">Tributo PJ</th>
            <th class="right">Tributo PF</th>
            <th class="right">Aliquota total</th>
          </tr>
        </thead>
        <tbody>
          ${regimeRows}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>5. Calculo IRPFM passo a passo</h2>
      <div class="steps-grid">
        <div class="step-card">
          <p class="k">Base anual</p>
          <p class="v">${formatCurrency(result.irpfmSteps.rendaTotalAnual)}</p>
        </div>
        <div class="step-card">
          <p class="k">Aliquota aplicavel</p>
          <p class="v">${formatPercent(result.irpfmSteps.aliquotaAplicavelPercentual)}</p>
        </div>
        <div class="step-card">
          <p class="k">IRPFM bruto</p>
          <p class="v">${formatCurrency(result.irpfmSteps.irpfmBruto)}</p>
        </div>
        <div class="step-card">
          <p class="k">Deducoes sem redutor</p>
          <p class="v">${formatCurrency(result.irpfmSteps.deducoes.deducoesSemRedutor)}</p>
        </div>
        <div class="step-card">
          <p class="k">Redutor total</p>
          <p class="v">${formatCurrency(result.irpfmSteps.deducoes.redutorTotal)}</p>
        </div>
        <div class="step-card">
          <p class="k">IRPFM final devido</p>
          <p class="v">${formatCurrency(result.irpfmSteps.irpfmDevido)}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Deducao</th>
            <th class="right">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>IRPF progressivo</td><td class="right">${formatCurrency(result.irpfmSteps.deducoes.irpfProgressivo)}</td></tr>
          <tr><td>IRRF dividendos</td><td class="right">${formatCurrency(result.irpfmSteps.deducoes.irrfDividendos)}</td></tr>
          <tr><td>Outros creditos IRRF</td><td class="right">${formatCurrency(result.irpfmSteps.deducoes.outrosCreditosIrrf)}</td></tr>
          <tr><td>Offshore</td><td class="right">${formatCurrency(result.irpfmSteps.deducoes.offshore)}</td></tr>
          <tr><td>Tributacao definitiva</td><td class="right">${formatCurrency(result.irpfmSteps.deducoes.tributacaoDefinitiva)}</td></tr>
          <tr><td>Outras deducoes</td><td class="right">${formatCurrency(result.irpfmSteps.deducoes.outrasDeducoes)}</td></tr>
        </tbody>
      </table>
      <p class="sub" style="margin-top:6px;">Formula aplicada: ${escapeHtml(result.irpfmSteps.formulaAliquota)}</p>
    </section>

    <section class="section">
      <h2>6. Alertas e plano de acao</h2>
      <ul class="alert-list">
        ${alertItems || `<li class="alert-item"><strong>Sem alertas relevantes para os dados informados.</strong></li>`}
      </ul>
      ${warnings ? `<h3 style="margin-top:10px;">Avisos tecnicos</h3><ul class="list">${warnings}</ul>` : ""}
      <h3 style="margin-top:10px;">Premissas do modelo</h3>
      <ul class="list">${assumptions}</ul>
    </section>

    <footer class="footer">
      Simulacao estimativa para apoio de decisao. Nao substitui parecer contabil, juridico ou tributario individual.
      LDC Capital | www.ldccapital.com.br | Parametros legais vigentes em marco/2026.
    </footer>
  </main>
</body>
</html>
`;
}
