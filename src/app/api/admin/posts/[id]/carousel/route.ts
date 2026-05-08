/**
 * F-019 v2.0 — POST /api/admin/posts/[id]/carousel.
 *
 * Pivot 2026-05-09 (ADR-006): X-mock screenshot + dual variation + DALL-E.
 *
 * Pipeline:
 *   1. checkAdminAuth → 401
 *   2. generateCarouselScript → script + carousel_run_id (status='success'
 *      ou 'compliance_blocked'; insert já feito por dentro)
 *   3. generateImagesForSlides para slides com image_prompt populado
 *      (slides 1, 3, 6). Falha graciosa: text-only fallback se DALL-E
 *      retorna erro. ImageGenBloombergError → aborta tudo (422).
 *   4. renderCarouselAllVariations(slides, sharedImages) → 12 PNGs
 *      (6 LDC + 6 Luciano)
 *   5. packCarouselZip → buffer único do ZIP
 *   6. uploadCarouselZipAndSign → signed URL 24h
 *   7. updateCarouselRunFinal — total_cost (text+images), zip_pathname,
 *      status final (success se cost ≤ R$1; failed se >)
 *   8. Retorna 200 com signed URL + slides preview + cost
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import {
  CarouselBlogPostNotFoundError,
  CarouselBlogPostNotPublishedError,
  CarouselComplianceBlockedError,
  CarouselRateLimitError,
  CarouselSchemaError,
  generateCarouselScript,
} from "@/features/news/carousel/generator";
import {
  generateImagesForSlides,
  ImageGenBloombergError,
} from "@/features/news/carousel/image-gen";
import { renderCarouselAllVariations } from "@/features/news/carousel/render";
import { packCarouselZip } from "@/features/news/carousel/zip";
import { uploadCarouselZipAndSign } from "@/features/news/carousel/storage";
import { updateCarouselRunFinal } from "@/features/news/carousel/carousel-runs-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// CA-042 v2.0 — sentinela R$1,00 (não bloqueio).
const COST_GUARD_BRL = 1.0;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  void request;
  const user = await checkAdminAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: blogPostId } = await context.params;

  // ── (1-2) generate script + insert carousel_run row
  let scriptResult;
  try {
    scriptResult = await generateCarouselScript({
      blogPostId,
      generatedByUserId: user.id,
    });
  } catch (err) {
    if (err instanceof CarouselBlogPostNotFoundError) {
      return NextResponse.json(
        { error: "blog_post_not_found", message: err.message },
        { status: 404 },
      );
    }
    if (err instanceof CarouselBlogPostNotPublishedError) {
      return NextResponse.json(
        { error: "blog_post_not_published", message: err.message },
        { status: 409 },
      );
    }
    if (err instanceof CarouselRateLimitError) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: err.message,
          used: err.used,
          limit: err.limit,
        },
        { status: 429 },
      );
    }
    if (err instanceof CarouselComplianceBlockedError) {
      return NextResponse.json(
        {
          error: "compliance_blocked",
          message: err.message,
          carousel_run_id: err.carousel_run_id,
          violations: err.violations.map((v) => ({
            type: v.type,
            match: v.match,
            source: v.source,
            severity: v.severity,
          })),
        },
        { status: 422 },
      );
    }
    if (err instanceof CarouselSchemaError) {
      console.error(
        JSON.stringify({
          event: "carousel_schema_error",
          blog_post_id: blogPostId,
          message: err.cause_message.slice(0, 200),
        }),
      );
      return NextResponse.json(
        { error: "schema_error", message: "OpenAI retornou JSON inválido." },
        { status: 502 },
      );
    }
    console.error(
      JSON.stringify({
        event: "carousel_generation_internal_error",
        blog_post_id: blogPostId,
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error ? err.message : String(err)).slice(
          0,
          200,
        ),
      }),
    );
    return NextResponse.json(
      { error: "internal", message: "Erro interno na geração." },
      { status: 500 },
    );
  }

  // ── (3) DALL-E 3 para slides com image_prompt
  const slidesNeedingImages = scriptResult.script.slides.map((s) => ({
    index: s.index,
    image_prompt: s.image_prompt,
  }));

  let imageBatch: Awaited<
    ReturnType<typeof generateImagesForSlides>
  >;
  try {
    imageBatch = await generateImagesForSlides(slidesNeedingImages);
  } catch (err) {
    if (err instanceof ImageGenBloombergError) {
      // Defense in depth Anti-SPEC §6.2b: schema strict já filtraria, mas se
      // chegou aqui é bug crítico — marca run como failed e retorna 422.
      await updateCarouselRunFinal(scriptResult.carousel_run_id, {
        total_cost_brl: scriptResult.cost_brl,
        zip_pathname: null,
        status: "failed",
        error_message: `image_prompt_bloomberg_violation: slide ${err.slide_index}`,
      });
      return NextResponse.json(
        {
          error: "image_prompt_bloomberg_violation",
          message:
            "Defense in depth Anti-SPEC §6.2b: image_prompt continha 'Bloomberg'. Geração abortada.",
          slide_index: err.slide_index,
          carousel_run_id: scriptResult.carousel_run_id,
        },
        { status: 422 },
      );
    }
    console.error(
      JSON.stringify({
        event: "carousel_image_gen_unexpected_error",
        carousel_run_id: scriptResult.carousel_run_id,
        error_message: (err instanceof Error ? err.message : String(err)).slice(
          0,
          200,
        ),
      }),
    );
    // Continuamos sem imagens (text-only para os 3 slides que precisariam).
    imageBatch = { images: {}, total_cost_brl: 0, failures: [] };
  }

  // Render → ZIP → Upload → Update final
  try {
    const renderResult = await renderCarouselAllVariations(
      scriptResult.script.slides,
      imageBatch.images,
    );

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

    const uploaded = await uploadCarouselZipAndSign({
      pathname: zipResult.filename,
      buffer: zipResult.buffer,
    });

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

    console.info(
      JSON.stringify({
        event: "carousel_v2_generated",
        carousel_run_id: scriptResult.carousel_run_id,
        blog_post_id: blogPostId,
        slides_count: scriptResult.script.slides.length,
        zip_size_bytes: zipResult.size_bytes,
        text_cost_brl: scriptResult.cost_brl,
        image_cost_brl: imageBatch.total_cost_brl,
        total_cost_brl: Number(totalCostBrl.toFixed(4)),
        cost_exceeded: costExceeded,
        total_tokens: scriptResult.total_tokens,
        cached_tokens: scriptResult.cached_tokens,
        total_render_ms: renderResult.total_render_ms,
        image_gen_failures: imageBatch.failures.length,
      }),
    );

    return NextResponse.json({
      carousel_run_id: scriptResult.carousel_run_id,
      signed_url: uploaded.signed_url,
      expires_at: uploaded.expires_at,
      zip_pathname: uploaded.pathname,
      zip_size_bytes: zipResult.size_bytes,
      slides: scriptResult.script.slides.map((s) => ({
        index: s.index,
        type: s.type,
        title: s.title,
        has_image: imageBatch.images[s.index] !== null && imageBatch.images[s.index] !== undefined,
      })),
      cost_brl: Number(totalCostBrl.toFixed(4)),
      text_cost_brl: scriptResult.cost_brl,
      image_cost_brl: imageBatch.total_cost_brl,
      total_tokens: scriptResult.total_tokens,
      cost_exceeded: costExceeded,
      image_gen_failures: imageBatch.failures,
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "carousel_render_or_upload_failed",
        carousel_run_id: scriptResult.carousel_run_id,
        blog_post_id: blogPostId,
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error ? err.message : String(err)).slice(
          0,
          200,
        ),
      }),
    );
    await updateCarouselRunFinal(scriptResult.carousel_run_id, {
      total_cost_brl: scriptResult.cost_brl + imageBatch.total_cost_brl,
      zip_pathname: null,
      status: "failed",
      error_message: `render_or_upload_failed: ${(err instanceof Error ? err.message : String(err)).slice(0, 100)}`,
    }).catch(() => {});
    return NextResponse.json(
      {
        error: "render_or_upload_failed",
        message: "Falha ao renderizar/empacotar/subir o carrossel.",
        carousel_run_id: scriptResult.carousel_run_id,
      },
      { status: 500 },
    );
  }
}
