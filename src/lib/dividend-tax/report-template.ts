import type {
  DividendTaxSimulationInput,
  DividendTaxSimulationResult,
} from "@/lib/dividend-tax/types";
import { formatCurrency, formatPercent } from "@/lib/dividend-tax/calculator";

interface ReportMeta {
  leadName?: string;
  generatedAt?: Date;
  logoBase64?: string;
}

export function generateDividendTaxReportHtml(
  input: DividendTaxSimulationInput,
  result: DividendTaxSimulationResult,
  meta?: ReportMeta,
): string {
  const generatedAt = meta?.generatedAt ?? new Date();
  const generatedAtText = generatedAt.toLocaleDateString("pt-BR");
  const logoMarkup = meta?.logoBase64
    ? `<img src="${meta.logoBase64}" alt="LDC Capital" style="height:64px; width:auto;" />`
    : "";

  const sourceRows = result.sourceBreakdown
    .map(
      (source) => `
      <tr>
        <td>${source.name}</td>
        <td>${source.sourceType}</td>
        <td class="right">${formatCurrency(source.monthlyAmount)}</td>
        <td class="right">${source.monthsReceived}</td>
        <td class="right">${formatCurrency(source.annualGrossDividends)}</td>
        <td class="right">${formatCurrency(source.annualIrrf)}</td>
      </tr>
    `,
    )
    .join("");

  const scenarioRows = result.scenarios
    .map(
      (scenario) => `
      <tr>
        <td>${scenario.title}${scenario.isBest ? " (Mais Economico)" : ""}</td>
        <td class="right">${formatCurrency(scenario.totalTax)}</td>
        <td class="right">${formatPercent(scenario.totalTaxRate)}</td>
        <td class="right">${formatCurrency(scenario.netToPartner)}</td>
        <td class="right">${formatCurrency(scenario.annualSavingsVsStatusQuo)}</td>
      </tr>
    `,
    )
    .join("");

  const compositionGraphData = [
    {
      label: "Rend. tributaveis",
      value: result.incomeComposition.rendimentosTributaveis,
      color: "#262d3d",
    },
    {
      label: "Dividendos",
      value: result.incomeComposition.dividendosTotais,
      color: "#98ab44",
    },
    {
      label: "Rend. exclusivos",
      value: result.incomeComposition.rendimentosExclusivos,
      color: "#577171",
    },
    {
      label: "Rend. isentos",
      value: result.incomeComposition.rendimentosIsentos,
      color: "#344645",
    },
    {
      label: "(-) Exclusoes",
      value: result.incomeComposition.exclusoesTotais,
      color: "#b04b4b",
    },
  ];
  const compositionMax = Math.max(
    1,
    ...compositionGraphData.map((item) => Math.abs(item.value)),
  );
  const compositionBars = compositionGraphData
    .map(
      (item) => `
      <div class="bar-row">
        <div class="bar-label">${item.label}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(Math.abs(item.value) / compositionMax) * 100}%; background:${item.color};"></div>
        </div>
        <div class="bar-value">${formatCurrency(item.value)}</div>
      </div>
    `,
    )
    .join("");

  const scenarioMax = Math.max(1, ...result.scenarios.map((scenario) => scenario.totalTax));
  const scenarioBars = result.scenarios
    .map(
      (scenario) => `
      <div class="bar-row">
        <div class="bar-label">${scenario.title}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(scenario.totalTax / scenarioMax) * 100}%; background:${scenario.isBest ? "#98ab44" : "#577171"};"></div>
        </div>
        <div class="bar-value">${formatCurrency(scenario.totalTax)}</div>
      </div>
    `,
    )
    .join("");

  const redutorRows = result.redutorBreakdown
    .map(
      (item) => `
      <tr>
        <td>${item.companyName}</td>
        <td class="right">${formatPercent(item.tetoAplicavel * 100)}</td>
        <td class="right">${formatPercent(item.aliquotaEfetivaPj * 100)}</td>
        <td class="right">${formatPercent(item.aliquotaEfetivaIrpfmDividendos * 100)}</td>
        <td class="right">${formatCurrency(item.creditoRedutor)}</td>
      </tr>
    `,
    )
    .join("");

  const alertRows = result.alerts
    .map(
      (alert) => `
      <li>
        <strong>${alert.title}</strong><br />
        ${alert.description}
        ${alert.suggestedAction ? `<br /><em>Acao sugerida: ${alert.suggestedAction}</em>` : ""}
      </li>
    `,
    )
    .join("");

  const warnings = result.warnings.map((warning) => `<li>${warning}</li>`).join("");
  const assumptions = result.assumptions
    .map((assumption) => `<li>${assumption}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatorio de Impacto Tributario - LDC Capital</title>
  <style>
    @page {
      margin: 16mm;
      size: A4;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #262d3d;
      font-size: 12px;
      line-height: 1.45;
      margin: 0;
    }
    h1, h2, h3 {
      margin: 0 0 6px 0;
    }
    .header {
      border-bottom: 3px solid #98ab44;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .subtitle {
      color: #577171;
      font-size: 12px;
      margin-top: 2px;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 14px 0;
    }
    .card {
      border: 1px solid #e3e3e3;
      border-radius: 8px;
      padding: 10px;
      background: #fff;
    }
    .card .label {
      font-size: 10px;
      text-transform: uppercase;
      color: #577171;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    .card .value {
      font-size: 19px;
      font-weight: 700;
      color: #262d3d;
    }
    .card.highlight {
      background: rgba(152, 171, 68, 0.12);
      border-color: rgba(152, 171, 68, 0.35);
    }
    .section {
      margin-top: 16px;
      page-break-inside: avoid;
    }
    .page-break {
      page-break-before: always;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      margin-top: 8px;
    }
    .meta-item {
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 6px;
      background: #fff;
      font-size: 11px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11px;
    }
    th, td {
      border-bottom: 1px solid #e3e3e3;
      padding: 6px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8f9fa;
      color: #344645;
      font-weight: 700;
    }
    .right {
      text-align: right;
    }
    ul {
      margin: 6px 0 0 16px;
      padding: 0;
    }
    li {
      margin-bottom: 6px;
    }
    .stack {
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      margin-top: 6px;
    }
    .stack-item {
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 6px;
      background: #fff;
      font-size: 11px;
    }
    .bar-chart {
      margin-top: 8px;
      border: 1px solid #e3e3e3;
      border-radius: 8px;
      padding: 8px;
      background: #fff;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 140px 1fr 120px;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
      font-size: 11px;
    }
    .bar-label {
      color: #344645;
      font-weight: 600;
    }
    .bar-track {
      height: 10px;
      border-radius: 5px;
      background: #edf1f1;
      overflow: hidden;
    }
    .bar-fill {
      height: 10px;
      border-radius: 5px;
    }
    .bar-value {
      text-align: right;
      color: #262d3d;
      font-weight: 600;
    }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #e3e3e3;
      padding-top: 8px;
      font-size: 10px;
      color: #577171;
    }
  </style>
</head>
<body>
  <header class="header">
    <div>
      <h1>Relatorio de Impacto Tributario - Lei 15.270/2025</h1>
      <p class="subtitle">Simulacao personalizada LDC Capital</p>
      <p class="subtitle">Data: ${generatedAtText}</p>
      ${meta?.leadName ? `<p class="subtitle">Cliente: ${meta.leadName}</p>` : ""}
    </div>
    ${logoMarkup}
  </header>

  <section class="cards">
    <div class="card">
      <div class="label">Dividendos anuais</div>
      <div class="value">${formatCurrency(result.totalAnnualDividends)}</div>
    </div>
    <div class="card highlight">
      <div class="label">Imposto total (IRRF + IRPFM)</div>
      <div class="value">${formatCurrency(result.totalTaxDue)}</div>
    </div>
    <div class="card">
      <div class="label">Liquido anual estimado</div>
      <div class="value">${formatCurrency(result.netAnnualDividends)}</div>
    </div>
    <div class="card">
      <div class="label">Aliquota efetiva</div>
      <div class="value">${formatPercent(result.impactPercentage)}</div>
    </div>
  </section>

  <section class="section">
    <h2>Resumo Executivo</h2>
    <div class="meta">
      <div class="meta-item"><strong>Residencia fiscal:</strong> ${input.residency}</div>
      <div class="meta-item"><strong>Regime tributario:</strong> ${input.business.regimeTributario}</div>
      <div class="meta-item"><strong>IRRF anual:</strong> ${formatCurrency(result.irrfAnnualTotal)}</div>
      <div class="meta-item"><strong>IRPFM adicional:</strong> ${formatCurrency(result.irpfmDue)}</div>
      <div class="meta-item"><strong>Cenario recomendado:</strong> ${
        result.scenarios.find((scenario) => scenario.isBest)?.title || "N/A"
      }</div>
      <div class="meta-item"><strong>Economia potencial anual:</strong> ${
        formatCurrency(
          Math.max(
            0,
            result.scenarios.find((scenario) => scenario.isBest)?.annualSavingsVsStatusQuo || 0,
          ),
        )
      }</div>
    </div>
  </section>

  <section class="section">
    <h2>Calculo do IRPFM - Passo a Passo</h2>
    <div class="stack">
      <div class="stack-item"><strong>Renda total anual (base):</strong> ${formatCurrency(
        result.irpfmSteps.rendaTotalAnual,
      )}</div>
      <div class="stack-item"><strong>Aliquota IRPFM aplicavel:</strong> ${formatPercent(
        result.irpfmSteps.aliquotaAplicavelPercentual,
      )} (${result.irpfmSteps.formulaAliquota})</div>
      <div class="stack-item"><strong>IRPFM bruto:</strong> ${formatCurrency(
        result.irpfmSteps.irpfmBruto,
      )}</div>
      <div class="stack-item"><strong>Deducoes sem redutor:</strong> ${formatCurrency(
        result.irpfmSteps.deducoes.deducoesSemRedutor,
      )}</div>
      <div class="stack-item"><strong>Redutor total:</strong> ${formatCurrency(
        result.irpfmSteps.deducoes.redutorTotal,
      )}</div>
      <div class="stack-item"><strong>IRPFM adicional devido:</strong> ${formatCurrency(
        result.irpfmSteps.irpfmDevido,
      )}</div>
    </div>
  </section>

  <div class="page-break"></div>

  <section class="section">
    <h2>Detalhamento por Fonte</h2>
    <table>
      <thead>
        <tr>
          <th>Fonte</th>
          <th>Tipo</th>
          <th class="right">Mensal</th>
          <th class="right">Meses</th>
          <th class="right">Anual</th>
          <th class="right">IRRF anual</th>
        </tr>
      </thead>
      <tbody>
        ${sourceRows}
      </tbody>
    </table>
  </section>

  <section class="section">
    <h2>Composicao da Renda Global</h2>
    <div class="stack">
      <div class="stack-item">Rendimentos tributaveis: ${formatCurrency(result.incomeComposition.rendimentosTributaveis)}</div>
      <div class="stack-item">Rendimentos exclusivos: ${formatCurrency(result.incomeComposition.rendimentosExclusivos)}</div>
      <div class="stack-item">Rendimentos isentos: ${formatCurrency(result.incomeComposition.rendimentosIsentos)}</div>
      <div class="stack-item">Dividendos totais: ${formatCurrency(result.incomeComposition.dividendosTotais)}</div>
      <div class="stack-item">Exclusoes totais: ${formatCurrency(result.incomeComposition.exclusoesTotais)}</div>
      <div class="stack-item"><strong>Base IRPFM final:</strong> ${formatCurrency(result.incomeComposition.baseIrpfmAnual)}</div>
    </div>
    <div class="bar-chart">
      ${compositionBars}
    </div>
    ${
      redutorRows
        ? `
      <h3 style="margin-top: 10px;">Redutor por empresa</h3>
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th class="right">Teto</th>
            <th class="right">Aliq. PJ</th>
            <th class="right">Aliq. IRPFM</th>
            <th class="right">Credito redutor</th>
          </tr>
        </thead>
        <tbody>
          ${redutorRows}
        </tbody>
      </table>
    `
        : ""
    }
  </section>

  <section class="section">
    <h2>Comparativo de Cenarios</h2>
    <table>
      <thead>
        <tr>
          <th>Cenario</th>
          <th class="right">Carga total</th>
          <th class="right">Aliquota total</th>
          <th class="right">Liquido ao socio</th>
          <th class="right">Economia vs A</th>
        </tr>
      </thead>
      <tbody>
        ${scenarioRows}
      </tbody>
    </table>
    <div class="bar-chart">
      ${scenarioBars}
    </div>
  </section>

  <div class="page-break"></div>

  <section class="section">
    <h2>Alertas e Recomendacoes</h2>
    <ul>
      ${alertRows || "<li>Nenhum alerta relevante para os dados informados.</li>"}
    </ul>
  </section>

  <section class="section">
    <h2>Avisos e Premissas</h2>
    ${warnings ? `<h3>Avisos</h3><ul>${warnings}</ul>` : ""}
    <h3>Premissas do modelo</h3>
    <ul>${assumptions}</ul>
  </section>

  <footer class="footer">
    Este documento e uma simulacao estimativa e nao substitui parecer juridico-contabil profissional.
    LDC Capital - www.ldccapital.com.br - Gerado em ${generatedAtText} - Parametros vigentes em marco/2026.
  </footer>
</body>
</html>
`;
}
