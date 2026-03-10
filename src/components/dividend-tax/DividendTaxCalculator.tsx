"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackLead } from "@/lib/analytics";
import {
  BUSINESS_ACTIVITY_OPTIONS,
  BUSINESS_REGIME_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  RESIDENCY_OPTIONS,
  SOURCE_TYPE_OPTIONS,
} from "@/lib/dividend-tax/constants";
import type {
  DividendBusinessContextInput,
  DividendSourceInput,
  DividendTaxSimulationInput,
  DividendTaxSimulationResult,
  RedutorCompanyType,
} from "@/lib/dividend-tax/types";
import IncomeCompositionChart from "@/components/dividend-tax/IncomeCompositionChart";
import ScenarioComparisonChart from "@/components/dividend-tax/ScenarioComparisonChart";
import RegimeComparisonChart from "@/components/dividend-tax/RegimeComparisonChart";

type Mode = "simples" | "avancado";

interface LeadFormState {
  nome: string;
  email: string;
  telefone: string;
  consentimento: boolean;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const SCENARIO_BREAKDOWN_LABELS: Record<string, string> = {
  irpj: "IRPJ",
  csll: "CSLL",
  pis: "PIS",
  cofins: "COFINS",
  simplesDAS: "DAS (Simples)",
  inssPatronal: "INSS patronal",
  inssSocio: "INSS socio",
  irrfDividendos: "IRRF dividendos",
  irpfm: "IRPFM",
  irrfJcp: "IRRF JCP",
  beneficioFiscalJcp: "Beneficio fiscal JCP",
  custoHolding: "Custo holding",
};

function formatCurrency(value: number) {
  return currency.format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function toPercent(value: string) {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

function readErrorFallback(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSource(index: number): DividendSourceInput {
  return {
    id: createId("source"),
    name: `Fonte ${index}`,
    monthlyAmount: 0,
    monthsReceived: 12,
    sourceType: "empresa_brasil",
  };
}

function createBusinessDefaults(): DividendBusinessContextInput {
  return {
    regimeTributario: "lucro_presumido",
    atividadePrincipal: "servicos_geral",
    faturamentoAnual: 2_400_000,
    margemLucroPercentual: 35,
    folhaAnual: 300_000,
    numeroSocios: 1,
    participacaoSocioPercentual: 100,
    percentualDistribuicaoLucro: 100,
    jaPagaJcp: false,
    temHolding: false,
  };
}

function normalizePayload(
  mode: Mode,
  input: DividendTaxSimulationInput,
): DividendTaxSimulationInput {
  const normalizedSources = input.sources.map((source, index) => ({
    ...source,
    name: source.name.trim() || `Fonte ${index + 1}`,
    monthsReceived: Math.min(12, Math.max(1, Math.floor(source.monthsReceived))),
    monthlyAmount: Math.max(0, source.monthlyAmount),
  }));

  if (mode === "simples") {
    return {
      ...input,
      sources: normalizedSources,
      annualIncomes: {
        ...input.annualIncomes,
        otherExclusiveAnnualIncome: 0,
        otherExemptAnnualIncome: 0,
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
    };
  }

  return {
    ...input,
    sources: normalizedSources,
    redutorCompanies: input.enableRedutor ? input.redutorCompanies : [],
  };
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message || "Falha na requisicao.";
  } catch {
    return "Falha na requisicao.";
  }
}

export default function DividendTaxCalculator() {
  const [mode, setMode] = useState<Mode>("simples");
  const [input, setInput] = useState<DividendTaxSimulationInput>({
    residency: "residente",
    sources: [createSource(1)],
    annualIncomes: {
      otherTaxableAnnualIncome: 120_000,
      otherExclusiveAnnualIncome: 0,
      otherExemptAnnualIncome: 0,
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
    business: createBusinessDefaults(),
  });

  const [result, setResult] = useState<DividendTaxSimulationResult | null>(null);
  const [lastCalculatedInput, setLastCalculatedInput] =
    useState<DividendTaxSimulationInput | null>(null);
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

  const updateSource = (sourceId: string, patch: Partial<DividendSourceInput>) => {
    setInput((prev) => ({
      ...prev,
      sources: prev.sources.map((source) =>
        source.id === sourceId ? { ...source, ...patch } : source,
      ),
    }));
  };

  const addSource = () => {
    setInput((prev) => ({
      ...prev,
      sources: [...prev.sources, createSource(prev.sources.length + 1)],
    }));
  };

  const removeSource = (sourceId: string) => {
    setInput((prev) => {
      if (prev.sources.length === 1) return prev;
      return {
        ...prev,
        sources: prev.sources.filter((source) => source.id !== sourceId),
      };
    });
  };

  const onCalculate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCalcError(null);
    setLeadError(null);
    setLeadMessage(null);
    setLoadingCalc(true);

    try {
      const payload = normalizePayload(mode, input);
      const response = await fetch("/api/dividend-tax/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as {
        input: DividendTaxSimulationInput;
        result: DividendTaxSimulationResult;
      };

      setResult(data.result);
      setLastCalculatedInput(data.input ?? payload);
    } catch (error) {
      setCalcError(readErrorFallback(error, "Nao foi possivel calcular a simulacao."));
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
    if (!lead.nome || !lead.email || !lead.telefone) {
      setLeadError("Preencha nome, email e telefone.");
      return;
    }
    if (!lead.consentimento) {
      setLeadError("Confirme o consentimento para continuar.");
      return;
    }

    setLoadingReport(true);

    try {
      const leadResponse = await fetch("/api/dividend-tax/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: lead.nome,
          email: lead.email,
          telefone: lead.telefone,
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
          leadName: lead.nome,
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
      setLeadMessage("Relatorio gerado. Lead enviado para a Google Sheets.");
    } catch (error) {
      setLeadError(readErrorFallback(error, "Nao foi possivel gerar o relatorio."));
    } finally {
      setLoadingReport(false);
    }
  };

  const bestScenario = useMemo(
    () => result?.scenarios.find((scenario) => scenario.isBest) ?? null,
    [result],
  );

  return (
    <div className="space-y-6">
      <Card className="border-[#e3e3e3] bg-white">
        <CardHeader>
          <CardTitle className="text-[#262d3d] flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#98ab44]" />
            Simulador Consultivo - Tributacao de Dividendos
          </CardTitle>
          <CardDescription>
            Preencha os dados uma vez e receba: IRPFM passo a passo, comparativo de cenarios A/B/C,
            simulacao por regime e alertas estrategicos.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "simples" ? "default" : "outline"}
              className={mode === "simples" ? "bg-[#98ab44] text-white" : ""}
              onClick={() => setMode("simples")}
            >
              Modo Simples
            </Button>
            <Button
              type="button"
              variant={mode === "avancado" ? "default" : "outline"}
              className={mode === "avancado" ? "bg-[#262d3d] text-white" : ""}
              onClick={() => setMode("avancado")}
            >
              Modo Avancado
            </Button>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={onCalculate} className="space-y-4">
        <Card className="border-[#e3e3e3]">
          <CardHeader>
            <CardTitle className="text-lg text-[#262d3d]">1) Perfil e fontes de dividendos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Residencia fiscal</Label>
                <Select
                  value={input.residency}
                  onValueChange={(value) =>
                    setInput((prev) => ({
                      ...prev,
                      residency: value as DividendTaxSimulationInput["residency"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESIDENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Outras rendas anuais tributaveis</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={input.annualIncomes.otherTaxableAnnualIncome}
                  onChange={(event) =>
                    setInput((prev) => ({
                      ...prev,
                      annualIncomes: {
                        ...prev.annualIncomes,
                        otherTaxableAnnualIncome: toNumber(event.target.value),
                      },
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Regime tributario da empresa</Label>
                <Select
                  value={input.business.regimeTributario}
                  onValueChange={(value) =>
                    setInput((prev) => ({
                      ...prev,
                      business: {
                        ...prev.business,
                        regimeTributario: value as DividendBusinessContextInput["regimeTributario"],
                      },
                    }))
                  }
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_REGIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {input.sources.map((source, index) => (
                <div key={source.id} className="rounded-lg border border-[#e3e3e3] p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[#262d3d]">Fonte {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSource(source.id)}
                      disabled={input.sources.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    <div>
                      <Label>Nome da fonte</Label>
                      <Input
                        value={source.name}
                        onChange={(event) => updateSource(source.id, { name: event.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={source.sourceType}
                        onValueChange={(value) =>
                          updateSource(source.id, {
                            sourceType: value as DividendSourceInput["sourceType"],
                          })
                        }
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Dividendos mensais</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={source.monthlyAmount}
                        onChange={(event) =>
                          updateSource(source.id, { monthlyAmount: toNumber(event.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Meses recebidos</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        step="1"
                        value={source.monthsReceived}
                        onChange={(event) =>
                          updateSource(source.id, {
                            monthsReceived: Math.min(12, Math.max(1, Number(event.target.value) || 1)),
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addSource}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar fonte pagadora
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e3e3e3]">
          <CardHeader>
            <CardTitle className="text-lg text-[#262d3d]">2) Dados empresariais para cenarios</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Atividade principal</Label>
              <Select
                value={input.business.atividadePrincipal}
                onValueChange={(value) =>
                  setInput((prev) => ({
                    ...prev,
                    business: {
                      ...prev.business,
                      atividadePrincipal: value as DividendBusinessContextInput["atividadePrincipal"],
                    },
                  }))
                }
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_ACTIVITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Faturamento anual</Label>
              <Input
                type="number"
                min={0}
                value={input.business.faturamentoAnual}
                onChange={(event) =>
                  setInput((prev) => ({
                    ...prev,
                    business: {
                      ...prev.business,
                      faturamentoAnual: toNumber(event.target.value),
                    },
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Margem de lucro (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={input.business.margemLucroPercentual}
                onChange={(event) =>
                  setInput((prev) => ({
                    ...prev,
                    business: {
                      ...prev.business,
                      margemLucroPercentual: toPercent(event.target.value),
                    },
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Folha anual</Label>
              <Input
                type="number"
                min={0}
                value={input.business.folhaAnual}
                onChange={(event) =>
                  setInput((prev) => ({
                    ...prev,
                    business: {
                      ...prev.business,
                      folhaAnual: toNumber(event.target.value),
                    },
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Numero de socios</Label>
              <Input
                type="number"
                min={1}
                value={input.business.numeroSocios}
                onChange={(event) =>
                  setInput((prev) => ({
                    ...prev,
                    business: {
                      ...prev.business,
                      numeroSocios: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                    },
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Participacao do socio (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={input.business.participacaoSocioPercentual}
                onChange={(event) =>
                  setInput((prev) => ({
                    ...prev,
                    business: {
                      ...prev.business,
                      participacaoSocioPercentual: toPercent(event.target.value),
                    },
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Distribuicao de lucro (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={input.business.percentualDistribuicaoLucro}
                onChange={(event) =>
                  setInput((prev) => ({
                    ...prev,
                    business: {
                      ...prev.business,
                      percentualDistribuicaoLucro: toPercent(event.target.value),
                    },
                  }))
                }
                className="mt-1"
              />
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ja-paga-jcp"
                  checked={input.business.jaPagaJcp}
                  onCheckedChange={(checked) =>
                    setInput((prev) => ({
                      ...prev,
                      business: {
                        ...prev.business,
                        jaPagaJcp: checked === true,
                      },
                    }))
                  }
                />
                <Label htmlFor="ja-paga-jcp">Empresa ja paga JCP</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tem-holding"
                  checked={input.business.temHolding}
                  onCheckedChange={(checked) =>
                    setInput((prev) => ({
                      ...prev,
                      business: {
                        ...prev.business,
                        temHolding: checked === true,
                      },
                    }))
                  }
                />
                <Label htmlFor="tem-holding">Ja existe holding no grupo</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {mode === "avancado" && (
          <Card className="border-[#e3e3e3]">
            <CardHeader>
              <CardTitle className="text-lg text-[#262d3d]">3) Parametros avancados IRPFM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Outras rendas exclusivas</Label>
                  <Input
                    type="number"
                    min={0}
                    value={input.annualIncomes.otherExclusiveAnnualIncome}
                    onChange={(event) =>
                      setInput((prev) => ({
                        ...prev,
                        annualIncomes: {
                          ...prev.annualIncomes,
                          otherExclusiveAnnualIncome: toNumber(event.target.value),
                        },
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Outras rendas isentas</Label>
                  <Input
                    type="number"
                    min={0}
                    value={input.annualIncomes.otherExemptAnnualIncome}
                    onChange={(event) =>
                      setInput((prev) => ({
                        ...prev,
                        annualIncomes: {
                          ...prev.annualIncomes,
                          otherExemptAnnualIncome: toNumber(event.target.value),
                        },
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label title="Valores legalmente excluidos da base do IRPFM, como rendas nao tributaveis por previsao legal.">
                    Exclusoes manuais da base IRPFM
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={input.annualIncomes.excludedFromIrpfmAnnual}
                    onChange={(event) =>
                      setInput((prev) => ({
                        ...prev,
                        annualIncomes: {
                          ...prev.annualIncomes,
                          excludedFromIrpfmAnnual: toNumber(event.target.value),
                        },
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label title="Informe creditos de IRRF adicionais que podem ser compensados no calculo anual.">
                    Outros creditos de IRRF
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={input.deductions.additionalIrrfCredits}
                    onChange={(event) =>
                      setInput((prev) => ({
                        ...prev,
                        deductions: {
                          ...prev.deductions,
                          additionalIrrfCredits: toNumber(event.target.value),
                        },
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label title="Imposto pela tabela progressiva ja recolhido no ano, usado como deducao no IRPFM.">
                    IRPF progressivo ja pago
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={input.deductions.irpfProgressivePaid}
                    onChange={(event) =>
                      setInput((prev) => ({
                        ...prev,
                        deductions: {
                          ...prev.deductions,
                          irpfProgressivePaid: toNumber(event.target.value),
                        },
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Tributos pagos no exterior</Label>
                  <Input
                    type="number"
                    min={0}
                    value={input.deductions.offshorePaid}
                    onChange={(event) =>
                      setInput((prev) => ({
                        ...prev,
                        deductions: {
                          ...prev.deductions,
                          offshorePaid: toNumber(event.target.value),
                        },
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label title="Tributos definitivos ja pagos (ex.: ganho de capital), quando compensaveis.">
                    Tributacao definitiva paga
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={input.deductions.definitivePaid}
                    onChange={(event) =>
                      setInput((prev) => ({
                        ...prev,
                        deductions: {
                          ...prev.deductions,
                          definitivePaid: toNumber(event.target.value),
                        },
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label title="Outras deducoes permitidas pela legislacao e nao contempladas nos campos anteriores.">
                    Outras deducoes manuais
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={input.deductions.manualOtherDeductions}
                    onChange={(event) =>
                      setInput((prev) => ({
                        ...prev,
                        deductions: {
                          ...prev.deductions,
                          manualOtherDeductions: toNumber(event.target.value),
                        },
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <Checkbox
                    id="deducao-irrf-calculado"
                    checked={input.deductions.includeCalculatedIrrfCredit}
                    onCheckedChange={(checked) =>
                      setInput((prev) => ({
                        ...prev,
                        deductions: {
                          ...prev.deductions,
                          includeCalculatedIrrfCredit: checked === true,
                        },
                      }))
                    }
                  />
                  <Label
                    htmlFor="deducao-irrf-calculado"
                    title="Quando ativo, o IRRF mensal calculado entra como credito compensavel no IRPFM anual."
                  >
                    Compensar IRRF calculado
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="enable-redutor"
                    checked={input.enableRedutor}
                    onCheckedChange={(checked) =>
                      setInput((prev) => ({ ...prev, enableRedutor: checked === true }))
                    }
                  />
                  <Label
                    htmlFor="enable-redutor"
                    title="Aplica o mecanismo anti-bitributacao quando a soma da carga PJ + IRPFM ultrapassa o teto legal."
                  >
                    Ativar redutor por empresa
                  </Label>
                </div>

                {input.enableRedutor && (
                  <>
                    {input.redutorCompanies.map((company, index) => (
                      <div key={company.id} className="rounded-lg border border-[#e3e3e3] p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-[#262d3d]">Empresa redutor {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setInput((prev) => ({
                                ...prev,
                                redutorCompanies: prev.redutorCompanies.filter((item) => item.id !== company.id),
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                          <Input
                            value={company.name}
                            onChange={(event) =>
                              setInput((prev) => ({
                                ...prev,
                                redutorCompanies: prev.redutorCompanies.map((item) =>
                                  item.id === company.id ? { ...item, name: event.target.value } : item,
                                ),
                              }))
                            }
                            placeholder="Nome da empresa"
                          />
                          <Select
                            value={company.companyType}
                            onValueChange={(value) =>
                              setInput((prev) => ({
                                ...prev,
                                redutorCompanies: prev.redutorCompanies.map((item) =>
                                  item.id === company.id
                                    ? { ...item, companyType: value as RedutorCompanyType }
                                    : item,
                                ),
                              }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANY_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={company.lucroContabil}
                            onChange={(event) =>
                              setInput((prev) => ({
                                ...prev,
                                redutorCompanies: prev.redutorCompanies.map((item) =>
                                  item.id === company.id
                                    ? { ...item, lucroContabil: toNumber(event.target.value) }
                                    : item,
                                ),
                              }))
                            }
                            placeholder="Lucro contabil"
                          />
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={company.irpjCsllPaid}
                            onChange={(event) =>
                              setInput((prev) => ({
                                ...prev,
                                redutorCompanies: prev.redutorCompanies.map((item) =>
                                  item.id === company.id
                                    ? { ...item, irpjCsllPaid: toNumber(event.target.value) }
                                    : item,
                                ),
                              }))
                            }
                            placeholder="IRPJ + CSLL"
                          />
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={company.dividendsPaidToBeneficiary}
                            onChange={(event) =>
                              setInput((prev) => ({
                                ...prev,
                                redutorCompanies: prev.redutorCompanies.map((item) =>
                                  item.id === company.id
                                    ? {
                                        ...item,
                                        dividendsPaidToBeneficiary: toNumber(event.target.value),
                                      }
                                    : item,
                                ),
                              }))
                            }
                            placeholder="Dividendos ao socio"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setInput((prev) => ({
                          ...prev,
                          redutorCompanies: [
                            ...prev.redutorCompanies,
                            {
                              id: createId("redutor"),
                              name: `Empresa ${prev.redutorCompanies.length + 1}`,
                              companyType: "geral",
                              lucroContabil: 0,
                              irpjCsllPaid: 0,
                              dividendsPaidToBeneficiary: 0,
                            },
                          ],
                        }))
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar empresa redutor
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white"
          disabled={loadingCalc}
        >
          {loadingCalc ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Rodar simulacao completa
            </>
          )}
        </Button>

        {calcError && <p className="text-sm text-red-600">{calcError}</p>}
      </form>

      {result && (
        <>
          <div className="md:hidden sticky bottom-3 z-20">
            <div className="rounded-lg border border-[#98ab44]/50 bg-white/95 backdrop-blur px-3 py-2 shadow-sm">
              <p className="text-xs text-[#577171]">Resumo rapido da simulacao</p>
              <p className="text-sm font-semibold text-[#262d3d]">
                Imposto total: {formatCurrency(result.totalTaxDue)}
              </p>
              {bestScenario && (
                <p className="text-xs text-[#577171]">
                  Melhor cenario: {bestScenario.title}
                </p>
              )}
            </div>
          </div>

          <Card className="border-[#e3e3e3]">
            <CardHeader>
              <CardTitle className="text-[#262d3d]">Resumo executivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-md border border-[#e3e3e3] p-3">
                  <p className="text-xs text-[#577171]">Dividendos anuais</p>
                  <p className="font-semibold text-[#262d3d]">
                    {formatCurrency(result.totalAnnualDividends)}
                  </p>
                </div>
                <div className="rounded-md border border-[#e3e3e3] p-3 bg-[#98ab44]/10">
                  <p className="text-xs text-[#577171]">Imposto total (IRRF + IRPFM)</p>
                  <p className="font-semibold text-[#262d3d]">{formatCurrency(result.totalTaxDue)}</p>
                </div>
                <div className="rounded-md border border-[#e3e3e3] p-3">
                  <p className="text-xs text-[#577171]">Liquido anual</p>
                  <p className="font-semibold text-[#262d3d]">
                    {formatCurrency(result.netAnnualDividends)}
                  </p>
                </div>
                <div className="rounded-md border border-[#e3e3e3] p-3">
                  <p className="text-xs text-[#577171]">Impacto</p>
                  <p className="font-semibold text-[#262d3d]">{formatPercent(result.impactPercentage)}</p>
                </div>
              </div>

              {bestScenario && (
                <div className="rounded-md border border-[#98ab44]/40 bg-[#98ab44]/10 p-3">
                  <p className="text-sm font-semibold text-[#262d3d] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#98ab44]" />
                    Cenario recomendado: {bestScenario.title}
                  </p>
                  <p className="text-sm text-[#262d3d] mt-1">
                    Economia estimada vs status quo: {formatCurrency(Math.max(0, bestScenario.annualSavingsVsStatusQuo))}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e3e3e3]">
            <CardHeader>
              <CardTitle className="text-[#262d3d]">Composicao da renda global (IRPFM)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <IncomeCompositionChart composition={result.incomeComposition} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p className="rounded-md border border-[#e3e3e3] p-2">
                  Renda global bruta: <strong>{formatCurrency(result.incomeComposition.rendaGlobalBruta)}</strong>
                </p>
                <p className="rounded-md border border-[#e3e3e3] p-2">
                  Base IRPFM final: <strong>{formatCurrency(result.incomeComposition.baseIrpfmAnual)}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e3e3e3]">
            <CardHeader>
              <CardTitle className="text-[#262d3d]">Calculo do IRPFM - passo a passo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Sua renda total anual (base IRPFM): <strong>{formatCurrency(result.irpfmSteps.rendaTotalAnual)}</strong></p>
              <p>Aliquota aplicavel: <strong>{formatPercent(result.irpfmSteps.aliquotaAplicavelPercentual)}</strong></p>
              <p className="text-[#577171]">{result.irpfmSteps.formulaAliquota}</p>
              <p>IRPFM bruto: <strong>{formatCurrency(result.irpfmSteps.irpfmBruto)}</strong></p>
              <div className="rounded-md border border-[#e3e3e3] p-3 space-y-1">
                <p>Deducoes:</p>
                <p>IRPF progressivo: -{formatCurrency(result.irpfmSteps.deducoes.irpfProgressivo)}</p>
                <p>IRRF dividendos: -{formatCurrency(result.irpfmSteps.deducoes.irrfDividendos)}</p>
                <p>Outros creditos de IRRF: -{formatCurrency(result.irpfmSteps.deducoes.outrosCreditosIrrf)}</p>
                <p>Offshore: -{formatCurrency(result.irpfmSteps.deducoes.offshore)}</p>
                <p>Tributacao definitiva: -{formatCurrency(result.irpfmSteps.deducoes.tributacaoDefinitiva)}</p>
                <p>Outras deducoes: -{formatCurrency(result.irpfmSteps.deducoes.outrasDeducoes)}</p>
                <p>Redutor: -{formatCurrency(result.irpfmSteps.deducoes.redutorTotal)}</p>
              </div>
              <p className="text-base font-semibold">
                IRPFM adicional devido: {formatCurrency(result.irpfmSteps.irpfmDevido)}
              </p>
              {result.irpfmDue === 0 && result.irpfmGross > 0 && (
                <p className="text-[#98ab44] font-medium">
                  O mecanismo redutor/compensacoes zerou o IRPFM adicional nesta simulacao.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e3e3e3]">
            <CardHeader>
              <CardTitle className="text-[#262d3d]">Comparativo de cenarios (A vs B vs C)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScenarioComparisonChart scenarios={result.scenarios} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {result.scenarios.map((scenario) => (
                  <div
                    key={scenario.code}
                    className={`rounded-md border p-3 ${
                      scenario.isBest ? "border-[#98ab44] bg-[#98ab44]/10" : "border-[#e3e3e3]"
                    }`}
                  >
                    <p className="font-semibold text-[#262d3d]">{scenario.title}</p>
                    {scenario.isBest && (
                      <p className="text-xs text-[#98ab44] font-semibold">MAIS ECONOMICO</p>
                    )}
                    <p className="text-sm mt-1">Carga total: {formatCurrency(scenario.totalTax)}</p>
                    <p className="text-sm">Aliquota total: {formatPercent(scenario.totalTaxRate)}</p>
                    <p className="text-sm">Liquido ao socio: {formatCurrency(scenario.netToPartner)}</p>
                    <p className="text-sm">Economia vs A: {formatCurrency(scenario.annualSavingsVsStatusQuo)}</p>
                  </div>
                ))}
              </div>

              <details className="rounded-md border border-[#e3e3e3] p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#262d3d]">
                  Ver detalhamento tributario completo por cenario
                </summary>
                <div className="mt-3 space-y-4">
                  {result.scenarios.map((scenario) => (
                    <div key={`detail-${scenario.code}`} className="rounded-md border border-[#f0f0f0] p-3">
                      <p className="text-sm font-semibold text-[#262d3d] mb-2">{scenario.title}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {Object.entries(scenario.taxBreakdown).map(([key, value]) => (
                          <p key={`${scenario.code}-${key}`} className="flex justify-between gap-2">
                            <span className="text-[#577171]">
                              {SCENARIO_BREAKDOWN_LABELS[key] ?? key}
                            </span>
                            <strong className="text-[#262d3d]">{formatCurrency(value)}</strong>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </CardContent>
          </Card>

          <Card className="border-[#e3e3e3]">
            <CardHeader>
              <CardTitle className="text-[#262d3d]">Simulador de regime (Simples vs LP vs LR)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RegimeComparisonChart regimes={result.regimeSimulation} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {result.regimeSimulation.map((regime) => (
                  <div
                    key={regime.regime}
                    className={`rounded-md border p-3 ${
                      regime.isBest ? "border-[#98ab44] bg-[#98ab44]/10" : "border-[#e3e3e3]"
                    }`}
                  >
                    <p className="font-semibold text-[#262d3d] capitalize">{regime.regime.replace("_", " ")}</p>
                    {regime.isBest && <p className="text-xs text-[#98ab44] font-semibold">MENOR CARGA TOTAL</p>}
                    <p className="text-sm mt-1">Carga total: {formatCurrency(regime.totalTax)}</p>
                    <p className="text-sm">Aliquota total: {formatPercent(regime.totalTaxRate)}</p>
                    <p className="text-sm">Tributo PJ: {formatCurrency(regime.corporateTax)}</p>
                    <p className="text-sm">Tributo PF: {formatCurrency(regime.personalTax)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e3e3e3]">
            <CardHeader>
              <CardTitle className="text-[#262d3d]">Alertas e insights contextuais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.alerts.map((alert) => (
                <div
                  key={alert.code}
                  className={`rounded-md border p-3 ${
                    alert.severity === "warning"
                      ? "border-red-200 bg-red-50"
                      : alert.severity === "opportunity"
                        ? "border-amber-200 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <p className="font-semibold flex items-center gap-2">
                    {alert.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {alert.title}
                  </p>
                  <p className="text-sm mt-1">{alert.description}</p>
                  {alert.suggestedAction && <p className="text-sm mt-1"><strong>Acao:</strong> {alert.suggestedAction}</p>}
                  {alert.estimatedAnnualSavings && (
                    <p className="text-sm mt-1">
                      <strong>Economia estimada:</strong> {formatCurrency(alert.estimatedAnnualSavings)}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#e3e3e3]">
            <CardHeader>
              <CardTitle className="text-[#262d3d]">Detalhamento por fonte</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e3e3e3] text-left text-[#577171]">
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
            </CardContent>
          </Card>

          <Card className="border-[#e3e3e3]">
            <CardHeader>
              <CardTitle className="text-[#262d3d] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#98ab44]" />
                Relatorio PDF personalizado (captura de lead)
              </CardTitle>
              <CardDescription>
                Esta simulacao e estimativa e nao substitui consultoria tributaria profissional.
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
                    placeholder="Telefone"
                    value={lead.telefone}
                    onChange={(event) => setLead((prev) => ({ ...prev, telefone: event.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="consentimento-lead"
                    checked={lead.consentimento}
                    onCheckedChange={(checked) =>
                      setLead((prev) => ({ ...prev, consentimento: checked === true }))
                    }
                  />
                  <Label htmlFor="consentimento-lead">
                    Autorizo contato da LDC Capital para retorno desta simulacao.
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="bg-[#262d3d] hover:bg-[#262d3d]/90 text-white"
                  disabled={loadingReport}
                >
                  {loadingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando relatorio...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Salvar lead e baixar relatorio
                    </>
                  )}
                </Button>

                {leadMessage && <p className="text-sm text-emerald-700">{leadMessage}</p>}
                {leadError && <p className="text-sm text-red-600">{leadError}</p>}
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
