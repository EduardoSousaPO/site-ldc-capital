// Tipos do domínio de rastreamento de vídeos.
// `tracked_videos` ainda não está em database.types.ts (regenerar pós-migration);
// até lá usamos estes tipos escritos à mão + cliente untyped + helpers tipados
// (estratégia do bug Supabase-js v2 multi-table — ver memória do projeto).

/** Linha da tabela public.tracked_videos. */
export interface TrackedVideo {
  id: string;
  youtube_video_id: string;
  utm_campaign: string;
  utm_term: string | null;
  title: string | null;
  channel_title: string | null;
  published_at: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  youtube_synced_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload de INSERT (campos não-cache obrigatórios). */
export interface TrackedVideoInsert {
  youtube_video_id: string;
  utm_campaign: string;
  utm_term?: string | null;
  created_by_user_id?: string | null;
}

/** Métricas/metadata vindas da YouTube Data API v3 (subset cacheado). */
export interface YouTubeVideoStats {
  title: string | null;
  channel_title: string | null;
  published_at: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
}

/** Resultado de uma tentativa de fetch na YouTube Data API. */
export type YouTubeFetchResult =
  | { ok: true; data: YouTubeVideoStats }
  | { ok: false; reason: YouTubeFetchFailureReason };

export type YouTubeFetchFailureReason =
  | "no_api_key" // YOUTUBE_API_KEY ausente — degradação graciosa
  | "not_found" // 404 — vídeo inexistente/privado
  | "quota_exceeded" // 403 — quota da Data API esgotada
  | "rate_limited" // guard interno 1/min por vídeo
  | "network_error" // 5xx / falha de rede após retry
  | "invalid_response"; // payload fora do schema esperado
