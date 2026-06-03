import { describe, expect, it, vi } from "vitest";
import { fetchYouTubeVideo } from "../youtube-api";

const ID = "dTT71qfy5qQ";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const okPayload = {
  items: [
    {
      snippet: {
        title: "Título",
        channelTitle: "LDC Capital",
        publishedAt: "2026-05-01T12:00:00Z",
        thumbnails: { high: { url: "https://i.ytimg.com/high.jpg" } },
      },
      statistics: { viewCount: "1500", likeCount: "42", commentCount: "7" },
      contentDetails: { duration: "PT5M30S" },
    },
  ],
};

describe("fetchYouTubeVideo", () => {
  it("sem API key → no_api_key (degradação graciosa)", async () => {
    const res = await fetchYouTubeVideo(ID, { apiKey: undefined, fetchImpl: vi.fn() });
    expect(res).toEqual({ ok: false, reason: "no_api_key" });
  });

  it("sucesso mapeia stats + duração", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(okPayload));
    const res = await fetchYouTubeVideo(ID, { apiKey: "k", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.title).toBe("Título");
      expect(res.data.view_count).toBe(1500);
      expect(res.data.duration_seconds).toBe(330);
      expect(res.data.thumbnail_url).toBe("https://i.ytimg.com/high.jpg");
    }
  });

  it("403 → quota_exceeded", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 403));
    const res = await fetchYouTubeVideo(ID, { apiKey: "k", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(res).toEqual({ ok: false, reason: "quota_exceeded" });
  });

  it("404 → not_found", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 404));
    const res = await fetchYouTubeVideo(ID, { apiKey: "k", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(res).toEqual({ ok: false, reason: "not_found" });
  });

  it("items vazio → not_found", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    const res = await fetchYouTubeVideo(ID, { apiKey: "k", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(res).toEqual({ ok: false, reason: "not_found" });
  });

  it("5xx faz 1 retry e então network_error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 503));
    const res = await fetchYouTubeVideo(ID, {
      apiKey: "k",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retryDelayMs: 0,
    });
    expect(res).toEqual({ ok: false, reason: "network_error" });
    expect(fetchImpl).toHaveBeenCalledTimes(2); // 1 + 1 retry
  });

  it("5xx seguido de sucesso no retry", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse(okPayload));
    const res = await fetchYouTubeVideo(ID, {
      apiKey: "k",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retryDelayMs: 0,
    });
    expect(res.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
