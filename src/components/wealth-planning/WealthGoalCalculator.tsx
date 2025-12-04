"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateRequiredMonthlyContribution } from "@/lib/wealth-planning/calculations";

interface WealthGoalCalculatorProps {
  currentCapital: number;
  defaultReturnRate: number; // Taxa de retorno anual (decimal, ex: 0.097 para 9.7%)
  defaultYearsToRetirement?: number; // Anos até aposentadoria (opcional)
}

export default function WealthGoalCalculator({
  currentCapital,
  defaultReturnRate,
  defaultYearsToRetirement = 10,
}: WealthGoalCalculatorProps) {
  const [desiredWealth, setDesiredWealth] = useState<number>(0);
  const [years, setYears] = useState<number>(defaultYearsToRetirement);
  const [returnRate, setReturnRate] = useState<number>(defaultReturnRate * 100); // Converter para porcentagem

  const requiredMonthlyContribution = useMemo(() => {
    // Validar inputs
    if (
      !isFinite(desiredWealth) ||
      !isFinite(years) ||
      !isFinite(returnRate) ||
      desiredWealth <= 0 ||
      years <= 0 ||
      years > 50 ||
      returnRate <= 0 ||
      returnRate > 100 ||
      desiredWealth <= currentCapital
    ) {
      return null;
    }

    // Converter taxa de porcentagem para decimal
    const annualRate = returnRate / 100;

    // Calcular aporte mensal necessário
    const contribution = calculateRequiredMonthlyContribution(
      desiredWealth,
      currentCapital,
      years,
      annualRate
    );

    return isFinite(contribution) && contribution > 0 ? contribution : null;
  }, [desiredWealth, years, returnRate, currentCapital]);

  const formatCurrency = (value: number) => {
    if (!isFinite(value) || value <= 0 || value > 1e15) {
      return "N/A";
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const hasError =
    desiredWealth > 0 &&
    (desiredWealth <= currentCapital || years <= 0 || years > 50 || returnRate <= 0 || returnRate > 100);

  return (
    <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
      <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-6 font-sans">
        Objetivo de Patrimônio
      </div>

      <div className="space-y-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="desired-wealth" className="text-sm text-[#262d3d] font-sans mb-2 block">
              Qual patrimônio você deseja atingir?
            </Label>
            <Input
              id="desired-wealth"
              type="number"
              min="0"
              step="1000"
              value={desiredWealth || ""}
              onChange={(e) => setDesiredWealth(parseFloat(e.target.value) || 0)}
              className="font-sans"
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="years" className="text-sm text-[#262d3d] font-sans mb-2 block">
              Em quantos anos?
            </Label>
            <Input
              id="years"
              type="number"
              min="1"
              max="50"
              step="1"
              value={years || ""}
              onChange={(e) => setYears(parseInt(e.target.value) || 0)}
              className="font-sans"
              placeholder="10"
            />
          </div>

          <div>
            <Label htmlFor="current-capital" className="text-sm text-[#262d3d] font-sans mb-2 block">
              Qual o seu patrimônio financeiro atual?
            </Label>
            <Input
              id="current-capital"
              type="number"
              value={currentCapital || 0}
              disabled
              className="font-sans bg-[#e3e3e3]/30"
            />
          </div>

          <div>
            <Label htmlFor="return-rate" className="text-sm text-[#262d3d] font-sans mb-2 block">
              Taxa de Retorno Aplicado (% ao ano)
            </Label>
            <Input
              id="return-rate"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              value={returnRate || ""}
              onChange={(e) => setReturnRate(parseFloat(e.target.value) || 0)}
              className="font-sans"
              placeholder="9.7"
            />
          </div>
        </div>

        {/* Output */}
        <div className="border-t border-[#e3e3e3] pt-6">
          {hasError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-sans">
              {desiredWealth <= currentCapital
                ? "O patrimônio desejado deve ser maior que o patrimônio atual."
                : "Por favor, preencha todos os campos corretamente."}
            </div>
          )}

          {!hasError && requiredMonthlyContribution !== null && (
            <div className="bg-[#98ab44]/10 border border-[#98ab44]/30 rounded-lg p-6">
              <div className="text-sm text-[#577171] mb-2 font-sans">
                Você precisa fazer aportes mensais de:
              </div>
              <div className="text-3xl font-semibold text-[#262d3d] font-sans">
                {formatCurrency(requiredMonthlyContribution)}
              </div>
            </div>
          )}

          {!hasError && requiredMonthlyContribution === null && desiredWealth > 0 && (
            <div className="text-sm text-[#577171] font-sans">
              Preencha os campos acima para calcular o aporte mensal necessário.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

