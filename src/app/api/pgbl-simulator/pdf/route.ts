import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { formatCurrency, formatPercentage, type PGBLInputs, type PGBLResult } from "@/lib/pgbl/calculations";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { inputs, result, nomeConsultor, nomeLead } = body;

    if (!inputs || !result) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    const html = generatePDFHTML(inputs, result, nomeConsultor || "Consultor", nomeLead || "Cliente");

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="simulacao-pgbl-${(nomeLead || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')}.html"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar PDF" },
      { status: 500 }
    );
  }
}

function generatePDFHTML(
  inputs: PGBLInputs,
  result: PGBLResult,
  nomeConsultor: string,
  nomeLead: string
): string {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("pt-BR");

  // Carregar logo em base64
  let logoBase64 = '';
  try {
    const logoPath = join(process.cwd(), 'public', 'images', 'LDC Capital - Logo Final_Aplicação Principal.png');
    const logoBuffer = readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
    // Fallback: usar caminho relativo
    logoBase64 = '/images/LDC Capital - Logo Final_Aplicação Principal.png';
  }

  // Gerar gráfico SVG simplificado
  const chartSVG = generateChartSVG(result.projecaoAnual);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Simulação PGBL - ${nomeLead}</title>
  <style>
    @page {
      margin: 1cm;
      size: A4;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Public Sans', 'Arial', 'Helvetica', sans-serif;
      color: #262d3d;
      line-height: 1.4;
      font-size: 9pt;
      background: #ffffff;
    }
    
    .serif {
      font-family: 'Ivy Mode', 'Georgia', serif;
      letter-spacing: -0.025em;
    }
    
    .sans {
      font-family: 'Public Sans', 'Arial', 'Helvetica', sans-serif;
    }
    
    .header {
      background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
      padding: 25px 20px 20px 20px;
      margin-bottom: 20px;
      border-bottom: 3px solid #98ab44;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .header-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }
    
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(38, 45, 61, 0.1);
      margin-bottom: 5px;
    }
    
    .logo-img {
      max-height: 80px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    
    .header-title-section {
      text-align: center;
      margin-top: 5px;
    }
    
    h1 {
      font-size: 18pt;
      color: #262d3d;
      margin: 0;
      font-weight: bold;
      font-family: 'Ivy Mode', 'Georgia', serif;
      letter-spacing: -0.02em;
    }
    
    .header-subtitle {
      font-size: 9pt;
      color: #577171;
      margin-top: 4px;
      font-family: 'Public Sans', 'Arial', sans-serif;
      font-style: italic;
    }
    
    .client-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 15px;
      gap: 20px;
    }
    
    .client-box {
      background: white;
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 8pt;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      flex: 1;
    }
    
    .client-box:first-child {
      flex: 0 0 auto;
    }
    
    .client-box p {
      margin: 1px 0;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin: 12px 0;
    }
    
    .metric-card {
      background: white;
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 12px;
    }
    
    .metric-card-highlight {
      background: rgba(152, 171, 68, 0.1);
      border: 1px solid rgba(152, 171, 68, 0.3);
    }
    
    .metric-label {
      font-size: 7pt;
      color: #577171;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 6px;
      font-weight: 600;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .metric-value {
      font-size: 16pt;
      font-weight: 600;
      color: #262d3d;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .metric-value-highlight {
      color: #98ab44;
    }
    
    .metric-subtext {
      font-size: 7pt;
      color: #577171;
      margin-top: 4px;
      font-style: italic;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 12px 0;
    }
    
    .param-section {
      background: white;
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 12px;
    }
    
    .param-title {
      font-size: 8pt;
      color: #577171;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 8px;
      font-weight: 600;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .param-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e3e3e3;
      font-size: 8pt;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .param-item:last-child {
      border-bottom: none;
    }
    
    .param-label {
      color: #262d3d;
    }
    
    .param-value {
      font-weight: 600;
      color: #262d3d;
    }
    
    .chart-container {
      background: white;
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 12px;
      margin: 12px 0;
    }
    
    .chart-title {
      font-size: 10pt;
      color: #262d3d;
      margin-bottom: 10px;
      font-weight: bold;
      font-family: 'Ivy Mode', 'Georgia', serif;
    }
    
    .table-container {
      background: white;
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 12px;
      margin: 12px 0;
      overflow-x: auto;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7pt;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    thead tr {
      border-bottom: 2px solid #e3e3e3;
      background: #f8f9fa;
    }
    
    th {
      padding: 6px 4px;
      text-align: left;
      font-weight: 600;
      color: #577171;
      font-size: 7pt;
    }
    
    th.text-right {
      text-align: right;
    }
    
    tbody tr {
      border-bottom: 1px solid #e3e3e3;
    }
    
    tbody tr:nth-child(even) {
      background: #f8f9fa;
    }
    
    td {
      padding: 6px 4px;
      font-size: 7pt;
    }
    
    td.text-right {
      text-align: right;
    }
    
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 7pt;
      color: #577171;
      padding: 6px;
      border-top: 1px solid #e3e3e3;
      background: white;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .info-box {
      background: rgba(152, 171, 68, 0.05);
      border-left: 3px solid #98ab44;
      padding: 8px;
      margin: 8px 0;
      font-size: 8pt;
      color: #577171;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-content">
      <div class="logo-container">
        <img src="${logoBase64}" alt="LDC Capital" class="logo-img" />
      </div>
      <div class="header-title-section">
        <h1 class="serif">SIMULAÇÃO PGBL</h1>
        <div class="header-subtitle">Mais do que finanças, direção.</div>
      </div>
      <div class="client-info">
        <div class="client-box">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #262d3d;"><strong>Consultor:</strong></p>
          <p style="margin: 0; color: #577171;">${nomeConsultor}</p>
        </div>
        <div class="client-box">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #262d3d;"><strong>Cliente:</strong></p>
          <p style="margin: 0; color: #577171;">${nomeLead}</p>
        </div>
        <div class="client-box">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #262d3d;"><strong>Data:</strong></p>
          <p style="margin: 0; color: #577171;">${formattedDate}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Métricas Principais -->
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label sans">Valor Bruto Acumulado</div>
      <div class="metric-value sans">${formatCurrency(result.valorBrutoAcumulado)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label sans">Valor Líquido</div>
      <div class="metric-value sans">${formatCurrency(result.valorLiquido)}</div>
    </div>
    <div class="metric-card metric-card-highlight">
      <div class="metric-label sans">Economia Fiscal Total</div>
      <div class="metric-value metric-value-highlight sans">${formatCurrency(result.economiaFiscalTotal)}</div>
      <div class="metric-subtext sans">Economia acumulada de IR ao longo de ${inputs.periodoAnos} anos</div>
    </div>
    <div class="metric-card">
      <div class="metric-label sans">Benefício Fiscal Anual</div>
      <div class="metric-value sans" style="font-size: 14pt;">${formatCurrency(result.beneficioFiscalAnual)}</div>
      <div class="metric-subtext sans">Economia média de IR por ano</div>
    </div>
  </div>

  <!-- Explicação da Economia Fiscal -->
  <div class="info-box">
    <strong>Como funciona a Economia Fiscal Total:</strong><br>
    A economia fiscal acumulada representa a soma de toda a economia de Imposto de Renda obtida ao longo do período de investimento. 
    Isso ocorre porque os aportes no PGBL podem ser deduzidos da base de cálculo do IR (até 12% da renda bruta anual), 
    reduzindo o imposto devido a cada ano. Este valor mostra o total economizado em impostos durante todo o período.
  </div>

  <div class="two-columns">
    <!-- Parâmetros -->
    <div class="param-section">
      <div class="param-title sans">Parâmetros da Simulação</div>
      <div class="param-item">
        <span class="param-label sans">Renda Bruta Anual</span>
        <span class="param-value sans">${formatCurrency(inputs.rendaBrutaAnual)}</span>
      </div>
      <div class="param-item">
        <span class="param-label sans">Percentual de Aporte</span>
        <span class="param-value sans">${formatPercentage(inputs.percentualAporte)}</span>
      </div>
      <div class="param-item">
        <span class="param-label sans">Aporte Anual</span>
        <span class="param-value sans">${formatCurrency(result.aporteAnual)}</span>
      </div>
      <div class="param-item">
        <span class="param-label sans">Período de Investimento</span>
        <span class="param-value sans">${inputs.periodoAnos} anos</span>
      </div>
      <div class="param-item">
        <span class="param-label sans">Rentabilidade Anual</span>
        <span class="param-value sans">${formatPercentage(inputs.rentabilidadeAnual)}</span>
      </div>
      <div class="param-item">
        <span class="param-label sans">Regime de Tributação</span>
        <span class="param-value sans">${inputs.regimeTributacao === 'regressiva' ? 'Tabela Regressiva' : 'Tabela Progressiva'}</span>
      </div>
    </div>

    <!-- Resumo -->
    <div class="param-section">
      <div class="param-title sans">Resumo dos Resultados</div>
      <div class="param-item">
        <span class="param-label sans">Total Aportado</span>
        <span class="param-value sans">${formatCurrency(result.aporteAnual * inputs.periodoAnos)}</span>
      </div>
      <div class="param-item">
        <span class="param-label sans">Rendimentos Acumulados</span>
        <span class="param-value sans">${formatCurrency(result.valorBrutoAcumulado - (result.aporteAnual * inputs.periodoAnos))}</span>
      </div>
      <div class="param-item">
        <span class="param-label sans">IR no Resgate</span>
        <span class="param-value sans" style="color: #dc2626;">${formatCurrency(result.valorBrutoAcumulado - result.valorLiquido)}</span>
      </div>
      <div class="param-item">
        <span class="param-label sans">Economia Fiscal Total</span>
        <span class="param-value sans" style="color: #98ab44;">${formatCurrency(result.economiaFiscalTotal)}</span>
      </div>
      <div class="param-item">
        <span class="param-label sans">Valor Líquido Final</span>
        <span class="param-value sans" style="color: #98ab44; font-size: 10pt;">${formatCurrency(result.valorLiquido)}</span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- Gráfico -->
  <div class="chart-container">
    <div class="chart-title serif">Projeção de Acumulação</div>
    ${chartSVG}
  </div>

  <!-- Tabela Detalhada -->
  <div class="table-container">
    <div class="chart-title serif" style="margin-bottom: 10px;">Projeção Anual Detalhada</div>
    <table>
      <thead>
        <tr>
          <th class="sans">Ano</th>
          <th class="sans text-right">Aporte</th>
          <th class="sans text-right">Rentabilidade</th>
          <th class="sans text-right">Saldo Bruto</th>
          <th class="sans text-right">IR Resgate</th>
          <th class="sans text-right">Saldo Líquido</th>
          <th class="sans text-right">Benefício Fiscal</th>
          <th class="sans text-right">Economia Acumulada</th>
        </tr>
      </thead>
      <tbody>
        ${result.projecaoAnual.map((item) => `
          <tr>
            <td class="sans">${item.ano}</td>
            <td class="sans text-right">${formatCurrency(item.aporte)}</td>
            <td class="sans text-right">${formatCurrency(item.rentabilidade)}</td>
            <td class="sans text-right" style="font-weight: 600;">${formatCurrency(item.saldoBruto)}</td>
            <td class="sans text-right" style="color: #dc2626;">${formatCurrency(item.irResgate)}</td>
            <td class="sans text-right" style="font-weight: 600; color: #98ab44;">${formatCurrency(item.saldoLiquido)}</td>
            <td class="sans text-right" style="color: #98ab44;">${formatCurrency(item.beneficioFiscal)}</td>
            <td class="sans text-right" style="font-weight: 600; color: #98ab44;">${formatCurrency(item.economiaFiscalAcumulada)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p class="sans">LDC Capital - Mais do que finanças, direção | www.ldccapital.com.br</p>
    <p class="sans">Este relatório é destinado exclusivamente ao cliente mencionado.</p>
  </div>
</body>
</html>
  `;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateChartSVG(projecaoAnual: any[]): string {
  if (!projecaoAnual || projecaoAnual.length === 0) {
    return '<div style="text-align: center; padding: 20px; color: #577171;">Nenhum dado disponível</div>';
  }

  const width = 700;
  const height = 350;
  const margin = { top: 30, right: 30, bottom: 40, left: 80 };

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Encontrar valores min/max
  let maxValue = 0;
  projecaoAnual.forEach((item) => {
    maxValue = Math.max(maxValue, item.saldoBruto, item.saldoLiquido, item.economiaFiscalAcumulada);
  });

  maxValue = maxValue * 1.1;

  const scaleX = (ano: number) => {
    const minAno = projecaoAnual[0].ano;
    const maxAno = projecaoAnual[projecaoAnual.length - 1].ano;
    return margin.left + ((ano - minAno) / (maxAno - minAno)) * chartWidth;
  };

  const scaleY = (value: number) => {
    return margin.top + chartHeight - (value / maxValue) * chartHeight;
  };

  // Gerar pontos
  const pontosBruto = projecaoAnual.map((item) => `${scaleX(item.ano)},${scaleY(item.saldoBruto)}`).join(' ');
  const pontosLiquido = projecaoAnual.map((item) => `${scaleX(item.ano)},${scaleY(item.saldoLiquido)}`).join(' ');
  const pontosEconomia = projecaoAnual.map((item) => `${scaleX(item.ano)},${scaleY(item.economiaFiscalAcumulada)}`).join(' ');

  // Ticks do eixo Y
  const yTicks = [];
  for (let i = 0; i <= 5; i++) {
    const value = (maxValue / 5) * i;
    yTicks.push({ value, y: scaleY(value) });
  }

  // Ticks do eixo X (a cada 5 anos ou menos)
  const xTicks = [];
  const step = Math.max(1, Math.floor(projecaoAnual.length / 10));
  for (let i = 0; i < projecaoAnual.length; i += step) {
    xTicks.push(projecaoAnual[i]);
  }
  if (xTicks[xTicks.length - 1].ano !== projecaoAnual[projecaoAnual.length - 1].ano) {
    xTicks.push(projecaoAnual[projecaoAnual.length - 1]);
  }

  const formatYValue = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family: 'Public Sans', 'Arial', sans-serif;">
      <!-- Grid -->
      ${yTicks.map((tick) => `
        <line x1="${margin.left}" y1="${tick.y}" x2="${width - margin.right}" y2="${tick.y}" 
              stroke="#e3e3e3" stroke-dasharray="2,2" opacity="0.5"/>
      `).join('')}
      
      <!-- Eixos -->
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" 
            stroke="#577171" stroke-width="1"/>
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" 
            stroke="#577171" stroke-width="1"/>
      
      <!-- Linhas do gráfico -->
      <polyline points="${pontosBruto}" fill="none" stroke="#262d3d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${pontosLiquido}" fill="none" stroke="#98ab44" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${pontosEconomia}" fill="none" stroke="#becc6a" stroke-width="2" stroke-dasharray="5,5" stroke-linecap="round" stroke-linejoin="round"/>
      
      <!-- Eixo Y -->
      ${yTicks.map((tick) => `
        <line x1="${margin.left - 4}" y1="${tick.y}" x2="${margin.left}" y2="${tick.y}" stroke="#577171"/>
        <text x="${margin.left - 8}" y="${tick.y + 3}" text-anchor="end" fill="#577171" font-size="9">${formatYValue(tick.value)}</text>
      `).join('')}
      
      <!-- Eixo X -->
      ${xTicks.map((item) => `
        <line x1="${scaleX(item.ano)}" y1="${height - margin.bottom}" x2="${scaleX(item.ano)}" y2="${height - margin.bottom + 4}" stroke="#577171"/>
        <text x="${scaleX(item.ano)}" y="${height - margin.bottom + 16}" text-anchor="middle" fill="#577171" font-size="9">${item.ano}</text>
      `).join('')}
      
      <!-- Labels dos eixos -->
      <text x="${-height/2 + margin.top}" y="15" transform="rotate(-90)" text-anchor="middle" 
            fill="#262d3d" font-size="10" font-weight="600">Valor (R$)</text>
      <text x="${(margin.left + width - margin.right) / 2}" y="${height - 8}" text-anchor="middle" 
            fill="#262d3d" font-size="10" font-weight="600">Ano</text>
      
      <!-- Legenda -->
      <g transform="translate(${width - margin.right - 180}, ${margin.top})">
        <rect x="0" y="0" width="170" height="60" fill="white" stroke="#e3e3e3" rx="4"/>
        <line x1="10" y1="15" x2="30" y2="15" stroke="#262d3d" stroke-width="2"/>
        <text x="35" y="18" fill="#577171" font-size="9">Saldo Bruto</text>
        <line x1="10" y1="30" x2="30" y2="30" stroke="#98ab44" stroke-width="2"/>
        <text x="35" y="33" fill="#577171" font-size="9">Saldo Líquido</text>
        <line x1="10" y1="45" x2="30" y2="45" stroke="#becc6a" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="35" y="48" fill="#577171" font-size="9">Economia Fiscal</text>
      </g>
    </svg>
  `;
}

