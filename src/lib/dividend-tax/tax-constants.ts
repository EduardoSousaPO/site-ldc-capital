export const TAX_CONSTANTS = {
  // IRRF sobre dividendos
  IRRF_ALIQUOTA: 0.1,
  IRRF_LIMIAR_MENSAL: 50_000,
  IRRF_EFEITO_DEGRAU: true,

  // IRPFM
  IRPFM_LIMIAR_INFERIOR: 600_000,
  IRPFM_LIMIAR_SUPERIOR: 1_200_000,
  IRPFM_ALIQUOTA_MAXIMA: 0.1,

  // JCP
  JCP_IRRF: 0.175,

  // IRPJ
  IRPJ_BASE: 0.15,
  IRPJ_ADICIONAL: 0.1,
  IRPJ_ADICIONAL_LIMIAR_ANUAL: 240_000,

  // CSLL
  CSLL_GERAL: 0.09,
  CSLL_SEGURADORAS: 0.15,
  CSLL_BANCOS: 0.2,

  // Tetos do redutor
  REDUTOR_TETO_GERAL: 0.34,
  REDUTOR_TETO_SEGURADORAS: 0.4,
  REDUTOR_TETO_BANCOS: 0.45,

  // Lucro Presumido - presuncao IRPJ
  LP_PRESUNCAO: {
    comercio: 0.08,
    industria: 0.08,
    servicos_geral: 0.32,
    servicos_regulamentado: 0.32,
    transporte_carga: 0.08,
    transporte_passageiros: 0.16,
  },

  // Lucro Presumido - presuncao CSLL
  LP_PRESUNCAO_CSLL: {
    geral: 0.12,
    servicos: 0.32,
  },

  // PIS/COFINS
  PIS_CUMULATIVO: 0.0065,
  COFINS_CUMULATIVO: 0.03,
  PIS_NAO_CUMULATIVO: 0.0165,
  COFINS_NAO_CUMULATIVO: 0.076,

  // Simples (aliquotas efetivas simplificadas para simulacao)
  SIMPLES_ALIQUOTAS_ESTIMADAS: {
    comercio: 0.06,
    industria: 0.08,
    servicos_geral: 0.15,
    servicos_regulamentado: 0.16,
    transporte_carga: 0.12,
    transporte_passageiros: 0.16,
  },

  // INSS
  INSS_PATRONAL: 0.2,
  INSS_EMPREGADO_ALIQUOTA: 0.11,
  INSS_TETO_2026: 908.85,

  // IRPF mensal de referencia 2026
  IRPF_FAIXAS: [
    { ate: 5_000, aliquota: 0, deducao: 0 },
    { ate: 7_500, aliquota: 0.075, deducao: 375 },
    { ate: 10_000, aliquota: 0.15, deducao: 937.5 },
    { ate: 15_000, aliquota: 0.225, deducao: 1_687.5 },
    { ate: 25_000, aliquota: 0.275, deducao: 2_437.5 },
    { ate: Number.POSITIVE_INFINITY, aliquota: 0.335, deducao: 3_937.5 },
  ],

  // Holding
  HOLDING_CUSTO_MENSAL_ESTIMADO: 1_500,
  HOLDING_BREAK_EVEN_IRRF_ALIQUOTA: 0.1,
} as const;

export const ALERT_THRESHOLDS = {
  IRPFM_NEAR_THRESHOLD_MIN: 500_000,
  DILUTION_MIN: 40_000,
  DILUTION_MAX: 50_000,
  HOLDING_SUGGESTION_DIVIDENDS_MONTHLY: 100_000,
} as const;
