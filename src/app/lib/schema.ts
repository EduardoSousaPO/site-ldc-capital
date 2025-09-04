import { z } from "zod";

// Schema para formulário de lead
export const leadFormSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato de telefone inválido"),
  email: z.string().email("Email inválido"),
  patrimonio: z.enum([
    "ate-100k",
    "100k-500k", 
    "500k-1m",
    "1m-5m",
    "acima-5m"
  ]),
  origem: z.enum([
    "youtube",
    "google", 
    "instagram",
    "indicacao",
    "linkedin",
    "outros"
  ]),
  consentimento: z.boolean().refine(val => val === true, "Consentimento obrigatório")
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

// Schema para contato de material
export const materialContactSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  material: z.string().min(1, "Material deve ser especificado"),
  consentimento: z.boolean().refine(val => val === true, "Consentimento obrigatório")
});

export type MaterialContactData = z.infer<typeof materialContactSchema>;

// Utilitários para formatação
export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export const patrimonioOptions = [
  { value: "ate-100k", label: "Até R$ 100.000" },
  { value: "100k-500k", label: "R$ 100.000 - R$ 500.000" },
  { value: "500k-1m", label: "R$ 500.000 - R$ 1.000.000" },
  { value: "1m-5m", label: "R$ 1.000.000 - R$ 5.000.000" },
  { value: "acima-5m", label: "Acima de R$ 5.000.000" }
];

export const origemOptions = [
  { value: "youtube", label: "YouTube" },
  { value: "google", label: "Google" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "indicacao", label: "Indicação" },
  { value: "outros", label: "Outros" }
];
