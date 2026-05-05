import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

// vi.mock é içado ao topo do módulo; usamos vi.hoisted para que os mocks
// existam antes da execução da factory.
const { insertMock, fromMock, createClientMock } = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));
  const createClient = vi.fn(() => ({ from }));
  return { insertMock: insert, fromMock: from, createClientMock: createClient };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import { TelemetryEvent } from "../../contracts/telemetry";
import { __resetNewsTelemetryClientForTests } from "../client";
import { extractRequestMeta } from "../extract-request-meta";
import { hashIp } from "../hash-ip";
import { track } from "../track";

const SAMPLE_IP_HASH =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

const VALID_EVENT = {
  type: "view" as const,
  briefing_slug: "exemplo-slug",
  ip_hash: SAMPLE_IP_HASH,
  user_agent: "Mozilla/5.0 (Test)",
  ts: "2026-04-27T12:00:00.000Z",
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  delete process.env.NEWS_IP_HASH_SALT;

  insertMock.mockReset();
  fromMock.mockClear();
  createClientMock.mockClear();
  insertMock.mockResolvedValue({ data: null, error: null });

  __resetNewsTelemetryClientForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TelemetryEvent.parse — RF-015 (contrato Zod canônico)", () => {
  it("aceita evento válido (type=view, ip_hash sha256 hex 64 chars)", () => {
    const parsed = TelemetryEvent.parse(VALID_EVENT);
    expect(parsed.type).toBe("view");
    expect(parsed.ip_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(parsed.briefing_slug).toBe("exemplo-slug");
  });

  it("rejeita ip_hash que não é sha256 hex 64 chars (Anti-SPEC §6.2)", () => {
    expect(() =>
      TelemetryEvent.parse({ ...VALID_EVENT, ip_hash: "not-a-hash" }),
    ).toThrow(ZodError);
  });

  it("rejeita type fora do enum permitido", () => {
    expect(() =>
      TelemetryEvent.parse({ ...VALID_EVENT, type: "click" }),
    ).toThrow(ZodError);
  });
});

describe("hashIp — RNF-007 (sem PII em texto puro)", () => {
  it("retorna sha256 hex de 64 chars determinístico (Anti-SPEC §6.2)", () => {
    const a = hashIp("203.0.113.42");
    const b = hashIp("203.0.113.42");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("respeita NEWS_IP_HASH_SALT ao calcular o hash", () => {
    const semSalt = hashIp("203.0.113.42");
    process.env.NEWS_IP_HASH_SALT = "salt-secreto";
    const comSalt = hashIp("203.0.113.42");
    expect(comSalt).not.toBe(semSalt);
    expect(comSalt).toMatch(/^[a-f0-9]{64}$/);
  });

  it("nunca devolve o IP em texto puro", () => {
    const ip = "203.0.113.42";
    const hashed = hashIp(ip);
    expect(hashed).not.toContain(ip);
  });
});

describe("extractRequestMeta — Anti-SPEC §6.2 / §6.3 (server-side)", () => {
  it("extrai ip_hash de x-forwarded-for (primeiro IP) sem expor IP", () => {
    const req = new Request("https://ldccapital.com.br/news/exemplo", {
      headers: {
        "x-forwarded-for": "203.0.113.42, 10.0.0.1",
        "user-agent": "Mozilla/5.0",
      },
    });

    const meta = extractRequestMeta(req);

    expect(meta.ip_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(meta.ip_hash).toBe(hashIp("203.0.113.42"));
    expect(meta.user_agent).toBe("Mozilla/5.0");
    expect(meta.referer).toBeUndefined();
  });

  it("trunca user_agent em 500 chars (alinhado ao schema)", () => {
    const longUa = "U".repeat(800);
    const req = new Request("https://ldccapital.com.br/news/exemplo", {
      headers: {
        "x-forwarded-for": "203.0.113.42",
        "user-agent": longUa,
      },
    });

    const meta = extractRequestMeta(req);
    expect(meta.user_agent.length).toBe(500);
  });
});

describe("track — CA-029 + Anti-SPEC §6.3 (telemetria nunca quebra UX)", () => {
  it("CA-029: chama insert em news_events com payload validado pelo Zod", async () => {
    await track(VALID_EVENT);

    expect(fromMock).toHaveBeenCalledWith("news_events");
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "view",
        briefing_slug: "exemplo-slug",
        ip_hash: VALID_EVENT.ip_hash,
        user_agent: "Mozilla/5.0 (Test)",
        ts: "2026-04-27T12:00:00.000Z",
      }),
    );
  });

  it("Anti-SPEC §6.3: erro do Supabase NÃO faz throw (não bloqueia caller)", async () => {
    insertMock.mockResolvedValueOnce({
      data: null,
      error: { message: "supabase down" },
    });
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(track(VALID_EVENT)).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("falha ao inserir evento"),
      "supabase down",
    );
  });

  it("Anti-SPEC §6.3: exceção inesperada no client é capturada (não propaga)", async () => {
    insertMock.mockRejectedValueOnce(new Error("network exploded"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(track(VALID_EVENT)).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("payload inválido (uso interno errado) lança ZodError — não silenciar bug", async () => {
    const bad = { ...VALID_EVENT, ip_hash: "obviously-not-a-sha256" };
    await expect(track(bad as never)).rejects.toBeInstanceOf(ZodError);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
