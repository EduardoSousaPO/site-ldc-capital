"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import type { CalculationResults } from "@/types/wealth-planning";

interface ResultsSummaryProps {
  results: CalculationResults;
}

export default function ResultsSummary({ results }: ResultsSummaryProps) {
  const formatCurrency = (value: number) => {
    // Validar e limitar valores absurdos antes de formatar
    if (!isFinite(value) || value < 0 || value > 1e15) {
      console.warn('ResultsSummary: Valor monetário inválido ou muito alto', { value });
      return 'Valor inválido';
    }
    
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

  const getStatusIcon = (withinProfile: boolean, gap: number) => {
    if (withinProfile) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (gap > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusMessage = (withinProfile: boolean, gap: number) => {
    if (withinProfile) {
      return "Meta alcançável dentro do perfil de risco";
    } else if (gap > 0) {
      return "Necessário ajustar estratégia para atingir meta";
    } else {
      return "Meta difícil de alcançar com perfil atual";
    }
  };

  // Determinar qual cenário usar para o resumo
  const mainScenario = results.notRetired
    ? results.notRetired.currentScenario
    : null;

  if (!mainScenario) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl text-[#262d3d]">
            Resumo dos Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 font-sans">
            Nenhum resultado disponível para exibição
          </p>
        </CardContent>
      </Card>
    );
  }

  const gap = mainScenario.requiredCapital - mainScenario.projectedCapital;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-sm text-gray-600">
            Capital Projetado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#262d3d] font-sans">
            {formatCurrency(mainScenario.projectedCapital)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-sm text-gray-600">
            Capital Necessário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#262d3d] font-sans">
            {formatCurrency(mainScenario.requiredCapital)}
          </div>
          {gap !== 0 && (
            <div
              className={`text-sm mt-1 font-sans ${
                gap > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {gap > 0 ? "Faltam" : "Excedem"} {formatCurrency(Math.abs(gap))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-sm text-gray-600">
            Rentabilidade Necessária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#262d3d] font-sans">
            {formatPercentage(mainScenario.requiredRate || 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-sans">
            {mainScenario.requiredRealRate !== undefined &&
              `Real: ${formatPercentage(mainScenario.requiredRealRate)}`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-sm text-gray-600">
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {getStatusIcon(results.notRetired?.withinRiskProfile || false, gap)}
            <div className="text-sm font-sans">
              {getStatusMessage(results.notRetired?.withinRiskProfile || false, gap)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

