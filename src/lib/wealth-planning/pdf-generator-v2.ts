// PDF Generator v2 — Gera HTML otimizado para impressão/download como PDF
// Usa window.print() com @media print para resultado profissional em 2-4 páginas

import type { QuickInputs, AutoScenariosResult, StressTestResult, ActionItem } from "@/types/wealth-planning-v2";

interface PDFData {
  inputs: QuickInputs;
  scenarios: AutoScenariosResult;
  stressTests: StressTestResult[];
  actionPlan: ActionItem[];
  consultantName?: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const formatPct = (v: number) => `${v.toFixed(1)}%`;

const today = () => {
  const d = new Date();
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
};

/**
 * Gera HTML completo do relatório PDF v2 (2-4 páginas)
 * Abre em nova aba — o usuário usa Ctrl+P ou o botão de impressão
 */
export function generatePDFv2HTML(data: PDFData): string {
  const { inputs, scenarios, stressTests, actionPlan, consultantName } = data;
  const base = scenarios.base;
  const cons = scenarios.conservative;
  const opt = scenarios.optimistic;

  const getStatusEmoji = (reachesGoal: boolean) => reachesGoal ? "✅ Sim" : "❌ Não";

  const yearsToIF = inputs.retirementAge - inputs.age;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Planejamento IF — ${inputs.name}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #262d3d;
      line-height: 1.5;
      font-size: 11px;
    }
    .page { page-break-after: always; min-height: 100vh; padding: 0; }
    .page:last-child { page-break-after: avoid; }

    /* CAPA */
    .cover {
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      min-height: 100vh; text-align: center;
    }
    .cover-logo { font-size: 28px; font-weight: 800; color: #98ab44; letter-spacing: 2px; margin-bottom: 60px; }
    .cover-title { font-size: 32px; font-weight: 700; color: #262d3d; margin-bottom: 8px; }
    .cover-subtitle { font-size: 16px; color: #577171; margin-bottom: 60px; }
    .cover-client { font-size: 22px; font-weight: 600; color: #262d3d; margin-bottom: 8px; }
    .cover-date { font-size: 13px; color: #577171; margin-bottom: 4px; }
    .cover-footer { font-size: 10px; color: #999; margin-top: 80px; }

    /* TABELAS */
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 8px 10px; text-align: left; font-size: 11px; }
    th { background: #262d3d; color: white; font-weight: 600; }
    td { border-bottom: 1px solid #e3e3e3; }
    tr:nth-child(even) td { background: #f8f9fa; }

    /* SEÇÕES */
    .section { margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: 700; color: #262d3d; border-bottom: 3px solid #98ab44; padding-bottom: 6px; margin-bottom: 12px; }
    .section-subtitle { font-size: 13px; font-weight: 600; color: #577171; margin-bottom: 8px; }

    /* CARDS DE CENÁRIO */
    .scenario-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0; }
    .scenario-card { border: 2px solid #e3e3e3; border-radius: 8px; padding: 14px; }
    .scenario-card.conservative { border-color: #f97316; }
    .scenario-card.base { border-color: #3b82f6; }
    .scenario-card.optimistic { border-color: #22c55e; }
    .scenario-label { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
    .scenario-metric { margin-bottom: 6px; }
    .scenario-metric-label { font-size: 9px; color: #577171; text-transform: uppercase; letter-spacing: 0.5px; }
    .scenario-metric-value { font-size: 14px; font-weight: 700; color: #262d3d; }
    .status-yes { color: #16a34a; font-weight: 700; }
    .status-no { color: #dc2626; font-weight: 700; }

    /* VEREDICTO */
    .verdict { background: #f8f9fa; border-radius: 8px; padding: 16px; border-left: 4px solid #98ab44; margin: 16px 0; }
    .verdict-title { font-size: 14px; font-weight: 700; color: #262d3d; margin-bottom: 4px; }
    .verdict-text { font-size: 12px; color: #577171; }

    /* AÇÕES */
    .action-list { list-style: none; counter-reset: actions; }
    .action-item { counter-increment: actions; padding: 8px 0; border-bottom: 1px solid #e3e3e3; display: flex; align-items: flex-start; gap: 8px; }
    .action-number { background: #98ab44; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .action-text { font-size: 11px; }
    .action-title { font-weight: 600; color: #262d3d; }
    .action-desc { color: #577171; font-size: 10px; }

    /* STRESS */
    .stress-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .stress-card { border: 1px solid #e3e3e3; border-radius: 6px; padding: 10px; font-size: 10px; }
    .stress-label { font-weight: 600; font-size: 11px; margin-bottom: 4px; }
    .stress-impact { color: #577171; }
    .severity-low { border-left: 3px solid #22c55e; }
    .severity-medium { border-left: 3px solid #eab308; }
    .severity-high { border-left: 3px solid #f97316; }
    .severity-critical { border-left: 3px solid #dc2626; }

    /* FOOTER */
    .page-footer { font-size: 8px; color: #999; text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e3e3e3; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

<!-- PÁGINA 1: CAPA -->
<div class="page cover">
  <div class="cover-logo">LDC CAPITAL</div>
  <div class="cover-title">Planejamento de</div>
  <div class="cover-title">Independência Financeira</div>
  <div class="cover-subtitle" style="margin-top: 16px">Simulação personalizada</div>
  <div class="cover-client">${inputs.name}</div>
  <div class="cover-date">${today()}</div>
  ${consultantName ? `<div class="cover-date">Preparado por: ${consultantName}</div>` : ""}
  <div class="cover-footer">Confidencial — Este documento é apenas informativo e não constitui recomendação de investimento.</div>
</div>

<!-- PÁGINA 2: RESUMO EXECUTIVO -->
<div class="page">
  <div class="section">
    <div class="section-title">Resumo Executivo</div>
    <table>
      <tr><td><strong>Cliente</strong></td><td>${inputs.name}</td><td><strong>Idade</strong></td><td>${inputs.age} anos</td></tr>
      <tr><td><strong>Idade para IF</strong></td><td>${inputs.retirementAge} anos (${yearsToIF} anos)</td><td><strong>Expectativa de vida</strong></td><td>${inputs.lifeExpectancy} anos</td></tr>
      <tr><td><strong>Despesa mensal</strong></td><td>${formatCurrency(inputs.monthlyExpense)}</td><td><strong>Renda desejada na IF</strong></td><td>${formatCurrency(inputs.desiredMonthlyIncome || inputs.monthlyExpense)}</td></tr>
      <tr><td><strong>Patrimônio atual</strong></td><td>${formatCurrency(inputs.currentPortfolio)}</td><td><strong>Aporte mensal</strong></td><td>${formatCurrency(inputs.monthlyContribution)}</td></tr>
      <tr><td><strong>Perfil de risco</strong></td><td>${inputs.suitability}</td><td><strong>Método</strong></td><td>${inputs.calculationMethod === "perpetuity" ? "Perpetuidade" : `SWR ${inputs.swrRate}%`}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Comparação de Cenários</div>
    <div class="scenario-grid">
      ${[
        { s: cons, cls: "conservative", label: "🔶 Conservador" },
        { s: base, cls: "base", label: "🔷 Base" },
        { s: opt, cls: "optimistic", label: "🟢 Otimista" },
      ].map(({ s, cls, label }) => `
        <div class="scenario-card ${cls}">
          <div class="scenario-label">${label}</div>
          <div class="scenario-metric">
            <div class="scenario-metric-label">Retorno / Inflação</div>
            <div class="scenario-metric-value">${formatPct(s.nominalReturn)} / ${formatPct(s.inflation)}</div>
          </div>
          <div class="scenario-metric">
            <div class="scenario-metric-label">Patrimônio-alvo</div>
            <div class="scenario-metric-value">${formatCurrency(s.targetCapital)}</div>
          </div>
          <div class="scenario-metric">
            <div class="scenario-metric-label">Projetado</div>
            <div class="scenario-metric-value">${formatCurrency(s.projectedCapital)}</div>
          </div>
          <div class="scenario-metric">
            <div class="scenario-metric-label">Chega?</div>
            <div class="scenario-metric-value ${s.reachesGoal ? "status-yes" : "status-no"}">${getStatusEmoji(s.reachesGoal)}</div>
          </div>
          <div class="scenario-metric">
            <div class="scenario-metric-label">Aporte necessário</div>
            <div class="scenario-metric-value">${s.requiredMonthlyContribution > 0 ? formatCurrency(s.requiredMonthlyContribution) + "/mês" : "Já basta ✓"}</div>
          </div>
        </div>
      `).join("")}
    </div>
  </div>

  <!-- Veredicto -->
  <div class="verdict">
    <div class="verdict-title">Você está no caminho?</div>
    <div class="verdict-text">
      ${base.reachesGoal
        ? `<span class="status-yes">Sim!</span> No cenário Base, seu patrimônio projetado de ${formatCurrency(base.projectedCapital)} supera a meta de ${formatCurrency(base.targetCapital)}. Sobra de ${formatCurrency(base.projectedCapital - base.targetCapital)}.`
        : `<span class="status-no">Atenção.</span> No cenário Base, há um gap de ${formatCurrency(base.gap)}. É necessário um aporte mensal de ${formatCurrency(base.requiredMonthlyContribution)} para atingir a meta.`
      }
    </div>
  </div>

  <!-- Stress Tests -->
  <div class="section">
    <div class="section-subtitle">Resiliência do Plano (Stress Tests)</div>
    <div class="stress-grid">
      ${stressTests.map((st) => `
        <div class="stress-card severity-${st.severity}">
          <div class="stress-label">${st.label}</div>
          <div class="stress-impact">${st.impactDescription}</div>
        </div>
      `).join("")}
    </div>
  </div>

  <div class="page-footer">LDC Capital — Planejamento de Independência Financeira — ${today()}</div>
</div>

<!-- PÁGINA 3: PRÓXIMAS AÇÕES -->
<div class="page">
  <div class="section">
    <div class="section-title">Próximas Ações</div>
    <ul class="action-list">
      ${actionPlan.slice(0, 10).map((action, idx) => `
        <li class="action-item">
          <div class="action-number">${idx + 1}</div>
          <div class="action-text">
            <div class="action-title">${action.title}</div>
            <div class="action-desc">${action.description}</div>
          </div>
        </li>
      `).join("")}
    </ul>
  </div>

  <div class="section">
    <div class="section-subtitle">Premissas Utilizadas</div>
    <table>
      <tr><th>Parâmetro</th><th>Conservador</th><th>Base</th><th>Otimista</th></tr>
      <tr><td>Retorno nominal (a.a.)</td><td>${formatPct(cons.nominalReturn)}</td><td>${formatPct(base.nominalReturn)}</td><td>${formatPct(opt.nominalReturn)}</td></tr>
      <tr><td>Inflação (a.a.)</td><td>${formatPct(cons.inflation)}</td><td>${formatPct(base.inflation)}</td><td>${formatPct(opt.inflation)}</td></tr>
      <tr><td>Juro real (a.a.)</td><td>${formatPct(cons.realRate)}</td><td>${formatPct(base.realRate)}</td><td>${formatPct(opt.realRate)}</td></tr>
    </table>
  </div>

  <div class="page-footer">
    Este documento é apenas informativo e não constitui recomendação de investimento.<br>
    LDC Capital — ${today()}
  </div>
</div>

<!-- Botão de impressão (não aparece no PDF) -->
<div class="no-print" style="position:fixed;bottom:20px;right:20px;z-index:9999">
  <button onclick="window.print()" style="background:#98ab44;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15)">
    📥 Salvar como PDF (Ctrl+P)
  </button>
</div>

</body>
</html>`;
}

/**
 * Abre o PDF em nova aba
 */
export function openPDFv2(data: PDFData): void {
  const html = generatePDFv2HTML(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, "_blank");
  if (newWindow) {
    newWindow.onload = () => URL.revokeObjectURL(url);
  }
}
