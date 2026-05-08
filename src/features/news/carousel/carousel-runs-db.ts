/**
 * Cliente Supabase isolado para F-019 (carousel_runs + leitura de BlogPost).
 *
 * Padrão: cliente untyped + helpers tipados na superfície (memória
 * `feedback_supabase_js_multi_table`). Mesmo padrão de blogpost-db.ts.
 *
 * Anti-SPEC §6.3: nunca logar SUPABASE_SERVICE_ROLE_KEY nem conteúdo do post.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

function buildClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "[news/carousel/carousel-runs-db] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getCarouselRunsClient(): SupabaseClient {
  if (!cachedClient) cachedClient = buildClient();
  return cachedClient;
}

export function __resetCarouselRunsDbForTests(): void {
  cachedClient = null;
}

export function __setCarouselRunsClientForTests(
  client: SupabaseClient,
): void {
  cachedClient = client;
}

// ─────────────────────────────────────────────────────────────────────────────
// BlogPost — leitura mínima para o gerador
// ─────────────────────────────────────────────────────────────────────────────

export interface BlogPostForCarousel {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  published: boolean;
}

export async function loadBlogPostForCarousel(
  id: string,
): Promise<BlogPostForCarousel | null> {
  const client = getCarouselRunsClient();
  const { data, error } = await client
    .from("BlogPost")
    .select("id, slug, title, summary, content, category, published")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[news/carousel/carousel-runs-db] falha ao carregar BlogPost ${id}: ${error.message}`,
    );
  }
  if (!data) return null;

  const row = data as BlogPostForCarousel;
  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// carousel_runs — INSERT (auditoria) + COUNT (rate limit)
// ─────────────────────────────────────────────────────────────────────────────

export interface InsertCarouselRunInput {
  blog_post_id: string;
  generated_by_user_id: string;
  prompt_version: string;
  slides_count: number;
  openai_total_tokens: number;
  openai_cost_brl: number;
  status: "success" | "compliance_blocked" | "failed";
  zip_pathname?: string | null;
  error_message?: string | null;
}

export interface InsertedCarouselRunRef {
  id: string;
  generated_at: string;
}

export async function insertCarouselRun(
  input: InsertCarouselRunInput,
): Promise<InsertedCarouselRunRef> {
  const client = getCarouselRunsClient();
  const payload = {
    blog_post_id: input.blog_post_id,
    generated_by_user_id: input.generated_by_user_id,
    prompt_version: input.prompt_version,
    slides_count: input.slides_count,
    openai_total_tokens: input.openai_total_tokens,
    openai_cost_brl: input.openai_cost_brl,
    status: input.status,
    zip_pathname: input.zip_pathname ?? null,
    error_message: input.error_message ?? null,
  };

  const { data, error } = await client
    .from("carousel_runs")
    .insert(payload)
    .select("id, generated_at")
    .single();

  if (error || !data) {
    throw new Error(
      `[news/carousel/carousel-runs-db] falha ao registrar carousel_run: ${
        error?.message ?? "no data"
      }`,
    );
  }
  return data as InsertedCarouselRunRef;
}

/**
 * Conta carousel_runs com status='success' nas últimas 24h para rate limit.
 * RF-019 / CA-037: ≤10 carrosséis/dia/user.
 */
export async function countSuccessfulRunsLast24h(
  userId: string,
): Promise<number> {
  const client = getCarouselRunsClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await client
    .from("carousel_runs")
    .select("id", { count: "exact", head: true })
    .eq("generated_by_user_id", userId)
    .eq("status", "success")
    .gte("generated_at", since);

  if (error) {
    throw new Error(
      `[news/carousel/carousel-runs-db] falha em rate limit query: ${error.message}`,
    );
  }
  return count ?? 0;
}

/**
 * UPDATE em uma row de carousel_runs após upload do ZIP — preenche
 * `zip_pathname`. Chamado pelo route handler depois do upload bem-sucedido
 * em Supabase Storage.
 */
export async function updateCarouselRunZip(
  runId: string,
  zipPathname: string,
): Promise<void> {
  const client = getCarouselRunsClient();
  const { error } = await client
    .from("carousel_runs")
    .update({ zip_pathname: zipPathname })
    .eq("id", runId);
  if (error) {
    throw new Error(
      `[news/carousel/carousel-runs-db] falha ao atualizar zip_pathname run ${runId}: ${error.message}`,
    );
  }
}

/**
 * UPDATE final v2.0: total_cost (text + images), zip_pathname, status,
 * error_message. Chamado pela route depois de empacotar o ZIP.
 */
export interface UpdateCarouselRunFinalInput {
  total_cost_brl: number;
  zip_pathname: string | null;
  status: "success" | "failed";
  error_message: string | null;
}

export async function updateCarouselRunFinal(
  runId: string,
  patch: UpdateCarouselRunFinalInput,
): Promise<void> {
  const client = getCarouselRunsClient();
  const { error } = await client
    .from("carousel_runs")
    .update({
      openai_cost_brl: Number(patch.total_cost_brl.toFixed(4)),
      zip_pathname: patch.zip_pathname,
      status: patch.status,
      error_message: patch.error_message,
    })
    .eq("id", runId);
  if (error) {
    throw new Error(
      `[news/carousel/carousel-runs-db] falha ao atualizar final run ${runId}: ${error.message}`,
    );
  }
}
