"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AutoScenariosResult, QuickInputs } from "@/types/wealth-planning-v2";

interface ProjectionChartProps {
  scenarios: AutoScenariosResult;
  inputs: QuickInputs;
  className?: string;
}

export function ProjectionChart({ scenarios, inputs, className }: ProjectionChartProps) {
  const data = useMemo(() => {
    const cons = scenarios.conservative.yearlyProjections;
    const base = scenarios.base.yearlyProjections;
    const opt = scenarios.optimistic.yearlyProjections;

    // Usar o maior array como referência
    const maxLen = Math.max(cons.length, base.length, opt.length);
    const result = [];

    for (let i = 0; i < maxLen; i++) {
      result.push({
        age: cons[i]?.age || base[i]?.age || opt[i]?.age || inputs.age + i,
        conservador: cons[i]?.capital || 0,
        base: base[i]?.capital || 0,
        otimista: opt[i]?.capital || 0,
      });
    }
    return result;
  }, [scenarios, inputs.age]);

  const formatCurrency = (v: number) => {
    if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
    return `R$${v.toFixed(0)}`;
  };

  const formatTooltipCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white border border-[#e3e3e3] rounded-lg shadow-lg p-3">
        <p className="font-semibold text-[#262d3d] font-sans text-sm mb-1">
          Idade: {label} anos
        </p>
        {payload.map((entry: { color: string; name: string; value: number }, idx: number) => (
          <p key={idx} className="text-xs font-sans" style={{ color: entry.color }}>
            {entry.name}: {formatTooltipCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-bold text-[#262d3d] font-sans">
        Trajetória do Patrimônio
      </h3>
      <div className="bg-white rounded-xl border-2 border-[#e3e3e3] p-4">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e3" />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: "#577171", fontFamily: "sans-serif" }}
              label={{ value: "Idade", position: "insideBottom", offset: -5, fontSize: 11, fill: "#577171" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#577171", fontFamily: "sans-serif" }}
              tickFormatter={formatCurrency}
              width={70}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, fontFamily: "sans-serif" }}
            />
            <ReferenceLine
              x={inputs.retirementAge}
              stroke="#262d3d"
              strokeDasharray="5 5"
              label={{
                value: `IF (${inputs.retirementAge})`,
                position: "top",
                fontSize: 10,
                fill: "#262d3d",
              }}
            />
            <Line
              type="monotone"
              dataKey="conservador"
              name="Conservador"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="base"
              name="Base"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="otimista"
              name="Otimista"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
