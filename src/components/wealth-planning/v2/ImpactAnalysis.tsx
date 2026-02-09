"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Lightbulb, TrendingUp, Calendar, Wallet } from "lucide-react";
import { calculateImpact, formatCurrency } from "@/lib/wealth-planning/calculations";
import type { QuickInputs, AutoScenario, ImpactAnalysisResult } from "@/types/wealth-planning-v2";

interface ImpactAnalysisProps {
  inputs: QuickInputs;
  baseScenario: AutoScenario;
  className?: string;
}

export function ImpactAnalysis({ inputs, baseScenario, className }: ImpactAnalysisProps) {
  const [extraContribution, setExtraContribution] = useState(2000);
  const [delayYears, setDelayYears] = useState(3);
  const [incomeReduction, setIncomeReduction] = useState(3000);

  const results = useMemo<ImpactAnalysisResult[]>(() => {
    return [
      calculateImpact(inputs, baseScenario, { type: 'increase_contribution', value: extraContribution }),
      calculateImpact(inputs, baseScenario, { type: 'delay_retirement', value: delayYears }),
      calculateImpact(inputs, baseScenario, { type: 'reduce_income', value: incomeReduction }),
    ];
  }, [inputs, baseScenario, extraContribution, delayYears, incomeReduction]);

  const iconMap = {
    increase_contribution: <TrendingUp className="h-5 w-5 text-[#98ab44]" />,
    delay_retirement: <Calendar className="h-5 w-5 text-blue-500" />,
    reduce_income: <Wallet className="h-5 w-5 text-orange-500" />,
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-5 w-5 text-[#262d3d]" />
        <h3 className="text-lg font-bold text-[#262d3d] font-sans">
          Impacto de Decisões
        </h3>
        <span className="text-xs text-[#577171] font-sans">
          Ajuste os sliders para ver como decisões impactam seu plano
        </span>
      </div>

      <div className="space-y-5">
        {/* Slider 1: Aumentar aporte */}
        <div className="bg-white rounded-xl border-2 border-[#e3e3e3] p-5 hover:border-[#98ab44]/30 transition-colors">
          <div className="flex items-start gap-3 mb-3">
            {iconMap.increase_contribution}
            <div className="flex-1">
              <h4 className="font-semibold text-[#262d3d] font-sans text-sm">
                Se aumentar o aporte mensal...
              </h4>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-[#577171] font-sans whitespace-nowrap">R$ 500</span>
                <input
                  type="range"
                  min={500}
                  max={20000}
                  step={500}
                  value={extraContribution}
                  onChange={(e) => setExtraContribution(Number(e.target.value))}
                  className="flex-1 h-2 bg-[#e3e3e3] rounded-lg appearance-none cursor-pointer accent-[#98ab44]"
                />
                <span className="text-sm font-bold text-[#262d3d] font-sans whitespace-nowrap min-w-[90px] text-right">
                  +{formatCurrency(extraContribution)}
                </span>
              </div>
              <p className="text-sm text-[#98ab44] font-sans font-medium mt-2">
                {results[0].impact}
              </p>
            </div>
          </div>
        </div>

        {/* Slider 2: Adiar IF */}
        <div className="bg-white rounded-xl border-2 border-[#e3e3e3] p-5 hover:border-blue-300/50 transition-colors">
          <div className="flex items-start gap-3 mb-3">
            {iconMap.delay_retirement}
            <div className="flex-1">
              <h4 className="font-semibold text-[#262d3d] font-sans text-sm">
                Se adiar a Independência Financeira...
              </h4>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-[#577171] font-sans whitespace-nowrap">1 ano</span>
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={delayYears}
                  onChange={(e) => setDelayYears(Number(e.target.value))}
                  className="flex-1 h-2 bg-[#e3e3e3] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-sm font-bold text-[#262d3d] font-sans whitespace-nowrap min-w-[90px] text-right">
                  +{delayYears} ano{delayYears > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm text-blue-600 font-sans font-medium mt-2">
                {results[1].impact}
              </p>
            </div>
          </div>
        </div>

        {/* Slider 3: Reduzir renda */}
        <div className="bg-white rounded-xl border-2 border-[#e3e3e3] p-5 hover:border-orange-300/50 transition-colors">
          <div className="flex items-start gap-3 mb-3">
            {iconMap.reduce_income}
            <div className="flex-1">
              <h4 className="font-semibold text-[#262d3d] font-sans text-sm">
                Se ajustar a renda desejada na IF...
              </h4>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-[#577171] font-sans whitespace-nowrap">R$ 1k</span>
                <input
                  type="range"
                  min={1000}
                  max={15000}
                  step={1000}
                  value={incomeReduction}
                  onChange={(e) => setIncomeReduction(Number(e.target.value))}
                  className="flex-1 h-2 bg-[#e3e3e3] rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <span className="text-sm font-bold text-[#262d3d] font-sans whitespace-nowrap min-w-[90px] text-right">
                  -{formatCurrency(incomeReduction)}
                </span>
              </div>
              <p className="text-sm text-orange-600 font-sans font-medium mt-2">
                {results[2].impact}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
