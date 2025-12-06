"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ValidationMessage } from "@/components/wealth-planning/ValidationMessage";
import type { FinancialData, InvestmentObjective } from "@/types/wealth-planning";

interface FinancialDataFormProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

interface FieldErrors {
  currentAnnualIncome?: string;
  monthlyFamilyExpense?: string;
  desiredMonthlyRetirementIncome?: string;
  monthlySavings?: string;
  expectedMonthlyRetirementRevenues?: string;
  investmentObjective?: string;
}

export default function FinancialDataForm({
  data,
  onChange,
}: FinancialDataFormProps) {
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const updateData = (updates: Partial<FinancialData>) => {
    onChange({ ...data, ...updates });
  };

  const validateField = (fieldName: string, value: unknown): string => {
    switch (fieldName) {
      case "currentAnnualIncome":
        if (!value || (typeof value === "number" && value <= 0)) {
          return "Renda anual é obrigatória e deve ser maior que zero";
        }
        break;
      case "monthlyFamilyExpense":
        if (!value || (typeof value === "number" && value <= 0)) {
          return "Despesa familiar mensal é obrigatória e deve ser maior que zero";
        }
        break;
      case "desiredMonthlyRetirementIncome":
        if (!value || (typeof value === "number" && value <= 0)) {
          return "Renda mensal desejada é obrigatória e deve ser maior que zero";
        }
        break;
      case "monthlySavings":
        if (value === undefined || value === null || (typeof value === "number" && value < 0)) {
          return "Poupança mensal deve ser informada (pode ser zero)";
        }
        break;
      case "expectedMonthlyRetirementRevenues":
        if (value === undefined || value === null || (typeof value === "number" && value < 0)) {
          return "Receitas previstas devem ser informadas (pode ser zero)";
        }
        break;
      case "investmentObjective":
        if (!value || (typeof value === "string" && value.trim() === "")) {
          return "Objetivo de investimento é obrigatório";
        }
        break;
    }
    return "";
  };

  const handleBlur = (fieldName: string, value: unknown) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
    const error = validateField(fieldName, value);
    setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const handleChange = (fieldName: string, value: unknown) => {
    updateData({ [fieldName]: value } as Partial<FinancialData>);
    // Validar em tempo real se o campo já foi tocado
    if (touchedFields.has(fieldName)) {
      const error = validateField(fieldName, value);
      setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
    }
  };

  const getFieldStatus = (fieldName: string, value: unknown) => {
    if (!touchedFields.has(fieldName)) return null;
    const error = fieldErrors[fieldName as keyof FieldErrors];
    if (error) return "error";
    if (value !== undefined && value !== null && value !== "") return "success";
    return null;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs defaultValue="renda-despesas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="renda-despesas" className="font-sans">
              Renda e Despesas
            </TabsTrigger>
            <TabsTrigger value="poupanca-receitas" className="font-sans">
              Poupança e Receitas
            </TabsTrigger>
            <TabsTrigger value="objetivo-tributacao" className="font-sans">
              Objetivo e Tributação
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Renda e Despesas */}
          <TabsContent value="renda-despesas" className="space-y-6 mt-0">
            {/* Renda e Despesas Atuais */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-[#262d3d] mb-4 font-sans flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-blue-600" />
                Renda e Despesas Atuais
              </h3>
              <p className="text-sm text-[#577171] mb-4 font-sans">
                Informe sua renda atual e despesas mensais da família
              </p>
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
              <div className="relative">
                <Input
                  id="currentAnnualIncome"
                  type="number"
                  min="0"
                  step="0.01"
                  value={(data as Partial<FinancialData>).currentAnnualIncome || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange("currentAnnualIncome", val);
                  }}
                  onBlur={(e) => handleBlur("currentAnnualIncome", parseFloat(e.target.value) || 0)}
                  className={`font-sans ${
                    getFieldStatus("currentAnnualIncome", (data as Partial<FinancialData>).currentAnnualIncome) === "error"
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : getFieldStatus("currentAnnualIncome", (data as Partial<FinancialData>).currentAnnualIncome) === "success"
                      ? "border-green-300 focus:border-green-500"
                      : ""
                  }`}
                  placeholder="0.00"
                />
                {getFieldStatus("currentAnnualIncome", (data as Partial<FinancialData>).currentAnnualIncome) === "success" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
                {getFieldStatus("currentAnnualIncome", (data as Partial<FinancialData>).currentAnnualIncome) === "error" && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                )}
              </div>
              {touchedFields.has("currentAnnualIncome") && fieldErrors.currentAnnualIncome && (
                <ValidationMessage message={fieldErrors.currentAnnualIncome} />
              )}
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
              <div className="relative">
                <Input
                  id="monthlyFamilyExpense"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.monthlyFamilyExpense || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange("monthlyFamilyExpense", val);
                  }}
                  onBlur={(e) => handleBlur("monthlyFamilyExpense", parseFloat(e.target.value) || 0)}
                  className={`font-sans ${
                    getFieldStatus("monthlyFamilyExpense", data.monthlyFamilyExpense) === "error"
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : getFieldStatus("monthlyFamilyExpense", data.monthlyFamilyExpense) === "success"
                      ? "border-green-300 focus:border-green-500"
                      : ""
                  }`}
                  placeholder="0.00"
                />
                {getFieldStatus("monthlyFamilyExpense", data.monthlyFamilyExpense) === "success" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
                {getFieldStatus("monthlyFamilyExpense", data.monthlyFamilyExpense) === "error" && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                )}
              </div>
              {touchedFields.has("monthlyFamilyExpense") && fieldErrors.monthlyFamilyExpense && (
                <ValidationMessage message={fieldErrors.monthlyFamilyExpense} />
              )}
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
                    (((data as Partial<FinancialData>).currentAnnualIncome || 0) - (data.monthlyFamilyExpense || 0) * 12) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    Saldo: R${" "}
                    {(((data as Partial<FinancialData>).currentAnnualIncome || 0) - (data.monthlyFamilyExpense || 0) * 12).toLocaleString("pt-BR", {
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
              <div className="relative">
                <Input
                  id="desiredMonthlyRetirementIncome"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.desiredMonthlyRetirementIncome || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange("desiredMonthlyRetirementIncome", val);
                  }}
                  onBlur={(e) => handleBlur("desiredMonthlyRetirementIncome", parseFloat(e.target.value) || 0)}
                  className={`font-sans ${
                    getFieldStatus("desiredMonthlyRetirementIncome", data.desiredMonthlyRetirementIncome) === "error"
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : getFieldStatus("desiredMonthlyRetirementIncome", data.desiredMonthlyRetirementIncome) === "success"
                      ? "border-green-300 focus:border-green-500"
                      : ""
                  }`}
                  placeholder="0.00"
                />
                {getFieldStatus("desiredMonthlyRetirementIncome", data.desiredMonthlyRetirementIncome) === "success" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
                {getFieldStatus("desiredMonthlyRetirementIncome", data.desiredMonthlyRetirementIncome) === "error" && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                )}
              </div>
              {touchedFields.has("desiredMonthlyRetirementIncome") && fieldErrors.desiredMonthlyRetirementIncome && (
                <ValidationMessage message={fieldErrors.desiredMonthlyRetirementIncome} />
              )}
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
          </TabsContent>

          {/* Aba 2: Poupança e Receitas */}
          <TabsContent value="poupanca-receitas" className="space-y-6 mt-0">
            {/* Poupança e Receitas Futuras */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-[#262d3d] mb-4 font-sans flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-green-600" />
                Poupança e Receitas Futuras
              </h3>
              <p className="text-sm text-[#577171] mb-4 font-sans">
                Informe quanto você consegue poupar mensalmente e receitas previstas na aposentadoria
              </p>
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
              <div className="relative">
                <Input
                  id="monthlySavings"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.monthlySavings || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange("monthlySavings", val);
                  }}
                  onBlur={(e) => handleBlur("monthlySavings", parseFloat(e.target.value) || 0)}
                  className={`font-sans ${
                    getFieldStatus("monthlySavings", data.monthlySavings) === "error"
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : getFieldStatus("monthlySavings", data.monthlySavings) === "success"
                      ? "border-green-300 focus:border-green-500"
                      : ""
                  }`}
                  placeholder="0.00"
                />
                {getFieldStatus("monthlySavings", data.monthlySavings) === "success" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
                {getFieldStatus("monthlySavings", data.monthlySavings) === "error" && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                )}
              </div>
              {touchedFields.has("monthlySavings") && fieldErrors.monthlySavings && (
                <ValidationMessage message={fieldErrors.monthlySavings} />
              )}
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
              <div className="relative">
                <Input
                  id="expectedMonthlyRetirementRevenues"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.expectedMonthlyRetirementRevenues || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange("expectedMonthlyRetirementRevenues", val);
                  }}
                  onBlur={(e) => handleBlur("expectedMonthlyRetirementRevenues", parseFloat(e.target.value) || 0)}
                  className={`font-sans ${
                    getFieldStatus("expectedMonthlyRetirementRevenues", data.expectedMonthlyRetirementRevenues) === "error"
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : getFieldStatus("expectedMonthlyRetirementRevenues", data.expectedMonthlyRetirementRevenues) === "success"
                      ? "border-green-300 focus:border-green-500"
                      : ""
                  }`}
                  placeholder="0.00"
                />
                {getFieldStatus("expectedMonthlyRetirementRevenues", data.expectedMonthlyRetirementRevenues) === "success" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
                {getFieldStatus("expectedMonthlyRetirementRevenues", data.expectedMonthlyRetirementRevenues) === "error" && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                )}
              </div>
              {touchedFields.has("expectedMonthlyRetirementRevenues") && fieldErrors.expectedMonthlyRetirementRevenues && (
                <ValidationMessage message={fieldErrors.expectedMonthlyRetirementRevenues} />
              )}
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
          </TabsContent>

          {/* Aba 3: Objetivo e Tributação */}
          <TabsContent value="objetivo-tributacao" className="space-y-6 mt-0">
            {/* Objetivo de Investimento e Planejamento Tributário */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-[#262d3d] mb-4 font-sans flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-purple-600" />
                Objetivo e Planejamento Tributário
              </h3>
              <p className="text-sm text-[#577171] mb-4 font-sans">
                Defina o objetivo dos investimentos e sua situação tributária
              </p>
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
              <div className="relative">
                <Select
                  value={data.investmentObjective}
                  onValueChange={(value) => {
                    handleChange("investmentObjective", value);
                    handleBlur("investmentObjective", value);
                  }}
                >
                  <SelectTrigger 
                    className={`font-sans w-full ${
                      getFieldStatus("investmentObjective", data.investmentObjective) === "error"
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : getFieldStatus("investmentObjective", data.investmentObjective) === "success"
                        ? "border-green-300 focus:border-green-500"
                        : ""
                    }`}
                  >
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
                {getFieldStatus("investmentObjective", data.investmentObjective) === "success" && (
                  <CheckCircle2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600 pointer-events-none" />
                )}
                {getFieldStatus("investmentObjective", data.investmentObjective) === "error" && (
                  <AlertCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600 pointer-events-none" />
                )}
              </div>
              {touchedFields.has("investmentObjective") && fieldErrors.investmentObjective && (
                <ValidationMessage message={fieldErrors.investmentObjective} />
              )}
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
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

