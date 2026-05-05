/**
 * Cliente OpenAI para geração de artigos densos pós-pivot ADR-005.
 *
 * Substitui o cliente apagado da Brevidade Inteligente. Modelo padrão
 * gpt-5-mini (override via env `OPENAI_MODEL_BLOG_ARTICLE`). Usa Structured
 * Outputs via `zodResponseFormat` do SDK OpenAI v6+.
 *
 * Lições preservadas de F-007 (memória `feedback_openai_structured_outputs`):
 *   - Schema do `zodResponseFormat` é relaxado (sem `.url()` / `.uuid()` /
 *     `.optional()`); validação dura roda DEPOIS do parse, neste módulo.
 *   - Hard fail se cost_brl > MAX_COST_BRL_PER_RUN (default R$5).
 *   - Captura `cached_tokens` para auditoria de prompt cache.
 *   - Defense in depth: pós-parse, qualquer artigo com URL contendo
 *     "bloomberg" no `fontes[]` é descartado (Anti-SPEC §6.2b).
 *
 * Anti-SPEC §6.3: nunca logar conteúdo do artigo nem chave da API. Logs de
 * erro são genéricos.
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  BLOG_ARTICLE_SYSTEM_PROMPT,
  BLOG_ARTICLE_SYSTEM_PROMPT_VERSION,
} from "@/features/news/prompts/system-prompt";
import {
  BlogArticleGenerationRequest,
  BlogArticleGenerationResponse,
  type BlogArticleDraft,
  type FonteCitavel,
} from "@/features/news/contracts/openai";

const DEFAULT_MODEL = "gpt-5-mini";
const STRUCTURED_OUTPUT_NAME = "BlogArticleGenerationResponse";

// Custos USD/1M tokens — referência gpt-5-mini (overrides via env quando o
// pricing mudar; nunca hardcodar em chamadas reais sem revisar).
const INPUT_USD_PER_1M_DEFAULT = 0.25;
const CACHED_INPUT_USD_PER_1M_DEFAULT = 0.025; // 90% desconto sobre input
const OUTPUT_USD_PER_1M_DEFAULT = 2.0;
const USD_BRL_RATE_DEFAULT = 5.0;
const MAX_COST_BRL_PER_RUN_DEFAULT = 5.0;

function envNum(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getPricingConfig() {
  return {
    inputUsdPer1M: envNum("OPENAI_INPUT_USD_PER_1M", INPUT_USD_PER_1M_DEFAULT),
    cachedInputUsdPer1M: envNum(
      "OPENAI_CACHED_INPUT_USD_PER_1M",
      CACHED_INPUT_USD_PER_1M_DEFAULT,
    ),
    outputUsdPer1M: envNum(
      "OPENAI_OUTPUT_USD_PER_1M",
      OUTPUT_USD_PER_1M_DEFAULT,
    ),
    usdBrlRate: envNum("OPENAI_USD_BRL_RATE", USD_BRL_RATE_DEFAULT),
    maxCostBrlPerRun: envNum(
      "OPENAI_MAX_COST_BRL_PER_RUN",
      MAX_COST_BRL_PER_RUN_DEFAULT,
    ),
  };
}

interface OpenAiUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

function computeCostBrl(
  usage: OpenAiUsage | null | undefined,
  pricing: ReturnType<typeof getPricingConfig>,
): { totalTokens: number; cachedTokens: number; costBrl: number } {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const cachedTokens = usage?.prompt_tokens_details?.cached_tokens ?? 0;
  const nonCachedInput = Math.max(0, promptTokens - cachedTokens);

  const usdCost =
    (nonCachedInput * pricing.inputUsdPer1M) / 1_000_000 +
    (cachedTokens * pricing.cachedInputUsdPer1M) / 1_000_000 +
    (completionTokens * pricing.outputUsdPer1M) / 1_000_000;

  const costBrl = usdCost * pricing.usdBrlRate;
  const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;

  return { totalTokens, cachedTokens, costBrl };
}

function isWellFormedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function fonteHasBloomberg(fonte: FonteCitavel): boolean {
  return (
    /bloomberg/i.test(fonte.url) ||
    /bloomberg/i.test(fonte.dominio) ||
    /bloomberg/i.test(fonte.title)
  );
}

function articleIsClean(article: BlogArticleDraft): boolean {
  for (const fonte of article.fontes) {
    if (fonteHasBloomberg(fonte)) return false;
    if (!isWellFormedUrl(fonte.url)) return false;
  }
  return true;
}

export class OpenAiCostExceededError extends Error {
  readonly cost_brl: number;
  readonly limit_brl: number;
  constructor(cost_brl: number, limit_brl: number) {
    super(
      `OpenAI cost R$${cost_brl.toFixed(2)} excedeu limite R$${limit_brl.toFixed(2)} (hard fail por rodada).`,
    );
    this.name = "OpenAiCostExceededError";
    this.cost_brl = cost_brl;
    this.limit_brl = limit_brl;
  }
}

export class OpenAiSchemaParseError extends Error {
  readonly attempts: number;
  constructor(attempts: number, cause: unknown) {
    super(
      `OpenAI retornou JSON malformado após ${attempts} tentativa(s): ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    );
    this.name = "OpenAiSchemaParseError";
    this.attempts = attempts;
  }
}

export interface GenerateBlogArticlesOptions {
  /** Override de modelo (default: env OPENAI_MODEL_BLOG_ARTICLE ou gpt-5-mini). */
  model?: string;
  /** Cliente OpenAI customizado (testes injetam mock). */
  openaiClient?: Pick<OpenAI, "chat">;
  /** Número de tentativas em parse error. Default: 1 retry → 2 tentativas total. */
  retryAttempts?: number;
}

interface ParsedCompletion {
  parsed: BlogArticleGenerationResponse | null;
  usage: OpenAiUsage | null | undefined;
  modelUsed: string;
}

async function callOpenAi(
  request: BlogArticleGenerationRequest,
  client: Pick<OpenAI, "chat">,
  model: string,
): Promise<ParsedCompletion> {
  const userPayload = JSON.stringify(request);

  const completion = await client.chat.completions.parse({
    model,
    messages: [
      {
        role: "system",
        content: BLOG_ARTICLE_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userPayload,
      },
    ],
    response_format: zodResponseFormat(
      BlogArticleGenerationResponse,
      STRUCTURED_OUTPUT_NAME,
    ),
  });

  const choice = completion.choices?.[0];
  return {
    parsed: choice?.message?.parsed ?? null,
    usage: completion.usage as OpenAiUsage | null | undefined,
    modelUsed: completion.model ?? model,
  };
}

/**
 * Gera artigos densos a partir de signals Bloomberg + public_sources.
 *
 * Fluxo:
 *   1. Parse do request (Zod canônico — input já confiável).
 *   2. Chat completions com Structured Outputs (zodResponseFormat).
 *   3. Em parse error (Zod do OpenAI helper), retry 1x; depois throw.
 *   4. Calcula custo BRL via prompt_tokens / completion_tokens / cached_tokens.
 *   5. Hard fail se custo > MAX_COST_BRL_PER_RUN.
 *   6. Defense in depth: filtra artigos com Bloomberg em fontes ou URL malformada.
 *   7. Retorna resposta com `metadata` preenchido (model, total_tokens,
 *      cached_tokens, cost_brl).
 *
 * NÃO faz compliance check completo — isso é responsabilidade do orchestrator
 * via `runComplianceCheck()` (F-005). Aqui só garantimos integridade técnica
 * básica e Bloomberg em URLs.
 */
export async function generateBlogArticles(
  request: BlogArticleGenerationRequest,
  options: GenerateBlogArticlesOptions = {},
): Promise<BlogArticleGenerationResponse> {
  BlogArticleGenerationRequest.parse(request);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OPENAI_API_KEY ausente — pipeline news abortado.");
  }

  const model =
    options.model ??
    process.env.OPENAI_MODEL_BLOG_ARTICLE ??
    DEFAULT_MODEL;
  const retryAttempts = options.retryAttempts ?? 1;
  const maxAttempts = retryAttempts + 1;
  const client = options.openaiClient ?? new OpenAI({ apiKey });
  const pricing = getPricingConfig();

  let lastError: unknown;
  let parsed: BlogArticleGenerationResponse | null = null;
  let usage: OpenAiUsage | null | undefined;
  let modelUsed = model;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await callOpenAi(request, client, model);
      if (!result.parsed) {
        throw new Error("OpenAI retornou parsed=null (refusal ou parse fail)");
      }
      parsed = result.parsed;
      usage = result.usage;
      modelUsed = result.modelUsed;
      break;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  if (!parsed) {
    throw new OpenAiSchemaParseError(maxAttempts, lastError);
  }

  // 5. Custo + hard fail
  const cost = computeCostBrl(usage, pricing);
  if (cost.costBrl > pricing.maxCostBrlPerRun) {
    throw new OpenAiCostExceededError(cost.costBrl, pricing.maxCostBrlPerRun);
  }

  // 6. Defense in depth: filtra artigos com Bloomberg ou URL malformada
  const cleanArticles = parsed.articles.filter(articleIsClean);

  // 7. Re-monta com metadata preenchido (sobrescreve o que o LLM mandou)
  const finalResponse: BlogArticleGenerationResponse = {
    articles: cleanArticles,
    themes_discarded: parsed.themes_discarded ?? [],
    metadata: {
      model: modelUsed,
      total_tokens: cost.totalTokens,
      cached_tokens: cost.cachedTokens,
      cost_brl: Number(cost.costBrl.toFixed(4)),
    },
  };

  return BlogArticleGenerationResponse.parse(finalResponse);
}

// Sentinelas exportados para testes.
export const __OPENAI_CLIENT_INTERNALS = {
  DEFAULT_MODEL,
  STRUCTURED_OUTPUT_NAME,
  BLOG_ARTICLE_SYSTEM_PROMPT_VERSION,
  computeCostBrl,
  articleIsClean,
  isWellFormedUrl,
};
