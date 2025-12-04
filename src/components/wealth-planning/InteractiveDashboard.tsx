"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateScenario } from "@/lib/wealth-planning/calculations";
import { calculateRequiredMonthlyContribution, calculateCapitalUsing4PercentRule } from "@/lib/wealth-planning/calculations";
import type { WealthPlanningScenario, CalculationResults, ScenarioData } from "@/types/wealth-planning";
import ProjectionChartFixed from "@/components/wealth-planning/ProjectionChartFixed";
import FinancialThermometer from "@/components/wealth-planning/FinancialThermometer";
import ScenariosTable from "@/components/wealth-planning/ScenariosTable";
import ProtectionChart from "@/components/wealth-planning/ProtectionChart";
import FinancialSummary from "@/components/wealth-planning/FinancialSummary";
import InvestmentProjectionTable from "@/components/wealth-planning/InvestmentProjectionTable";
import WealthGoalCalculator from "@/components/wealth-planning/WealthGoalCalculator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatedNumber, formatters } from "@/components/wealth-planning/AnimatedNumber";
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
      
      <div className="space-y-12">
        {/* Resumo Financeiro */}
        <FinancialSummary
          financialData={fd}
          currentAnnualIncome={fd?.currentAnnualIncome}
        />

        {/* Métricas Principais - Grid Minimalista */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
            <div className="text-xs text-[#577171] uppercase tracking-wide mb-3 font-sans">Capital Projetado</div>
            <div className="text-3xl font-semibold text-[#262d3d] font-sans">
              <AnimatedNumber
                value={results.currentScenario.projectedCapital}
                format={formatters.currency}
              />
            </div>
          </div>
          <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
            <div className="text-xs text-[#577171] uppercase tracking-wide mb-3 font-sans">Capital Necessário</div>
            <div className="text-3xl font-semibold text-[#262d3d] font-sans">
              <AnimatedNumber
                value={results.currentScenario.requiredCapital}
                format={formatters.currency}
              />
            </div>
          {results.currentScenario.requiredCapital > results.currentScenario.projectedCapital && (
            <div className="text-xs text-[#262d3d] mt-2 font-medium font-sans">
              Faltam {formatCurrency(results.currentScenario.requiredCapital - results.currentScenario.projectedCapital)}
            </div>
          )}
        </div>
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
          <div className="text-xs text-[#577171] uppercase tracking-wide mb-3 font-sans">Rentabilidade Necessária</div>
          <div className="text-3xl font-semibold text-[#262d3d] font-sans">
            {formatPercentage(results.currentScenario.requiredRate || 0)}
          </div>
          {results.currentScenario.requiredRealRate !== undefined && (
            <div className="text-xs text-[#577171] mt-2 font-sans">
              Real: {formatPercentage(results.currentScenario.requiredRealRate)}
            </div>
          )}
        </div>
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
          <div className="text-xs text-[#577171] uppercase tracking-wide mb-3 font-sans">Aporte Mensal Necessário</div>
          <div className="text-3xl font-semibold text-[#262d3d] font-sans">
            {formatCurrency(requiredMonthlyContribution)}
          </div>
          {gap > 0 && (
            <div className="text-xs text-[#262d3d] mt-2 font-medium font-sans">
              +{formatCurrency(gap)} necessário
            </div>
          )}
        </div>
      </div>

      {/* Termômetro Financeiro */}
      {results.financialThermometer !== undefined && (
        <div>
          <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-4 font-sans">Indicador Financeiro</div>
          <FinancialThermometer value={results.financialThermometer} />
        </div>
      )}

      {/* Parâmetros Editáveis - Estilo Planilha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Coluna Esquerda: Parâmetros */}
        <div>
          <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-6 font-sans">Parâmetros</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
              <Label className="text-sm text-[#262d3d] font-sans">Idade Atual</Label>
              <Input
                type="number"
                value={pd?.age || 0}
                onChange={(e) => updateField("personalData.age", parseInt(e.target.value) || 0)}
                className="w-20 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium font-sans text-[#262d3d] bg-transparent"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
              <Label className="text-sm text-[#262d3d] font-sans">Idade Aposentadoria</Label>
              <Input
                type="number"
                value={pd?.retirementAge || 0}
                onChange={(e) => updateField("personalData.retirementAge", parseInt(e.target.value) || 0)}
                className="w-20 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium font-sans text-[#262d3d] bg-transparent"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
              <Label className="text-sm text-[#262d3d] font-sans">Capital Atual</Label>
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
              <Label className="text-sm text-[#262d3d] font-sans">Poupança Mensal</Label>
              <Input
                type="number"
                value={fd?.monthlySavings || 0}
                onChange={(e) => updateField("financialData.monthlySavings", parseFloat(e.target.value) || 0)}
                className="w-32 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
              <Label className="text-sm text-[#262d3d] font-sans">Renda Desejada (Mensal)</Label>
              <Input
                type="number"
                value={fd?.desiredMonthlyRetirementIncome || 0}
                onChange={(e) => updateField("financialData.desiredMonthlyRetirementIncome", parseFloat(e.target.value) || 0)}
                className="w-32 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
              <Label className="text-sm text-[#262d3d] font-sans">Receitas Previstas (Mensal)</Label>
              <Input
                type="number"
                value={fd?.expectedMonthlyRetirementRevenues || 0}
                onChange={(e) => updateField("financialData.expectedMonthlyRetirementRevenues", parseFloat(e.target.value) || 0)}
                className="w-32 text-right border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto text-sm font-medium"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#e3e3e3] hover:bg-[#e3e3e3]/30 px-2 -mx-2 rounded transition-colors">
              <Label className="text-sm text-[#262d3d] font-sans">Retorno Esperado (%)</Label>
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

        {/* Coluna Direita: Sistema de Tabs */}
        <div>
          <Tabs defaultValue="projecao" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="projecao">Projeção</TabsTrigger>
              <TabsTrigger value="objetivo">Objetivo</TabsTrigger>
            </TabsList>

            <TabsContent value="projecao" className="space-y-8">
              {/* Gráfico de Projeção de Patrimônio */}
              <div>
                <ProjectionChartFixed data={localScenario} />
              </div>

              {/* Tabela de Investimento */}
              <div>
                <InvestmentProjectionTable
                  monthlyBalance={monthlyBalance}
                  currentCapital={currentCapital}
                  monthlyReturnRate={monthlyReturnRate}
                />
              </div>

              {/* Tabela Comparativa de Cenários */}
              <div>
                <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-4 font-sans">Comparação de Cenários</div>
                <div className="bg-white border border-[#e3e3e3] rounded-lg p-4">
                  <ScenariosTable results={results} />
                </div>
              </div>

              {/* Cenários Detalhados - Cards */}
              <div>
                <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-4 font-sans">Detalhes dos Cenários</div>
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
              </div>
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
      </div>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-[#e3e3e3] pt-8 mt-8">
        {/* Perfil e Premissas */}
        <div>
          <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-4 font-sans">Perfil e Premissas</div>
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
        </div>

        {/* Proteção Familiar */}
        {localResults.familyProtection && (
          <div>
            <div className="text-xs font-semibold text-[#577171] uppercase tracking-wide mb-4 font-sans">Proteção Familiar</div>
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
          </div>
        )}
      </div>

        {isCalculating && (
          <div className="text-xs text-[#577171] text-center py-2 font-sans">Atualizando...</div>
        )}
      </div>
    </>
  );
}

