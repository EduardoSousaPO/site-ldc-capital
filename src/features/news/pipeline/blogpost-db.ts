/**
 * Cliente Supabase isolado para o pipeline pós-pivot ADR-005.
 *
 * Substitui `pipeline-db.ts` apagado. Cobre:
 *   - news_pipeline_runs (auditoria do pipeline) — INSERT/UPDATE
 *   - Category (lookup slug → id+name) com cache em memória durante a rodada
 *   - User (lookup do `authorId` editorial — admin LDC) com cache
 *   - BlogPost (INSERT do artigo, published=false; SELECT por slug para
 *     idempotência)
 *
 * Padrão: cliente untyped internamente + helpers tipados na superfície
 * (memória `feedback_supabase_js_multi_table` — supabase-js v2 colapsa Insert
 * para `never` quando Database type tem >1 Tables; isolamos esse risco aqui).
 *
 * Anti-SPEC §6.3: nunca logar conteúdo do artigo nem chave SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import readingTime from "reading-time";
import type {
  BlogArticleDraft,
  CategoriaArtigoSlug,
} from "@/features/news/contracts/openai";
import type {
  PipelineRunStatus,
  TriggerType,
} from "@/features/news/contracts/pipeline";

const EDITORIAL_AUTHOR_DISPLAY_NAME = "Editorial LDC";

let cachedClient: SupabaseClient | null = null;
const categoryCache = new Map<string, { id: string; name: string }>();
let cachedAuthorId: string | null = null;

function buildClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "[news/blogpost-db] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.",
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Cliente untyped — usado apenas dentro deste módulo, nunca exportado. */
function getBlogpostClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = buildClient();
  }
  return cachedClient;
}

export function __resetBlogpostDbForTests(): void {
  cachedClient = null;
  categoryCache.clear();
  cachedAuthorId = null;
}

/**
 * Permite testes injetarem um cliente mockado. Não usar em runtime.
 */
export function __setBlogpostClientForTests(client: SupabaseClient): void {
  cachedClient = client;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline runs (auditoria)
// ─────────────────────────────────────────────────────────────────────────────

export interface RecordPipelineRunInput {
  trigger_type: TriggerType;
  pdf_ids_used: string[];
  perplexity_queries: string[];
}

export interface UpdatePipelineRunInput {
  status: PipelineRunStatus;
  openai_total_tokens?: number;
  openai_cost_brl?: number;
  briefings_generated?: number;
  briefings_blocked?: number;
  themes_discarded_no_public_source?: number;
  bloomberg_citation_attempts?: number;
  duration_ms?: number;
  error_message?: string | null;
  /**
   * URLs de drafts bloqueados persistidos em Vercel Blob (F-015b — Bug #2).
   * Coluna criada via migration `news_pipeline_runs_blocked_drafts_audit`.
   */
  blocked_drafts_urls?: string[];
}

export async function recordPipelineRun(
  input: RecordPipelineRunInput,
): Promise<{ run_id: string }> {
  const client = getBlogpostClient();
  const insertPayload = {
    trigger_type: input.trigger_type,
    pdf_ids_used: input.pdf_ids_used,
    perplexity_queries: input.perplexity_queries,
    status: "running" as const,
  };

  const { data, error } = await client
    .from("news_pipeline_runs")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `[news/blogpost-db] falha ao registrar pipeline run: ${error?.message ?? "no data"}`,
    );
  }

  const row = data as { id: string };
  return { run_id: row.id };
}

export async function updatePipelineRun(
  run_id: string,
  patch: UpdatePipelineRunInput,
): Promise<void> {
  const client = getBlogpostClient();
  const { error } = await client
    .from("news_pipeline_runs")
    .update(patch)
    .eq("id", run_id);

  if (error) {
    throw new Error(
      `[news/blogpost-db] falha ao atualizar pipeline run ${run_id}: ${error.message}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Category lookup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve (slug) → (id, name) na tabela Category. Resultado é cacheado em
 * memória para o tempo de vida do processo (ou até `__resetBlogpostDbForTests`).
 *
 * `name` é o display name humano (ex.: "Macro Global") — vai para
 * `BlogPost.category` (string TEXT NOT NULL); `id` vai para `BlogPost.categoryId`
 * (FK opcional).
 */
export async function findCategoryIdAndNameBySlug(
  slug: CategoriaArtigoSlug | string,
): Promise<{ id: string; name: string }> {
  const cached = categoryCache.get(slug);
  if (cached) return cached;

  const client = getBlogpostClient();
  const { data, error } = await client
    .from("Category")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `[news/blogpost-db] categoria com slug "${slug}" não encontrada: ${
        error?.message ?? "no data"
      }`,
    );
  }

  const row = data as { id: string; name: string; slug: string };
  const result = { id: row.id, name: row.name };
  categoryCache.set(slug, result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Editorial author resolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve o `authorId` para artigos gerados pelo pipeline. Estratégia:
 *   1. Se `NEWS_PIPELINE_AUTHOR_ID` env estiver setado, usa direto.
 *   2. Senão, busca o User com role=ADMIN mais antigo (fallback estável).
 */
export async function getEditorialAuthorId(): Promise<string> {
  if (cachedAuthorId) return cachedAuthorId;

  const envId = process.env.NEWS_PIPELINE_AUTHOR_ID;
  if (envId && envId.trim().length > 0) {
    cachedAuthorId = envId.trim();
    return cachedAuthorId;
  }

  const client = getBlogpostClient();
  const { data, error } = await client
    .from("User")
    .select("id")
    .eq("role", "ADMIN")
    .order("createdAt", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `[news/blogpost-db] nenhum User ADMIN disponível para authorId: ${
        error?.message ?? "no data"
      }`,
    );
  }

  const row = data as { id: string };
  cachedAuthorId = row.id;
  return cachedAuthorId;
}

// ─────────────────────────────────────────────────────────────────────────────
// BlogPost — idempotência + insert
// ─────────────────────────────────────────────────────────────────────────────

export interface ExistingBlogPostRef {
  id: string;
  slug: string;
  published: boolean;
}

export async function findExistingArticleBySlug(
  slug: string,
): Promise<ExistingBlogPostRef | null> {
  const client = getBlogpostClient();
  const { data, error } = await client
    .from("BlogPost")
    .select("id, slug, published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[news/blogpost-db] falha ao consultar BlogPost por slug "${slug}": ${error.message}`,
    );
  }

  if (!data) return null;
  const row = data as { id: string; slug: string; published: boolean };
  return row;
}

export interface InsertBlogPostInput {
  article: BlogArticleDraft;
  categoryId: string;
  categoryName: string;
  authorId: string;
}

export interface InsertedBlogPostRef {
  id: string;
  slug: string;
}

function computeReadingTime(markdown: string): string {
  const stats = readingTime(markdown);
  const minutes = Math.max(1, Math.round(stats.minutes));
  return `${minutes} min`;
}

/**
 * Insere o artigo gerado em `BlogPost` com `published=false`. Marcos aprovará
 * via fluxo F-018 (token-based email).
 *
 * Caller é responsável por:
 *   - rodar `runComplianceCheck()` ANTES de chamar este insert (engine F-005)
 *   - tratar idempotência via `findExistingArticleBySlug()` ANTES (slug único
 *     na BlogPost; o INSERT não tenta upsert — duplicate é erro do caller)
 */
export async function insertBlogPost(
  input: InsertBlogPostInput,
): Promise<InsertedBlogPostRef> {
  const { article, categoryId, categoryName, authorId } = input;

  const insertPayload = {
    title: article.title,
    slug: article.slug,
    content: article.body_markdown,
    summary: article.summary,
    category: categoryName,
    categoryId,
    cover: null,
    published: false,
    readingTime: computeReadingTime(article.body_markdown),
    authorId,
    authorDisplayName: EDITORIAL_AUTHOR_DISPLAY_NAME,
  };

  const client = getBlogpostClient();
  const { data, error } = await client
    .from("BlogPost")
    .insert(insertPayload)
    .select("id, slug")
    .single();

  if (error || !data) {
    throw new Error(
      `[news/blogpost-db] falha ao inserir BlogPost slug="${article.slug}": ${
        error?.message ?? "no data"
      }`,
    );
  }

  const row = data as { id: string; slug: string };
  return row;
}

export const __BLOGPOST_DB_INTERNALS = {
  EDITORIAL_AUTHOR_DISPLAY_NAME,
  computeReadingTime,
};
