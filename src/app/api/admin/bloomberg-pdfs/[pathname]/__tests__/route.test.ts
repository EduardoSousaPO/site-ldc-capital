/**
 * F-016b — Testes /api/admin/bloomberg-pdfs/[pathname] (DELETE).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkAdminAuthMock = vi.fn();
const delMock = vi.fn();

vi.mock("@/lib/auth-check", () => ({
  checkAdminAuth: checkAdminAuthMock,
}));

vi.mock("@vercel/blob", () => ({
  del: delMock,
}));

async function callDelete(rawPathname: string) {
  const { DELETE } = await import("../route");
  const req = new Request(
    `https://example.com/api/admin/bloomberg-pdfs/${rawPathname}`,
    { method: "DELETE" },
  );
  return DELETE(req as never, {
    params: Promise.resolve({ pathname: rawPathname }),
  });
}

describe("/api/admin/bloomberg-pdfs/[pathname] (DELETE)", () => {
  beforeEach(() => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
    checkAdminAuthMock.mockReset();
    delMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retorna 401 quando sessão admin ausente", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(null);
    const res = await callDelete(
      encodeURIComponent("bloomberg-pdfs/test.pdf"),
    );
    expect(res.status).toBe(401);
    expect(delMock).not.toHaveBeenCalled();
  });

  it("rejeita pathname fora do prefixo bloomberg-pdfs/ (path traversal)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    const res = await callDelete(encodeURIComponent("other-folder/x.pdf"));
    expect(res.status).toBe(400);
    expect(delMock).not.toHaveBeenCalled();
  });

  it("rejeita pathname com '..' (path traversal)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    const res = await callDelete(
      encodeURIComponent("bloomberg-pdfs/../secrets.pdf"),
    );
    expect(res.status).toBe(400);
    expect(delMock).not.toHaveBeenCalled();
  });

  it("deleta com sucesso quando pathname válido", async () => {
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    delMock.mockResolvedValueOnce(undefined);
    const res = await callDelete(
      encodeURIComponent("bloomberg-pdfs/test.pdf"),
    );
    expect(res.status).toBe(200);
    expect(delMock).toHaveBeenCalledWith(
      "bloomberg-pdfs/test.pdf",
      expect.objectContaining({ token: "test-blob-token" }),
    );
  });
});
