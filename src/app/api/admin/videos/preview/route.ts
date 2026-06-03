// F-020 — GET /api/admin/videos/preview?url=<youtube-url-ou-id>
// Preview leve (sem salvar) usado pela Página B ao colar a URL: extrai o videoId
// e busca metadata no YouTube. Degrada graciosamente (sem chave / quota / 404).

import { NextRequest } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { jsonError, jsonOk, UNAUTHORIZED } from "@/lib/api/response";
import { extractVideoId } from "@/lib/youtube/extract-video-id";
import { fetchYouTubeVideo } from "@/lib/youtube/youtube-api";

export async function GET(request: NextRequest) {
  try {
    const user = await checkAdminAuth();
    if (!user) return UNAUTHORIZED();

    const raw = request.nextUrl.searchParams.get("url") ?? request.nextUrl.searchParams.get("videoId");
    const videoId = extractVideoId(raw);
    if (!videoId) return jsonError("URL do YouTube inválida.", 400);

    const result = await fetchYouTubeVideo(videoId);
    if (result.ok) {
      return jsonOk({ available: true, videoId, ...result.data });
    }
    // Sem métricas, mas o videoId é válido — a UI ainda pode gerar o link.
    return jsonOk({ available: false, videoId, reason: result.reason });
  } catch (error) {
    console.error("Erro no GET /api/admin/videos/preview:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}
