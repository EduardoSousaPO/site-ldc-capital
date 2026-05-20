// UTM capture helper — persiste atribuição de campanhas (YouTube, etc.)
// no localStorage para sobreviver a recarregamentos/navegação interna.

const STORAGE_KEY = "ldc_utm_attribution_v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export type UtmAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
};

type StoredAttribution = UtmAttribution & { captured_at: number };

function sanitize(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, 255);
  return trimmed.length > 0 ? trimmed : undefined;
}

function safeRead(): StoredAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    if (!parsed?.captured_at || Date.now() - parsed.captured_at > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function safeWrite(data: StoredAttribution): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota cheia / modo privado restrito — descarta silenciosamente.
  }
}

/**
 * Lê UTMs da URL atual. Se existirem, sobrescreve o storage com a atribuição
 * mais recente (last-click). Caso não existam, preserva o que já estava salvo.
 * Sempre atualiza `landing_page` e `referrer` na primeira captura por sessão.
 */
export function captureUtmFromUrl(): UtmAttribution {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const fresh: UtmAttribution = {};
  let hasFreshUtm = false;

  for (const key of UTM_KEYS) {
    const value = sanitize(params.get(key));
    if (value) {
      fresh[key] = value;
      hasFreshUtm = true;
    }
  }

  if (hasFreshUtm) {
    fresh.landing_page = sanitize(window.location.pathname + window.location.search);
    fresh.referrer = sanitize(document.referrer);
    safeWrite({ ...fresh, captured_at: Date.now() });
    return fresh;
  }

  const stored = safeRead();
  if (stored) {
    return stripTimestamp(stored);
  }

  return {};
}

/**
 * Retorna UTMs salvos (sem efeito colateral). Útil no submit do form.
 */
export function getStoredUtm(): UtmAttribution {
  const stored = safeRead();
  if (!stored) return {};
  return stripTimestamp(stored);
}

function stripTimestamp(stored: StoredAttribution): UtmAttribution {
  const {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    landing_page,
    referrer,
  } = stored;
  return { utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page, referrer };
}
