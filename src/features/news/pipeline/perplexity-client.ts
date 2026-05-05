/**
 * Cliente tipado para Perplexity Sonar Pro.
 *
 * Cobre RF-006, CA-011, CA-012, CB-001 — fontes públicas citáveis para
 * cada tema candidato, com defesa em profundidade contra Bloomberg
 * (Anti-SPEC §6.2b / RNF-008 / ADR-003):
 *
 *   1. `PerplexityQuery.parse()` valida search_domain_filter SEM Bloomberg
 *      (refine Zod no contrato).
 *   2. `search_domain_filter` na request HTTP é exatamente
 *      `PERPLEXITY_DOMAIN_FILTER` (constante exportada de F-002), sem
 *      bloomberg.com em nenhuma variante.
 *   3. Resposta é parseada e cada citation é re-validada — qualquer URL
 *      com /bloomberg/i é descartada (post-filter, defense in depth).
 *   4. `has_public_coverage` = `citations.length > 0` após o post-filter,
 *      consumido pelo orchestrator para descartar temas Bloomberg-only.
 *
 * Timeout 15s + 1 retry (CB-001). Anti-SPEC §6.3: NÃO logar conteúdo
 * Bloomberg nem chave da API; logs de erro são genéricos.
 */

import {
  PerplexityQuery,
  PerplexityResponse,
  type PerplexityCitation,
} from "@/features/news/contracts/perplexity";
import {
  PERPLEXITY_DOMAIN_FILTER,
  PERPLEXITY_MODEL,
  PERPLEXITY_TIMEOUT_MS,
} from "@/features/news/constants/perplexity-domains";

const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

interface PerplexityApiCitation {
  url?: string;
  title?: string;
}

interface PerplexityApiChoice {
  message?: { content?: string };
}

interface PerplexityApiResponse {
  choices?: PerplexityApiChoice[];
  citations?: Array<string | PerplexityApiCitation>;
  search_results?: PerplexityApiCitation[];
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function rejectBloombergUrl(url: string): boolean {
  return /bloomberg/i.test(url);
}

function parseCitations(
  raw: PerplexityApiResponse,
): PerplexityCitation[] {
  const out: PerplexityCitation[] = [];
  const seen = new Set<string>();

  const candidates: Array<{ url: string; title?: string }> = [];

  // Ordem importa: search_results vem PRIMEIRO porque traz title; citations
  // (lista de strings) é fallback para URLs que ficaram fora de search_results.
  if (Array.isArray(raw.search_results)) {
    for (const r of raw.search_results) {
      if (r && typeof r.url === "string") {
        candidates.push({ url: r.url, title: r.title });
      }
    }
  }
  if (Array.isArray(raw.citations)) {
    for (const c of raw.citations) {
      if (typeof c === "string") candidates.push({ url: c });
      else if (c && typeof c === "object" && typeof c.url === "string") {
        candidates.push({ url: c.url, title: c.title });
      }
    }
  }

  for (const c of candidates) {
    if (!c.url || seen.has(c.url)) continue;
    if (rejectBloombergUrl(c.url)) continue;
    const dominio = extractDomain(c.url);
    if (!dominio || rejectBloombergUrl(dominio)) continue;
    seen.add(c.url);
    out.push({
      url: c.url,
      title: c.title,
      dominio,
    });
  }
  return out;
}

async function postJson(
  body: Record<string, unknown>,
  apiKey: string,
  timeoutMs: number,
): Promise<PerplexityApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(PERPLEXITY_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(
        `Perplexity HTTP ${res.status}: ${errBody.slice(0, 200) || "(empty body)"}`,
      );
    }
    return (await res.json()) as PerplexityApiResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface QueryPerplexityOptions {
  /** Override de timeout em ms (default: 15s, ver CB-001). */
  timeoutMs?: number;
  /** Override de retry count (default: 1). */
  retryAttempts?: number;
  /** Função fetch alternativa para testes. */
  httpClient?: (
    body: Record<string, unknown>,
    apiKey: string,
    timeoutMs: number,
  ) => Promise<PerplexityApiResponse>;
}

/**
 * Executa uma query Perplexity Sonar Pro com filtro de domínios e timeout.
 * Retorna `PerplexityResponse` validado por Zod, com citations Bloomberg
 * removidas (defense in depth). `has_public_coverage` é true sse há ≥1
 * citation pública após o post-filter.
 *
 * Lança em:
 *   - input inválido (Zod parse de PerplexityQuery)
 *   - PERPLEXITY_API_KEY ausente
 *   - timeout / falha HTTP nas duas tentativas
 */
export async function queryPerplexity(
  query: PerplexityQuery,
  options: QueryPerplexityOptions = {},
): Promise<PerplexityResponse> {
  PerplexityQuery.parse(query);

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("PERPLEXITY_API_KEY ausente — pipeline news abortado.");
  }

  const timeoutMs = options.timeoutMs ?? PERPLEXITY_TIMEOUT_MS;
  const maxAttempts = (options.retryAttempts ?? 1) + 1;
  const httpClient = options.httpClient ?? postJson;

  const body = {
    model: PERPLEXITY_MODEL,
    messages: [{ role: "user", content: query.query }],
    search_recency_filter: query.search_recency_filter,
    search_domain_filter: query.search_domain_filter,
    return_citations: query.return_citations,
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await httpClient(body, apiKey, timeoutMs);
      const content = raw.choices?.[0]?.message?.content ?? "";
      const citations = parseCitations(raw);

      return PerplexityResponse.parse({
        query: query.query,
        tema_categoria: query.tema_categoria,
        content,
        citations,
        has_public_coverage: citations.length > 0,
      });
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }
  throw new Error(
    `Perplexity falhou após ${maxAttempts} tentativas: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

export const PERPLEXITY_DOMAIN_FILTER_RUNTIME = PERPLEXITY_DOMAIN_FILTER;
