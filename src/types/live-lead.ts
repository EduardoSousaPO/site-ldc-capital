// Tipos para a landing page da Live Eleições 2026

export interface LiveLeadFormData {
  nome: string;
  email: string;
  telefone: string;
}

export interface LiveLeadFormState {
  success: boolean;
  message: string;
  redirectUrl?: string;
  errors?: {
    nome?: string[];
    email?: string[];
    telefone?: string[];
  };
}

export const LIVE_CAMPAIGN = {
  source: 'live-eleicoes-2026',
  campaign: 'live-eleicoes-2026',
  page: '/live',
  landingPageId: 'live-eleicoes-2026',
  youtubeUrl: 'https://youtube.com/live/wmCpvjNxnwA',
  channelName: 'Luciano Herzog',
  channelShort: 'Luciano Herzog',
  date: '06/05',
  time: '19:00',
} as const;
