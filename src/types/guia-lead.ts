export type PatrimonioRange = 'menos_100k' | '100k_300k' | '300k_500k' | 'acima_500k';

export interface GuiaLead {
  id?: string;
  created_at?: string;
  nome: string;
  whatsapp: string;
  email: string;
  patrimonio_range: PatrimonioRange;
  qualificado: boolean;
  origem: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface GuiaFormData {
  nome: string;
  whatsapp: string;
  email: string;
  patrimonio_range: PatrimonioRange;
}

export interface GuiaFormState {
  success: boolean;
  message: string;
  nomeConfirmado?: string;
  emailConfirmado?: string;
  errors?: {
    nome?: string[];
    whatsapp?: string[];
    email?: string[];
    patrimonio_range?: string[];
  };
}

export const PATRIMONIO_OPTIONS = [
  { value: 'menos_100k', label: 'Menos de R$100 mil' },
  { value: '100k_300k', label: 'Entre R$100k e R$300k' },
  { value: '300k_500k', label: 'Entre R$300k e R$500k' },
  { value: 'acima_500k', label: 'Acima de R$500k' },
] as const;
