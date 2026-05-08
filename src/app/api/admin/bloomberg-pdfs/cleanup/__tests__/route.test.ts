/**
 * F-016b — Testes /api/admin/bloomberg-pdfs/cleanup (cron TTL 30d).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listMock = vi.fn();
const delMock = vi.fn();

vi.mock("@vercel/blob", () => ({
  list: listMock,
  del: delMock,
}));

const CRON_SECRET = "test-cron-secret-cleanup";

describe("/api/admin/bloomberg-pdfs/cleanup", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
    listMock.mockReset();
    delMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retorna 401 quando Authorization ausente (RNF-007)", async () => {
    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/bloomberg-pdfs/cleanup",
      { method: "GET" },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    expect(listMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
  });

  it("retorna 401 com secret incorreto (timing-safe)", async () => {
    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/bloomberg-pdfs/cleanup",
      {
        method: "GET",
        headers: { Authorization: "Bearer wrong-secret" },
      },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    expect(listMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
  });

  it("deleta apenas PDFs com uploadedAt > 30 dias, mantém recentes", async () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    listMock.mockResolvedValueOnce({
      blobs: [
        {
          url: "https://blob.example.com/bloomberg-pdfs/old-1.pdf",
          pathname: "bloomberg-pdfs/old-1.pdf",
          size: 100,
          uploadedAt: new Date(now - 31 * oneDayMs).toISOString(),
        },
        {
          url: "https://blob.example.com/bloomberg-pdfs/old-2.pdf",
          pathname: "bloomberg-pdfs/old-2.pdf",
          size: 200,
          uploadedAt: new Date(now - 60 * oneDayMs).toISOString(),
        },
        {
          url: "https://blob.example.com/bloomberg-pdfs/recent.pdf",
          pathname: "bloomberg-pdfs/recent.pdf",
          size: 300,
          uploadedAt: new Date(now - 5 * oneDayMs).toISOString(),
        },
      ],
    });
    delMock.mockResolvedValue(undefined);

    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/bloomberg-pdfs/cleanup",
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
    expect(body.ttl_days).toBe(30);
    expect(delMock).toHaveBeenCalledTimes(2);
    const deletedUrls = delMock.mock.calls.map((c) => c[0]);
    expect(deletedUrls).toContain("https://blob.example.com/bloomberg-pdfs/old-1.pdf");
    expect(deletedUrls).toContain("https://blob.example.com/bloomberg-pdfs/old-2.pdf");
    expect(deletedUrls).not.toContain(
      "https://blob.example.com/bloomberg-pdfs/recent.pdf",
    );
  });

  it("retorna deleted_count=0 quando todos os PDFs estão dentro do TTL", async () => {
    const now = Date.now();
    listMock.mockResolvedValueOnce({
      blobs: [
        {
          url: "https://blob.example.com/bloomberg-pdfs/r1.pdf",
          pathname: "bloomberg-pdfs/r1.pdf",
          size: 100,
          uploadedAt: new Date(now - 60 * 60 * 1000).toISOString(),
        },
      ],
    });

    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/bloomberg-pdfs/cleanup",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted_count).toBe(0);
    expect(body.scanned_count).toBe(1);
    expect(delMock).not.toHaveBeenCalled();
  });
});
