"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronDown,
  FileDown,
  HandCoins,
  Info,
  Landmark,
  Loader2,
  PhoneCall,
  Plus,
  Trash2,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trackLead } from "@/lib/analytics";
import type {
  BusinessActivityType,
  BusinessTaxRegime,
  DividendSourceInput,
  DividendTaxAlert,
  DividendTaxSimulationInput,
  DividendTaxSimulationResult,
  ScenarioCode,
  ScenarioComparisonResult,
  ScenarioTaxBreakdown,
} from "@/lib/dividend-tax/types";
import { TAX_CONSTANTS } from "@/lib/dividend-tax/tax-constants";
import IncomeCompositionChart from "@/components/dividend-tax/IncomeCompositionChart";
import RegimeComparisonChart from "@/components/dividend-tax/RegimeComparisonChart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

type SimplifiedRegime = "simples" | "presumido" | "real" | "nao_sei";
type SimplifiedActivity =
  | "servicos"
  | "comercio"
  | "saude"
  | "tech"
  | "industria"
  | "outro";

interface AdditionalCompany {
  id: string;
  nome: string;
  valorMensal: number;
}

interface LeadFormState {
  nome: string;
  email: string;
  telefone: string;
  consentimento: boolean;
}

interface UserInputSimplificado {
  retiradaMensal: number;
  regimeTributario: SimplifiedRegime;
  atividade: SimplifiedActivity;
  temOutrasRendas: boolean;
  outrasRendas: {
    salarioCLT: number;
    alugueis: number;
    fiis: number;
  };
  multiplasEmpresas: boolean;
  empresasAdicionais: AdditionalCompany[];
  faturamentoAnual: number | null;
  margemLucro: number | null;
  folhaAnual: number | null;
  numSocios: number;
  participacao: number;
  distribuicaoLucro: number;
  jaTemJCP: boolean;
  jaTemHolding: boolean;
}

interface HumanAlert {
  code: string;
  title: string;
  description: string;
  action: string | null;
  severity: "warning" | "opportunity" | "success";
  estimatedAnnualSavings?: number;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const currencyCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const WHATSAPP_PHONE_NUMBER = "555189301511";

const DEFAULT_MARGINS_BY_ACTIVITY: Record<SimplifiedActivity, number> = {
  servicos: 32,
  comercio: 12,
  saude: 35,
  tech: 40,
  industria: 15,
  outro: 25,
};

const ACTIVITY_TO_ENGINE: Record<SimplifiedActivity, BusinessActivityType> = {
  servicos: "servicos_geral",
  comercio: "comercio",
  saude: "servicos_regulamentado",
  tech: "servicos_geral",
  industria: "industria",
  outro: "servicos_geral",
};

const ACTIVITY_OPTIONS: Array<{ value: SimplifiedActivity; label: string }> = [
  { value: "servicos", label: "Servicos" },
  { value: "comercio", label: "Comercio" },
  { value: "saude", label: "Saude" },
  { value: "tech", label: "Tecnologia" },
  { value: "industria", label: "Industria" },
  { value: "outro", label: "Outro" },
];

const REGIME_CARDS: Array<{
  value: Exclude<SimplifiedRegime, "nao_sei">;
  title: string;
  subtitle: string;
  description: string;
}> = [
  {
    value: "simples",
    title: "Simples Nacional",
    subtitle: "Perfil ate R$ 4,8M/ano",
    description: "Modelo simplificado para empresas menores.",
  },
  {
    value: "presumido",
    title: "Lucro Presumido",
    subtitle: "Comum em servicos",
    description: "Regime mais usado em empresas de servico.",
  },
  {
    value: "real",
    title: "Lucro Real",
    subtitle: "Maior profundidade contabil",
    description: "Comum em empresas maiores ou margens apertadas.",
  },
];

const SCENARIO_CONFIG: Record<
  ScenarioCode,
  {
    title: string;
    subtitle: string;
    idealFor: string;
    badge: string;
    baseClass: string;
  }
> = {
  A_STATUS_QUO: {
    title: "Cenario A",
    subtitle: "Nao mudar nada",
    idealFor: "Quem prefere manter o formato atual e absorver o impacto.",
    badge: "Base de comparacao",
    baseClass: "border-[#d8d8d8]",
  },
  B_MIX_OTIMIZADO: {
    title: "Cenario B",
    subtitle: "Mix otimizado",
    idealFor: "Quem quer reduzir imposto sem abrir nova empresa.",
    badge: "Mais economico sem nova PJ",
    baseClass: "border-[#8b9a46]/40",
  },
  C_HOLDING: {
    title: "Cenario C",
    subtitle: "Via holding",
    idealFor: "Quem aceita reter parte na PJ em troca de maior eficiencia.",
    badge: "Maior economia com diferimento",
    baseClass: "border-[#577171]/40",
  },
};

const BREAKDOWN_ROWS: Array<{ key: keyof ScenarioTaxBreakdown; label: string }> = [
  { key: "irpj", label: "IRPJ" },
  { key: "csll", label: "CSLL" },
  { key: "pis", label: "PIS" },
  { key: "cofins", label: "COFINS" },
  { key: "simplesDAS", label: "DAS (Simples)" },
  { key: "inssPatronal", label: "INSS patronal" },
  { key: "inssSocio", label: "INSS socio" },
  { key: "irrfDividendos", label: "IRRF dividendos" },
  { key: "irrfJcp", label: "IRRF JCP" },
  { key: "irpfm", label: "IRPFM" },
  { key: "custoHolding", label: "Custo holding" },
];

function formatCurrency(value: number) {
  return currency.format(value || 0);
}

function formatCurrencyCompact(value: number) {
  return currencyCompact.format(value || 0);
}

function formatPercent(value: number) {
  return `${percent.format(value || 0)}%`;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapRegimeToEngine(regime: SimplifiedRegime): BusinessTaxRegime {
  if (regime === "simples") return "simples";
  if (regime === "real") return "lucro_real";
  return "lucro_presumido";
}

function getDefaultMargin(activity: SimplifiedActivity) {
  return DEFAULT_MARGINS_BY_ACTIVITY[activity];
}

function resolveMargin(input: UserInputSimplificado) {
  const margin = input.margemLucro ?? getDefaultMargin(input.atividade);
  return Math.max(5, Math.min(80, margin));
}

function resolveFaturamentoAnual(input: UserInputSimplificado) {
  if ((input.faturamentoAnual ?? 0) > 0) return input.faturamentoAnual as number;
  const marginDecimal = resolveMargin(input) / 100;
  return (input.retiradaMensal * 12) / Math.max(0.05, marginDecimal);
}

function createAdditionalCompany(index: number): AdditionalCompany {
  return {
    id: createId("empresa"),
    nome: `Empresa ${index}`,
    valorMensal: 0,
  };
}

function estimateMonthlyIrrfForResident(monthlyAmount: number) {
  if (monthlyAmount > TAX_CONSTANTS.IRRF_LIMIAR_MENSAL) {
    return monthlyAmount * TAX_CONSTANTS.IRRF_ALIQUOTA;
  }
  return 0;
}

function parseErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message || "Falha na requisicao.";
  } catch {
    return "Falha na requisicao.";
  }
}

function useCountUp(target: number, enabled: boolean, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      setValue(target * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, enabled, duration]);

  return value;
}

function ExplainedTerm({
  term,
  explanation,
  children,
}: {
  term: string;
  explanation: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 border-b border-dotted border-[#577171]/70 cursor-help">
          {children}
          <Info className="h-3.5 w-3.5 text-[#577171]" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>
          <strong>{term}:</strong> {explanation}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function humanizeAlert(
  alert: DividendTaxAlert,
  result: DividendTaxSimulationResult,
  userInput: UserInputSimplificado,
): HumanAlert {
  const totalMonthlyDividends = result.totalAnnualDividends / 12;
  const thresholdSource = result.sourceBreakdown.find(
    (source) =>
      source.sourceType === "empresa_brasil" && source.monthlyAmount > TAX_CONSTANTS.IRRF_LIMIAR_MENSAL,
  );

  switch (alert.code) {
    case "efeito_degrau": {
      const mensal = thresholdSource?.monthlyAmount ?? userInput.retiradaMensal;
      return {
        code: alert.code,
        title: "Cuidado com o salto dos R$ 50 mil",
        description:
          `Ao retirar ${formatCurrencyCompact(mensal)}/mes da mesma empresa, o imposto de 10% ` +
          "incide sobre o valor inteiro. Limitar a retirada a R$ 50 mil pode reduzir o IRRF imediato para zero.",
        action: "Considere ajustar a distribuicao mensal por empresa pagadora.",
        severity: "warning",
        estimatedAnnualSavings: alert.estimatedAnnualSavings,
      };
    }
    case "fii_excluido_irpfm": {
      const fiiMonthly = result.sourceBreakdown
        .filter((source) => source.sourceType === "fii_fiagro")
        .reduce((acc, source) => acc + source.monthlyAmount, 0);
      return {
        code: alert.code,
        title: "Fundos imobiliarios seguem protegidos",
        description:
          `${formatCurrencyCompact(fiiMonthly)}/mes em FIIs ficaram fora da base do imposto minimo. ` +
          "Manter essa alocacao pode ajudar na eficiencia tributaria.",
        action: null,
        severity: "success",
      };
    }
    case "proximo_limiar_irpfm": {
      const gap = Math.max(0, TAX_CONSTANTS.IRPFM_LIMIAR_INFERIOR - result.irpfmBaseAnnual);
      return {
        code: alert.code,
        title: "Voce esta perto de um limite importante",
        description:
          `Sua base anual esta em ${formatCurrencyCompact(result.irpfmBaseAnnual)}. ` +
          `Ao adiar ${formatCurrencyCompact(gap)}, voce pode evitar o gatilho do imposto minimo no ano atual.`,
        action: "Converse com seu contador sobre o timing das distribuicoes.",
        severity: "opportunity",
      };
    }
    case "redutor_zerou_irpfm":
      return {
        code: alert.code,
        title: "Sua estrutura ja absorveu o imposto adicional",
        description:
          "A combinacao de creditos e redutor neutralizou o imposto minimo nesta simulacao.",
        action: null,
        severity: "success",
      };
    case "oportunidade_pro_labore":
      return {
        code: alert.code,
        title: "Aproveite a faixa de pro-labore ate R$ 5 mil",
        description:
          "Distribuir parte da retirada como pro-labore pode reduzir dividendos sujeitos ao degrau de 10% e melhorar o mix tributario.",
        action: "O Cenario B ja contempla essa estrategia no seu caso.",
        severity: "opportunity",
      };
    case "lp_impacto_irpfm":
      return {
        code: alert.code,
        title: "Lucro Presumido tende a sentir mais o impacto",
        description:
          "No seu perfil, o Presumido pode deixar imposto residual na pessoa fisica se comparado ao melhor mix.",
        action: "Compare abaixo o simulador de regime para validar migracao.",
        severity: "warning",
      };
    case "diluicao_fontes":
      return {
        code: alert.code,
        title: "Boa distribuicao entre fontes",
        description:
          "Dividir dividendos por mais de uma empresa pagadora pode reduzir ativacao do degrau mensal de IRRF.",
        action: null,
        severity: "success",
      };
    case "nao_residente_irrf":
      return {
        code: alert.code,
        title: "Nao residente paga em qualquer valor",
        description:
          "Para nao residentes, o IRRF de 10% incide sobre qualquer valor de dividendo tributavel, sem limite de R$ 50 mil.",
        action: "Cheque tratado de bitributacao com seu pais de residencia.",
        severity: "warning",
      };
    case "simples_inseguranca_juridica":
      return {
        code: alert.code,
        title: "Simples Nacional ainda em disputa juridica",
        description:
          "A aplicacao da nova regra ao Simples segue discutida no STF. Ha divergencias praticas entre Receita e decisoes judiciais.",
        action: "Acompanhe a evolucao juridica com seu advogado tributarista.",
        severity: "opportunity",
      };
    case "oportunidade_holding":
      return {
        code: alert.code,
        title: "Holding pode reduzir imposto no seu volume",
        description:
          `Com retiradas de ${formatCurrencyCompact(totalMonthlyDividends)}/mes, a holding permite diferir ` +
          "tributacao na pessoa fisica e organizar retiradas no tempo.",
        action: "Veja o Cenario C para analisar custo anual e economia liquida.",
        severity: "opportunity",
      };
    default:
      return {
        code: alert.code,
        title: alert.title,
        description: alert.description,
        action: alert.suggestedAction || null,
        severity: alert.severity,
        estimatedAnnualSavings: alert.estimatedAnnualSavings,
      };
  }
}

function ScenarioOutcomeChart({
  scenarios,
}: {
  scenarios: ScenarioComparisonResult[];
}) {
  const chartData = scenarios.map((scenario) => ({
    name: SCENARIO_CONFIG[scenario.code].title,
    imposto: Number(scenario.totalTax.toFixed(2)),
    liquido: Number(scenario.netToPartner.toFixed(2)),
    code: scenario.code,
  }));

  const colorByCode: Record<ScenarioCode, string> = {
    A_STATUS_QUO: "#c94c4c",
    B_MIX_OTIMIZADO: "#8b9a46",
    C_HOLDING: "#577171",
  };

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          <XAxis type="number" tickFormatter={(value) => formatCurrencyCompact(Number(value))} fontSize={12} />
          <YAxis dataKey="name" type="category" fontSize={12} width={95} />
          <RechartsTooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name === "imposto" ? "Imposto" : "Liquido"]}
          />
          <Bar dataKey="imposto" stackId="total" radius={[6, 0, 0, 6]}>
            {chartData.map((entry) => (
              <Cell key={`${entry.code}-imposto`} fill={colorByCode[entry.code]} />
            ))}
          </Bar>
          <Bar dataKey="liquido" stackId="total" fill="#4caf50" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function traduzirParaEngine(input: UserInputSimplificado): DividendTaxSimulationInput {
  const margemDefault = getDefaultMargin(input.atividade);
  const faturamentoAnual = resolveFaturamentoAnual(input);

  const salarioAnual = input.temOutrasRendas ? input.outrasRendas.salarioCLT * 12 : 0;
  const alugueisAnual = input.temOutrasRendas ? input.outrasRendas.alugueis * 12 : 0;
  const fiisMensal = input.temOutrasRendas ? input.outrasRendas.fiis : 0;

  const fontes: DividendSourceInput[] = [
    {
      id: "empresa-principal",
      name: "Empresa principal",
      monthlyAmount: Math.max(0, input.retiradaMensal),
      monthsReceived: 12,
      sourceType: "empresa_brasil",
    },
  ];

  if (fiisMensal > 0) {
    fontes.push({
      id: "fii",
      name: "Fundos Imobiliarios",
      monthlyAmount: fiisMensal,
      monthsReceived: 12,
      sourceType: "fii_fiagro",
    });
  }

  if (input.multiplasEmpresas) {
    input.empresasAdicionais
      .filter((empresa) => empresa.valorMensal > 0)
      .forEach((empresa) => {
        fontes.push({
          id: empresa.id,
          name: empresa.nome.trim() || "Empresa adicional",
          monthlyAmount: empresa.valorMensal,
          monthsReceived: 12,
          sourceType: "empresa_brasil",
        });
      });
  }

  return {
    residency: "residente",
    sources: fontes,
    annualIncomes: {
      otherTaxableAnnualIncome: salarioAnual,
      otherExclusiveAnnualIncome: 0,
      otherExemptAnnualIncome: alugueisAnual,
      excludedFromIrpfmAnnual: 0,
    },
    deductions: {
      includeCalculatedIrrfCredit: true,
      additionalIrrfCredits: 0,
      irpfProgressivePaid: 0,
      offshorePaid: 0,
      definitivePaid: 0,
      manualOtherDeductions: 0,
    },
    enableRedutor: false,
    redutorCompanies: [],
    business: {
      regimeTributario: mapRegimeToEngine(input.regimeTributario),
      atividadePrincipal: ACTIVITY_TO_ENGINE[input.atividade],
      faturamentoAnual,
      margemLucroPercentual: input.margemLucro ?? margemDefault,
      folhaAnual: input.folhaAnual ?? faturamentoAnual * 0.3,
      numeroSocios: input.numSocios || 1,
      participacaoSocioPercentual: input.participacao || 100,
      percentualDistribuicaoLucro: input.distribuicaoLucro || 100,
      jaPagaJcp: input.jaTemJCP,
      temHolding: input.jaTemHolding,
    },
  };
}

export default function DividendTaxCalculator() {
  const [userInput, setUserInput] = useState<UserInputSimplificado>({
    retiradaMensal: 0,
    regimeTributario: "presumido",
    atividade: "servicos",
    temOutrasRendas: false,
    outrasRendas: {
      salarioCLT: 0,
      alugueis: 0,
      fiis: 0,
    },
    multiplasEmpresas: false,
    empresasAdicionais: [createAdditionalCompany(1)],
    faturamentoAnual: null,
    margemLucro: null,
    folhaAnual: null,
    numSocios: 1,
    participacao: 100,
    distribuicaoLucro: 100,
    jaTemJCP: false,
    jaTemHolding: false,
  });

  const [showRefine, setShowRefine] = useState(false);
  const [result, setResult] = useState<DividendTaxSimulationResult | null>(null);
  const [lastCalculatedInput, setLastCalculatedInput] =
    useState<DividendTaxSimulationInput | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const [lead, setLead] = useState<LeadFormState>({
    nome: "",
    email: "",
    telefone: "",
    consentimento: false,
  });
  const [loadingReport, setLoadingReport] = useState(false);
  const [leadMessage, setLeadMessage] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const resultsSectionRef = useRef<HTMLDivElement | null>(null);
  const strategiesSectionRef = useRef<HTMLDivElement | null>(null);
  const leadSectionRef = useRef<HTMLDivElement | null>(null);

  const translatedAlerts = useMemo(() => {
    if (!result) return [];
    return result.alerts.map((alert) => humanizeAlert(alert, result, userInput));
  }, [result, userInput]);

  const scenariosByCode = useMemo(() => {
    if (!result) return null;

    return {
      A_STATUS_QUO: result.scenarios.find((scenario) => scenario.code === "A_STATUS_QUO") || null,
      B_MIX_OTIMIZADO: result.scenarios.find((scenario) => scenario.code === "B_MIX_OTIMIZADO") || null,
      C_HOLDING: result.scenarios.find((scenario) => scenario.code === "C_HOLDING") || null,
    };
  }, [result]);

  const bestScenario = useMemo(
    () => result?.scenarios.find((scenario) => scenario.isBest) || null,
    [result],
  );

  const maxPotentialSavings = useMemo(() => {
    if (!result) return 0;
    return Math.max(0, ...result.scenarios.map((scenario) => scenario.annualSavingsVsStatusQuo));
  }, [result]);

  const currentEngineRegime = mapRegimeToEngine(userInput.regimeTributario);

  const currentRegimeResult = useMemo(() => {
    if (!result) return null;
    return result.regimeSimulation.find((regime) => regime.regime === currentEngineRegime) || null;
  }, [result, currentEngineRegime]);

  const bestRegimeResult = useMemo(() => {
    if (!result) return null;
    return result.regimeSimulation.find((regime) => regime.isBest) || null;
  }, [result]);

  const showRegimeOpportunitySection = useMemo(() => {
    if (!result || !bestRegimeResult || !currentRegimeResult) return false;
    if (userInput.regimeTributario === "nao_sei") return true;

    return (
      bestRegimeResult.regime !== currentRegimeResult.regime &&
      currentRegimeResult.totalTax - bestRegimeResult.totalTax > 1
    );
  }, [result, userInput.regimeTributario, currentRegimeResult, bestRegimeResult]);

  const headlineCount = useCountUp(result?.totalTaxDue || 0, showResults && !!result, 1500);

  const whatsappUrl = useMemo(() => {
    if (!result) return `https://wa.me/${WHATSAPP_PHONE_NUMBER}`;

    const scenarioText = bestScenario ? SCENARIO_CONFIG[bestScenario.code].title : "Cenario B";
    const message =
      "Ola, fiz a simulacao na calculadora de tributacao de dividendos. " +
      `Meu impacto estimado e de ${formatCurrencyCompact(result.totalTaxDue)}/ano e quero avaliar o ${scenarioText}.`;

    return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
  }, [result, bestScenario]);

  const onCalculate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCalcError(null);
    setLeadError(null);
    setLeadMessage(null);

    if (userInput.retiradaMensal <= 0) {
      setCalcError("Preencha o valor da retirada para simular.");
      return;
    }

    setLoadingCalc(true);

    try {
      const payload = traduzirParaEngine(userInput);

      const [response] = await Promise.all([
        fetch("/api/dividend-tax/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        sleep(1800),
      ]);

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as {
        input: DividendTaxSimulationInput;
        result: DividendTaxSimulationResult;
      };

      setResult(data.result);
      setLastCalculatedInput(data.input || payload);
      setShowResults(true);

      requestAnimationFrame(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      setCalcError(parseErrorMessage(error, "Nao foi possivel calcular sua simulacao."));
      setShowResults(false);
      setResult(null);
      setLastCalculatedInput(null);
    } finally {
      setLoadingCalc(false);
    }
  };

  const onGenerateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLeadError(null);
    setLeadMessage(null);

    if (!result || !lastCalculatedInput) {
      setLeadError("Execute a simulacao antes de gerar o relatorio.");
      return;
    }

    if (!lead.nome.trim() || !lead.email.trim() || !lead.telefone.trim()) {
      setLeadError("Preencha nome, email e WhatsApp para continuar.");
      return;
    }

    if (!lead.consentimento) {
      setLeadError("Confirme o consentimento para receber o relatorio.");
      return;
    }

    setLoadingReport(true);

    try {
      const leadResponse = await fetch("/api/dividend-tax/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: lead.nome.trim(),
          email: lead.email.trim(),
          telefone: lead.telefone.trim(),
          consentimento: true,
          simulationSummary: {
            totalAnnualDividends: result.totalAnnualDividends,
            totalTaxDue: result.totalTaxDue,
            netAnnualDividends: result.netAnnualDividends,
            impactPercentage: result.impactPercentage,
          },
        }),
      });

      if (!leadResponse.ok) {
        throw new Error(await parseError(leadResponse));
      }

      const reportResponse = await fetch("/api/dividend-tax/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: lastCalculatedInput,
          leadName: lead.nome.trim(),
        }),
      });

      if (!reportResponse.ok) {
        throw new Error(await parseError(reportResponse));
      }

      const blob = await reportResponse.blob();
      const contentType = reportResponse.headers.get("content-type") || "";
      const extension = contentType.includes("application/pdf") ? "pdf" : "html";
      const fileName = `relatorio-tributacao-dividendos-ldc-${new Date().toISOString().slice(0, 10)}.${extension}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      trackLead("calculadora-ir-dividendos-2026", Math.round(result.totalTaxDue));
      setLeadMessage("Relatorio gerado com sucesso. Seus dados foram registrados.");
    } catch (error) {
      setLeadError(parseErrorMessage(error, "Nao foi possivel gerar seu relatorio."));
    } finally {
      setLoadingReport(false);
    }
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToStrategies = () => {
    strategiesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToLead = () => {
    leadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const mainMonthlyTaxBefore = 0;
  const mainMonthlyTaxAfter = result ? result.totalTaxDue / 12 : 0;
  const netShareAfter =
    result && result.totalAnnualDividends > 0
      ? Math.max(0, Math.min(100, (result.netAnnualDividends / result.totalAnnualDividends) * 100))
      : 100;

  const scenarioA = scenariosByCode?.A_STATUS_QUO || null;
  const scenarioB = scenariosByCode?.B_MIX_OTIMIZADO || null;
  const scenarioC = scenariosByCode?.C_HOLDING || null;

  const proLaboreMensal = Math.min(5_000, userInput.retiradaMensal);
  const dividendosSemProlabore = userInput.retiradaMensal;
  const dividendosComProlabore = Math.max(0, userInput.retiradaMensal - proLaboreMensal);
  const irrfSemProlabore = estimateMonthlyIrrfForResident(dividendosSemProlabore);
  const irrfComProlabore = estimateMonthlyIrrfForResident(dividendosComProlabore);
  const inssSocioEstimado = Math.min(
    proLaboreMensal * TAX_CONSTANTS.INSS_EMPREGADO_ALIQUOTA,
    TAX_CONSTANTS.INSS_TETO_2026,
  );

  const jcpAnnual = scenarioB ? scenarioB.taxBreakdown.irrfJcp / TAX_CONSTANTS.JCP_IRRF : 0;
  const jcpMonthly = jcpAnnual / 12;
  const jcpCompanyBenefitMonthly = scenarioB ? scenarioB.taxBreakdown.beneficioFiscalJcp / 12 : 0;
  const jcpPersonalTaxMonthly = scenarioB ? scenarioB.taxBreakdown.irrfJcp / 12 : 0;
  const jcpNetGainMonthly = jcpCompanyBenefitMonthly - jcpPersonalTaxMonthly;

  const monthlyTotalDividends = result ? result.totalAnnualDividends / 12 : 0;
  const showJcpStrategy = userInput.regimeTributario !== "simples";
  const showHoldingStrategy = monthlyTotalDividends > 30_000;

  const holdingDistributionAnnual = result
    ? Math.min(result.totalAnnualDividends, TAX_CONSTANTS.IRRF_LIMIAR_MENSAL * 12)
    : 0;
  const holdingDeferredAnnual = result
    ? Math.max(0, result.totalAnnualDividends - holdingDistributionAnnual)
    : 0;

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-8 pb-20">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1f2e] via-[#262d3d] to-[#344645] p-6 sm:p-10 text-white">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute -top-16 -right-10 h-52 w-52 rounded-full bg-[#8b9a46]/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[#becc6a]/25 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-4xl space-y-5">
            <Image
              src="/images/logo-ldc-horizontal.png"
              alt="LDC Capital"
              width={272}
              height={56}
              className="h-8 w-auto brightness-0 invert"
              priority
            />
            <p className="text-xs sm:text-sm uppercase tracking-[0.22em] text-white/80 font-semibold">
              Calculadora de Tributacao de Dividendos
            </p>
            <h1 className="font-serif text-3xl md:text-5xl leading-tight text-white">
              Descubra quanto a nova lei vai custar para voce e como pagar menos.
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-2xl">
              Lei 15.270/2025 | Vigente desde janeiro de 2026.
            </p>

            <Button
              type="button"
              onClick={scrollToForm}
              className="h-12 px-6 bg-[#8b9a46] hover:bg-[#6b7a3d] text-white"
            >
              Comece sua simulacao gratuita
              <ArrowDown className="h-4 w-4 animate-bounce" />
            </Button>
          </div>
        </section>

        <section ref={formSectionRef} className="space-y-4">
          <Card className="border-[#e5e7eb] bg-[#f9faf7]">
            <CardHeader>
              <CardTitle className="text-[#1f2937] text-2xl">Conte-nos sobre sua situacao</CardTitle>
              <CardDescription>
                Preencha so o essencial. Os dados tecnicos podem ser refinados depois, se voce quiser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="dividend-simulation-form" ref={formRef} onSubmit={onCalculate} className="space-y-6">
                <div className="rounded-2xl border border-[#d9dfc3] bg-white p-5">
                  <Label className="text-sm font-semibold text-[#262d3d]">
                    Quanto voce retira da sua empresa por mes?
                  </Label>
                  <NumericFormat
                    customInput={Input}
                    value={userInput.retiradaMensal}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    fixedDecimalScale
                    prefix="R$ "
                    allowNegative={false}
                    placeholder="Ex: 50.000"
                    className="mt-3 h-16 text-2xl font-semibold border-[#cfd6b8]"
                    onValueChange={(values) =>
                      setUserInput((prev) => ({
                        ...prev,
                        retiradaMensal: values.floatValue || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-[#577171] mt-2">
                    Inclua dividendos, pro-labore e qualquer retirada recorrente.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#262d3d]">
                    Qual o regime tributario da sua empresa?
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {REGIME_CARDS.map((card) => {
                      const isSelected = userInput.regimeTributario === card.value;

                      return (
                        <button
                          key={card.value}
                          type="button"
                          onClick={() =>
                            setUserInput((prev) => ({
                              ...prev,
                              regimeTributario: card.value,
                            }))
                          }
                          className={`rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? "border-[#8b9a46] bg-[#8b9a46]/10 shadow-sm"
                              : "border-[#e5e7eb] bg-white hover:border-[#8b9a46]/40"
                          }`}
                        >
                          <p className="font-semibold text-[#262d3d]">{card.title}</p>
                          <p className="text-xs font-medium text-[#577171] mt-1">{card.subtitle}</p>
                          <p className="text-xs text-[#6b7280] mt-2">{card.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-dashed border-[#d1d5db] p-3 bg-white">
                    <Checkbox
                      id="regime-nao-sei"
                      checked={userInput.regimeTributario === "nao_sei"}
                      onCheckedChange={(checked) =>
                        setUserInput((prev) => ({
                          ...prev,
                          regimeTributario: checked ? "nao_sei" : "presumido",
                        }))
                      }
                    />
                    <Label htmlFor="regime-nao-sei" className="text-sm text-[#4b5563]">
                      Nao sei qual e. Assumir Lucro Presumido e mostrar alerta para confirmar com contador.
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#262d3d]">Qual a atividade principal?</Label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_OPTIONS.map((option) => {
                      const selected = userInput.atividade === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setUserInput((prev) => ({
                              ...prev,
                              atividade: option.value,
                            }))
                          }
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            selected
                              ? "bg-[#262d3d] text-white"
                              : "bg-white border border-[#d1d5db] text-[#374151] hover:border-[#8b9a46]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#262d3d]">
                    Voce tem outras rendas alem da empresa?
                  </Label>
                  <div className="inline-flex rounded-full border border-[#d1d5db] bg-white p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setUserInput((prev) => ({
                          ...prev,
                          temOutrasRendas: false,
                          outrasRendas: {
                            salarioCLT: 0,
                            alugueis: 0,
                            fiis: 0,
                          },
                        }))
                      }
                      className={`rounded-full px-4 py-1.5 text-sm transition ${
                        !userInput.temOutrasRendas
                          ? "bg-[#262d3d] text-white"
                          : "text-[#4b5563] hover:text-[#262d3d]"
                      }`}
                    >
                      Nao
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setUserInput((prev) => ({
                          ...prev,
                          temOutrasRendas: true,
                        }))
                      }
                      className={`rounded-full px-4 py-1.5 text-sm transition ${
                        userInput.temOutrasRendas
                          ? "bg-[#262d3d] text-white"
                          : "text-[#4b5563] hover:text-[#262d3d]"
                      }`}
                    >
                      Sim
                    </button>
                  </div>

                  <div
                    className={`grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden transition-all duration-300 ${
                      userInput.temOutrasRendas ? "max-h-[360px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div>
                      <Label className="text-xs text-[#577171]">Salario CLT (mensal)</Label>
                      <NumericFormat
                        customInput={Input}
                        value={userInput.outrasRendas.salarioCLT}
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="R$ "
                        allowNegative={false}
                        onValueChange={(values) =>
                          setUserInput((prev) => ({
                            ...prev,
                            outrasRendas: {
                              ...prev.outrasRendas,
                              salarioCLT: values.floatValue || 0,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#577171]">Alugueis (mensal)</Label>
                      <NumericFormat
                        customInput={Input}
                        value={userInput.outrasRendas.alugueis}
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="R$ "
                        allowNegative={false}
                        onValueChange={(values) =>
                          setUserInput((prev) => ({
                            ...prev,
                            outrasRendas: {
                              ...prev.outrasRendas,
                              alugueis: values.floatValue || 0,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#577171]">Fundos imobiliarios (mensal)</Label>
                      <NumericFormat
                        customInput={Input}
                        value={userInput.outrasRendas.fiis}
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="R$ "
                        allowNegative={false}
                        onValueChange={(values) =>
                          setUserInput((prev) => ({
                            ...prev,
                            outrasRendas: {
                              ...prev.outrasRendas,
                              fiis: values.floatValue || 0,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#262d3d]">
                    Tem mais de uma empresa pagando dividendos?
                  </Label>
                  <div className="inline-flex rounded-full border border-[#d1d5db] bg-white p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setUserInput((prev) => ({
                          ...prev,
                          multiplasEmpresas: false,
                        }))
                      }
                      className={`rounded-full px-4 py-1.5 text-sm transition ${
                        !userInput.multiplasEmpresas
                          ? "bg-[#262d3d] text-white"
                          : "text-[#4b5563] hover:text-[#262d3d]"
                      }`}
                    >
                      Nao
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setUserInput((prev) => ({
                          ...prev,
                          multiplasEmpresas: true,
                        }))
                      }
                      className={`rounded-full px-4 py-1.5 text-sm transition ${
                        userInput.multiplasEmpresas
                          ? "bg-[#262d3d] text-white"
                          : "text-[#4b5563] hover:text-[#262d3d]"
                      }`}
                    >
                      Sim
                    </button>
                  </div>

                  {userInput.multiplasEmpresas && (
                    <div className="space-y-3 rounded-xl border border-[#e5e7eb] bg-white p-4">
                      {userInput.empresasAdicionais.map((empresa, index) => (
                        <div key={empresa.id} className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 items-end">
                          <div>
                            <Label className="text-xs text-[#577171]">Nome da empresa</Label>
                            <Input
                              value={empresa.nome}
                              onChange={(event) =>
                                setUserInput((prev) => ({
                                  ...prev,
                                  empresasAdicionais: prev.empresasAdicionais.map((item) =>
                                    item.id === empresa.id ? { ...item, nome: event.target.value } : item,
                                  ),
                                }))
                              }
                              placeholder={`Empresa ${index + 1}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[#577171]">Retirada mensal</Label>
                            <NumericFormat
                              customInput={Input}
                              value={empresa.valorMensal}
                              thousandSeparator="."
                              decimalSeparator=","
                              decimalScale={2}
                              fixedDecimalScale
                              prefix="R$ "
                              allowNegative={false}
                              onValueChange={(values) =>
                                setUserInput((prev) => ({
                                  ...prev,
                                  empresasAdicionais: prev.empresasAdicionais.map((item) =>
                                    item.id === empresa.id
                                      ? { ...item, valorMensal: values.floatValue || 0 }
                                      : item,
                                  ),
                                }))
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setUserInput((prev) => ({
                                ...prev,
                                empresasAdicionais:
                                  prev.empresasAdicionais.length === 1
                                    ? prev.empresasAdicionais
                                    : prev.empresasAdicionais.filter((item) => item.id !== empresa.id),
                              }))
                            }
                            disabled={userInput.empresasAdicionais.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setUserInput((prev) => ({
                            ...prev,
                            empresasAdicionais: [
                              ...prev.empresasAdicionais,
                              createAdditionalCompany(prev.empresasAdicionais.length + 1),
                            ],
                          }))
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar empresa
                      </Button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowRefine((prev) => !prev)}
                  className="text-sm font-medium text-[#577171] hover:text-[#262d3d] inline-flex items-center gap-2"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showRefine ? "rotate-180" : "rotate-0"}`}
                  />
                  Refinar dados da empresa (opcional)
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    showRefine ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="rounded-2xl border border-[#d9dfc3] bg-white p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-[#577171]">Faturamento anual</Label>
                        <NumericFormat
                          customInput={Input}
                          value={userInput.faturamentoAnual || ""}
                          thousandSeparator="."
                          decimalSeparator=","
                          decimalScale={2}
                          fixedDecimalScale
                          prefix="R$ "
                          allowNegative={false}
                          placeholder={formatCurrencyCompact(resolveFaturamentoAnual(userInput))}
                          onValueChange={(values) =>
                            setUserInput((prev) => ({
                              ...prev,
                              faturamentoAnual: values.floatValue || null,
                            }))
                          }
                        />
                        <p className="text-xs text-[#6b7280] mt-1">
                          Estimativa automatica: retirada anual / margem de lucro.
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-[#577171]">
                          Folha de pagamento anual
                        </Label>
                        <NumericFormat
                          customInput={Input}
                          value={userInput.folhaAnual || ""}
                          thousandSeparator="."
                          decimalSeparator=","
                          decimalScale={2}
                          fixedDecimalScale
                          prefix="R$ "
                          allowNegative={false}
                          placeholder={formatCurrencyCompact(resolveFaturamentoAnual(userInput) * 0.3)}
                          onValueChange={(values) =>
                            setUserInput((prev) => ({
                              ...prev,
                              folhaAnual: values.floatValue || null,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-[#577171]">
                        Margem de lucro ({resolveMargin(userInput).toFixed(0)}%)
                      </Label>
                      <input
                        type="range"
                        min={10}
                        max={50}
                        step={1}
                        value={resolveMargin(userInput)}
                        onChange={(event) =>
                          setUserInput((prev) => ({
                            ...prev,
                            margemLucro: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full accent-[#8b9a46]"
                      />
                      <div className="mt-1 flex justify-between text-xs text-[#6b7280]">
                        <span>Baixa (10%)</span>
                        <span>Media (25%)</span>
                        <span>Alta (40%+)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-[#577171]">Numero de socios</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[1, 2, 3, 4].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setUserInput((prev) => ({
                                  ...prev,
                                  numSocios: option,
                                }))
                              }
                              className={`rounded-md px-3 py-1.5 text-sm border ${
                                userInput.numSocios === option
                                  ? "bg-[#262d3d] text-white border-[#262d3d]"
                                  : "bg-white text-[#374151] border-[#d1d5db]"
                              }`}
                            >
                              {option === 4 ? "4+" : option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-[#577171]">Sua participacao (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={userInput.participacao}
                            onChange={(event) =>
                              setUserInput((prev) => ({
                                ...prev,
                                participacao: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#577171]">Distribuicao de lucro (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={userInput.distribuicaoLucro}
                            onChange={(event) =>
                              setUserInput((prev) => ({
                                ...prev,
                                distribuicaoLucro: Math.max(
                                  0,
                                  Math.min(100, Number(event.target.value) || 0),
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-5">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="refine-jcp"
                          checked={userInput.jaTemJCP}
                          onCheckedChange={(checked) =>
                            setUserInput((prev) => ({
                              ...prev,
                              jaTemJCP: checked === true,
                            }))
                          }
                        />
                        <Label htmlFor="refine-jcp" className="text-sm text-[#374151]">
                          Empresa ja paga JCP
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="refine-holding"
                          checked={userInput.jaTemHolding}
                          onCheckedChange={(checked) =>
                            setUserInput((prev) => ({
                              ...prev,
                              jaTemHolding: checked === true,
                            }))
                          }
                        />
                        <Label htmlFor="refine-holding" className="text-sm text-[#374151]">
                          Ja existe holding no grupo
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-base tracking-wide bg-[#8b9a46] hover:bg-[#6b7a3d] text-white"
                  disabled={loadingCalc}
                >
                  {loadingCalc ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculando seu impacto...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      VER MEU IMPACTO TRIBUTARIO
                    </>
                  )}
                </Button>

                {calcError && <p className="text-sm text-red-600">{calcError}</p>}
              </form>
            </CardContent>
          </Card>
        </section>

        {loadingCalc && (
          <Card className="border-[#d9dfc3] bg-white">
            <CardContent className="py-10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 text-[#8b9a46] animate-spin" />
              <p className="text-[#262d3d] font-medium">Calculando seu impacto...</p>
              <p className="text-sm text-[#577171]">Analisando cenarios A, B e C com sua estrutura atual.</p>
            </CardContent>
          </Card>
        )}

        {showResults && result && (
          <div id="resultados" ref={resultsSectionRef} className="space-y-8">
            <section className="space-y-4">
              <Card className="border-[#efc6c6] bg-white shadow-sm">
                <CardContent className="py-8 text-center space-y-3">
                  <p className="text-base md:text-lg text-[#374151]">Com a nova lei, voce pagara</p>
                  <p className="text-[36px] md:text-[48px] leading-none font-bold text-[#c94c4c]">
                    {formatCurrency(headlineCount)}
                  </p>
                  <p className="text-lg font-medium text-[#374151]">a mais por ano</p>
                  <p className="text-sm text-[#577171]">
                    Isso equivale a {formatCurrency(result.totalTaxDue / 12)} por mes saindo do seu bolso.
                  </p>
                  <p className="text-sm text-[#577171]">
                    Aliquota efetiva sobre dividendos: <strong>{formatPercent(result.impactPercentage)}</strong>
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-[#d1d5db] bg-white animate-slide-in-left">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#262d3d]">Antes (2025)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-[#374151]">
                    <p>Retirada mensal: {formatCurrency(result.totalAnnualDividends / 12)}</p>
                    <p>Imposto sobre dividendos: {formatCurrency(mainMonthlyTaxBefore)}</p>
                    <p>Liquido: {formatCurrency(result.totalAnnualDividends / 12)}</p>
                    <div className="pt-2">
                      <div className="h-2 rounded-full bg-[#e5e7eb]">
                        <div className="h-2 rounded-full bg-[#4caf50] w-full transition-all duration-1000" />
                      </div>
                      <p className="text-xs text-[#6b7280] mt-1">100% no bolso</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#d1d5db] bg-white animate-slide-in-right">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#262d3d]">Depois (2026)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-[#374151]">
                    <p>Retirada mensal: {formatCurrency(result.totalAnnualDividends / 12)}</p>
                    <p>Imposto total: {formatCurrency(mainMonthlyTaxAfter)}</p>
                    <p>Liquido: {formatCurrency(result.netAnnualDividends / 12)}</p>
                    <div className="pt-2">
                      <div className="h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-[#4caf50] transition-all duration-1000"
                          style={{ width: `${netShareAfter}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#6b7280] mt-1">{formatPercent(netShareAfter)} no bolso</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-[#b6d6bc] bg-[#edf8ef]">
                <CardContent className="py-6">
                  {maxPotentialSavings > 0 ? (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-[#2f6b38] font-semibold">
                          Ha espaco para economizar
                        </p>
                        <p className="text-xl md:text-2xl font-bold text-[#2f6b38] mt-1">
                          Ate {formatCurrency(maxPotentialSavings)} por ano
                        </p>
                        <p className="text-sm text-[#35563a] mt-2">
                          Reorganizando sua remuneracao, voce pode reduzir a carga com estrategias legais.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={scrollToStrategies}
                        className="bg-[#2f6b38] hover:bg-[#25552d] text-white"
                      >
                        Ver estrategias
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-[#2f6b38]">
                        Sua estrutura ja esta otimizada para o seu perfil atual.
                      </p>
                      <p className="text-sm text-[#35563a]">
                        Nesta simulacao, os mecanismos de credito e redutor neutralizaram imposto adicional.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section id="estrategias" ref={strategiesSectionRef} className="space-y-4">
              <div>
                <h2 className="text-2xl md:text-3xl text-[#262d3d]">Como pagar menos imposto sobre dividendos</h2>
                <p className="text-sm md:text-base text-[#577171] mt-2">
                  Simulamos as tres estrategias de maior impacto para sua realidade.
                </p>
              </div>
              <Card className="border-[#dce4c0] bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-[#262d3d] flex items-center gap-2">
                    <HandCoins className="h-5 w-5 text-[#8b9a46]" />
                    Estrategia 1: Pro-labore ate R$ 5 mil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-[#374151]">
                  <p>
                    Parte da retirada pode virar pro-labore com tributacao pessoal reduzida, enquanto o volume de
                    dividendos acima de R$ 50 mil diminui.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#e5e7eb] p-3">
                      <p className="font-semibold text-[#262d3d]">Sem pro-labore ajustado</p>
                      <p>Dividendos: {formatCurrency(dividendosSemProlabore)}/mes</p>
                      <p>IRRF estimado: {formatCurrency(irrfSemProlabore)}/mes</p>
                    </div>
                    <div className="rounded-lg border border-[#e5e7eb] p-3 bg-[#f8faf5]">
                      <p className="font-semibold text-[#262d3d]">Com pro-labore de {formatCurrency(proLaboreMensal)}</p>
                      <p>Dividendos: {formatCurrency(dividendosComProlabore)}/mes</p>
                      <p>IRRF estimado: {formatCurrency(irrfComProlabore)}/mes</p>
                      <p>INSS socio estimado: {formatCurrency(inssSocioEstimado)}/mes</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#dce4c0] bg-[#f6f9ec] p-3">
                    <p className="font-semibold text-[#262d3d]">
                      Economia estimada no Cenario B: {formatCurrency(Math.max(0, scenarioB?.annualSavingsVsStatusQuo || 0))}/ano
                    </p>
                    <p className="text-xs text-[#577171] mt-1">
                      Valor consolidado com combinacao de pro-labore, limite de dividendos e JCP.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {(showJcpStrategy || userInput.regimeTributario === "nao_sei") && (
                <Card className="border-[#dce4c0] bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#262d3d] flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-[#8b9a46]" />
                      Estrategia 2: JCP (Juros sobre capital proprio)
                    </CardTitle>
                    <CardDescription>
                      A empresa deduz JCP do lucro, e o socio paga 17,5% de IRRF sobre o valor recebido.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-[#374151]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-[#e5e7eb] p-3">
                        <p className="text-xs text-[#577171]">JCP estimado</p>
                        <p className="font-semibold text-[#262d3d] text-base">{formatCurrency(jcpMonthly)}/mes</p>
                      </div>
                      <div className="rounded-lg border border-[#e5e7eb] p-3">
                        <p className="text-xs text-[#577171]">Economia fiscal na empresa</p>
                        <p className="font-semibold text-[#262d3d] text-base">
                          {formatCurrency(jcpCompanyBenefitMonthly)}/mes
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#e5e7eb] p-3">
                        <p className="text-xs text-[#577171]">IRRF sobre JCP</p>
                        <p className="font-semibold text-[#262d3d] text-base">
                          {formatCurrency(jcpPersonalTaxMonthly)}/mes
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#dce4c0] bg-[#f6f9ec] p-3">
                      <p className="font-semibold text-[#262d3d]">
                        Ganho liquido combinado estimado: {formatCurrency(jcpNetGainMonthly)}/mes
                      </p>
                      <p className="text-xs text-[#577171] mt-1">
                        Aproximadamente {formatCurrency(jcpNetGainMonthly * 12)}/ano no mix atual.
                      </p>
                    </div>

                    {userInput.regimeTributario === "nao_sei" && (
                      <p className="text-xs text-amber-700">
                        Como o regime nao foi confirmado, valide com contador se sua empresa pode operar JCP.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {showHoldingStrategy ? (
                <Card className="border-[#dce4c0] bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#262d3d] flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#8b9a46]" />
                      Estrategia 3: Distribuicao via holding
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-[#374151]">
                    <p>
                      Dividendos entre empresas brasileiras podem ser isentos. A holding recebe e voce controla quando
                      transferir para pessoa fisica.
                    </p>

                    <div className="rounded-lg border border-[#e5e7eb] p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm">
                        <div className="rounded-md bg-[#f3f4f6] px-3 py-2">Empresa operacional</div>
                        <ArrowRight className="h-4 w-4 text-[#8b9a46]" />
                        <div className="rounded-md bg-[#f3f4f6] px-3 py-2">Holding (PJ)</div>
                        <ArrowRight className="h-4 w-4 text-[#8b9a46]" />
                        <div className="rounded-md bg-[#f3f4f6] px-3 py-2">Socio (PF)</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-[#e5e7eb] p-3">
                        <p className="text-xs text-[#577171]">IR sem holding (cenario A)</p>
                        <p className="font-semibold text-[#262d3d] text-base">
                          {formatCurrency(scenarioA?.totalTax || 0)}/ano
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#e5e7eb] p-3">
                        <p className="text-xs text-[#577171]">Com holding + custos estimados</p>
                        <p className="font-semibold text-[#262d3d] text-base">
                          {formatCurrency(scenarioC?.totalTax || 0)}/ano
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#dce4c0] bg-[#f6f9ec] p-3 space-y-1">
                      <p className="font-semibold text-[#262d3d]">
                        Economia liquida estimada: {formatCurrency(Math.max(0, scenarioC?.annualSavingsVsStatusQuo || 0))}/ano
                      </p>
                      <p className="text-xs text-[#577171]">
                        Custo anual da holding: {formatCurrency(scenarioC?.taxBreakdown.custoHolding || 0)}.
                      </p>
                      <p className="text-xs text-[#577171]">
                        Valor potencialmente retido para diferimento: {formatCurrency(holdingDeferredAnnual)}/ano.
                      </p>
                      <p className="text-xs text-[#577171]">
                        Break-even aproximado: {formatCurrencyCompact((scenarioC?.breakEvenMonthlyDividends || 0))}/mes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-[#e5e7eb] bg-white">
                  <CardContent className="py-4">
                    <p className="text-sm text-[#4b5563]">
                      Holding nao compensa no volume atual. O custo fixo anual tende a superar a economia potencial.
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-2xl md:text-3xl text-[#262d3d]">Resumo: quanto voce economiza em cada cenario</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible">
                {result.scenarios.map((scenario) => {
                  const cfg = SCENARIO_CONFIG[scenario.code];
                  const maxTax = Math.max(1, ...result.scenarios.map((item) => item.totalTax));
                  const taxBarWidth = Math.max(8, (scenario.totalTax / maxTax) * 100);
                  const isRecommended = scenario.isBest;

                  const strategyBullets =
                    scenario.code === "A_STATUS_QUO"
                      ? ["Tudo como dividendos"]
                      : scenario.code === "B_MIX_OTIMIZADO"
                        ? [
                            `Pro-labore ${formatCurrency(proLaboreMensal)}`,
                            "Dividendos ate R$ 50 mil",
                            jcpMonthly > 0 ? `JCP ${formatCurrency(jcpMonthly)}` : "JCP conforme capacidade",
                          ]
                        : [
                            "Dividendos via holding",
                            "Retirada mensal controlada",
                            "Diferimento de caixa",
                          ];

                  return (
                    <Card
                      key={scenario.code}
                      className={`min-w-[280px] snap-start ${cfg.baseClass} ${
                        isRecommended ? "border-2 border-[#8b9a46] shadow-md" : "border"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-xl text-[#262d3d]">{cfg.title}</CardTitle>
                            <CardDescription className="text-[#577171]">{cfg.subtitle}</CardDescription>
                          </div>
                          <span className="text-[10px] uppercase tracking-wide rounded-full bg-[#f3f4f6] px-2 py-1 text-[#4b5563]">
                            {isRecommended ? "Recomendado" : cfg.badge}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <ul className="space-y-1 text-[#374151]">
                          {strategyBullets.map((bullet) => (
                            <li key={`${scenario.code}-${bullet}`} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8b9a46]" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>

                        <div>
                          <p className="text-xs text-[#6b7280]">Imposto total</p>
                          <p className="font-semibold text-[#262d3d]">{formatCurrency(scenario.totalTax)}/ano</p>
                          <div className="mt-2 h-2 rounded-full bg-[#ececec]">
                            <div
                              className="h-2 rounded-full bg-[#c94c4c] transition-all duration-700"
                              style={{ width: `${taxBarWidth}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-[#6b7280]">Liquido no bolso</p>
                          <p className="font-semibold text-[#262d3d]">{formatCurrency(scenario.netToPartner)}/ano</p>
                          {scenario.code === "C_HOLDING" && scenario.deferredTaxAnnual > 0 && (
                            <p className="text-xs text-[#577171] mt-1">
                              + {formatCurrency(scenario.deferredTaxAnnual)}/ano em imposto diferido
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-[#6b7280]">Economia vs cenario A</p>
                          <p className="font-semibold text-[#2f6b38]">
                            {formatCurrency(Math.max(0, scenario.annualSavingsVsStatusQuo))}/ano
                          </p>
                        </div>

                        <p className="text-xs text-[#4b5563]">
                          <strong>Ideal para:</strong> {cfg.idealFor}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-[#e5e7eb] bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-[#262d3d]">Comparativo visual de imposto e liquido</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScenarioOutcomeChart scenarios={result.scenarios} />
                </CardContent>
              </Card>

              <Card className="border-[#e5e7eb] bg-white">
                <CardContent className="pt-2">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="detalhe-cenarios" className="border-b-0">
                      <AccordionTrigger className="text-sm font-semibold text-[#262d3d]">
                        Ver detalhamento tributario completo por cenario
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-[#e5e7eb] text-left text-[#577171]">
                                <th className="py-2 pr-4">Linha</th>
                                <th className="py-2 pr-4">Cenario A</th>
                                <th className="py-2 pr-4">Cenario B</th>
                                <th className="py-2">Cenario C</th>
                              </tr>
                            </thead>
                            <tbody>
                              {BREAKDOWN_ROWS.map((row) => (
                                <tr key={row.key} className="border-b border-[#f0f0f0]">
                                  <td className="py-2 pr-4 text-[#4b5563]">{row.label}</td>
                                  <td className="py-2 pr-4 font-medium text-[#262d3d]">
                                    {formatCurrency(scenarioA?.taxBreakdown[row.key] || 0)}
                                  </td>
                                  <td className="py-2 pr-4 font-medium text-[#262d3d]">
                                    {formatCurrency(scenarioB?.taxBreakdown[row.key] || 0)}
                                  </td>
                                  <td className="py-2 font-medium text-[#262d3d]">
                                    {formatCurrency(scenarioC?.taxBreakdown[row.key] || 0)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-[#d1d5db] bg-[#f9fafb]">
                                <td className="py-2 pr-4 font-semibold">TOTAL</td>
                                <td className="py-2 pr-4 font-semibold">{formatCurrency(scenarioA?.totalTax || 0)}</td>
                                <td className="py-2 pr-4 font-semibold">{formatCurrency(scenarioB?.totalTax || 0)}</td>
                                <td className="py-2 font-semibold">{formatCurrency(scenarioC?.totalTax || 0)}</td>
                              </tr>
                              <tr className="bg-[#f9fafb]">
                                <td className="py-2 pr-4 font-semibold">Aliquota efetiva</td>
                                <td className="py-2 pr-4 font-semibold">{formatPercent(scenarioA?.totalTaxRate || 0)}</td>
                                <td className="py-2 pr-4 font-semibold">{formatPercent(scenarioB?.totalTaxRate || 0)}</td>
                                <td className="py-2 font-semibold">{formatPercent(scenarioC?.totalTaxRate || 0)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="border-[#dce4c0] bg-[#f6f9ec]">
                <CardContent className="py-6 space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-[#262d3d]">Quer implementar a melhor estrategia?</p>
                    <p className="text-sm text-[#577171] mt-1">
                      A LDC Capital pode montar o planejamento tributario personalizado e apoiar a implementacao.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
                      className="bg-[#2f6b38] hover:bg-[#25552d] text-white"
                    >
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Agendar conversa
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={scrollToLead}
                      className="border-[#8b9a46] text-[#262d3d]"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Baixar relatorio em PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-[#262d3d]">Pontos de atencao para o seu caso</h2>
              {translatedAlerts.length === 0 ? (
                <Card className="border-[#e5e7eb] bg-white">
                  <CardContent className="py-4 text-sm text-[#4b5563]">
                    Sem alertas criticos para os dados informados.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {translatedAlerts.map((alert) => {
                    const styles =
                      alert.severity === "warning"
                        ? "border-red-200 bg-red-50"
                        : alert.severity === "opportunity"
                          ? "border-amber-200 bg-amber-50"
                          : "border-emerald-200 bg-emerald-50";

                    return (
                      <Card key={alert.code} className={styles}>
                        <CardContent className="py-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {alert.severity === "warning" ? (
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-[#262d3d]">{alert.title}</p>
                              <p className="text-sm text-[#374151]">{alert.description}</p>
                              {alert.action && (
                                <p className="text-sm text-[#4b5563]"><strong>Acao:</strong> {alert.action}</p>
                              )}
                              {alert.estimatedAnnualSavings && alert.estimatedAnnualSavings > 0 && (
                                <p className="text-sm text-[#2f6b38] font-medium">
                                  Economia estimada: {formatCurrency(alert.estimatedAnnualSavings)}/ano
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-[#262d3d]">Seu regime tributario ainda e o melhor?</h2>

              {showRegimeOpportunitySection ? (
                <Card className="border-[#e5e7eb] bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#262d3d]">Comparativo de regimes (empresa + socio)</CardTitle>
                    <CardDescription>
                      Destacamos o menor custo total com base no seu volume de retirada.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RegimeComparisonChart regimes={result.regimeSimulation} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {result.regimeSimulation.map((regime) => {
                        const isCurrent = regime.regime === currentEngineRegime;
                        return (
                          <div
                            key={regime.regime}
                            className={`rounded-lg border p-3 ${
                              regime.isBest ? "border-[#8b9a46] bg-[#f6f9ec]" : "border-[#e5e7eb]"
                            }`}
                          >
                            <p className="font-semibold text-[#262d3d] capitalize">
                              {regime.regime.replace("_", " ")}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {regime.isBest && (
                                <span className="text-[10px] rounded-full bg-[#8b9a46] text-white px-2 py-1">
                                  MENOR CARGA TOTAL
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] rounded-full bg-[#262d3d] text-white px-2 py-1">
                                  REGIME ATUAL
                                </span>
                              )}
                            </div>
                            <p className="text-sm mt-2">Imposto total: {formatCurrency(regime.totalTax)}</p>
                            <p className="text-sm">Carga efetiva: {formatPercent(regime.totalTaxRate)}</p>
                            <p className="text-sm">Tributos da empresa: {formatCurrency(regime.corporateTax)}</p>
                            <p className="text-sm">Tributos do socio: {formatCurrency(regime.personalTax)}</p>
                          </div>
                        );
                      })}
                    </div>

                    {currentRegimeResult && bestRegimeResult && (
                      <p className="text-sm text-[#374151]">
                        Economia potencial ao migrar para {bestRegimeResult.regime.replace("_", " ")}: 
                        <strong>
                          {" "}
                          {formatCurrency(
                            Math.max(0, currentRegimeResult.totalTax - bestRegimeResult.totalTax),
                          )}
                        </strong>
                        /ano.
                      </p>
                    )}

                    <Accordion type="single" collapsible>
                      <AccordionItem value="regime-detalhes" className="border-b-0">
                        <AccordionTrigger className="text-sm font-semibold text-[#262d3d]">
                          Ver detalhamento de cada regime
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b border-[#e5e7eb] text-left text-[#577171]">
                                  <th className="py-2 pr-4">Linha</th>
                                  {result.regimeSimulation.map((regime) => (
                                    <th key={regime.regime} className="py-2 pr-4 capitalize">
                                      {regime.regime.replace("_", " ")}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {BREAKDOWN_ROWS.map((row) => (
                                  <tr key={`regime-${row.key}`} className="border-b border-[#f0f0f0]">
                                    <td className="py-2 pr-4 text-[#4b5563]">{row.label}</td>
                                    {result.regimeSimulation.map((regime) => (
                                      <td key={`${regime.regime}-${row.key}`} className="py-2 pr-4 font-medium text-[#262d3d]">
                                        {formatCurrency(regime.breakdown[row.key])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-[#d1d5db] bg-white">
                  <CardContent className="py-4 text-sm text-[#4b5563]">
                    Seu regime atual ({currentEngineRegime.replace("_", " ")}) ja aparece como competitivo no seu
                    perfil. Sem ganho relevante de migracao nesta simulacao.
                  </CardContent>
                </Card>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-[#262d3d]">Como calculamos o imposto minimo (IRPFM)</h2>

              <Card className="border-[#e5e7eb] bg-white">
                <CardContent className="pt-2">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="irpfm-detalhado" className="border-b-0">
                      <AccordionTrigger className="text-sm font-semibold text-[#262d3d]">
                        Ver calculo detalhado do imposto minimo (IRPFM)
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-5">
                          <div>
                            <p className="text-sm font-semibold text-[#262d3d] mb-2">
                              1) Composicao da renda global
                            </p>
                            <IncomeCompositionChart composition={result.incomeComposition} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg border border-[#e5e7eb] p-3">
                              <p className="text-[#577171]">2) Base IRPFM final</p>
                              <p className="font-semibold text-[#262d3d]">
                                {formatCurrency(result.irpfmSteps.rendaTotalAnual)}
                              </p>
                            </div>

                            <div className="rounded-lg border border-[#e5e7eb] p-3">
                              <p className="text-[#577171]">
                                <ExplainedTerm
                                  term="Aliquota IRPFM"
                                  explanation="Percentual aplicado sobre a renda anual quando ela ultrapassa R$ 600 mil."
                                >
                                  3) Aliquota aplicavel
                                </ExplainedTerm>
                              </p>
                              <p className="font-semibold text-[#262d3d]">
                                {formatPercent(result.irpfmSteps.aliquotaAplicavelPercentual)}
                              </p>
                              <p className="text-xs text-[#6b7280] mt-1">{result.irpfmSteps.formulaAliquota}</p>
                            </div>
                          </div>

                          <div className="rounded-lg border border-[#e5e7eb] p-3 text-sm">
                            <p className="text-[#577171]">4) IRPFM bruto</p>
                            <p className="font-semibold text-[#262d3d]">{formatCurrency(result.irpfmSteps.irpfmBruto)}</p>
                          </div>

                          <div className="rounded-lg border border-[#e5e7eb] p-3 text-sm space-y-1">
                            <p className="font-semibold text-[#262d3d]">5) Deducoes</p>
                            <p>IRPF progressivo: -{formatCurrency(result.irpfmSteps.deducoes.irpfProgressivo)}</p>
                            <p>IRRF dividendos: -{formatCurrency(result.irpfmSteps.deducoes.irrfDividendos)}</p>
                            <p>Outros creditos de IRRF: -{formatCurrency(result.irpfmSteps.deducoes.outrosCreditosIrrf)}</p>
                            <p>Offshore: -{formatCurrency(result.irpfmSteps.deducoes.offshore)}</p>
                            <p>Tributacao definitiva: -{formatCurrency(result.irpfmSteps.deducoes.tributacaoDefinitiva)}</p>
                            <p>Outras deducoes: -{formatCurrency(result.irpfmSteps.deducoes.outrasDeducoes)}</p>
                          </div>

                          <div className="rounded-lg border border-[#e5e7eb] p-3 text-sm space-y-1">
                            <p className="font-semibold text-[#262d3d]">
                              <ExplainedTerm
                                term="Redutor"
                                explanation="Se a empresa ja recolheu carga alta, parte do imposto minimo pode ser abatida para evitar dupla cobranca."
                              >
                                6) Redutor por empresa
                              </ExplainedTerm>
                            </p>
                            {result.redutorBreakdown.length === 0 ? (
                              <p className="text-[#6b7280]">Nenhuma empresa informada para calculo de redutor.</p>
                            ) : (
                              result.redutorBreakdown.map((item) => (
                                <p key={item.companyName}>
                                  {item.companyName}: credito de {formatCurrency(item.creditoRedutor)}
                                </p>
                              ))
                            )}
                          </div>

                          <div className="rounded-lg border border-[#dce4c0] bg-[#f6f9ec] p-3 text-sm">
                            <p className="text-[#577171]">7) IRPFM final devido</p>
                            <p className="font-semibold text-[#262d3d] text-lg">
                              {formatCurrency(result.irpfmSteps.irpfmDevido)}
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </section>
            <section id="relatorio-lead" ref={leadSectionRef} className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-[#262d3d]">Leve este diagnostico com voce</h2>

              <Card className="border-[#e5e7eb] bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-[#262d3d]">Relatorio completo em PDF</CardTitle>
                  <CardDescription>
                    Inclui cenarios, alertas, detalhamento tecnico e recomendacoes para discutir com contador ou socios.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onGenerateReport} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Nome"
                        value={lead.nome}
                        onChange={(event) => setLead((prev) => ({ ...prev, nome: event.target.value }))}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={lead.email}
                        onChange={(event) => setLead((prev) => ({ ...prev, email: event.target.value }))}
                      />
                      <Input
                        placeholder="WhatsApp"
                        value={lead.telefone}
                        onChange={(event) => setLead((prev) => ({ ...prev, telefone: event.target.value }))}
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="lead-consent"
                        checked={lead.consentimento}
                        onCheckedChange={(checked) =>
                          setLead((prev) => ({
                            ...prev,
                            consentimento: checked === true,
                          }))
                        }
                      />
                      <Label htmlFor="lead-consent" className="text-sm text-[#4b5563]">
                        Autorizo a LDC Capital a entrar em contato para aprofundar esta simulacao.
                      </Label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="submit"
                        className="bg-[#262d3d] hover:bg-[#1f2432] text-white"
                        disabled={loadingReport}
                      >
                        {loadingReport ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando relatorio...
                          </>
                        ) : (
                          <>
                            <FileDown className="h-4 w-4 mr-2" />
                            Receber meu relatorio
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#8b9a46] text-[#262d3d]"
                        onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
                      >
                        <PhoneCall className="h-4 w-4 mr-2" />
                        Agendar conversa gratis
                      </Button>
                    </div>

                    {leadMessage && <p className="text-sm text-emerald-700">{leadMessage}</p>}
                    {leadError && <p className="text-sm text-red-600">{leadError}</p>}
                  </form>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border-[#e5e7eb] bg-white">
                <CardContent className="pt-2">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="fontes-detalhe" className="border-b-0">
                      <AccordionTrigger className="text-sm font-semibold text-[#262d3d]">
                        Ver detalhamento por fonte pagadora
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-[#e5e7eb] text-left text-[#577171]">
                                <th className="py-2 pr-3">Fonte</th>
                                <th className="py-2 pr-3">Tipo</th>
                                <th className="py-2 pr-3">Mensal</th>
                                <th className="py-2 pr-3">Meses</th>
                                <th className="py-2 pr-3">Anual</th>
                                <th className="py-2">IRRF anual</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.sourceBreakdown.map((source) => (
                                <tr key={source.id} className="border-b border-[#f0f0f0]">
                                  <td className="py-2 pr-3">{source.name}</td>
                                  <td className="py-2 pr-3">{source.sourceType}</td>
                                  <td className="py-2 pr-3">{formatCurrency(source.monthlyAmount)}</td>
                                  <td className="py-2 pr-3">{source.monthsReceived}</td>
                                  <td className="py-2 pr-3">{formatCurrency(source.annualGrossDividends)}</td>
                                  <td className="py-2">{formatCurrency(source.annualIrrf)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-[#fafaf9] p-4 text-xs text-[#6b7280] leading-relaxed">
              <p>
                Esta simulacao e estimativa e nao substitui consultoria tributaria profissional. Os calculos seguem os
                parametros da Lei 15.270/2025, vigente em marco de 2026.
              </p>
              <p className="mt-2">
                Consulte seu contador ou advogado tributarista antes de tomar decisoes. LDC Capital - Consultoria de
                Investimentos.
              </p>
            </section>
          </div>
        )}

        {!showResults && (
          <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#d1d5db] bg-white/95 backdrop-blur px-4 py-3">
            <Button
              type="button"
              className="w-full h-12 bg-[#8b9a46] hover:bg-[#6b7a3d] text-white"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={loadingCalc}
            >
              {loadingCalc ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                "Ver meu impacto tributario"
              )}
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
