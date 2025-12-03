"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { NotRetiredResults, RetiredResults } from "@/types/wealth-planning";

interface EnhancedProjectionChartProps {
  notRetiredResults?: NotRetiredResults;
  retiredResults?: RetiredResults;
  personalData?: {
    age: number;
    retirementAge: number;
    lifeExpectancy: number;
  };
}

export default function EnhancedProjectionChart({
  notRetiredResults,
  retiredResults,
  personalData,
}: EnhancedProjectionChartProps) {
  const chartData = useMemo(() => {
    const data: Array<{
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
      const projections = notRetiredResults.yearlyProjections || [];
      
      if (projections.length > 0) {
        projections.forEach((proj) => {
          // Aceitar valores numéricos válidos (incluindo zero)
          const isValidNumber = (val: any) => 
            typeof val === 'number' && !isNaN(val) && isFinite(val);
          
          const currentVal = isValidNumber(proj.currentScenario) 
            ? Math.max(0, proj.currentScenario) 
            : undefined;
          
          const maintenanceVal = isValidNumber(proj.maintenanceScenario) 
            ? Math.max(0, proj.maintenanceScenario) 
            : undefined;
          
          const consumptionVal = isValidNumber(proj.consumptionScenario) 
            ? Math.max(0, proj.consumptionScenario) 
            : undefined;
          
          // Sempre adicionar ponto de dados
          data.push({
            age: proj.age,
            projecaoAtual: currentVal,
            manutencao: maintenanceVal,
            consumo: consumptionVal,
          });
        });
      }
    } else if (retiredResults && personalData) {
      const currentProj = retiredResults.currentPortfolio?.yearlyProjections || [];
      const lifetimeProj = retiredResults.lifetimeIncomePortfolio?.yearlyProjections || [];
      const financialProj = retiredResults.financialConsumptionPortfolio?.yearlyProjections || [];
      const totalProj = retiredResults.totalConsumptionPortfolio?.yearlyProjections || [];
      
      const maxAge = Math.max(
        currentProj.length > 0 ? currentProj[currentProj.length - 1]?.age || 0 : 0,
        lifetimeProj.length > 0 ? lifetimeProj[lifetimeProj.length - 1]?.age || 0 : 0,
        financialProj.length > 0 ? financialProj[financialProj.length - 1]?.age || 0 : 0,
        totalProj.length > 0 ? totalProj[totalProj.length - 1]?.age || 0 : 0,
        personalData.lifeExpectancy || 80
      );
      
      for (let age = personalData.age; age <= maxAge; age++) {
        const current = currentProj.find(p => p.age === age);
        const lifetime = lifetimeProj.find(p => p.age === age);
        const financial = financialProj.find(p => p.age === age);
        const total = totalProj.find(p => p.age === age);
        
        data.push({
          age,
          carteira1: current?.balance && current.balance > 0 ? current.balance : undefined,
          carteira2: lifetime?.balance && lifetime.balance > 0 ? lifetime.balance : undefined,
          carteira3: financial?.balance && financial.balance > 0 ? financial.balance : undefined,
          carteira4: total?.balance && total.balance > 0 ? total.balance : undefined,
        });
      }
    }

    return data;
  }, [notRetiredResults, retiredResults, personalData]);

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return "R$ 0";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!personalData) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Dados pessoais não disponíveis
      </div>
    );
  }

  // Verificar se há dados válidos para exibir
  const hasValidData = chartData.length > 0;

  if (!hasValidData) {
    return (
      <div className="p-8 text-center text-[#577171] text-sm font-sans">
        <p className="mb-2">Nenhum dado de projeção disponível</p>
        <p className="text-xs text-[#577171]/70">
          Preencha os dados do cenário para gerar as projeções
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: "500px" }}>
      <ResponsiveContainer width="100%" height="100%">
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
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ 
              value: "Patrimônio (R$)", 
              angle: -90, 
              position: "insideLeft",
              style: { textAnchor: "middle", fontSize: "14px", fill: "#374151", fontWeight: 500 }
            }}
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
            formatter={(value: any) => {
              if (!value || isNaN(value)) return "N/A";
              return formatCurrency(value);
            }}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "13px",
              padding: "10px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: "5px" }}
            labelFormatter={(label) => `Idade: ${label} anos`}
          />
          <Legend
            wrapperStyle={{ fontSize: "13px", paddingTop: "20px" }}
            iconType="line"
            iconSize={16}
            verticalAlign="top"
            align="center"
          />
          {personalData.retirementAge && (
            <ReferenceLine 
              x={personalData.retirementAge} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ value: "Aposentadoria", position: "top", fill: "#ef4444", fontSize: "12px" }}
            />
          )}
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
                connectNulls={false}
                isAnimationActive={false}
                animationDuration={0}
              />
              <Line
                type="monotone"
                dataKey="manutencao"
                stroke="#98ab44"
                strokeWidth={3}
                name="Manutenção do Patrimônio"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
                animationDuration={0}
              />
              <Line
                type="monotone"
                dataKey="consumo"
                stroke="#becc6a"
                strokeWidth={3}
                name="Consumo do Patrimônio"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
                animationDuration={0}
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
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="carteira2"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Renda Vitalícia"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="carteira3"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Consumo Financeiro"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="carteira4"
                stroke="#ec4899"
                strokeWidth={3}
                name="Consumo Total"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
