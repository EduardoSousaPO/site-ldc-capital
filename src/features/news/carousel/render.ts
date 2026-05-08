/**
 * F-019 v2.0 — Render dos slides mock-tweet.
 *
 * Pivot 2026-05-09 (ADR-006): formato editorial → X-mock screenshot.
 * Template único `SlideTweet.tsx`. Formato 1080×1350 (IG portrait,
 * vale também para LinkedIn — descarte do 1080×1080 separado).
 *
 * Cache module-scope: fontes (4 arquivos) + 2 avatares lidos UMA vez
 * no boot. Imagens hero (DALL-E) vêm do caller — não cacheadas aqui.
 */

import { ImageResponse } from "@vercel/og";
import fs from "node:fs";
import path from "node:path";
import * as React from "react";
import type {
  CarouselSlide,
  CarouselVariation,
} from "@/features/news/contracts/carousel";
import { SlideTweet } from "./templates/SlideTweet";

// ─────────────────────────────────────────────────────────────────────────────
// Cache module-scope — fonts + avatares
// ─────────────────────────────────────────────────────────────────────────────

const FONT_DIR = path.join(process.cwd(), "src", "fonts");
const PUBLIC_DIR = path.join(process.cwd(), "public", "images");

function readFontBuffer(filename: string): ArrayBuffer {
  const full = path.join(FONT_DIR, filename);
  const buf = fs.readFileSync(full);
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
}

function readImageDataUrl(relPath: string): string {
  const full = path.join(PUBLIC_DIR, relPath);
  const buf = fs.readFileSync(full);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

const publicSansRegular = readFontBuffer("PublicSans-Regular.ttf");
const publicSansBold = readFontBuffer("PublicSans-Bold.ttf");
// IvyMode: mantemos no cache caso futuras iterações reativem títulos
// editoriais (custo de leitura é zero — fontes ficam em memória do boot).
const ivyModeBold = readFontBuffer("IvyMode-Bold.otf");
const ivyModeRegular = readFontBuffer("IvyMode-Regular.otf");

const AVATARS: Record<CarouselVariation, string> = {
  ldc: readImageDataUrl(path.join("avatars", "ldc-capital.png")),
  luciano: readImageDataUrl(path.join("avatars", "luciano-herzog.png")),
};

const COMMON_FONTS = [
  { name: "PublicSans", data: publicSansRegular, weight: 400 as const, style: "normal" as const },
  { name: "PublicSans", data: publicSansBold, weight: 700 as const, style: "normal" as const },
  { name: "IvyMode", data: ivyModeBold, weight: 700 as const, style: "normal" as const },
  { name: "IvyMode", data: ivyModeRegular, weight: 400 as const, style: "normal" as const },
];

// ─────────────────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────────────────

const SLIDE_WIDTH = 1080;
const SLIDE_HEIGHT = 1350;

export class CarouselRenderError extends Error {
  readonly slide_index: number;
  readonly variation: CarouselVariation;
  constructor(slideIndex: number, variation: CarouselVariation, cause: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(
      `Render falhou para slide ${slideIndex} (${variation}): ${causeMessage}`,
    );
    this.name = "CarouselRenderError";
    this.slide_index = slideIndex;
    this.variation = variation;
  }
}

interface RenderSlideTweetInput {
  slide: CarouselSlide;
  variation: CarouselVariation;
  /** PNG buffer da imagem hero (slides 1/3/6). null = text-only fallback. */
  imageBuffer: Buffer | null;
}

function imageBufferToDataUrl(buf: Buffer): string {
  // DALL-E retorna PNG; assumimos PNG sempre (signature 89 50 4E 47).
  // Mesmo se vier outro formato, browser/Satori entende mime genérico.
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export async function renderSlideTweet(
  input: RenderSlideTweetInput,
): Promise<Buffer> {
  const { slide, variation, imageBuffer } = input;

  try {
    const element = React.createElement(SlideTweet, {
      body: slide.body,
      variation,
      avatarDataUrl: AVATARS[variation],
      imageDataUrl: imageBuffer ? imageBufferToDataUrl(imageBuffer) : null,
    });

    const response = new ImageResponse(element, {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      fonts: COMMON_FONTS,
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    throw new CarouselRenderError(slide.index, variation, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pool de concorrência (renders em paralelo controlado)
// ─────────────────────────────────────────────────────────────────────────────

const RENDER_CONCURRENCY = 4;

async function runWithPool<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= tasks.length) return;
      results[i] = await tasks[i]();
    }
  }
  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

interface RenderForVariationInput {
  slides: ReadonlyArray<CarouselSlide>;
  variation: CarouselVariation;
  /** Map slide.index → Buffer ou null (compartilhado entre variações). */
  sharedImages: Record<number, Buffer | null>;
}

/**
 * Renderiza TODOS os slides de UMA variação. Imagens são parâmetro
 * (compartilhadas entre as 2 variações — gera 1×, render usa 2×).
 */
export async function renderCarouselForVariation(
  input: RenderForVariationInput,
): Promise<Buffer[]> {
  const { slides, variation, sharedImages } = input;
  const tasks = slides.map(
    (slide) => () =>
      renderSlideTweet({
        slide,
        variation,
        imageBuffer: sharedImages[slide.index] ?? null,
      }),
  );
  return runWithPool(tasks, RENDER_CONCURRENCY);
}

export interface RenderAllVariationsResult {
  ldc: Buffer[];
  luciano: Buffer[];
  total_render_ms: number;
}

/**
 * Renderiza ambas as variações em sequência (não paralelo entre variações
 * para preservar pool global de 4). Imagens são param compartilhada.
 */
export async function renderCarouselAllVariations(
  slides: ReadonlyArray<CarouselSlide>,
  sharedImages: Record<number, Buffer | null>,
): Promise<RenderAllVariationsResult> {
  const t0 = Date.now();
  const ldc = await renderCarouselForVariation({
    slides,
    variation: "ldc",
    sharedImages,
  });
  const luciano = await renderCarouselForVariation({
    slides,
    variation: "luciano",
    sharedImages,
  });
  return {
    ldc,
    luciano,
    total_render_ms: Date.now() - t0,
  };
}

// Internals para preview script
export const __RENDER_INTERNALS = {
  AVATARS,
  COMMON_FONTS,
  SLIDE_WIDTH,
  SLIDE_HEIGHT,
};
