"use client";

import { Info } from "lucide-react";
import { AnimatedNumber, formatters } from "@/components/wealth-planning/AnimatedNumber";
import FinancialThermometer from "@/components/wealth-planning/FinancialThermometer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CalculationResults } from "@/types/wealth-planning";

interface DashboardSummaryProps {
  results: CalculationResults["notRetired"];
  requiredMonthlyContribution: number;
  gap: number;
}

export function DashboardSummary({
  results,
  requiredMonthlyContribution,
  gap,
}: DashboardSummaryProps) {
  if (!results) {
    return null;
  }

  const formatCurrency = (value: number) => {
    if (!isFinite(value) || value < 0 || value > 1e15) {
      return "Valor inválido";
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const projectedCapital = results.currentScenario.projectedCapital;
  const requiredCapital = results.currentScenario.requiredCapital;
  const capitalGap = requiredCapital - projectedCapital;
  const isOnTrack = capitalGap <= 0;

  return (
    <TooltipProvider>
      <div className="bg-gradient-to-br from-[#98ab44]/5 to-transparent border-2 border-[#98ab44]/20 rounded-xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#262d3d] font-sans">
            Resumo Executivo
          </h2>
          {results.financialThermometer !== undefined && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#577171] font-sans font-medium">
                Indicador Financeiro
              </span>
              <FinancialThermometer value={results.financialThermometer} />
            </div>
          )}
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Capital Projetado */}
          <div className="bg-white border-2 border-[#e3e3e3] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#577171] uppercase tracking-wide font-sans font-semibold">
                Capital Projetado
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center"
                    aria-label="Mais informações sobre Capital Projetado"
                  >
                    <Info className="h-4 w-4 text-[#577171] hover:text-[#262d3d] transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-sans text-sm">
                    Valor total do patrimônio projetado na idade de aposentadoria, considerando aportes mensais e rentabilidade esperada.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-3xl font-bold text-[#262d3d] font-sans">
              <AnimatedNumber
                value={projectedCapital}
                format={formatters.currency}
              />
            </div>
          </div>

          {/* Capital Necessário */}
          <div className="bg-white border-2 border-[#e3e3e3] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#577171] uppercase tracking-wide font-sans font-semibold">
                Capital Necessário
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center"
                    aria-label="Mais informações sobre Capital Necessário"
                  >
                    <Info className="h-4 w-4 text-[#577171] hover:text-[#262d3d] transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-sans text-sm">
                    Valor mínimo de patrimônio necessário para sustentar a renda desejada na aposentadoria, calculado pela regra dos 4%.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-3xl font-bold text-[#262d3d] font-sans">
              <AnimatedNumber
                value={requiredCapital}
                format={formatters.currency}
              />
            </div>
            {capitalGap > 0 && (
              <div className="text-sm text-red-600 font-medium font-sans mt-2">
                Faltam {formatCurrency(capitalGap)}
              </div>
            )}
            {isOnTrack && (
              <div className="text-sm text-green-600 font-medium font-sans mt-2">
                Meta alcançada ✓
              </div>
            )}
          </div>

          {/* Rentabilidade Necessária */}
          <div className="bg-white border-2 border-[#e3e3e3] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#577171] uppercase tracking-wide font-sans font-semibold">
                Rentabilidade Necessária
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center"
                    aria-label="Mais informações sobre Rentabilidade Necessária"
                  >
                    <Info className="h-4 w-4 text-[#577171] hover:text-[#262d3d] transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-sans text-sm">
                    Taxa de retorno anual necessária para alcançar o capital desejado, considerando aportes e tempo até aposentadoria.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-3xl font-bold text-[#262d3d] font-sans">
              {formatPercentage(results.currentScenario.requiredRate || 0)}
            </div>
            {results.currentScenario.requiredRealRate !== undefined && (
              <div className="text-xs text-[#577171] mt-2 font-sans">
                Real: {formatPercentage(results.currentScenario.requiredRealRate)}
              </div>
            )}
          </div>

          {/* Aporte Mensal Necessário */}
          <div className="bg-white border-2 border-[#e3e3e3] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#577171] uppercase tracking-wide font-sans font-semibold">
                Aporte Mensal Necessário
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center"
                    aria-label="Mais informações sobre Aporte Mensal Necessário"
                  >
                    <Info className="h-4 w-4 text-[#577171] hover:text-[#262d3d] transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-sans text-sm">
                    Valor mensal que precisa ser investido para alcançar o capital necessário na idade de aposentadoria.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-3xl font-bold text-[#262d3d] font-sans">
              {formatCurrency(requiredMonthlyContribution)}
            </div>
            {gap > 0 && (
              <div className="text-sm text-orange-600 font-medium font-sans mt-2">
                +{formatCurrency(gap)} necessário
              </div>
            )}
            {gap <= 0 && (
              <div className="text-sm text-green-600 font-medium font-sans mt-2">
                Aporte suficiente ✓
              </div>
            )}
          </div>
        </div>

        {/* Status Geral */}
        <div className="mt-6 pt-6 border-t border-[#e3e3e3]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#262d3d] font-sans mb-1">
                Status do Planejamento
              </div>
              <div className="text-xs text-[#577171] font-sans">
                {isOnTrack
                  ? "Seu planejamento está no caminho certo para alcançar seus objetivos."
                  : "Ajustes são necessários para alcançar seus objetivos de aposentadoria."}
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-lg font-sans font-semibold text-sm ${
                isOnTrack
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-orange-100 text-orange-700 border border-orange-300"
              }`}
            >
              {isOnTrack ? "No Caminho Certo" : "Ajustes Necessários"}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

