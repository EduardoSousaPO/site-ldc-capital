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
  ReferenceLine,
} from "recharts";
import type { WealthPlanningScenario } from "@/types/wealth-planning";

interface ProjectionChartFixedProps {
  data: WealthPlanningScenario;
}

export default function ProjectionChartFixed({ data }: ProjectionChartFixedProps) {
  // Extrair dados
  const personalData = data.personalData || {};
  const results = data.calculatedResults?.notRetired;

  if (!results || !results.yearlyProjections || results.yearlyProjections.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 bg-[#e3e3e3]/10 rounded-lg border-2 border-dashed border-[#e3e3e3]">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="font-serif text-xl text-[#262d3d] mb-2">
            Gráfico de Projeção
          </h3>
          <p className="font-sans text-sm text-[#577171] mb-4">
            Preencha os dados do cenário e clique em &quot;Recalcular&quot; para gerar as projeções
          </p>
        </div>
      </div>
    );
  }

  // Transformar dados para o formato do gráfico
  const chartData = results.yearlyProjections.map((proj) => ({
    idade: proj.age,
    "Projeção Atual": proj.currentScenario >= 0 ? proj.currentScenario : null,
    "Manutenção Patrimônio": proj.maintenanceScenario > 0 ? proj.maintenanceScenario : null,
    "Consumo Patrimônio": proj.consumptionScenario > 0 ? proj.consumptionScenario : null,
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const formatTooltipCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full bg-white rounded-lg p-6" style={{ height: "500px" }}>
      <h3 className="font-serif text-lg text-[#262d3d] mb-6">
        Projeção de Patrimônio ao Longo do Tempo
      </h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <LineChart 
          data={chartData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e3" />
          
          <XAxis
            dataKey="idade"
            label={{ 
              value: "Idade (anos)", 
              position: "insideBottom", 
              offset: -15,
              style: { 
                fontSize: "13px", 
                fill: "#262d3d", 
                fontWeight: 600,
                fontFamily: "Public Sans, sans-serif"
              }
            }}
            stroke="#577171"
            style={{ fontSize: "11px", fontFamily: "Public Sans, sans-serif" }}
          />
          
          <YAxis
            label={{ 
              value: "Patrimônio (R$)", 
              angle: -90, 
              position: "insideLeft",
              style: { 
                fontSize: "13px", 
                fill: "#262d3d", 
                fontWeight: 600,
                fontFamily: "Public Sans, sans-serif"
              }
            }}
            stroke="#577171"
            style={{ fontSize: "11px", fontFamily: "Public Sans, sans-serif" }}
            tickFormatter={formatCurrency}
            width={90}
          />
          
          <Tooltip
            formatter={(value: unknown) => formatTooltipCurrency(typeof value === 'number' ? value : 0)}
            labelFormatter={(label) => `Idade: ${label} anos`}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e3e3e3",
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: "Public Sans, sans-serif",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          
          <Legend
            wrapperStyle={{ 
              fontSize: "12px", 
              fontFamily: "Public Sans, sans-serif",
              paddingTop: "15px"
            }}
            iconType="line"
          />
          
          {personalData.retirementAge && (
            <ReferenceLine 
              x={personalData.retirementAge} 
              stroke="#dc2626" 
              strokeDasharray="5 5"
              label={{ 
                value: "Aposentadoria", 
                position: "top", 
                fill: "#dc2626", 
                fontSize: "11px",
                fontWeight: 600,
                fontFamily: "Public Sans, sans-serif"
              }}
            />
          )}
          
          <Line
            type="monotone"
            dataKey="Projeção Atual"
            stroke="#262d3d"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          
          <Line
            type="monotone"
            dataKey="Manutenção Patrimônio"
            stroke="#98ab44"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          
          <Line
            type="monotone"
            dataKey="Consumo Patrimônio"
            stroke="#becc6a"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legenda explicativa */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs font-sans">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-[#262d3d]"></div>
          <span className="text-[#577171]">Cenário com poupança atual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-[#98ab44]"></div>
          <span className="text-[#577171]">Viver de renda (patrimônio preservado)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-[#becc6a]"></div>
          <span className="text-[#577171]">Consumir patrimônio gradualmente</span>
        </div>
      </div>
    </div>
  );
}

