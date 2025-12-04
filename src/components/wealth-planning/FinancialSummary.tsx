"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { FinancialData } from "@/types/wealth-planning";

interface FinancialSummaryProps {
  financialData?: FinancialData;
  currentAnnualIncome?: number;
}

export default function FinancialSummary({
  financialData,
  currentAnnualIncome,
}: FinancialSummaryProps) {
  const summary = useMemo(() => {
    // Calcular renda mensal
    let monthlyIncome = 0;
    if (currentAnnualIncome && currentAnnualIncome > 0) {
      monthlyIncome = currentAnnualIncome / 12;
    } else if (financialData?.monthlySavings && financialData?.monthlyFamilyExpense) {
      // Estimativa: renda = despesas + poupança
      monthlyIncome = financialData.monthlyFamilyExpense + financialData.monthlySavings;
    }

    const monthlyExpenses = financialData?.monthlyFamilyExpense || 0;
    const balance = monthlyIncome - monthlyExpenses;
    const percentageSpent = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;

    return {
      monthlyIncome,
      monthlyExpenses,
      balance,
      percentageSpent: Math.min(100, Math.max(0, percentageSpent)),
    };
  }, [financialData, currentAnnualIncome]);

  const formatCurrency = (value: number) => {
    if (!isFinite(value) || value < 0 || value > 1e15) {
      return 'N/A';
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = [
    {
      name: "Renda",
      value: summary.monthlyIncome,
    },
    {
      name: "Despesas",
      value: summary.monthlyExpenses,
    },
  ];

  const getPercentageColor = () => {
    if (summary.percentageSpent >= 90) return "text-red-600";
    if (summary.percentageSpent >= 70) return "text-orange-600";
    return "text-[#98ab44]";
  };

  return (
    <div className="space-y-6">
      <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
        Resumo Financeiro
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Renda Mensal Total */}
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
          <div className="text-xs text-[#577171] uppercase tracking-wide mb-3 font-sans">
            Renda Mensal Total
          </div>
          <div className="text-3xl font-semibold text-[#262d3d] font-sans">
            {summary.monthlyIncome > 0 ? formatCurrency(summary.monthlyIncome) : "N/A"}
          </div>
        </div>

        {/* Despesas Mensais */}
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
          <div className="text-xs text-[#577171] uppercase tracking-wide mb-3 font-sans">
            Despesas Mensais
          </div>
          <div className="text-3xl font-semibold text-[#262d3d] font-sans">
            {summary.monthlyExpenses > 0 ? formatCurrency(summary.monthlyExpenses) : "N/A"}
          </div>
        </div>

        {/* Saldo Disponível */}
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
          <div className="text-xs text-[#577171] uppercase tracking-wide mb-3 font-sans">
            Saldo Disponível
          </div>
          <div
            className={`text-3xl font-semibold font-sans ${
              summary.balance >= 0 ? "text-[#98ab44]" : "text-red-600"
            }`}
          >
            {summary.monthlyIncome > 0 ? formatCurrency(summary.balance) : "N/A"}
          </div>
        </div>

        {/* % da Renda Gasta */}
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
          <div className="text-xs text-[#577171] uppercase tracking-wide mb-3 font-sans">
            % da Renda Gasta
          </div>
          <div className={`text-3xl font-semibold font-sans ${getPercentageColor()}`}>
            {summary.monthlyIncome > 0
              ? `${summary.percentageSpent.toFixed(1)}%`
              : "N/A"}
          </div>
          {summary.monthlyIncome > 0 && (
            <div className="mt-3">
              <div className="h-2 bg-[#e3e3e3] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    summary.percentageSpent >= 90
                      ? "bg-red-600"
                      : summary.percentageSpent >= 70
                      ? "bg-orange-500"
                      : "bg-[#98ab44]"
                  }`}
                  style={{ width: `${Math.min(100, summary.percentageSpent)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Barras */}
      {summary.monthlyIncome > 0 && (
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
          <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-4 font-sans">
            RENDA VS DESPESAS
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e3" />
              <XAxis
                dataKey="name"
                stroke="#577171"
                style={{ fontSize: "12px", fontFamily: "Public Sans, sans-serif" }}
              />
              <YAxis
                stroke="#577171"
                style={{ fontSize: "12px", fontFamily: "Public Sans, sans-serif" }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
                  return `R$ ${value.toFixed(0)}`;
                }}
              />
              <Tooltip
                formatter={(value: unknown) => formatCurrency(typeof value === 'number' ? value : 0)}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e3e3e3",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "Public Sans, sans-serif",
                }}
              />
              <Bar
                dataKey="value"
                fill="#262d3d"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

