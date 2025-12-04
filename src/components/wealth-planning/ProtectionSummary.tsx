"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { FamilyProtection } from "@/types/wealth-planning";

interface ProtectionSummaryProps {
  protection: FamilyProtection;
}

export default function ProtectionSummary({
  protection,
}: ProtectionSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const chartData = [
    {
      name: "Proteção Imediata",
      valor: protection.immediateProtection || 0,
    },
    {
      name: "Liquidez Sucessão",
      valor: protection.successionLiquidity || 0,
    },
    {
      name: "Proteção Total",
      valor: protection.totalProtection || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl text-[#262d3d]">
            Resumo de Proteção Familiar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 font-sans mb-1">
                Necessidade de Proteção Imediata
              </div>
              <div className="text-2xl font-bold text-[#262d3d] font-sans">
                {formatCurrency(protection.immediateProtection || 0)}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 font-sans mb-1">
                Liquidez para Sucessão
              </div>
              <div className="text-2xl font-bold text-[#262d3d] font-sans">
                {formatCurrency(protection.successionLiquidity || 0)}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 font-sans mb-1">
                Proteção Total Necessária
              </div>
              <div className="text-2xl font-bold text-[#262d3d] font-sans">
                {formatCurrency(protection.totalProtection || 0)}
              </div>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `R$ ${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `R$ ${(value / 1000).toFixed(0)}k`;
                    }
                    return `R$ ${value}`;
                  }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="valor"
                  fill="#98ab44"
                  name="Valor (R$)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* observations não existe em FamilyProtection */}
        </CardContent>
      </Card>
    </div>
  );
}

