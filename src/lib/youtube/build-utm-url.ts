// Monta a URL UTM canônica para colar na descrição do vídeo.
// Formato (docs/analytics-ga4-utm.md §1):
//   <base>?utm_source=youtube&utm_medium=video&utm_campaign=<slug>
//          &utm_content=<videoId>[&utm_term=<descricao>]
//
// Pure function — coberta por testes (CA-003).

import { normalizeCampaignSlug } from "./normalize-campaign";

/** Landing page padrão das campanhas de YouTube. */
export const DEFAULT_UTM_BASE = "https://www.ldccapital.com.br/diagnostico-gratuito";

export interface BuildUtmUrlInput {
  /** videoId já extraído (11 chars). Vai em utm_content. */
  videoId: string;
  /** Campanha — será normalizada (lowercase/hífen/sem acento). */
  campaign: string;
  /** Descrição opcional → utm_term. */
  term?: string | null;
  /** Landing page. Default: /diagnostico-gratuito. */
  base?: string;
  /** Default: youtube. */
  source?: string;
  /** Default: video. */
  medium?: string;
}

/**
 * Gera a URL UTM completa. Os parâmetros são ordenados de forma estável
 * (source, medium, campaign, content, term) e codificados via URLSearchParams.
 */
export function buildUtmUrl(input: BuildUtmUrlInput): string {
  const {
    videoId,
    campaign,
    term,
    base = DEFAULT_UTM_BASE,
    source = "youtube",
    medium = "video",
  } = input;

  const url = new URL(base);
  // Ordem estável e previsível dos UTMs.
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", normalizeCampaignSlug(campaign));
  url.searchParams.set("utm_content", videoId);

  const cleanTerm = term?.trim();
  if (cleanTerm) {
    url.searchParams.set("utm_term", cleanTerm);
  }

  return url.toString();
}
