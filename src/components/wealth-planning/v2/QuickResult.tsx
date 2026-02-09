"use client";

import { AnimatedNumber, formatters } from "@/components/wealth-planning/AnimatedNumber";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutoScenariosResult } from "@/types/wealth-planning-v2";

interface QuickResultProps {
  scenarios: AutoScenariosResult;
  className?: string;
}

export function QuickResult({ scenarios, className }: QuickResultProps) {
  const cards = [
    { scenario: scenarios.conservative, color: "orange" as const },
    { scenario: scenarios.base, color: "blue" as const },
    { scenario: scenarios.optimistic, color: "green" as const },
  ];

  const colorMap = {
    orange: {
      border: "border-orange-300",
      bg: "bg-orange-50",
      accent: "text-orange-600",
      icon: "🔶",
      badge: "bg-orange-100 text-orange-700 border-orange-300",
    },
    blue: {
      border: "border-blue-300",
      bg: "bg-blue-50",
      accent: "text-blue-600",
      icon: "🔷",
      badge: "bg-blue-100 text-blue-700 border-blue-300",
    },
    green: {
      border: "border-green-300",
      bg: "bg-green-50",
      accent: "text-green-600",
      icon: "🟢",
      badge: "bg-green-100 text-green-700 border-green-300",
    },
  };

  const getStatusInfo = (reachesGoal: boolean, gap: number) => {
    if (reachesGoal) return { label: "Chega!", emoji: "✅", color: "text-green-600 bg-green-100 border-green-300" };
    if (gap < 1_000_000) return { label: "Quase", emoji: "🟡", color: "text-yellow-600 bg-yellow-100 border-yellow-300" };
    return { label: "Não chega", emoji: "🔴", color: "text-red-600 bg-red-100 border-red-300" };
  };

  const formatCurrency = (v: number) => {
    if (!isFinite(v) || v < 0) return "R$ 0";
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
  };

  const formatCurrencyFull = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Título */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#262d3d] font-sans">
            Resultado em 30 Segundos
          </h2>
          <p className="text-sm text-[#577171] font-sans mt-1">
            3 cenários para sua Independência Financeira
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {cards.map(({ scenario, color }) => {
            const status = getStatusInfo(scenario.reachesGoal, scenario.gap);
            const colors = colorMap[color];

            return (
              <div
                key={scenario.type}
                className={cn(
                  "rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg",
                  colors.border,
                  colors.bg
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{colors.icon}</span>
                    <h3 className="font-bold text-[#262d3d] font-sans text-lg">
                      {scenario.label}
                    </h3>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Info do cenário">
                        <Info className="h-4 w-4 text-[#577171]" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-sans text-sm">
                        Retorno: {scenario.nominalReturn.toFixed(1)}% a.a. · Inflação: {scenario.inflation.toFixed(1)}% · Juro real: {scenario.realRate.toFixed(1)}%
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Status Badge */}
                <div className="mb-5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-sans font-semibold text-sm",
                      status.color
                    )}
                  >
                    <span>{status.emoji}</span>
                    <span>{status.label}</span>
                  </span>
                </div>

                {/* Métricas */}
                <div className="space-y-4">
                  {/* Patrimônio-alvo */}
                  <div>
                    <p className="text-xs text-[#577171] uppercase tracking-wide font-sans font-semibold mb-1">
                      Patrimônio-alvo
                    </p>
                    <p className="text-xl font-bold text-[#262d3d] font-sans">
                      <AnimatedNumber value={scenario.targetCapital} format={formatters.currency} />
                    </p>
                  </div>

                  {/* Projetado */}
                  <div>
                    <p className="text-xs text-[#577171] uppercase tracking-wide font-sans font-semibold mb-1">
                      Projetado
                    </p>
                    <p className={cn("text-xl font-bold font-sans", colors.accent)}>
                      <AnimatedNumber value={scenario.projectedCapital} format={formatters.currency} />
                    </p>
                  </div>

                  {/* Gap ou Sobra */}
                  <div className="pt-3 border-t border-gray-200">
                    {scenario.reachesGoal ? (
                      <div>
                        <p className="text-xs text-green-600 uppercase tracking-wide font-sans font-semibold mb-1">
                          Sobra
                        </p>
                        <p className="text-lg font-bold text-green-600 font-sans">
                          {formatCurrencyFull(scenario.projectedCapital - scenario.targetCapital)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-red-500 uppercase tracking-wide font-sans font-semibold mb-1">
                          Gap
                        </p>
                        <p className="text-lg font-bold text-red-600 font-sans">
                          {formatCurrencyFull(scenario.gap)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Aporte necessário */}
                  <div>
                    <p className="text-xs text-[#577171] uppercase tracking-wide font-sans font-semibold mb-1">
                      Aporte necessário
                    </p>
                    <p className="text-lg font-bold text-[#262d3d] font-sans">
                      {scenario.requiredMonthlyContribution > 0
                        ? `${formatCurrencyFull(scenario.requiredMonthlyContribution)}/mês`
                        : "Já basta ✓"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
