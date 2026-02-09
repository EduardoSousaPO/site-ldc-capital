"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, TrendingDown, Clock } from "lucide-react";
import type { StressTestResult } from "@/types/wealth-planning-v2";

interface StressTestPanelProps {
  results: StressTestResult[];
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  market_crash: <TrendingDown className="h-5 w-5" />,
  high_inflation: <AlertTriangle className="h-5 w-5" />,
  longevity: <Clock className="h-5 w-5" />,
  low_returns: <TrendingDown className="h-5 w-5" />,
};

const severityColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  low: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700" },
  medium: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" },
  high: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
};

const severityLabels: Record<string, string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  critical: "Crítico",
};

export function StressTestPanel({ results, className }: StressTestPanelProps) {
  if (results.length === 0) return null;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-5 w-5 text-[#262d3d]" />
        <h3 className="text-lg font-bold text-[#262d3d] font-sans">
          Stress Tests
        </h3>
        <span className="text-xs text-[#577171] font-sans">
          Como seu plano resiste a cenários adversos?
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result) => {
          const colors = severityColors[result.severity];
          return (
            <div
              key={result.type}
              className={cn(
                "rounded-xl border-2 p-5 transition-all duration-300",
                colors.bg,
                colors.border
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={colors.text}>
                    {iconMap[result.type]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#262d3d] font-sans text-sm">
                      {result.label}
                    </h4>
                    <p className="text-xs text-[#577171] font-sans">
                      {result.description}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold font-sans",
                    colors.badge
                  )}
                >
                  {severityLabels[result.severity]}
                </span>
              </div>

              {/* Impacto */}
              <p className={cn("text-sm font-sans font-medium mb-3", colors.text)}>
                {result.impactDescription}
              </p>

              {/* Comparação visual */}
              <div className="flex items-center gap-3 text-xs font-sans">
                <div className="flex-1">
                  <p className="text-[#577171] mb-1">Original</p>
                  <p className="font-medium text-[#262d3d]">{formatCurrency(result.originalCapitalAtRetirement)}</p>
                </div>
                <div className="text-[#577171]">→</div>
                <div className="flex-1">
                  <p className="text-[#577171] mb-1">Estressado</p>
                  <p className={cn("font-medium", colors.text)}>{formatCurrency(result.stressedCapitalAtRetirement)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
