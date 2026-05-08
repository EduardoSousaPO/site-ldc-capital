/**
 * F-016b — Testes /api/admin/bloomberg-pdfs/trigger-pipeline (dual auth).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkAdminAuthMock = vi.fn();
const runPipelineMock = vi.fn();

vi.mock("@/lib/auth-check", () => ({
  checkAdminAuth: checkAdminAuthMock,
}));

vi.mock("@/features/news/pipeline/orchestrator", () => ({
  runPipeline: runPipelineMock,
}));

const CRON_SECRET = "test-cron-secret-trigger";

const fakeResult = {
  run_id: "00000000-0000-0000-0000-000000000001",
  status: "success" as const,
  briefings_pending_review: 2,
  briefings_blocked: 0,
  themes_discarded: 1,
  duration_ms: 12345,
};

describe("/api/admin/bloomberg-pdfs/trigger-pipeline (POST)", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    vi.stubEnv("NEWS_PIPELINE_ENABLED", "true");
    checkAdminAuthMock.mockReset();
    runPipelineMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retorna 401 quando sem auth (sem session, sem CRON_SECRET)", async () => {
    checkAdminAuthMock.mockResolvedValueOnce(null);
    const { POST } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/bloomberg-pdfs/trigger-pipeline",
      { method: "POST" },
    );
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    expect(runPipelineMock).not.toHaveBeenCalled();
  });

  it("retorna 503 com mensagem clara quando NEWS_PIPELINE_ENABLED!=true", async () => {
    vi.stubEnv("NEWS_PIPELINE_ENABLED", "false");
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    const { POST } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/bloomberg-pdfs/trigger-pipeline",
      { method: "POST" },
    );
    const res = await POST(req as never);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("pipeline_disabled");
    expect(body.message).toMatch(/Pipeline desligado/i);
    expect(runPipelineMock).not.toHaveBeenCalled();
  });

  it("aceita sessão admin e chama runPipeline com manual_upload", async () => {
    checkAdminAuthMock.mockResolvedValueOnce({
      id: "u1",
      email: "ed@example.com",
      role: "ADMIN",
    });
    runPipelineMock.mockResolvedValueOnce(fakeResult);
    const { POST } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/bloomberg-pdfs/trigger-pipeline",
      { method: "POST" },
    );
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.run_id).toBe(fakeResult.run_id);
    expect(runPipelineMock).toHaveBeenCalledTimes(1);
    expect(runPipelineMock).toHaveBeenCalledWith({
      trigger_type: "manual_upload",
    });
  });

  it("aceita CRON_SECRET via Authorization Bearer (timing-safe)", async () => {
    checkAdminAuthMock.mockResolvedValue(null);
    runPipelineMock.mockResolvedValueOnce(fakeResult);
    const { POST } = await import("../route");
    const req = new Request(
      "https://example.com/api/admin/bloomberg-pdfs/trigger-pipeline",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      },
    );
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(runPipelineMock).toHaveBeenCalledWith({
      trigger_type: "manual_upload",
    });
    // Não chamou checkAdminAuth porque o secret bateu antes
    expect(checkAdminAuthMock).not.toHaveBeenCalled();
  });
});
