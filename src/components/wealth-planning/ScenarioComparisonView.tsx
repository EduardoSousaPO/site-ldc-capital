"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WealthPlanningScenario } from "@/types/wealth-planning";

interface ScenarioComparisonViewProps {
  scenarioIds: string[];
}

export default function ScenarioComparisonView({
  scenarioIds,
}: ScenarioComparisonViewProps) {
  const [scenarios, setScenarios] = useState<WealthPlanningScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIds]);

  const fetchScenarios = async () => {
    try {
      const promises = scenarioIds.map((id) =>
        fetch(`/api/admin/wealth-planning/scenarios/${id}`).then((res) =>
          res.ok ? res.json() : null
        )
      );
      const results = await Promise.all(promises);
      setScenarios(results.filter(Boolean));
    } catch (error) {
      console.error("Erro ao carregar cenários:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    // Validar e limitar valores absurdos antes de formatar
    if (!isFinite(value) || value < 0 || value > 1e15) {
      console.warn('ScenarioComparisonView: Valor monetário inválido ou muito alto', { value });
      return 'Valor inválido';
    }
    
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-sans">
          Nenhum cenário encontrado para comparação
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {scenarios.map((scenario) => {
        const results = scenario.calculatedResults;
        const notRetired = results?.notRetired;

        return (
          <Card key={scenario.id} className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#98ab44]/10 to-transparent border-b">
              <CardTitle className="font-serif text-xl text-[#262d3d]">
                {scenario.title}
              </CardTitle>
              <p className="text-sm text-gray-600 font-sans mt-1">
                Cliente: {scenario.clientId}
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {notRetired ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 font-sans mb-1 font-medium">
                      Capital Acumulado
                    </div>
                    <div className="font-bold text-lg font-sans text-[#262d3d]">
                      {formatCurrency(
                        notRetired.currentScenario.accumulatedCapital
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 font-sans mb-1 font-medium">
                      Capital Necessário
                    </div>
                    <div className="font-bold text-lg font-sans text-[#262d3d]">
                      {formatCurrency(
                        notRetired.currentScenario.requiredCapital
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 font-sans mb-1 font-medium">
                      Poupança Anual
                    </div>
                    <div className="font-bold text-lg font-sans text-[#262d3d]">
                      {formatCurrency(
                        notRetired.currentScenario.annualSavings
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 font-sans mb-1 font-medium">
                      Idade Aposentadoria
                    </div>
                    <div className="font-bold text-lg font-sans text-[#262d3d]">
                      {notRetired.currentScenario.retirementAge} anos
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 font-sans text-center py-8">
                  Cenário ainda não calculado
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

