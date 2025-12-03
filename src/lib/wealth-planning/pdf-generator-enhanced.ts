import type { WealthPlanningScenario, CalculationResults } from "@/types/wealth-planning";

/**
 * Gera HTML do template de PDF com gráficos SVG e tabelas formatadas
 */
export function generateEnhancedPDFHTML(
  scenario: WealthPlanningScenario,
  results: CalculationResults
): string {
  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) return "N/A";
    return `${value.toFixed(2)}%`;
  };

  // Gerar gráfico SVG de projeção
  const generateProjectionChartSVG = () => {
    if (!results.notRetired?.yearlyProjections || results.notRetired.yearlyProjections.length === 0) {
      return '<div style="padding: 40px; text-align: center; color: #666;">Nenhum dado de projeção disponível</div>';
    }

    const projections = results.notRetired.yearlyProjections;
    const personalData = scenario.personalData;
    if (!personalData) return '';

    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Calcular valores máximos e mínimos
    let maxValue = 0;
    let minValue = Infinity;
    projections.forEach(proj => {
      maxValue = Math.max(maxValue, proj.currentScenario || 0, proj.maintenanceScenario || 0, proj.consumptionScenario || 0);
      minValue = Math.min(minValue, proj.currentScenario || 0, proj.maintenanceScenario || 0, proj.consumptionScenario || 0);
    });

    const ageRange = personalData.lifeExpectancy - personalData.age;
    const valueRange = maxValue - minValue;

    // Gerar pontos para cada linha
    const generatePath = (dataKey: 'currentScenario' | 'maintenanceScenario' | 'consumptionScenario', color: string) => {
      const points = projections
        .map((proj, idx) => {
          const x = margin.left + (proj.age - personalData.age) / ageRange * chartWidth;
          const y = margin.top + chartHeight - ((proj[dataKey] || 0) - minValue) / valueRange * chartHeight;
          return `${x},${y}`;
        })
        .join(' ');

      return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" />`;
    };

    // Gerar eixos e grid
    const gridLines = [];
    for (let i = 0; i <= 10; i++) {
      const y = margin.top + (chartHeight / 10) * i;
      gridLines.push(`<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="3,3" />`);
    }

    // Labels do eixo Y
    const yLabels = [];
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange / 5) * (5 - i);
      const y = margin.top + (chartHeight / 5) * i;
      yLabels.push(`<text x="${margin.left - 10}" y="${y + 5}" text-anchor="end" font-size="11" fill="#666">${formatCurrency(value)}</text>`);
    }

    // Labels do eixo X
    const xLabels = [];
    const ageStep = Math.ceil(ageRange / 10);
    for (let i = 0; i <= 10; i++) {
      const age = personalData.age + (ageRange / 10) * i;
      const x = margin.left + (chartWidth / 10) * i;
      xLabels.push(`<text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="11" fill="#666">${Math.round(age)}</text>`);
    }

    return `
      <svg width="${width}" height="${height}" style="border: 1px solid #e5e7eb; border-radius: 8px; background: white;">
        ${gridLines.join('')}
        ${generatePath('currentScenario', '#262d3d')}
        ${generatePath('maintenanceScenario', '#10b981')}
        ${generatePath('consumptionScenario', '#ef4444')}
        ${yLabels.join('')}
        ${xLabels.join('')}
        <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="12" font-weight="bold" fill="#374151">Idade (anos)</text>
        <text x="20" y="${height / 2}" text-anchor="middle" font-size="12" font-weight="bold" fill="#374151" transform="rotate(-90, 20, ${height / 2})">Patrimônio (R$)</text>
        <g transform="translate(${margin.left + chartWidth + 20}, ${margin.top})">
          <circle cx="0" cy="0" r="5" fill="#262d3d" />
          <text x="10" y="5" font-size="11" fill="#262d3d">Projeção Atual</text>
          <circle cx="0" cy="20" r="5" fill="#10b981" />
          <text x="10" y="25" font-size="11" fill="#10b981">Manutenção</text>
          <circle cx="0" cy="40" r="5" fill="#ef4444" />
          <text x="10" y="45" font-size="11" fill="#ef4444">Consumo</text>
        </g>
      </svg>
    `;
  };

  // Gerar gráfico de barras para proteção familiar
  const generateProtectionChartSVG = () => {
    if (!results.familyProtection) return '';

    const width = 600;
    const height = 300;
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const data = [
      { name: 'Proteção Imediata', value: results.familyProtection.immediateProtection },
      { name: 'Liquidez Sucessão', value: results.familyProtection.successionLiquidity },
      { name: 'Proteção Total', value: results.familyProtection.totalProtection },
    ];

    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = chartWidth / data.length - 20;

    const bars = data.map((item, idx) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = margin.left + (chartWidth / data.length) * idx + 10;
      const y = margin.top + chartHeight - barHeight;
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#98ab44" rx="8" />
        <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#666">${formatCurrency(item.value)}</text>
        <text x="${x + barWidth / 2}" y="${height - margin.bottom + 15}" text-anchor="middle" font-size="10" fill="#666" transform="rotate(-45, ${x + barWidth / 2}, ${height - margin.bottom + 15})">${item.name}</text>
      `;
    }).join('');

    return `
      <svg width="${width}" height="${height}" style="border: 1px solid #e5e7eb; border-radius: 8px; background: white;">
        ${bars}
        <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="12" font-weight="bold" fill="#374151">Proteção Familiar</text>
      </svg>
    `;
  };

  // Gerar tabela de cenários
  const generateScenariosTable = () => {
    if (!results.notRetired) return '';

    const scenarios = [
      {
        name: "Projeção Atual",
        annualSavings: results.notRetired.currentScenario.annualSavings,
        accumulatedCapital: results.notRetired.currentScenario.projectedCapital,
        requiredCapital: results.notRetired.currentScenario.requiredCapital,
        requiredRate: results.notRetired.currentScenario.requiredRate,
        requiredRealRate: results.notRetired.currentScenario.requiredRealRate,
        withinProfile: results.notRetired.currentScenario.withinProfile,
      },
      {
        name: "Manutenção do Patrimônio",
        annualSavings: results.notRetired.maintenanceScenario.annualSavings,
        accumulatedCapital: results.notRetired.maintenanceScenario.accumulatedCapital,
        requiredCapital: results.notRetired.maintenanceScenario.requiredCapital,
        requiredRate: results.notRetired.maintenanceScenario.requiredRate,
        requiredRealRate: results.notRetired.maintenanceScenario.requiredRealRate,
        withinProfile: results.notRetired.maintenanceScenario.withinProfile,
      },
      {
        name: "Consumo do Patrimônio",
        annualSavings: results.notRetired.consumptionScenario.annualSavings,
        accumulatedCapital: results.notRetired.consumptionScenario.accumulatedCapital,
        requiredCapital: results.notRetired.consumptionScenario.requiredCapital,
        requiredRate: results.notRetired.consumptionScenario.requiredRate,
        requiredRealRate: results.notRetired.consumptionScenario.requiredRealRate,
        withinProfile: results.notRetired.consumptionScenario.withinProfile,
      },
    ];

    const rows = scenarios.map(scenario => `
      <tr>
        <td style="font-weight: bold;">${scenario.name}</td>
        <td style="text-align: right;">${formatCurrency(scenario.annualSavings)}</td>
        <td style="text-align: right;">${formatCurrency(scenario.accumulatedCapital)}</td>
        <td style="text-align: right;">${formatCurrency(scenario.requiredCapital)}</td>
        <td style="text-align: right;">${formatPercentage(scenario.requiredRate)}</td>
        <td style="text-align: right;">${formatPercentage(scenario.requiredRealRate)}</td>
        <td style="text-align: center;">
          <span style="padding: 4px 8px; border-radius: 4px; background: ${scenario.withinProfile ? '#d1fae5' : '#fee2e2'}; color: ${scenario.withinProfile ? '#065f46' : '#991b1b'};">
            ${scenario.withinProfile ? 'Dentro do Perfil' : 'Fora do Perfil'}
          </span>
        </td>
      </tr>
    `).join('');

    return `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Cenário</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Poupança Anual</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Capital Acumulado</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Capital Necessário</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Rent. Nominal</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Rent. Real</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  };

  // HTML completo
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Relatório - ${scenario.title}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Public Sans', Arial, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #262d3d;
        padding: 40px;
        background: #fff;
      }
      .header {
        border-bottom: 3px solid #98ab44;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .header h1 {
        font-size: 28px;
        color: #262d3d;
        margin-bottom: 10px;
        font-weight: bold;
      }
      .header .subtitle {
        color: #666;
        font-size: 14px;
        margin-bottom: 5px;
      }
      .section {
        margin-bottom: 40px;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 20px;
        color: #98ab44;
        border-bottom: 2px solid #98ab44;
        padding-bottom: 8px;
        margin-bottom: 20px;
        font-weight: bold;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 30px;
      }
      .metric-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
      }
      .metric-label {
        font-size: 11px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #262d3d;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 11px;
      }
      table th {
        background-color: #f5f5f5;
        padding: 12px;
        text-align: left;
        border: 1px solid #ddd;
        font-weight: bold;
        color: #374151;
      }
      table td {
        padding: 12px;
        border: 1px solid #ddd;
      }
      table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .summary-box {
        background-color: #f5f5f5;
        padding: 20px;
        border-left: 4px solid #98ab44;
        margin-bottom: 20px;
        border-radius: 4px;
      }
      .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e5e7eb;
      }
      .summary-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      .summary-label {
        font-weight: bold;
        color: #374151;
      }
      .chart-container {
        margin: 30px 0;
        text-align: center;
      }
      .footer {
        margin-top: 60px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
        text-align: center;
        color: #666;
        font-size: 10px;
      }
      @media print {
        body {
          padding: 20px;
        }
        .page-break {
          page-break-before: always;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Relatório de Planejamento Financeiro</h1>
      <div class="subtitle">
        <strong>Cenário:</strong> ${scenario.title}
      </div>
      <div class="subtitle">
        <strong>Cliente:</strong> ${scenario.personalData?.name || "Não informado"}
      </div>
      <div class="subtitle">
        <strong>Data de Geração:</strong> ${formatDate(new Date())}
      </div>
    </div>

    ${results.notRetired ? `
    <div class="section">
      <div class="section-title">1. Resumo Executivo</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Capital Projetado</div>
          <div class="metric-value">${formatCurrency(results.notRetired.currentScenario.projectedCapital)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Capital Necessário</div>
          <div class="metric-value">${formatCurrency(results.notRetired.currentScenario.requiredCapital)}</div>
          ${results.notRetired.currentScenario.requiredCapital > results.notRetired.currentScenario.projectedCapital ? `
          <div style="font-size: 10px; color: #dc2626; margin-top: 5px;">
            Faltam ${formatCurrency(results.notRetired.currentScenario.requiredCapital - results.notRetired.currentScenario.projectedCapital)}
          </div>
          ` : ''}
        </div>
        <div class="metric-card">
          <div class="metric-label">Rentabilidade Necessária</div>
          <div class="metric-value">${formatPercentage(results.notRetired.currentScenario.requiredRate)}</div>
          ${results.notRetired.currentScenario.requiredRealRate !== undefined ? `
          <div style="font-size: 10px; color: #6b7280; margin-top: 5px;">
            Real: ${formatPercentage(results.notRetired.currentScenario.requiredRealRate)}
          </div>
          ` : ''}
        </div>
        <div class="metric-card">
          <div class="metric-label">Termômetro Financeiro</div>
          <div class="metric-value">${results.notRetired.financialThermometer?.toFixed(1) || 'N/A'}/10</div>
        </div>
      </div>
    </div>

    <div class="section page-break">
      <div class="section-title">2. Projeção de Patrimônio ao Longo do Tempo</div>
      <div class="chart-container">
        ${generateProjectionChartSVG()}
      </div>
    </div>

    <div class="section page-break">
      <div class="section-title">3. Comparação de Cenários</div>
      ${generateScenariosTable()}
    </div>
    ` : ''}

    ${results.familyProtection ? `
    <div class="section page-break">
      <div class="section-title">4. Proteção Familiar</div>
      <div class="chart-container">
        ${generateProtectionChartSVG()}
      </div>
      <div class="summary-box">
        <div class="summary-item">
          <span class="summary-label">Proteção Total Necessária:</span>
          <span>${formatCurrency(results.familyProtection.totalProtection)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Proteção Imediata:</span>
          <span>${formatCurrency(results.familyProtection.immediateProtection)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Liquidez para Sucessão:</span>
          <span>${formatCurrency(results.familyProtection.successionLiquidity)}</span>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="section page-break">
      <div class="section-title">5. Dados Pessoais e Financeiros</div>
      <table>
        <tbody>
          <tr>
            <th style="width: 40%;">Nome</th>
            <td>${scenario.personalData?.name || "Não informado"}</td>
          </tr>
          <tr>
            <th>Idade</th>
            <td>${scenario.personalData?.age || 0} anos</td>
          </tr>
          <tr>
            <th>Idade de Aposentadoria</th>
            <td>${scenario.personalData?.retirementAge || 0} anos</td>
          </tr>
          <tr>
            <th>Expectativa de Vida</th>
            <td>${scenario.personalData?.lifeExpectancy || 0} anos</td>
          </tr>
          <tr>
            <th>Perfil de Risco</th>
            <td>${scenario.personalData?.suitability || "Não informado"}</td>
          </tr>
          <tr>
            <th>Poupança Mensal</th>
            <td>${formatCurrency(scenario.financialData?.monthlySavings || 0)}</td>
          </tr>
          <tr>
            <th>Renda Mensal Desejada na Aposentadoria</th>
            <td>${formatCurrency(scenario.financialData?.desiredMonthlyRetirementIncome || 0)}</td>
          </tr>
          <tr>
            <th>Receitas Mensais Previstas</th>
            <td>${formatCurrency(scenario.financialData?.expectedMonthlyRetirementRevenues || 0)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Relatório gerado em ${formatDate(new Date())}</p>
      <p><strong>LDC Capital</strong> - Planejamento Financeiro</p>
      <p style="margin-top: 10px; font-size: 9px; color: #9ca3af;">
        Este relatório foi gerado automaticamente pelo sistema de Wealth Planning da LDC Capital.
      </p>
    </div>
  </body>
</html>`;

  return html;
}

