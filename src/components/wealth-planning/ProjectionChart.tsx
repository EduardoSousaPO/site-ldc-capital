"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { NotRetiredResults, RetiredResults } from "@/types/wealth-planning";

interface ProjectionChartProps {
  notRetiredResults?: NotRetiredResults;
  retiredResults?: RetiredResults;
  personalData?: {
    age: number;
    retirementAge: number;
    lifeExpectancy: number;
  };
}

export default function ProjectionChart({
  notRetiredResults,
  retiredResults,
  personalData,
}: ProjectionChartProps) {
  if (!notRetiredResults && !retiredResults) {
    return (
      <div className="p-8 text-center text-gray-500 font-sans text-sm">
        Nenhum dado de projeção disponível
      </div>
    );
  }

  if (!personalData) {
    return (
      <div className="p-8 text-center text-gray-500 font-sans text-sm">
        Dados pessoais não disponíveis
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData: Array<{
    age: number;
    projecaoAtual?: number;
    manutencao?: number;
    consumo?: number;
    carteira1?: number;
    carteira2?: number;
    carteira3?: number;
    carteira4?: number;
  }> = [];

  if (notRetiredResults && personalData) {
    // Dados para não aposentado
    const projections = notRetiredResults.yearlyProjections || [];
    projections.forEach((proj) => {
      chartData.push({
        age: proj.age,
        projecaoAtual: proj.currentScenario,
        manutencao: proj.maintenanceScenario,
        consumo: proj.consumptionScenario,
      });
    });
  } else if (retiredResults && personalData) {
    // Dados para aposentado - usar as projeções das carteiras
    const currentProj = retiredResults.currentPortfolio.yearlyProjections || [];
    const lifetimeProj = retiredResults.lifetimeIncomePortfolio.yearlyProjections || [];
    const financialProj = retiredResults.financialConsumptionPortfolio.yearlyProjections || [];
    const totalProj = retiredResults.totalConsumptionPortfolio.yearlyProjections || [];
    
    // Criar um mapa de idade para combinar os dados
    const maxAge = Math.max(
      currentProj.length > 0 ? currentProj[currentProj.length - 1].age : 0,
      lifetimeProj.length > 0 ? lifetimeProj[lifetimeProj.length - 1].age : 0,
      financialProj.length > 0 ? financialProj[financialProj.length - 1].age : 0,
      totalProj.length > 0 ? totalProj[totalProj.length - 1].age : 0
    );
    
    for (let age = personalData.age; age <= maxAge; age++) {
      const current = currentProj.find(p => p.age === age);
      const lifetime = lifetimeProj.find(p => p.age === age);
      const financial = financialProj.find(p => p.age === age);
      const total = totalProj.find(p => p.age === age);
      
      chartData.push({
        age,
        carteira1: current?.balance,
        carteira2: lifetime?.balance,
        carteira3: financial?.balance,
        carteira4: total?.balance,
      });
    }
  }

  if (chartData.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-sans">
        Nenhum dado de projeção disponível
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full" style={{ minHeight: "500px", height: "500px" }}>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart 
          data={chartData} 
          margin={{ top: 20, right: 40, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="age"
            label={{ 
              value: "Idade (anos)", 
              position: "insideBottom", 
              offset: -10,
              style: { textAnchor: "middle", fontSize: "14px", fill: "#374151", fontWeight: 500 }
            }}
            stroke="#6b7280"
            style={{ fontSize: "13px" }}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            label={{ 
              value: "Patrimônio (R$)", 
              angle: -90, 
              position: "insideLeft",
              style: { textAnchor: "middle", fontSize: "14px", fill: "#374151", fontWeight: 500 }
            }}
            stroke="#6b7280"
            style={{ fontSize: "13px" }}
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
            labelStyle={{ fontWeight: 600, marginBottom: "5px" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "13px", paddingTop: "20px" }}
            iconType="line"
            iconSize={16}
            verticalAlign="top"
            align="center"
          />
          {notRetiredResults && (
            <>
              <Line
                type="monotone"
                dataKey="projecaoAtual"
                stroke="#262d3d"
                strokeWidth={3}
                name="Projeção Atual"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="manutencao"
                stroke="#10b981"
                strokeWidth={3}
                name="Manutenção do Patrimônio"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="consumo"
                stroke="#ef4444"
                strokeWidth={3}
                name="Consumo do Patrimônio"
                dot={false}
                activeDot={{ r: 6 }}
              />
            </>
          )}
          {retiredResults && (
            <>
              <Line
                type="monotone"
                dataKey="carteira1"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Carteira Atual"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="carteira2"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Renda Vitalícia"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="carteira3"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Consumo Financeiro"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="carteira4"
                stroke="#ec4899"
                strokeWidth={3}
                name="Consumo Total"
                dot={false}
                activeDot={{ r: 6 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

