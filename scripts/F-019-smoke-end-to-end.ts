/**
 * F-019 #23 — Smoke end-to-end local.
 *
 * Roda generator + render + zip + upload supabase storage usando
 * BlogPost real (5a157c14-...). Salva ZIP em .preview/ para inspeção
 * visual local antes do PR.
 *
 * Pré-requisitos:
 *   .env: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { generateCarouselScript } from "../src/features/news/carousel/generator";
import { renderCarouselSlides } from "../src/features/news/carousel/render";
import { packCarouselZip } from "../src/features/news/carousel/zip";
import { uploadCarouselZipAndSign } from "../src/features/news/carousel/storage";
import { updateCarouselRunZip } from "../src/features/news/carousel/carousel-runs-db";

const BLOG_POST_ID = "5a157c14-b06b-4e85-8312-13942b88b914";
const ADMIN_USER_ID = "5258d21b-9dfa-4eea-8ef8-7fd3eed8748a";

async function main() {
  const t0 = Date.now();

  console.log("[smoke F-019] (1/5) generateCarouselScript...");
  const scriptResult = await generateCarouselScript(
    { blogPostId: BLOG_POST_ID, generatedByUserId: ADMIN_USER_ID },
    { skipRateLimit: true },
  );

  console.log("[smoke F-019] (2/5) renderCarouselSlides (12 PNGs)...");
  const tRender0 = Date.now();
  const { instagram, linkedin, total_render_ms } = await renderCarouselSlides(
    scriptResult.script.slides,
  );
  console.log(`  render took ${Date.now() - tRender0}ms (lib reported ${total_render_ms}ms)`);

  console.log("[smoke F-019] (3/5) packCarouselZip...");
  const zipResult = await packCarouselZip({
    script: scriptResult.script,
    instagramPngs: instagram,
    linkedinPngs: linkedin,
    carouselRunId: scriptResult.carousel_run_id,
    generatedAt: scriptResult.generated_at,
  });

  console.log("[smoke F-019] (4/5) upload Supabase Storage...");
  const uploaded = await uploadCarouselZipAndSign({
    pathname: zipResult.filename,
    buffer: zipResult.buffer,
  });

  await updateCarouselRunZip(scriptResult.carousel_run_id, uploaded.pathname);

  console.log("[smoke F-019] (5/5) saving local copy...");
  const outDir = path.join(process.cwd(), ".preview");
  fs.mkdirSync(outDir, { recursive: true });
  const localPath = path.join(outDir, zipResult.filename);
  fs.writeFileSync(localPath, zipResult.buffer);

  // Anti-SPEC §6.2b sanity check sobre o JSON gerado
  const allText = [
    scriptResult.script.slides
      .map((s) => `${s.title} ${s.body}`)
      .join(" "),
    scriptResult.script.caption_instagram,
    scriptResult.script.caption_linkedin,
    scriptResult.script.hashtags.join(" "),
  ].join(" ");
  const bloombergMatches = allText.match(/bloomberg/gi) ?? [];

  const summary = {
    event: "smoke_f019_complete",
    carousel_run_id: scriptResult.carousel_run_id,
    blog_post_id: BLOG_POST_ID,
    blog_post_slug: scriptResult.script.blog_post_slug,
    slides_count: scriptResult.script.slides.length,
    cost_brl: scriptResult.cost_brl,
    cost_exceeded: scriptResult.cost_exceeded,
    total_tokens: scriptResult.total_tokens,
    cached_tokens: scriptResult.cached_tokens,
    model: scriptResult.model,
    zip_filename: zipResult.filename,
    zip_size_bytes: zipResult.size_bytes,
    zip_size_kb: Math.round(zipResult.size_bytes / 1024),
    signed_url_expires_at: uploaded.expires_at,
    local_zip_path: localPath,
    duration_ms_total: Date.now() - t0,
    duration_ms_render: total_render_ms,
    anti_spec_6_2b: {
      regex: "/bloomberg/i",
      matches: bloombergMatches.length,
      passed: bloombergMatches.length === 0,
    },
  };

  console.log("\n=== SMOKE F-019 — SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((err) => {
  console.error("[smoke F-019] FALHOU:", err);
  process.exit(1);
});
