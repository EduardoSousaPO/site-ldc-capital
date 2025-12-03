"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import PersonalDataForm from "@/components/wealth-planning/PersonalDataForm";
import FinancialDataForm from "@/components/wealth-planning/FinancialDataForm";
import PortfolioForm from "@/components/wealth-planning/PortfolioForm";
import AssetsForm from "@/components/wealth-planning/AssetsForm";
import ProjectsForm from "@/components/wealth-planning/ProjectsForm";
import DebtsForm from "@/components/wealth-planning/DebtsForm";
import OtherRevenuesForm from "@/components/wealth-planning/OtherRevenuesForm";
import AssumptionsForm from "@/components/wealth-planning/AssumptionsForm";
import type { ScenarioData, ScenarioFormData } from "@/types/wealth-planning";

const STEPS = [
  {
    title: "Dados Pessoais",
    description: "Informações pessoais e situação familiar",
    short: "Pessoal",
  },
  {
    title: "Situação Financeira",
    description: "Renda, despesas e objetivos de aposentadoria",
    short: "Financeiro",
  },
  {
    title: "Carteira e Patrimônio",
    description: "Investimentos, bens e ativos",
    short: "Patrimônio",
  },
  {
    title: "Projetos e Obrigações",
    description: "Projetos futuros, dívidas e receitas adicionais",
    short: "Projetos",
  },
  {
    title: "Premissas",
    description: "Premissas macroeconômicas e taxas",
    short: "Premissas",
  },
];

interface ScenarioWizardProps {
  initialData?: ScenarioData;
  initialClientId?: string;
  initialTitle?: string;
  onSave: (data: ScenarioData, title: string) => Promise<void>;
}

export default function ScenarioWizard({
  initialData,
  initialClientId,
  initialTitle = "",
  onSave,
}: ScenarioWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialTitle);

  const [formData, setFormData] = useState<Partial<ScenarioFormData>>({
    title: initialTitle,
    clientId: initialClientId || "",
    personalData: initialData?.personalData || {
      name: "",
      age: 0,
      dependents: [],
      retirementAge: 0,
      lifeExpectancy: 0,
      maritalStatus: "Solteiro",
      suitability: "Moderado",
    },
    financialData: initialData?.financialData || {
      monthlyFamilyExpense: 0,
      desiredMonthlyRetirementIncome: 0,
      monthlySavings: 0,
      expectedMonthlyRetirementRevenues: 0,
      investmentObjective: "Acumular Recursos",
    },
    portfolio: initialData?.portfolio || {
      assets: [{ name: "Carteira", value: 0, percentage: 100, cdiRate: 0.097 }],
      total: 0,
      taxConsideration: "Sem considerar I.R",
      immediateLiquidityNeeds: 0,
    },
    assets: initialData?.assets || {
      items: [{ name: "Casa Própria", value: 0, sellable: false }],
      total: 0,
    },
    projects: initialData?.projects || {
      items: [],
    },
    debts: initialData?.debts || {
      items: [],
      total: 0,
    },
    otherRevenues: initialData?.otherRevenues || {
      items: [],
      total: 0,
    },
    assumptions: initialData?.assumptions || {
      annualInflation: 3.5,
      annualCDI: 9.7,
      retirementReturnNominal: 9.7,
      retirementRealRate: 5.99,
    },
  });

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Dados Pessoais
        if (!formData.personalData?.name?.trim()) {
          alert("Nome do cliente é obrigatório");
          return false;
        }
        if (!formData.personalData?.age || formData.personalData.age < 18 || formData.personalData.age > 120) {
          alert("Idade deve estar entre 18 e 120 anos");
          return false;
        }
        if (!formData.personalData?.retirementAge || formData.personalData.retirementAge < formData.personalData.age) {
          alert("Idade de aposentadoria deve ser maior que idade atual");
          return false;
        }
        if (!formData.personalData?.lifeExpectancy || formData.personalData.lifeExpectancy <= formData.personalData.retirementAge) {
          alert("Expectativa de vida deve ser maior que idade de aposentadoria");
          return false;
        }
        return true;
      case 1: // Informações Financeiras
        return true; // Todos os campos são opcionais
      case 2: // Carteira
        if (!formData.portfolio?.assets || formData.portfolio.assets.length === 0) {
          alert("Adicione pelo menos um ativo à carteira");
          return false;
        }
        return true;
      default:
        return true; // Outras etapas não têm validação obrigatória
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!title || !title.trim()) {
      alert("Título é obrigatório");
      return;
    }

    // Validar última etapa
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    try {
      const scenarioData: ScenarioData = {
        personalData: formData.personalData!,
        financialData: formData.financialData!,
        portfolio: formData.portfolio!,
        assets: formData.assets!,
        projects: formData.projects!,
        debts: formData.debts!,
        otherRevenues: formData.otherRevenues!,
        assumptions: formData.assumptions!,
      };
      await onSave(scenarioData, title);
    } catch (error) {
      console.error("Erro ao salvar cenário:", error);
      alert("Erro ao salvar cenário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Dados Pessoais
        return (
          <PersonalDataForm
            data={formData.personalData!}
            onChange={(data) =>
              setFormData({ ...formData, personalData: data })
            }
          />
        );
      case 1: // Situação Financeira
        return (
          <FinancialDataForm
            data={formData.financialData!}
            onChange={(data) =>
              setFormData({ ...formData, financialData: data })
            }
          />
        );
      case 2: // Carteira e Patrimônio
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#262d3d] mb-4 font-sans">
                Carteira de Investimentos
              </h3>
              <PortfolioForm
                data={formData.portfolio!}
                onChange={(data) => setFormData({ ...formData, portfolio: data })}
              />
            </div>
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#262d3d] mb-4 font-sans">
                Bens e Ativos
              </h3>
              <AssetsForm
                data={formData.assets!}
                onChange={(data) => setFormData({ ...formData, assets: data })}
              />
            </div>
          </div>
        );
      case 3: // Projetos e Obrigações
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#262d3d] mb-4 font-sans">
                Projetos Futuros
              </h3>
              <ProjectsForm
                data={formData.projects!}
                onChange={(data) => setFormData({ ...formData, projects: data })}
              />
            </div>
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#262d3d] mb-4 font-sans">
                Dívidas e Financiamentos
              </h3>
              <DebtsForm
                data={formData.debts!}
                onChange={(data) => setFormData({ ...formData, debts: data })}
              />
            </div>
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#262d3d] mb-4 font-sans">
                Receitas Adicionais e Benefícios
              </h3>
              <OtherRevenuesForm
                data={formData.otherRevenues!}
                onChange={(data) =>
                  setFormData({ ...formData, otherRevenues: data })
                }
              />
            </div>
          </div>
        );
      case 4: // Premissas
        return (
          <AssumptionsForm
            data={formData.assumptions!}
            onChange={(data) =>
              setFormData({ ...formData, assumptions: data })
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#98ab44]/10 to-transparent border-b">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="font-serif text-2xl text-[#262d3d] mb-1">
                {initialTitle ? "Editar Cenário" : "Novo Cenário"}
              </CardTitle>
              <div>
                <p className="text-sm text-gray-600 font-sans">
                  {STEPS[currentStep].title} - Etapa {currentStep + 1} de {STEPS.length}
                </p>
                <p className="text-xs text-gray-500 font-sans mt-1">
                  {STEPS[currentStep].description}
                </p>
              </div>
            </div>
            {currentStep === 0 && (
              <div className="w-80 space-y-2">
                <label className="font-sans font-medium text-sm block">
                  Título do Cenário *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#98ab44] focus-visible:border-[#98ab44] font-sans transition-all"
                  placeholder="Ex: Plano Aposentadoria aos 50"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Indicador de Progresso */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center"
              >
                <div className="relative w-full">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index < currentStep
                        ? "bg-[#98ab44]"
                        : index === currentStep
                        ? "bg-[#98ab44]"
                        : "bg-gray-200"
                    }`}
                  />
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-sans transition-all ${
                      index < currentStep
                        ? "bg-[#98ab44] text-white"
                        : index === currentStep
                        ? "bg-[#98ab44] text-white scale-110 shadow-lg"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </div>
                  <p className="text-xs mt-1 font-sans font-medium max-w-[90px]">
                    {step.short || step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="font-sans min-w-[120px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <div className="text-sm text-gray-500 font-sans text-center">
            <div className="font-medium">{currentStep + 1} de {STEPS.length} etapas</div>
          </div>
          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans min-w-[120px]"
            >
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans min-w-[160px]"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar Cenário"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

