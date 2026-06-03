// Acesso a public.tracked_videos via service role (createSupabaseAdminClient).
// Writes usam builder untyped (`as any`) por causa do bug Supabase-js v2
// multi-table (Insert colapsa para never) — ver memória do projeto. Reads são
// tipadas via TrackedVideo. Toda autorização é feita ANTES, na rota (checkAdminAuth).

import { createSupabaseAdminClient } from "@/lib/supabase";
import type { TrackedVideo, TrackedVideoInsert, YouTubeVideoStats } from "./types";

const PG_UNIQUE_VIOLATION = "23505";

const COLUMNS =
  "id, youtube_video_id, utm_campaign, utm_term, title, channel_title, published_at, thumbnail_url, duration_seconds, view_count, like_count, comment_count, youtube_synced_at, created_by_user_id, created_at, updated_at";

export type InsertResult =
  | { ok: true; video: TrackedVideo }
  | { ok: "duplicate" }
  | { ok: "error"; message: string };

export async function insertTrackedVideo(input: TrackedVideoInsert): Promise<InsertResult> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder = supabase.from("tracked_videos") as any;
  const { data, error } = await builder
    .insert({
      youtube_video_id: input.youtube_video_id,
      utm_campaign: input.utm_campaign,
      utm_term: input.utm_term ?? null,
      created_by_user_id: input.created_by_user_id ?? null,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) return { ok: "duplicate" };
    return { ok: "error", message: error.message };
  }
  return { ok: true, video: data as TrackedVideo };
}

export async function getTrackedVideoById(id: string): Promise<TrackedVideo | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tracked_videos")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TrackedVideo | null) ?? null;
}

export async function listAllTrackedVideos(filters: {
  campaign?: string;
  q?: string;
}): Promise<TrackedVideo[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("tracked_videos").select(COLUMNS);
  if (filters.campaign) query = query.eq("utm_campaign", filters.campaign);
  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as TrackedVideo[] | null) ?? [];
}

export async function updateTrackedVideo(
  id: string,
  patch: { utm_campaign?: string; utm_term?: string | null },
): Promise<TrackedVideo | null> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder = supabase.from("tracked_videos") as any;
  const { data, error } = await builder
    .update(patch)
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TrackedVideo | null) ?? null;
}

export async function deleteTrackedVideo(id: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("tracked_videos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

/** Persiste o cache de métricas do YouTube + youtube_synced_at (sempre setado). */
export async function applyYouTubeStats(
  id: string,
  stats: YouTubeVideoStats | null,
  syncedAt: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder = supabase.from("tracked_videos") as any;
  const patch: Record<string, unknown> = { youtube_synced_at: syncedAt };
  if (stats) {
    patch.title = stats.title;
    patch.channel_title = stats.channel_title;
    patch.published_at = stats.published_at;
    patch.thumbnail_url = stats.thumbnail_url;
    patch.duration_seconds = stats.duration_seconds;
    patch.view_count = stats.view_count;
    patch.like_count = stats.like_count;
    patch.comment_count = stats.comment_count;
  }
  const { error } = await builder.update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}
