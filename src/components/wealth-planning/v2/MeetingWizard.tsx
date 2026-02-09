"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Download, RotateCcw } from "lucide-react";
import { FieldWithTooltip } from "@/components/wealth-planning/FieldWithTooltip";
import { RangeInput } from "@/components/wealth-planning/v2/RangeInput";
import { QuickResult } from "@/components/wealth-planning/v2/QuickResult";
import { ProjectionChart } from "@/components/wealth-planning/v2/ProjectionChart";
import { StressTestPanel } from "@/components/wealth-planning/v2/StressTestPanel";
import { ImpactAnalysis } from "@/components/wealth-planning/v2/ImpactAnalysis";
import { ActionPlan } from "@/components/wealth-planning/v2/ActionPlan";
import { SuccessionChecklist } from "@/components/wealth-planning/v2/SuccessionChecklist";
import { ScenarioExportImport } from "@/components/wealth-planning/v2/ScenarioExportImport";
import {
  generateAutoScenarios,
  runStressTests,
  generateActionPlan,
} from "@/lib/wealth-planning/calculations";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import type {
  QuickInputs,
  AutoScenariosResult,
  StressTestResult,
  ActionItem,
} from "@/types/wealth-planning-v2";
import {
  DEFAULT_QUICK_INPUTS,
  DEFAULT_STRESS_TESTS,
  RANGE_CONFIGS,
} from "@/types/wealth-planning-v2";
import { cn } from "@/lib/utils";

// ============================================================================
// STEPS CONFIG
// ============================================================================

const STEPS = [
  { id: "profile", title: "Perfil & Objetivo", short: "Perfil", icon: "👤" },
  { id: "financial", title: "Vida Financeira", short: "Financeiro", icon: "💰" },
  { id: "assumptions", title: "Premissas", short: "Premissas", icon: "📊" },
  { id: "results", title: "Resultado", short: "Resultado", icon: "🎯" },
];

// ============================================================================
// MEETING WIZARD
// ============================================================================

interface MeetingWizardProps {
  onExportPDF?: (inputs: QuickInputs, scenarios: AutoScenariosResult) => void;
  className?: string;
}

export default function MeetingWizard({ onExportPDF, className }: MeetingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<QuickInputs>(DEFAULT_QUICK_INPUTS);

  // Computed results
  const scenarios = useMemo<AutoScenariosResult>(() => {
    return generateAutoScenarios(inputs);
  }, [inputs]);

  const stressTests = useMemo<StressTestResult[]>(() => {
    return runStressTests(inputs, scenarios.base, DEFAULT_STRESS_TESTS);
  }, [inputs, scenarios.base]);

  const actionPlan = useMemo<ActionItem[]>(() => {
    return generateActionPlan(inputs, scenarios.base, stressTests);
  }, [inputs, scenarios.base, stressTests]);

  // Show succession?
  const showSuccession = useMemo(() => {
    const threshold = FEATURE_FLAGS.WEALTH_PLANNING_SUCCESSION_THRESHOLD;
    return inputs.hasDependents || inputs.currentPortfolio >= threshold;
  }, [inputs.hasDependents, inputs.currentPortfolio]);

  // Update helper
  const updateInput = useCallback(<K extends keyof QuickInputs>(key: K, value: QuickInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Navigation
  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0: return inputs.name.trim().length >= 2 && inputs.age >= 18 && inputs.retirementAge > inputs.age && inputs.lifeExpectancy > inputs.retirementAge;
      case 1: return inputs.monthlyExpense > 0 && inputs.currentPortfolio >= 0;
      case 2: return inputs.nominalReturn > 0 && inputs.inflation >= 0;
      default: return true;
    }
  }, [currentStep, inputs]);

  const goNext = () => {
    if (canGoNext && currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const goToStep = (step: number) => {
    if (step <= currentStep + 1 && step >= 0) setCurrentStep(step);
  };

  // Sync desiredMonthlyIncome com expense se não alterado manualmente
  const handleExpenseChange = (value: number, isRange: boolean) => {
    updateInput("monthlyExpense", value);
    updateInput("monthlyExpenseIsRange", isRange);
    // Auto-sync: renda desejada na IF = despesa atual (se não foi editada)
    if (inputs.desiredMonthlyIncome === inputs.monthlyExpense || inputs.desiredMonthlyIncome === 0) {
      updateInput("desiredMonthlyIncome", value);
    }
  };

  // ========================================================================
  // RENDER STEP CONTENT
  // ========================================================================

  const renderStep = () => {
    switch (currentStep) {
      // ==== STEP 0: Perfil & Objetivo ====
      case 0:
        return (
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <FieldWithTooltip label="Nome do cliente" tooltip="Nome para o relatório e identificação" required />
              <Input
                value={inputs.name}
                onChange={(e) => updateInput("name", e.target.value)}
                className="mt-2 font-sans"
                placeholder="Nome completo"
                autoFocus
              />
            </div>

            {/* Idade, IF, Expectativa — em grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <FieldWithTooltip label="Idade atual" tooltip="Idade atual em anos completos" required />
                <Input
                  type="number"
                  value={inputs.age || ""}
                  onChange={(e) => updateInput("age", Number(e.target.value))}
                  min={18} max={100}
                  className="mt-2 font-sans"
                />
              </div>
              <div>
                <FieldWithTooltip label="Idade para IF" tooltip="Quando deseja atingir a Independência Financeira" required />
                <Input
                  type="number"
                  value={inputs.retirementAge || ""}
                  onChange={(e) => updateInput("retirementAge", Number(e.target.value))}
                  min={inputs.age + 1} max={100}
                  className="mt-2 font-sans"
                />
              </div>
              <div>
                <FieldWithTooltip label="Expectativa de vida" tooltip="Quantos anos espera viver. Padrão: 85" required />
                <Input
                  type="number"
                  value={inputs.lifeExpectancy || ""}
                  onChange={(e) => updateInput("lifeExpectancy", Number(e.target.value))}
                  min={inputs.retirementAge + 1} max={120}
                  className="mt-2 font-sans"
                />
              </div>
            </div>

            {/* Perfil de risco */}
            <div>
              <FieldWithTooltip label="Perfil de risco" tooltip="Define limites de retorno esperado. Conservador = menor risco e retorno." required />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {(["Conservador", "Moderado", "Moderado-Agressivo", "Agressivo"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateInput("suitability", p)}
                    className={cn(
                      "px-3 py-2.5 rounded-lg border-2 text-sm font-sans font-medium transition-all",
                      inputs.suitability === p
                        ? "border-[#98ab44] bg-[#98ab44]/10 text-[#262d3d]"
                        : "border-[#e3e3e3] text-[#577171] hover:border-[#98ab44]/50"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Dependentes */}
            <div>
              <FieldWithTooltip label="Tem dependentes?" tooltip="Filhos, cônjuge ou outros que dependam financeiramente de você" required />
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => updateInput("hasDependents", true)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg border-2 text-sm font-sans font-medium transition-all flex-1",
                    inputs.hasDependents
                      ? "border-[#98ab44] bg-[#98ab44]/10 text-[#262d3d]"
                      : "border-[#e3e3e3] text-[#577171] hover:border-[#98ab44]/50"
                  )}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => { updateInput("hasDependents", false); updateInput("dependents", []); }}
                  className={cn(
                    "px-4 py-2.5 rounded-lg border-2 text-sm font-sans font-medium transition-all flex-1",
                    !inputs.hasDependents
                      ? "border-[#98ab44] bg-[#98ab44]/10 text-[#262d3d]"
                      : "border-[#e3e3e3] text-[#577171] hover:border-[#98ab44]/50"
                  )}
                >
                  Não
                </button>
              </div>
            </div>

            {/* Lista de dependentes (condicional) */}
            {inputs.hasDependents && (
              <div className="bg-[#98ab44]/5 border border-[#98ab44]/20 rounded-lg p-4 space-y-3">
                <p className="text-sm text-[#577171] font-sans">Informe os dependentes:</p>
                {inputs.dependents.map((dep, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={dep.name}
                      onChange={(e) => {
                        const updated = [...inputs.dependents];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        updateInput("dependents", updated);
                      }}
                      placeholder="Nome"
                      className="font-sans flex-1"
                    />
                    <Input
                      type="number"
                      value={dep.age || ""}
                      onChange={(e) => {
                        const updated = [...inputs.dependents];
                        updated[idx] = { ...updated[idx], age: Number(e.target.value) };
                        updateInput("dependents", updated);
                      }}
                      placeholder="Idade"
                      className="font-sans w-20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = inputs.dependents.filter((_, i) => i !== idx);
                        updateInput("dependents", updated);
                      }}
                      className="text-red-400 hover:text-red-600 text-sm font-sans"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateInput("dependents", [...inputs.dependents, { name: "", age: 0 }])}
                  className="text-sm text-[#98ab44] hover:text-[#98ab44]/80 font-sans font-medium"
                >
                  + Adicionar dependente
                </button>
              </div>
            )}
          </div>
        );

      // ==== STEP 1: Vida Financeira ====
      case 1:
        return (
          <div className="space-y-6">
            <RangeInput
              label="Despesa mensal familiar"
              tooltip="Quanto gasta por mês incluindo toda a família"
              ranges={RANGE_CONFIGS.monthlyExpense}
              value={inputs.monthlyExpense}
              isRange={inputs.monthlyExpenseIsRange}
              onChange={handleExpenseChange}
              required
            />

            <div>
              <FieldWithTooltip label="Renda mensal desejada na IF" tooltip="Quanto quer receber por mês na Independência Financeira (dica: geralmente = despesa atual)" required />
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#577171] font-sans">R$</span>
                <Input
                  type="number"
                  value={inputs.desiredMonthlyIncome || ""}
                  onChange={(e) => updateInput("desiredMonthlyIncome", Number(e.target.value))}
                  className="pl-10 font-sans"
                  placeholder="0"
                />
              </div>
            </div>

            <RangeInput
              label="Patrimônio investido atual"
              tooltip="Total de investimentos financeiros (não inclui imóvel de moradia)"
              ranges={RANGE_CONFIGS.currentPortfolio}
              value={inputs.currentPortfolio}
              isRange={inputs.currentPortfolioIsRange}
              onChange={(v, r) => { updateInput("currentPortfolio", v); updateInput("currentPortfolioIsRange", r); }}
              required
            />

            <RangeInput
              label="Aporte mensal atual"
              tooltip="Quanto consegue investir por mês atualmente"
              ranges={RANGE_CONFIGS.monthlyContribution}
              value={inputs.monthlyContribution}
              isRange={inputs.monthlyContributionIsRange}
              onChange={(v, r) => { updateInput("monthlyContribution", v); updateInput("monthlyContributionIsRange", r); }}
              required
            />

            <div>
              <FieldWithTooltip label="Receitas previstas na IF" tooltip="Aluguel, pensão, INSS, etc. que terá durante a Independência Financeira (se nenhuma, deixe 0)" />
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#577171] font-sans">R$</span>
                <Input
                  type="number"
                  value={inputs.expectedRetirementRevenues || ""}
                  onChange={(e) => updateInput("expectedRetirementRevenues", Number(e.target.value))}
                  className="pl-10 font-sans"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Toggles condicionais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldWithTooltip label="Tem metas grandes?" tooltip="Educação dos filhos, imóvel, viagem grande" />
                <div className="flex gap-2 mt-2">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" onClick={() => updateInput("hasProjects", v)}
                      className={cn("px-3 py-2 rounded-lg border-2 text-sm font-sans font-medium transition-all flex-1",
                        inputs.hasProjects === v ? "border-[#98ab44] bg-[#98ab44]/10 text-[#262d3d]" : "border-[#e3e3e3] text-[#577171] hover:border-[#98ab44]/50"
                      )}>
                      {v ? "Sim" : "Não"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldWithTooltip label="Tem dívidas?" tooltip="Financiamento, empréstimo, cartão" />
                <div className="flex gap-2 mt-2">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" onClick={() => updateInput("hasDebts", v)}
                      className={cn("px-3 py-2 rounded-lg border-2 text-sm font-sans font-medium transition-all flex-1",
                        inputs.hasDebts === v ? "border-[#98ab44] bg-[#98ab44]/10 text-[#262d3d]" : "border-[#e3e3e3] text-[#577171] hover:border-[#98ab44]/50"
                      )}>
                      {v ? "Sim" : "Não"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      // ==== STEP 2: Premissas ====
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <FieldWithTooltip label="Retorno nominal (a.a.)" tooltip="Retorno esperado dos investimentos antes de impostos" required />
                <div className="relative mt-2">
                  <Input
                    type="number"
                    value={inputs.nominalReturn || ""}
                    onChange={(e) => updateInput("nominalReturn", Number(e.target.value))}
                    step={0.5} min={0} max={30}
                    className="pr-8 font-sans"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#577171]">%</span>
                </div>
              </div>
              <div>
                <FieldWithTooltip label="Inflação (a.a.)" tooltip="IPCA estimado no longo prazo" required />
                <div className="relative mt-2">
                  <Input
                    type="number"
                    value={inputs.inflation || ""}
                    onChange={(e) => updateInput("inflation", Number(e.target.value))}
                    step={0.5} min={0} max={15}
                    className="pr-8 font-sans"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#577171]">%</span>
                </div>
              </div>
              <div>
                <FieldWithTooltip label="Desc. impostos/taxas" tooltip="IR + taxas sobre rentabilidade" />
                <div className="relative mt-2">
                  <Input
                    type="number"
                    value={inputs.taxDiscount || ""}
                    onChange={(e) => updateInput("taxDiscount", Number(e.target.value))}
                    step={1} min={0} max={30}
                    className="pr-8 font-sans"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#577171]">%</span>
                </div>
              </div>
            </div>

            {/* Método de cálculo */}
            <div>
              <FieldWithTooltip label="Método de cálculo" tooltip="Perpetuidade = não consumir capital. SWR = taxa segura de retirada (default 4%)" />
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { value: "perpetuity" as const, label: "Perpetuidade", desc: "Viver de renda sem consumir capital" },
                  { value: "swr" as const, label: "SWR (4%)", desc: "Retirada segura consumindo gradualmente" },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => updateInput("calculationMethod", m.value)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-all",
                      inputs.calculationMethod === m.value
                        ? "border-[#98ab44] bg-[#98ab44]/10"
                        : "border-[#e3e3e3] hover:border-[#98ab44]/50"
                    )}
                  >
                    <p className="font-semibold text-sm text-[#262d3d] font-sans">{m.label}</p>
                    <p className="text-xs text-[#577171] font-sans mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* SWR Rate (condicional) */}
            {inputs.calculationMethod === "swr" && (
              <div>
                <FieldWithTooltip label="Taxa SWR" tooltip="% do patrimônio que pode sacar por ano. Padrão: 4%" />
                <div className="relative mt-2">
                  <Input
                    type="number"
                    value={inputs.swrRate || ""}
                    onChange={(e) => updateInput("swrRate", Number(e.target.value))}
                    step={0.5} min={2} max={6}
                    className="pr-8 font-sans"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#577171]">%</span>
                </div>
              </div>
            )}

            {/* Preview dos 3 cenários */}
            <div className="bg-[#262d3d]/5 rounded-xl p-4">
              <p className="text-xs text-[#577171] font-sans font-semibold uppercase tracking-wide mb-3">
                Cenários que serão calculados
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Conservador", ret: Math.max(0, inputs.nominalReturn - 2), inf: inputs.inflation + 1 },
                  { label: "Base", ret: inputs.nominalReturn, inf: inputs.inflation },
                  { label: "Otimista", ret: inputs.nominalReturn + 2, inf: Math.max(0, inputs.inflation - 1) },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-lg p-3 border border-[#e3e3e3]">
                    <p className="font-semibold text-xs text-[#262d3d] font-sans">{s.label}</p>
                    <p className="text-[10px] text-[#577171] font-sans mt-1">Retorno: {s.ret.toFixed(1)}%</p>
                    <p className="text-[10px] text-[#577171] font-sans">Inflação: {s.inf.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ==== STEP 3: Resultado ====
      case 3:
        return (
          <div className="space-y-8">
            {/* Quick Result — 3 cards */}
            <QuickResult scenarios={scenarios} />

            {/* Gráfico de projeção */}
            <ProjectionChart scenarios={scenarios} inputs={inputs} />

            {/* Análise de impacto */}
            <ImpactAnalysis inputs={inputs} baseScenario={scenarios.base} />

            {/* Stress Tests */}
            <StressTestPanel results={stressTests} />

            {/* Plano de Ação */}
            <ActionPlan actions={actionPlan} />

            {/* Sucessão (condicional) */}
            {showSuccession && (
              <SuccessionChecklist />
            )}

            {/* Export/Import + PDF */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <ScenarioExportImport
                inputs={inputs}
                scenarios={scenarios}
                onImport={(imported) => { setInputs(imported); setCurrentStep(0); }}
              />
              {onExportPDF && (
                <Button
                  onClick={() => onExportPDF(inputs, scenarios)}
                  className="bg-[#262d3d] hover:bg-[#262d3d]/90 text-white font-sans px-8 py-3 text-base"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Exportar PDF
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#262d3d] font-serif">
          Simulador de Independência Financeira
        </h1>
        <p className="text-sm text-[#577171] font-sans mt-1">
          Modo Reunião — resultados em 30 segundos
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((step, idx) => {
            const isCurrent = idx === currentStep;
            const isCompleted = idx < currentStep;
            const isAccessible = idx <= currentStep + 1;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex-1 flex flex-col items-center",
                  isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                )}
                onClick={() => isAccessible && goToStep(idx)}
                role="button"
                tabIndex={isAccessible ? 0 : -1}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && isAccessible) { e.preventDefault(); goToStep(idx); } }}
              >
                {/* Bar */}
                <div className="w-full mb-2">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      isCompleted ? "bg-[#98ab44]" : isCurrent ? "bg-[#98ab44]" : "bg-[#e3e3e3]"
                    )}
                  />
                </div>
                {/* Icon + Label */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm mb-1 transition-all",
                  isCompleted ? "bg-[#98ab44] text-white" : isCurrent ? "bg-[#98ab44] text-white ring-2 ring-[#98ab44]/30" : "bg-gray-100 text-gray-400"
                )}>
                  {isCompleted ? "✓" : step.icon}
                </div>
                <p className={cn(
                  "text-xs font-sans",
                  isCurrent ? "text-[#262d3d] font-semibold" : "text-[#577171]"
                )}>
                  {step.short}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="shadow-lg border-[#e3e3e3]">
        <CardContent className="p-6 md:p-8">
          {/* Step title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#262d3d] font-sans">
              {STEPS[currentStep].icon} {STEPS[currentStep].title}
            </h2>
            <p className="text-sm text-[#577171] font-sans mt-1">
              Etapa {currentStep + 1} de {STEPS.length}
            </p>
          </div>

          {/* Content */}
          <div className="min-h-[300px]">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#e3e3e3]">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 3 ? () => setCurrentStep(0) : goPrev}
              disabled={currentStep === 0}
              className="font-sans min-w-[120px]"
            >
              {currentStep === 3 ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Recomeçar
                </>
              ) : (
                <>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </>
              )}
            </Button>

            <span className="text-sm text-[#577171] font-sans">
              {currentStep + 1} / {STEPS.length}
            </span>

            {currentStep < STEPS.length - 1 && (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans min-w-[120px]"
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {currentStep === STEPS.length - 1 && (
              <div className="min-w-[120px]" /> // Spacer
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
