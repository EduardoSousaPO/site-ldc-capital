// F-020 — /api/admin/videos
//   POST: cria um tracked_video (videoId único) e sincroniza métricas do YouTube
//         de forma síncrona e tolerante a falha (grava o vídeo mesmo se a API falhar).
//   GET:  lista paginada + filtros (campanha, busca) + sort (leads_30d|created_at).
//
// Auth: checkAdminAuth() (app-layer) + service role nos repos. RLS é defesa
// em profundidade (SPEC D-2).

import { NextRequest } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { jsonError, jsonOk, jsonZodError, UNAUTHORIZED } from "@/lib/api/response";
import { extractVideoId } from "@/lib/youtube/extract-video-id";
import { normalizeCampaignSlug } from "@/lib/youtube/normalize-campaign";
import {
  createTrackedVideoSchema,
  listVideosQuerySchema,
  periodToDays,
  searchParamsToObject,
} from "@/lib/youtube/schemas";
import {
  insertTrackedVideo,
  listAllTrackedVideos,
  getTrackedVideoById,
} from "@/lib/youtube/tracked-videos-repo";
import { syncVideoMetrics } from "@/lib/youtube/sync-video";
import { buildVideoListItem } from "@/lib/youtube/video-view";
import { fetchLeadsWithUtm } from "@/lib/analytics/leads-repo";
import { countLeadsInWindow, leadsForVideo } from "@/lib/analytics/aggregate-leads";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const user = await checkAdminAuth();
    if (!user) return UNAUTHORIZED();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Formato de dados inválido.", 400);
    }

    const parsed = createTrackedVideoSchema.safeParse(body);
    if (!parsed.success) return jsonZodError(parsed.error);

    const videoId = extractVideoId(parsed.data.url);
    if (!videoId) return jsonError("Não foi possível extrair o videoId da URL.", 400);

    const insert = await insertTrackedVideo({
      youtube_video_id: videoId,
      utm_campaign: normalizeCampaignSlug(parsed.data.utm_campaign),
      utm_term: parsed.data.utm_term ?? null,
      created_by_user_id: user.id,
    });

    if (insert.ok === "duplicate") {
      return jsonError("Este vídeo já está sendo rastreado.", 409);
    }
    if (insert.ok === "error") {
      console.error("Erro ao criar tracked_video:", insert.message);
      return jsonError("Falha ao salvar o vídeo.", 500);
    }

    // Sincronização síncrona, tolerante a falha (não bloqueia a criação).
    let youtubeReason: string | undefined;
    try {
      const outcome = await syncVideoMetrics(insert.video, { force: true });
      if (outcome.synced && !outcome.updated) youtubeReason = outcome.reason;
    } catch (err) {
      // Falha de persistência do cache não invalida a criação do vídeo.
      console.error("Erro ao sincronizar métricas YouTube no create:", err);
      youtubeReason = "network_error";
    }

    // Relê para devolver o estado pós-sync.
    const fresh = (await getTrackedVideoById(insert.video.id)) ?? insert.video;
    return jsonOk({ video: fresh, youtube_warning: youtubeReason ?? null }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return jsonZodError(error);
    console.error("Erro no POST /api/admin/videos:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await checkAdminAuth();
    if (!user) return UNAUTHORIZED();

    const parsed = listVideosQuerySchema.safeParse(
      searchParamsToObject(request.nextUrl.searchParams),
    );
    if (!parsed.success) return jsonZodError(parsed.error);
    const { campaign, q, sort, page, pageSize, period } = parsed.data;

    const [videos, allLeads] = await Promise.all([
      listAllTrackedVideos({ campaign, q }),
      fetchLeadsWithUtm(),
    ]);

    const now = new Date();
    const periodDays = periodToDays(period);

    let items = videos.map((video) => {
      const videoLeads = leadsForVideo(allLeads, video.youtube_video_id);
      const item = buildVideoListItem(video, videoLeads, now);
      const leadsInPeriod = countLeadsInWindow(videoLeads, periodDays, now);
      return { ...item, leads_period: leadsInPeriod };
    });

    // Período "all" não filtra; demais escondem vídeos sem leads no período? Não —
    // mantemos todos os vídeos visíveis; o período afeta a métrica leads_period.
    items.sort((a, b) =>
      sort === "created_at"
        ? b.created_at.localeCompare(a.created_at)
        : b.leads_30d - a.leads_30d || b.created_at.localeCompare(a.created_at),
    );

    const total = items.length;
    const start = (page - 1) * pageSize;
    items = items.slice(start, start + pageSize);

    return jsonOk({
      videos: items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("Erro no GET /api/admin/videos:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}
