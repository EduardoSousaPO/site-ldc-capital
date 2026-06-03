// F-020 — /api/admin/videos/[id]
//   GET:    detalhe do vídeo + KPIs (views/likes/comments/leads/conversion/última lead).
//   PATCH:  edita utm_campaign / utm_term.
//   DELETE: hard delete (leads em Client NÃO são deletados — viram órfãos, por design).

import { NextRequest } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { jsonError, jsonOk, jsonZodError, UNAUTHORIZED } from "@/lib/api/response";
import { normalizeCampaignSlug } from "@/lib/youtube/normalize-campaign";
import { patchTrackedVideoSchema } from "@/lib/youtube/schemas";
import {
  deleteTrackedVideo,
  getTrackedVideoById,
  updateTrackedVideo,
} from "@/lib/youtube/tracked-videos-repo";
import { buildVideoKpis } from "@/lib/youtube/video-view";
import { fetchLeadsForVideo } from "@/lib/analytics/leads-repo";
import { aggregateLeadsByDay } from "@/lib/analytics/aggregate-leads";
import { parseClientNotes } from "@/lib/analytics/parse-client-notes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await checkAdminAuth();
    if (!user) return UNAUTHORIZED();

    const { id } = await params;
    const video = await getTrackedVideoById(id);
    if (!video) return jsonError("Vídeo não encontrado.", 404);

    // KPIs precisam de todos os leads do vídeo (sem paginação).
    const { leads } = await fetchLeadsForVideo(video.youtube_video_id, {
      page: 1,
      pageSize: 100000,
    });
    const now = new Date();
    const kpis = buildVideoKpis(video, leads, now);

    // Séries para os gráficos da Página C.
    const byDay = aggregateLeadsByDay(leads, 90, now);
    const origemCounts = new Map<string, number>();
    for (const lead of leads) {
      const origem = parseClientNotes(lead.notes).origem ?? "(não informado)";
      origemCounts.set(origem, (origemCounts.get(origem) ?? 0) + 1);
    }
    const byOrigem = [...origemCounts.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

    return jsonOk({ video, kpis, series: { byDay, byOrigem } });
  } catch (error) {
    console.error("Erro no GET /api/admin/videos/[id]:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await checkAdminAuth();
    if (!user) return UNAUTHORIZED();

    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Formato de dados inválido.", 400);
    }

    const parsed = patchTrackedVideoSchema.safeParse(body);
    if (!parsed.success) return jsonZodError(parsed.error);

    const patch: { utm_campaign?: string; utm_term?: string | null } = {};
    if (parsed.data.utm_campaign !== undefined) {
      patch.utm_campaign = normalizeCampaignSlug(parsed.data.utm_campaign);
    }
    if (parsed.data.utm_term !== undefined) {
      patch.utm_term = parsed.data.utm_term;
    }

    const updated = await updateTrackedVideo(id, patch);
    if (!updated) return jsonError("Vídeo não encontrado.", 404);

    return jsonOk({ video: updated });
  } catch (error) {
    console.error("Erro no PATCH /api/admin/videos/[id]:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await checkAdminAuth();
    if (!user) return UNAUTHORIZED();

    const { id } = await params;
    const video = await getTrackedVideoById(id);
    if (!video) return jsonError("Vídeo não encontrado.", 404);

    await deleteTrackedVideo(id);
    // Leads em Client permanecem (utm_content fica órfão). Documentado no contrato.
    return jsonOk({ deleted: true, id });
  } catch (error) {
    console.error("Erro no DELETE /api/admin/videos/[id]:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}
