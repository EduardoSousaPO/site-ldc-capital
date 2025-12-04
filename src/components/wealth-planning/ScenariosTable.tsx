"use client";

import type { NotRetiredResults } from "@/types/wealth-planning";

interface ScenariosTableProps {
  results: NotRetiredResults;
}

export default function ScenariosTable({ results }: ScenariosTableProps) {
  const formatCurrency = (value: number) => {
    // Validar e limitar valores absurdos antes de formatar
    if (!isFinite(value) || value < 0 || value > 1e15) {
      console.warn('ScenariosTable: Valor monetário inválido ou muito alto', { value });
      return 'Valor inválido';
    }
    
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return "N/A";
    return `${value.toFixed(2)}%`;
  };

  const scenarios = [
    {
      name: "Projeção Atual",
      description: "Cenário baseado na poupança atual",
      annualSavings: results.currentScenario.annualSavings,
      retirementAge: results.currentScenario.retirementAge,
      accumulatedCapital: results.currentScenario.projectedCapital,
      requiredCapital: results.currentScenario.requiredCapital,
      requiredRate: results.currentScenario.requiredRate,
      requiredRealRate: results.currentScenario.requiredRealRate,
      withinProfile: results.currentScenario.withinProfile,
    },
    {
      name: "Manutenção do Patrimônio",
      description: "Viver apenas dos rendimentos",
      annualSavings: results.maintenanceScenario.annualSavings,
      retirementAge: results.maintenanceScenario.retirementAge,
      accumulatedCapital: results.maintenanceScenario.accumulatedCapital,
      requiredCapital: results.maintenanceScenario.requiredCapital,
      requiredRate: results.maintenanceScenario.requiredRate,
      requiredRealRate: results.maintenanceScenario.requiredRealRate,
      withinProfile: results.maintenanceScenario.withinProfile,
    },
    {
      name: "Consumo do Patrimônio",
      description: "Consumir parte do patrimônio",
      annualSavings: results.consumptionScenario.annualSavings,
      retirementAge: results.consumptionScenario.retirementAge,
      accumulatedCapital: results.consumptionScenario.accumulatedCapital,
      requiredCapital: results.consumptionScenario.requiredCapital,
      requiredRate: results.consumptionScenario.requiredRate,
      requiredRealRate: results.consumptionScenario.requiredRealRate,
      withinProfile: results.consumptionScenario.withinProfile,
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Cenário</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Poupança Anual</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Capital Acumulado</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Capital Necessário</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Rent. Nominal</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Rent. Real</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Status</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario, idx) => (
            <tr 
              key={idx} 
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="font-semibold text-gray-900 text-sm">{scenario.name}</div>
                <div className="text-xs text-gray-500 mt-1">{scenario.description}</div>
              </td>
              <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                {formatCurrency(scenario.annualSavings)}
              </td>
              <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                {formatCurrency(scenario.accumulatedCapital)}
              </td>
              <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                {formatCurrency(scenario.requiredCapital)}
              </td>
              <td className="py-3 px-4 text-right text-sm text-gray-700">
                {formatPercentage(scenario.requiredRate)}
              </td>
              <td className="py-3 px-4 text-right text-sm text-gray-700">
                {scenario.requiredRealRate !== undefined ? formatPercentage(scenario.requiredRealRate) : "N/A"}
              </td>
              <td className="py-3 px-4 text-center">
                {scenario.withinProfile ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Dentro do Perfil
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Fora do Perfil
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

