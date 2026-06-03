// F-020 — POST /api/admin/videos/[id]/refresh
// Re-busca métricas na YouTube Data API e atualiza o cache. Rate-limit 1/min
// por vídeo (guard via youtube_synced_at). Degrada graciosamente em erro da API.

import { NextRequest } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { jsonError, jsonOk, UNAUTHORIZED } from "@/lib/api/response";
import { getTrackedVideoById } from "@/lib/youtube/tracked-videos-repo";
import { syncVideoMetrics } from "@/lib/youtube/sync-video";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await checkAdminAuth();
    if (!user) return UNAUTHORIZED();

    const { id } = await params;
    const video = await getTrackedVideoById(id);
    if (!video) return jsonError("Vídeo não encontrado.", 404);

    const outcome = await syncVideoMetrics(video);
    if (!outcome.synced) {
      return jsonError("Aguarde 1 minuto entre atualizações deste vídeo.", 429);
    }

    const fresh = (await getTrackedVideoById(id)) ?? video;
    return jsonOk({
      video: fresh,
      updated: outcome.updated,
      youtube_warning: outcome.updated ? null : outcome.reason ?? null,
    });
  } catch (error) {
    console.error("Erro no POST /api/admin/videos/[id]/refresh:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}
