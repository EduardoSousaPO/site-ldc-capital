"use client";

import { useMemo } from "react";
import { calculateFutureValue } from "@/lib/wealth-planning/calculations";

interface InvestmentProjectionTableProps {
  monthlyBalance: number; // Saldo mensal disponível para investir
  currentCapital: number; // Capital atual investido
  monthlyReturnRate: number; // Taxa de retorno mensal (decimal, ex: 0.0085 para 0.85%)
}

export default function InvestmentProjectionTable({
  monthlyBalance,
  currentCapital,
  monthlyReturnRate,
}: InvestmentProjectionTableProps) {
  const projections = useMemo(() => {
    const periods = [1, 2, 4, 6, 8, 10]; // Anos
    const results: Array<{ years: number; value: number }> = [];

    for (const years of periods) {
      const months = years * 12;
      
      // Validar valores
      if (
        !isFinite(monthlyBalance) ||
        !isFinite(currentCapital) ||
        !isFinite(monthlyReturnRate) ||
        monthlyReturnRate < 0 ||
        monthlyReturnRate > 1
      ) {
        results.push({ years, value: 0 });
        continue;
      }

      // Calcular valor futuro
      // PV negativo (capital atual investido), PMT negativo (aporte mensal)
      const futureValue = calculateFutureValue(
        monthlyReturnRate,
        months,
        -Math.abs(monthlyBalance), // PMT negativo (aporte)
        -Math.abs(currentCapital) // PV negativo (investimento inicial)
      );

      // Garantir valor positivo e finito
      const validValue = isFinite(futureValue) && futureValue > 0 ? futureValue : 0;
      results.push({ years, value: validValue });
    }

    return results;
  }, [monthlyBalance, currentCapital, monthlyReturnRate]);

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

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Validar se há dados suficientes
  if (monthlyBalance <= 0 && currentCapital <= 0) {
    return (
      <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
        <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-4 font-sans">
          Investindo o Saldo
        </div>
        <p className="text-sm text-[#577171] font-sans">
          Preencha os dados financeiros para ver a projeção de investimento.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
      <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-4 font-sans">
        Investindo o Saldo
      </div>
      
      <div className="mb-4 text-sm text-[#577171] font-sans">
        <span className="font-medium">Retorno (Mensal):</span>{" "}
        {formatPercentage(monthlyReturnRate)}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e3e3e3]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
                Período
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
                Patrimônio Investido
              </th>
            </tr>
          </thead>
          <tbody>
            {projections.map((proj) => (
              <tr
                key={proj.years}
                className="border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-[#262d3d] font-sans">
                  {proj.years} {proj.years === 1 ? "Ano" : "Anos"}
                </td>
                <td className="py-3 px-4 text-right text-sm font-semibold text-[#262d3d] font-sans">
                  {formatCurrency(proj.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

