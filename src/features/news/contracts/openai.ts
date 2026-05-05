import { z } from "zod";
import { CATEGORIA_ARTIGO_SLUGS } from "@/features/news/prompts/system-prompt";

/**
 * Contratos Zod para o pipeline IA pós-pivot ADR-005 (artigo denso → BlogPost).
 *
 * IMPORTANTE: estes schemas são TODOS relaxados. Eles são consumidos pelo
 * `zodResponseFormat` do SDK OpenAI v6, que rejeita schemas Zod com `.url()`,
 * `.uuid()`, `.optional()` sem `.nullable()`, e `.refine()` (lição F-007 mid-smoke
 * 2026-04-28 — ver memória `feedback_openai_structured_outputs`). Validação
 * dura (URL bem-formada, ausência de Bloomberg) é responsabilidade do caller
 * downstream — `openai-client.ts` reparseia via `BlogArticleGenerationResponse`
 * + checa Bloomberg + checa URL antes de retornar para o orchestrator.
 *
 * Para o consumidor TS dos tipos: importe `BlogArticleDraft` (etc.) daqui;
 * o tipo é o mesmo, apenas as constraints estritas vivem em runtime checks
 * separados em `openai-client.ts`.
 */

// 8 categorias do blog — slugs idênticos à migration `blog_categories_news_pivot`
// (Supabase Category.slug). Reusa a tupla canônica do system-prompt.ts para
// evitar drift entre o que o LLM lê e o que o validador aceita.
export const CategoriaArtigoSlug = z.enum(CATEGORIA_ARTIGO_SLUGS);
export type CategoriaArtigoSlug = z.infer<typeof CategoriaArtigoSlug>;

// Fonte pública citável. Em runtime, openai-client valida que `url` é
// well-formed, que `dominio` não contém "bloomberg" e que `dominio` está em
// PERPLEXITY_DOMAIN_FILTER. Aqui o schema é relaxado.
export const FonteCitavel = z.object({
  url: z.string().min(1),
  title: z.string().min(1),
  dominio: z.string().min(1),
});
export type FonteCitavel = z.infer<typeof FonteCitavel>;

export const NumeroDoArtigo = z.object({
  texto: z.string().min(1),
  fonte_url: z.string().min(1),
  fonte_nome: z.string().min(1),
});
export type NumeroDoArtigo = z.infer<typeof NumeroDoArtigo>;

// Cenário a monitorar — substitui "O que fica de olho" da v1. Forward-looking.
export const CenarioMonitorado = z.object({
  titulo: z.string().min(3),
  descricao: z.string().min(10),
  // OpenAI Structured Outputs: `.optional()` precisa virar `.nullable()` para
  // aceitar JSON sem o campo. `.nullable()` permite null OU string.
  gatilho: z.string().nullable(),
});
export type CenarioMonitorado = z.infer<typeof CenarioMonitorado>;

export const BlogArticleDraft = z.object({
  // Limites alinhados ao schema BlogPost (title é text). Mantém >= 20 e <= 120
  // para garantir título substantivo (não headline curtinha) e respeitar OG.
  title: z.string().min(20).max(120),
  // Slug em kebab-case — validação leve aqui; openai-client confirma o regex.
  slug: z.string().min(4).max(120),
  categoria_slug: CategoriaArtigoSlug,
  // Será BlogPost.summary. 80-300 chars.
  summary: z.string().min(80).max(300),
  // 1º parágrafo do body_markdown, replicado para rastreabilidade. Não vai
  // direto pra BlogPost (o body já contém).
  hook: z.string().min(80).max(2000),
  // 800-1500 palavras = ~2000-9000 chars (incluindo markdown overhead).
  body_markdown: z.string().min(2000).max(9000),
  cenarios: z.array(CenarioMonitorado).min(2).max(3),
  fontes: z.array(FonteCitavel).min(2).max(8),
  // Rastreabilidade: quais sinais Bloomberg inspiraram o artigo. Pode ser []
  // se o tema nasceu só de public_sources.
  fonte_origem_pdf_ids: z.array(z.string()),
});
export type BlogArticleDraft = z.infer<typeof BlogArticleDraft>;

export const ThemeDiscardReason = z.enum([
  "no_public_source",
  "off_topic",
  "duplicate",
]);
export type ThemeDiscardReason = z.infer<typeof ThemeDiscardReason>;

export const ThemeDiscarded = z.object({
  tema: z.string().min(1),
  reason: ThemeDiscardReason,
});
export type ThemeDiscarded = z.infer<typeof ThemeDiscarded>;

export const OpenAiUsageMetadata = z.object({
  model: z.string().min(1),
  total_tokens: z.number().int().min(0),
  cached_tokens: z.number().int().min(0),
  cost_brl: z.number().min(0),
});
export type OpenAiUsageMetadata = z.infer<typeof OpenAiUsageMetadata>;

// Input do LLM. Não vai pra zodResponseFormat (é formato de PROMPT, não de
// resposta), então pode ter constraints mais estritas.
export const BloombergSignalInput = z.object({
  pdf_id: z.string().min(1),
  format: z.string().min(1),
  text: z.string(),
  auto_translated: z.boolean(),
});
export type BloombergSignalInput = z.infer<typeof BloombergSignalInput>;

export const PublicSourceInput = z.object({
  tema_categoria: z.string().min(1),
  perplexity_content: z.string(),
  citations: z.array(FonteCitavel),
});
export type PublicSourceInput = z.infer<typeof PublicSourceInput>;

export const TurnoPipeline = z.enum(["manha", "tarde"]);
export type TurnoPipeline = z.infer<typeof TurnoPipeline>;

export const BlogArticleGenerationRequest = z.object({
  bloomberg_signals: z.array(BloombergSignalInput),
  public_sources: z.array(PublicSourceInput),
  turno: TurnoPipeline,
  data_referencia: z.string().min(8), // ISO date YYYY-MM-DD
});
export type BlogArticleGenerationRequest = z.infer<
  typeof BlogArticleGenerationRequest
>;

// Resposta do LLM (zodResponseFormat). Schema relaxado conforme lição F-007.
// `themes_discarded` precisa ser sempre array no JSON do LLM — schemas com
// `.default([])` quebram o Structured Output (o helper exige array literal).
// Caller normaliza para [] quando ausente.
export const BlogArticleGenerationResponse = z.object({
  articles: z.array(BlogArticleDraft).min(0).max(2),
  themes_discarded: z.array(ThemeDiscarded),
  metadata: OpenAiUsageMetadata,
});
export type BlogArticleGenerationResponse = z.infer<
  typeof BlogArticleGenerationResponse
>;
