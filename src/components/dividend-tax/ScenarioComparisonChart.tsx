"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ScenarioComparisonResult } from "@/lib/dividend-tax/types";

interface ScenarioComparisonChartProps {
  scenarios: ScenarioComparisonResult[];
}

const COLORS: Record<string, string> = {
  A_STATUS_QUO: "#577171",
  B_MIX_OTIMIZADO: "#98ab44",
  C_HOLDING: "#262d3d",
  D_CLUBE: "#2b3550",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ScenarioComparisonChart({
  scenarios,
}: ScenarioComparisonChartProps) {
  const chartData = scenarios.map((scenario) => ({
    code: scenario.code,
    cenario: scenario.title.replace("Cenario ", ""),
    cargaTotal: scenario.totalTax,
  }));

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 16, right: 20, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e3" />
          <XAxis dataKey="cenario" stroke="#577171" style={{ fontSize: "12px" }} />
          <YAxis stroke="#577171" tickFormatter={formatCurrency} style={{ fontSize: "12px" }} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Bar dataKey="cargaTotal" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.code} fill={COLORS[entry.code] || "#98ab44"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
