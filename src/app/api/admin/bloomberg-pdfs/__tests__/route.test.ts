/**
 * F-016b — Testes /api/admin/bloomberg-pdfs (GET listing).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkAdminAuthMock = vi.fn();
const listMock = vi.fn();

vi.mock("@/lib/auth-check", () => ({
  checkAdminAuth: checkAdminAuthMock,
}));

vi.mock("@vercel/blob", () => ({
  list: listMock,
}));

describe("/api/admin/bloomberg-pdfs (GET)", () => {
  beforeEach(() => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
    checkAdminAuthMock.mockReset();
    listMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retorna 401 quando sessão admin ausente", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(null);
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(401);
    expect(listMock).not.toHaveBeenCalled();
  });

  it("retorna PDFs ordenados por uploaded_at desc, filtrando >30d e não-pdf", async () => {
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    listMock.mockResolvedValueOnce({
      blobs: [
        {
          url: "https://blob.example.com/bloomberg-pdfs/old.pdf",
          pathname: "bloomberg-pdfs/old.pdf",
          size: 5000,
          uploadedAt: new Date(now - 31 * oneDayMs).toISOString(),
        },
        {
          url: "https://blob.example.com/bloomberg-pdfs/recent-a.pdf",
          pathname: "bloomberg-pdfs/recent-a.pdf",
          size: 1000,
          uploadedAt: new Date(now - 2 * oneDayMs).toISOString(),
        },
        {
          url: "https://blob.example.com/bloomberg-pdfs/recent-b.pdf",
          pathname: "bloomberg-pdfs/recent-b.pdf",
          size: 2000,
          uploadedAt: new Date(now - 1 * oneDayMs).toISOString(),
        },
        {
          url: "https://blob.example.com/bloomberg-pdfs/notes.txt",
          pathname: "bloomberg-pdfs/notes.txt",
          size: 30,
          uploadedAt: new Date(now).toISOString(),
        },
      ],
    });

    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pdfs).toHaveLength(2);
    expect(body.pdfs[0].pathname).toBe("bloomberg-pdfs/recent-b.pdf");
    expect(body.pdfs[1].pathname).toBe("bloomberg-pdfs/recent-a.pdf");
  });
});
