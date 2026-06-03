// F-020 — testes /api/admin/videos/[id] (GET/PATCH/DELETE) + /refresh.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { TrackedVideo } from "@/lib/youtube/types";

const checkAdminAuthMock = vi.fn();
const getTrackedVideoByIdMock = vi.fn();
const updateTrackedVideoMock = vi.fn();
const deleteTrackedVideoMock = vi.fn();
const fetchLeadsForVideoMock = vi.fn();
const syncVideoMetricsMock = vi.fn();

vi.mock("@/lib/auth-check", () => ({ checkAdminAuth: checkAdminAuthMock }));
vi.mock("@/lib/youtube/tracked-videos-repo", () => ({
  getTrackedVideoById: getTrackedVideoByIdMock,
  updateTrackedVideo: updateTrackedVideoMock,
  deleteTrackedVideo: deleteTrackedVideoMock,
}));
vi.mock("@/lib/analytics/leads-repo", () => ({ fetchLeadsForVideo: fetchLeadsForVideoMock }));
vi.mock("@/lib/youtube/sync-video", () => ({ syncVideoMetrics: syncVideoMetricsMock }));

const ADMIN = { id: "u1", email: "ed@ldc.com", role: "ADMIN" as const };
const VIDEO_ID = "dTT71qfy5qQ";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function makeVideo(overrides: Partial<TrackedVideo> = {}): TrackedVideo {
  return {
    id: "v1", youtube_video_id: VIDEO_ID, utm_campaign: "etfs-portfolio", utm_term: null,
    title: "Vídeo", channel_title: "LDC", published_at: null, thumbnail_url: null,
    duration_seconds: null, view_count: 2000, like_count: 10, comment_count: 5,
    youtube_synced_at: null, created_by_user_id: "u1",
    created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:00:00Z", ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchLeadsForVideoMock.mockResolvedValue({ leads: [], total: 0 });
});
afterEach(() => vi.resetModules());

describe("GET /api/admin/videos/[id]", () => {
  it("401 sem auth", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(null);
    const { GET } = await import("../[id]/route");
    const res = await GET(new NextRequest("http://localhost/x"), ctx("v1"));
    expect(res.status).toBe(401);
  });

  it("404 quando vídeo inexistente", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    getTrackedVideoByIdMock.mockResolvedValueOnce(null);
    const { GET } = await import("../[id]/route");
    const res = await GET(new NextRequest("http://localhost/x"), ctx("nope"));
    expect(res.status).toBe(404);
  });

  it("200 com KPIs", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    getTrackedVideoByIdMock.mockResolvedValueOnce(makeVideo());
    fetchLeadsForVideoMock.mockResolvedValueOnce({
      leads: [{ id: "c1", name: "X", email: null, phone: null, notes: null, createdAt: "2026-06-01T10:00:00Z", utm_campaign: "etfs-portfolio", utm_source: "youtube", utm_content: VIDEO_ID }],
      total: 1,
    });
    const { GET } = await import("../[id]/route");
    const res = await GET(new NextRequest("http://localhost/x"), ctx("v1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.kpis.views).toBe(2000);
    expect(body.data.kpis.leads_total).toBe(1);
    expect(body.data.kpis.last_lead_at).toBe("2026-06-01T10:00:00Z");
  });
});

describe("PATCH /api/admin/videos/[id]", () => {
  it("normaliza utm_campaign e retorna 200", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    updateTrackedVideoMock.mockResolvedValueOnce(makeVideo({ utm_campaign: "politica-macro-br" }));
    const { PATCH } = await import("../[id]/route");
    const req = new NextRequest("http://localhost/x", { method: "PATCH", body: JSON.stringify({ utm_campaign: "Política Macro BR" }) });
    const res = await PATCH(req, ctx("v1"));
    expect(res.status).toBe(200);
    expect(updateTrackedVideoMock).toHaveBeenCalledWith("v1", { utm_campaign: "politica-macro-br" });
  });

  it("400 quando body vazio (nada para atualizar)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    const { PATCH } = await import("../[id]/route");
    const req = new NextRequest("http://localhost/x", { method: "PATCH", body: JSON.stringify({}) });
    const res = await PATCH(req, ctx("v1"));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/admin/videos/[id]", () => {
  it("hard delete retorna 200; não toca leads", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    getTrackedVideoByIdMock.mockResolvedValueOnce(makeVideo());
    deleteTrackedVideoMock.mockResolvedValueOnce(true);
    const { DELETE } = await import("../[id]/route");
    const res = await DELETE(new NextRequest("http://localhost/x"), ctx("v1"));
    expect(res.status).toBe(200);
    expect(deleteTrackedVideoMock).toHaveBeenCalledWith("v1");
  });
});

describe("POST /api/admin/videos/[id]/refresh", () => {
  it("CA-008 — 429 quando dentro do cooldown (rate-limit)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    getTrackedVideoByIdMock.mockResolvedValueOnce(makeVideo({ youtube_synced_at: new Date().toISOString() }));
    syncVideoMetricsMock.mockResolvedValueOnce({ synced: false, reason: "rate_limited" });
    const { POST } = await import("../[id]/refresh/route");
    const res = await POST(new NextRequest("http://localhost/x", { method: "POST" }), ctx("v1"));
    expect(res.status).toBe(429);
  });

  it("200 quando sincroniza com sucesso", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    getTrackedVideoByIdMock
      .mockResolvedValueOnce(makeVideo())
      .mockResolvedValueOnce(makeVideo({ view_count: 9999 }));
    syncVideoMetricsMock.mockResolvedValueOnce({ synced: true, updated: true });
    const { POST } = await import("../[id]/refresh/route");
    const res = await POST(new NextRequest("http://localhost/x", { method: "POST" }), ctx("v1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.updated).toBe(true);
    expect(body.data.video.view_count).toBe(9999);
  });
});
