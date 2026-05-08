/**
 * F-019 v2.1 — regenera APENAS o slide 6 do run acb76110-... com novo
 * image_prompt mais robusto contra hallucination de texto em livros.
 *
 * Não chama generateCarouselScript (não regenera JSON inteiro). Usa o
 * body do slide 6 hardcoded da última run aprovada e chama DALL-E 1× +
 * render LDC + Luciano. Salva como slide-6-cta-v2.png para review do
 * Eduardo antes de sobrescrever os arquivos finais.
 *
 * Custo: R$0,22 (1 imagem DALL-E).
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { generateSlideImage } from "../src/features/news/carousel/image-gen";
import { renderSlideTweet } from "../src/features/news/carousel/render";
import type { CarouselSlide } from "../src/features/news/contracts/carousel";

const TARGET_RUN_ID = "acb76110-bd29-4a91-b1ac-dab34a054497";
const OUT_DIR = path.join(
  process.cwd(),
  ".preview",
  "F-019-v2.1-final-smoke",
);

// Body do slide 6 — calibrado v2.1 com "Sem compromisso" + disclaimer literal.
// Hardcoded da run smoke #FINAL aprovada visualmente exceto pela imagem.
const SLIDE_6: CarouselSlide = {
  index: 6,
  type: "CTA",
  title: "Diagnóstico patrimonial LDC",
  body: "Se você toma decisão sobre patrimônio acima de **R$ 50 milhões**, vale uma conversa estruturada. Sem compromisso. Link na bio.\n\nLDC Capital · CVM 3976-4 · Conteúdo educacional. Não constitui recomendação de investimento.",
  // Opção preferida — interior de biblioteca clássica sem livros em close-up.
  image_prompt:
    "interior de biblioteca clássica com couro castanho e madeira escura, iluminação morna",
};

async function main() {
  const t0 = Date.now();
  console.log(
    `[regen slide 6] target run_id: ${TARGET_RUN_ID}\n` +
      `[regen slide 6] novo image_prompt: "${SLIDE_6.image_prompt}"\n`,
  );

  console.log("[regen slide 6] (1/3) DALL-E generateSlideImage...");
  if (!SLIDE_6.image_prompt) {
    throw new Error("SLIDE_6.image_prompt está null — fix the hardcoded value.");
  }
  const imgResult = await generateSlideImage({
    prompt: SLIDE_6.image_prompt,
    slideIndex: 6,
  });

  if (!imgResult.ok) {
    console.error(
      `[regen slide 6] DALL-E falhou (${imgResult.reason}): ${imgResult.error_message}`,
    );
    console.error(
      "[regen slide 6] Tente backup: 'textura de mármore travertino com caneta-tinteiro de prata sobre papel cartonado — close-up macro'",
    );
    process.exit(1);
  }

  const { buffer: heroBuffer, cost_brl, attempts } = imgResult;
  console.log(
    `  imagem ok em ${attempts} tentativa(s), R$${cost_brl.toFixed(4)}`,
  );

  console.log("[regen slide 6] (2/3) render LDC + Luciano...");
  const tRender0 = Date.now();
  const ldcPng = await renderSlideTweet({
    slide: SLIDE_6,
    variation: "ldc",
    imageBuffer: heroBuffer,
  });
  const lucianoPng = await renderSlideTweet({
    slide: SLIDE_6,
    variation: "luciano",
    imageBuffer: heroBuffer,
  });
  const renderMs = Date.now() - tRender0;

  console.log("[regen slide 6] (3/3) salvando como slide-6-cta-v2.png...");
  fs.mkdirSync(path.join(OUT_DIR, "ldc"), { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "luciano"), { recursive: true });
  const ldcPath = path.join(OUT_DIR, "ldc", "slide-6-cta-v2.png");
  const lucianoPath = path.join(OUT_DIR, "luciano", "slide-6-cta-v2.png");
  fs.writeFileSync(ldcPath, ldcPng);
  fs.writeFileSync(lucianoPath, lucianoPng);

  const summary = {
    event: "regen_slide_6_complete",
    target_run_id: TARGET_RUN_ID,
    image_prompt_used: SLIDE_6.image_prompt,
    dalle_cost_brl: cost_brl,
    dalle_attempts: attempts,
    render_ms: renderMs,
    duration_ms_total: Date.now() - t0,
    paths: {
      ldc: ldcPath,
      luciano: lucianoPath,
    },
    next_steps: [
      "Eduardo abre os 2 PNGs via Read tool",
      "Se aprovar: rodar F-019-v2.1-finalize-slide-6.ts (overwrite + re-zip + re-upload + update carousel_runs)",
      "Se rejeitar: rodar este script de novo com prompt backup (mármore ou páginas em branco)",
    ],
  };

  console.log("\n=== REGEN SLIDE 6 — SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((err) => {
  console.error("[regen slide 6] FALHOU:", err);
  process.exit(1);
});
