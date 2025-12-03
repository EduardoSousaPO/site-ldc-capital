"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateRequiredMonthlyContribution, calculateCapitalUsing4PercentRule } from "@/lib/wealth-planning/calculations";
import type { WealthPlanningScenario } from "@/types/wealth-planning";

interface MonthlyContributionCalculatorProps {
  scenario: WealthPlanningScenario;
}

export default function MonthlyContributionCalculator({
  scenario,
}: MonthlyContributionCalculatorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Calcular valores necessários
  const desiredAnnualIncome = (scenario.financialData?.desiredMonthlyRetirementIncome || 0) * 12;
  const expectedAnnualRevenues = (scenario.financialData?.expectedMonthlyRetirementRevenues || 0) * 12;
  const extraIncomeNeeded = desiredAnnualIncome - expectedAnnualRevenues;
  
  // Capital necessário usando regra dos 4%
  const capitalNeeded4Percent = calculateCapitalUsing4PercentRule(extraIncomeNeeded);
  
  // Capital atual
  const currentCapital = scenario.portfolio?.total || 0;
  
  // Anos até aposentadoria
  const yearsToRetirement = (scenario.personalData?.retirementAge || 0) - (scenario.personalData?.age || 0);
  
  // Taxa de retorno esperada (usar taxa real de aposentadoria + inflação)
  const nominalRate = (scenario.assumptions?.retirementReturnNominal || 9.7) / 100;
  
  // Calcular aporte mensal necessário
  const requiredMonthlyContribution = calculateRequiredMonthlyContribution(
    capitalNeeded4Percent,
    currentCapital,
    yearsToRetirement,
    nominalRate
  );

  // Aporte atual
  const currentMonthlySavings = scenario.financialData?.monthlySavings || 0;
  const gap = requiredMonthlyContribution - currentMonthlySavings;

  if (yearsToRetirement <= 0 || extraIncomeNeeded <= 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className="border-2 border-[#98ab44]">
        <CardHeader className="bg-gradient-to-r from-[#98ab44]/10 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-xl text-[#262d3d] flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#98ab44]" />
              Calculadora de Aporte Mensal
            </CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-sans text-sm">
                  Baseado na <strong>regra dos 4%</strong>: para gerar R$ X anuais, 
                  são necessários aproximadamente R$ X / 0.04. O cálculo considera 
                  o patrimônio atual, tempo até aposentadoria e taxa de retorno esperada.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Resumo dos Objetivos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-[#262d3d] mb-3 font-sans text-sm">
                Objetivo de Aposentadoria
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-sans">Renda anual desejada:</span>
                  <span className="font-semibold font-sans">{formatCurrency(desiredAnnualIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-sans">Receitas previstas:</span>
                  <span className="font-semibold font-sans">{formatCurrency(expectedAnnualRevenues)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-700 font-semibold font-sans">Renda adicional necessária:</span>
                  <span className="font-bold text-blue-700 font-sans">{formatCurrency(extraIncomeNeeded)}</span>
                </div>
              </div>
            </div>

            {/* Capital Necessário */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-[#262d3d] mb-3 font-sans text-sm">
                Capital Necessário (Regra dos 4%)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-sans">Capital necessário:</span>
                  <span className="text-2xl font-bold text-green-700 font-sans">
                    {formatCurrency(capitalNeeded4Percent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-sans">Capital atual:</span>
                  <span className="font-semibold font-sans">{formatCurrency(currentCapital)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-700 font-semibold font-sans">Falta acumular:</span>
                  <span className={`font-bold font-sans ${
                    capitalNeeded4Percent - currentCapital > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {formatCurrency(Math.max(0, capitalNeeded4Percent - currentCapital))}
                  </span>
                </div>
              </div>
            </div>

            {/* Aporte Mensal */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-[#262d3d] mb-3 font-sans text-sm">
                Aporte Mensal Necessário
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-sans">Aporte mensal necessário:</span>
                  <span className="text-2xl font-bold text-yellow-700 font-sans">
                    {formatCurrency(requiredMonthlyContribution)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-sans">Aporte mensal atual:</span>
                  <span className="font-semibold font-sans">{formatCurrency(currentMonthlySavings)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-700 font-semibold font-sans">
                    {gap > 0 ? "Falta aportar" : "Excede em"}:
                  </span>
                  <span className={`font-bold font-sans ${
                    gap > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {formatCurrency(Math.abs(gap))}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-sans pt-2 border-t">
                  <p>
                    <strong>Parâmetros:</strong> {yearsToRetirement} anos até aposentadoria, 
                    retorno esperado de {formatPercentage(nominalRate)} ao ano
                  </p>
                </div>
              </div>
            </div>

            {/* Recomendações */}
            {gap > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2 font-sans text-sm">
                  Recomendação
                </h3>
                <p className="text-sm text-red-700 font-sans">
                  Para atingir sua meta de aposentadoria, você precisa aumentar seu aporte mensal 
                  em <strong>{formatCurrency(gap)}</strong>. Considere revisar suas despesas ou 
                  aumentar sua renda para alcançar este objetivo.
                </p>
              </div>
            )}

            {gap <= 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2 font-sans text-sm">
                  Parabéns!
                </h3>
                <p className="text-sm text-green-700 font-sans">
                  Seu aporte mensal atual é suficiente para atingir sua meta de aposentadoria. 
                  Continue mantendo esta disciplina!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

