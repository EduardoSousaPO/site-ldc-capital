import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runPipeline } from "../orchestrator";
import type { insertBlogPost, updatePipelineRun } from "../blogpost-db";
import type {
  createApprovalToken,
} from "@/features/news/persistence/approval-token-storage";
import type {
  sendApprovalEmail,
} from "@/features/news/notifications/approval-email";
import type { persistBlockedDraft } from "../blocked-draft-storage";
import type { track } from "@/features/news/telemetry/track";
import type { BlogArticleDraft } from "@/features/news/contracts/openai";
import type { PdfExtractionResult } from "@/features/news/contracts/pipeline";
import type { PerplexityResponse } from "@/features/news/contracts/perplexity";
import type { BloombergPdfRef } from "../pdf-storage";

function makePdf(id: string): BloombergPdfRef {
  return {
    id,
    filename: `${id}.pdf`,
    buffer: Buffer.from("PDF binary stub"),
    source: "filesystem",
  };
}

function makeExtraction(pdf_id: string): PdfExtractionResult {
  return {
    pdf_id,
    format: "PBN",
    text_normalized:
      "Conteúdo Bloomberg interno (sinal). Não cita Bloomberg em nenhum produto editorial.",
    text_length: 90,
    used_gemini_fallback: false,
    auto_translated: false,
    table_data_blocks: [],
    filtered_sections: [],
  };
}

function makePerplexityResponse(
  tema: string,
  hasCoverage: boolean,
): PerplexityResponse {
  return {
    query: `Q sobre ${tema}`,
    tema_categoria: tema,
    content: hasCoverage
      ? "Conteúdo Perplexity rico com fontes públicas reais."
      : "Sem cobertura pública.",
    citations: hasCoverage
      ? [
          {
            url: "https://www.reuters.com/test/abc",
            title: "Reuters",
            dominio: "reuters.com",
          },
          {
            url: "https://www.ft.com/test/xyz",
            title: "FT",
            dominio: "ft.com",
          },
        ]
      : [],
    has_public_coverage: hasCoverage,
  };
}

function makeArticle(overrides: Partial<BlogArticleDraft> = {}): BlogArticleDraft {
  const base: BlogArticleDraft = {
    title: "Como o BoJ virou banco central emergente em 2026 — implicações UHNW",
    slug: "boj-banco-central-emergente-2026",
    categoria_slug: "macro-global",
    summary:
      "Pela primeira vez em duas décadas, o BoJ se comporta como banco central emergente. Para famílias UHNW com legacy positions em iene, o trade-off entre câmbio e sucessão mudou de natureza.",
    hook: "Pela primeira vez desde a virada do milênio, o Banco do Japão se comportou em 2026 como banco central emergente, alterando os incentivos para alocação patrimonial UHNW.",
    body_markdown:
      "Pela primeira vez desde a virada do milênio, o Banco do Japão se comportou em 2026 como banco central emergente. " +
      "Conteúdo denso e técnico cobrindo 800-1500 palavras de análise macro. ".repeat(70),
    cenarios: [
      {
        titulo: "Aceleração do BoJ",
        descricao: "Inflação acima de 2,5% leva BoJ a 1,25% até dezembro.",
        gatilho: "Reunião BoJ de julho",
      },
      {
        titulo: "Recessão global",
        descricao: "ISM EUA abaixo de 45 contrai diferencial Fed-BoJ.",
        gatilho: "Payroll de junho",
      },
    ],
    fontes: [
      {
        url: "https://www.reuters.com/markets/asia/jgb-2026",
        title: "JGB 30Y yield",
        dominio: "reuters.com",
      },
      {
        url: "https://www.ft.com/content/yen-2026",
        title: "Yen revaluation",
        dominio: "ft.com",
      },
    ],
    fonte_origem_pdf_ids: ["pdf-1"],
  };
  return { ...base, ...overrides };
}

describe("orchestrator / runPipeline", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-fake");
    vi.stubEnv("PERPLEXITY_API_KEY", "pplx-test-fake");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key-fake");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("e2e fluxo completo: PDF → Perplexity → OpenAI → BlogPost INSERT (mocks externos)", async () => {
    const insertSpy = vi.fn<typeof insertBlogPost>(async () => ({
      id: "post-id-1",
      slug: "boj-banco-central-emergente-2026",
    }));
    const trackSpy = vi.fn<typeof track>(async () => undefined);
    const updateRunSpy = vi.fn(async () => undefined);

    const result = await runPipeline(
      { trigger_type: "cron_morning", turno: "manha" },
      {
        listPdfs: async () => [makePdf("pdf-1")],
        loadPdf: async () => null,
        extract: async (_buf, opts) =>
          makeExtraction(opts?.pdf_id ?? "pdf-1"),
        queryPerp: async () => makePerplexityResponse("macro_global", true),
        generate: async () => ({
          articles: [makeArticle()],
          themes_discarded: [],
          metadata: {
            model: "gpt-5-mini",
            total_tokens: 6500,
            cached_tokens: 4000,
            cost_brl: 0.42,
          },
        }),
        recordRun: async () => ({ run_id: "11111111-1111-4111-8111-111111111111" }),
        updateRun: updateRunSpy,
        findCategory: async () => ({
          id: "72859827-299e-4b95-8067-bee799ba3937",
          name: "Macro Global",
        }),
        findExisting: async () => null,
        insertPost: insertSpy,
        authorId: async () => "user-admin-1",
        trackEvent: trackSpy,
        now: () => new Date("2026-05-02T10:00:00Z"),
      },
    );

    expect(result.run_id).toBe("11111111-1111-4111-8111-111111111111");
    expect(result.status).toBe("success");
    expect(result.briefings_pending_review).toBe(1);
    expect(result.briefings_blocked).toBe(0);
    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy.mock.calls[0]?.[0]).toMatchObject({
      categoryId: "72859827-299e-4b95-8067-bee799ba3937",
      categoryName: "Macro Global",
      authorId: "user-admin-1",
    });
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "published",
        briefing_slug: "boj-banco-central-emergente-2026",
      }),
    );
    expect(updateRunSpy).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      expect.objectContaining({
        status: "success",
        briefings_generated: 1,
        briefings_blocked: 0,
        openai_cost_brl: 0.42,
      }),
    );
  });

  it("tema sem cobertura pública é descartado e contabilizado em themes_discarded_no_public_source", async () => {
    const trackSpy = vi.fn<typeof track>(async () => undefined);
    const updateRunSpy = vi.fn(async () => undefined);

    const result = await runPipeline(
      { trigger_type: "cron_morning", turno: "manha" },
      {
        listPdfs: async () => [makePdf("pdf-1")],
        loadPdf: async () => null,
        extract: async (_buf, opts) =>
          makeExtraction(opts?.pdf_id ?? "pdf-1"),
        // Perplexity retorna SEM cobertura pública para o primeiro tema.
        queryPerp: async (q) =>
          makePerplexityResponse(q.tema_categoria, false),
        generate: async () => ({
          articles: [],
          themes_discarded: [
            { tema: "macro_global", reason: "no_public_source" },
            { tema: "geopolitica", reason: "no_public_source" },
          ],
          metadata: {
            model: "gpt-5-mini",
            total_tokens: 1200,
            cached_tokens: 1000,
            cost_brl: 0.05,
          },
        }),
        recordRun: async () => ({ run_id: "22222222-2222-4222-8222-222222222222" }),
        updateRun: updateRunSpy,
        findCategory: async () => ({ id: "x", name: "x" }),
        findExisting: async () => null,
        insertPost: async () => ({ id: "x", slug: "x" }),
        authorId: async () => "user-admin-1",
        trackEvent: trackSpy,
        now: () => new Date("2026-05-02T10:00:00Z"),
      },
    );

    expect(result.briefings_pending_review).toBe(0);
    expect(result.themes_discarded).toBe(2);
    const discardCalls = trackSpy.mock.calls.filter(
      (c) =>
        (c[0] as { type: string }).type ===
        "theme_discarded_no_public_source",
    );
    expect(discardCalls).toHaveLength(2);
    expect(updateRunSpy).toHaveBeenCalledWith(
      "22222222-2222-4222-8222-222222222222",
      expect.objectContaining({
        themes_discarded_no_public_source: 2,
        briefings_generated: 0,
      }),
    );
  });

  it("compliance bloqueia artigo com ticker → não insere e contabiliza briefings_blocked", async () => {
    const insertSpy = vi.fn<typeof insertBlogPost>();
    const trackSpy = vi.fn<typeof track>(async () => undefined);
    const updateRunSpy = vi.fn(async () => undefined);

    // Artigo com ticker BR no body — runComplianceCheck (engine F-005, real) deve bloquear.
    const articleWithTicker = makeArticle({
      slug: "artigo-com-ticker-br-bloqueado",
      title: "Análise denso macro Brasil com ticker incidental no corpo do artigo",
      body_markdown:
        "PETR4 lidera as altas após divulgação do resultado trimestral. " +
        "Conteúdo denso e técnico cobrindo análise macro. ".repeat(80),
    });

    const result = await runPipeline(
      { trigger_type: "cron_morning", turno: "manha" },
      {
        listPdfs: async () => [makePdf("pdf-1")],
        loadPdf: async () => null,
        extract: async (_buf, opts) =>
          makeExtraction(opts?.pdf_id ?? "pdf-1"),
        queryPerp: async () => makePerplexityResponse("macro_brasil", true),
        generate: async () => ({
          articles: [articleWithTicker],
          themes_discarded: [],
          metadata: {
            model: "gpt-5-mini",
            total_tokens: 5000,
            cached_tokens: 3000,
            cost_brl: 0.32,
          },
        }),
        recordRun: async () => ({ run_id: "33333333-3333-4333-8333-333333333333" }),
        updateRun: updateRunSpy,
        findCategory: async () => ({ id: "x", name: "x" }),
        findExisting: async () => null,
        insertPost: insertSpy,
        authorId: async () => "user-admin-1",
        trackEvent: trackSpy,
        now: () => new Date("2026-05-02T10:00:00Z"),
      },
    );

    expect(insertSpy).not.toHaveBeenCalled();
    expect(result.briefings_blocked).toBe(1);
    expect(result.briefings_pending_review).toBe(0);
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blocked_compliance",
        briefing_slug: "artigo-com-ticker-br-bloqueado",
      }),
    );
    expect(updateRunSpy).toHaveBeenCalledWith(
      "33333333-3333-4333-8333-333333333333",
      expect.objectContaining({
        briefings_blocked: 1,
        briefings_generated: 0,
      }),
    );
  });

  it("F-015b: compliance blocked → persistBlocked recebe draft completo + violations e URL vai para blocked_drafts_urls", async () => {
    const persistSpy = vi.fn<typeof persistBlockedDraft>(async () =>
      "https://blob.vercel-storage.com/news-blocked-drafts/abc/article.json",
    );
    const trackSpy = vi.fn<typeof track>(async () => undefined);
    const updateRunSpy = vi.fn(async () => undefined);

    const dirtyArticle = makeArticle({
      slug: "artigo-bloqueado-com-blob-persist",
      title: "Análise densa de macro Brasil com ticker para acionar compliance bloqueio",
      body_markdown:
        "PETR4 lidera as altas após divulgação do resultado trimestral. " +
        "Conteúdo denso e técnico. ".repeat(80),
    });

    await runPipeline(
      { trigger_type: "cron_morning", turno: "manha" },
      {
        listPdfs: async () => [makePdf("pdf-1")],
        loadPdf: async () => null,
        extract: async (_buf, opts) => makeExtraction(opts?.pdf_id ?? "pdf-1"),
        queryPerp: async () => makePerplexityResponse("macro_brasil", true),
        generate: async () => ({
          articles: [dirtyArticle],
          themes_discarded: [],
          metadata: {
            model: "gpt-5-mini",
            total_tokens: 5000,
            cached_tokens: 3000,
            cost_brl: 0.32,
          },
        }),
        recordRun: async () => ({
          run_id: "44444444-4444-4444-8444-444444444444",
        }),
        updateRun: updateRunSpy,
        findCategory: async () => ({ id: "x", name: "x" }),
        findExisting: async () => null,
        insertPost: vi.fn<typeof insertBlogPost>(),
        authorId: async () => "user-admin-1",
        trackEvent: trackSpy,
        persistBlocked: persistSpy,
        now: () => new Date("2026-05-02T10:00:00Z"),
      },
    );

    expect(persistSpy).toHaveBeenCalledTimes(1);
    const persistCall = persistSpy.mock.calls[0]?.[0];
    expect(persistCall).toMatchObject({
      run_id: "44444444-4444-4444-8444-444444444444",
      blocked_at: "2026-05-02T10:00:00.000Z",
    });
    // Draft completo presente para auditoria.
    expect(persistCall?.article.slug).toBe("artigo-bloqueado-com-blob-persist");
    expect(persistCall?.article.body_markdown).toContain("PETR4");
    // Violations capturadas (≥1, sendo o ticker BR a esperada).
    expect(persistCall?.violations.length).toBeGreaterThan(0);
    expect(persistCall?.violations.some((v) => v.type === "ticker_br")).toBe(true);

    // URL persistida volta para news_pipeline_runs.blocked_drafts_urls.
    expect(updateRunSpy).toHaveBeenCalledWith(
      "44444444-4444-4444-8444-444444444444",
      expect.objectContaining({
        briefings_blocked: 1,
        blocked_drafts_urls: [
          "https://blob.vercel-storage.com/news-blocked-drafts/abc/article.json",
        ],
      }),
    );
  });

  it("F-015b: compliance blocked com persistBlocked retornando null (Blob ausente) → fluxo continua, URL não vai para o update", async () => {
    const persistSpy = vi.fn<typeof persistBlockedDraft>(async () => null);
    const trackSpy = vi.fn<typeof track>(async () => undefined);
    const updateRunSpy = vi.fn<typeof updatePipelineRun>(async () => undefined);

    const dirtyArticle = makeArticle({
      slug: "artigo-bloqueado-sem-blob-token",
      title: "Análise densa de macro Brasil com ticker para acionar compliance bloqueio",
      body_markdown:
        "PETR4 lidera as altas após divulgação do resultado trimestral. " +
        "Conteúdo denso e técnico. ".repeat(80),
    });

    const result = await runPipeline(
      { trigger_type: "cron_morning", turno: "manha" },
      {
        listPdfs: async () => [makePdf("pdf-1")],
        loadPdf: async () => null,
        extract: async (_buf, opts) => makeExtraction(opts?.pdf_id ?? "pdf-1"),
        queryPerp: async () => makePerplexityResponse("macro_brasil", true),
        generate: async () => ({
          articles: [dirtyArticle],
          themes_discarded: [],
          metadata: {
            model: "gpt-5-mini",
            total_tokens: 5000,
            cached_tokens: 3000,
            cost_brl: 0.32,
          },
        }),
        recordRun: async () => ({
          run_id: "55555555-5555-4555-8555-555555555555",
        }),
        updateRun: updateRunSpy,
        findCategory: async () => ({ id: "x", name: "x" }),
        findExisting: async () => null,
        insertPost: vi.fn<typeof insertBlogPost>(),
        authorId: async () => "user-admin-1",
        trackEvent: trackSpy,
        persistBlocked: persistSpy,
        now: () => new Date("2026-05-02T10:00:00Z"),
      },
    );

    expect(persistSpy).toHaveBeenCalledTimes(1);
    expect(result.briefings_blocked).toBe(1);

    // updateRun não inclui blocked_drafts_urls quando não há URL persistida.
    const updateCall = updateRunSpy.mock.calls[0]?.[1];
    expect(updateCall?.blocked_drafts_urls).toBeUndefined();

    // Telemetria continua disparando.
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blocked_compliance",
        briefing_slug: "artigo-bloqueado-sem-blob-token",
      }),
    );
  });

  it("F-016: emite log estruturado approval_email_sent após sendApproval retornar messageId (Anti-SPEC §6.3 — só domain + cc_count)", async () => {
    vi.stubEnv(
      "NEWS_APPROVAL_RECIPIENT_EMAIL",
      "marcos.meneghel@ldccapital.com.br",
    );
    vi.stubEnv(
      "NEWS_APPROVAL_CC_EMAILS",
      "eduardo.sousa@ldccapital.com.br,luciano.herzog@ldccapital.com.br",
    );

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const insertSpy = vi.fn<typeof insertBlogPost>(async () => ({
      id: "post-id-f016",
      slug: "boj-banco-central-emergente-2026",
    }));
    const createTokenSpy = vi.fn<typeof createApprovalToken>(async () => ({
      raw_token: "raw-token-stub-fake",
      expires_at: "2026-05-11T10:00:00.000Z",
      token_id: "11111111-1111-4111-8111-111111111111",
    }));
    const sendApprovalSpy = vi.fn<typeof sendApprovalEmail>(async () => ({
      messageId: "msg-id-stub-from-resend",
    }));

    await runPipeline(
      { trigger_type: "cron_morning", turno: "manha" },
      {
        listPdfs: async () => [makePdf("pdf-1")],
        loadPdf: async () => null,
        extract: async (_buf, opts) =>
          makeExtraction(opts?.pdf_id ?? "pdf-1"),
        queryPerp: async () => makePerplexityResponse("macro_global", true),
        generate: async () => ({
          articles: [makeArticle()],
          themes_discarded: [],
          metadata: {
            model: "gpt-5-mini",
            total_tokens: 6500,
            cached_tokens: 4000,
            cost_brl: 0.42,
          },
        }),
        recordRun: async () => ({
          run_id: "66666666-6666-4666-8666-666666666666",
        }),
        updateRun: async () => undefined,
        findCategory: async () => ({
          id: "72859827-299e-4b95-8067-bee799ba3937",
          name: "Macro Global",
        }),
        findExisting: async () => null,
        insertPost: insertSpy,
        authorId: async () => "user-admin-1",
        trackEvent: vi.fn<typeof track>(async () => undefined),
        createToken: createTokenSpy,
        sendApproval: sendApprovalSpy,
        now: () => new Date("2026-05-04T10:00:00Z"),
      },
    );

    expect(createTokenSpy).toHaveBeenCalledTimes(1);
    expect(sendApprovalSpy).toHaveBeenCalledTimes(1);

    // Localiza o log estruturado approval_email_sent (vem como JSON string).
    const sentLog = infoSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .find((line) => line.includes("approval_email_sent"));
    expect(sentLog).toBeTruthy();

    const parsed = JSON.parse(sentLog as string);
    expect(parsed).toMatchObject({
      event: "approval_email_sent",
      run_id: "66666666-6666-4666-8666-666666666666",
      blog_post_id: "post-id-f016",
      article_slug: "boj-banco-central-emergente-2026",
      message_id: "msg-id-stub-from-resend",
      recipient_email_domain: "ldccapital.com.br",
      cc_count: 2,
    });

    // Anti-SPEC §6.3: nenhum email completo deve estar no log.
    expect(sentLog).not.toContain("marcos.meneghel@ldccapital.com.br");
    expect(sentLog).not.toContain("eduardo.sousa@ldccapital.com.br");
    expect(sentLog).not.toContain("luciano.herzog@ldccapital.com.br");
  });
});
