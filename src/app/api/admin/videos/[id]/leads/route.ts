// F-020 — GET /api/admin/videos/[id]/leads
// Lista os leads de um vídeo (Client.utm_content = youtube_video_id), paginado.
// Deriva patrimônio/origem de Client.notes (sem coluna dedicada — SPEC D-3).

import { NextRequest } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { jsonError, jsonOk, jsonZodError, UNAUTHORIZED } from "@/lib/api/response";
import { leadsQuerySchema, searchParamsToObject } from "@/lib/youtube/schemas";
import { getTrackedVideoById } from "@/lib/youtube/tracked-videos-repo";
import { fetchLeadsForVideo } from "@/lib/analytics/leads-repo";
import { parseClientNotes } from "@/lib/analytics/parse-client-notes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await checkAdminAuth();
    if (!user) return UNAUTHORIZED();

    const { id } = await params;
    const parsed = leadsQuerySchema.safeParse(
      searchParamsToObject(request.nextUrl.searchParams),
    );
    if (!parsed.success) return jsonZodError(parsed.error);

    const video = await getTrackedVideoById(id);
    if (!video) return jsonError("Vídeo não encontrado.", 404);

    const { leads, total } = await fetchLeadsForVideo(video.youtube_video_id, {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });

    const rows = leads.map((lead) => {
      const parsedNotes = parseClientNotes(lead.notes);
      return {
        id: lead.id,
        createdAt: lead.createdAt,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        patrimonio: parsedNotes.patrimonio ?? null,
        origem: parsedNotes.origem ?? null,
        utm_campaign: lead.utm_campaign,
      };
    });

    return jsonOk({
      leads: rows,
      pagination: {
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        total,
        totalPages: Math.ceil(total / parsed.data.pageSize),
      },
    });
  } catch (error) {
    console.error("Erro no GET /api/admin/videos/[id]/leads:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}
