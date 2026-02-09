// Feature flags para migração gradual
// Controladas por variáveis de ambiente (NEXT_PUBLIC_* para client-side)

export const FEATURE_FLAGS = {
  /** Habilita o novo fluxo de Wealth Planning v2 (modo reunião) */
  WEALTH_PLANNING_V2: process.env.NEXT_PUBLIC_WEALTH_PLANNING_V2 === 'true',
  /** Habilita stress tests no Wealth Planning */
  WEALTH_PLANNING_STRESS_TESTS: process.env.NEXT_PUBLIC_WP_STRESS_TESTS !== 'false', // default true na v2
  /** Habilita novo gerador de PDF v2 */
  WEALTH_PLANNING_PDF_V2: process.env.NEXT_PUBLIC_WP_PDF_V2 !== 'false', // default true na v2
  /** Threshold de patrimônio para exibir sucessão (em reais) */
  WEALTH_PLANNING_SUCCESSION_THRESHOLD: Number(process.env.NEXT_PUBLIC_WP_SUCCESSION_THRESHOLD) || 2_000_000,
} as const;
