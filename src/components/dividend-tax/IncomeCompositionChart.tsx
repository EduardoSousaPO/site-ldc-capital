"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { IncomeCompositionResult } from "@/lib/dividend-tax/types";

interface IncomeCompositionChartProps {
  composition: IncomeCompositionResult;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function IncomeCompositionChart({
  composition,
}: IncomeCompositionChartProps) {
  const data = [
    {
      categoria: "Composicao da renda",
      Tributaveis: composition.rendimentosTributaveis,
      Exclusivos: composition.rendimentosExclusivos,
      Isentos: composition.rendimentosIsentos,
      Dividendos: composition.dividendosTotais,
      Exclusoes: -composition.exclusoesTotais,
    },
  ];

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 20, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e3" />
          <XAxis
            dataKey="categoria"
            stroke="#577171"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#577171"
            tickFormatter={formatCurrency}
            style={{ fontSize: "12px" }}
          />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="Tributaveis" stackId="renda" fill="#262d3d" />
          <Bar dataKey="Exclusivos" stackId="renda" fill="#577171" />
          <Bar dataKey="Isentos" stackId="renda" fill="#98ab44" />
          <Bar dataKey="Dividendos" stackId="renda" fill="#becc6a" />
          <Bar dataKey="Exclusoes" stackId="renda" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
