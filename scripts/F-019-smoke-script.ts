/**
 * F-019 — Smoke local do generator (sem render/zip/upload).
 *
 * Uso:
 *   npx tsx scripts/F-019-smoke-script.ts <blogPostId> [generatedByUserId]
 *
 * Exemplo (smoke #5):
 *   npx tsx scripts/F-019-smoke-script.ts 5a157c14-b06b-4e85-8312-13942b88b914
 *
 * Pré-requisitos (.env.local):
 *   - OPENAI_API_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Saída: JSON do CarouselScriptStrict + métricas para review do Eduardo.
 */

import "dotenv/config";
import {
  CarouselBlogPostNotFoundError,
  CarouselBlogPostNotPublishedError,
  CarouselComplianceBlockedError,
  CarouselRateLimitError,
  CarouselSchemaError,
  generateCarouselScript,
} from "../src/features/news/carousel/generator";

async function main() {
  const blogPostId = process.argv[2];
  const generatedByUserId =
    process.argv[3] ?? "00000000-0000-0000-0000-000000000000";

  if (!blogPostId) {
    console.error("Uso: tsx scripts/F-019-smoke-script.ts <blogPostId>");
    process.exit(1);
  }

  try {
    const result = await generateCarouselScript(
      { blogPostId, generatedByUserId },
      { skipRateLimit: true },
    );

    console.log("\n=== F-019 SMOKE — JSON do CarouselScriptStrict ===\n");
    console.log(JSON.stringify(result.script, null, 2));
    console.log("\n=== Métricas ===");
    console.log({
      carousel_run_id: result.carousel_run_id,
      generated_at: result.generated_at,
      slides_count: result.script.slides.length,
      total_tokens: result.total_tokens,
      cached_tokens: result.cached_tokens,
      cost_brl: result.cost_brl,
      cost_exceeded: result.cost_exceeded,
      model: result.model,
    });
    console.log("\n=== Anti-SPEC §6.2b regex check ===");
    const allText = [
      result.script.slides.map((s) => `${s.title} ${s.body}`).join(" "),
      result.script.caption_instagram,
      result.script.caption_linkedin,
      result.script.hashtags.join(" "),
    ].join(" ");
    const bloombergMatches = allText.match(/bloomberg/gi) ?? [];
    console.log({
      bloomberg_mentions: bloombergMatches.length,
      passed: bloombergMatches.length === 0,
    });
  } catch (err) {
    if (err instanceof CarouselBlogPostNotFoundError) {
      console.error(`[NOT_FOUND] ${err.message}`);
      process.exit(2);
    }
    if (err instanceof CarouselBlogPostNotPublishedError) {
      console.error(`[NOT_PUBLISHED] ${err.message}`);
      process.exit(3);
    }
    if (err instanceof CarouselRateLimitError) {
      console.error(`[RATE_LIMIT] ${err.message}`);
      process.exit(4);
    }
    if (err instanceof CarouselComplianceBlockedError) {
      console.error(
        `[COMPLIANCE_BLOCKED] ${err.violations.length} violações (carousel_run_id=${err.carousel_run_id}):`,
      );
      console.error(JSON.stringify(err.violations, null, 2));
      process.exit(5);
    }
    if (err instanceof CarouselSchemaError) {
      console.error(`[SCHEMA_ERROR] ${err.message}`);
      process.exit(6);
    }
    console.error("[UNEXPECTED]", err);
    process.exit(99);
  }
}

void main();
