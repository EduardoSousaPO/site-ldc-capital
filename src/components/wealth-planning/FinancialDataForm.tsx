"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FinancialData, InvestmentObjective } from "@/types/wealth-planning";

interface FinancialDataFormProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

export default function FinancialDataForm({
  data,
  onChange,
}: FinancialDataFormProps) {
  const updateData = (updates: Partial<FinancialData>) => {
    onChange({ ...data, ...updates });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Renda Atual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-[#262d3d] mb-4 font-sans flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Renda e Despesas Atuais
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="currentAnnualIncome" className="font-sans font-medium">
                  Renda Anual Atual (R$)
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">
                      Renda anual total incluindo salário, pró-labore, renda de aluguéis, dividendos ou pensões
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="currentAnnualIncome"
                type="number"
                min="0"
                step="0.01"
                value={(data as Partial<FinancialData>).currentAnnualIncome || ""}
                onChange={(e) =>
                  updateData({ currentAnnualIncome: parseFloat(e.target.value) || 0 } as Partial<FinancialData>)
                }
                className="font-sans"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-600 font-sans font-medium">
                Mensal: R${" "}
                {(((data as Partial<FinancialData>).currentAnnualIncome || 0) / 12).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="monthlyFamilyExpense" className="font-sans font-medium">
                  Despesa Familiar Mensal (R$)
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">
                      Total de despesas mensais da família incluindo gastos fixos (moradia, alimentação, impostos) 
                      e variáveis (viagens, lazer). Uma planilha de orçamento ajuda a identificar quanto sobra para investimentos.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="monthlyFamilyExpense"
                type="number"
                min="0"
                step="0.01"
                value={data.monthlyFamilyExpense || ""}
                onChange={(e) =>
                  updateData({ monthlyFamilyExpense: parseFloat(e.target.value) || 0 })
                }
                className="font-sans"
                placeholder="0.00"
              />
              <div className="flex items-center justify-between text-xs">
                <p className="text-gray-600 font-sans font-medium">
                  Anual: R${" "}
                  {((data.monthlyFamilyExpense || 0) * 12).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {(data as Partial<FinancialData>).currentAnnualIncome && (
                  <p className={`font-sans font-medium ${
                    ((data as Partial<FinancialData>).currentAnnualIncome - (data.monthlyFamilyExpense || 0) * 12) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    Saldo: R${" "}
                    {((data as Partial<FinancialData>).currentAnnualIncome - (data.monthlyFamilyExpense || 0) * 12).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="desiredMonthlyRetirementIncome"
                  className="font-sans font-medium"
                >
                  Renda Mensal Desejada na Aposentadoria (R$)
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">Renda mensal que o cliente deseja ter durante a aposentadoria</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="desiredMonthlyRetirementIncome"
                type="number"
                min="0"
                step="0.01"
                value={data.desiredMonthlyRetirementIncome || ""}
                onChange={(e) =>
                  updateData({
                    desiredMonthlyRetirementIncome:
                      parseFloat(e.target.value) || 0,
                  })
                }
                className="font-sans"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-600 font-sans font-medium">
                Anual: R${" "}
                {((data.desiredMonthlyRetirementIncome || 0) * 12).toLocaleString(
                  "pt-BR",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Poupança e Receitas */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-[#262d3d] mb-4 font-sans flex items-center gap-2">
            <Info className="h-5 w-5 text-green-600" />
            Poupança e Receitas Futuras
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="monthlySavings" className="font-sans font-medium">
                  Poupança Mensal (R$)
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">
                      Valor que o cliente consegue poupar mensalmente. 
                      Este é o aporte mensal que será investido para acumular patrimônio.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="monthlySavings"
                type="number"
                min="0"
                step="0.01"
                value={data.monthlySavings || ""}
                onChange={(e) =>
                  updateData({ monthlySavings: parseFloat(e.target.value) || 0 })
                }
                className="font-sans"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-600 font-sans font-medium">
                Anual: R${" "}
                {((data.monthlySavings || 0) * 12).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="emergencyReserve" className="font-sans font-medium">
                  Reserva de Emergência (R$)
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">
                      Reserva de emergência para pelo menos 6 meses de despesas. 
                      Esta reserva deve estar em investimentos de alta liquidez.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="emergencyReserve"
                type="number"
                min="0"
                step="0.01"
                value={(data as Partial<FinancialData>).emergencyReserve || ""}
                onChange={(e) =>
                  updateData({ emergencyReserve: parseFloat(e.target.value) || 0 } as Partial<FinancialData>)
                }
                className="font-sans"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 font-sans">
                Recomendado: {((data.monthlyFamilyExpense || 0) * 6).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} (6 meses de despesas)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="expectedMonthlyRetirementRevenues"
                  className="font-sans font-medium"
                >
                  Receitas Mensais Previstas na Aposentadoria (R$)
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">Receitas mensais esperadas durante a aposentadoria (ex: aposentadoria, aluguéis)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="expectedMonthlyRetirementRevenues"
                type="number"
                min="0"
                step="0.01"
                value={data.expectedMonthlyRetirementRevenues || ""}
                onChange={(e) =>
                  updateData({
                    expectedMonthlyRetirementRevenues:
                      parseFloat(e.target.value) || 0,
                  })
                }
                className="font-sans"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-600 font-sans font-medium">
                Anual: R${" "}
                {((data.expectedMonthlyRetirementRevenues || 0) * 12).toLocaleString(
                  "pt-BR",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Objetivo de Investimento e Planejamento Tributário */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-[#262d3d] mb-4 font-sans flex items-center gap-2">
            <Info className="h-5 w-5 text-purple-600" />
            Objetivo e Planejamento Tributário
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="investmentObjective"
                  className="font-sans font-medium"
                >
                  Objetivo dos Investimentos *
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">
                      Objetivo principal dos investimentos. Influencia a escolha de veículos de investimento 
                      e o planejamento de saques na aposentadoria.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={data.investmentObjective}
                onValueChange={(value) =>
                  updateData({ investmentObjective: value as InvestmentObjective })
                }
              >
                <SelectTrigger className="font-sans w-full">
                  <SelectValue placeholder="Selecione o objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preservar capital">Preservar capital</SelectItem>
                  <SelectItem value="Acumular Recursos">
                    Acumular Recursos
                  </SelectItem>
                  <SelectItem value="Especular">Especular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="taxBracket" className="font-sans font-medium">
                  Faixa de Tributação Atual
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">
                      Faixa de imposto de renda atual e previsão de alíquotas futuras. 
                      Influencia a escolha de veículos de investimento e o planejamento de saques.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={(data as Partial<FinancialData>).taxBracket || ""}
                onValueChange={(value) =>
                  updateData({ taxBracket: value } as Partial<FinancialData>)
                }
              >
                <SelectTrigger className="font-sans w-full">
                  <SelectValue placeholder="Selecione a faixa (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Isento">Isento</SelectItem>
                  <SelectItem value="7.5%">Até 7,5%</SelectItem>
                  <SelectItem value="15%">15%</SelectItem>
                  <SelectItem value="22.5%">22,5%</SelectItem>
                  <SelectItem value="27.5%">27,5%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

