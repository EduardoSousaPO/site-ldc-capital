// Mappers puros que combinam um TrackedVideo com seus leads (Client) em
// estruturas de view (lista e KPIs). Sem I/O — testáveis.

import { countLeadsInWindow, type LeadRow } from "@/lib/analytics/aggregate-leads";
import type { TrackedVideo } from "./types";

export interface VideoListItem {
  id: string;
  youtube_video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  utm_campaign: string;
  created_at: string;
  view_count: number | null;
  leads_total: number;
  leads_7d: number;
  leads_30d: number;
  /** leads_total / view_count (0..1) ou null se views indisponíveis/zero. */
  conversion_rate: number | null;
}

export function conversionRate(leadsTotal: number, viewCount: number | null): number | null {
  if (!viewCount || viewCount <= 0) return null;
  return leadsTotal / viewCount;
}

export function buildVideoListItem(
  video: TrackedVideo,
  videoLeads: LeadRow[],
  now: Date,
): VideoListItem {
  const leads_total = videoLeads.length;
  return {
    id: video.id,
    youtube_video_id: video.youtube_video_id,
    title: video.title,
    thumbnail_url: video.thumbnail_url,
    utm_campaign: video.utm_campaign,
    created_at: video.created_at,
    view_count: video.view_count,
    leads_total,
    leads_7d: countLeadsInWindow(videoLeads, 7, now),
    leads_30d: countLeadsInWindow(videoLeads, 30, now),
    conversion_rate: conversionRate(leads_total, video.view_count),
  };
}

export interface VideoKpis {
  views: number | null;
  likes: number | null;
  comments: number | null;
  leads_total: number;
  leads_7d: number;
  leads_30d: number;
  conversion_rate: number | null;
  last_lead_at: string | null;
}

export function buildVideoKpis(video: TrackedVideo, videoLeads: LeadRow[], now: Date): VideoKpis {
  const leads_total = videoLeads.length;
  const last_lead_at = videoLeads.reduce<string | null>((latest, lead) => {
    if (!latest || lead.createdAt > latest) return lead.createdAt;
    return latest;
  }, null);
  return {
    views: video.view_count,
    likes: video.like_count,
    comments: video.comment_count,
    leads_total,
    leads_7d: countLeadsInWindow(videoLeads, 7, now),
    leads_30d: countLeadsInWindow(videoLeads, 30, now),
    conversion_rate: conversionRate(leads_total, video.view_count),
    last_lead_at,
  };
}
