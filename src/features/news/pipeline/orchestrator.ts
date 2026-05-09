/**
 * Orchestrator do pipeline IA pós-pivot ADR-005 (artigo denso → BlogPost).
 *
 * Fluxo (RF-005 → RF-008 + ADR-005):
 *   1. recordPipelineRun → run_id (status="running")
 *   2. listLatestBloombergPdfs (até 4 PDFs)
 *   3. extractPdf paralelo (Gemini fallback embutido para PDFs raster)
 *   4. getQueriesForTurno + queryPerplexity paralelo
 *   5. Filtra Perplexity por has_public_coverage=true (defesa Anti-SPEC §6.2b)
 *   6. Monta BlogArticleGenerationRequest
 *   7. generateBlogArticles via openai-client (Structured Outputs + hard fail R$5)
 *   8. Para cada artigo retornado:
 *        a. runComplianceCheck (engine F-005, mapping campos novos→antigos)
 *        b. Idempotência via findExistingArticleBySlug
 *        c. findCategoryIdAndNameBySlug
 *        d. insertBlogPost (published=false; Marcos aprova via F-018)
 *        e. Telemetria F-009: published | blocked_compliance | duplicate
 *   9. updatePipelineRun(run_id, status="success" | "failed", métricas finais)
 *
 * Hard fails (throw): custo OpenAI > R$5 (OpenAiCostExceededError), erro de
 * extração/Perplexity em TODAS as fontes (zero signals AND zero public_sources
 * = pipeline aborta).
 *
 * Anti-SPEC §6.3: nunca logar conteúdo Bloomberg, conteúdo do artigo, nem
 * URLs de telemetria com PII. ip_hash sentinela "0"x64 marca origem cron/server.
 */

import { runComplianceCheck } from "@/features/news/compliance/checker";
import {
  BlogArticleGenerationRequest,
  type BlogArticleDraft,
  type BlogArticleGenerationResponse,
  type ThemeDiscarded,
  type CategoriaArtigoSlug,
} from "@/features/news/contracts/openai";
import {
  GenerationResult,
  type PdfExtractionResult,
  type TriggerType,
} from "@/features/news/contracts/pipeline";
import type { PerplexityResponse } from "@/features/news/contracts/perplexity";
import { getQueriesForTurno } from "@/features/news/prompts/turno-queries";
import { queryPerplexity } from "./perplexity-client";
import {
  extractPdf,
  GeminiFallbackUnavailableError,
} from "./extractor";
import {
  listLatestBloombergPdfs,
  loadBloombergPdfById,
  type BloombergPdfRef,
} from "./pdf-storage";
import {
  generateBlogArticles,
  OpenAiCostExceededError,
} from "./openai-client";
import {
  findCategoryIdAndNameBySlug,
  findExistingArticleBySlug,
  getEditorialAuthorId,
  insertBlogPost,
  recordPipelineRun,
  updatePipelineRun,
} from "./blogpost-db";
import { persistBlockedDraft } from "./blocked-draft-storage";
import { generateAndAttachCover } from "./cover-image-gen";
import { createApprovalToken } from "@/features/news/persistence/approval-token-storage";
import {
  parseCcEmails,
  sendApprovalEmail,
} from "@/features/news/notifications/approval-email";
import { track } from "@/features/news/telemetry/track";

const PIPELINE_USER_AGENT = "news-pipeline/F-015";
// IP hash sentinela para eventos server-side originados do cron (não há IP
// real). Satisfaz o regex /^[a-f0-9]{64}$/ do TelemetryEvent.ip_hash.
const SERVER_IP_HASH_SENTINEL = "0".repeat(64);

const DEFAULT_PDF_LIMIT = 4;

interface RunPipelineInputBase {
  trigger_type: TriggerType;
  /** Override de turno; default detectado por hora UTC. */
  turno?: "manha" | "tarde";
  /** IDs específicos de PDFs (pathname Blob/filename); default: últimos 4. */
  pdf_ids?: string[];
}

export type RunPipelineInput = RunPipelineInputBase;

interface InternalDeps {
  // Sobreescritas para testes.
  listPdfs?: (limit: number) => Promise<BloombergPdfRef[]>;
  loadPdf?: (id: string) => Promise<BloombergPdfRef | null>;
  extract?: typeof extractPdf;
  queryPerp?: typeof queryPerplexity;
  generate?: typeof generateBlogArticles;
  recordRun?: typeof recordPipelineRun;
  updateRun?: typeof updatePipelineRun;
  findCategory?: typeof findCategoryIdAndNameBySlug;
  findExisting?: typeof findExistingArticleBySlug;
  insertPost?: typeof insertBlogPost;
  authorId?: () => Promise<string>;
  trackEvent?: typeof track;
  persistBlocked?: typeof persistBlockedDraft;
  createToken?: typeof createApprovalToken;
  sendApproval?: typeof sendApprovalEmail;
  now?: () => Date;
}

function detectTurnoByUtcHour(): "manha" | "tarde" {
  return new Date().getUTCHours() < 12 ? "manha" : "tarde";
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowMs(): number {
  return Date.now();
}

async function loadPdfs(
  input: RunPipelineInput,
  deps: Required<Pick<InternalDeps, "listPdfs" | "loadPdf">>,
): Promise<BloombergPdfRef[]> {
  if (input.pdf_ids && input.pdf_ids.length > 0) {
    const refs: BloombergPdfRef[] = [];
    for (const id of input.pdf_ids) {
      const ref = await deps.loadPdf(id);
      if (ref) refs.push(ref);
    }
    return refs;
  }
  return deps.listPdfs(DEFAULT_PDF_LIMIT);
}

async function extractAllPdfs(
  pdfs: BloombergPdfRef[],
  extract: typeof extractPdf,
): Promise<PdfExtractionResult[]> {
  const settled = await Promise.allSettled(
    pdfs.map((pdf) =>
      extract(pdf.buffer, { pdf_id: pdf.id }).catch((err: unknown) => {
        if (err instanceof GeminiFallbackUnavailableError) {
          // Sem Gemini: descarta este PDF, mas não aborta a rodada.
          console.warn(
            `[news/orchestrator] PDF ${pdf.id} descartado (Gemini fallback indisponível).`,
          );
          return null;
        }
        throw err;
      }),
    ),
  );
  const results: PdfExtractionResult[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) {
      results.push(r.value);
    } else if (r.status === "rejected") {
      console.warn(
        "[news/orchestrator] PDF extract falhou:",
        r.reason instanceof Error ? r.reason.message : r.reason,
      );
    }
  }
  return results;
}

async function runAllPerplexity(
  turno: "manha" | "tarde",
  queryFn: typeof queryPerplexity,
): Promise<PerplexityResponse[]> {
  const queries = getQueriesForTurno(turno);
  const settled = await Promise.allSettled(
    queries.map((q) => queryFn(q)),
  );
  const out: PerplexityResponse[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") {
      out.push(r.value);
    } else {
      console.warn(
        "[news/orchestrator] Perplexity query falhou:",
        r.reason instanceof Error ? r.reason.message : r.reason,
      );
    }
  }
  return out;
}

function buildGenerationRequest(
  extractions: PdfExtractionResult[],
  perplexity: PerplexityResponse[],
  turno: "manha" | "tarde",
): BlogArticleGenerationRequest {
  const bloomberg_signals = extractions.map((e) => ({
    pdf_id: e.pdf_id,
    format: e.format,
    text: e.text_normalized,
    auto_translated: e.auto_translated,
  }));

  // Filtra Perplexity sem cobertura pública (defesa Anti-SPEC §6.2b — tema
  // sem ≥1 fonte pública não pode virar artigo).
  const public_sources = perplexity
    .filter((r) => r.has_public_coverage && r.citations.length > 0)
    .map((r) => ({
      tema_categoria: r.tema_categoria,
      perplexity_content: r.content,
      citations: r.citations.map((c) => ({
        url: c.url,
        title: c.title ?? "",
        dominio: c.dominio,
      })),
    }));

  return {
    bloomberg_signals,
    public_sources,
    turno,
    data_referencia: todayIsoDate(),
  };
}

/**
 * Mapping do BlogArticleDraft (schema novo) para o ComplianceCheckInput
 * (engine F-005, schema da Brevidade v1 mantido como fonte de verdade
 * regulatória). A engine é congelada; este wrapper adapta sem modificá-la.
 */
function articleToComplianceInput(article: BlogArticleDraft) {
  const cenariosBlob = article.cenarios
    .map((c) =>
      [c.titulo, c.descricao, c.gatilho ?? ""].filter(Boolean).join(" — "),
    )
    .join("\n\n");

  return {
    title: article.title,
    por_que_importa: article.hook,
    entre_as_linhas: cenariosBlob,
    o_que_fica_de_olho: article.summary,
    body: article.body_markdown,
    numeros: [] as ReadonlyArray<{
      texto: string;
      fonte_url: string;
      fonte_nome: string;
    }>,
    fontes: article.fontes.map((f) => ({
      url: f.url,
      title: f.title,
      dominio: f.dominio,
    })),
  };
}

interface ProcessArticleResult {
  status: "published" | "blocked_compliance" | "duplicate" | "error";
  slug: string;
  blockedDraftUrl?: string | null;
}

function getApprovalBaseUrl(): string {
  // NEXT_PUBLIC_SITE_URL é a base canônica em produção (ldccapital.com.br).
  // Em dev, fallback para localhost — links serão clicáveis localmente
  // mas o smoke real ocorre em produção.
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3000";
}

async function processArticle(
  article: BlogArticleDraft,
  runId: string,
  deps: Required<
    Pick<
      InternalDeps,
      | "findCategory"
      | "findExisting"
      | "insertPost"
      | "authorId"
      | "trackEvent"
      | "persistBlocked"
      | "createToken"
      | "sendApproval"
      | "now"
    >
  >,
): Promise<ProcessArticleResult> {
  // 1. Compliance hard check (F-005)
  const complianceResult = runComplianceCheck(
    articleToComplianceInput(article),
  );
  if (!complianceResult.passed) {
    // Log estruturado com violations truncadas (Anti-SPEC §6.3 — sem
    // body_markdown, sem URLs completas no log; apenas tipos + match curto).
    console.warn(
      JSON.stringify({
        event: "compliance_blocked",
        run_id: runId,
        article_slug: article.slug,
        article_title: article.title.slice(0, 80),
        article_categoria: article.categoria_slug,
        violations: complianceResult.violations.map((v) => ({
          type: v.type,
          field: v.field,
          match: v.match.slice(0, 60),
          line_number: v.line_number,
          severity: v.severity,
        })),
      }),
    );

    // Persistência opcional do draft em Vercel Blob para auditoria editorial.
    // Falha graciosa: sem token ou erro Blob → null, log já cobre.
    const blockedAt = deps.now().toISOString();
    const blockedDraftUrl = await deps.persistBlocked({
      run_id: runId,
      article,
      violations: complianceResult.violations,
      blocked_at: blockedAt,
    });

    await deps.trackEvent({
      type: "blocked_compliance",
      briefing_slug: article.slug,
      ip_hash: SERVER_IP_HASH_SENTINEL,
      user_agent: PIPELINE_USER_AGENT,
      ts: blockedAt,
    });
    return {
      status: "blocked_compliance",
      slug: article.slug,
      blockedDraftUrl,
    };
  }

  // 2. Idempotência: slug é UNIQUE de fato no fluxo (verificamos antes do INSERT)
  const existing = await deps.findExisting(article.slug);
  if (existing) {
    console.warn(
      `[news/orchestrator] slug "${article.slug}" já existe (id=${existing.id}); skipped_duplicate.`,
    );
    return { status: "duplicate", slug: article.slug };
  }

  // 3. Lookup categoria + author
  let categoryId: string;
  let categoryName: string;
  let authorId: string;
  try {
    const cat = await deps.findCategory(
      article.categoria_slug as CategoriaArtigoSlug,
    );
    categoryId = cat.id;
    categoryName = cat.name;
    authorId = await deps.authorId();
  } catch (err) {
    console.error(
      `[news/orchestrator] resolução categoria/author falhou para "${article.slug}":`,
      err instanceof Error ? err.message : err,
    );
    return { status: "error", slug: article.slug };
  }

  // 4. Insert
  let inserted: Awaited<ReturnType<typeof insertBlogPost>>;
  try {
    inserted = await deps.insertPost({
      article,
      categoryId,
      categoryName,
      authorId,
    });
  } catch (err) {
    console.error(
      `[news/orchestrator] insertBlogPost falhou para "${article.slug}":`,
      err instanceof Error ? err.message : err,
    );
    return { status: "error", slug: article.slug };
  }

  // 4b. Cover AI editorial (DALL-E 3). Falha graciosa: post fica sem capa,
  // pipeline segue. Custo ~R$0,22/post. Não bloqueia aprovação Marcos
  // (workflow F-018 só checa BlogPost.published, não cover).
  await generateAndAttachCover({
    blogPostId: inserted.id,
    categoriaSlug: article.categoria_slug,
  });

  // Telemetria de pipeline (sentinela 0×64). Telemetria de "publicado" final
  // (com IP hash do clique de Marcos) ocorre em /api/posts/approve em F-018.
  // Aqui registramos que o pipeline _entregou_ o draft em BlogPost — não que
  // está visível em /blog (continua published=false).
  await deps.trackEvent({
    type: "published",
    briefing_slug: inserted.slug,
    ip_hash: SERVER_IP_HASH_SENTINEL,
    user_agent: PIPELINE_USER_AGENT,
    ts: deps.now().toISOString(),
  });

  // 5. F-018 — token + email de aprovação editorial. Falha graciosa: artigo
  // já está em BlogPost com published=false; sem o email, Marcos pode
  // aprovar via admin direto. Não derruba pipeline.
  const recipientEmail = process.env.NEWS_APPROVAL_RECIPIENT_EMAIL;
  if (recipientEmail && recipientEmail.length > 0) {
    try {
      const tokenResult = await deps.createToken(inserted.id, recipientEmail);
      const ccEmails = parseCcEmails(process.env.NEWS_APPROVAL_CC_EMAILS);
      const emailResult = await deps.sendApproval({
        blogPostId: inserted.id,
        blogPostSlug: inserted.slug,
        blogPostTitle: article.title,
        blogPostSummary: article.summary,
        blogPostCategoria: categoryName,
        rawToken: tokenResult.raw_token,
        baseUrl: getApprovalBaseUrl(),
        recipientEmail,
        ccEmails,
      });
      // Log estruturado de auditoria (F-016 / DEBT-012). Anti-SPEC §6.3:
      // só o domínio do email + count de CCs; recipient_email completo
      // jamais é exposto em logs.
      console.info(
        JSON.stringify({
          event: "approval_email_sent",
          run_id: runId,
          blog_post_id: inserted.id,
          article_slug: inserted.slug,
          message_id: emailResult.messageId || "",
          recipient_email_domain:
            recipientEmail.split("@")[1] ?? "unknown",
          cc_count: ccEmails.length,
        }),
      );
    } catch (err) {
      console.warn(
        JSON.stringify({
          event: "approval_email_failed",
          run_id: runId,
          blog_post_id: inserted.id,
          article_slug: inserted.slug,
          error_class:
            err instanceof Error ? err.constructor.name : typeof err,
          error_message: (err instanceof Error
            ? err.message
            : String(err)
          ).slice(0, 200),
        }),
      );
    }
  } else {
    console.warn(
      JSON.stringify({
        event: "approval_email_skipped",
        reason: "no_recipient_env",
        run_id: runId,
        blog_post_id: inserted.id,
      }),
    );
  }

  return { status: "published", slug: inserted.slug };
}

async function trackThemeDiscarded(
  discarded: ThemeDiscarded[],
  deps: Required<Pick<InternalDeps, "trackEvent" | "now">>,
): Promise<number> {
  let noPublicSourceCount = 0;
  for (const d of discarded) {
    if (d.reason === "no_public_source") {
      noPublicSourceCount++;
      await deps.trackEvent({
        type: "theme_discarded_no_public_source",
        ip_hash: SERVER_IP_HASH_SENTINEL,
        user_agent: PIPELINE_USER_AGENT,
        ts: deps.now().toISOString(),
      });
    }
  }
  return noPublicSourceCount;
}

/**
 * Executa o pipeline completo. Retorna `GenerationResult` validado por Zod.
 *
 * - Não throwa em compliance block (artigo isolado é desperdiçado, pipeline
 *   continua).
 * - Throwa apenas em hard fails irrecuperáveis: ausência de PDFs E Perplexity,
 *   custo OpenAI > R$5, exceção não tratada na escrita do news_pipeline_runs.
 */
export async function runPipeline(
  input: RunPipelineInput,
  deps: InternalDeps = {},
): Promise<GenerationResult> {
  const turno = input.turno ?? detectTurnoByUtcHour();
  const startedAt = nowMs();
  const now = deps.now ?? (() => new Date());

  const listPdfs: (limit: number) => Promise<BloombergPdfRef[]> =
    deps.listPdfs ??
    ((limit: number) => listLatestBloombergPdfs({ limit }));
  const loadPdf = deps.loadPdf ?? loadBloombergPdfById;
  const extract = deps.extract ?? extractPdf;
  const queryPerp = deps.queryPerp ?? queryPerplexity;
  const generate = deps.generate ?? generateBlogArticles;
  const recordRun = deps.recordRun ?? recordPipelineRun;
  const updateRun = deps.updateRun ?? updatePipelineRun;
  const findCategory = deps.findCategory ?? findCategoryIdAndNameBySlug;
  const findExisting = deps.findExisting ?? findExistingArticleBySlug;
  const insertPost = deps.insertPost ?? insertBlogPost;
  const authorIdFn = deps.authorId ?? getEditorialAuthorId;
  const trackEvent = deps.trackEvent ?? track;
  const persistBlocked = deps.persistBlocked ?? persistBlockedDraft;
  const createToken = deps.createToken ?? createApprovalToken;
  const sendApproval = deps.sendApproval ?? sendApprovalEmail;

  // 1. Carrega PDFs
  const pdfs = await loadPdfs(input, { listPdfs, loadPdf });

  // 2. Extrai paralelo
  const extractions = await extractAllPdfs(pdfs, extract);

  // 3. Perplexity paralelo
  const perplexityResponses = await runAllPerplexity(turno, queryPerp);

  // 4. Hard fail se zero fonte de qualquer tipo
  const hasAnySignal = extractions.length > 0 || perplexityResponses.length > 0;
  if (!hasAnySignal) {
    throw new Error(
      "[news/orchestrator] zero PDFs extraídos E zero Perplexity OK — pipeline abortado.",
    );
  }

  // 5. Auditoria run
  const queriesForRecord = getQueriesForTurno(turno).map((q) => q.query);
  const { run_id } = await recordRun({
    trigger_type: input.trigger_type,
    pdf_ids_used: extractions.map((e) => e.pdf_id),
    perplexity_queries: queriesForRecord,
  });

  let openaiResponse: BlogArticleGenerationResponse | null = null;
  let pipelineError: string | null = null;

  try {
    // 6. Monta request + chama OpenAI
    const request = buildGenerationRequest(
      extractions,
      perplexityResponses,
      turno,
    );
    openaiResponse = await generate(request);
  } catch (err) {
    pipelineError =
      err instanceof OpenAiCostExceededError
        ? `cost_exceeded: ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    console.error(
      "[news/orchestrator] generateBlogArticles falhou:",
      pipelineError,
    );
  }

  // 7. Processa cada artigo
  let publishedCount = 0;
  let blockedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  const blockedDraftsUrls: string[] = [];

  if (openaiResponse) {
    for (const article of openaiResponse.articles) {
      const result = await processArticle(article, run_id, {
        findCategory,
        findExisting,
        insertPost,
        authorId: authorIdFn,
        trackEvent,
        persistBlocked,
        createToken,
        sendApproval,
        now,
      });
      if (result.status === "published") publishedCount++;
      else if (result.status === "blocked_compliance") {
        blockedCount++;
        if (result.blockedDraftUrl) blockedDraftsUrls.push(result.blockedDraftUrl);
      } else if (result.status === "duplicate") duplicateCount++;
      else errorCount++;
    }
  }

  // 8. Telemetria themes_discarded
  const themesDiscardedCount = openaiResponse
    ? await trackThemeDiscarded(openaiResponse.themes_discarded, {
        trackEvent,
        now,
      })
    : 0;

  // 9. Update final
  const durationMs = nowMs() - startedAt;
  const finalStatus = pipelineError ? "failed" : "success";

  await updateRun(run_id, {
    status: finalStatus,
    openai_total_tokens: openaiResponse?.metadata.total_tokens ?? 0,
    openai_cost_brl: openaiResponse?.metadata.cost_brl ?? 0,
    briefings_generated: publishedCount,
    briefings_blocked: blockedCount + errorCount,
    themes_discarded_no_public_source: themesDiscardedCount,
    bloomberg_citation_attempts: 0,
    duration_ms: durationMs,
    error_message: pipelineError,
    blocked_drafts_urls:
      blockedDraftsUrls.length > 0 ? blockedDraftsUrls : undefined,
  });

  return GenerationResult.parse({
    run_id,
    status: finalStatus,
    briefings_pending_review: publishedCount,
    briefings_blocked: blockedCount + errorCount,
    themes_discarded: themesDiscardedCount + duplicateCount,
    duration_ms: durationMs,
  });
}

export const __ORCHESTRATOR_INTERNALS = {
  detectTurnoByUtcHour,
  todayIsoDate,
  buildGenerationRequest,
  articleToComplianceInput,
  PIPELINE_USER_AGENT,
  SERVER_IP_HASH_SENTINEL,
};
