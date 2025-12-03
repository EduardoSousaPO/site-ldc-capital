import type { WealthPlanningScenario, CalculationResults, Dependent } from "@/types/wealth-planning";

/**
 * Gera HTML do template de PDF diretamente (sem React Server Components)
 * Esta função gera HTML puro para evitar problemas com react-dom/server
 */
export function generatePDFHTML(
  scenario: WealthPlanningScenario,
  results: CalculationResults
): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  };

  // Gerar HTML diretamente
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
        font-size: 24px;
        color: #262d3d;
        margin-bottom: 10px;
      }
      .header .subtitle {
        color: #666;
        font-size: 14px;
      }
      .section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 18px;
        color: #98ab44;
        border-bottom: 2px solid #98ab44;
        padding-bottom: 5px;
        margin-bottom: 15px;
        font-weight: bold;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
        font-size: 11px;
      }
      table th {
        background-color: #f5f5f5;
        padding: 8px;
        text-align: left;
        border: 1px solid #ddd;
        font-weight: bold;
      }
      table td {
        padding: 8px;
        border: 1px solid #ddd;
      }
      table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .summary-box {
        background-color: #f5f5f5;
        padding: 15px;
        border-left: 4px solid #98ab44;
        margin-bottom: 15px;
      }
      .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      .summary-label {
        font-weight: bold;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
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
        <strong>Data de Geração:</strong> ${formatDate(new Date())}
      </div>
    </div>

    <div class="section">
      <div class="section-title">1. Dados Pessoais e Familiares</div>
      <table>
        <tbody>
          <tr>
            <th>Nome</th>
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
            <th>Estado Civil</th>
            <td>${scenario.personalData?.maritalStatus || "Não informado"}</td>
          </tr>
          <tr>
            <th>Profissão</th>
            <td>${scenario.personalData?.profession || "Não informado"}</td>
          </tr>
          <tr>
            <th>Perfil de Risco</th>
            <td>${scenario.personalData?.suitability || "Não informado"}</td>
          </tr>
          ${scenario.personalData?.dependents && scenario.personalData.dependents.length > 0 ? `
          <tr>
            <th>Dependentes</th>
            <td>
              ${scenario.personalData.dependents.map((dep: Dependent) => 
                `${dep.name || "Sem nome"} (${dep.age || 0} anos)`
              ).join(", ")}
            </td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">2. Informações Financeiras</div>
      <table>
        <tbody>
          <tr>
            <th>Despesa Familiar Mensal</th>
            <td>${formatCurrency(scenario.financialData?.monthlyFamilyExpense || 0)}</td>
          </tr>
          <tr>
            <th>Renda Mensal Desejada na Aposentadoria</th>
            <td>${formatCurrency(scenario.financialData?.desiredMonthlyRetirementIncome || 0)}</td>
          </tr>
          <tr>
            <th>Poupança Mensal</th>
            <td>${formatCurrency(scenario.financialData?.monthlySavings || 0)}</td>
          </tr>
          <tr>
            <th>Receitas Mensais Previstas na Aposentadoria</th>
            <td>${formatCurrency(scenario.financialData?.expectedMonthlyRetirementRevenues || 0)}</td>
          </tr>
          <tr>
            <th>Objetivo dos Investimentos</th>
            <td>${scenario.financialData?.investmentObjective || "Não informado"}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${results.notRetired ? `
    <div class="section page-break">
      <div class="section-title">3. Resultados - Cenários para Não Aposentado</div>
      <div class="summary-box">
        <div class="summary-item">
          <span class="summary-label">Cenário 1 - Projeção Atual:</span>
          <span>Capital Projetado: ${formatCurrency(results.notRetired.currentScenario?.projectedCapital || 0)} | Capital Necessário: ${formatCurrency(results.notRetired.currentScenario?.requiredCapital || 0)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Cenário 2 - Manutenção:</span>
          <span>Capital Necessário: ${formatCurrency(results.notRetired.maintenanceScenario?.requiredCapital || 0)} | Rentabilidade: ${results.notRetired.maintenanceScenario?.requiredRate ? formatPercentage(results.notRetired.maintenanceScenario.requiredRate) : "N/A"}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Cenário 3 - Consumo:</span>
          <span>Capital Necessário: ${formatCurrency(results.notRetired.consumptionScenario?.requiredCapital || 0)} | Rentabilidade: ${results.notRetired.consumptionScenario?.requiredRate ? formatPercentage(results.notRetired.consumptionScenario.requiredRate) : "N/A"}</span>
        </div>
        ${results.notRetired.financialThermometer !== undefined && results.notRetired.financialThermometer !== null ? `
        <div class="summary-item">
          <span class="summary-label">Termômetro Financeiro:</span>
          <span>${results.notRetired.financialThermometer.toFixed(1)}/10</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    ${(() => {
      // Calcular aporte mensal necessário usando regra dos 4%
      const desiredAnnualIncome = (scenario.financialData?.desiredMonthlyRetirementIncome || 0) * 12;
      const expectedAnnualRevenues = (scenario.financialData?.expectedMonthlyRetirementRevenues || 0) * 12;
      const extraIncomeNeeded = desiredAnnualIncome - expectedAnnualRevenues;
      const capitalNeeded4Percent = extraIncomeNeeded / 0.04;
      const currentCapital = scenario.portfolio?.total || 0;
      const yearsToRetirement = (scenario.personalData?.retirementAge || 0) - (scenario.personalData?.age || 0);
      const nominalRate = (scenario.assumptions?.retirementReturnNominal || 9.7) / 100;
      
      if (yearsToRetirement > 0 && extraIncomeNeeded > 0) {
        // Calcular taxa mensal
        const taxaMensal = Math.pow(1 + nominalRate, 1/12) - 1;
        const periodos = yearsToRetirement * 12;
        const valorFuturoPatrimonio = currentCapital * Math.pow(1 + taxaMensal, periodos);
        const aporteMensal = taxaMensal === 0 
          ? (capitalNeeded4Percent - valorFuturoPatrimonio) / periodos
          : (capitalNeeded4Percent - valorFuturoPatrimonio) * taxaMensal / (Math.pow(1 + taxaMensal, periodos) - 1);
        const currentMonthlySavings = scenario.financialData?.monthlySavings || 0;
        const gap = Math.max(0, aporteMensal - currentMonthlySavings);
        
        return `
    <div class="section">
      <div class="section-title">4. Calculadora de Aporte Mensal (Regra dos 4%)</div>
      <div class="summary-box">
        <div class="summary-item">
          <span class="summary-label">Renda adicional necessária (anual):</span>
          <span>${formatCurrency(extraIncomeNeeded)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Capital necessário (regra dos 4%):</span>
          <span>${formatCurrency(capitalNeeded4Percent)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Capital atual:</span>
          <span>${formatCurrency(currentCapital)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Falta acumular:</span>
          <span>${formatCurrency(Math.max(0, capitalNeeded4Percent - currentCapital))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Aporte mensal necessário:</span>
          <span><strong>${formatCurrency(Math.max(0, aporteMensal))}</strong></span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Aporte mensal atual:</span>
          <span>${formatCurrency(currentMonthlySavings)}</span>
        </div>
        ${gap > 0 ? `
        <div class="summary-item" style="color: #dc2626; font-weight: bold;">
          <span class="summary-label">⚠️ Falta aportar mensalmente:</span>
          <span>${formatCurrency(gap)}</span>
        </div>
        ` : `
        <div class="summary-item" style="color: #16a34a; font-weight: bold;">
          <span class="summary-label">✅ Aporte atual é suficiente</span>
        </div>
        `}
        <div class="summary-item" style="font-size: 10px; color: #666; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
          <span>Parâmetros: ${yearsToRetirement} anos até aposentadoria, retorno esperado de ${(nominalRate * 100).toFixed(2)}% ao ano</span>
        </div>
      </div>
    </div>
        `;
      }
      return '';
    })()}
    ` : ''}
    
    ${results.retired ? `
    <div class="section page-break">
      <div class="section-title">3. Resultados - Cenários para Aposentado</div>
      <div class="summary-box">
        <div class="summary-item">
          <span class="summary-label">Carteira Atual:</span>
          <span>Saldo Final: ${formatCurrency(results.retired.currentPortfolio?.finalBalance || 0)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Renda Vitalícia:</span>
          <span>Saldo Final: ${formatCurrency(results.retired.lifetimeIncomePortfolio?.finalBalance || 0)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Consumo Financeiro:</span>
          <span>Saldo Final: ${formatCurrency(results.retired.financialConsumptionPortfolio?.finalBalance || 0)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Consumo Total:</span>
          <span>Saldo Final: ${formatCurrency(results.retired.totalConsumptionPortfolio?.finalBalance || 0)}</span>
        </div>
      </div>
    </div>
    ` : ''}

    ${results.familyProtection ? `
    <div class="section page-break">
      <div class="section-title">4. Proteção Familiar</div>
      <div class="summary-box">
        <div class="summary-item">
          <span class="summary-label">Proteção Total Necessária:</span>
          <span>${formatCurrency(results.familyProtection?.totalProtection || 0)}</span>
        </div>
        ${results.familyProtection?.spouseProtection ? `
        <div class="summary-item">
          <span class="summary-label">Proteção para Cônjuge:</span>
          <span>${formatCurrency(results.familyProtection.spouseProtection)}</span>
        </div>
        ` : ''}
        ${results.familyProtection?.dependentsProtection ? `
        <div class="summary-item">
          <span class="summary-label">Proteção para Dependentes:</span>
          <span>${formatCurrency(results.familyProtection.dependentsProtection)}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p>Relatório gerado em ${formatDate(new Date())}</p>
      <p>LDC Capital - Planejamento Financeiro</p>
    </div>
  </body>
</html>`;

  return html;
}

/**
 * Gera PDF usando a API de impressão do navegador
 * Esta função retorna o HTML que pode ser impresso como PDF pelo navegador
 */
export function generatePDFForBrowser(
  scenario: WealthPlanningScenario,
  results: CalculationResults
): string {
  return generatePDFHTML(scenario, results);
}

