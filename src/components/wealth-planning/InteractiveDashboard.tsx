"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateScenario } from "@/lib/wealth-planning/calculations";
import { calculateRequiredMonthlyContribution, calculateCapitalUsing4PercentRule } from "@/lib/wealth-planning/calculations";
import type { WealthPlanningScenario, CalculationResults, ScenarioData } from "@/types/wealth-planning";
import ProjectionChartFixed from "@/components/wealth-planning/ProjectionChartFixed";
import ScenariosTable from "@/components/wealth-planning/ScenariosTable";
import ProtectionChart from "@/components/wealth-planning/ProtectionChart";
import FinancialSummary from "@/components/wealth-planning/FinancialSummary";
import InvestmentProjectionTable from "@/components/wealth-planning/InvestmentProjectionTable";
import WealthGoalCalculator from "@/components/wealth-planning/WealthGoalCalculator";
import { DashboardSummary } from "@/components/wealth-planning/DashboardSummary";
import { CollapsibleSection } from "@/components/wealth-planning/CollapsibleSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SaveIndicator, useSaveIndicator } from "@/components/wealth-planning/SaveIndicator";
import { useDebounce } from "@/hooks/useDebounce";

interface InteractiveDashboardProps {
  scenario: WealthPlanningScenario;
  onUpdate: (updatedScenario: Partial<WealthPlanningScenario>) => Promise<void>;
}

export default function InteractiveDashboard({
  scenario,
  onUpdate,
}: InteractiveDashboardProps) {
  const [localScenario, setLocalScenario] = useState<WealthPlanningScenario>(scenario);
  const [localResults, setLocalResults] = useState<CalculationResults | null>(
    scenario.calculatedResults || null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const saveIndicator = useSaveIndicator();
  const debouncedScenario = useDebounce(localScenario, 1000);

  // Sincronizar quando scenario prop mudar
  useEffect(() => {
    setLocalScenario(scenario);
    setLocalResults(scenario.calculatedResults || null);
  }, [scenario]);

  // Recalcular quando dados locais mudarem (com debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCalculating(true);
      try {
        const scenarioData: ScenarioData = {
          personalData: localScenario.personalData,
          financialData: localScenario.financialData,
          portfolio: localScenario.portfolio,
          assets: localScenario.assets,
          projects: localScenario.projects,
          debts: localScenario.debts,
          otherRevenues: localScenario.otherRevenues,
          assumptions: localScenario.assumptions,
        };
        const results = calculateScenario(scenarioData);
        
        // Debug: verificar se os resultados têm projeções
        if (process.env.NODE_ENV === 'development' && results.notRetired) {
          console.log('InteractiveDashboard: Resultados calculados', {
            hasYearlyProjections: !!results.notRetired.yearlyProjections,
            projectionsCount: results.notRetired.yearlyProjections?.length || 0,
            firstProjection: results.notRetired.yearlyProjections?.[0],
            projectedCapital: results.notRetired.currentScenario.projectedCapital
          });
        }
        
        setLocalResults(results);
      } catch (error) {
        console.error("Erro ao recalcular:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localScenario]);

  const updateField = useCallback(
    (path: string, value: unknown) => {
      setLocalScenario((prev) => {
        const updated = JSON.parse(JSON.stringify(prev)); // Deep clone
        const keys = path.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = updated;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        return updated;
      });
    },
    []
  );

  // Debounce para salvar no servidor (apenas quando necessário)
  useEffect(() => {
    if (JSON.stringify(debouncedScenario) !== JSON.stringify(scenario)) {
      saveIndicator.startSaving();
      onUpdate(debouncedScenario)
        .then(() => {
          saveIndicator.markSaved();
        })
        .catch((error) => {
          console.error("Erro ao salvar:", error);
          saveIndicator.markError("Erro ao salvar alterações");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedScenario]);

  const formatCurrency = (value: number) => {
    // Validar e limitar valores absurdos antes de formatar
    if (!isFinite(value) || value < 0 || value > 1e15) {
      console.warn('InteractiveDashboard: Valor monetário inválido ou muito alto', { value });
      return 'Valor inválido';
    }
    
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

  if (!localResults?.notRetired) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Execute os cálculos para ver os resultados
      </div>
    );
  }

  const results = localResults.notRetired;
  const pd = localScenario.personalData;
  const fd = localScenario.financialData;
  const portfolio = localScenario.portfolio;

  // Cálculos da calculadora
  const desiredAnnualIncome = (fd?.desiredMonthlyRetirementIncome || 0) * 12;
  const expectedAnnualRevenues = (fd?.expectedMonthlyRetirementRevenues || 0) * 12;
  const extraIncomeNeeded = desiredAnnualIncome - expectedAnnualRevenues;
  const capitalNeeded4Percent = calculateCapitalUsing4PercentRule(extraIncomeNeeded);
  const currentCapital = portfolio?.total || 0;
  const yearsToRetirement = (pd?.retirementAge || 0) - (pd?.age || 0);
  const nominalRate = (localScenario.assumptions?.retirementReturnNominal || 9.7) / 100;
  const requiredMonthlyContribution = calculateRequiredMonthlyContribution(
    capitalNeeded4Percent,
    currentCapital,
    yearsToRetirement,
    nominalRate
  );
  const gap = requiredMonthlyContribution - (fd?.monthlySavings || 0);

  // Calcular saldo mensal para InvestmentProjectionTable
  const monthlyIncome = fd?.currentAnnualIncome ? fd.currentAnnualIncome / 12 : 0;
  const monthlyExpenses = fd?.monthlyFamilyExpense || 0;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  
  // Taxa de retorno mensal (converter de anual para mensal)
  const annualReturnRate = (localScenario.assumptions?.retirementReturnNominal || 9.7) / 100;
  const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1 / 12) - 1;

  return (
    <>
      <SaveIndicator
        status={saveIndicator.status}
        lastSaved={saveIndicator.lastSaved}
        error={saveIndicator.error}
        onDismiss={saveIndicator.reset}
      />
      
      <div className="space-y-8">
        {/* Resumo Executivo - Sempre visível no topo */}
        <DashboardSummary
          results={results}
          requiredMonthlyContribution={requiredMonthlyContribution}
          gap={gap}
        />

        {/* Resumo Financeiro - Colapsável */}
        <CollapsibleSection
          title="Resumo Financeiro"
          description="Renda, despesas e saldo atual"
          defaultOpen={false}
        >
        <FinancialSummary
          financialData={fd}
          currentAnnualIncome={fd?.currentAnnualIncome}
        />
        </CollapsibleSection>

        {/* Parâmetros Editáveis - Colapsável */}
        <TooltipProvider>
          <CollapsibleSection
            title="Parâmetros Editáveis"
            description="Ajuste os valores para ver como impactam o planejamento"
            defaultOpen={false}
          >
            <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
              <div className="space-y-1">
                <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-[#262d3d] font-sans">Idade Atual</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center"
                          aria-label="Mais informações sobre Idade Atual"
                        >
                          <Info className="h-3 w-3 text-[#577171] hover:text-[#262d3d] transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-sans text-sm">
                          Idade atual do cliente. Determina o horizonte de investimento até a aposentadoria.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={pd?.age || 0}
                    onChange={(e) => updateField("personalData.age", parseInt(e.target.value) || 0)}
                    className="w-20 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium font-sans text-[#262d3d] bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-[#262d3d] font-sans">Idade Aposentadoria</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center"
                          aria-label="Mais informações sobre Idade de Aposentadoria"
                        >
                          <Info className="h-3 w-3 text-[#577171] hover:text-[#262d3d] transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-sans text-sm">
                          Idade em que o cliente planeja se aposentar. Deve ser maior que a idade atual.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={pd?.retirementAge || 0}
                    onChange={(e) => updateField("personalData.retirementAge", parseInt(e.target.value) || 0)}
                    className="w-20 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium font-sans text-[#262d3d] bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-[#262d3d] font-sans">Capital Atual</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center"
                          aria-label="Mais informações sobre Capital Atual"
                        >
                          <Info className="h-3 w-3 text-[#577171] hover:text-[#262d3d] transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-sans text-sm">
                          Valor total atual do patrimônio investido. Inclui todos os investimentos e ativos financeiros.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={portfolio?.total || 0}
                    onChange={(e) => {
                      const newTotal = parseFloat(e.target.value) || 0;
                      const updatedAssets = portfolio.assets.map((asset, idx) => 
                        idx === 0 ? { ...asset, value: newTotal } : asset
                      );
                      updateField("portfolio.total", newTotal);
                      updateField("portfolio.assets", updatedAssets);
                    }}
                    className="w-32 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-[#262d3d] font-sans">Poupança Mensal</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center"
                          aria-label="Mais informações sobre Poupança Mensal"
                        >
                          <Info className="h-3 w-3 text-[#577171] hover:text-[#262d3d] transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-sans text-sm">
                          Valor que o cliente consegue poupar e investir mensalmente. Este é o aporte mensal que será aplicado.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={fd?.monthlySavings || 0}
                    onChange={(e) => updateField("financialData.monthlySavings", parseFloat(e.target.value) || 0)}
                    className="w-32 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-[#262d3d] font-sans">Renda Desejada (Mensal)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center"
                          aria-label="Mais informações sobre Renda Desejada"
                        >
                          <Info className="h-3 w-3 text-[#577171] hover:text-[#262d3d] transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-sans text-sm">
                          Renda mensal que o cliente deseja ter durante a aposentadoria para manter o padrão de vida desejado.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={fd?.desiredMonthlyRetirementIncome || 0}
                    onChange={(e) => updateField("financialData.desiredMonthlyRetirementIncome", parseFloat(e.target.value) || 0)}
                    className="w-32 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-[#262d3d] font-sans">Receitas Previstas (Mensal)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center"
                          aria-label="Mais informações sobre Receitas Previstas"
                        >
                          <Info className="h-3 w-3 text-[#577171] hover:text-[#262d3d] transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-sans text-sm">
                          Receitas mensais esperadas durante a aposentadoria, como aposentadoria do INSS, aluguéis ou pensões.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={fd?.expectedMonthlyRetirementRevenues || 0}
                    onChange={(e) => updateField("financialData.expectedMonthlyRetirementRevenues", parseFloat(e.target.value) || 0)}
                    className="w-32 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-[#262d3d] font-sans">Retorno Esperado (%)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center"
                          aria-label="Mais informações sobre Retorno Esperado"
                        >
                          <Info className="h-3 w-3 text-[#577171] hover:text-[#262d3d] transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-sans text-sm">
                          Taxa de retorno anual esperada dos investimentos, considerando o perfil de risco e a alocação de ativos.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    value={localScenario.assumptions?.retirementReturnNominal || 0}
                    onChange={(e) => updateField("assumptions.retirementReturnNominal", parseFloat(e.target.value) || 0)}
                    className="w-24 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </TooltipProvider>

        {/* Projeções e Análises - Sistema de Tabs */}
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
          <Tabs defaultValue="projecao" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="projecao">Projeções</TabsTrigger>
              <TabsTrigger value="cenarios">Cenários</TabsTrigger>
              <TabsTrigger value="objetivo">Calculadora de Objetivo</TabsTrigger>
            </TabsList>

            <TabsContent value="projecao" className="space-y-8">
              {/* Gráfico de Projeção de Patrimônio */}
              <CollapsibleSection
                title="Gráfico de Projeção de Patrimônio"
                description="Evolução do patrimônio ao longo do tempo"
                defaultOpen={true}
              >
                <ProjectionChartFixed data={localScenario} />
              </CollapsibleSection>

              {/* Tabela de Investimento */}
              <CollapsibleSection
                title="Tabela de Projeção de Investimentos"
                description="Detalhamento mês a mês do crescimento do patrimônio"
                defaultOpen={false}
              >
                <InvestmentProjectionTable
                  monthlyBalance={monthlyBalance}
                  currentCapital={currentCapital}
                  monthlyReturnRate={monthlyReturnRate}
                />
              </CollapsibleSection>
            </TabsContent>

            <TabsContent value="cenarios" className="space-y-6">
              {/* Tabela Comparativa de Cenários */}
              <CollapsibleSection
                title="Comparação de Cenários"
                description="Visão comparativa entre diferentes estratégias"
                defaultOpen={true}
              >
                <div className="bg-white border border-[#e3e3e3] rounded-lg p-4">
                  <ScenariosTable results={results} />
                </div>
              </CollapsibleSection>

              {/* Cenários Detalhados - Cards */}
              <CollapsibleSection
                title="Detalhes dos Cenários"
                description="Análise detalhada de cada estratégia de aposentadoria"
                defaultOpen={false}
              >
                <div className="space-y-4">
                  {/* Cenário 1: Projeção Atual */}
                  <div className="border border-[#e3e3e3] rounded-lg p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-semibold text-[#262d3d] font-sans">Projeção Atual</div>
                        <div className="text-xs text-[#577171] font-sans mt-1">Cenário baseado na poupança atual</div>
                      </div>
                      {results.currentScenario.withinProfile && (
                        <span className="text-xs px-2 py-1 bg-[#98ab44]/20 text-[#98ab44] rounded border border-[#98ab44]/30">Dentro do Perfil</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-[#577171] mb-1 font-sans uppercase tracking-wide">Poupança Anual</div>
                        <div className="font-semibold text-[#262d3d] font-sans">{formatCurrency(results.currentScenario.annualSavings)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#577171] mb-1 font-sans uppercase tracking-wide">Capital Acumulado</div>
                        <div className="font-semibold text-[#262d3d] font-sans">{formatCurrency(results.currentScenario.projectedCapital)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#577171] mb-1 font-sans uppercase tracking-wide">Rentabilidade Necessária</div>
                        <div className="font-semibold text-[#262d3d] font-sans">
                          {formatPercentage(results.currentScenario.requiredRate || 0)}
                          {results.currentScenario.requiredRealRate !== undefined && (
                            <span className="text-[#577171] ml-1 font-normal">({formatPercentage(results.currentScenario.requiredRealRate)} real)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#577171] mb-1 font-sans uppercase tracking-wide">Capital Necessário</div>
                        <div className="font-semibold text-[#262d3d] font-sans">{formatCurrency(results.currentScenario.requiredCapital)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Cenário 2: Manutenção */}
                  <div className="border border-gray-200 rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Manutenção do Patrimônio</div>
                        <div className="text-xs text-gray-500">Viver apenas dos rendimentos</div>
                      </div>
                      {results.maintenanceScenario.withinProfile && (
                        <span className="text-xs px-2 py-1 bg-[#98ab44]/20 text-[#98ab44] rounded border border-[#98ab44]/30">Dentro do Perfil</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Poupança Anual</div>
                        <div className="font-semibold">{formatCurrency(results.maintenanceScenario.annualSavings)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Capital Acumulado</div>
                        <div className="font-semibold">{formatCurrency(results.maintenanceScenario.accumulatedCapital)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Rentabilidade Necessária</div>
                        <div className="font-semibold">
                          {results.maintenanceScenario.requiredRate ? formatPercentage(results.maintenanceScenario.requiredRate) : "N/A"}
                          {results.maintenanceScenario.requiredRealRate !== undefined && (
                            <span className="text-gray-500 ml-1">({formatPercentage(results.maintenanceScenario.requiredRealRate)} real)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Capital Necessário</div>
                        <div className="font-semibold">{formatCurrency(results.maintenanceScenario.requiredCapital)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Cenário 3: Consumo */}
                  <div className="border border-gray-200 rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Consumo do Patrimônio</div>
                        <div className="text-xs text-gray-500">Consumir parte do patrimônio</div>
                      </div>
                      {results.consumptionScenario.withinProfile && (
                        <span className="text-xs px-2 py-1 bg-[#98ab44]/20 text-[#98ab44] rounded border border-[#98ab44]/30">Dentro do Perfil</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Poupança Anual</div>
                        <div className="font-semibold">{formatCurrency(results.consumptionScenario.annualSavings)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Capital Acumulado</div>
                        <div className="font-semibold">{formatCurrency(results.consumptionScenario.accumulatedCapital)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Rentabilidade Necessária</div>
                        <div className="font-semibold">
                          {results.consumptionScenario.requiredRate ? formatPercentage(results.consumptionScenario.requiredRate) : "N/A"}
                          {results.consumptionScenario.requiredRealRate !== undefined && (
                            <span className="text-gray-500 ml-1">({formatPercentage(results.consumptionScenario.requiredRealRate)} real)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Capital Necessário</div>
                        <div className="font-semibold">{formatCurrency(results.consumptionScenario.requiredCapital)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </TabsContent>

            <TabsContent value="objetivo">
              <WealthGoalCalculator
                currentCapital={currentCapital}
                defaultReturnRate={annualReturnRate}
                defaultYearsToRetirement={yearsToRetirement}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Informações Adicionais - Colapsáveis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Perfil e Premissas */}
          <CollapsibleSection
            title="Perfil e Premissas"
            description="Configurações de risco e premissas macroeconômicas"
            defaultOpen={false}
          >
            <div className="space-y-3 bg-white border border-[#e3e3e3] rounded-lg p-4">
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3]">
              <span className="text-sm text-[#262d3d] font-sans">Perfil de Risco</span>
              <span className="text-sm font-semibold text-[#262d3d] font-sans">{pd?.suitability || "Não informado"}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3]">
              <span className="text-sm text-[#262d3d] font-sans">Rentabilidade Aposentadoria (Nominal)</span>
              <span className="text-sm font-semibold text-[#262d3d] font-sans">
                {formatPercentage((localScenario.assumptions?.retirementReturnNominal || 0) / 100)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3]">
              <span className="text-sm text-[#262d3d] font-sans">Juro Real na Aposentadoria</span>
              <span className="text-sm font-semibold text-[#262d3d] font-sans">
                {formatPercentage((localScenario.assumptions?.retirementRealRate || 0) / 100)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3]">
              <span className="text-sm text-[#262d3d] font-sans">Inflação Anual</span>
              <span className="text-sm font-semibold text-[#262d3d] font-sans">
                {formatPercentage(localScenario.assumptions?.annualInflation || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[#262d3d] font-sans">CDI Anual</span>
              <span className="text-sm font-semibold text-[#262d3d] font-sans">
                {formatPercentage(localScenario.assumptions?.annualCDI || 0)}
              </span>
            </div>
            </div>
          </CollapsibleSection>

          {/* Proteção Familiar */}
          {localResults.familyProtection && (
            <CollapsibleSection
              title="Proteção Familiar"
              description="Análise de proteção e sucessão familiar"
              defaultOpen={false}
            >
              <div className="bg-white border border-[#e3e3e3] rounded-lg p-4 mb-4">
                <ProtectionChart protection={localResults.familyProtection} />
              </div>
              <div className="space-y-3 bg-white border border-[#e3e3e3] rounded-lg p-4">
              <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3]">
                <span className="text-sm text-[#262d3d] font-sans">Proteção Total Necessária</span>
                <span className="text-sm font-semibold text-[#262d3d] font-sans">
                  {formatCurrency(localResults.familyProtection.totalProtection)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3]">
                <span className="text-sm text-[#262d3d] font-sans">Proteção Imediata</span>
                <span className="text-sm font-semibold text-[#262d3d] font-sans">
                  {formatCurrency(localResults.familyProtection.immediateProtection)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3]">
                <span className="text-sm text-[#262d3d] font-sans">Liquidez para Sucessão</span>
                <span className="text-sm font-semibold text-[#262d3d] font-sans">
                  {formatCurrency(localResults.familyProtection.successionLiquidity)}
                </span>
              </div>
                {/* spouseProtection e dependentsProtection não existem em FamilyProtection */}
              </div>
            </CollapsibleSection>
          )}
        </div>

        {isCalculating && (
          <div className="text-xs text-[#577171] text-center py-2 font-sans">Atualizando...</div>
        )}
      </div>
    </>
  );
}

