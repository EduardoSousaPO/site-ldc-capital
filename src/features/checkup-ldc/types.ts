// Checkup-LDC Types

export type CheckupStatus = 'draft' | 'preview' | 'paid' | 'done';

export type HoldingType = 
  | 'Ação BR'
  | 'ETF BR'
  | 'FII'
  | 'Exterior'
  | 'Fundo'
  | 'Previdência'
  | 'RF Pós'
  | 'RF IPCA'
  | 'Caixa'
  | 'Outros';

export type ObjetivoPrincipal = 
  | 'aposentadoria'
  | 'renda'
  | 'crescimento'
  | 'preservação';

export type ToleranciaRisco = 'baixa' | 'média' | 'alta';

export interface RawHolding {
  nome_ou_codigo: string;
  valor?: number;
  quantidade?: number;
  preco?: number;
  tipo?: string;
}

export interface Holding {
  id?: string;
  nome_raw: string;
  ticker_norm?: string;
  tipo: HoldingType;
  valor: number;
  moeda: string;
  liquidez_bucket?: string;
  custo_bucket?: string;
  risco_bucket?: string;
}

export interface UserProfile {
  objetivo_principal: ObjetivoPrincipal;
  prazo_anos: number;
  tolerancia_risco: ToleranciaRisco;
  idade_faixa?: string;
}

export interface PolicyProfile {
  id: string;
  name: string;
  config: {
    target_exterior_min: number;
    max_fundos_caixa_preta: number;
    min_liquidity_high: number;
    penalidade_complexidade: 'baixa' | 'media' | 'alta';
    penalidade_custo_alto: 'baixa' | 'media' | 'alta';
    tilt_defensivo_equities: 'leve' | 'moderado' | 'forte';
    penalidades: {
      HIGH_CONCENTRATION_TOP5: number;
      LOW_GLOBAL_DIVERSIFICATION: number;
      HIGH_COMPLEXITY_FUNDS: number;
      LOW_LIQUIDITY_BUCKET: number;
      RISK_MISMATCH_OBJECTIVE: number;
    };
  };
}

export interface Analytics {
  allocation_by_class: Record<string, number>;
  br_vs_exterior: {
    br: number;
    exterior: number;
  };
  top_holdings: Array<{
    nome: string;
    percentual: number;
    tipo: HoldingType;
  }>;
  concentration_top5: number;
  concentration_top10: number;
  complexity_score: number;
  liquidity_score: number;
  flags: string[];
  subscores?: {
    global_diversification: number; // 0-100
    concentration: number;
    liquidity: number;
    complexity: number;
    cost_efficiency: number;
  };
  what_if?: Array<{
    label: string;
    score_before: number;
    score_after: number;
    note: string;
  }>;
}

export type WhatIfAdjustmentType = 
  | 'ADD_EXTERIOR_10'
  | 'REDUCE_TOP5_TO_45'
  | 'INCREASE_LIQUIDITY_TO_60';

export interface WhatIfSimulation {
  label: string;
  score_before: number;
  score_after: number;
  note: string;
  adjustment_type: WhatIfAdjustmentType;
}

export interface DiagnosisReport {
  headline: string;
  summary: string;
  risks: Array<{
    title: string;
    detail: string;
    severity: 'low' | 'med' | 'high';
  }>;
  improvements: Array<{
    title: string;
    detail: string;
    impact: 'low' | 'med' | 'high';
  }>;
  action_plan_7_days: string[];
  transparency_notes: string[];
}

export interface Checkup {
  id: string;
  created_at: string;
  status: CheckupStatus;
  objetivo_principal?: ObjetivoPrincipal;
  prazo_anos?: number;
  tolerancia_risco?: ToleranciaRisco;
  idade_faixa?: string;
  policy_profile_id?: string;
  score_total?: number;
  analytics_json?: Analytics;
  report_json?: DiagnosisReport;
  pdf_url?: string;
}

