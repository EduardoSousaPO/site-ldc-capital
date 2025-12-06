"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Save, Check } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useToast } from "@/components/ui/toast";
import PersonalDataForm from "@/components/wealth-planning/PersonalDataForm";
import FinancialDataForm from "@/components/wealth-planning/FinancialDataForm";
import PortfolioForm from "@/components/wealth-planning/PortfolioForm";
import AssetsForm from "@/components/wealth-planning/AssetsForm";
import ProjectsForm from "@/components/wealth-planning/ProjectsForm";
import DebtsForm from "@/components/wealth-planning/DebtsForm";
import OtherRevenuesForm from "@/components/wealth-planning/OtherRevenuesForm";
import AssumptionsForm from "@/components/wealth-planning/AssumptionsForm";
import { ValidationMessage } from "@/components/wealth-planning/ValidationMessage";
import { FieldWithTooltip } from "@/components/wealth-planning/FieldWithTooltip";
import type { ScenarioFormData } from "@/types/wealth-planning";

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

function NewScenarioPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [titleError, setTitleError] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState<Partial<ScenarioFormData>>({
    title: "",
    clientId: "",
    personalData: {
      name: "",
      age: 0,
      dependents: [],
      retirementAge: 0,
      lifeExpectancy: 0,
      maritalStatus: "Solteiro",
      suitability: "Moderado",
    },
    financialData: {
      monthlyFamilyExpense: 0,
      desiredMonthlyRetirementIncome: 0,
      monthlySavings: 0,
      expectedMonthlyRetirementRevenues: 0,
      investmentObjective: "Acumular Recursos",
    },
    portfolio: {
      assets: [{ name: "Carteira", value: 0, percentage: 100, cdiRate: 0.097 }],
      total: 0,
      taxConsideration: "Sem considerar I.R",
      immediateLiquidityNeeds: 0,
    },
    assets: {
      items: [{ name: "Casa Própria", value: 0, sellable: false }],
      total: 0,
    },
    projects: {
      items: [],
    },
    debts: {
      items: [],
      total: 0,
    },
    otherRevenues: {
      items: [],
      total: 0,
    },
    assumptions: {
      annualInflation: 3.5,
      annualCDI: 9.7,
      retirementReturnNominal: 9.7,
      retirementRealRate: 5.99,
    },
  });

  useEffect(() => {
    const clientIdParam = searchParams.get("clientId");
    if (clientIdParam) {
      setClientId(clientIdParam);
      setFormData((prev) => ({ ...prev, clientId: clientIdParam }));
    }
  }, [searchParams]);

  // Validação do título em tempo real
  useEffect(() => {
    if (titleTouched) {
      if (!formData.title || !formData.title.trim()) {
        setTitleError("Título é obrigatório");
      } else {
        setTitleError("");
      }
    }
  }, [formData.title, titleTouched]);

  const validateTitle = (): boolean => {
    setTitleTouched(true);
    if (!formData.title || !formData.title.trim()) {
      setTitleError("Título é obrigatório");
      return false;
    }
    setTitleError("");
    return true;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Dados Pessoais
        if (!formData.personalData?.name?.trim()) {
          return false;
        }
        if (!formData.personalData?.age || formData.personalData.age < 18 || formData.personalData.age > 120) {
          return false;
        }
        if (!formData.personalData?.retirementAge || formData.personalData.retirementAge < formData.personalData.age) {
          return false;
        }
        if (!formData.personalData?.lifeExpectancy || formData.personalData.lifeExpectancy <= formData.personalData.retirementAge) {
          return false;
        }
        return true;
      case 1: // Informações Financeiras
        return true; // Todos os campos são opcionais
      case 2: // Carteira
        if (!formData.portfolio?.assets || formData.portfolio.assets.length === 0) {
          return false;
        }
        return true;
      default:
        return true; // Outras etapas não têm validação obrigatória
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Permitir navegação para etapas já visitadas ou para a próxima etapa
    const maxVisited = visitedSteps.size > 0 ? Math.max(...Array.from(visitedSteps)) : -1;
    if (stepIndex <= maxVisited + 1 || visitedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex);
      setVisitedSteps((prev) => new Set([...prev, stepIndex]));
    }
  };

  const handleNext = () => {
    // Validar título se estiver na etapa 1
    if (currentStep === 0 && !validateTitle()) {
      return;
    }

    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      if (currentStep < STEPS.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setVisitedSteps((prev) => new Set([...prev, nextStep]));
      }
    } else {
      // Mostrar toast de erro específico
      if (currentStep === 0) {
        if (!formData.personalData?.name?.trim()) {
          showToast("Nome do cliente é obrigatório", "error");
        } else if (!formData.personalData?.age || formData.personalData.age < 18 || formData.personalData.age > 120) {
          showToast("Idade deve estar entre 18 e 120 anos", "error");
        } else if (!formData.personalData?.retirementAge || formData.personalData.retirementAge < formData.personalData.age) {
          showToast("Idade de aposentadoria deve ser maior que idade atual", "error");
        } else if (!formData.personalData?.lifeExpectancy || formData.personalData.lifeExpectancy <= formData.personalData.retirementAge) {
          showToast("Expectativa de vida deve ser maior que idade de aposentadoria", "error");
        }
      } else if (currentStep === 2) {
        showToast("Adicione pelo menos um ativo à carteira", "error");
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateTitle()) {
      return;
    }

    if (!formData.clientId) {
      showToast("Cliente é obrigatório", "error");
      return;
    }

    // Validar última etapa
    if (!validateStep(currentStep)) {
      if (currentStep === 2) {
        showToast("Adicione pelo menos um ativo à carteira", "error");
      }
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/wealth-planning/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const scenario = await response.json();
        showToast("Cenário criado com sucesso", "success");
        router.push(`/wealth-planning/scenarios/${scenario.id}/results`);
      } else {
        const errorData = await response.json();
        showToast(
          errorData.error || errorData.details || "Erro ao criar cenário",
          "error"
        );
      }
    } catch (error) {
      console.error("Erro ao criar cenário:", error);
      showToast("Erro ao criar cenário. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    // Adicionar contexto e explicação para cada etapa
    const getStepContext = () => {
      const contexts = [
        {
          title: "Informações Pessoais e Situação Familiar",
          description: "A idade atual determina o horizonte de investimento e quanto tempo resta para acumular recursos. O estado civil e dependentes impactam a renda necessária na aposentadoria.",
          tips: [
            "Pessoas mais jovens podem contribuir menos porque seu dinheiro terá mais tempo para render",
            "Planeje pelo menos 20 anos de aposentadoria",
            "O número de dependentes afeta o risco que você pode assumir",
          ],
        },
        {
          title: "Situação Financeira Atual",
          description: "Um panorama completo dos recursos permite calcular o patrimônio líquido e definir quanto precisa ser acumulado. Inclui renda, despesas, poupança e investimentos atuais.",
          tips: [
            "Inclua todas as fontes de renda: salário, aluguéis, dividendos",
            "Seja detalhado nas despesas para ter uma visão realista",
            "Considere reserva de emergência para pelo menos 6 meses",
          ],
        },
        {
          title: "Objetivos Financeiros e de Aposentadoria",
          description: "Defina claramente quando quer se aposentar e qual renda mensal deseja ter. Recomenda-se ter entre 70% e 90% da renda pré-aposentadoria.",
          tips: [
            "A idade de aposentadoria determina o horizonte de investimento",
            "Considere o estilo de vida desejado na aposentadoria",
            "A renda alvo depende do número de dependentes e custos previstos",
          ],
        },
        {
          title: "Carteira de Investimentos",
          description: "A composição atual da carteira e a alocação de ativos determinam o potencial de retorno. Portfólios mais arrojados têm maior potencial, mas também maior volatilidade.",
          tips: [
            "Com o tempo, a alocação deve se tornar mais conservadora",
            "Considere a necessidade de liquidez imediata",
            "A rentabilidade esperada baseia-se na alocação e perfil de risco",
          ],
        },
        {
          title: "Bens Móveis e Imóveis",
          description: "Imóveis, veículos e outros bens fazem parte do patrimônio total. Alguns podem gerar renda (aluguéis) e outros podem ser vendidos se necessário.",
          tips: [
            "Considere a liquidez dos ativos (facilidade de venda)",
            "Bens imóveis podem gerar renda de aluguel",
            "Nem todos os bens são vendáveis sem prejuízo significativo",
          ],
        },
        {
          title: "Projetos e Dívidas",
          description: "Projetos futuros (educação dos filhos, compra de imóveis) e dívidas atuais impactam a capacidade de poupança e o planejamento.",
          tips: [
            "Grandes objetivos devem ser considerados na alocação de recursos",
            "Dívidas com juros altos devem ser priorizadas no pagamento",
            "Projetos familiares podem exigir recursos adicionais",
          ],
        },
        {
          title: "Receitas Adicionais e Benefícios",
          description: "Fontes de renda futuras como pensões, benefícios governamentais (INSS), seguros e outras receitas complementam o planejamento.",
          tips: [
            "Considere todas as fontes de renda na aposentadoria",
            "Benefícios do empregador podem ser significativos",
            "Seguros de vida podem ser considerados como receita futura",
          ],
        },
        {
          title: "Premissas Macroeconômicas",
          description: "Taxas de inflação, CDI e rentabilidades esperadas são fundamentais para projetar o crescimento do patrimônio ao longo do tempo.",
          tips: [
            "A inflação reduz o poder de compra ao longo do tempo",
            "Taxas de retorno devem ser realistas baseadas no perfil de risco",
            "Considere a diferença entre retorno nominal e real",
          ],
        },
      ];
      return contexts[currentStep] || contexts[0];
    };

    const context = getStepContext();

    return (
      <div className="space-y-6">
        {/* Contexto e Explicação da Etapa */}
        <div className="bg-gradient-to-r from-[#98ab44]/5 to-transparent border border-[#98ab44]/20 rounded-lg p-4">
          <h3 className="font-semibold text-[#262d3d] mb-2 font-sans text-lg">
            {context.title}
          </h3>
          <p className="text-sm text-gray-700 font-sans mb-3">
            {context.description}
          </p>
          <div className="mt-3 pt-3 border-t border-[#98ab44]/20">
            <p className="text-xs font-semibold text-[#98ab44] mb-2 font-sans">
              Dicas importantes:
            </p>
            <ul className="space-y-1">
              {context.tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-gray-600 font-sans flex items-start gap-2">
                  <span className="text-[#98ab44] mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Conteúdo do Formulário */}
        <div>
          {(() => {
            switch (currentStep) {
              case 0: // Dados Pessoais
                return (
                  <div className="space-y-6">
                    {/* Campo de título movido para dentro do fluxo principal */}
                    <div className="bg-[#e3e3e3]/20 border border-[#e3e3e3] rounded-lg p-6">
                      <FieldWithTooltip
                        label="Título do Cenário"
                        tooltip="Dê um nome descritivo para este cenário de planejamento financeiro. Ex: 'Plano Aposentadoria aos 50' ou 'Cenário Conservador'"
                        required
                        htmlFor="scenario-title"
                      />
                      <Input
                        id="scenario-title"
                        type="text"
                        required
                        value={formData.title || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          if (titleTouched) {
                            validateTitle();
                          }
                        }}
                        onBlur={() => {
                          setTitleTouched(true);
                          validateTitle();
                        }}
                        className={`font-sans mt-2 ${
                          titleError && titleTouched
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Ex: Plano Aposentadoria aos 50"
                      />
                      {titleTouched && titleError && (
                        <ValidationMessage message={titleError} />
                      )}
                    </div>
                  <PersonalDataForm
                    data={formData.personalData!}
                    onChange={(data) =>
                      setFormData({ ...formData, personalData: data })
                    }
                  />
                  </div>
                );
              case 1: // Situação Financeira (inclui objetivos)
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
          })()}
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <Link
              href={
                clientId
                  ? `/wealth-planning/clients/${clientId}`
                  : "/wealth-planning/dashboard"
              }
            >
              <Button variant="ghost" className="font-sans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#98ab44]/10 to-transparent border-b">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle className="font-serif text-3xl text-[#262d3d] mb-1">
                      Novo Cenário de Planejamento
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
                </div>
              </div>
              
              {/* Indicador de Progresso Interativo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  {STEPS.map((step, index) => {
                    const isCompleted = completedSteps.has(index);
                    const isCurrent = index === currentStep;
                    const isVisited = visitedSteps.has(index);
                    const canNavigate = isVisited || index <= Math.max(...Array.from(visitedSteps)) + 1;
                    
                    return (
                    <div
                      key={index}
                        className={`flex-1 flex flex-col items-center ${
                          canNavigate ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                        }`}
                        onClick={() => canNavigate && handleStepClick(index)}
                        role="button"
                        tabIndex={canNavigate ? 0 : -1}
                        onKeyDown={(e) => {
                          if (canNavigate && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            handleStepClick(index);
                        }
                      }}
                        aria-label={`${step.title} - ${isCompleted ? "Concluída" : isCurrent ? "Atual" : "Não visitada"}`}
                    >
                      <div className="relative w-full">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted || isCurrent
                              ? "bg-[#98ab44]"
                                : isVisited
                                ? "bg-[#98ab44]/50"
                              : "bg-gray-200"
                          }`}
                        />
                          {isCurrent && (
                            <div className="absolute inset-0 bg-[#98ab44] rounded-full animate-pulse opacity-50" />
                        )}
                      </div>
                        <div className="mt-2 text-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-sans transition-all ${
                              isCompleted
                              ? "bg-[#98ab44] text-white"
                                : isCurrent
                                ? "bg-[#98ab44] text-white scale-110 shadow-lg ring-2 ring-[#98ab44]/30"
                                : isVisited
                                ? "bg-[#98ab44]/30 text-[#98ab44] border-2 border-[#98ab44]/50"
                              : "bg-gray-200 text-gray-500"
                            } ${canNavigate ? "hover:scale-105" : ""}`}
                        >
                            {isCompleted ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              index + 1
                            )}
                        </div>
                          <p
                            className={`text-xs mt-1 font-sans font-medium max-w-[90px] ${
                              isCurrent ? "text-[#262d3d]" : isVisited ? "text-[#577171]" : "text-gray-400"
                            }`}
                          >
                          {step.short || step.title}
                        </p>
                      </div>
                    </div>
                    );
                  })}
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
                  <div className="text-xs mt-1">{STEPS[currentStep].description}</div>
                </div>
                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans min-w-[120px] shadow-md hover:shadow-lg transition-all"
                  >
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans min-w-[160px] shadow-md hover:shadow-lg transition-all"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Salvando..." : "Salvar Cenário"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function NewScenarioPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin"></div>
        </main>
        <Footer />
      </>
    }>
      <NewScenarioPageContent />
    </Suspense>
  );
}
