import { z } from "zod";
import { TAX_CONSTANTS } from "@/lib/dividend-tax/tax-constants";

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
  clubeInvestimento: z
    .object({
    enabled: z.boolean(),
    portfolioValue: z.number().min(0),
    annualDeferredDistributions: z.number().min(0),
    participantsCount: z.number().int().min(1).max(50),
    stockAllocationPercent: z.number().min(0).max(100),
    brokerageFeePercent: z.number().min(0).max(100),
    annualGrowthPercent: z.number().min(0).max(100),
  })
    .superRefine((clube, ctx) => {
      if (!clube.enabled) return;

      if (clube.portfolioValue < TAX_CONSTANTS.CLUBE_VALOR_MINIMO) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Patrimonio minimo do clube: R$ ${TAX_CONSTANTS.CLUBE_VALOR_MINIMO.toLocaleString("pt-BR")}.`,
          path: ["portfolioValue"],
        });
      }

      if (
        clube.brokerageFeePercent < TAX_CONSTANTS.CLUBE_TAXA_MIN_PERCENTUAL ||
        clube.brokerageFeePercent > TAX_CONSTANTS.CLUBE_TAXA_MAX_PERCENTUAL
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Taxa anual deve ficar entre ${TAX_CONSTANTS.CLUBE_TAXA_MIN_PERCENTUAL}% e ${TAX_CONSTANTS.CLUBE_TAXA_MAX_PERCENTUAL}%.`,
          path: ["brokerageFeePercent"],
        });
      }

      if (clube.participantsCount < TAX_CONSTANTS.CLUBE_MIN_COTISTAS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Numero minimo de cotistas: ${TAX_CONSTANTS.CLUBE_MIN_COTISTAS}.`,
          path: ["participantsCount"],
        });
      }
    }),
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
