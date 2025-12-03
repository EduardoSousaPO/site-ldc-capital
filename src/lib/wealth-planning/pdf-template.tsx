import React from "react";
import type {
  WealthPlanningScenario,
  CalculationResults,
} from "@/types/wealth-planning";

interface PDFTemplateProps {
  scenario: WealthPlanningScenario;
  results: CalculationResults;
}

export function PDFTemplate({ scenario, results }: PDFTemplateProps) {
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

  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="UTF-8" />
        <title>Relatório - {scenario.title}</title>
        <style>{`
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
          .subsection {
            margin-bottom: 20px;
          }
          .subsection-title {
            font-size: 14px;
            font-weight: bold;
            color: #262d3d;
            margin-bottom: 10px;
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
          .summary-box h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #262d3d;
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
          .page-break {
            page-break-before: always;
          }
          @media print {
            body {
              padding: 20px;
            }
            .page-break {
              page-break-before: always;
            }
          }
        `}</style>
      </head>
      <body>
        {/* Cabeçalho */}
        <div className="header">
          <h1>Relatório de Planejamento Financeiro</h1>
          <div className="subtitle">
            <strong>Cenário:</strong> {scenario.title}
          </div>
          <div className="subtitle">
            <strong>Data de Geração:</strong> {formatDate(new Date())}
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="section">
          <div className="section-title">1. Dados Pessoais e Familiares</div>
          <table>
            <tbody>
              <tr>
                <th>Nome</th>
                <td>{scenario.personalData.name}</td>
              </tr>
              <tr>
                <th>Idade</th>
                <td>{scenario.personalData.age} anos</td>
              </tr>
              <tr>
                <th>Idade de Aposentadoria</th>
                <td>{scenario.personalData.retirementAge} anos</td>
              </tr>
              <tr>
                <th>Expectativa de Vida</th>
                <td>{scenario.personalData.lifeExpectancy} anos</td>
              </tr>
              <tr>
                <th>Estado Civil</th>
                <td>{scenario.personalData.maritalStatus}</td>
              </tr>
              <tr>
                <th>Profissão</th>
                <td>{scenario.personalData.profession || "Não informado"}</td>
              </tr>
              <tr>
                <th>Perfil de Risco</th>
                <td>{scenario.personalData.suitability}</td>
              </tr>
            </tbody>
          </table>
          {scenario.personalData.dependents &&
            scenario.personalData.dependents.length > 0 && (
              <div className="subsection">
                <div className="subsection-title">Dependentes</div>
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Idade</th>
                      <th>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.personalData.dependents.map((dep, idx) => (
                      <tr key={idx}>
                        <td>{dep.name}</td>
                        <td>{dep.age} anos</td>
                        <td>{dep.observations || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {/* Informações Financeiras */}
        <div className="section">
          <div className="section-title">2. Informações Financeiras</div>
          <table>
            <tbody>
              <tr>
                <th>Despesa Familiar Mensal</th>
                <td>{formatCurrency(scenario.financialData.monthlyFamilyExpense)}</td>
              </tr>
              <tr>
                <th>Renda Mensal Desejada na Aposentadoria</th>
                <td>
                  {formatCurrency(
                    scenario.financialData.desiredMonthlyRetirementIncome
                  )}
                </td>
              </tr>
              <tr>
                <th>Poupança Mensal</th>
                <td>{formatCurrency(scenario.financialData.monthlySavings)}</td>
              </tr>
              <tr>
                <th>Receitas Mensais Previstas na Aposentadoria</th>
                <td>
                  {formatCurrency(
                    scenario.financialData.expectedMonthlyRetirementRevenues
                  )}
                </td>
              </tr>
              <tr>
                <th>Objetivo dos Investimentos</th>
                <td>{scenario.financialData.investmentObjective}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Carteira */}
        <div className="section">
          <div className="section-title">3. Composição da Carteira</div>
          <table>
            <thead>
              <tr>
                <th>Ativo</th>
                <th>Valor (R$)</th>
                <th>% da Carteira</th>
                <th>Rentabilidade (% CDI)</th>
              </tr>
            </thead>
            <tbody>
              {scenario.portfolio.assets.map((asset, idx) => (
                <tr key={idx}>
                  <td>{asset.name}</td>
                  <td>{formatCurrency(asset.value)}</td>
                  <td>{asset.percentage.toFixed(2)}%</td>
                  <td>{(asset.cdiRate * 100).toFixed(2)}%</td>
                </tr>
              ))}
              <tr style={{ fontWeight: "bold" }}>
                <td>Total</td>
                <td>{formatCurrency(scenario.portfolio.total)}</td>
                <td>100.00%</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
          <div className="summary-box">
            <div className="summary-item">
              <span className="summary-label">I.R Considerado:</span>
              <span>{scenario.portfolio.taxConsideration}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Necessidade de Liquidez Imediata:</span>
              <span>{scenario.portfolio.immediateLiquidityNeeds}%</span>
            </div>
          </div>
        </div>

        {/* Resultados dos Cálculos */}
        {results.notRetired && (
          <div className="section page-break">
            <div className="section-title">4. Resultados - Cenários para Não Aposentado</div>
            <div className="subsection">
              <div className="subsection-title">Cenário 1: Projeção Atual</div>
              <div className="summary-box">
                <div className="summary-item">
                  <span className="summary-label">Poupança Anual:</span>
                  <span>{formatCurrency(results.notRetired.currentScenario.annualSavings)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Idade de Aposentadoria:</span>
                  <span>{results.notRetired.currentScenario.retirementAge} anos</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Capital Projetado:</span>
                  <span>{formatCurrency(results.notRetired.currentScenario.projectedCapital)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Capital Necessário:</span>
                  <span>{formatCurrency(results.notRetired.currentScenario.requiredCapital)}</span>
                </div>
                {results.notRetired.currentScenario.requiredRate && (
                  <div className="summary-item">
                    <span className="summary-label">Rentabilidade Necessária:</span>
                    <span>{formatPercentage(results.notRetired.currentScenario.requiredRate)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="subsection">
              <div className="subsection-title">Cenário 2: Manutenção do Patrimônio</div>
              <div className="summary-box">
                <div className="summary-item">
                  <span className="summary-label">Capital Necessário:</span>
                  <span>{formatCurrency(results.notRetired.maintenanceScenario.requiredCapital)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Poupança Anual Necessária:</span>
                  <span>{formatCurrency(results.notRetired.maintenanceScenario.annualSavings)}</span>
                </div>
              </div>
            </div>
            <div className="subsection">
              <div className="subsection-title">Cenário 3: Consumo do Patrimônio</div>
              <div className="summary-box">
                <div className="summary-item">
                  <span className="summary-label">Capital Necessário:</span>
                  <span>{formatCurrency(results.notRetired.consumptionScenario.requiredCapital)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Poupança Anual Necessária:</span>
                  <span>{formatCurrency(results.notRetired.consumptionScenario.annualSavings)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proteção Familiar */}
        {results.familyProtection && (
          <div className="section page-break">
            <div className="section-title">5. Proteção Familiar</div>
            <div className="summary-box">
              <div className="summary-item">
                <span className="summary-label">Necessidade de Proteção Imediata:</span>
                <span>{formatCurrency(results.familyProtection.immediateProtection)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Liquidez para Sucessão:</span>
                <span>{formatCurrency(results.familyProtection.successionLiquidity)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Proteção Total Necessária:</span>
                <span>{formatCurrency(results.familyProtection.totalProtection)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Premissas */}
        <div className="section">
          <div className="section-title">6. Premissas Macroeconômicas</div>
          <table>
            <tbody>
              <tr>
                <th>Inflação Anual</th>
                <td>{formatPercentage(scenario.assumptions.annualInflation)}</td>
              </tr>
              <tr>
                <th>CDI Anual</th>
                <td>{formatPercentage(scenario.assumptions.annualCDI)}</td>
              </tr>
              <tr>
                <th>Rentabilidade Aposentadoria sem I.R</th>
                <td>
                  {formatPercentage(scenario.assumptions.retirementReturnNominal)}
                </td>
              </tr>
              <tr>
                <th>Juro Real na Aposentadoria</th>
                <td>{formatPercentage(scenario.assumptions.retirementRealRate)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div className="footer">
          <p>Relatório gerado em {formatDate(new Date())}</p>
          <p>LDC Capital - Planejamento Financeiro</p>
        </div>
      </body>
    </html>
  );
}

