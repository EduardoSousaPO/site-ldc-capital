/**
 * F-019 v2.2 — regenera APENAS slide 3 com OPÇÃO 1 image_prompt
 * (defesa contra hallucination "PREMIUM"). Boilerplate hardened já
 * em image-gen.ts.
 *
 * Pipeline:
 *  1. DALL-E 1× com novo image_prompt
 *  2. Render slide 3 LDC + Luciano
 *  3. Sobrescreve PNG nas 2 pastas v2.2
 *  4. Re-zipa estrutura completa (lê os outros 11 PNGs do disco)
 *  5. Re-uploada Supabase Storage com NOVO filename (timestamp)
 *  6. UPDATE carousel_runs com novo zip_pathname + cost_brl total
 *
 * Custo: R$0,22 (1 DALL-E).
 * Total final v2.2: R$0,86.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { generateSlideImage } from "../src/features/news/carousel/image-gen";
import { renderSlideTweet } from "../src/features/news/carousel/render";
import { uploadCarouselZipAndSign } from "../src/features/news/carousel/storage";
import { updateCarouselRunFinal } from "../src/features/news/carousel/carousel-runs-db";
import type { CarouselSlide } from "../src/features/news/contracts/carousel";

const TARGET_RUN_ID = "a7cb0643-6f2e-4804-a668-5d81f82686d8";
const PREVIOUS_TOTAL_COST_BRL = 0.644; // run v2.2 inicial
const REGEN_COST_BRL = 0.22; // 1 DALL-E
const NEW_TOTAL_COST_BRL = PREVIOUS_TOTAL_COST_BRL + REGEN_COST_BRL;

const SMOKE_DIR = path.join(
  process.cwd(),
  ".preview",
  "F-019-v2.2-final-smoke",
);

// Body do slide 3 v2.2 (do JSON do run a7cb0643). Hardcoded para evitar
// dependência de buscar do banco/storage.
const SLIDE_3: CarouselSlide = {
  index: 3,
  type: "dado",
  title: "Primeiro: caixa rendendo bem é só o começo",
  body: "**Primeiro**: caixa rendendo bem é só o começo.\n\nPara famílias de alto patrimônio, o caixa é menos de **20%** do bolo.\n\nO que conta é a **estrutura** de decisão.",
  // OPÇÃO 1 — robusta contra hallucination de texto
  image_prompt:
    "mão segurando caneta tinta sobre folha em branco, mesa de mármore escuro, close-up minimalista",
};

function timestampForFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "-" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

async function main() {
  const t0 = Date.now();

  console.log("[regen slide 3] (1/5) DALL-E generateSlideImage com OPÇÃO 1...");
  if (!SLIDE_3.image_prompt) {
    throw new Error("SLIDE_3.image_prompt está null");
  }
  const imgResult = await generateSlideImage({
    prompt: SLIDE_3.image_prompt,
    slideIndex: 3,
  });
  if (!imgResult.ok) {
    console.error(`[regen slide 3] DALL-E falhou: ${imgResult.error_message}`);
    process.exit(1);
  }
  console.log(
    `  ok em ${imgResult.attempts} tentativa(s), R$${imgResult.cost_brl.toFixed(4)}`,
  );

  console.log("[regen slide 3] (2/5) Render LDC + Luciano slide 3...");
  const ldcPng = await renderSlideTweet({
    slide: SLIDE_3,
    variation: "ldc",
    imageBuffer: imgResult.buffer,
  });
  const lucianoPng = await renderSlideTweet({
    slide: SLIDE_3,
    variation: "luciano",
    imageBuffer: imgResult.buffer,
  });

  console.log("[regen slide 3] (3/5) Sobrescrevendo slide-3-dado.png...");
  const ldcPath = path.join(SMOKE_DIR, "ldc", "slide-3-dado.png");
  const lucianoPath = path.join(SMOKE_DIR, "luciano", "slide-3-dado.png");
  fs.writeFileSync(ldcPath, ldcPng);
  fs.writeFileSync(lucianoPath, lucianoPng);

  console.log("[regen slide 3] (4/5) Re-zipando estrutura completa...");
  const zip = new JSZip();
  const ldcFolder = zip.folder("ldc");
  const lucianoFolder = zip.folder("luciano");
  if (!ldcFolder || !lucianoFolder) {
    throw new Error("falha ao criar folders no zip");
  }

  // Lê todos os PNGs (LDC + Luciano)
  const slideFiles = [
    "slide-1-hook.png",
    "slide-2-contexto.png",
    "slide-3-dado.png",
    "slide-4-pergunta.png",
    "slide-5-prova.png",
    "slide-6-cta.png",
  ];
  for (const f of slideFiles) {
    ldcFolder.file(
      f,
      fs.readFileSync(path.join(SMOKE_DIR, "ldc", f)),
    );
    lucianoFolder.file(
      f,
      fs.readFileSync(path.join(SMOKE_DIR, "luciano", f)),
    );
  }

  // Reusa caption-instagram.md, caption-linkedin.md e README.md do ZIP
  // anterior em memória.
  const previousZipFiles = fs.readdirSync(SMOKE_DIR).filter((f) =>
    f.endsWith(".zip"),
  );
  if (previousZipFiles.length === 0) {
    throw new Error("[regen slide 3] zip v2.2 anterior não encontrado em SMOKE_DIR");
  }
  const previousZipPath = path.join(SMOKE_DIR, previousZipFiles[0]);
  const previousZipBuf = fs.readFileSync(previousZipPath);
  const previousZip = await JSZip.loadAsync(previousZipBuf);
  for (const auxFile of [
    "caption-instagram.md",
    "caption-linkedin.md",
    "README.md",
  ]) {
    const entry = previousZip.file(auxFile);
    if (!entry) {
      throw new Error(`[regen slide 3] ${auxFile} não encontrado no zip anterior`);
    }
    zip.file(auxFile, await entry.async("nodebuffer"));
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  const newZipFilename = `selic-petroleo-janela-fiscal-implicacoes-uhnw-carousel-${timestampForFilename()}.zip`;
  const newLocalZipPath = path.join(SMOKE_DIR, newZipFilename);
  fs.writeFileSync(newLocalZipPath, zipBuffer);

  console.log("[regen slide 3] (5/5) Upload + UPDATE carousel_runs...");
  const uploaded = await uploadCarouselZipAndSign({
    pathname: newZipFilename,
    buffer: zipBuffer,
  });

  await updateCarouselRunFinal(TARGET_RUN_ID, {
    total_cost_brl: NEW_TOTAL_COST_BRL,
    zip_pathname: uploaded.pathname,
    status: "success",
    error_message: null,
  });

  const summary = {
    event: "regen_slide_3_complete",
    target_run_id: TARGET_RUN_ID,
    image_prompt_used: SLIDE_3.image_prompt,
    dalle_cost_brl: imgResult.cost_brl,
    new_total_cost_brl: NEW_TOTAL_COST_BRL,
    cost_guard_brl: 1.0,
    cost_exceeded: NEW_TOTAL_COST_BRL > 1.0,
    new_zip_filename: newZipFilename,
    new_zip_size_bytes: zipBuffer.length,
    new_zip_size_kb: Math.round(zipBuffer.length / 1024),
    new_signed_url_expires_at: uploaded.expires_at,
    duration_ms: Date.now() - t0,
    paths: {
      ldc_slide_3: ldcPath,
      luciano_slide_3: lucianoPath,
      new_local_zip: newLocalZipPath,
    },
  };
  console.log("\n=== REGEN SLIDE 3 v2.2 — SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((err) => {
  console.error("[regen slide 3] FALHOU:", err);
  process.exit(1);
});
