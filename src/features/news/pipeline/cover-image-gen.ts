/**
 * Geração de capa AI (DALL-E 3) para BlogPost gerado pelo pipeline.
 *
 * Após `insertBlogPost`, o orchestrator chama `generateAndAttachCover` para
 * popular `BlogPost.cover` com uma imagem editorial premium UHNW. Falha
 * graciosa: qualquer erro retorna `null` e o post fica sem capa (não bloqueia
 * pipeline nem aprovação Marcos).
 *
 * Padrões reusados de F-019:
 *   - Boilerplate visual UHNW (paleta navy + olive + warm light, sem texto,
 *     sem logos, sem rostos, sem branding Bloomberg)
 *   - Conceito derivado por categoria (8 categorias canônicas, fallback
 *     skyline SP golden hour)
 *   - Cliente Supabase isolado (memória `feedback_supabase_js_multi_table`)
 *
 * Anti-SPEC §6.2b: image_prompt JAMAIS contém "Bloomberg" — guard via regex
 * antes do DALL-E call. Boilerplate inclui "no Bloomberg branding".
 *
 * Custo estimado: R$0,22/post (DALL-E 3 standard 1792×1024).
 */

import OpenAI from "openai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CategoriaArtigoSlug } from "@/features/news/contracts/openai";

const COVER_BUCKET = "ldc-assets";
const COVER_PATH_PREFIX = "blog-covers";
const DALL_E_BOILERPLATE =
  "Editorial photography, premium UHNW aesthetic, " +
  "palette: dark navy and olive green with warm light, " +
  "minimalist composition with depth and atmospheric haze, " +
  "no readable text or letters anywhere, no logos, no branding labels, " +
  "no folders or portfolios with covers, no documents with words, " +
  "no books with visible pages or covers, no products with names, " +
  "no identifiable faces, no charts with numbers, no Bloomberg branding, " +
  "no marketing copy, no signs or signage, " +
  "professional documentary photography style, sharp focus";

// Mapping de categoria → conceito visual editorial.
// Mantém paleta UHNW; varia o sujeito da imagem por contexto temático.
const CATEGORY_TO_CONCEPT: Record<CategoriaArtigoSlug, string> = {
  "macro-brasil":
    "São Paulo financial district skyline at golden hour viewed across Pinheiros river with water reflections",
  "macro-global":
    "Manhattan skyline at golden hour viewed from Brooklyn Bridge Park with Hudson river reflections",
  geopolitica:
    "Abstract atmospheric world map composition at twilight, continents suggested by warm light pools on dark surface",
  "planejamento-financeiro":
    "Empty premium home office interior at golden hour, dark wood desk, leather chair, warm window light",
  "investimento-internacional":
    "Global financial centers at twilight, abstract overlay of distant city silhouettes connected by warm light streaks",
  "renda-fixa-credito":
    "Close-up of fountain pen on premium blank document over dark walnut desk, warm side lighting",
  "mercado-de-capitais-br":
    "Modern Brazilian corporate building lobby at golden hour, marble floor, premium interior with warm sunlight",
  "analises-e-estrategia":
    "Empty modern boardroom, long dark wood table, leather chairs, atmospheric warm window light, no people",
};

const DEFAULT_CONCEPT = CATEGORY_TO_CONCEPT["macro-brasil"];

/**
 * Anti-SPEC §6.2b — bloqueia DALL-E se prompt contiver "Bloomberg".
 * Defense in depth: boilerplate já diz "no Bloomberg branding"; este check
 * pega a improbabilidade do conceito específico vazar a palavra.
 */
class CoverPromptBloombergError extends Error {
  constructor(prompt: string) {
    super(
      `[news/cover-image-gen] image_prompt contém "bloomberg": ${prompt.slice(0, 80)}...`,
    );
    this.name = "CoverPromptBloombergError";
  }
}

export interface GenerateCoverInput {
  blogPostId: string;
  categoriaSlug: CategoriaArtigoSlug;
}

export interface GenerateCoverResult {
  /** URL pública atualizada em BlogPost.cover. `null` se falhou (graceful). */
  coverUrl: string | null;
  /** Custo BRL estimado da chamada DALL-E. 0 se falhou antes da chamada. */
  costBrl: number;
  /** Mensagem de erro para auditoria (não exposta ao usuário). */
  errorMessage: string | null;
}

interface InternalDeps {
  openaiClient?: OpenAI;
  supabaseClient?: SupabaseClient;
  fetchImpl?: typeof fetch;
}

const DALL_E_COST_BRL = 0.22; // standard 1792×1024 at ~R$5.5/USD

function buildCoverPrompt(categoriaSlug: CategoriaArtigoSlug): string {
  const concept = CATEGORY_TO_CONCEPT[categoriaSlug] ?? DEFAULT_CONCEPT;
  // Anti-SPEC §6.2b é checada SOMENTE no conceito (boilerplate inclui
  // "no Bloomberg branding" como negative prompt intencional ao DALL-E).
  antiSpecConceptCheck(concept);
  return `${concept}. ${DALL_E_BOILERPLATE}`;
}

/**
 * Anti-SPEC §6.2b — bloqueia se o CONCEITO da imagem mencionar Bloomberg.
 * NÃO aplica ao prompt completo: o boilerplate tem "no Bloomberg branding"
 * como instrução negativa intencional ao DALL-E (defense in depth).
 */
function antiSpecConceptCheck(concept: string): void {
  if (/bloomberg/i.test(concept)) {
    throw new CoverPromptBloombergError(concept);
  }
}

function getOpenAiClient(deps: InternalDeps): OpenAI {
  if (deps.openaiClient) return deps.openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ausente — cover gen abortado.");
  }
  return new OpenAI({ apiKey });
}

function getSupabaseClient(deps: InternalDeps): SupabaseClient {
  if (deps.supabaseClient) return deps.supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Gera capa via DALL-E, faz upload pro Supabase Storage e atualiza
 * BlogPost.cover. Retorna `coverUrl: null` em caso de falha (graceful).
 *
 * Não throw. Auditoria via console.error estruturado + retorno errorMessage.
 */
export async function generateAndAttachCover(
  input: GenerateCoverInput,
  deps: InternalDeps = {},
): Promise<GenerateCoverResult> {
  const { blogPostId, categoriaSlug } = input;
  const fetchFn = deps.fetchImpl ?? fetch;

  let costBrl = 0;
  try {
    const prompt = buildCoverPrompt(categoriaSlug);

    const openai = getOpenAiClient(deps);
    const t0 = Date.now();
    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1792x1024",
      quality: "standard",
      style: "natural",
      n: 1,
    });
    costBrl = DALL_E_COST_BRL;
    const imageUrl = result.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("DALL-E retornou sem url.");
    }

    const dlResp = await fetchFn(imageUrl);
    if (!dlResp.ok) {
      throw new Error(`Download imagem falhou: HTTP ${dlResp.status}`);
    }
    const buffer = Buffer.from(await dlResp.arrayBuffer());

    const supabase = getSupabaseClient(deps);
    const storagePath = `${COVER_PATH_PREFIX}/${blogPostId}-${Date.now()}.png`;
    const { error: uploadErr } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(storagePath, buffer, {
        contentType: "image/png",
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadErr) {
      throw new Error(`Upload Supabase Storage falhou: ${uploadErr.message}`);
    }

    const { data: publicData } = supabase.storage
      .from(COVER_BUCKET)
      .getPublicUrl(storagePath);
    const coverUrl = publicData.publicUrl;

    const { error: updateErr } = await supabase
      .from("BlogPost")
      .update({ cover: coverUrl })
      .eq("id", blogPostId);
    if (updateErr) {
      throw new Error(`UPDATE BlogPost.cover falhou: ${updateErr.message}`);
    }

    console.info(
      JSON.stringify({
        event: "blog_cover_attached",
        blog_post_id: blogPostId,
        categoria_slug: categoriaSlug,
        cover_url: coverUrl,
        storage_path: storagePath,
        cost_brl: costBrl,
        duration_ms: Date.now() - t0,
      }),
    );

    return { coverUrl, costBrl, errorMessage: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        event: "blog_cover_failed",
        blog_post_id: blogPostId,
        categoria_slug: categoriaSlug,
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: message.slice(0, 200),
        cost_brl_paid: costBrl,
      }),
    );
    return { coverUrl: null, costBrl, errorMessage: message };
  }
}

export const __COVER_IMAGE_GEN_INTERNALS = {
  COVER_BUCKET,
  COVER_PATH_PREFIX,
  DALL_E_BOILERPLATE,
  CATEGORY_TO_CONCEPT,
  DEFAULT_CONCEPT,
  DALL_E_COST_BRL,
  buildCoverPrompt,
  antiSpecConceptCheck,
  CoverPromptBloombergError,
};
