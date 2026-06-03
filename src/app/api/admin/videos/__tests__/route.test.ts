// F-020 — testes /api/admin/videos (POST + GET). Mocka auth + repos + sync.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { TrackedVideo } from "@/lib/youtube/types";

const checkAdminAuthMock = vi.fn();
const insertTrackedVideoMock = vi.fn();
const listAllTrackedVideosMock = vi.fn();
const getTrackedVideoByIdMock = vi.fn();
const syncVideoMetricsMock = vi.fn();
const fetchLeadsWithUtmMock = vi.fn();

vi.mock("@/lib/auth-check", () => ({ checkAdminAuth: checkAdminAuthMock }));
vi.mock("@/lib/youtube/tracked-videos-repo", () => ({
  insertTrackedVideo: insertTrackedVideoMock,
  listAllTrackedVideos: listAllTrackedVideosMock,
  getTrackedVideoById: getTrackedVideoByIdMock,
}));
vi.mock("@/lib/youtube/sync-video", () => ({ syncVideoMetrics: syncVideoMetricsMock }));
vi.mock("@/lib/analytics/leads-repo", () => ({ fetchLeadsWithUtm: fetchLeadsWithUtmMock }));

const ADMIN = { id: "u1", email: "ed@ldc.com", role: "ADMIN" as const };
const VIDEO_ID = "dTT71qfy5qQ";

function makeVideo(overrides: Partial<TrackedVideo> = {}): TrackedVideo {
  return {
    id: "v1",
    youtube_video_id: VIDEO_ID,
    utm_campaign: "etfs-portfolio",
    utm_term: null,
    title: "Vídeo",
    channel_title: "LDC",
    published_at: null,
    thumbnail_url: null,
    duration_seconds: null,
    view_count: 1000,
    like_count: null,
    comment_count: null,
    youtube_synced_at: null,
    created_by_user_id: "u1",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/videos", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  syncVideoMetricsMock.mockResolvedValue({ synced: true, updated: true });
});
afterEach(() => vi.resetModules());

describe("POST /api/admin/videos", () => {
  it("CA-005 — 401 sem sessão admin", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(null);
    const { POST } = await import("../route");
    const res = await POST(postReq({ url: `https://youtu.be/${VIDEO_ID}`, utm_campaign: "etfs" }));
    expect(res.status).toBe(401);
    expect(insertTrackedVideoMock).not.toHaveBeenCalled();
  });

  it("400 quando URL é inválida (Zod)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    const { POST } = await import("../route");
    const res = await POST(postReq({ url: "https://vimeo.com/1", utm_campaign: "etfs" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("CA-006 — 409 quando vídeo já rastreado", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    insertTrackedVideoMock.mockResolvedValueOnce({ ok: "duplicate" });
    const { POST } = await import("../route");
    const res = await POST(postReq({ url: `https://youtu.be/${VIDEO_ID}`, utm_campaign: "etfs" }));
    expect(res.status).toBe(409);
  });

  it("201 normaliza campanha e cria; sucesso do YouTube", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    insertTrackedVideoMock.mockResolvedValueOnce({ ok: true, video: makeVideo() });
    getTrackedVideoByIdMock.mockResolvedValueOnce(makeVideo());
    const { POST } = await import("../route");
    const res = await POST(
      postReq({ url: `https://www.youtube.com/watch?v=${VIDEO_ID}`, utm_campaign: "Política Macro BR" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.youtube_warning).toBeNull();
    // campanha normalizada no insert
    expect(insertTrackedVideoMock).toHaveBeenCalledWith(
      expect.objectContaining({ youtube_video_id: VIDEO_ID, utm_campaign: "politica-macro-br" }),
    );
  });

  it("CA-007 — cria mesmo com YouTube indisponível (degradação)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    insertTrackedVideoMock.mockResolvedValueOnce({ ok: true, video: makeVideo() });
    syncVideoMetricsMock.mockResolvedValueOnce({ synced: true, updated: false, reason: "quota_exceeded" });
    getTrackedVideoByIdMock.mockResolvedValueOnce(makeVideo());
    const { POST } = await import("../route");
    const res = await POST(postReq({ url: `https://youtu.be/${VIDEO_ID}`, utm_campaign: "etfs-portfolio" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.youtube_warning).toBe("quota_exceeded");
  });
});

describe("GET /api/admin/videos", () => {
  it("CA-005 — 401 sem sessão admin", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(null);
    const { GET } = await import("../route");
    const res = await GET(new NextRequest("http://localhost/api/admin/videos"));
    expect(res.status).toBe(401);
  });

  it("200 retorna lista com leads agregados e paginação", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(ADMIN);
    listAllTrackedVideosMock.mockResolvedValueOnce([makeVideo()]);
    fetchLeadsWithUtmMock.mockResolvedValueOnce([
      { id: "c1", name: "X", email: null, phone: null, notes: null, createdAt: new Date().toISOString(), utm_campaign: "etfs-portfolio", utm_source: "youtube", utm_content: VIDEO_ID },
    ]);
    const { GET } = await import("../route");
    const res = await GET(new NextRequest("http://localhost/api/admin/videos?period=30d"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.videos).toHaveLength(1);
    expect(body.data.videos[0].leads_total).toBe(1);
    expect(body.data.videos[0].conversion_rate).toBeCloseTo(0.001);
    expect(body.data.pagination.total).toBe(1);
  });
});
