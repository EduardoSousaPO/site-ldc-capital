import { z } from "zod";

export const dividendSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Informe o nome da fonte pagadora"),
  monthlyAmount: z.number().min(0, "Valor mensal nao pode ser negativo"),
  monthsReceived: z.number().int().min(1).max(12),
  sourceType: z.enum([
    "empresa_brasil",
    "exterior",
    "outros",
    "fii_fiagro",
    "titulos_isentos",
  ]),
});

export const dividendAnnualIncomesSchema = z.object({
  otherTaxableAnnualIncome: z.number().min(0),
  otherExclusiveAnnualIncome: z.number().min(0),
  otherExemptAnnualIncome: z.number().min(0),
  excludedFromIrpfmAnnual: z.number().min(0),
});

export const dividendDeductionsSchema = z.object({
  includeCalculatedIrrfCredit: z.boolean(),
  additionalIrrfCredits: z.number().min(0),
  irpfProgressivePaid: z.number().min(0),
  offshorePaid: z.number().min(0),
  definitivePaid: z.number().min(0),
  manualOtherDeductions: z.number().min(0),
});

export const dividendRedutorCompanySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Informe o nome da empresa"),
  companyType: z.enum(["geral", "financeira", "banco"]),
  lucroContabil: z.number().min(0),
  irpjCsllPaid: z.number().min(0),
  dividendsPaidToBeneficiary: z.number().min(0),
});

export const dividendBusinessContextSchema = z.object({
  regimeTributario: z.enum(["simples", "lucro_presumido", "lucro_real"]),
  atividadePrincipal: z.enum([
    "comercio",
    "industria",
    "servicos_geral",
    "servicos_regulamentado",
    "transporte_carga",
    "transporte_passageiros",
  ]),
  faturamentoAnual: z.number().min(0),
  margemLucroPercentual: z.number().min(0).max(100),
  folhaAnual: z.number().min(0),
  numeroSocios: z.number().int().min(1),
  participacaoSocioPercentual: z.number().min(0).max(100),
  percentualDistribuicaoLucro: z.number().min(0).max(100),
  jaPagaJcp: z.boolean(),
  temHolding: z.boolean(),
});

export const dividendTaxSimulationInputSchema = z.object({
  residency: z.enum(["residente", "nao_residente", "pj"]),
  sources: z.array(dividendSourceSchema).min(1, "Adicione pelo menos uma fonte pagadora"),
  annualIncomes: dividendAnnualIncomesSchema,
  deductions: dividendDeductionsSchema,
  enableRedutor: z.boolean(),
  redutorCompanies: z.array(dividendRedutorCompanySchema),
  business: dividendBusinessContextSchema,
});

export const dividendTaxLeadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  telefone: z.string().min(8, "Telefone invalido"),
  consentimento: z.literal(true, "Consentimento obrigatorio"),
  simulationSummary: z.object({
    totalAnnualDividends: z.number().min(0),
    totalTaxDue: z.number().min(0),
    netAnnualDividends: z.number().min(0),
    impactPercentage: z.number().min(0),
  }),
});

export type DividendTaxSimulationInputDto = z.infer<
  typeof dividendTaxSimulationInputSchema
>;

export type DividendTaxLeadDto = z.infer<typeof dividendTaxLeadSchema>;
