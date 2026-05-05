import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CRON_SECRET = "test-cron-secret-32bytes-fake";

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", CRON_SECRET);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key-fake");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("/api/news/cron route", () => {
  it("retorna 401 quando Authorization header está ausente (RNF-007)", async () => {
    vi.stubEnv("NEWS_PIPELINE_ENABLED", "true");
    const { GET } = await import("../route");

    const req = new Request("https://example.com/api/news/cron", {
      method: "GET",
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("retorna 401 quando Authorization usa secret incorreto (timing-safe)", async () => {
    vi.stubEnv("NEWS_PIPELINE_ENABLED", "true");
    const { GET } = await import("../route");

    const req = new Request("https://example.com/api/news/cron", {
      method: "GET",
      headers: { Authorization: "Bearer wrong-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("retorna 503 quando NEWS_PIPELINE_ENABLED !== 'true' (feature flag)", async () => {
    vi.stubEnv("NEWS_PIPELINE_ENABLED", "false");
    const { GET } = await import("../route");

    const req = new Request("https://example.com/api/news/cron", {
      method: "GET",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("pipeline_disabled");
  });
});
