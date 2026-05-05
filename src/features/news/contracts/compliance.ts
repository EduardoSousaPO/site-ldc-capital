import { z } from "zod";

export const ComplianceViolationType = z.enum([
  "ticker_br",
  "ticker_us",
  "phrase_prescriptive",
  "promise_return",
  "bloomberg_as_source",
  "bloomberg_in_body",
]);
export type ComplianceViolationType = z.infer<typeof ComplianceViolationType>;

export const ComplianceViolationField = z.enum([
  "body",
  "fontes_url",
  "fontes_dominio",
  "fontes_title",
  "title",
  "por_que_importa",
  "entre_as_linhas",
  "o_que_fica_de_olho",
  "numeros",
]);
export type ComplianceViolationField = z.infer<typeof ComplianceViolationField>;

export const ComplianceViolation = z.object({
  type: ComplianceViolationType,
  match: z.string().min(1),
  field: ComplianceViolationField,
  line_number: z.number().int().min(0),
  severity: z.literal("hard_block"),
  message: z.string(),
});
export type ComplianceViolation = z.infer<typeof ComplianceViolation>;

export const ComplianceCheckResult = z.object({
  passed: z.boolean(),
  violations: z.array(ComplianceViolation),
  checked_at: z.string().datetime(),
});
export type ComplianceCheckResult = z.infer<typeof ComplianceCheckResult>;
