// PDF Generator using Playwright

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Analytics, DiagnosisReport } from '../types';

export async function generatePDF(
  checkupId: string,
  score: number,
  analytics: Analytics,
  report: DiagnosisReport
): Promise<Buffer> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Converter logo para base64
  const logoPath = join(process.cwd(), 'public', 'images', 'LDC Capital - Logo Final_Aplicação Principal.png');
  let logoBase64 = '';
  try {
    const logoBuffer = readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch {
    console.warn('Logo não encontrado, continuando sem logo');
  }

  const html = generateHTML(score, analytics, report, logoBase64);

  await page.setContent(html, { waitUntil: 'networkidle' });
  
  // Aguardar gráficos renderizarem
  await page.waitForTimeout(2000);
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
  });

  await browser.close();
  return pdf;
}

function generateHTML(score: number, analytics: Analytics, report: DiagnosisReport, logoBase64: string): string {
  const pieData = Object.entries(analytics.allocation_by_class).map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10,
  }));

  const brVsExteriorData = [
    { name: 'Brasil', value: Math.round(analytics.br_vs_exterior.br * 10) / 10 },
    { name: 'Exterior', value: Math.round(analytics.br_vs_exterior.exterior * 10) / 10 },
  ];

  const topHoldings = analytics.top_holdings.slice(0, 10);

  const COLORS = ['#98ab44', '#becc6a', '#344645', '#577171', '#e3e3e3', '#262d3d', '#8b9a5a', '#a5b67a'];

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#16a34a';
    if (s >= 60) return '#ca8a04';
    return '#dc2626';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #262d3d;
      line-height: 1.6;
      font-size: 14px;
    }
    h1, h2, h3 {
      font-family: 'IvyMode', Georgia, serif;
      color: #262d3d;
      font-weight: 600;
    }
    .header {
      text-align: center;
      padding: 30px 0 20px 0;
      border-bottom: 2px solid #98ab44;
      margin-bottom: 25px;
    }
    .header-logo {
      max-width: 200px;
      height: auto;
      margin-bottom: 15px;
    }
    .header h1 {
      font-size: 28px;
      color: #98ab44;
      margin-bottom: 5px;
      font-weight: 700;
    }
    .header-subtitle {
      font-size: 16px;
      color: #344645;
      margin-bottom: 5px;
    }
    .header-date {
      font-size: 13px;
      color: #577171;
      margin-top: 8px;
    }
    .score {
      text-align: center;
      padding: 25px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 25px 0;
    }
    .score-value {
      font-size: 64px;
      font-weight: bold;
      color: ${getScoreColor(score)};
      margin-bottom: 5px;
    }
    .score-label {
      font-size: 16px;
      color: #344645;
      margin-top: 5px;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section h2 {
      font-size: 22px;
      color: #344645;
      margin-bottom: 15px;
      border-bottom: 2px solid #262d3d;
      padding-bottom: 8px;
      font-weight: 600;
    }
    .section-subtitle {
      font-size: 18px;
      color: #344645;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .risk-item, .improvement-item {
      margin: 12px 0;
      padding: 15px;
      border-left: 4px solid #98ab44;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .risk-item strong, .improvement-item strong {
      display: block;
      font-size: 15px;
      color: #262d3d;
      margin-bottom: 6px;
    }
    .risk-item p, .improvement-item p {
      font-size: 13px;
      color: #577171;
      line-height: 1.5;
    }
    .severity-badge, .impact-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }
    .severity-high {
      background: #fee2e2;
      color: #991b1b;
    }
    .severity-med {
      background: #fef3c7;
      color: #92400e;
    }
    .severity-low {
      background: #dbeafe;
      color: #1e40af;
    }
    .impact-high {
      background: #fee2e2;
      color: #991b1b;
    }
    .impact-med {
      background: #fef3c7;
      color: #92400e;
    }
    .impact-low {
      background: #dbeafe;
      color: #1e40af;
    }
    .action-plan {
      list-style: decimal;
      margin-left: 25px;
      margin-top: 10px;
    }
    .action-plan li {
      margin: 10px 0;
      font-size: 13px;
      color: #577171;
      line-height: 1.6;
    }
    .charts-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 25px 0;
    }
    .chart-wrapper {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .chart-title {
      font-size: 15px;
      font-weight: 600;
      color: #344645;
      margin-bottom: 10px;
      text-align: center;
    }
    .chart-canvas {
      max-height: 250px;
    }
    .table-container {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    thead {
      background: #344645;
      color: white;
    }
    th {
      padding: 10px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e3e3e3;
    }
    tbody tr:hover {
      background: #f9f9f9;
    }
    .transparency-notes {
      margin: 20px 0;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
      font-size: 12px;
      color: #577171;
    }
    .transparency-notes ul {
      margin-left: 20px;
      margin-top: 8px;
    }
    .transparency-notes li {
      margin: 5px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e3e3e3;
      text-align: center;
    }
    .footer-brand {
      font-size: 16px;
      font-weight: 600;
      color: #344645;
      margin-bottom: 10px;
    }
    .footer-disclaimer {
      font-size: 11px;
      color: #577171;
      line-height: 1.5;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="LDC Capital" class="header-logo" />` : ''}
    <h1>Checkup-LDC</h1>
    <p class="header-subtitle">Relatório de Análise de Carteira</p>
    <p class="header-date">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
  </div>

  <div class="score">
    <div class="score-value">${score}</div>
    <p class="score-label">Nota de Saúde da Carteira (0-100)</p>
  </div>

  <div class="section">
    <h2>Resumo Executivo</h2>
    <p class="section-subtitle">${report.headline}</p>
    <p style="margin-top: 12px; color: #577171; line-height: 1.6;">${report.summary}</p>
  </div>

  <div class="charts-container">
    <div class="chart-wrapper">
      <div class="chart-title">Alocação por Classe</div>
      <canvas id="pieChart" class="chart-canvas"></canvas>
    </div>
    <div class="chart-wrapper">
      <div class="chart-title">Brasil vs Exterior</div>
      <canvas id="barChart" class="chart-canvas"></canvas>
    </div>
  </div>

  ${analytics.subscores ? `
    <div class="section">
      <h2>Score Breakdown - O que puxou sua nota para baixo</h2>
      <table>
        <thead>
          <tr>
            <th>Dimensão</th>
            <th>Score</th>
            <th>Status</th>
            <th>Meta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Diversificação Global</strong></td>
            <td>${analytics.subscores.global_diversification}</td>
            <td>${analytics.subscores.global_diversification >= 80 ? 'Alto' : analytics.subscores.global_diversification >= 60 ? 'Médio' : 'Baixo'}</td>
            <td>10-25%</td>
          </tr>
          <tr>
            <td><strong>Concentração</strong></td>
            <td>${analytics.subscores.concentration}</td>
            <td>${analytics.subscores.concentration >= 80 ? 'Alto' : analytics.subscores.concentration >= 60 ? 'Médio' : 'Baixo'}</td>
            <td>Top5 < 45%</td>
          </tr>
          <tr>
            <td><strong>Liquidez</strong></td>
            <td>${analytics.subscores.liquidity}</td>
            <td>${analytics.subscores.liquidity >= 80 ? 'Alto' : analytics.subscores.liquidity >= 60 ? 'Médio' : 'Baixo'}</td>
            <td>Score ≥ 60</td>
          </tr>
          <tr>
            <td><strong>Complexidade</strong></td>
            <td>${analytics.subscores.complexity}</td>
            <td>${analytics.subscores.complexity >= 80 ? 'Alto' : analytics.subscores.complexity >= 60 ? 'Médio' : 'Baixo'}</td>
            <td>Fundos < 30%</td>
          </tr>
          <tr>
            <td><strong>Eficiência de Custos</strong></td>
            <td>${analytics.subscores.cost_efficiency}</td>
            <td>${analytics.subscores.cost_efficiency >= 80 ? 'Alto' : analytics.subscores.cost_efficiency >= 60 ? 'Médio' : 'Baixo'}</td>
            <td>Baixo custo</td>
          </tr>
        </tbody>
      </table>
    </div>
  ` : ''}

  ${topHoldings.slice(0, 5).length > 0 ? `
    <div class="table-container">
      <h2>Top 5 Posições</h2>
      <table>
        <thead>
          <tr>
            <th>Ativo</th>
            <th>Tipo</th>
            <th style="text-align: right;">Alocação (%)</th>
          </tr>
        </thead>
        <tbody>
          ${topHoldings.slice(0, 5).map(h => `
            <tr>
              <td><strong>${h.nome}</strong></td>
              <td>${h.tipo}</td>
              <td style="text-align: right;">${h.percentual.toFixed(2)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  ${analytics.what_if && analytics.what_if.length > 0 ? `
    <div class="section">
      <h2>Simulações "Antes vs Depois"</h2>
      ${analytics.what_if.map(sim => `
        <div class="risk-item">
          <strong>${sim.label}</strong>
          <p style="margin-top: 8px;">
            <strong>Nota estimada:</strong> ${sim.score_before} → ${sim.score_after}
            <br>
            <em>${sim.note}</em>
          </p>
        </div>
      `).join('')}
    </div>
  ` : ''}

  <div class="section">
    <h2>Principais Riscos</h2>
    ${report.risks.map(risk => `
      <div class="risk-item">
        <strong>
          ${risk.title}
          <span class="severity-badge severity-${risk.severity}">
            ${risk.severity === 'high' ? 'Alto' : risk.severity === 'med' ? 'Médio' : 'Baixo'}
          </span>
        </strong>
        <p>${risk.detail}</p>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>Oportunidades de Melhoria</h2>
    ${report.improvements.map(improvement => `
      <div class="improvement-item">
        <strong>
          ${improvement.title}
          <span class="impact-badge impact-${improvement.impact}">
            ${improvement.impact === 'high' ? 'Alto Impacto' : improvement.impact === 'med' ? 'Médio Impacto' : 'Baixo Impacto'}
          </span>
        </strong>
        <p>${improvement.detail}</p>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>Plano de Ação - Próximos 7 Dias</h2>
    <ol class="action-plan">
      <li>Defina um % alvo de exterior (ex.: 15%) e um limite de concentração (top5 ≤ 45%).</li>
      ${report.action_plan_7_days.map(step => `<li>${step}</li>`).join('')}
    </ol>
  </div>

  ${report.transparency_notes.length > 0 ? `
    <div class="section">
      <h2>Notas de Transparência</h2>
      <div class="transparency-notes">
        <ul>
          ${report.transparency_notes.map(note => `<li>${note}</li>`).join('')}
        </ul>
      </div>
    </div>
  ` : ''}

  <div class="footer">
    <p class="footer-brand">LDC Capital - Mais do que finanças, direção.</p>
    <p class="footer-disclaimer">
      Este relatório é educacional e baseado nas informações fornecidas. Fundos e renda fixa são analisados por classe e peso, sem decomposição interna. Para recomendação personalizada completa, é necessário suitability detalhado e revisão humana.
    </p>
  </div>

  <script>
    // Gráfico de Pizza - Alocação por Classe
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ${JSON.stringify(pieData.map(d => d.name))},
        datasets: [{
          data: ${JSON.stringify(pieData.map(d => d.value))},
          backgroundColor: ${JSON.stringify(COLORS.slice(0, pieData.length))},
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 11 },
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed.toFixed(1) + '%';
              }
            }
          }
        }
      }
    });

    // Gráfico de Barras - Brasil vs Exterior
    const barCtx = document.getElementById('barChart').getContext('2d');
    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(brVsExteriorData.map(d => d.name))},
        datasets: [{
          label: 'Alocação (%)',
          data: ${JSON.stringify(brVsExteriorData.map(d => d.value))},
          backgroundColor: '#98ab44',
          borderColor: '#98ab44',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.parsed.y.toFixed(1) + '%';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
}
