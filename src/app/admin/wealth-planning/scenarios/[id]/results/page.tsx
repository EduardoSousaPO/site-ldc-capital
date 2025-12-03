"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Edit } from "lucide-react";
import AdminLayout from "../../../../components/AdminLayout";
import { formatCurrency, formatPercentage } from "@/lib/wealth-planning/calculations";
import type { CalculationResults } from "@/types/wealth-planning";
import ProjectionChartFixed from "@/components/wealth-planning/ProjectionChartFixed";
import FinancialThermometer from "@/components/wealth-planning/FinancialThermometer";
import PDFGenerator from "@/components/wealth-planning/PDFGenerator";
import { ScenarioSkeleton } from "@/components/wealth-planning/ScenarioSkeleton";
import { useToast } from "@/components/ui/toast-system";

export default function ScenarioResultsPage() {
  const params = useParams();
  const { showToast } = useToast();
  const scenarioId = params.id as string;
  const [scenario, setScenario] = useState<{ id: string; title: string; calculatedResults?: CalculationResults | null } | null>(null);
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
            {results.financialThermometer !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    Termômetro Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialThermometer value={results.financialThermometer} />
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Projeções */}
            {results.yearlyProjections && results.yearlyProjections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    Evolução do Patrimônio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectionChartFixed projections={results.yearlyProjections} />
                </CardContent>
              </Card>
            )}

            {/* Tabela Comparativa dos 3 Cenários */}
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
                        <th className="p-3 text-right font-sans font-semibold">Capital aos {scenario.personalData?.retirementAge || 50} anos</th>
                        <th className="p-3 text-right font-sans font-semibold">Capital aos {scenario.personalData?.lifeExpectancy || 80} anos</th>
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
                          {formatCurrency(results.currentScenario.annualSavings)}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {results.currentScenario.retirementAge} anos
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatCurrency(results.currentScenario.capitalAtRetirement)}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatCurrency(results.currentScenario.capitalAtLifeExpectancy)}
                        </td>
                        <td className="p-3 text-right font-sans">-</td>
                        <td className="p-3 text-right font-sans">
                          {formatPercentage(results.currentScenario.requiredRate.real)} real
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={results.currentScenario.withinRiskProfile ? "default" : "destructive"}
                          >
                            {results.currentScenario.withinRiskProfile ? "Sim" : "Não"}
                          </Badge>
                        </td>
                      </tr>

                      {/* Cenário Manutenção */}
                      <tr className="border-b hover:bg-gray-50 bg-green-50/30">
                        <td className="p-3 font-sans font-semibold text-[#98ab44]">
                          Manutenção do Patrimônio
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatCurrency(results.maintenanceScenario.annualSavings)}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {results.maintenanceScenario.retirementAge} anos
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatCurrency(results.maintenanceScenario.capitalAtRetirement)}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatCurrency(results.maintenanceScenario.capitalAtLifeExpectancy)}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {results.maintenanceScenario.requiredCapital
                            ? formatCurrency(results.maintenanceScenario.requiredCapital)
                            : "-"}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatPercentage(results.maintenanceScenario.requiredRate.real)} real
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={results.maintenanceScenario.withinRiskProfile ? "default" : "destructive"}
                          >
                            {results.maintenanceScenario.withinRiskProfile ? "Sim" : "Não"}
                          </Badge>
                        </td>
                      </tr>

                      {/* Cenário Consumo */}
                      <tr className="border-b hover:bg-gray-50 bg-red-50/30">
                        <td className="p-3 font-sans font-semibold text-red-600">
                          Consumo do Patrimônio
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatCurrency(results.consumptionScenario.annualSavings)}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {results.consumptionScenario.retirementAge} anos
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatCurrency(results.consumptionScenario.capitalAtRetirement)}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatCurrency(results.consumptionScenario.capitalAtLifeExpectancy)}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {results.consumptionScenario.requiredCapital
                            ? formatCurrency(results.consumptionScenario.requiredCapital)
                            : "-"}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {formatPercentage(results.consumptionScenario.requiredRate.real)} real
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={results.consumptionScenario.withinRiskProfile ? "default" : "destructive"}
                          >
                            {results.consumptionScenario.withinRiskProfile ? "Sim" : "Não"}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Premissas */}
            {results.assumptions && (
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
                        {formatPercentage(results.assumptions.annualInflation)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">CDI Anual</p>
                      <p className="text-xl font-bold text-[#262d3d]">
                        {formatPercentage(results.assumptions.annualCDI)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Juro Real na Aposentadoria</p>
                      <p className="text-xl font-bold text-[#262d3d]">
                        {formatPercentage(results.assumptions.realRetirementReturn)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados para Aposentado */}
            {results.retired && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    Análise para Aposentado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 font-sans">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Idade de Sobrevivência do Patrimônio</p>
                      <p className="text-2xl font-bold text-[#98ab44]">
                        {results.retired.survivalAge} anos
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Renda Média Gerada</p>
                      <p className="text-2xl font-bold text-[#262d3d]">
                        {formatCurrency(results.retired.averageIncome)}
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
