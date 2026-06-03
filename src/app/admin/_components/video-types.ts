// Tipos das respostas das rotas /api/admin/videos** consumidas pela UI.
// Espelham os payloads de F-020 (lib/youtube/video-view.ts + rotas).

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
  leads_period: number;
  conversion_rate: number | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TrackedVideoDetail {
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
  created_at: string;
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

export interface VideoDetailResponse {
  video: TrackedVideoDetail;
  kpis: VideoKpis;
  series: { byDay: DayBucket[]; byOrigem: CountBucket[] };
}

export interface LeadRowView {
  id: string;
  createdAt: string;
  name: string;
  email: string | null;
  phone: string | null;
  patrimonio: string | null;
  origem: string | null;
  utm_campaign: string | null;
}

export interface CountBucket {
  key: string;
  count: number;
}
export interface DayBucket {
  date: string;
  count: number;
}

export interface AnalyticsUtm {
  period: string;
  summary: { total: number; withUtm: number; sharePct: number; topCampaigns: CountBucket[] };
  byCampaign: CountBucket[];
  bySource: CountBucket[];
  byDay: DayBucket[];
  topVideos: Array<{
    id: string;
    youtube_video_id: string;
    title: string | null;
    utm_campaign: string;
    leads_period: number;
    leads_total_30d: number;
  }>;
}

export interface VideoPreview {
  available: boolean;
  videoId: string;
  reason?: string;
  title?: string | null;
  channel_title?: string | null;
  published_at?: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  view_count?: number | null;
}

export type Period = "7d" | "30d" | "90d" | "all";
