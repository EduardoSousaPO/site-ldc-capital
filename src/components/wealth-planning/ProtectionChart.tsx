"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { FamilyProtection } from "@/types/wealth-planning";

interface ProtectionChartProps {
  protection: FamilyProtection;
}

export default function ProtectionChart({ protection }: ProtectionChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const data = [
    {
      name: "Proteção Imediata",
      valor: protection.immediateProtection,
    },
    {
      name: "Liquidez Sucessão",
      valor: protection.successionLiquidity,
    },
    {
      name: "Proteção Total",
      valor: protection.totalProtection,
    },
  ];

  return (
    <div className="w-full" style={{ height: "300px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `R$ ${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `R$ ${(value / 1000).toFixed(0)}k`;
              }
              return `R$ ${value}`;
            }}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "13px",
              padding: "10px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "13px" }} />
          <Bar dataKey="valor" fill="#98ab44" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

