import { TAX_CONSTANTS } from "@/lib/dividend-tax/tax-constants";

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
  { value: "empresa_brasil", label: "Empresa brasileira (tributavel)" },
  { value: "exterior", label: "Fonte no exterior" },
  { value: "outros", label: "Outras fontes tributaveis" },
  { value: "fii_fiagro", label: "FII/Fiagro (isencao conforme regra)" },
  { value: "titulos_isentos", label: "LCI/LCA/CRI/CRA/Poupanca/FI-Infra" },
] as const;

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
