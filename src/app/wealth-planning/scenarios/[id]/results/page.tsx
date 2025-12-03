"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calculator } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useToast } from "@/components/ui/toast";
import InteractiveDashboard from "@/components/wealth-planning/InteractiveDashboard";
import type { WealthPlanningScenario, CalculationResults } from "@/types/wealth-planning";

export default function ScenarioResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [scenario, setScenario] = useState<WealthPlanningScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const scenarioId = params.id as string;

  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const response = await fetch(
          `/api/admin/wealth-planning/scenarios/${scenarioId}`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setScenario(data);
        } else {
          if (response.status === 401) {
            router.push("/wealth-planning");
            return;
          }
          showToast("Erro ao carregar cenário", "error");
          router.push("/wealth-planning/dashboard");
        }
      } catch (error) {
        console.error("Erro ao carregar cenário:", error);
        showToast("Erro ao carregar cenário", "error");
        router.push("/wealth-planning/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (scenarioId) {
      fetchScenario();
    }
  }, [scenarioId, router, showToast]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await fetch(
        `/api/admin/wealth-planning/scenarios/${scenarioId}/calculate`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await response.json();
        showToast("Cálculos executados com sucesso", "success");
        // Recarregar cenário para ver os resultados
        const scenarioResponse = await fetch(
          `/api/admin/wealth-planning/scenarios/${scenarioId}`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (scenarioResponse.ok) {
          const updatedScenario = await scenarioResponse.json();
          setScenario(updatedScenario);
        }
      } else {
        const errorData = await response.json();
        showToast(
          errorData.error || errorData.details || "Erro ao calcular cenário",
          "error"
        );
      }
    } catch (error) {
      console.error("Erro ao calcular cenário:", error);
      showToast("Erro ao calcular cenário. Tente novamente.", "error");
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin"></div>
        </main>
        <Footer />
      </>
    );
  }

  if (!scenario) {
    return null;
  }

  const hasResults = !!scenario.calculatedResults;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-4">
            <Link href={`/wealth-planning/clients/${scenario.clientId}`}>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              {scenario.title}
            </h1>
          </div>

          {!hasResults && (
            <Card className="mb-6">
              <CardContent className="py-8 text-center">
                <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2 font-sans">
                  Cenário ainda não calculado
                </h3>
                <p className="text-gray-600 mb-6 font-sans">
                  Execute os cálculos para ver os resultados e projeções
                </p>
                <Button
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  {calculating ? "Calculando..." : "Executar Cálculos"}
                </Button>
              </CardContent>
            </Card>
          )}

          {hasResults && scenario.calculatedResults && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    onClick={handleCalculate}
                    disabled={calculating}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {calculating ? "Recalculando..." : "Salvar Alterações"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/admin/wealth-planning/scenarios/${scenarioId}/pdf`,
                          {
                            credentials: "include",
                          }
                        );
                        if (response.ok) {
                          const html = await response.text();
                          const newWindow = window.open();
                          if (newWindow) {
                            newWindow.document.write(html);
                            newWindow.document.close();
                            setTimeout(() => newWindow.print(), 500);
                          }
                        }
                      } catch (error) {
                        console.error("Erro ao gerar PDF:", error);
                      }
                    }}
                  >
                    Exportar PDF
                  </Button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <InteractiveDashboard
                  scenario={scenario}
                  onUpdate={async (updated) => {
                    // Atualizar no servidor
                    try {
                      const response = await fetch(
                        `/api/admin/wealth-planning/scenarios/${scenarioId}`,
                        {
                          method: "PATCH",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(updated),
                        }
                      );
                      if (response.ok) {
                        const updatedScenario = await response.json();
                        setScenario(updatedScenario);
                      }
                    } catch (error) {
                      console.error("Erro ao atualizar:", error);
                    }
                  }}
                  onRecalculate={handleCalculate}
                />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

