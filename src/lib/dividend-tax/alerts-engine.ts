import { ALERT_THRESHOLDS, TAX_CONSTANTS } from "@/lib/dividend-tax/tax-constants";
import type {
  DividendTaxAlert,
  DividendTaxSimulationInput,
  DividendTaxSimulationResult,
} from "@/lib/dividend-tax/types";

function createAlert(alert: DividendTaxAlert): DividendTaxAlert {
  return alert;
}

export function generateDividendTaxAlerts(
  input: DividendTaxSimulationInput,
  result: DividendTaxSimulationResult,
): DividendTaxAlert[] {
  const alerts: DividendTaxAlert[] = [];

  const taxableSources = result.sourceBreakdown.filter(
    (source) =>
      source.sourceType === "empresa_brasil" ||
      source.sourceType === "exterior" ||
      source.sourceType === "outros",
  );

  const totalMonthlyDividends = input.sources.reduce(
    (acc, source) => acc + source.monthlyAmount,
    0,
  );

  const sourceAboveThreshold = taxableSources.find(
    (source) => source.monthlyAmount > TAX_CONSTANTS.IRRF_LIMIAR_MENSAL,
  );

  if (sourceAboveThreshold && input.residency === "residente") {
    const excess = sourceAboveThreshold.monthlyAmount - TAX_CONSTANTS.IRRF_LIMIAR_MENSAL;
    alerts.push(
      createAlert({
        code: "efeito_degrau",
        severity: "warning",
        title: "Efeito Degrau Ativado",
        description:
          `A fonte ${sourceAboveThreshold.name} ultrapassa R$ 50 mil/mensais. ` +
          "O IRRF de 10% incide sobre o total mensal da fonte pagadora.",
        suggestedAction:
          "Avalie limitar a distribuicao mensal por fonte em R$ 50 mil para reduzir IRRF imediato.",
        estimatedAnnualSavings: Math.max(0, excess * TAX_CONSTANTS.IRRF_ALIQUOTA * 12),
      }),
    );
  }

  const hasFiiSource = input.sources.some((source) => source.sourceType === "fii_fiagro");
  if (hasFiiSource) {
    alerts.push(
      createAlert({
        code: "fii_excluido_irpfm",
        severity: "success",
        title: "FIIs/Fiagros fora da base do IRPFM",
        description:
          "Os rendimentos classificados como FII/Fiagro estao sendo excluidos da base anual do IRPFM.",
      }),
    );
  }

  if (
    result.irpfmBaseAnnual > ALERT_THRESHOLDS.IRPFM_NEAR_THRESHOLD_MIN &&
    result.irpfmBaseAnnual <= TAX_CONSTANTS.IRPFM_LIMIAR_INFERIOR
  ) {
    alerts.push(
      createAlert({
        code: "proximo_limiar_irpfm",
        severity: "opportunity",
        title: "Proximo do limiar do IRPFM",
        description:
          `Sua base anual esta em ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(result.irpfmBaseAnnual)}. Pequenos ajustes de timing podem evitar gatilho do IRPFM.`,
      }),
    );
  }

  if (result.irpfmDue === 0 && result.irpfmGross > 0 && result.redutorTotal > 0) {
    alerts.push(
      createAlert({
        code: "redutor_zerou_irpfm",
        severity: "success",
        title: "Redutor zerou o IRPFM",
        description:
          "A combinacao de creditos e redutor absorveu o imposto minimo. Nao ha IRPFM adicional nesta simulacao.",
      }),
    );
  }

  if (totalMonthlyDividends > TAX_CONSTANTS.IRRF_LIMIAR_MENSAL && !input.business.jaPagaJcp) {
    alerts.push(
      createAlert({
        code: "oportunidade_pro_labore",
        severity: "opportunity",
        title: "Oportunidade de mix com pro-labore e JCP",
        description:
          "Com dividendos elevados, pode haver ganho ao combinar pro-labore isento, dividendos limitados e JCP.",
        suggestedAction:
          "Compare o cenario B para quantificar economia anual e impacto de INSS/JCP.",
      }),
    );
  }

  if (
    input.business.regimeTributario === "lucro_presumido" &&
    result.totalAnnualDividends > TAX_CONSTANTS.IRPFM_LIMIAR_INFERIOR
  ) {
    alerts.push(
      createAlert({
        code: "lp_impacto_irpfm",
        severity: "warning",
        title: "Impacto relevante no Lucro Presumido",
        description:
          "No Lucro Presumido, a carga PJ tende a ser menor que o teto do redutor, aumentando risco de IRPFM residual.",
        suggestedAction: "Avalie comparacao com Lucro Real para medir carga total PJ+PF.",
      }),
    );
  }

  const hasDilutionSources = taxableSources.some(
    (source) =>
      source.monthlyAmount > ALERT_THRESHOLDS.DILUTION_MIN &&
      source.monthlyAmount <= ALERT_THRESHOLDS.DILUTION_MAX,
  );
  if (input.sources.length > 1 && hasDilutionSources) {
    alerts.push(
      createAlert({
        code: "diluicao_fontes",
        severity: "success",
        title: "Dilucao eficiente por fonte",
        description:
          "Distribuir por mais de uma empresa pagadora pode reduzir ativacao do IRRF mensal por limiar.",
      }),
    );
  }

  if (input.residency === "nao_residente") {
    alerts.push(
      createAlert({
        code: "nao_residente_irrf",
        severity: "warning",
        title: "Nao residente: IRRF sem limiar",
        description:
          "Para nao residentes, o IRRF de 10% sobre dividendos incide em qualquer valor de fonte tributavel.",
      }),
    );
  }

  if (input.business.regimeTributario === "simples") {
    alerts.push(
      createAlert({
        code: "simples_inseguranca_juridica",
        severity: "warning",
        title: "Simples Nacional com risco juridico",
        description:
          "A aplicacao plena da nova regra para o Simples ainda e discutida judicialmente em ADIs no STF.",
        suggestedAction: "Valide o enquadramento juridico com assessoria tributaria antes da decisao.",
      }),
    );
  }

  if (
    totalMonthlyDividends > ALERT_THRESHOLDS.HOLDING_SUGGESTION_DIVIDENDS_MONTHLY &&
    !input.business.temHolding
  ) {
    const breakEven = Math.round(
      TAX_CONSTANTS.HOLDING_CUSTO_MENSAL_ESTIMADO /
        TAX_CONSTANTS.HOLDING_BREAK_EVEN_IRRF_ALIQUOTA,
    );
    alerts.push(
      createAlert({
        code: "oportunidade_holding",
        severity: "opportunity",
        title: "Considere estrutura via holding",
        description:
          "Dividendos PJ->PJ sao isentos e podem permitir diferimento da tributacao na PF.",
        suggestedAction: `Com custo mensal estimado de R$ ${TAX_CONSTANTS.HOLDING_CUSTO_MENSAL_ESTIMADO}, break-even aproximado em R$ ${breakEven}/mes.`,
      }),
    );
  }

  return alerts;
}
