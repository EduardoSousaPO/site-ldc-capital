import { z } from "zod";

// Schema para Dependent
const DependentSchema = z.object({
  name: z.string().min(1, "Nome do dependente é obrigatório"),
  age: z.number().int().min(0).max(150, "Idade inválida"),
  observations: z.string().optional(),
});

// Schema para PersonalData
export const PersonalDataSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    age: z.number().int().min(0).max(150, "Idade inválida"),
    dependents: z.array(DependentSchema).default([]),
    retirementAge: z.number().int().min(0).max(150),
    lifeExpectancy: z.number().int().min(0).max(150),
    maritalStatus: z.enum([
      "Solteiro",
      "Casado",
      "Divorciado",
      "União Estável",
      "Viúvo",
    ]),
    profession: z.string().optional(),
    suitability: z.enum([
      "Conservador",
      "Moderado",
      "Moderado-Agressivo",
      "Agressivo",
    ]),
  })
  .refine((data) => data.age < data.retirementAge, {
    message: "Idade deve ser menor que idade de aposentadoria",
    path: ["retirementAge"],
  })
  .refine((data) => data.retirementAge < data.lifeExpectancy, {
    message: "Idade de aposentadoria deve ser menor que expectativa de vida",
    path: ["lifeExpectancy"],
  });

// Schema para FinancialData
export const FinancialDataSchema = z.object({
  monthlyFamilyExpense: z.number().min(0, "Despesa não pode ser negativa"),
  desiredMonthlyRetirementIncome: z
    .number()
    .min(0, "Renda desejada não pode ser negativa"),
  monthlySavings: z.number().min(0, "Poupança não pode ser negativa"),
  expectedMonthlyRetirementRevenues: z
    .number()
    .min(0, "Receitas previstas não podem ser negativas"),
  investmentObjective: z.enum([
    "Preservar capital",
    "Acumular Recursos",
    "Especular",
  ]),
});

// Schema para PortfolioAsset
const PortfolioAssetSchema = z.object({
  name: z.string().min(1, "Nome do ativo é obrigatório"),
  value: z.number().min(0, "Valor não pode ser negativo"),
  percentage: z.number().min(0).max(100),
  cdiRate: z.number().min(0).max(10, "Taxa CDI inválida"),
});

// Schema para Portfolio
export const PortfolioSchema = z
  .object({
    assets: z
      .array(PortfolioAssetSchema)
      .min(1, "Adicione pelo menos um ativo à carteira"),
    total: z.number().min(0),
    taxConsideration: z.enum(["Sem considerar I.R", "Considerando I.R"]),
    immediateLiquidityNeeds: z
      .number()
      .min(0)
      .max(100, "Percentual de liquidez deve estar entre 0 e 100"),
  })
  .refine(
    (data) => {
      const total = data.assets.reduce((sum, asset) => sum + asset.value, 0);
      return Math.abs(total - data.total) < 0.01; // Tolerância para erros de ponto flutuante
    },
    {
      message: "Total da carteira não corresponde à soma dos ativos",
      path: ["total"],
    }
  );

// Schema para Asset
const AssetSchema = z.object({
  name: z.string().min(1, "Nome do bem é obrigatório"),
  value: z.number().min(0, "Valor não pode ser negativo"),
  sellable: z.boolean(),
  rentalIncome: z.number().min(0).optional(),
});

// Schema para Assets
export const AssetsSchema = z.object({
  items: z.array(AssetSchema).default([]),
  total: z.number().min(0),
});

// Schema para Project
const ProjectSchema = z.object({
  type: z.enum(["Pessoal", "Familiar"]),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  amount: z.number().min(0, "Montante não pode ser negativo"),
  deadline: z.number().int().min(0, "Prazo não pode ser negativo"),
});

// Schema para Projects
export const ProjectsSchema = z.object({
  items: z.array(ProjectSchema).default([]),
});

// Schema para Debt
const DebtSchema = z.object({
  description: z.string().min(1, "Descrição da dívida é obrigatória"),
  balance: z.number().min(0, "Saldo devedor não pode ser negativo"),
  term: z.number().int().min(0, "Prazo não pode ser negativo"),
  hasLifeInsurance: z.boolean(),
});

// Schema para Debts
export const DebtsSchema = z.object({
  items: z.array(DebtSchema).default([]),
  total: z.number().min(0),
});

// Schema para OtherRevenue
const OtherRevenueSchema = z.object({
  source: z.string().min(1, "Fonte da receita é obrigatória"),
  value: z.number().min(0, "Valor não pode ser negativo"),
  observations: z.string().optional(),
});

// Schema para OtherRevenues
export const OtherRevenuesSchema = z.object({
  items: z.array(OtherRevenueSchema).default([]),
  total: z.number().min(0),
});

// Schema para MacroeconomicAssumptions
export const AssumptionsSchema = z.object({
  annualInflation: z
    .number()
    .min(0)
    .max(50, "Inflação anual deve estar entre 0 e 50%"),
  annualCDI: z
    .number()
    .min(0)
    .max(50, "CDI anual deve estar entre 0 e 50%"),
  retirementReturnNominal: z
    .number()
    .min(0)
    .max(50, "Rentabilidade deve estar entre 0 e 50%"),
  retirementRealRate: z
    .number()
    .min(-10)
    .max(50, "Taxa real deve estar entre -10 e 50%"),
});

// Schema completo para ScenarioData
export const ScenarioDataSchema = z.object({
  personalData: PersonalDataSchema,
  financialData: FinancialDataSchema,
  portfolio: PortfolioSchema,
  assets: AssetsSchema,
  projects: ProjectsSchema,
  debts: DebtsSchema,
  otherRevenues: OtherRevenuesSchema,
  assumptions: AssumptionsSchema,
});

// Schema para criar um cenário
export const CreateScenarioSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  clientId: z.string().uuid("ID do cliente inválido"),
  data: ScenarioDataSchema,
});

// Schema para atualizar um cenário
export const UpdateScenarioSchema = z.object({
  title: z.string().min(1).optional(),
  data: ScenarioDataSchema.partial().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

// Função auxiliar para validar dados
export function validateScenarioData(data: unknown) {
  return ScenarioDataSchema.parse(data);
}

export function validateCreateScenario(data: unknown) {
  return CreateScenarioSchema.parse(data);
}

export function validateUpdateScenario(data: unknown) {
  return UpdateScenarioSchema.parse(data);
}

// Função para obter mensagens de erro amigáveis
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.issues.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });
  return errors;
}

