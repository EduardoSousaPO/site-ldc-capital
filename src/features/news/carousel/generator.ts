/**
 * F-019 — Generator do carrossel Instagram/LinkedIn.
 *
 * Skeleton (#14): inclui as etapas LLM + re-validação Strict + compliance +
 * INSERT auditoria. Pula render/zip/upload (placeholders nos pontos #16/#17/#18).
 *
 * Fluxo `generateCarouselScript()` (sem render):
 *   1. loadBlogPostForCarousel() — exige published=true
 *   2. callOpenAi() — Structured Outputs com zodResponseFormat(CarouselScript)
 *   3. Re-valida com CarouselScriptStrict (catch malformed UUID/datetime/slug
 *      e Bloomberg via regex no Strict)
 *   4. checkCarouselCompliance() — F-005 engine + hashtag Bloomberg check
 *   5. INSERT carousel_runs com status='success' ou 'compliance_blocked'
 *   6. Retorna { script, violations, runId, costBrl, totalTokens }
 *
 * Anti-SPEC §6.3: log estruturado sem expor body do post nem chave OpenAI.
 *
 * Custo guard (CA-037): se openai_cost_brl > MAX_COST_BRL, marca status='failed'
 * com error_message='cost_exceeded'. NÃO bloqueia o retorno do script — Eduardo
 * decide via UI/auditoria. (Direção do Eduardo: "custo é sentinela, não bloqueio".)
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  BLOG_CAROUSEL_SYSTEM_PROMPT,
  CAROUSEL_PROMPT_VERSION,
} from "@/features/news/carousel/prompt";
import {
  CarouselScript,
  CarouselScriptStrict,
  type CarouselScriptStrict as CarouselScriptStrictType,
} from "@/features/news/contracts/carousel";
import {
  checkCarouselCompliance,
  type CarouselViolation,
} from "@/features/news/carousel/compliance-mapper";
import {
  countSuccessfulRunsLast24h,
  insertCarouselRun,
  loadBlogPostForCarousel,
  type BlogPostForCarousel,
} from "@/features/news/carousel/carousel-runs-db";

const DEFAULT_MODEL = "gpt-5-mini";
const STRUCTURED_OUTPUT_NAME = "CarouselScript";

// Custos USD/1M tokens — overrides via env. Defaults espelham gpt-5-mini.
const INPUT_USD_PER_1M_DEFAULT = 0.25;
const CACHED_INPUT_USD_PER_1M_DEFAULT = 0.025;
const OUTPUT_USD_PER_1M_DEFAULT = 2.0;
const USD_BRL_RATE_DEFAULT = 5.0;

// CA-042 v2.0 — sentinela R$1,00 (não bloqueio). Custo combinado text+images
// estimado R$0,70 (R$0,04 OpenAI + R$0,66 DALL-E 3× R$0,22). Folga ~30%.
// Generator avalia APENAS text-cost; route soma image-cost depois e
// re-marca status='failed' se total > 1,00.
const COST_GUARD_BRL_DEFAULT = 1.0;

// CA-037 — rate limit
const RATE_LIMIT_PER_DAY = 10;

function envNum(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

interface PricingConfig {
  inputUsdPer1M: number;
  cachedInputUsdPer1M: number;
  outputUsdPer1M: number;
  usdBrlRate: number;
  costGuardBrl: number;
}

function getPricingConfig(): PricingConfig {
  return {
    inputUsdPer1M: envNum("OPENAI_INPUT_USD_PER_1M", INPUT_USD_PER_1M_DEFAULT),
    cachedInputUsdPer1M: envNum(
      "OPENAI_CACHED_INPUT_USD_PER_1M",
      CACHED_INPUT_USD_PER_1M_DEFAULT,
    ),
    outputUsdPer1M: envNum("OPENAI_OUTPUT_USD_PER_1M", OUTPUT_USD_PER_1M_DEFAULT),
    usdBrlRate: envNum("OPENAI_USD_BRL_RATE", USD_BRL_RATE_DEFAULT),
    costGuardBrl: envNum("CAROUSEL_COST_GUARD_BRL", COST_GUARD_BRL_DEFAULT),
  };
}

interface OpenAiUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

function computeCost(
  usage: OpenAiUsage | null | undefined,
  pricing: PricingConfig,
): { totalTokens: number; cachedTokens: number; costBrl: number } {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const cachedTokens = usage?.prompt_tokens_details?.cached_tokens ?? 0;
  const nonCachedInput = Math.max(0, promptTokens - cachedTokens);

  const usdCost =
    (nonCachedInput * pricing.inputUsdPer1M) / 1_000_000 +
    (cachedTokens * pricing.cachedInputUsdPer1M) / 1_000_000 +
    (completionTokens * pricing.outputUsdPer1M) / 1_000_000;

  return {
    totalTokens: usage?.total_tokens ?? promptTokens + completionTokens,
    cachedTokens,
    costBrl: usdCost * pricing.usdBrlRate,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Erros tipados
// ─────────────────────────────────────────────────────────────────────────────

export class CarouselBlogPostNotFoundError extends Error {
  readonly blog_post_id: string;
  constructor(id: string) {
    super(`BlogPost ${id} não encontrado.`);
    this.name = "CarouselBlogPostNotFoundError";
    this.blog_post_id = id;
  }
}

export class CarouselBlogPostNotPublishedError extends Error {
  readonly blog_post_id: string;
  constructor(id: string) {
    super(
      `BlogPost ${id} não está publicado. Aprove o artigo antes de gerar carrossel.`,
    );
    this.name = "CarouselBlogPostNotPublishedError";
    this.blog_post_id = id;
  }
}

export class CarouselRateLimitError extends Error {
  readonly user_id: string;
  readonly used: number;
  readonly limit: number;
  constructor(userId: string, used: number, limit: number) {
    super(
      `Limite diário atingido (${used}/${limit}). Tente novamente amanhã.`,
    );
    this.name = "CarouselRateLimitError";
    this.user_id = userId;
    this.used = used;
    this.limit = limit;
  }
}

export class CarouselComplianceBlockedError extends Error {
  readonly violations: CarouselViolation[];
  readonly carousel_run_id: string;
  constructor(violations: CarouselViolation[], runId: string) {
    super(
      `Geração bloqueada por ${violations.length} violação(ões) de compliance.`,
    );
    this.name = "CarouselComplianceBlockedError";
    this.violations = violations;
    this.carousel_run_id = runId;
  }
}

export class CarouselSchemaError extends Error {
  readonly cause_message: string;
  constructor(cause: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(
      `OpenAI retornou JSON inválido contra CarouselScriptStrict: ${causeMessage}`,
    );
    this.name = "CarouselSchemaError";
    this.cause_message = causeMessage;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chamada OpenAI
// ─────────────────────────────────────────────────────────────────────────────

interface OpenAiCallResult {
  parsed: ReturnType<typeof CarouselScript.parse> | null;
  usage: OpenAiUsage | null | undefined;
  modelUsed: string;
}

async function callOpenAi(
  blogPost: BlogPostForCarousel,
  client: Pick<OpenAI, "chat">,
  model: string,
): Promise<OpenAiCallResult> {
  const userPayload = JSON.stringify({
    blog_post_id: blogPost.id,
    blog_post_slug: blogPost.slug,
    title: blogPost.title,
    summary: blogPost.summary ?? "",
    category: blogPost.category,
    content: blogPost.content,
    generated_at: new Date().toISOString(),
    prompt_version_required: CAROUSEL_PROMPT_VERSION,
  });

  const completion = await client.chat.completions.parse({
    model,
    messages: [
      { role: "system", content: BLOG_CAROUSEL_SYSTEM_PROMPT },
      { role: "user", content: userPayload },
    ],
    response_format: zodResponseFormat(CarouselScript, STRUCTURED_OUTPUT_NAME),
  });

  const choice = completion.choices?.[0];
  return {
    parsed: choice?.message?.parsed ?? null,
    usage: completion.usage as OpenAiUsage | null | undefined,
    modelUsed: completion.model ?? model,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateCarouselScriptInput {
  blogPostId: string;
  generatedByUserId: string;
}

export interface GenerateCarouselScriptOptions {
  /** Override de modelo (default: env OPENAI_MODEL_CAROUSEL ou gpt-5-mini). */
  model?: string;
  openaiClient?: Pick<OpenAI, "chat">;
  /** Skip rate limit (testes/smoke local). Default: false em produção. */
  skipRateLimit?: boolean;
}

export interface GenerateCarouselScriptResult {
  script: CarouselScriptStrictType;
  carousel_run_id: string;
  generated_at: string;
  total_tokens: number;
  cached_tokens: number;
  cost_brl: number;
  cost_exceeded: boolean;
  model: string;
}

/**
 * Gera o roteiro do carrossel (sem renderizar). Persiste em carousel_runs.
 *
 * Lança:
 *   - `CarouselBlogPostNotFoundError` (404)
 *   - `CarouselBlogPostNotPublishedError` (409)
 *   - `CarouselRateLimitError` (429)
 *   - `CarouselSchemaError` (502 — OpenAI retornou JSON malformado)
 *   - `CarouselComplianceBlockedError` (422 — runId já está em carousel_runs
 *     com status='compliance_blocked')
 */
export async function generateCarouselScript(
  input: GenerateCarouselScriptInput,
  options: GenerateCarouselScriptOptions = {},
): Promise<GenerateCarouselScriptResult> {
  const { blogPostId, generatedByUserId } = input;

  // 1) BlogPost existe + published
  const post = await loadBlogPostForCarousel(blogPostId);
  if (!post) throw new CarouselBlogPostNotFoundError(blogPostId);
  if (!post.published)
    throw new CarouselBlogPostNotPublishedError(blogPostId);

  // 2) Rate limit (CA-037)
  if (!options.skipRateLimit) {
    const used = await countSuccessfulRunsLast24h(generatedByUserId);
    if (used >= RATE_LIMIT_PER_DAY) {
      throw new CarouselRateLimitError(
        generatedByUserId,
        used,
        RATE_LIMIT_PER_DAY,
      );
    }
  }

  // 3) Setup OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OPENAI_API_KEY ausente — F-019 abortado.");
  }
  const model =
    options.model ?? process.env.OPENAI_MODEL_CAROUSEL ?? DEFAULT_MODEL;
  const client = options.openaiClient ?? new OpenAI({ apiKey });
  const pricing = getPricingConfig();

  // 4) Chamada LLM
  const { parsed, usage, modelUsed } = await callOpenAi(post, client, model);
  if (!parsed) {
    throw new CarouselSchemaError("OpenAI retornou parsed=null");
  }

  // 5) Re-validação Strict (catch UUID/datetime/slug inválidos + Bloomberg)
  let strict: CarouselScriptStrictType;
  try {
    strict = CarouselScriptStrict.parse(parsed);
  } catch (err) {
    throw new CarouselSchemaError(err);
  }

  // 6) Compliance F-005 + hashtag Bloomberg check
  const compliance = checkCarouselCompliance(strict);

  // 7) Custo + custo guard (sentinela)
  const { totalTokens, cachedTokens, costBrl } = computeCost(usage, pricing);
  const costExceeded = costBrl > pricing.costGuardBrl;

  // 8) INSERT carousel_runs
  let auditStatus: "success" | "compliance_blocked" | "failed";
  let errorMessage: string | null = null;

  if (!compliance.passed) {
    auditStatus = "compliance_blocked";
    errorMessage = `compliance_blocked: ${compliance.violations
      .map((v) => `${v.type}@${v.source.kind}`)
      .slice(0, 5)
      .join(", ")}`;
  } else if (costExceeded) {
    auditStatus = "failed";
    errorMessage = `cost_exceeded: R$${costBrl.toFixed(4)} > R$${pricing.costGuardBrl.toFixed(2)}`;
  } else {
    auditStatus = "success";
  }

  const inserted = await insertCarouselRun({
    blog_post_id: blogPostId,
    generated_by_user_id: generatedByUserId,
    prompt_version: CAROUSEL_PROMPT_VERSION,
    slides_count: strict.slides.length,
    openai_total_tokens: totalTokens,
    openai_cost_brl: Number(costBrl.toFixed(4)),
    status: auditStatus,
    zip_pathname: null, // placeholder — preenchido em #16/#17/#18 após render+zip+upload
    error_message: errorMessage,
  });

  // Log estruturado (Anti-SPEC §6.3 — sem body do post)
  console.info(
    JSON.stringify({
      event: "carousel_script_generated",
      carousel_run_id: inserted.id,
      blog_post_id: blogPostId,
      blog_post_slug: post.slug,
      status: auditStatus,
      slides_count: strict.slides.length,
      total_tokens: totalTokens,
      cached_tokens: cachedTokens,
      cost_brl: Number(costBrl.toFixed(4)),
      cost_exceeded: costExceeded,
      violations_count: compliance.violations.length,
      model: modelUsed,
    }),
  );

  if (!compliance.passed) {
    throw new CarouselComplianceBlockedError(
      compliance.violations,
      inserted.id,
    );
  }

  return {
    script: strict,
    carousel_run_id: inserted.id,
    generated_at: inserted.generated_at,
    total_tokens: totalTokens,
    cached_tokens: cachedTokens,
    cost_brl: Number(costBrl.toFixed(4)),
    cost_exceeded: costExceeded,
    model: modelUsed,
  };
}

// Internals expostos para testes
export const __CAROUSEL_GENERATOR_INTERNALS = {
  computeCost,
  getPricingConfig,
  RATE_LIMIT_PER_DAY,
};
