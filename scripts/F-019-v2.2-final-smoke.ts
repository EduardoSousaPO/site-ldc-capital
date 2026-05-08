/**
 * F-019 v2.1 #FINAL — smoke E2E com DALL-E real (image_prompt curto +
 * boilerplate server-side).
 *
 * Pipeline: text gen → 3× DALL-E paralelo → render LDC + Luciano → zip
 * → upload Supabase → carousel_runs success.
 *
 * Custo esperado: ~R$0,70.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { generateCarouselScript } from "../src/features/news/carousel/generator";
import { generateImagesForSlides } from "../src/features/news/carousel/image-gen";
import { renderCarouselAllVariations } from "../src/features/news/carousel/render";
import { packCarouselZip } from "../src/features/news/carousel/zip";
import { uploadCarouselZipAndSign } from "../src/features/news/carousel/storage";
import { updateCarouselRunFinal } from "../src/features/news/carousel/carousel-runs-db";

const BLOG_POST_ID = "5a157c14-b06b-4e85-8312-13942b88b914";
const ADMIN_USER_ID = "5258d21b-9dfa-4eea-8ef8-7fd3eed8748a";
const COST_GUARD_BRL = 1.0;
const OUT_DIR_NAME = "F-019-v2.2-final-smoke";

async function main() {
  const t0 = Date.now();
  const breakdown: Record<string, number> = {};

  console.log("[v2.2 smoke] (1/6) generateCarouselScript...");
  const tText0 = Date.now();
  const scriptResult = await generateCarouselScript(
    { blogPostId: BLOG_POST_ID, generatedByUserId: ADMIN_USER_ID },
    { skipRateLimit: true },
  );
  breakdown.text_gen_ms = Date.now() - tText0;

  console.log("[v2.2 smoke] (2/6) DALL-E generateImagesForSlides...");
  const tImg0 = Date.now();
  const imageBatch = await generateImagesForSlides(
    scriptResult.script.slides.map((s) => ({
      index: s.index,
      image_prompt: s.image_prompt,
    })),
  );
  breakdown.dalle_ms = Date.now() - tImg0;
  console.log(
    `  3 imagens em ${breakdown.dalle_ms}ms (${imageBatch.failures.length} falhas, custo R$${imageBatch.total_cost_brl.toFixed(4)})`,
  );

  console.log("[v2.2 smoke] (3/6) renderCarouselAllVariations (12 PNGs)...");
  const tRender0 = Date.now();
  const renderResult = await renderCarouselAllVariations(
    scriptResult.script.slides,
    imageBatch.images,
  );
  breakdown.render_ms = Date.now() - tRender0;

  console.log("[v2.2 smoke] (4/6) packCarouselZip...");
  const tZip0 = Date.now();
  const zipResult = await packCarouselZip({
    script: scriptResult.script,
    ldcPngs: renderResult.ldc,
    lucianoPngs: renderResult.luciano,
    carouselRunId: scriptResult.carousel_run_id,
    generatedAt: scriptResult.generated_at,
    imageGenFailures: imageBatch.failures.map((f) => ({
      slide_index: f.slide_index,
      reason: f.reason,
    })),
  });
  breakdown.zip_ms = Date.now() - tZip0;

  console.log("[v2.2 smoke] (5/6) upload Supabase Storage...");
  const tUpload0 = Date.now();
  const uploaded = await uploadCarouselZipAndSign({
    pathname: zipResult.filename,
    buffer: zipResult.buffer,
  });
  breakdown.upload_ms = Date.now() - tUpload0;

  const totalCostBrl = scriptResult.cost_brl + imageBatch.total_cost_brl;
  const costExceeded = totalCostBrl > COST_GUARD_BRL;
  await updateCarouselRunFinal(scriptResult.carousel_run_id, {
    total_cost_brl: totalCostBrl,
    zip_pathname: uploaded.pathname,
    status: costExceeded ? "failed" : "success",
    error_message: costExceeded
      ? `cost_exceeded: R$${totalCostBrl.toFixed(4)} > R$${COST_GUARD_BRL.toFixed(2)}`
      : null,
  });

  console.log("[v2.2 smoke] (6/6) saving local copy + extracting PNGs...");
  const outDir = path.join(process.cwd(), ".preview", OUT_DIR_NAME);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const localZipPath = path.join(outDir, zipResult.filename);
  fs.writeFileSync(localZipPath, zipResult.buffer);

  const ldcDir = path.join(outDir, "ldc");
  const lucianoDir = path.join(outDir, "luciano");
  fs.mkdirSync(ldcDir, { recursive: true });
  fs.mkdirSync(lucianoDir, { recursive: true });
  const pngPaths: { ldc: string[]; luciano: string[] } = {
    ldc: [],
    luciano: [],
  };
  scriptResult.script.slides.forEach((slide, i) => {
    const filename = `slide-${slide.index}-${slide.type.toLowerCase()}.png`;
    const ldcPath = path.join(ldcDir, filename);
    const lucianoPath = path.join(lucianoDir, filename);
    fs.writeFileSync(ldcPath, renderResult.ldc[i]);
    fs.writeFileSync(lucianoPath, renderResult.luciano[i]);
    pngPaths.ldc.push(ldcPath);
    pngPaths.luciano.push(lucianoPath);
  });

  // Anti-SPEC §6.2b regex em TODOS os artefatos
  const allText = [
    scriptResult.script.slides
      .map((s) => `${s.title} ${s.body} ${s.image_prompt ?? ""}`)
      .join(" "),
    scriptResult.script.caption_instagram,
    scriptResult.script.caption_linkedin,
    scriptResult.script.hashtags.join(" "),
  ].join(" ");
  const bloombergMatches = allText.match(/bloomberg/gi) ?? [];

  breakdown.total_ms = Date.now() - t0;

  const summary = {
    event: "smoke_f019_v2.2_final_complete",
    carousel_run_id: scriptResult.carousel_run_id,
    blog_post_id: BLOG_POST_ID,
    blog_post_slug: scriptResult.script.blog_post_slug,
    slides_count: scriptResult.script.slides.length,
    text_cost_brl: scriptResult.cost_brl,
    image_cost_brl: imageBatch.total_cost_brl,
    total_cost_brl: Number(totalCostBrl.toFixed(4)),
    cost_guard_brl: COST_GUARD_BRL,
    cost_exceeded: costExceeded,
    total_tokens: scriptResult.total_tokens,
    cached_tokens: scriptResult.cached_tokens,
    text_model: scriptResult.model,
    image_failures: imageBatch.failures,
    image_prompts_used: scriptResult.script.slides
      .filter((s) => s.image_prompt !== null)
      .map((s) => ({ index: s.index, prompt: s.image_prompt })),
    duration_ms_breakdown: breakdown,
    zip_filename: zipResult.filename,
    zip_size_bytes: zipResult.size_bytes,
    zip_size_kb: Math.round(zipResult.size_bytes / 1024),
    zip_size_mb: Number((zipResult.size_bytes / 1024 / 1024).toFixed(2)),
    signed_url_expires_at: uploaded.expires_at,
    local_zip_path: localZipPath,
    png_paths: pngPaths,
    anti_spec_6_2b: {
      regex: "/bloomberg/i",
      matches: bloombergMatches.length,
      passed: bloombergMatches.length === 0,
      checked_artifacts: [
        "slide.title",
        "slide.body",
        "slide.image_prompt",
        "caption_instagram",
        "caption_linkedin",
        "hashtags",
      ],
    },
  };

  console.log("\n=== SMOKE F-019 v2.1 FINAL — SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((err) => {
  console.error("[v2.1 smoke FINAL] FALHOU:", err);
  process.exit(1);
});
