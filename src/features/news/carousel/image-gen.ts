/**
 * F-019 v2.0 — Wrapper DALL-E 3 para imagens hero do carrossel.
 *
 * 3 chamadas por carrossel (slides 1, 3, 6). Imagens compartilhadas entre
 * variações LDC e Luciano (gera 1×, reusa 2×).
 *
 * Defense in depth Anti-SPEC §6.2b: regex `/bloomberg/i` no `prompt`
 * ANTES da chamada DALL-E. Schema Strict já validou, mas mantemos check
 * runtime — se prompt contiver "bloomberg" por qualquer motivo, lança
 * erro local sem chamar API.
 *
 * Falha graciosa: até 3 tentativas com backoff exponencial. Se todas
 * falharem, retorna `null` para o caller decidir (slide vai text-only).
 *
 * Custo: $0.040 USD/imagem standard 1792×1024 (DALL-E 3 pricing 2026-05).
 * BRL @ 5.5 = ~R$0,22/imagem. 3 imagens × R$0,22 = R$0,66/carrossel.
 */

import OpenAI from "openai";

const DEFAULT_MODEL = "dall-e-3";
const DEFAULT_SIZE = "1792x1024" as const;
const DEFAULT_QUALITY = "standard" as const;
const DEFAULT_STYLE = "natural" as const;

/**
 * Boilerplate de estilo aplicado server-side em TODOS os image_prompts.
 * O LLM gera apenas o CONCEITO visual; este boilerplate fixa estética
 * UHNW + paleta brand + restrições Anti-SPEC §6.2b (defense in depth).
 *
 * Histórico de hardenings:
 *   - 2026-05-09 (v2.1): adicionado "no books with visible text" após
 *     smoke gerar capa "PRUM/WAST MORTH" inventada.
 *   - 2026-05-09 (v2.2): adicionado "no folders or portfolios with
 *     covers, no products with names, no marketing copy, no signs or
 *     signage" após smoke gerar pasta com "PREMIUM" em destaque. DALL-E
 *     ignora "no text on image" quando há objetos com superfícies
 *     marcadas (folders, portfólios, livros, placas) — precisamos
 *     enumerar cada classe de objeto.
 *
 * Mudar este texto invalida cache de imagens DALL-E (improvável reaproveitamento
 * inter-runs mesmo, mas mantém determinismo do estilo entre slides do mesmo
 * carrossel).
 */
const DALL_E_BOILERPLATE =
  "Editorial photography, 16:9 aspect ratio, premium UHNW aesthetic, palette: dark navy and olive green with warm light, minimalist composition, no readable text or letters anywhere, no logos, no branding labels, no folders or portfolios with covers, no documents with words, no books with visible pages or covers, no products with names, no identifiable faces, no charts with numbers, no Bloomberg branding, no marketing copy, no signs or signage";

export function buildFullImagePrompt(conceptPrompt: string): string {
  // Remove pontuação final do conceito antes de concatenar.
  const concept = conceptPrompt.replace(/[.!?]+\s*$/, "").trim();
  return `${concept}. ${DALL_E_BOILERPLATE}.`;
}

const USD_PER_IMAGE_DEFAULT = 0.04;
const USD_BRL_RATE_DEFAULT = 5.0;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [500, 1500, 4000] as const;

const BLOOMBERG_REGEX = /bloomberg/i;

function envNum(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export interface GenerateSlideImageInput {
  prompt: string;
  slideIndex: number;
}

export interface GenerateSlideImageOk {
  ok: true;
  buffer: Buffer;
  cost_brl: number;
  model: string;
  attempts: number;
}

export interface GenerateSlideImageFailed {
  ok: false;
  reason:
    | "bloomberg_in_prompt"
    | "openai_api_error"
    | "fetch_failed"
    | "no_data_returned";
  error_message: string;
  attempts: number;
}

export type GenerateSlideImageResult =
  | GenerateSlideImageOk
  | GenerateSlideImageFailed;

export class ImageGenBloombergError extends Error {
  readonly slide_index: number;
  readonly prompt_excerpt: string;
  constructor(slideIndex: number, prompt: string) {
    super(
      `Anti-SPEC §6.2b: image_prompt do slide ${slideIndex} contém "Bloomberg" — chamada DALL-E abortada`,
    );
    this.name = "ImageGenBloombergError";
    this.slide_index = slideIndex;
    this.prompt_excerpt = prompt.slice(0, 80);
  }
}

interface OpenAiImagesClient {
  images: {
    generate: (params: {
      model: string;
      prompt: string;
      size: string;
      quality: string;
      style: string;
      n: number;
    }) => Promise<{
      data?: Array<{ url?: string; b64_json?: string }>;
    }>;
  };
}

export interface GenerateSlideImageOptions {
  /** Cliente OpenAI customizado (testes injetam mock). */
  openaiClient?: OpenAiImagesClient;
  /** Override fetch para testes. */
  fetcher?: typeof fetch;
  /** Override max retries. */
  maxRetries?: number;
}

async function downloadImage(
  url: string,
  fetcher: typeof fetch,
): Promise<Buffer> {
  const res = await fetcher(url);
  if (!res.ok) {
    throw new Error(`fetch image ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gera UMA imagem DALL-E 3 para um slide. Retorna sempre um result tipado
 * — o caller decide se aborta a geração ou se segue text-only.
 *
 * Bloomberg defense in depth: lança ImageGenBloombergError ANTES de
 * chamar a API. Caller deve tratar como erro fatal (geração inteira aborta).
 */
export async function generateSlideImage(
  input: GenerateSlideImageInput,
  options: GenerateSlideImageOptions = {},
): Promise<GenerateSlideImageResult> {
  const { prompt, slideIndex } = input;

  if (BLOOMBERG_REGEX.test(prompt)) {
    throw new ImageGenBloombergError(slideIndex, prompt);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OPENAI_API_KEY ausente — image-gen abortado.");
  }

  const client: OpenAiImagesClient =
    options.openaiClient ??
    (new OpenAI({ apiKey }) as unknown as OpenAiImagesClient);
  const fetcher = options.fetcher ?? fetch;
  const maxRetries = options.maxRetries ?? MAX_RETRIES;

  const usdPerImage = envNum("DALLE_USD_PER_IMAGE", USD_PER_IMAGE_DEFAULT);
  const usdBrlRate = envNum("OPENAI_USD_BRL_RATE", USD_BRL_RATE_DEFAULT);
  const costBrl = usdPerImage * usdBrlRate;

  // O LLM gera apenas o CONCEITO; aqui adicionamos o boilerplate de estilo
  // e Anti-SPEC §6.2b ("no Bloomberg branding"). Isso garante consistência
  // visual entre os 3 slides de um mesmo carrossel mesmo se o LLM variar.
  const fullPrompt = buildFullImagePrompt(prompt);

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.images.generate({
        model: DEFAULT_MODEL,
        prompt: fullPrompt,
        size: DEFAULT_SIZE,
        quality: DEFAULT_QUALITY,
        style: DEFAULT_STYLE,
        n: 1,
      });

      const item = response.data?.[0];
      if (!item) {
        return {
          ok: false,
          reason: "no_data_returned",
          error_message: "DALL-E response.data vazio",
          attempts: attempt,
        };
      }

      let buffer: Buffer;
      if (item.b64_json) {
        buffer = Buffer.from(item.b64_json, "base64");
      } else if (item.url) {
        try {
          buffer = await downloadImage(item.url, fetcher);
        } catch (err) {
          lastError = err;
          if (attempt < maxRetries) {
            await sleep(RETRY_BACKOFF_MS[attempt - 1]);
            continue;
          }
          return {
            ok: false,
            reason: "fetch_failed",
            error_message:
              err instanceof Error ? err.message : String(err),
            attempts: attempt,
          };
        }
      } else {
        return {
          ok: false,
          reason: "no_data_returned",
          error_message: "DALL-E response sem url nem b64_json",
          attempts: attempt,
        };
      }

      return {
        ok: true,
        buffer,
        cost_brl: costBrl,
        model: DEFAULT_MODEL,
        attempts: attempt,
      };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await sleep(RETRY_BACKOFF_MS[attempt - 1]);
        continue;
      }
    }
  }

  return {
    ok: false,
    reason: "openai_api_error",
    error_message:
      lastError instanceof Error ? lastError.message : String(lastError),
    attempts: maxRetries,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch: gerar imagens para todos os slides com image_prompt populado.
// Compartilhado entre variações (gera 1×, render reusa 2×).
// ─────────────────────────────────────────────────────────────────────────────

export interface BatchSlideForImage {
  index: number;
  image_prompt: string | null;
}

export interface BatchImageResult {
  /** Map slide.index → Buffer ou null (text-only fallback). */
  images: Record<number, Buffer | null>;
  total_cost_brl: number;
  failures: Array<{
    slide_index: number;
    reason: GenerateSlideImageFailed["reason"];
    error_message: string;
  }>;
}

export async function generateImagesForSlides(
  slides: ReadonlyArray<BatchSlideForImage>,
  options: GenerateSlideImageOptions = {},
): Promise<BatchImageResult> {
  const images: Record<number, Buffer | null> = {};
  const failures: BatchImageResult["failures"] = [];
  let totalCost = 0;

  for (const slide of slides) {
    if (!slide.image_prompt) {
      images[slide.index] = null;
      continue;
    }
    const result = await generateSlideImage(
      { prompt: slide.image_prompt, slideIndex: slide.index },
      options,
    );
    if (result.ok) {
      images[slide.index] = result.buffer;
      totalCost += result.cost_brl;
    } else {
      images[slide.index] = null;
      failures.push({
        slide_index: slide.index,
        reason: result.reason,
        error_message: result.error_message,
      });
    }
  }

  return { images, total_cost_brl: totalCost, failures };
}
