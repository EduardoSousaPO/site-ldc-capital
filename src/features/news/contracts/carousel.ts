import { z } from "zod";

/**
 * Contratos Zod para F-019 v2.0 — Carrossel formato X-mock screenshot.
 *
 * Pivot 2026-05-09 (ADR-006): formato editorial → mock-tweet do X.com.
 * Schema v1.0 substituído integralmente; mantemos os mesmos nomes
 * (CarouselSlide, CarouselScript) com novos campos.
 *
 * Padrão DOIS schemas (memória `feedback_openai_structured_outputs`):
 *
 *   1. `CarouselScript` (RELAXADO) — usado em `zodResponseFormat()` SDK
 *      OpenAI v6. SEM `.uuid()`, `.url()`, `.datetime()`, `.optional()`,
 *      `.refine()`. Constraints estruturais (lengths, min/max, enum) OK.
 *
 *   2. `CarouselScriptStrict` — re-validação no caller. Aqui aplicamos
 *      `.uuid()`, `.datetime()`, regex slug, regex anti-Bloomberg, e
 *      validação do bold markdown (≤5 trechos `**xxx**` por slide).
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

// Versão v2.2 — bump 2026-05-09 (estratégia compliance social per ADR-007:
// disclaimer CVM 3976-4 vive APENAS no /blog editorial completo; carrosséis
// IG/LinkedIn carregam compliance via guardrails do prompt — zero ticker,
// zero prescrição, zero promessa, zero Bloomberg). Threshold ampliado
// R$50M→R$1M. Termo "UHNW" substituído por "alto patrimônio" / "grande
// patrimônio" (acessibilidade PT-BR).
// v2.0 e v2.1 não chegaram a produção (smoke local apenas).
export const CAROUSEL_PROMPT_VERSION = "blog-carousel-v2.2-2026-05-09" as const;
export const CarouselPromptVersionLiteral = z.literal(CAROUSEL_PROMPT_VERSION);

// Slides com imagem hero embedada. Apenas 1 (hook), 3 (dado) e 6 (CTA)
// recebem `image_prompt`; os demais são text-only no formato mock-tweet.
// Determinismo via slide.index (não dependemos de slide.type para decidir
// se renderiza imagem — o LLM decide via image_prompt presente/ausente).

// ─────────────────────────────────────────────────────────────────────────────
// Schemas RELAXADOS (zodResponseFormat-friendly)
// ─────────────────────────────────────────────────────────────────────────────

export const CarouselSlide = z.object({
  index: z.number().int().min(1).max(7),
  type: SlideType,
  // title é opcional VISUALMENTE no mock-tweet (o nome da conta cumpre
  // papel de "lead-in"), mas mantemos para metadata/preview UI. Pode ser
  // string vazia em slides text-only se o modelo preferir não usar.
  title: z.string().max(80),
  // body cap subiu 320 → 360 (acomoda 3 parágrafos curtos de tweet).
  body: z.string().min(1).max(360),
  // image_prompt OPCIONAL — apenas o CONCEITO visual (sujeito da imagem).
  // O boilerplate de estilo (paleta, ratio, "no text", "no Bloomberg") é
  // adicionado server-side em image-gen.ts. Cap 120 chars força foco no
  // conceito; >120 indica que LLM ignorou a regra e tentou repetir
  // boilerplate. Schema strict aplica anti-boilerplate refine.
  image_prompt: z.string().max(120).nullable(),
});
export type CarouselSlide = z.infer<typeof CarouselSlide>;

export const CarouselScript = z.object({
  blog_post_id: z.string().min(1),
  blog_post_slug: z.string().min(1).max(160),
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
// Hashtag aceita Unicode letters (acentos PT-BR — ç, ã, õ, é, etc.) +
// dígitos + underscore. Tamanho 1-63.
const HASHTAG_REGEX = /^#?[\p{L}\p{N}_]{1,63}$/u;
const BOLD_MARKDOWN_RE = /\*\*([^*]+)\*\*/g;
const MAX_BOLD_PER_SLIDE = 5;

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

function maxBoldTrechos(field: string) {
  return (value: string, ctx: z.RefinementCtx): void => {
    const matches = value.match(BOLD_MARKDOWN_RE) ?? [];
    if (matches.length > MAX_BOLD_PER_SLIDE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field}: máximo ${MAX_BOLD_PER_SLIDE} trechos **xxx** por slide (recebido ${matches.length})`,
      });
    }
  };
}

// Boilerplate keywords — server-side em image-gen.ts adiciona estes termos
// automaticamente. Se o LLM repete, image_prompt vira ruído (cap 120 já é
// apertado). Strict refine sinaliza isso para regenerar antes do DALL-E.
const IMAGE_PROMPT_BOILERPLATE_KEYWORDS = [
  "editorial",
  "16:9",
  "ratio",
  "estética uhnw",
  "paleta",
  "minimalista",
  "sem texto",
  "sem logo",
  "no text",
  "no logos",
  "no bloomberg",
  "natural lighting",
];

function noBoilerplateInImagePrompt(field: string) {
  return (value: string | null, ctx: z.RefinementCtx): void => {
    if (value === null) return;
    const lower = value.toLowerCase();
    const hits = IMAGE_PROMPT_BOILERPLATE_KEYWORDS.filter((kw) =>
      lower.includes(kw),
    );
    if (hits.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} contém boilerplate (${hits.join(", ")}); LLM deveria gerar APENAS o conceito visual — boilerplate é adicionado server-side`,
      });
    }
  };
}

export const CarouselSlideStrict = CarouselSlide.extend({
  title: z
    .string()
    .max(80)
    .superRefine(noBloomberg("slide.title")),
  body: z
    .string()
    .min(1)
    .max(360)
    .superRefine(noBloomberg("slide.body"))
    .superRefine(maxBoldTrechos("slide.body")),
  image_prompt: z
    .string()
    .max(120)
    .nullable()
    .superRefine((value, ctx) => {
      if (value !== null && BLOOMBERG_REGEX.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Anti-SPEC §6.2b: image_prompt não pode mencionar Bloomberg (defense in depth — DALL-E não pode gerar Bloomberg branded content)",
        });
      }
    })
    .superRefine(noBoilerplateInImagePrompt("image_prompt")),
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
// Variação — header do mock-tweet (LDC institucional vs Luciano pessoal)
// ─────────────────────────────────────────────────────────────────────────────

export const CAROUSEL_VARIATIONS = ["ldc", "luciano"] as const;
export const CarouselVariation = z.enum(CAROUSEL_VARIATIONS);
export type CarouselVariation = z.infer<typeof CarouselVariation>;

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
  title: z.string().max(80),
  has_image: z.boolean(),
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
