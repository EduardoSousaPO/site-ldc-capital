/**
 * F-019 — testes do cleanup cron /api/admin/blog-carousels/cleanup.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listCarouselZipsMock = vi.fn();
const deleteCarouselZipMock = vi.fn();

vi.mock("@/features/news/carousel/storage", () => ({
  listCarouselZips: listCarouselZipsMock,
  deleteCarouselZip: deleteCarouselZipMock,
}));

const CRON_SECRET = "test-cron-secret-blog-carousels";

describe("/api/admin/blog-carousels/cleanup", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    listCarouselZipsMock.mockReset();
    deleteCarouselZipMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retorna 401 sem Authorization (RNF-007)", async () => {
    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/blog-carousels/cleanup",
      { method: "GET" },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    expect(listCarouselZipsMock).not.toHaveBeenCalled();
  });

  it("retorna 401 com secret incorreto (timing-safe)", async () => {
    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/blog-carousels/cleanup",
      {
        method: "GET",
        headers: { Authorization: "Bearer wrong-secret" },
      },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    expect(listCarouselZipsMock).not.toHaveBeenCalled();
  });

  it("deleta zips >90d e mantém recentes", async () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    listCarouselZipsMock.mockResolvedValueOnce([
      {
        name: "old-zip-1.zip",
        created_at: new Date(now - 91 * oneDayMs).toISOString(),
      },
      {
        name: "old-zip-2.zip",
        created_at: new Date(now - 120 * oneDayMs).toISOString(),
      },
      {
        name: "recent-zip.zip",
        created_at: new Date(now - 5 * oneDayMs).toISOString(),
      },
    ]);
    deleteCarouselZipMock.mockResolvedValue(undefined);

    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/blog-carousels/cleanup",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted_count).toBe(2);
    expect(body.scanned_count).toBe(3);
    expect(body.ttl_days).toBe(90);
    expect(deleteCarouselZipMock).toHaveBeenCalledTimes(2);
    const deletedNames = deleteCarouselZipMock.mock.calls.map((c) => c[0]);
    expect(deletedNames).toContain("old-zip-1.zip");
    expect(deletedNames).toContain("old-zip-2.zip");
    expect(deletedNames).not.toContain("recent-zip.zip");
  });
});
