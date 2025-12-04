"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Edit } from "lucide-react";
import AdminLayout from "../../../../components/AdminLayout";
import { formatCurrency, formatPercentage } from "@/lib/wealth-planning/calculations";
import type { CalculationResults, WealthPlanningScenario } from "@/types/wealth-planning";
import ProjectionChartFixed from "@/components/wealth-planning/ProjectionChartFixed";
import FinancialThermometer from "@/components/wealth-planning/FinancialThermometer";
import PDFGenerator from "@/components/wealth-planning/PDFGenerator";
import { ScenarioSkeleton } from "@/components/wealth-planning/ScenarioSkeleton";
import { useToast } from "@/components/ui/toast-system";

export default function ScenarioResultsPage() {
  const params = useParams();
  const { showToast } = useToast();
  const scenarioId = params.id as string;
  const [scenario, setScenario] = useState<WealthPlanningScenario | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchScenario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  const fetchScenario = async () => {
    try {
      const response = await fetch(`/api/admin/wealth-planning/scenarios/${scenarioId}`);
      if (response.ok) {
        const data = await response.json();
        setScenario(data);
        if (data.calculatedResults) {
          setResults(data.calculatedResults);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar cenário:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    showToast("Recalculando cenário...", "info");
    
    try {
      const response = await fetch(`/api/admin/wealth-planning/scenarios/${scenarioId}/calculate`, {
        method: "POST",
      });

      if (response.ok) {
        const calculatedResults = await response.json();
        setResults(calculatedResults);
        await fetchScenario(); // Recarregar cenário com resultados salvos
        showToast("Cenário recalculado com sucesso!", "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Erro ao calcular cenário", "error");
      }
    } catch (error) {
      console.error("Erro ao calcular:", error);
      showToast("Erro ao calcular cenário", "error");
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <ScenarioSkeleton />
      </AdminLayout>
    );
  }

  if (!scenario) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 font-sans">Cenário não encontrado</p>
        </div>
      </AdminLayout>
    );
  }

  const hasResults = results !== null;
  const notRetired = results?.notRetired;
  const retired = results?.retired;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/admin/wealth-planning/clients/${scenario.clientId}`}>
              <Button variant="outline" size="sm" className="font-sans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">
                {scenario.title}
              </h1>
              <p className="text-gray-600 font-sans">
                Resultados do estudo de wealth planning
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/admin/wealth-planning/scenarios/${scenarioId}/edit`}>
              <Button variant="outline" className="font-sans">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            {!hasResults && (
              <Button
                onClick={handleCalculate}
                disabled={calculating}
                className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${calculating ? "animate-spin" : ""}`} />
                {calculating ? "Calculando..." : "Calcular Resultados"}
              </Button>
            )}
            {hasResults && <PDFGenerator scenarioId={scenarioId} />}
          </div>
        </div>

        {!hasResults ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 font-sans mb-4">
                Os resultados ainda não foram calculados. Clique em &quot;Calcular Resultados&quot; para gerar as projeções.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Termômetro Financeiro */}
            {notRetired?.financialThermometer !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    Termômetro Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialThermometer value={notRetired.financialThermometer} />
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Projeções */}
            {notRetired?.yearlyProjections && notRetired.yearlyProjections.length > 0 && scenario && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    Evolução do Patrimônio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectionChartFixed data={scenario} />
                </CardContent>
              </Card>
            )}

            {/* Tabela Comparativa dos 3 Cenários - Apenas para não aposentados */}
            {notRetired && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    Comparação de Cenários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#262d3d] text-white">
                          <th className="p-3 text-left font-sans font-semibold">Cenário</th>
                          <th className="p-3 text-right font-sans font-semibold">Poupança Anual</th>
                          <th className="p-3 text-right font-sans font-semibold">Idade Aposentadoria</th>
                          <th className="p-3 text-right font-sans font-semibold">Capital Acumulado</th>
                          <th className="p-3 text-right font-sans font-semibold">Capital Necessário</th>
                          <th className="p-3 text-right font-sans font-semibold">Rentabilidade Necessária</th>
                          <th className="p-3 text-center font-sans font-semibold">Dentro do Perfil?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Cenário Atual */}
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-3 font-sans font-semibold">Cenário Atual</td>
                          <td className="p-3 text-right font-sans">
                            {formatCurrency(notRetired.currentScenario.annualSavings)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {notRetired.currentScenario.retirementAge} anos
                          </td>
                          <td className="p-3 text-right font-sans">
                            {formatCurrency(notRetired.currentScenario.accumulatedCapital)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {formatCurrency(notRetired.currentScenario.requiredCapital)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {notRetired.currentScenario.requiredRealRate !== undefined
                              ? formatPercentage(notRetired.currentScenario.requiredRealRate) + " real"
                              : "-"}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant={notRetired.currentScenario.withinProfile ? "default" : "destructive"}
                            >
                              {notRetired.currentScenario.withinProfile ? "Sim" : "Não"}
                            </Badge>
                          </td>
                        </tr>

                        {/* Cenário Manutenção */}
                        <tr className="border-b hover:bg-gray-50 bg-green-50/30">
                          <td className="p-3 font-sans font-semibold text-[#98ab44]">
                            Manutenção do Patrimônio
                          </td>
                          <td className="p-3 text-right font-sans">
                            {formatCurrency(notRetired.maintenanceScenario.annualSavings)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {notRetired.maintenanceScenario.retirementAge} anos
                          </td>
                          <td className="p-3 text-right font-sans">
                            {formatCurrency(notRetired.maintenanceScenario.accumulatedCapital)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {formatCurrency(notRetired.maintenanceScenario.requiredCapital)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {notRetired.maintenanceScenario.requiredRealRate !== undefined
                              ? formatPercentage(notRetired.maintenanceScenario.requiredRealRate) + " real"
                              : "-"}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant={notRetired.maintenanceScenario.withinProfile ? "default" : "destructive"}
                            >
                              {notRetired.maintenanceScenario.withinProfile ? "Sim" : "Não"}
                            </Badge>
                          </td>
                        </tr>

                        {/* Cenário Consumo */}
                        <tr className="border-b hover:bg-gray-50 bg-red-50/30">
                          <td className="p-3 font-sans font-semibold text-red-600">
                            Consumo do Patrimônio
                          </td>
                          <td className="p-3 text-right font-sans">
                            {formatCurrency(notRetired.consumptionScenario.annualSavings)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {notRetired.consumptionScenario.retirementAge} anos
                          </td>
                          <td className="p-3 text-right font-sans">
                            {formatCurrency(notRetired.consumptionScenario.accumulatedCapital)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {formatCurrency(notRetired.consumptionScenario.requiredCapital)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            {notRetired.consumptionScenario.requiredRealRate !== undefined
                              ? formatPercentage(notRetired.consumptionScenario.requiredRealRate) + " real"
                              : "-"}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant={notRetired.consumptionScenario.withinProfile ? "default" : "destructive"}
                            >
                              {notRetired.consumptionScenario.withinProfile ? "Sim" : "Não"}
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Premissas - Usar do cenário */}
            {scenario.assumptions && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    Premissas Macroeconômicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 font-sans">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Inflação Anual</p>
                      <p className="text-xl font-bold text-[#262d3d]">
                        {formatPercentage(scenario.assumptions.annualInflation)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">CDI Anual</p>
                      <p className="text-xl font-bold text-[#262d3d]">
                        {formatPercentage(scenario.assumptions.annualCDI)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Juro Real na Aposentadoria</p>
                      <p className="text-xl font-bold text-[#262d3d]">
                        {formatPercentage(scenario.assumptions.retirementRealRate)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados para Aposentado */}
            {retired && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    Análise para Aposentado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 font-sans">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Carteira Atual - Idade de Sobrevivência</p>
                      <p className="text-2xl font-bold text-[#98ab44]">
                        {retired.currentPortfolio?.survivalAge || "N/A"} anos
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Renda Média Gerada</p>
                      <p className="text-2xl font-bold text-[#262d3d]">
                        {retired.currentPortfolio?.averageAnnualReturn
                          ? formatCurrency(retired.currentPortfolio.averageAnnualReturn)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
