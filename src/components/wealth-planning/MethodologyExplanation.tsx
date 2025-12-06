"use client";

import { Info, BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CollapsibleSection } from "@/components/wealth-planning/CollapsibleSection";
import type { WealthPlanningScenario } from "@/types/wealth-planning";

interface MethodologyExplanationProps {
  scenario: WealthPlanningScenario;
}

export function MethodologyExplanation({ scenario }: MethodologyExplanationProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const nominalRate = (scenario.assumptions?.retirementReturnNominal || 0) / 100;
  const inflation = (scenario.assumptions?.annualInflation || 0) / 100;
  const monthlySavings = scenario.financialData?.monthlySavings || 0;
  const initialCapital = scenario.portfolio?.total || 0;
  const yearsToRetirement = (scenario.personalData?.retirementAge || 0) - (scenario.personalData?.age || 0);

  return (
    <TooltipProvider>
      <CollapsibleSection
        title="Como Calculamos"
        description="Metodologia e fórmulas utilizadas nos cálculos"
        defaultOpen={false}
      >
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6 space-y-6">
          {/* Introdução */}
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-[#98ab44] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#262d3d] mb-2 font-sans">
                Metodologia de Cálculo
              </h3>
              <p className="text-sm text-[#577171] font-sans">
                Os cálculos utilizam fórmulas de matemática financeira com capitalização mensal e consideram aportes mensais, inflação e taxas de retorno nominais e reais.
              </p>
            </div>
          </div>

          {/* Fórmulas */}
          <div className="space-y-4">
            <div className="border-l-4 border-[#98ab44] pl-4">
              <h4 className="font-semibold text-[#262d3d] mb-2 font-sans">
                1. Valor Futuro com Capitalização Mensal
              </h4>
              <p className="text-sm text-[#577171] mb-2 font-sans">
                Para calcular o patrimônio futuro, usamos:
              </p>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs text-[#262d3d] mb-2">
                FV = PV × (1 + r/m)^(m×t) + PMT × [((1 + r/m)^(m×t) - 1) / (r/m)]
              </div>
              <div className="text-xs text-[#577171] space-y-1 font-sans">
                <p><strong>Onde:</strong></p>
                <p>• FV = Valor Futuro (patrimônio projetado)</p>
                <p>• PV = Valor Presente (capital inicial: {formatCurrency(initialCapital)})</p>
                <p>• r = Taxa anual nominal ({formatPercentage(nominalRate * 100)})</p>
                <p>• m = 12 (capitalização mensal)</p>
                <p>• t = Anos até aposentadoria ({yearsToRetirement} anos)</p>
                <p>• PMT = Aporte mensal ({formatCurrency(monthlySavings)})</p>
              </div>
            </div>

            <div className="border-l-4 border-[#98ab44] pl-4">
              <h4 className="font-semibold text-[#262d3d] mb-2 font-sans">
                2. Conversão de Taxa Anual para Mensal
              </h4>
              <p className="text-sm text-[#577171] mb-2 font-sans">
                A taxa mensal é calculada como:
              </p>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs text-[#262d3d] mb-2">
                taxa_mensal = (1 + taxa_anual)^(1/12) - 1
              </div>
              <div className="text-xs text-[#577171] font-sans">
                <p>Taxa mensal equivalente: {formatPercentage((Math.pow(1 + nominalRate, 1/12) - 1) * 100)}</p>
              </div>
            </div>

            <div className="border-l-4 border-[#98ab44] pl-4">
              <h4 className="font-semibold text-[#262d3d] mb-2 font-sans">
                3. Ajuste pela Inflação
              </h4>
              <p className="text-sm text-[#577171] mb-2 font-sans">
                Os valores de renda desejada e receitas são ajustados pela inflação até a aposentadoria:
              </p>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs text-[#262d3d] mb-2">
                Valor_Futuro = Valor_Atual × (1 + inflação)^anos
              </div>
              <div className="text-xs text-[#577171] font-sans">
                <p>Inflação anual: {formatPercentage(inflation * 100)}</p>
                <p>Fator de correção para {yearsToRetirement} anos: {formatPercentage((Math.pow(1 + inflation, yearsToRetirement) - 1) * 100)}</p>
              </div>
            </div>

            <div className="border-l-4 border-[#98ab44] pl-4">
              <h4 className="font-semibold text-[#262d3d] mb-2 font-sans">
                4. Capital Necessário (Regra dos 4%)
              </h4>
              <p className="text-sm text-[#577171] mb-2 font-sans">
                Para calcular o capital necessário para gerar renda vitalícia:
              </p>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs text-[#262d3d] mb-2">
                Capital_Necessário = Renda_Anual_Desejada / 0.04
              </div>
              <div className="text-xs text-[#577171] font-sans">
                <p>A regra dos 4% assume que é possível retirar 4% do patrimônio anualmente sem esgotar o capital ao longo do tempo.</p>
              </div>
            </div>

            <div className="border-l-4 border-[#98ab44] pl-4">
              <h4 className="font-semibold text-[#262d3d] mb-2 font-sans">
                5. Taxa Nominal vs Taxa Real
              </h4>
              <div className="text-xs text-[#577171] space-y-2 font-sans">
                <p>
                  <strong>Taxa Nominal ({formatPercentage(nominalRate * 100)}):</strong> Usada para calcular o crescimento do patrimônio. 
                  Representa o retorno bruto antes de descontar a inflação.
                </p>
                <p>
                  <strong>Taxa Real ({formatPercentage(((1 + nominalRate) / (1 + inflation) - 1) * 100)}):</strong> Usada para calcular o capital necessário. 
                  Representa o retorno após descontar a inflação, refletindo o poder de compra real.
                </p>
                <p className="text-xs italic">
                  Fórmula: Taxa Real = (1 + Taxa Nominal) / (1 + Inflação) - 1
                </p>
              </div>
            </div>
          </div>

          {/* Parâmetros Utilizados */}
          <div className="border-t border-[#e3e3e3] pt-4">
            <h4 className="font-semibold text-[#262d3d] mb-3 font-sans">
              Parâmetros Utilizados nos Cálculos
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#577171] font-sans">Capital Inicial:</span>
                <span className="font-semibold text-[#262d3d] ml-2 font-sans">{formatCurrency(initialCapital)}</span>
              </div>
              <div>
                <span className="text-[#577171] font-sans">Aporte Mensal:</span>
                <span className="font-semibold text-[#262d3d] ml-2 font-sans">{formatCurrency(monthlySavings)}</span>
              </div>
              <div>
                <span className="text-[#577171] font-sans">Taxa Nominal (a.a.):</span>
                <span className="font-semibold text-[#262d3d] ml-2 font-sans">{formatPercentage(nominalRate * 100)}</span>
              </div>
              <div>
                <span className="text-[#577171] font-sans">Inflação (a.a.):</span>
                <span className="font-semibold text-[#262d3d] ml-2 font-sans">{formatPercentage(inflation * 100)}</span>
              </div>
              <div>
                <span className="text-[#577171] font-sans">Anos até Aposentadoria:</span>
                <span className="font-semibold text-[#262d3d] ml-2 font-sans">{yearsToRetirement} anos</span>
              </div>
              <div>
                <span className="text-[#577171] font-sans">Capitalização:</span>
                <span className="font-semibold text-[#262d3d] ml-2 font-sans">Mensal</span>
              </div>
            </div>
          </div>

          {/* Nota Importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 font-sans">
                <p className="font-semibold mb-1">Importante:</p>
                <p>
                  Os cálculos são projeções baseadas em premissas e não garantem resultados futuros. 
                  Consulte um planejador financeiro para análise personalizada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </TooltipProvider>
  );
}

