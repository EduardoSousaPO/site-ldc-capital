"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/wealth-planning/calculations";
import Link from "next/link";

interface ScenarioPreviewProps {
  scenario: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    personalData?: {
      age?: number;
      retirement_age?: number;
    };
    portfolio?: {
      total?: number;
    };
    financialData?: {
      monthly_savings?: number;
      desired_monthly_retirement_income?: number;
    };
    calculatedResults?: {
      notRetired?: {
        currentScenario?: {
          projectedCapital?: number;
          requiredCapital?: number;
        };
        financialThermometer?: number;
      };
    };
  };
  onDelete?: () => void;
}

export function ScenarioPreview({ scenario, onDelete }: ScenarioPreviewProps) {
  const personalData = scenario.personalData || {};
  const portfolio = scenario.portfolio || {};
  const financialData = scenario.financialData || {};
  const results = scenario.calculatedResults?.notRetired;

  const thermometer = results?.financialThermometer || 0;
  const hasResults = results !== undefined;

  const getThermometerColor = (value: number) => {
    if (value >= 100) return "bg-green-500";
    if (value >= 80) return "bg-yellow-500";
    if (value >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusBadge = () => {
    if (!hasResults) {
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-600">
          Aguardando cálculo
        </Badge>
      );
    }

    if (thermometer >= 100) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          Meta atingida
        </Badge>
      );
    }

    if (thermometer >= 80) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
          Próximo da meta
        </Badge>
      );
    }

    return (
      <Badge className="bg-red-500 hover:bg-red-600 text-white">
        Requer ajustes
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-[#e3e3e3] animate-fade-in">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-serif text-xl text-[#262d3d] mb-2">
              {scenario.title}
            </CardTitle>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            {hasResults && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#98ab44]/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-[#98ab44]" />
                <span className="text-sm font-bold font-sans text-[#262d3d]">
                  {thermometer.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações Básicas */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#e3e3e3]">
          <div>
            <p className="text-xs text-[#577171] font-sans uppercase tracking-wide mb-1">
              Idade Atual
            </p>
            <p className="text-base font-semibold font-sans text-[#262d3d]">
              {personalData.age || "N/A"} anos
            </p>
          </div>
          <div>
            <p className="text-xs text-[#577171] font-sans uppercase tracking-wide mb-1">
              Aposentadoria
            </p>
            <p className="text-base font-semibold font-sans text-[#262d3d]">
              {personalData.retirement_age || "N/A"} anos
            </p>
          </div>
        </div>

        {/* Dados Financeiros */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#577171] font-sans">Capital Atual</span>
            <span className="text-sm font-semibold font-sans text-[#262d3d]">
              {formatCurrency(portfolio.total || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#577171] font-sans">Poupança Mensal</span>
            <span className="text-sm font-semibold font-sans text-[#262d3d]">
              {formatCurrency(financialData.monthly_savings || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#577171] font-sans">Renda Desejada</span>
            <span className="text-sm font-semibold font-sans text-[#262d3d]">
              {formatCurrency(financialData.desired_monthly_retirement_income || 0)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso do Termômetro */}
        {hasResults && (
          <div className="pt-4 border-t border-[#e3e3e3]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-sans text-[#577171] uppercase tracking-wide">
                Viabilidade
              </span>
              <span className="text-xs font-sans font-bold text-[#262d3d]">
                {thermometer.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-[#e3e3e3] rounded-full overflow-hidden">
              <div
                className={`h-full ${getThermometerColor(thermometer)} transition-all duration-500`}
                style={{ width: `${Math.min(thermometer, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Data de Criação */}
        <div className="flex items-center gap-2 text-xs text-[#577171] font-sans pt-2">
          <Calendar className="h-3 w-3" />
          <span>
            Criado em {new Date(scenario.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 border-t border-[#e3e3e3]">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 font-sans"
            asChild
          >
            <Link href={`/wealth-planning/scenarios/${scenario.id}/results`}>
              <Eye className="mr-1 h-3 w-3" />
              Ver Detalhes
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="font-sans"
            asChild
          >
            <Link href={`/wealth-planning/scenarios/${scenario.id}/edit`}>
              <Edit className="h-3 w-3" />
            </Link>
          </Button>

          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:border-red-600 font-sans"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

