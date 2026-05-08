/**
 * F-019 v2.0 PAUSE B — render 3 previews para validação visual.
 *
 * Renderiza:
 *   - slide 1 (hook COM imagem) variação LDC
 *   - slide 1 (hook COM imagem) variação Luciano
 *   - slide 4 (text-only) variação LDC
 *
 * Imagem hero é placeholder local (não chama DALL-E neste preview — Eduardo
 * valida APENAS o layout do mock-tweet antes do gasto de imagens reais).
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { renderSlideTweet } from "../src/features/news/carousel/render";
import type { CarouselSlide } from "../src/features/news/contracts/carousel";

const OUT_DIR = path.join(process.cwd(), ".preview");

// Conteúdo MOCK do JSON real do smoke #5 mais recente (carousel_run_id
// 583e7f15...) adaptado para v2.0 com bold markdown.
const SLIDE_1_HOOK: CarouselSlide = {
  index: 1,
  type: "hook",
  title: "Juros altos não são o vilão que famílias UHNW imaginam",
  body: "Juros altos não são o vilão que famílias UHNW imaginam.\n\nEm regimes de **Selic 14,75%** e petróleo elevado, a janela fiscal e a estrutura patrimonial pesam mais que a taxa nominal.\n\nEstruturas societárias e governança determinam se essa janela vira **vantagem** ou **custo**.",
  image_prompt:
    "Fotografia editorial premium minimalista de skyline urbano de São Paulo ao entardecer, paleta azul-marinho e verde-oliva, natural lighting, sem texto, sem pessoas, ratio 16:9",
};

const SLIDE_4_QUESTION: CarouselSlide = {
  index: 4,
  type: "pergunta",
  title: "Como sua estrutura responde a essa janela?",
  body: "Como sua estrutura responde a essa janela?\n\nDecisões sobre **distribuição de lucros**, atualização de pactos e poderes de governança devem ser ponderadas segundo **horizonte multigeracional** — não apenas pelo calendário fiscal corrente.",
  image_prompt: null,
};

/** Gera um placeholder PNG 1792×1024 com gradient azul-marinho → verde-oliva
 *  para simular o output DALL-E sem custo de API. */
async function generatePlaceholderHeroImage(): Promise<Buffer> {
  // SVG simples com gradient da paleta da marca.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1792" height="1024" viewBox="0 0 1792 1024">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#262d3d"/>
      <stop offset="100%" stop-color="#98ab44" stop-opacity="0.4"/>
    </linearGradient>
  </defs>
  <rect width="1792" height="1024" fill="url(#g)"/>
  <text x="50%" y="50%" font-family="serif" font-size="48" fill="#FFFFFF" opacity="0.25" text-anchor="middle" dominant-baseline="middle">[placeholder DALL-E hero — preview only]</text>
</svg>`;
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function runJob(
  outName: string,
  slide: CarouselSlide,
  variation: "ldc" | "luciano",
  imageBuffer: Buffer | null,
) {
  const t0 = Date.now();
  const png = await renderSlideTweet({ slide, variation, imageBuffer });
  const renderMs = Date.now() - t0;

  const outPath = path.join(OUT_DIR, outName);
  fs.writeFileSync(outPath, png);
  const stats = fs.statSync(outPath);
  console.log(
    JSON.stringify(
      {
        event: "preview_v2_rendered",
        slide_index: slide.index,
        slide_type: slide.type,
        variation,
        has_image: imageBuffer !== null,
        path: outPath,
        kb: Math.round(stats.size / 1024),
        render_ms: renderMs,
      },
      null,
      2,
    ),
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("[F-019 v2 PAUSE B] Renderizando 3 previews mock-tweet...");

  console.log("[diag] gerando placeholder hero image (sharp SVG)...");
  const heroBuffer = await generatePlaceholderHeroImage();

  await runJob("F-019-v2-slide-1-ldc.png", SLIDE_1_HOOK, "ldc", heroBuffer);
  await runJob("F-019-v2-slide-1-luciano.png", SLIDE_1_HOOK, "luciano", heroBuffer);
  await runJob("F-019-v2-slide-4-ldc.png", SLIDE_4_QUESTION, "ldc", null);
}

void main().catch((err) => {
  console.error("[F-019 v2 PAUSE B] FALHOU:", err);
  process.exit(1);
});
