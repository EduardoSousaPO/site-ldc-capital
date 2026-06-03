// F-020 — GET /api/admin/analytics/utm
// Dashboard global de UTM: cards (total/com utm/share/top campanhas), séries para
// BarCharts (por campanha, por source), LineChart (leads/dia) e top 10 vídeos.

import { NextRequest } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { jsonError, jsonOk, jsonZodError, UNAUTHORIZED } from "@/lib/api/response";
import {
  analyticsUtmQuerySchema,
  periodToDays,
  searchParamsToObject,
} from "@/lib/youtube/schemas";
import { fetchLeadsWithUtm } from "@/lib/analytics/leads-repo";
import { listAllTrackedVideos } from "@/lib/youtube/tracked-videos-repo";
import {
  aggregateLeadsByCampaign,
  aggregateLeadsByDay,
  aggregateLeadsBySource,
  countLeadsInWindow,
  filterLeadsInWindow,
  leadsForVideo,
  summarizeLeads,
} from "@/lib/analytics/aggregate-leads";

export async function GET(request: NextRequest) {
  try {
    const user = await checkAdminAuth();
    if (!user) return UNAUTHORIZED();

    const parsed = analyticsUtmQuerySchema.safeParse(
      searchParamsToObject(request.nextUrl.searchParams),
    );
    if (!parsed.success) return jsonZodError(parsed.error);

    const now = new Date();
    const days = periodToDays(parsed.data.period);

    const [allLeads, videos] = await Promise.all([
      fetchLeadsWithUtm(),
      listAllTrackedVideos({}),
    ]);

    const leads = filterLeadsInWindow(allLeads, days, now);

    const summary = summarizeLeads(leads, 3);
    const byCampaign = aggregateLeadsByCampaign(leads.filter((l) => l.utm_campaign));
    const bySource = aggregateLeadsBySource(leads);
    // LineChart: cap em 90 dias para não estourar a série (all = 90 visíveis).
    const byDay = aggregateLeadsByDay(leads, Math.min(days, 90), now);

    const topVideos = videos
      .map((video) => {
        const videoLeads = leadsForVideo(leads, video.youtube_video_id);
        return {
          id: video.id,
          youtube_video_id: video.youtube_video_id,
          title: video.title,
          utm_campaign: video.utm_campaign,
          leads_period: videoLeads.length,
          leads_total_30d: countLeadsInWindow(
            leadsForVideo(allLeads, video.youtube_video_id),
            30,
            now,
          ),
        };
      })
      .sort((a, b) => b.leads_period - a.leads_period)
      .slice(0, 10);

    return jsonOk({
      period: parsed.data.period,
      summary,
      byCampaign,
      bySource,
      byDay,
      topVideos,
    });
  } catch (error) {
    console.error("Erro no GET /api/admin/analytics/utm:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}
