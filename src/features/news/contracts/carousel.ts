import { z } from "zod";

/**
 * Contratos Zod para F-019 — Gerador de carrossel Instagram/LinkedIn.
 *
 * Padrão DOIS schemas (mesma lição de `openai.ts` / memória
 * `feedback_openai_structured_outputs`):
 *
 *   1. `CarouselScript` (RELAXADO) — usado em `zodResponseFormat()` do SDK
 *      OpenAI v6. SEM `.uuid()`, `.url()`, `.datetime()`, `.optional()`,
 *      `.refine()`. O SDK rejeita esses helpers e converter perde silenciosamente.
 *      Constraints estruturais (lengths, min/max, enum) continuam permitidas.
 *
 *   2. `CarouselScriptStrict` — re-validação no caller (`generator.ts`) após
 *      receber a resposta. Aqui aplicamos `.uuid()`, `.datetime()`, regex de
 *      slug e regex anti-Bloomberg (defense in depth Anti-SPEC §6.2b).
 *
 * O caller faz: `const parsed = CarouselScript.parse(openai.choices[0].message.parsed)`
 * dentro do `parse` natural do SDK; depois `CarouselScriptStrict.parse(parsed)`
 * antes de prosseguir para render.
 */

export const SLIDE_TYPES = [
  "hook",
  "contexto",
  "dado",
  "pergunta",
  "prova",
  "CTA",
] as const;

export const SlideType = z.enum(SLIDE_TYPES);
export type SlideType = z.infer<typeof SlideType>;

// Versão do prompt — fingerprint imutável após release. Qualquer edição no
// prompt OBRIGA bumpar este literal e abrir ADR.
export const CAROUSEL_PROMPT_VERSION = "blog-carousel-v1.0-2026-05-09" as const;
export const CarouselPromptVersionLiteral = z.literal(CAROUSEL_PROMPT_VERSION);

// ─────────────────────────────────────────────────────────────────────────────
// Schemas RELAXADOS (zodResponseFormat-friendly)
// ─────────────────────────────────────────────────────────────────────────────

export const CarouselSlide = z.object({
  index: z.number().int().min(1).max(7),
  type: SlideType,
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(180),
});
export type CarouselSlide = z.infer<typeof CarouselSlide>;

export const CarouselScript = z.object({
  // .uuid() removido — re-validado no Strict.
  blog_post_id: z.string().min(1),
  blog_post_slug: z.string().min(1).max(160),
  // .datetime() removido — re-validado no Strict.
  generated_at: z.string().min(1),
  prompt_version: CarouselPromptVersionLiteral,
  slides: z.array(CarouselSlide).min(5).max(7),
  caption_instagram: z.string().min(1).max(2200),
  caption_linkedin: z.string().min(1).max(3000),
  hashtags: z.array(z.string().min(1).max(64)).min(3).max(8),
});
export type CarouselScript = z.infer<typeof CarouselScript>;

// ─────────────────────────────────────────────────────────────────────────────
// Schema STRICT (re-validação no caller)
// ─────────────────────────────────────────────────────────────────────────────

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BLOOMBERG_REGEX = /bloomberg/i;
const HASHTAG_REGEX = /^#?[A-Za-z0-9_]{1,63}$/;

function noBloomberg(field: string) {
  return (value: string, ctx: z.RefinementCtx): void => {
    if (BLOOMBERG_REGEX.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Anti-SPEC §6.2b: "${field}" não pode mencionar Bloomberg`,
      });
    }
  };
}

export const CarouselSlideStrict = CarouselSlide.extend({
  title: z
    .string()
    .min(1)
    .max(80)
    .superRefine(noBloomberg("slide.title")),
  body: z
    .string()
    .min(1)
    .max(180)
    .superRefine(noBloomberg("slide.body")),
});
export type CarouselSlideStrict = z.infer<typeof CarouselSlideStrict>;

export const CarouselScriptStrict = z.object({
  blog_post_id: z.string().uuid(),
  blog_post_slug: z
    .string()
    .min(1)
    .max(160)
    .regex(SLUG_REGEX, "slug must be kebab-case"),
  generated_at: z.string().datetime(),
  prompt_version: CarouselPromptVersionLiteral,
  slides: z.array(CarouselSlideStrict).min(5).max(7),
  caption_instagram: z
    .string()
    .min(1)
    .max(2200)
    .superRefine(noBloomberg("caption_instagram")),
  caption_linkedin: z
    .string()
    .min(1)
    .max(3000)
    .superRefine(noBloomberg("caption_linkedin")),
  hashtags: z
    .array(
      z
        .string()
        .min(1)
        .max(64)
        .regex(HASHTAG_REGEX, "hashtag deve ser alfanumérica")
        .superRefine(noBloomberg("hashtag")),
    )
    .min(3)
    .max(8),
});
export type CarouselScriptStrict = z.infer<typeof CarouselScriptStrict>;

// ─────────────────────────────────────────────────────────────────────────────
// Persistência (`carousel_runs`)
// ─────────────────────────────────────────────────────────────────────────────

export const CarouselRunStatus = z.enum([
  "success",
  "compliance_blocked",
  "failed",
]);
export type CarouselRunStatus = z.infer<typeof CarouselRunStatus>;

export const CarouselRunRow = z.object({
  id: z.string().uuid(),
  blog_post_id: z.string().uuid(),
  generated_by_user_id: z.string().uuid(),
  generated_at: z.string().datetime(),
  prompt_version: z.string().min(1),
  slides_count: z.number().int().min(5).max(7),
  openai_total_tokens: z.number().int().min(0),
  openai_cost_brl: z.number().min(0),
  status: CarouselRunStatus,
  zip_pathname: z.string().nullable(),
  error_message: z.string().nullable(),
});
export type CarouselRunRow = z.infer<typeof CarouselRunRow>;

// ─────────────────────────────────────────────────────────────────────────────
// Resposta do endpoint POST /api/admin/posts/[id]/carousel
// ─────────────────────────────────────────────────────────────────────────────

export const CarouselSlidePreview = z.object({
  index: z.number().int().min(1).max(7),
  type: SlideType,
  title: z.string().min(1).max(80),
});
export type CarouselSlidePreview = z.infer<typeof CarouselSlidePreview>;

export const CarouselGenerationResult = z.object({
  carousel_run_id: z.string().uuid(),
  signed_url: z.string().url(),
  expires_at: z.string().datetime(),
  slides: z.array(CarouselSlidePreview).min(5).max(7),
  cost_brl: z.number().min(0),
});
export type CarouselGenerationResult = z.infer<typeof CarouselGenerationResult>;
