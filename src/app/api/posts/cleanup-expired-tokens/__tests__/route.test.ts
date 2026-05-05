import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const expireMock = vi.fn();

vi.mock("@/features/news/persistence/approval-token-storage", () => ({
  expirePendingTokensOlderThan: expireMock,
}));

const CRON_SECRET = "test-cleanup-cron-secret-fake";

describe("/api/posts/cleanup-expired-tokens", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    expireMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retorna 401 quando Authorization ausente (RNF-007)", async () => {
    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/posts/cleanup-expired-tokens",
      { method: "GET" },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    expect(expireMock).not.toHaveBeenCalled();
  });

  it("retorna 401 quando Authorization usa secret incorreto (timing-safe)", async () => {
    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/posts/cleanup-expired-tokens",
      {
        method: "GET",
        headers: { Authorization: "Bearer wrong-secret" },
      },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    expect(expireMock).not.toHaveBeenCalled();
  });

  it("retorna 200 + JSON com expired_count quando CRON_SECRET válido (chama expirePendingTokensOlderThan(7))", async () => {
    expireMock.mockResolvedValueOnce(3);
    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/posts/cleanup-expired-tokens",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.expired_count).toBe(3);
    expect(body.ttl_days).toBe(7);
    expect(typeof body.ts).toBe("string");
    expect(expireMock).toHaveBeenCalledTimes(1);
    expect(expireMock).toHaveBeenCalledWith(7);
  });

  it("retorna 500 e log estruturado quando expirePendingTokensOlderThan falha", async () => {
    expireMock.mockRejectedValueOnce(new Error("supabase down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { GET } = await import("../route");
    const req = new Request(
      "https://example.com/api/posts/cleanup-expired-tokens",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(500);
    expect(errorSpy).toHaveBeenCalled();
    const logged = String(errorSpy.mock.calls[0]?.[0] ?? "");
    expect(logged).toContain("tokens_cleanup_failed");
    expect(logged).toContain("supabase down");
  });
});
