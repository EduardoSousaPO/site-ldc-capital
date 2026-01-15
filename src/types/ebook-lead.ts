// Tipos para a landing page de e-book de investimentos internacionais

export interface EbookLead {
  id?: string;
  created_at?: string;
  nome: string;
  email: string;
  telefone: string;
  valor_investimento: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  landing_page?: string;
  ip_address?: string | null;
  user_agent?: string | null;
  status?: LeadStatus;
  email_sent?: boolean;
  email_sent_at?: string | null;
  whatsapp_sent_at?: string | null;
  whatsapp_confirmed_at?: string | null;
}

export interface LeadFormData {
  nome: string;
  email: string;
  telefone: string;
  valor_investimento: string;
}

export interface LeadFormState {
  success: boolean;
  message: string;
  whatsappUrl?: string;
  errors?: {
    nome?: string[];
    email?: string[];
    telefone?: string[];
    valor_investimento?: string[];
  };
}

// Status do lead no fluxo WhatsApp
export type LeadStatus = 
  | 'pending_whatsapp'    // Formulário preenchido, aguardando WhatsApp
  | 'whatsapp_initiated'  // Lead enviou mensagem no WhatsApp
  | 'email_confirmed'     // IA confirmou o e-mail
  | 'ebook_sent'          // E-book enviado
  | 'qualifying'          // Em qualificação
  | 'qualified'           // Qualificado
  | 'not_qualified'       // Não qualificado
  | 'converted';          // Virou cliente

export const VALORES_INVESTIMENTO = [
  { value: 'R$0 a R$300 mil', label: 'R$ 0 a R$ 300 mil' },
  { value: 'R$300 mil a R$1 milhão', label: 'R$ 300 mil a R$ 1 milhão' },
  { value: 'R$1 milhão a R$5 milhões', label: 'R$ 1 milhão a R$ 5 milhões' },
  { value: 'R$5 milhões a R$10 milhões', label: 'R$ 5 milhões a R$ 10 milhões' },
  { value: 'R$10 milhões a R$30 milhões', label: 'R$ 10 milhões a R$ 30 milhões' },
  { value: 'Acima de R$30 milhões', label: 'Acima de R$ 30 milhões' },
] as const;
