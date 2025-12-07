// Checkup-LDC Constants

export const HOLDING_TYPES: Array<{ value: string; label: string }> = [
  { value: 'Ação BR', label: 'Ação BR' },
  { value: 'ETF BR', label: 'ETF BR' },
  { value: 'FII', label: 'FII' },
  { value: 'Exterior', label: 'Exterior' },
  { value: 'Fundo', label: 'Fundo' },
  { value: 'Previdência', label: 'Previdência' },
  { value: 'RF Pós', label: 'RF Pós' },
  { value: 'RF IPCA', label: 'RF IPCA' },
  { value: 'Caixa', label: 'Caixa' },
  { value: 'Outros', label: 'Outros' },
];

export const OBJETIVOS: Array<{ value: string; label: string }> = [
  { value: 'aposentadoria', label: 'Aposentadoria' },
  { value: 'renda', label: 'Renda' },
  { value: 'crescimento', label: 'Crescimento' },
  { value: 'preservação', label: 'Preservação' },
];

export const TOLERANCIAS_RISCO: Array<{ value: string; label: string }> = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'média', label: 'Média' },
  { value: 'alta', label: 'Alta' },
];

export const IDADE_FAIXAS: Array<{ value: string; label: string }> = [
  { value: '18-29', label: '18-29 anos' },
  { value: '30-39', label: '30-39 anos' },
  { value: '40-49', label: '40-49 anos' },
  { value: '50+', label: '50+ anos' },
];

export const PROMPT_VERSION = 'checkup_v1_20241206';

