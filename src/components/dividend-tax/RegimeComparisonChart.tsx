"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RegimeSimulationResult } from "@/lib/dividend-tax/types";

interface RegimeComparisonChartProps {
  regimes: RegimeSimulationResult[];
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function RegimeComparisonChart({ regimes }: RegimeComparisonChartProps) {
  const data = regimes.map((item) => ({
    name: item.regime.replace("_", " "),
    totalTax: Number(item.totalTax.toFixed(2)),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
          <XAxis dataKey="name" stroke="#577171" fontSize={12} />
          <YAxis
            stroke="#577171"
            fontSize={12}
            tickFormatter={(value) => currency.format(Number(value))}
          />
          <Tooltip
            formatter={(value) => currency.format(Number(value))}
            labelFormatter={(label) => `Regime: ${label}`}
          />
          <Bar dataKey="totalTax" fill="#98ab44" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
