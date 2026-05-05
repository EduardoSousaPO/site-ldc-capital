import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  __APPROVAL_TOKEN_INTERNALS,
  __resetApprovalTokenStorageForTests,
  __setApprovalTokenClientForTests,
  createApprovalToken,
  expirePendingTokensOlderThan,
  findValidTokenByRaw,
  inspectToken,
  markTokenAsUsed,
} from "../approval-token-storage";

interface ChainResult {
  data: unknown;
  error: { message: string } | null;
}

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {};
  const fn = () => chain;
  chain.select = vi.fn(fn);
  chain.insert = vi.fn(fn);
  chain.update = vi.fn(fn);
  chain.eq = vi.fn(fn);
  chain.lt = vi.fn(fn);
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  // Permite que .update().eq().select() resolva ao final como array (.then-able)
  chain.then = (resolve: (v: ChainResult) => unknown) => resolve(result);
  return chain;
}

function makeMockClient(byTable: Record<string, ChainResult>): {
  client: SupabaseClient;
  fromSpy: ReturnType<typeof vi.fn>;
} {
  const fromSpy = vi.fn((table: string) => {
    const r = byTable[table] ?? { data: null, error: null };
    return makeChain(r);
  });
  return {
    client: { from: fromSpy } as unknown as SupabaseClient,
    fromSpy,
  };
}

describe("approval-token-storage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key-fake");
    __resetApprovalTokenStorageForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    __resetApprovalTokenStorageForTests();
    vi.restoreAllMocks();
  });

  it("createApprovalToken: armazena SHA-256 hash, retorna raw_token (64 hex) e expires_at", async () => {
    const insertedRow = { id: "11111111-1111-4111-8111-111111111111" };
    const { client } = makeMockClient({
      BlogPostApprovalToken: { data: insertedRow, error: null },
    });
    __setApprovalTokenClientForTests(client);

    const result = await createApprovalToken(
      "post-id-1",
      "marcos@example.com",
      {
        rawTokenGenerator: () => "deterministic-raw-token-32-bytes-hex-fake",
        now: () => new Date("2026-05-02T10:00:00Z"),
        tokenTtlMs: 7 * 24 * 60 * 60 * 1000,
      },
    );

    expect(result.raw_token).toBe(
      "deterministic-raw-token-32-bytes-hex-fake",
    );
    expect(result.token_id).toBe("11111111-1111-4111-8111-111111111111");
    // 7 dias depois
    expect(result.expires_at).toBe("2026-05-09T10:00:00.000Z");
    // Hash determinístico SHA-256 do raw_token
    const expectedHash = createHash("sha256")
      .update("deterministic-raw-token-32-bytes-hex-fake")
      .digest("hex");
    expect(__APPROVAL_TOKEN_INTERNALS.hashToken(result.raw_token)).toBe(
      expectedHash,
    );
  });

  it("findValidTokenByRaw: rejeita token expirado retornando null", async () => {
    const expiredRow = {
      id: "22222222-2222-4222-8222-222222222222",
      blog_post_id: "post-id-2",
      recipient_email: "marcos@example.com",
      status: "pending",
      expires_at: "2026-04-01T10:00:00Z", // já passou (hoje 2026-05-02)
      used_at: null,
    };
    const { client } = makeMockClient({
      BlogPostApprovalToken: { data: expiredRow, error: null },
    });
    __setApprovalTokenClientForTests(client);

    const result = await findValidTokenByRaw("any-raw-token", {
      now: () => new Date("2026-05-02T10:00:00Z"),
    });
    expect(result).toBeNull();
  });

  it("findValidTokenByRaw: rejeita token já usado (status != pending)", async () => {
    const usedRow = {
      id: "33333333-3333-4333-8333-333333333333",
      blog_post_id: "post-id-3",
      recipient_email: "marcos@example.com",
      status: "approved", // já foi aprovado
      expires_at: "2026-05-09T10:00:00Z",
      used_at: "2026-05-02T11:00:00Z",
    };
    const { client } = makeMockClient({
      BlogPostApprovalToken: { data: usedRow, error: null },
    });
    __setApprovalTokenClientForTests(client);

    const result = await findValidTokenByRaw("any-raw-token", {
      now: () => new Date("2026-05-02T10:00:00Z"),
    });
    expect(result).toBeNull();
  });

  it("findValidTokenByRaw: aceita token pending + não expirado + não usado", async () => {
    const validRow = {
      id: "44444444-4444-4444-8444-444444444444",
      blog_post_id: "post-id-4",
      recipient_email: "marcos@example.com",
      status: "pending",
      expires_at: "2026-05-09T10:00:00Z",
      used_at: null,
    };
    const { client } = makeMockClient({
      BlogPostApprovalToken: { data: validRow, error: null },
    });
    __setApprovalTokenClientForTests(client);

    const result = await findValidTokenByRaw("raw-token", {
      now: () => new Date("2026-05-02T10:00:00Z"),
    });
    expect(result).toEqual({
      id: "44444444-4444-4444-8444-444444444444",
      blog_post_id: "post-id-4",
      recipient_email: "marcos@example.com",
    });
  });

  it("inspectToken: retorna estado completo (incluindo já usado) para diferenciar mensagem", async () => {
    const usedRow = {
      id: "55555555-5555-4555-8555-555555555555",
      blog_post_id: "post-id-5",
      recipient_email: "marcos@example.com",
      status: "approved",
      expires_at: "2026-05-09T10:00:00Z",
      used_at: "2026-05-02T12:00:00Z",
    };
    const { client } = makeMockClient({
      BlogPostApprovalToken: { data: usedRow, error: null },
    });
    __setApprovalTokenClientForTests(client);

    const result = await inspectToken("raw-token");
    expect(result?.status).toBe("approved");
    expect(result?.used_at).toBe("2026-05-02T12:00:00Z");
  });

  it("markTokenAsUsed: atualiza status + used_at sem throw", async () => {
    const updateChain = makeChain({ data: null, error: null });
    const fromSpy = vi.fn(() => updateChain);
    __setApprovalTokenClientForTests({
      from: fromSpy,
    } as unknown as SupabaseClient);

    await expect(
      markTokenAsUsed(
        "11111111-1111-4111-8111-111111111111",
        "approved",
        { now: () => new Date("2026-05-02T10:00:00Z") },
      ),
    ).resolves.toBeUndefined();

    const updatePayload = (updateChain.update as ReturnType<typeof vi.fn>)
      .mock.calls[0]?.[0];
    expect(updatePayload).toMatchObject({
      status: "approved",
      used_at: "2026-05-02T10:00:00.000Z",
    });
  });

  it("expirePendingTokensOlderThan: marca tokens vencidos como 'expired' e retorna count", async () => {
    const updatedRows = [
      { id: "tok-1" },
      { id: "tok-2" },
      { id: "tok-3" },
    ];
    const updateChain = makeChain({ data: updatedRows, error: null });
    __setApprovalTokenClientForTests({
      from: vi.fn(() => updateChain),
    } as unknown as SupabaseClient);

    const count = await expirePendingTokensOlderThan(7, {
      now: () => new Date("2026-05-02T10:00:00Z"),
    });
    expect(count).toBe(3);
    const updatePayload = (updateChain.update as ReturnType<typeof vi.fn>)
      .mock.calls[0]?.[0];
    expect(updatePayload).toMatchObject({ status: "expired" });
  });
});
