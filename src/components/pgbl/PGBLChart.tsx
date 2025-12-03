"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/pgbl/calculations";
import type { ProjecaoAnual } from "@/lib/pgbl/calculations";

interface PGBLChartProps {
  data: ProjecaoAnual[];
}

export default function PGBLChart({ data }: PGBLChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ano: item.ano,
      'Saldo Bruto': item.saldoBruto,
      'Saldo Líquido': item.saldoLiquido,
      'Economia Fiscal Acumulada': item.economiaFiscalAcumulada,
    }));
  }, [data]);

  const formatCurrencyTooltip = (value: number) => formatCurrency(value);

  return (
    <div className="w-full" style={{ height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e3" />
          <XAxis 
            dataKey="ano" 
            stroke="#577171"
            style={{ fontSize: '12px', fontFamily: 'Public Sans, Arial, sans-serif' }}
            label={{ value: 'Ano', position: 'insideBottom', offset: -5, style: { fill: '#577171', fontFamily: 'Public Sans, Arial, sans-serif' } }}
          />
          <YAxis 
            stroke="#577171"
            style={{ fontSize: '12px', fontFamily: 'Public Sans, Arial, sans-serif' }}
            tickFormatter={formatCurrencyTooltip}
            label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft', style: { fill: '#577171', fontFamily: 'Public Sans, Arial, sans-serif' } }}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e3e3e3',
              borderRadius: '6px',
              fontFamily: 'Public Sans, Arial, sans-serif',
            }}
            labelStyle={{ color: '#262d3d', fontWeight: 600 }}
          />
          <Legend 
            wrapperStyle={{ fontFamily: 'Public Sans, Arial, sans-serif', fontSize: '12px' }}
          />
          <Line 
            type="monotone" 
            dataKey="Saldo Bruto" 
            stroke="#262d3d" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="Saldo Líquido" 
            stroke="#98ab44" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="Economia Fiscal Acumulada" 
            stroke="#becc6a" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

