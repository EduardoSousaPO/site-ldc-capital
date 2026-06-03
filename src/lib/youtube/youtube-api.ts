// Integração com a YouTube Data API v3 (server-only).
// Endpoint: GET /youtube/v3/videos?part=snippet,statistics,contentDetails&id&key
//
// Princípios:
// - fetch nativo (sem axios — ADR/Anti-SPEC).
// - Zod relaxado no parse + leitura defensiva (a API pode omitir campos).
// - Degradação graciosa: sem YOUTUBE_API_KEY → { ok:false, reason:'no_api_key' }.
// - Retry 1x com backoff em 5xx/rede. 403→quota, 404→not_found.
// - NUNCA logar a API key.

import { z } from "zod";
import type { YouTubeFetchResult, YouTubeVideoStats } from "./types";

const API_URL = "https://www.googleapis.com/youtube/v3/videos";

// Schema RELAXADO — só o que precisamos, tudo opcional (a API varia).
const youtubeItemSchema = z.object({
  snippet: z
    .object({
      title: z.string().optional(),
      channelTitle: z.string().optional(),
      publishedAt: z.string().optional(),
      thumbnails: z.record(z.string(), z.object({ url: z.string() }).partial()).optional(),
    })
    .optional(),
  statistics: z
    .object({
      viewCount: z.string().optional(),
      likeCount: z.string().optional(),
      commentCount: z.string().optional(),
    })
    .optional(),
  contentDetails: z.object({ duration: z.string().optional() }).optional(),
});

const youtubeResponseSchema = z.object({
  items: z.array(youtubeItemSchema).optional(),
});

/**
 * Converte duração ISO-8601 (ex.: "PT1H2M30S") em segundos.
 * Retorna null se não parsear.
 */
export function parseDurationToSeconds(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso.trim());
  if (!match) return null;
  const [, d, h, m, s] = match;
  const days = Number(d ?? 0);
  const hours = Number(h ?? 0);
  const minutes = Number(m ?? 0);
  const seconds = Number(s ?? 0);
  const total = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) ? total : null;
}

/** Escolhe a melhor thumbnail disponível (maxres → high → medium → default). */
function pickThumbnail(
  thumbs: Record<string, { url?: string }> | undefined,
): string | null {
  if (!thumbs) return null;
  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    const url = thumbs[key]?.url;
    if (url) return url;
  }
  return null;
}

function toNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export interface FetchYouTubeOptions {
  apiKey?: string;
  /** Injetável para testes. Default: fetch global. */
  fetchImpl?: typeof fetch;
  /** Backoff em ms antes do retry (default 300). Em testes pode ser 0. */
  retryDelayMs?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Busca metadata + estatísticas de um vídeo. Sempre resolve (nunca rejeita) —
 * erros viram { ok:false, reason } para o caller decidir o fallback de UI.
 */
export async function fetchYouTubeVideo(
  videoId: string,
  options: FetchYouTubeOptions = {},
): Promise<YouTubeFetchResult> {
  const apiKey = options.apiKey ?? process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { ok: false, reason: "no_api_key" };

  const fetchImpl = options.fetchImpl ?? fetch;
  const retryDelayMs = options.retryDelayMs ?? 300;

  const url = new URL(API_URL);
  url.searchParams.set("part", "snippet,statistics,contentDetails");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  let attempt = 0;
  // 1 tentativa + 1 retry em 5xx/rede.
  while (attempt < 2) {
    attempt += 1;
    try {
      const res = await fetchImpl(url.toString(), { method: "GET" });

      if (res.status === 403) return { ok: false, reason: "quota_exceeded" };
      if (res.status === 404) return { ok: false, reason: "not_found" };
      if (res.status >= 500) {
        if (attempt < 2) {
          await delay(retryDelayMs);
          continue;
        }
        return { ok: false, reason: "network_error" };
      }
      if (!res.ok) return { ok: false, reason: "invalid_response" };

      const json: unknown = await res.json();
      const parsed = youtubeResponseSchema.safeParse(json);
      if (!parsed.success) return { ok: false, reason: "invalid_response" };

      const item = parsed.data.items?.[0];
      if (!item) return { ok: false, reason: "not_found" };

      const stats: YouTubeVideoStats = {
        title: item.snippet?.title ?? null,
        channel_title: item.snippet?.channelTitle ?? null,
        published_at: item.snippet?.publishedAt ?? null,
        thumbnail_url: pickThumbnail(item.snippet?.thumbnails),
        duration_seconds: parseDurationToSeconds(item.contentDetails?.duration),
        view_count: toNumber(item.statistics?.viewCount),
        like_count: toNumber(item.statistics?.likeCount),
        comment_count: toNumber(item.statistics?.commentCount),
      };
      return { ok: true, data: stats };
    } catch {
      if (attempt < 2) {
        await delay(retryDelayMs);
        continue;
      }
      return { ok: false, reason: "network_error" };
    }
  }

  return { ok: false, reason: "network_error" };
}
