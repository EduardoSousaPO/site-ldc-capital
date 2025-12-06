import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { formatCurrency, formatPercentage } from "@/lib/wealth-planning/calculations";
import { readFileSync } from "fs";
import { join } from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function generateReport(id: string) {
  const user = await checkAdminAuth();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("WealthPlanningScenario")
    .select(`
      *,
      Client:clientId (
        id,
        name,
        email,
        phone
      )
    `)
    .eq("id", id);

  if (user.role === "EDITOR") {
    query = query.eq("consultantId", user.id);
  }

  const { data: scenario, error } = await query.single();

  if (error || !scenario) {
    return NextResponse.json(
      { error: "Cenário não encontrado" },
      { status: 404 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html = generatePDFHTML(scenario as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanTitle = ((scenario as any).title || 'relatorio').replace(/[^a-zA-Z0-9]/g, '_');
  
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="relatorio-${cleanTitle}.html"`,
    },
  });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    return await generateReport(id);
  } catch (error) {
    console.error("Erro ao gerar PDF (GET):", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar PDF" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    return await generateReport(id);
  } catch (error) {
    console.error("Erro ao gerar PDF (POST):", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar PDF" },
      { status: 500 }
    );
  }
}

interface YearlyProjection {
  age: number;
  currentScenario?: number;
  maintenanceScenario?: number;
  consumptionScenario?: number;
}

function generateProjectionChartSVG(
  yearlyProjections: YearlyProjection[],
  retirementAge: number | undefined,
  width: number = 600,
  height: number = 300
): string {
  if (!yearlyProjections || yearlyProjections.length === 0) {
    return '<div style="text-align: center; padding: 20px; color: #577171; font-family: \'Public Sans\', sans-serif; font-size: 10pt;">Nenhum dado de projeção disponível</div>';
  }

  const margin = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  let minAge = Infinity;
  let maxAge = -Infinity;
  let minValue = Infinity;
  let maxValue = -Infinity;

  yearlyProjections.forEach((proj: YearlyProjection) => {
    const age = proj.age || 0;
    minAge = Math.min(minAge, age);
    maxAge = Math.max(maxAge, age);
    
    if (typeof proj.currentScenario === 'number' && !isNaN(proj.currentScenario) && isFinite(proj.currentScenario) && proj.currentScenario >= 0) {
      minValue = Math.min(minValue, proj.currentScenario);
      maxValue = Math.max(maxValue, proj.currentScenario);
    }
    if (typeof proj.maintenanceScenario === 'number' && !isNaN(proj.maintenanceScenario) && isFinite(proj.maintenanceScenario) && proj.maintenanceScenario > 0) {
      minValue = Math.min(minValue, proj.maintenanceScenario);
      maxValue = Math.max(maxValue, proj.maintenanceScenario);
    }
    if (typeof proj.consumptionScenario === 'number' && !isNaN(proj.consumptionScenario) && isFinite(proj.consumptionScenario) && proj.consumptionScenario > 0) {
      minValue = Math.min(minValue, proj.consumptionScenario);
      maxValue = Math.max(maxValue, proj.consumptionScenario);
    }
  });

  if (minAge === Infinity || maxAge === -Infinity || minValue === Infinity || maxValue === -Infinity) {
    return '<div style="text-align: center; padding: 20px; color: #577171; font-family: \'Public Sans\', sans-serif; font-size: 10pt;">Dados insuficientes para gerar gráfico</div>';
  }

  if (maxAge === minAge) maxAge = minAge + 1;
  if (maxValue === minValue) maxValue = minValue + 1000;

  minValue = Math.max(0, minValue * 0.9);
  maxValue = maxValue * 1.1;

  const scaleX = (age: number) => margin.left + ((age - minAge) / (maxAge - minAge)) * chartWidth;
  const scaleY = (value: number) => margin.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

  const currentPoints: string[] = [];
  const maintenancePoints: string[] = [];
  const consumptionPoints: string[] = [];

  yearlyProjections.forEach((proj: YearlyProjection) => {
    const x = scaleX(proj.age);
    
    if (typeof proj.currentScenario === 'number' && proj.currentScenario >= 0) {
      currentPoints.push(`${x},${scaleY(proj.currentScenario)}`);
    }
    if (typeof proj.maintenanceScenario === 'number' && proj.maintenanceScenario > 0) {
      maintenancePoints.push(`${x},${scaleY(proj.maintenanceScenario)}`);
    }
    if (typeof proj.consumptionScenario === 'number' && proj.consumptionScenario > 0) {
      consumptionPoints.push(`${x},${scaleY(proj.consumptionScenario)}`);
    }
  });

  const formatYValue = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  const yTicks: number[] = [];
  for (let i = 0; i <= 5; i++) {
    yTicks.push(minValue + (maxValue - minValue) * (i / 5));
  }

  const xTicks: number[] = [];
  for (let age = Math.ceil(minAge / 5) * 5; age <= maxAge; age += 5) {
    xTicks.push(age);
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family: 'Public Sans', 'Arial', sans-serif; max-width: 100%;">
      ${yTicks.map(y => `
        <line x1="${margin.left}" y1="${scaleY(y)}" x2="${width - margin.right}" y2="${scaleY(y)}" 
              stroke="#e3e3e3" stroke-dasharray="2,2" opacity="0.5"/>
      `).join('')}
      ${xTicks.map(x => `
        <line x1="${scaleX(x)}" y1="${margin.top}" x2="${scaleX(x)}" y2="${height - margin.bottom}" 
              stroke="#e3e3e3" stroke-dasharray="2,2" opacity="0.5"/>
      `).join('')}
      
      ${retirementAge && retirementAge >= minAge && retirementAge <= maxAge ? `
        <line x1="${scaleX(retirementAge)}" y1="${margin.top}" x2="${scaleX(retirementAge)}" y2="${height - margin.bottom}" 
              stroke="#dc2626" stroke-dasharray="4,4" stroke-width="1.5"/>
        <text x="${scaleX(retirementAge)}" y="${margin.top - 5}" text-anchor="middle" 
              fill="#dc2626" font-size="9" font-weight="600">Aposentadoria</text>
      ` : ''}
      
      ${currentPoints.length > 1 ? `
        <polyline points="${currentPoints.join(' ')}" fill="none" stroke="#262d3d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ` : ''}
      ${maintenancePoints.length > 1 ? `
        <polyline points="${maintenancePoints.join(' ')}" fill="none" stroke="#98ab44" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ` : ''}
      ${consumptionPoints.length > 1 ? `
        <polyline points="${consumptionPoints.join(' ')}" fill="none" stroke="#becc6a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ` : ''}
      
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" 
            stroke="#577171" stroke-width="1"/>
      ${yTicks.map(y => `
        <line x1="${margin.left - 4}" y1="${scaleY(y)}" x2="${margin.left}" y2="${scaleY(y)}" stroke="#577171"/>
        <text x="${margin.left - 8}" y="${scaleY(y) + 3}" text-anchor="end" fill="#577171" font-size="9" font-family="'Public Sans', 'Arial', sans-serif">${formatYValue(y)}</text>
      `).join('')}
      <text x="${-height/2 + margin.top}" y="15" transform="rotate(-90)" text-anchor="middle" 
            fill="#262d3d" font-size="10" font-weight="600" font-family="'Public Sans', 'Arial', sans-serif">Patrimônio (R$)</text>
      
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" 
            stroke="#577171" stroke-width="1"/>
      ${xTicks.map(x => `
        <line x1="${scaleX(x)}" y1="${height - margin.bottom}" x2="${scaleX(x)}" y2="${height - margin.bottom + 4}" stroke="#577171"/>
        <text x="${scaleX(x)}" y="${height - margin.bottom + 16}" text-anchor="middle" fill="#577171" font-size="9" font-family="'Public Sans', 'Arial', sans-serif">${x}</text>
      `).join('')}
      <text x="${(margin.left + width - margin.right) / 2}" y="${height - 8}" text-anchor="middle" 
            fill="#262d3d" font-size="10" font-weight="600" font-family="'Public Sans', 'Arial', sans-serif">Idade (anos)</text>
    </svg>
  `;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generatePDFHTML(scenario: any): string {
  const client = scenario.Client;
  const personalData = scenario.personalData || {};
  const financialData = scenario.financialData || {};
  const portfolio = scenario.portfolio || {};
  const assumptions = scenario.assumptions || {};
  const results = scenario.calculatedResults || {};
  
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
  
  const notRetired = results.notRetired;
  const familyProtection = results.familyProtection;

  const desiredAnnualIncome = (financialData?.desiredMonthlyRetirementIncome || 0) * 12;
  const expectedAnnualRevenues = (financialData?.expectedMonthlyRetirementRevenues || 0) * 12;
  const extraIncomeNeeded = desiredAnnualIncome - expectedAnnualRevenues;
  const currentCapital = portfolio?.total || 0;
  const yearsToRetirement = (personalData?.retirementAge || 0) - (personalData?.age || 0);
  const nominalRate = (assumptions?.retirementReturnNominal || 9.7) / 100;

  const calculateRequiredMonthlyContribution = (capitalNeeded: number, currentCapital: number, years: number, rate: number) => {
    if (years <= 0 || rate <= 0) return 0;
    const monthlyRate = Math.pow(1 + rate, 1/12) - 1;
    const months = years * 12;
    const futureValueCurrent = currentCapital * Math.pow(1 + monthlyRate, months);
    const needed = capitalNeeded - futureValueCurrent;
    if (needed <= 0) return 0;
    return needed * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const calculateCapitalUsing4PercentRule = (annualIncome: number) => {
    return annualIncome / 0.04;
  };

  const capitalNeeded4Percent = calculateCapitalUsing4PercentRule(extraIncomeNeeded);
  const requiredMonthlyContribution = calculateRequiredMonthlyContribution(
    capitalNeeded4Percent,
    currentCapital,
    yearsToRetirement,
    nominalRate
  );
  
  // Calcular valores para o resumo executivo
  const summaryCapitalGap = notRetired ? ((notRetired.currentScenario?.requiredCapital || 0) - (notRetired.currentScenario?.projectedCapital || 0)) : 0;
  const summaryIsOnTrack = summaryCapitalGap <= 0;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Wealth Planning - ${scenario.title}</title>
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
      gap: 20px;
      width: 100%;
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
    
    h3 {
      font-size: 8pt;
      color: #577171;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin: 12px 0 6px 0;
      font-weight: 600;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .summary-section {
      background: linear-gradient(to bottom right, rgba(152, 171, 68, 0.05), transparent);
      border: 2px solid rgba(152, 171, 68, 0.2);
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 24px;
    }
    
    .summary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    
    .summary-title {
      font-size: 24pt;
      font-weight: bold;
      color: #262d3d;
      font-family: 'Public Sans', 'Arial', sans-serif;
      margin: 0;
    }
    
    .summary-description {
      font-size: 9pt;
      color: #577171;
      font-family: 'Public Sans', 'Arial', sans-serif;
      margin-top: 4px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .metric-card {
      background: white;
      border: 2px solid #e3e3e3;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: box-shadow 0.2s;
    }
    
    .metric-label {
      font-size: 7pt;
      color: #577171;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 12px;
      font-weight: 600;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .metric-value {
      font-size: 24pt;
      font-weight: bold;
      color: #262d3d;
      font-family: 'Public Sans', 'Arial', sans-serif;
      line-height: 1.2;
    }
    
    .metric-subtext {
      font-size: 9pt;
      color: #dc2626;
      margin-top: 8px;
      font-weight: 500;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .metric-subtext-success {
      font-size: 9pt;
      color: #16a34a;
      margin-top: 8px;
      font-weight: 500;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .status-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e3e3e3;
    }
    
    .status-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .status-text {
      flex: 1;
    }
    
    .status-label {
      font-size: 9pt;
      font-weight: 600;
      color: #262d3d;
      font-family: 'Public Sans', 'Arial', sans-serif;
      margin-bottom: 4px;
    }
    
    .status-description {
      font-size: 8pt;
      color: #577171;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .status-badge {
      padding: 8px 16px;
      border-radius: 8px;
      font-family: 'Public Sans', 'Arial', sans-serif;
      font-weight: 600;
      font-size: 9pt;
    }
    
    .status-badge-success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    
    .status-badge-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    
    .thermometer-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    .thermometer-label-text {
      font-size: 7pt;
      color: #577171;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-weight: 600;
      font-family: 'Public Sans', 'Arial', sans-serif;
      margin-bottom: 4px;
    }
    
    .thermometer-bar {
      height: 24px;
      background: #e3e3e3;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      margin: 8px 0;
    }
    
    .thermometer-fill {
      height: 100%;
      background: #98ab44;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      color: white;
      font-weight: bold;
      font-size: 10pt;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .thermometer-markers {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 7pt;
      color: #577171;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .thermometer-info {
      padding: 10px;
      background: rgba(227, 227, 227, 0.3);
      border-radius: 6px;
      border: 1px solid #e3e3e3;
      margin-top: 10px;
    }
    
    .thermometer-label {
      font-weight: 600;
      font-size: 10pt;
      margin-bottom: 4px;
      color: #262d3d;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .thermometer-description {
      font-size: 8pt;
      color: #577171;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .thermometer-legend {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-top: 10px;
    }
    
    .legend-item {
      padding: 6px;
      border-radius: 4px;
      border: 1px solid;
      font-size: 7pt;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .legend-item-10 {
      background: rgba(152, 171, 68, 0.1);
      border-color: rgba(152, 171, 68, 0.3);
    }
    
    .legend-item-7 {
      background: rgba(190, 204, 106, 0.1);
      border-color: rgba(190, 204, 106, 0.3);
    }
    
    .legend-item-0 {
      background: rgba(38, 45, 61, 0.1);
      border-color: rgba(38, 45, 61, 0.3);
    }
    
    .legend-value {
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .legend-value-10 { color: #98ab44; }
    .legend-value-7 { color: #577171; }
    .legend-value-0 { color: #262d3d; }
    
    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 12px 0;
    }
    
    .param-list {
      background: white;
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 4px;
    }
    
    .param-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 6px;
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
    
    .chart-legend {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 8px;
      font-size: 7pt;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .chart-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .chart-legend-line {
      width: 24px;
      height: 2px;
    }
    
    .chart-legend-text {
      color: #577171;
    }
    
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 7pt;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .comparison-table thead tr {
      border-bottom: 2px solid #e3e3e3;
      background: #f8f9fa;
    }
    
    .comparison-table th {
      padding: 6px 4px;
      text-align: left;
      font-weight: 600;
      color: #577171;
      font-size: 7pt;
    }
    
    .comparison-table th.text-right {
      text-align: right;
    }
    
    .comparison-table th.text-center {
      text-align: center;
    }
    
    .comparison-table tbody tr {
      border-bottom: 1px solid #e3e3e3;
    }
    
    .comparison-table td {
      padding: 6px 4px;
      font-size: 7pt;
    }
    
    .comparison-table td.text-right {
      text-align: right;
    }
    
    .scenario-name {
      font-weight: 600;
      color: #262d3d;
      font-size: 8pt;
    }
    
    .scenario-desc {
      font-size: 7pt;
      color: #577171;
      margin-top: 2px;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 9999px;
      font-size: 7pt;
      font-weight: 500;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .badge-success {
      background: rgba(152, 171, 68, 0.2);
      color: #98ab44;
      border: 1px solid rgba(152, 171, 68, 0.3);
    }
    
    .badge-danger {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .scenario-card {
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 12px;
      margin: 8px 0;
      background: white;
    }
    
    .scenario-title {
      font-size: 9pt;
      font-weight: 600;
      color: #262d3d;
      margin-bottom: 2px;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .scenario-subtitle {
      font-size: 7pt;
      color: #577171;
      margin-bottom: 8px;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .scenario-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    
    .scenario-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    
    .scenario-item {
      font-size: 8pt;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .scenario-item-label {
      color: #577171;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      margin-bottom: 4px;
      font-size: 7pt;
      font-weight: 600;
    }
    
    .scenario-item-value {
      font-weight: 600;
      color: #262d3d;
      font-size: 9pt;
    }
    
    .protection-chart {
      background: white;
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 10px;
    }
    
    .protection-bar {
      height: 32px;
      background: #98ab44;
      border-radius: 4px;
      margin: 6px 0;
      display: flex;
      align-items: center;
      padding: 0 10px;
      color: white;
      font-size: 8pt;
      font-weight: 600;
      font-family: 'Public Sans', 'Arial', sans-serif;
    }
    
    .protection-values {
      background: white;
      border: 1px solid #e3e3e3;
      border-radius: 6px;
      padding: 4px;
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
  </style>
</head>
<body>
  <!-- CAPA COMPACTA -->
  <div class="header">
    <div class="header-content">
      <div class="logo-container">
        <img src="${logoBase64}" alt="LDC Capital" class="logo-img" />
      </div>
      <div class="header-title-section">
        <h1 class="serif">RELATÓRIO DE WEALTH PLANNING</h1>
        <div class="header-subtitle">Mais do que finanças, direção.</div>
      </div>
      <div class="client-info">
        <div class="client-box">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #262d3d; font-family: 'Public Sans', 'Arial', sans-serif;"><strong>Cliente:</strong></p>
          <p style="margin: 0; color: #577171; font-family: 'Public Sans', 'Arial', sans-serif;">${client?.name || "N/A"}</p>
        </div>
        <div class="client-box">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #262d3d; font-family: 'Public Sans', 'Arial', sans-serif;"><strong>Cenário:</strong></p>
          <p style="margin: 0; color: #577171; font-family: 'Public Sans', 'Arial', sans-serif;">${scenario.title}</p>
        </div>
        <div class="client-box">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #262d3d; font-family: 'Public Sans', 'Arial', sans-serif;"><strong>Data:</strong></p>
          <p style="margin: 0; color: #577171; font-family: 'Public Sans', 'Arial', sans-serif;">${new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </div>
    </div>
  </div>
  
  ${notRetired ? `
  <!-- RESUMO EXECUTIVO (ESTILO DASHBOARD) -->
  <div class="summary-section">
    <div class="summary-header">
      <div>
        <h2 class="summary-title sans">Resumo Executivo</h2>
        <p class="summary-description sans">Uma visão geral dos principais indicadores do seu cenário financeiro.</p>
      </div>
      ${notRetired.financialThermometer !== undefined ? `
      <div class="thermometer-container">
        <div class="thermometer-label-text sans">Indicador Financeiro</div>
        <div class="thermometer-bar" style="width: 120px;">
          <div class="thermometer-fill" style="width: ${Math.min(100, (notRetired.financialThermometer / 10) * 100)}%;">
            ${notRetired.financialThermometer.toFixed(1)}
          </div>
        </div>
        <div class="thermometer-markers" style="width: 120px;">
          <span>0</span>
          <span>7</span>
          <span>10</span>
        </div>
      </div>
      ` : ''}
    </div>
    
    <!-- KPIs PRINCIPAIS -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label sans">Capital Projetado</div>
        <div class="metric-value sans">${formatCurrency(notRetired.currentScenario?.projectedCapital || 0)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label sans">Capital Necessário</div>
        <div class="metric-value sans">${formatCurrency(notRetired.currentScenario?.requiredCapital || 0)}</div>
        ${summaryCapitalGap > 0 ? `
        <div class="metric-subtext sans">Faltam ${formatCurrency(summaryCapitalGap)}</div>
        ` : `
        <div class="metric-subtext-success sans">Meta alcançada ✓</div>
        `}
      </div>
      <div class="metric-card">
        <div class="metric-label sans">Rentabilidade Necessária</div>
        <div class="metric-value sans">${formatPercentage((notRetired.currentScenario?.requiredRate || 0) * 100)}</div>
        ${notRetired.currentScenario?.requiredRealRate !== undefined ? `
        <div class="metric-subtext sans" style="color: #577171;">Real: ${formatPercentage(notRetired.currentScenario.requiredRealRate * 100)}</div>
        ` : ''}
      </div>
      <div class="metric-card">
        <div class="metric-label sans">Aporte Mensal Necessário</div>
        <div class="metric-value sans">${formatCurrency(requiredMonthlyContribution)}</div>
        ${requiredMonthlyContribution > (financialData?.monthlySavings || 0) ? `
        <div class="metric-subtext sans">+${formatCurrency(requiredMonthlyContribution - (financialData?.monthlySavings || 0))} necessário</div>
        ` : `
        <div class="metric-subtext-success sans">Aporte suficiente ✓</div>
        `}
      </div>
    </div>
    
    <!-- STATUS GERAL -->
    <div class="status-section">
      <div class="status-content">
        <div class="status-text">
          <div class="status-label sans">Status do Planejamento</div>
          <div class="status-description sans">
            ${summaryIsOnTrack
              ? "Seu planejamento está no caminho certo para alcançar seus objetivos."
              : "Ajustes são necessários para alcançar seus objetivos de aposentadoria."}
          </div>
        </div>
        <div class="status-badge ${summaryIsOnTrack ? 'status-badge-success' : 'status-badge-warning'} sans">
          ${summaryIsOnTrack ? "No Caminho Certo" : "Ajustes Necessários"}
        </div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <!-- TERMÔMETRO FINANCEIRO DETALHADO -->
  ${notRetired.financialThermometer !== undefined ? `
  <div class="thermometer-container" style="border: 1px solid #e3e3e3; border-radius: 6px; padding: 12px; margin: 12px 0; background: white;">
    <h3 class="sans">Termômetro Financeiro</h3>
    <div>
      <div class="thermometer-bar">
        <div class="thermometer-fill" style="width: ${Math.min(100, (notRetired.financialThermometer / 10) * 100)}%;">
          ${notRetired.financialThermometer.toFixed(1)}
        </div>
      </div>
      <div class="thermometer-markers">
        <span>0</span>
        <span>7</span>
        <span>10</span>
      </div>
      
      <div class="thermometer-info">
        <div class="thermometer-label sans">
          ${notRetired.financialThermometer >= 10 ? 'Em linha para viver de renda' : 
            notRetired.financialThermometer >= 7 ? 'Em linha para manter o padrão de vida desejado' : 
            'Atenção, padrão de vida ameaçado'}
        </div>
        <p class="thermometer-description sans">
          ${notRetired.financialThermometer >= 10 ? 
            'Seu capital projetado é suficiente para viver apenas dos rendimentos, sem consumir o principal.' : 
            notRetired.financialThermometer >= 7 ? 
            'Seu capital projetado permite manter o padrão de vida desejado, mas pode ser necessário consumir parte do patrimônio.' : 
            'Seu capital projetado é insuficiente. Considere aumentar a poupança, adiar a aposentadoria ou ajustar suas expectativas.'}
        </p>
      </div>
      
      <div class="thermometer-legend">
        <div class="legend-item legend-item-10">
          <div class="legend-value legend-value-10 sans">≥10</div>
          <div class="sans" style="color: #262d3d; font-size: 7pt;">Em linha para viver de renda</div>
        </div>
        <div class="legend-item legend-item-7">
          <div class="legend-value legend-value-7 sans">≥7</div>
          <div class="sans" style="color: #262d3d; font-size: 7pt;">Em linha para manter padrão</div>
        </div>
        <div class="legend-item legend-item-0">
          <div class="legend-value legend-value-0 sans">0</div>
          <div class="sans" style="color: #262d3d; font-size: 7pt;">Atenção, padrão ameaçado</div>
        </div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <!-- PARÂMETROS E GRÁFICO / COMPARAÇÃO E DETALHES -->
  <div class="two-columns">
    <!-- Coluna Esquerda -->
    <div>
      <h3 class="sans">Parâmetros</h3>
      <div class="param-list">
        <div class="param-item">
          <span class="param-label sans">Idade Atual</span>
          <span class="param-value sans">${personalData?.age || "N/A"} anos</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Idade Aposentadoria</span>
          <span class="param-value sans">${personalData?.retirementAge || "N/A"} anos</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Capital Atual</span>
          <span class="param-value sans">${formatCurrency(currentCapital)}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Poupança Mensal</span>
          <span class="param-value sans">${formatCurrency(financialData?.monthlySavings || 0)}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Renda Desejada (Mensal)</span>
          <span class="param-value sans">${formatCurrency(financialData?.desiredMonthlyRetirementIncome || 0)}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Receitas Previstas (Mensal)</span>
          <span class="param-value sans">${formatCurrency(financialData?.expectedMonthlyRetirementRevenues || 0)}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Retorno Esperado (%)</span>
          <span class="param-value sans">${((assumptions?.retirementReturnNominal || 0) / 100).toFixed(2)}%</span>
        </div>
      </div>
      
      ${notRetired.yearlyProjections && notRetired.yearlyProjections.length > 0 ? `
      <div class="chart-container">
        <div class="chart-title serif">Projeção de Patrimônio ao Longo do Tempo</div>
        <div style="width: 100%; overflow: hidden;">
          ${generateProjectionChartSVG(notRetired.yearlyProjections, personalData?.retirementAge, 550, 280)}
        </div>
        <div class="chart-legend">
          <div class="chart-legend-item">
            <div class="chart-legend-line" style="background: #262d3d;"></div>
            <span class="chart-legend-text">Cenário com poupança atual</span>
          </div>
          <div class="chart-legend-item">
            <div class="chart-legend-line" style="background: #98ab44;"></div>
            <span class="chart-legend-text">Viver de renda (patrimônio preservado)</span>
          </div>
          <div class="chart-legend-item">
            <div class="chart-legend-line" style="background: #becc6a;"></div>
            <span class="chart-legend-text">Consumir patrimônio gradualmente</span>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
    
    <!-- Coluna Direita -->
    <div>
      <h3 class="sans">Comparação de Cenários</h3>
      <div style="background: white; border: 1px solid #e3e3e3; border-radius: 6px; padding: 8px;">
        <table class="comparison-table">
          <thead>
            <tr>
              <th class="sans">Cenário</th>
              <th class="sans text-right">Poupança Anual</th>
              <th class="sans text-right">Capital Acumulado</th>
              <th class="sans text-right">Capital Necessário</th>
              <th class="sans text-right">Rent. Nominal</th>
              <th class="sans text-right">Rent. Real</th>
              <th class="sans text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="scenario-name sans">Projeção Atual</div>
                <div class="scenario-desc sans">Cenário baseado na poupança atual</div>
              </td>
              <td class="text-right sans">${formatCurrency(notRetired.currentScenario?.annualSavings || 0)}</td>
              <td class="text-right sans">${formatCurrency(notRetired.currentScenario?.projectedCapital || 0)}</td>
              <td class="text-right sans">${formatCurrency(notRetired.currentScenario?.requiredCapital || 0)}</td>
              <td class="text-right sans">${formatPercentage((notRetired.currentScenario?.requiredRate || 0) * 100)}</td>
              <td class="text-right sans">${notRetired.currentScenario?.requiredRealRate !== undefined ? formatPercentage(notRetired.currentScenario.requiredRealRate * 100) : "N/A"}</td>
              <td class="text-center">
                ${notRetired.currentScenario?.withinProfile ? 
                  '<span class="badge badge-success sans">Dentro do Perfil</span>' : 
                  '<span class="badge badge-danger sans">Fora do Perfil</span>'}
              </td>
            </tr>
            <tr>
              <td>
                <div class="scenario-name sans" style="color: #98ab44;">Manutenção do Patrimônio</div>
                <div class="scenario-desc sans">Viver apenas dos rendimentos</div>
              </td>
              <td class="text-right sans">${formatCurrency(notRetired.maintenanceScenario?.annualSavings || 0)}</td>
              <td class="text-right sans">${formatCurrency(notRetired.maintenanceScenario?.accumulatedCapital || 0)}</td>
              <td class="text-right sans">${formatCurrency(notRetired.maintenanceScenario?.requiredCapital || 0)}</td>
              <td class="text-right sans">${formatPercentage((notRetired.maintenanceScenario?.requiredRate || 0) * 100)}</td>
              <td class="text-right sans">${notRetired.maintenanceScenario?.requiredRealRate !== undefined ? formatPercentage(notRetired.maintenanceScenario.requiredRealRate * 100) : "N/A"}</td>
              <td class="text-center">
                ${notRetired.maintenanceScenario?.withinProfile ? 
                  '<span class="badge badge-success sans">Dentro do Perfil</span>' : 
                  '<span class="badge badge-danger sans">Fora do Perfil</span>'}
              </td>
            </tr>
            <tr>
              <td>
                <div class="scenario-name sans" style="color: #dc2626;">Consumo do Patrimônio</div>
                <div class="scenario-desc sans">Consumir parte do patrimônio</div>
              </td>
              <td class="text-right sans">${formatCurrency(notRetired.consumptionScenario?.annualSavings || 0)}</td>
              <td class="text-right sans">${formatCurrency(notRetired.consumptionScenario?.accumulatedCapital || 0)}</td>
              <td class="text-right sans">${formatCurrency(notRetired.consumptionScenario?.requiredCapital || 0)}</td>
              <td class="text-right sans">${formatPercentage((notRetired.consumptionScenario?.requiredRate || 0) * 100)}</td>
              <td class="text-right sans">${notRetired.consumptionScenario?.requiredRealRate !== undefined ? formatPercentage(notRetired.consumptionScenario.requiredRealRate * 100) : "N/A"}</td>
              <td class="text-center">
                ${notRetired.consumptionScenario?.withinProfile ? 
                  '<span class="badge badge-success sans">Dentro do Perfil</span>' : 
                  '<span class="badge badge-danger sans">Fora do Perfil</span>'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <h3 class="sans" style="margin-top: 12px;">Detalhes dos Cenários</h3>
      
      <div class="scenario-card">
        <div class="scenario-header">
          <div>
            <div class="scenario-title sans">Projeção Atual</div>
            <div class="scenario-subtitle sans">Cenário baseado na poupança atual</div>
          </div>
          ${notRetired.currentScenario?.withinProfile ? 
            '<span class="badge badge-success sans">Dentro do Perfil</span>' : 
            '<span class="badge badge-danger sans">Fora do Perfil</span>'}
        </div>
        <div class="scenario-grid">
          <div class="scenario-item">
            <div class="scenario-item-label sans">Poupança Anual</div>
            <div class="scenario-item-value sans">${formatCurrency(notRetired.currentScenario?.annualSavings || 0)}</div>
          </div>
          <div class="scenario-item">
            <div class="scenario-item-label sans">Capital Acumulado</div>
            <div class="scenario-item-value sans">${formatCurrency(notRetired.currentScenario?.projectedCapital || 0)}</div>
          </div>
          <div class="scenario-item">
            <div class="scenario-item-label sans">Rentabilidade Necessária</div>
            <div class="scenario-item-value sans">
              ${formatPercentage((notRetired.currentScenario?.requiredRate || 0) * 100)}
              ${notRetired.currentScenario?.requiredRealRate !== undefined ? 
                '<span style="color: #577171; font-weight: normal; font-size: 8pt;">(' + formatPercentage(notRetired.currentScenario.requiredRealRate * 100) + ' real)</span>' : ''}
            </div>
          </div>
          <div class="scenario-item">
            <div class="scenario-item-label sans">Capital Necessário</div>
            <div class="scenario-item-value sans">${formatCurrency(notRetired.currentScenario?.requiredCapital || 0)}</div>
          </div>
        </div>
      </div>
      
      <div class="scenario-card">
        <div class="scenario-header">
          <div>
            <div class="scenario-title sans">Manutenção do Patrimônio</div>
            <div class="scenario-subtitle sans">Viver apenas dos rendimentos</div>
          </div>
          ${notRetired.maintenanceScenario?.withinProfile ? 
            '<span class="badge badge-success sans">Dentro do Perfil</span>' : 
            '<span class="badge badge-danger sans">Fora do Perfil</span>'}
        </div>
        <div class="scenario-grid">
          <div class="scenario-item">
            <div class="scenario-item-label sans">Poupança Anual</div>
            <div class="scenario-item-value sans">${formatCurrency(notRetired.maintenanceScenario?.annualSavings || 0)}</div>
          </div>
          <div class="scenario-item">
            <div class="scenario-item-label sans">Capital Acumulado</div>
            <div class="scenario-item-value sans">${formatCurrency(notRetired.maintenanceScenario?.accumulatedCapital || 0)}</div>
          </div>
          <div class="scenario-item">
            <div class="scenario-item-label sans">Rentabilidade Necessária</div>
            <div class="scenario-item-value sans">
              ${formatPercentage((notRetired.maintenanceScenario?.requiredRate || 0) * 100)}
              ${notRetired.maintenanceScenario?.requiredRealRate !== undefined ? 
                '<span style="color: #577171; font-weight: normal; font-size: 8pt;">(' + formatPercentage(notRetired.maintenanceScenario.requiredRealRate * 100) + ' real)</span>' : ''}
            </div>
          </div>
          <div class="scenario-item">
            <div class="scenario-item-label sans">Capital Necessário</div>
            <div class="scenario-item-value sans">${formatCurrency(notRetired.maintenanceScenario?.requiredCapital || 0)}</div>
          </div>
        </div>
      </div>
      
      <div class="scenario-card">
        <div class="scenario-header">
          <div>
            <div class="scenario-title sans">Consumo do Patrimônio</div>
            <div class="scenario-subtitle sans">Consumir parte do patrimônio</div>
          </div>
          ${notRetired.consumptionScenario?.withinProfile ? 
            '<span class="badge badge-success sans">Dentro do Perfil</span>' : 
            '<span class="badge badge-danger sans">Fora do Perfil</span>'}
        </div>
        <div class="scenario-grid">
          <div class="scenario-item">
            <div class="scenario-item-label sans">Poupança Anual</div>
            <div class="scenario-item-value sans">${formatCurrency(notRetired.consumptionScenario?.annualSavings || 0)}</div>
          </div>
          <div class="scenario-item">
            <div class="scenario-item-label sans">Capital Acumulado</div>
            <div class="scenario-item-value sans">${formatCurrency(notRetired.consumptionScenario?.accumulatedCapital || 0)}</div>
          </div>
          <div class="scenario-item">
            <div class="scenario-item-label sans">Rentabilidade Necessária</div>
            <div class="scenario-item-value sans">
              ${formatPercentage((notRetired.consumptionScenario?.requiredRate || 0) * 100)}
              ${notRetired.consumptionScenario?.requiredRealRate !== undefined ? 
                '<span style="color: #577171; font-weight: normal; font-size: 8pt;">(' + formatPercentage(notRetired.consumptionScenario.requiredRealRate * 100) + ' real)</span>' : ''}
            </div>
          </div>
          <div class="scenario-item">
            <div class="scenario-item-label sans">Capital Necessário</div>
            <div class="scenario-item-value sans">${formatCurrency(notRetired.consumptionScenario?.requiredCapital || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  
  <!-- PERFIL E PREMISSAS / PROTEÇÃO FAMILIAR -->
  <div class="two-columns">
    <div>
      <h3 class="sans">Perfil e Premissas</h3>
      <div class="param-list">
        <div class="param-item">
          <span class="param-label sans">Perfil de Risco</span>
          <span class="param-value sans">${personalData?.suitability || "Não informado"}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Rentabilidade Aposentadoria (Nominal)</span>
          <span class="param-value sans">${formatPercentage((assumptions?.retirementReturnNominal || 0) / 100)}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Juro Real na Aposentadoria</span>
          <span class="param-value sans">${formatPercentage((assumptions?.retirementRealRate || 0) / 100)}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Inflação Anual</span>
          <span class="param-value sans">${formatPercentage(assumptions?.annualInflation || 0)}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">CDI Anual</span>
          <span class="param-value sans">${formatPercentage(assumptions?.annualCDI || 0)}</span>
        </div>
      </div>
    </div>
    
    ${familyProtection ? `
    <div>
      <h3 class="sans">Proteção Familiar</h3>
      <div class="protection-chart">
        <div class="protection-bar" style="width: 100%;">
          Proteção Imediata: ${formatCurrency(familyProtection.immediateProtection)}
        </div>
        <div class="protection-bar" style="width: ${Math.max(10, (familyProtection.successionLiquidity / familyProtection.totalProtection) * 100)}%;">
          Liquidez Sucessão: ${formatCurrency(familyProtection.successionLiquidity)}
        </div>
        <div class="protection-bar" style="width: 100%;">
          Proteção Total: ${formatCurrency(familyProtection.totalProtection)}
        </div>
      </div>
      <div class="protection-values">
        <div class="param-item">
          <span class="param-label sans">Proteção Total Necessária</span>
          <span class="param-value sans">${formatCurrency(familyProtection.totalProtection)}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Proteção Imediata</span>
          <span class="param-value sans">${formatCurrency(familyProtection.immediateProtection)}</span>
        </div>
        <div class="param-item">
          <span class="param-label sans">Liquidez para Sucessão</span>
          <span class="param-value sans">${formatCurrency(familyProtection.successionLiquidity)}</span>
        </div>
        ${familyProtection.spouseProtection ? `
        <div class="param-item">
          <span class="param-label sans">Proteção para Cônjuge</span>
          <span class="param-value sans">${formatCurrency(familyProtection.spouseProtection)}</span>
        </div>
        ` : ''}
        ${familyProtection.dependentsProtection ? `
        <div class="param-item">
          <span class="param-label sans">Proteção para Dependentes</span>
          <span class="param-value sans">${formatCurrency(familyProtection.dependentsProtection)}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
  </div>
  
  <div class="footer">
    <p class="sans">LDC Capital - Mais do que finanças, direção | www.ldccapital.com.br</p>
    <p class="sans">Este relatório é destinado exclusivamente ao cliente mencionado.</p>
  </div>
</body>
</html>
  `;
}
