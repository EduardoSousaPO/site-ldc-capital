import { TAX_CONSTANTS } from "@/lib/dividend-tax/tax-constants";
import type { DividendSourceType } from "@/lib/dividend-tax/types";

export const DIVIDEND_TAX_CONSTANTS = {
  irrfThresholdMonthlyPerSource: TAX_CONSTANTS.IRRF_LIMIAR_MENSAL,
  irrfRate: TAX_CONSTANTS.IRRF_ALIQUOTA,
  irpfmExemptionAnnual: TAX_CONSTANTS.IRPFM_LIMIAR_INFERIOR,
  irpfmMaxBracketAnnual: TAX_CONSTANTS.IRPFM_LIMIAR_SUPERIOR,
  irpfmMaxRate: TAX_CONSTANTS.IRPFM_ALIQUOTA_MAXIMA,
} as const;

export const REDUTOR_TETO_BY_COMPANY_TYPE = {
  geral: TAX_CONSTANTS.REDUTOR_TETO_GERAL,
  financeira: TAX_CONSTANTS.REDUTOR_TETO_SEGURADORAS,
  banco: TAX_CONSTANTS.REDUTOR_TETO_BANCOS,
} as const;

export const SOURCE_TYPE_OPTIONS = [
  {
    value: "empresa_brasil",
    label: "Dividendos de empresa brasileira (regra R$ 50 mil)",
  },
  {
    value: "acoes_dividendos",
    label: "Dividendos de acoes brasileiras (regra R$ 50 mil)",
  },
  { value: "exterior", label: "Fonte no exterior" },
  { value: "outros", label: "Outras fontes tributaveis" },
  {
    value: "cdb_rdb_tesouro_titulos",
    label: "CDB/RDB/Tesouro e titulos de RF tributaveis",
  },
  { value: "debentures_comuns", label: "Debentures comuns (tributaveis)" },
  { value: "fundos_etfs_tributaveis", label: "Fundos/ETFs tributaveis" },
  {
    value: "debentures_incentivadas_fi_infra",
    label: "Debenture incentivada / FI-Infra (isencao legal)",
  },
  { value: "fii_fiagro", label: "FII/Fiagro (isencao conforme regra)" },
  { value: "titulos_isentos", label: "LCI/LCA/CRI/CRA/Poupanca (isentos)" },
] as const;

export interface SourceTaxTreatment {
  monthlyDividendRule: boolean;
  includeInIrpfmBase: boolean;
  excludedByLaw: boolean;
  legalBasis: string;
}

export const SOURCE_TAX_TREATMENT: Record<DividendSourceType, SourceTaxTreatment> = {
  empresa_brasil: {
    monthlyDividendRule: true,
    includeInIrpfmBase: true,
    excludedByLaw: false,
    legalBasis: "Lei 15.270/2025: regra de IRRF mensal de dividendos + composicao da base anual.",
  },
  acoes_dividendos: {
    monthlyDividendRule: true,
    includeInIrpfmBase: true,
    excludedByLaw: false,
    legalBasis: "Dividendos distribuidos por PJ entram na regra mensal e na base anual.",
  },
  exterior: {
    monthlyDividendRule: true,
    includeInIrpfmBase: true,
    excludedByLaw: false,
    legalBasis: "Rendimentos tributaveis no exterior entram na composicao da base anual.",
  },
  outros: {
    monthlyDividendRule: true,
    includeInIrpfmBase: true,
    excludedByLaw: false,
    legalBasis: "Categoria residual para dividendos/rendimentos tributaveis de mesma natureza.",
  },
  cdb_rdb_tesouro_titulos: {
    monthlyDividendRule: false,
    includeInIrpfmBase: true,
    excludedByLaw: false,
    legalBasis:
      "Rendimentos tributados exclusivamente na fonte entram na base anual (nao estao na lista de exclusoes).",
  },
  debentures_comuns: {
    monthlyDividendRule: false,
    includeInIrpfmBase: true,
    excludedByLaw: false,
    legalBasis:
      "Debentures comuns seguem tributacao regular e entram na base anual, salvo regime especial de isencao.",
  },
  fundos_etfs_tributaveis: {
    monthlyDividendRule: false,
    includeInIrpfmBase: true,
    excludedByLaw: false,
    legalBasis:
      "Fundos/ETFs tributaveis entram na base anual quando nao enquadrados nas exclusoes legais.",
  },
  debentures_incentivadas_fi_infra: {
    monthlyDividendRule: false,
    includeInIrpfmBase: false,
    excludedByLaw: true,
    legalBasis:
      "Art. 16-A, §1o, V da Lei 15.270/2025: instrumentos incentivados (infraestrutura) sao excluidos.",
  },
  fii_fiagro: {
    monthlyDividendRule: false,
    includeInIrpfmBase: false,
    excludedByLaw: true,
    legalBasis:
      "Art. 16-A, §1o, V da Lei 15.270/2025: rendimentos isentos de FII/Fiagro (com requisitos) sao excluidos.",
  },
  titulos_isentos: {
    monthlyDividendRule: false,
    includeInIrpfmBase: false,
    excludedByLaw: true,
    legalBasis:
      "Art. 16-A, §1o, V da Lei 15.270/2025: LCI/LCA/CRI/CRA e poupanca sao excluidos da base.",
  },
};

export function getSourceTaxTreatment(sourceType: DividendSourceType): SourceTaxTreatment {
  return SOURCE_TAX_TREATMENT[sourceType];
}

export function getSourceTypeLabel(sourceType: string): string {
  return SOURCE_TYPE_OPTIONS.find((o) => o.value === sourceType)?.label ?? sourceType;
}

export const RESIDENCY_OPTIONS = [
  { value: "residente", label: "Pessoa fisica residente" },
  { value: "nao_residente", label: "Pessoa fisica nao residente" },
  { value: "pj", label: "Pessoa juridica (holding/PJ beneficiaria)" },
] as const;

export const COMPANY_TYPE_OPTIONS = [
  { value: "geral", label: "Empresa em geral (teto 34%)" },
  { value: "financeira", label: "Financeira/seguradora (teto 40%)" },
  { value: "banco", label: "Banco (teto 45%)" },
] as const;

export const BUSINESS_REGIME_OPTIONS = [
  { value: "simples", label: "Simples Nacional" },
  { value: "lucro_presumido", label: "Lucro Presumido" },
  { value: "lucro_real", label: "Lucro Real" },
] as const;

export const BUSINESS_ACTIVITY_OPTIONS = [
  { value: "comercio", label: "Comercio" },
  { value: "industria", label: "Industria" },
  { value: "servicos_geral", label: "Servicos em geral" },
  { value: "servicos_regulamentado", label: "Profissao regulamentada" },
  { value: "transporte_carga", label: "Transporte de carga" },
  { value: "transporte_passageiros", label: "Transporte de passageiros" },
] as const;
