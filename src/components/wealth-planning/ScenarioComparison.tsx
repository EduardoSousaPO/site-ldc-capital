"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotRetiredResults } from "@/types/wealth-planning";

interface ScenarioComparisonProps {
  results: NotRetiredResults;
}

export default function ScenarioComparison({
  results,
}: ScenarioComparisonProps) {
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

  const scenarios = [
    {
      name: "Projeção Atual",
      description: "Cenário baseado na poupança atual e rentabilidade esperada",
      annualSavings: results.currentScenario.annualSavings,
      retirementAge: results.currentScenario.retirementAge,
      accumulatedCapital: results.currentScenario.accumulatedCapital,
      requiredCapital: results.currentScenario.requiredCapital,
      requiredReturn: results.currentScenario.requiredRate || 0,
      requiredRealReturn: results.currentScenario.requiredRealRate,
      withinProfile: results.currentScenario.withinProfile,
      color: "bg-gray-100",
      borderColor: "border-gray-300",
    },
    {
      name: "Manutenção do Patrimônio",
      description: "Viver apenas dos rendimentos, sem consumir o principal",
      annualSavings: results.maintenanceScenario.annualSavings,
      retirementAge: results.maintenanceScenario.retirementAge,
      accumulatedCapital: results.maintenanceScenario.accumulatedCapital,
      requiredCapital: results.maintenanceScenario.requiredCapital,
      requiredReturn: results.maintenanceScenario.requiredRate || 0,
      requiredRealReturn: results.maintenanceScenario.requiredRealRate,
      withinProfile: results.maintenanceScenario.withinProfile,
      color: "bg-green-50",
      borderColor: "border-green-300",
    },
    {
      name: "Consumo do Patrimônio",
      description: "Consumir parte do patrimônio durante a aposentadoria",
      annualSavings: results.consumptionScenario.annualSavings,
      retirementAge: results.consumptionScenario.retirementAge,
      accumulatedCapital: results.consumptionScenario.accumulatedCapital,
      requiredCapital: results.consumptionScenario.requiredCapital,
      requiredReturn: results.consumptionScenario.requiredRate || 0,
      requiredRealReturn: results.consumptionScenario.requiredRealRate,
      withinProfile: results.consumptionScenario.withinProfile,
      color: "bg-red-50",
      borderColor: "border-red-300",
    },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#98ab44]/10 to-transparent border-b">
        <CardTitle className="font-serif text-2xl text-[#262d3d]">
          Comparação de Cenários
        </CardTitle>
        <p className="text-sm text-gray-600 font-sans mt-1">
          Análise comparativa dos diferentes cenários de planejamento
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {scenarios.map((scenario, index) => (
            <div
              key={index}
              className={`p-6 border-2 rounded-lg shadow-sm hover:shadow-md transition-shadow ${scenario.color} ${scenario.borderColor}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg font-sans mb-1">
                    {scenario.name}
                  </h3>
                  <p className="text-sm text-gray-600 font-sans">
                    {scenario.description}
                  </p>
                </div>
                <div>
                  {scenario.withinProfile ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 font-sans">
                      ✓ Dentro do Perfil
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 font-sans">
                      ✗ Fora do Perfil
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/70 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 font-sans mb-1 font-medium">
                    Poupança Anual
                  </div>
                  <div className="font-bold text-lg font-sans text-[#262d3d]">
                    {formatCurrency(scenario.annualSavings)}
                  </div>
                </div>
                <div className="bg-white/70 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 font-sans mb-1 font-medium">
                    Idade Aposentadoria
                  </div>
                  <div className="font-bold text-lg font-sans text-[#262d3d]">
                    {scenario.retirementAge} anos
                  </div>
                </div>
                <div className="bg-white/70 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 font-sans mb-1 font-medium">
                    Capital Acumulado
                  </div>
                  <div className="font-bold text-lg font-sans text-[#262d3d]">
                    {formatCurrency(scenario.accumulatedCapital)}
                  </div>
                </div>
                <div className="bg-white/70 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 font-sans mb-1 font-medium">
                    Capital Necessário
                  </div>
                  <div className="font-bold text-lg font-sans text-[#262d3d]">
                    {formatCurrency(scenario.requiredCapital)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="text-xs text-gray-600 font-sans mb-2">
                  Rentabilidade Necessária
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-xs text-gray-600 font-sans">Nominal bruta: </span>
                    <span className="font-semibold font-sans">
                      {scenario.requiredReturn > 0
                        ? formatPercentage(scenario.requiredReturn)
                        : "N/A"}
                    </span>
                  </div>
                  {scenario.requiredRealReturn !== undefined && (
                    <div>
                      <span className="text-xs text-gray-600 font-sans">Real líquida: </span>
                      <span className="font-semibold font-sans">
                        {formatPercentage(scenario.requiredRealReturn)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

