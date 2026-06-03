// Sincroniza métricas de um vídeo com a YouTube Data API e persiste o cache.
// Tolerante a falha: mesmo em erro (quota/404/rede), grava youtube_synced_at
// para não martelar a API. Aplica guard de rate-limit 1/min por vídeo no refresh.

import { fetchYouTubeVideo, type FetchYouTubeOptions } from "./youtube-api";
import { applyYouTubeStats } from "./tracked-videos-repo";
import type { TrackedVideo, YouTubeFetchFailureReason } from "./types";

export const REFRESH_COOLDOWN_MS = 60_000; // 1 min

export type SyncOutcome =
  | { synced: true; updated: boolean; reason?: YouTubeFetchFailureReason }
  | { synced: false; reason: "rate_limited" };

export interface SyncOptions extends FetchYouTubeOptions {
  /** Ignora o cooldown (usado no create). */
  force?: boolean;
  /** "Agora" lógico (injetável em testes). */
  now?: Date;
}

/** True se o último sync foi há menos de REFRESH_COOLDOWN_MS. */
export function isWithinCooldown(syncedAt: string | null, now: Date): boolean {
  if (!syncedAt) return false;
  const last = new Date(syncedAt).getTime();
  if (Number.isNaN(last)) return false;
  return now.getTime() - last < REFRESH_COOLDOWN_MS;
}

/**
 * Busca métricas e persiste. Retorna se sincronizou e se houve dados novos.
 * Nunca lança por erro da API — só relança erro de persistência (DB).
 */
export async function syncVideoMetrics(
  video: Pick<TrackedVideo, "id" | "youtube_video_id" | "youtube_synced_at">,
  options: SyncOptions = {},
): Promise<SyncOutcome> {
  const now = options.now ?? new Date();

  if (!options.force && isWithinCooldown(video.youtube_synced_at, now)) {
    return { synced: false, reason: "rate_limited" };
  }

  const result = await fetchYouTubeVideo(video.youtube_video_id, options);
  const syncedAt = now.toISOString();

  if (result.ok) {
    await applyYouTubeStats(video.id, result.data, syncedAt);
    return { synced: true, updated: true };
  }

  // Erro parcial: grava só o timestamp (degradação graciosa).
  await applyYouTubeStats(video.id, null, syncedAt);
  return { synced: true, updated: false, reason: result.reason };
}
