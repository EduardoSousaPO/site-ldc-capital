/**
 * F-016b — Testes /api/admin/bloomberg-pdfs/upload (Anti-SPEC §6.2b, §6.3, RNF-007).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkAdminAuthMock = vi.fn();
const putMock = vi.fn();

vi.mock("@/lib/auth-check", () => ({
  checkAdminAuth: checkAdminAuthMock,
}));

vi.mock("@vercel/blob", () => ({
  put: putMock,
}));

function makeFormData(files: Array<{ name: string; size: number; type: string }>) {
  const fd = new FormData();
  for (const f of files) {
    const buffer = new Uint8Array(f.size);
    const blob = new Blob([buffer], { type: f.type });
    const file = new File([blob], f.name, { type: f.type });
    fd.append("files", file);
  }
  return fd;
}

async function callPost(formData: FormData) {
  const { POST } = await import("../route");
  const req = new Request("https://example.com/api/admin/bloomberg-pdfs/upload", {
    method: "POST",
    body: formData,
  });
  // NextRequest aceita Request — typecast mínimo mantém o teste isolado.
  return POST(req as never);
}

describe("/api/admin/bloomberg-pdfs/upload", () => {
  beforeEach(() => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
    checkAdminAuthMock.mockReset();
    putMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retorna 401 quando sessão admin ausente (Anti-SPEC §6.3)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(null);
    const fd = makeFormData([{ name: "x.pdf", size: 100, type: "application/pdf" }]);
    const res = await callPost(fd);
    expect(res.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("retorna 400 quando MIME não é application/pdf (rejeita .docx)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    const fd = makeFormData([
      {
        name: "report.docx",
        size: 1024,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    ]);
    const res = await callPost(fd);
    expect(res.status).toBe(400);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("retorna 413 quando arquivo excede 10MB", async () => {
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    const fd = makeFormData([
      { name: "huge.pdf", size: 10 * 1024 * 1024 + 1, type: "application/pdf" },
    ]);
    const res = await callPost(fd);
    expect(res.status).toBe(413);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("retorna 400 quando excede 10 arquivos por request (RNF-007)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    const fd = makeFormData(
      Array.from({ length: 11 }, (_, i) => ({
        name: `pdf-${i}.pdf`,
        size: 1024,
        type: "application/pdf",
      })),
    );
    const res = await callPost(fd);
    expect(res.status).toBe(400);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("upload bem-sucedido retorna lista de uploaded entries", async () => {
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    putMock.mockImplementation(async (pathname: string) => ({
      url: `https://blob.example.com/${pathname}`,
      pathname,
    }));
    const fd = makeFormData([
      { name: "Bloomberg News 1.pdf", size: 2048, type: "application/pdf" },
    ]);
    const res = await callPost(fd);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.uploaded).toHaveLength(1);
    expect(body.uploaded[0].pathname).toMatch(/^bloomberg-pdfs\/\d{8}-\d{6}-0-/);
    expect(body.uploaded[0].pathname).toMatch(/\.pdf$/);
    expect(body.uploaded[0].size_bytes).toBe(2048);
    expect(putMock).toHaveBeenCalledTimes(1);
  });
});
