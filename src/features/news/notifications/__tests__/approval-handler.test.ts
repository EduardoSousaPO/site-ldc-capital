import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetApprovalHandlerForTests,
  handleApproval,
  type HandleApprovalDeps,
} from "../approval-handler";
import type { InspectTokenResult } from "../approval-handler";
import type {
  inspectToken,
  markTokenAsUsed,
} from "@/features/news/persistence/approval-token-storage";
import type { track } from "@/features/news/telemetry/track";

type BlogPostClient = NonNullable<HandleApprovalDeps["blogPostClient"]>;

interface BlogPostSelectResult {
  data: { slug: string; published: boolean } | null;
  error: { message: string } | null;
}

interface BlogPostUpdateResult {
  data: { slug: string } | null;
  error: { message: string } | null;
}

function makeBlogPostMock(opts: {
  selectResult: BlogPostSelectResult;
  updateResult: BlogPostUpdateResult;
}) {
  const updateMaybeSingle = vi.fn(() => Promise.resolve(opts.updateResult));
  const updateSelect = vi.fn(() => ({ maybeSingle: updateMaybeSingle }));
  const updateEq = vi.fn(() => ({ select: updateSelect }));
  const update = vi.fn(() => ({ eq: updateEq }));

  const selectMaybeSingle = vi.fn(() => Promise.resolve(opts.selectResult));
  const selectEq = vi.fn(() => ({ maybeSingle: selectMaybeSingle }));
  const select = vi.fn(() => ({ eq: selectEq }));

  const fromSpy = vi.fn(() => ({
    update,
    select,
  }));
  return {
    blogPostClient: { from: fromSpy } as unknown as BlogPostClient,
    fromSpy,
    update,
    updateMaybeSingle,
  };
}

const validRawToken = "a".repeat(64);

const validTokenState: InspectTokenResult = {
  id: "11111111-1111-4111-8111-111111111111",
  blog_post_id: "post-id-1",
  recipient_email: "marcos@example.com",
  status: "pending",
  expires_at: "2026-05-09T10:00:00Z",
  used_at: null,
};

describe("handleApproval", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key-fake");
    vi.stubEnv("NEWS_IP_HASH_SALT", "");
    __resetApprovalHandlerForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    __resetApprovalHandlerForTests();
    vi.restoreAllMocks();
  });

  it("approve: token válido → BlogPost UPDATE published=true + token marked + telemetria 'published'", async () => {
    const inspectSpy = vi.fn<typeof inspectToken>(async () => validTokenState);
    const markUsedSpy = vi.fn<typeof markTokenAsUsed>(async () => undefined);
    const trackSpy = vi.fn<typeof track>(async () => undefined);
    const blogPostMock = makeBlogPostMock({
      selectResult: {
        data: { slug: "test-slug-1", published: false },
        error: null,
      },
      updateResult: { data: { slug: "test-slug-1" }, error: null },
    });

    const req = new Request(
      `https://example.com/api/posts/approve?token=${validRawToken}`,
    );
    const res = await handleApproval(req, "approve", {
      inspect: inspectSpy,
      markUsed: markUsedSpy,
      trackEvent: trackSpy,
      blogPostClient: blogPostMock.blogPostClient,
      now: () => new Date("2026-05-02T15:00:00Z"),
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Artigo publicado");

    // BlogPost UPDATE foi chamado com published=true
    const updateCall = (blogPostMock.update as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(updateCall).toMatchObject({
      published: true,
      publishedAt: "2026-05-02T15:00:00.000Z",
    });

    // Token marked
    expect(markUsedSpy).toHaveBeenCalledWith(
      validTokenState.id,
      "approved",
      expect.anything(),
    );

    // Telemetria
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "published",
        briefing_slug: "test-slug-1",
      }),
    );
  });

  it("approve: token inválido (não existe) → 200 HTML 'Link inválido'", async () => {
    const inspectSpy = vi.fn<typeof inspectToken>(async () => null);
    const markUsedSpy = vi.fn<typeof markTokenAsUsed>(async () => undefined);
    const trackSpy = vi.fn<typeof track>(async () => undefined);

    const req = new Request(
      `https://example.com/api/posts/approve?token=${validRawToken}`,
    );
    const res = await handleApproval(req, "approve", {
      inspect: inspectSpy,
      markUsed: markUsedSpy,
      trackEvent: trackSpy,
      now: () => new Date("2026-05-02T15:00:00Z"),
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Link inválido");
    expect(markUsedSpy).not.toHaveBeenCalled();
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it("approve: idempotência — token já usado retorna 'Esta ação já foi processada' sem re-publicar", async () => {
    const usedTokenState: InspectTokenResult = {
      ...validTokenState,
      status: "approved",
      used_at: "2026-05-02T11:00:00Z",
    };
    const inspectSpy = vi.fn<typeof inspectToken>(async () => usedTokenState);
    const markUsedSpy = vi.fn<typeof markTokenAsUsed>(async () => undefined);
    const trackSpy = vi.fn<typeof track>(async () => undefined);

    const req = new Request(
      `https://example.com/api/posts/approve?token=${validRawToken}`,
    );
    const res = await handleApproval(req, "approve", {
      inspect: inspectSpy,
      markUsed: markUsedSpy,
      trackEvent: trackSpy,
      now: () => new Date("2026-05-02T15:00:00Z"),
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("já foi processada");
    expect(html).toContain("approved");
    // NÃO chamou markUsed (já estava usado) nem track (não duplica evento)
    expect(markUsedSpy).not.toHaveBeenCalled();
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it("reject: token válido → token marked, BlogPost intacto, telemetria 'rejected'", async () => {
    const inspectSpy = vi.fn<typeof inspectToken>(async () => validTokenState);
    const markUsedSpy = vi.fn<typeof markTokenAsUsed>(async () => undefined);
    const trackSpy = vi.fn<typeof track>(async () => undefined);
    const blogPostMock = makeBlogPostMock({
      selectResult: {
        data: { slug: "test-slug-1", published: false },
        error: null,
      },
      updateResult: { data: null, error: null },
    });

    const req = new Request(
      `https://example.com/api/posts/reject?token=${validRawToken}`,
    );
    const res = await handleApproval(req, "reject", {
      inspect: inspectSpy,
      markUsed: markUsedSpy,
      trackEvent: trackSpy,
      blogPostClient: blogPostMock.blogPostClient,
      now: () => new Date("2026-05-02T15:00:00Z"),
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Artigo rejeitado");

    // BlogPost UPDATE NÃO foi chamado (rejeitar não muda BlogPost)
    expect(blogPostMock.update).not.toHaveBeenCalled();

    // Token marked como rejected
    expect(markUsedSpy).toHaveBeenCalledWith(
      validTokenState.id,
      "rejected",
      expect.anything(),
    );

    // Telemetria 'rejected'
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "rejected",
        briefing_slug: "test-slug-1",
      }),
    );
  });

  it("approve: token expirado → 200 HTML 'Link expirado'", async () => {
    const expiredTokenState: InspectTokenResult = {
      ...validTokenState,
      expires_at: "2026-04-25T10:00:00Z", // já passou
    };
    const inspectSpy = vi.fn<typeof inspectToken>(
      async () => expiredTokenState,
    );
    const markUsedSpy = vi.fn<typeof markTokenAsUsed>(async () => undefined);
    const trackSpy = vi.fn<typeof track>(async () => undefined);

    const req = new Request(
      `https://example.com/api/posts/approve?token=${validRawToken}`,
    );
    const res = await handleApproval(req, "approve", {
      inspect: inspectSpy,
      markUsed: markUsedSpy,
      trackEvent: trackSpy,
      now: () => new Date("2026-05-02T15:00:00Z"),
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Link expirado");
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it("approve: query string sem token → 200 HTML 'Link inválido'", async () => {
    const inspectSpy = vi.fn<typeof inspectToken>(async () => null);
    const req = new Request("https://example.com/api/posts/approve");
    const res = await handleApproval(req, "approve", {
      inspect: inspectSpy,
      now: () => new Date("2026-05-02T15:00:00Z"),
    });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Link inválido");
    expect(inspectSpy).not.toHaveBeenCalled();
  });
});
