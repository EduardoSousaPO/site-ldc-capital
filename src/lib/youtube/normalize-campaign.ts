// Normaliza o input livre de utm_campaign para um slug canônico:
// lowercase, sem acento, espaços/underscores → hífen, remove chars inválidos,
// colapsa hífens repetidos e apara hífens nas pontas.
//
// NÃO bloqueia valores fora da lista oficial — apenas normaliza. A checagem
// de "slug oficial" é separada (isOfficialSlug) e serve só para aviso visual.
//
// Pure function — coberta por testes (CA-002).

/** Os 6 slugs oficiais aprovados (docs/analytics-ga4-utm.md §1). */
export const OFFICIAL_CAMPAIGN_SLUGS = [
  "holding-patrimonial",
  "commodities-ativos",
  "politica-macro-br",
  "geopolitica-global",
  "etfs-portfolio",
  "renda-fixa-credito",
] as const;

export type OfficialCampaignSlug = (typeof OFFICIAL_CAMPAIGN_SLUGS)[number];

/**
 * Converte texto livre em slug canônico de campanha.
 * Ex.: "Política Macro BR" → "politica-macro-br".
 */
export function normalizeCampaignSlug(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .normalize("NFD") // separa diacríticos
    .replace(/[̀-ͯ]/g, "") // remove marcas de acento combinantes
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-") // espaços e underscores → hífen
    .replace(/[^a-z0-9-]/g, "") // descarta o que não for alfanumérico ou hífen
    .replace(/-+/g, "-") // colapsa hífens repetidos
    .replace(/^-+|-+$/g, ""); // apara hífens nas pontas
}

/** True se o slug (já normalizado ou não) está entre os 6 oficiais. */
export function isOfficialSlug(slug: string | null | undefined): slug is OfficialCampaignSlug {
  const normalized = normalizeCampaignSlug(slug);
  return (OFFICIAL_CAMPAIGN_SLUGS as readonly string[]).includes(normalized);
}
