/**
 * F-019 — Cron diário (05h UTC / 02h BRT) para deletar carrossel ZIPs >90d.
 *
 * Anti-SPEC §6.3 + RNF-007: auth via CRON_SECRET timing-safe.
 * Mesmo padrão de `/api/admin/bloomberg-pdfs/cleanup` (smoke #5 F-016b).
 *
 * Schedule fora dos horários do pipeline (10/17h UTC), cleanup tokens
 * (03h UTC) e cleanup PDFs (04h UTC) — escalonamento previne sobrecarga.
 */

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  deleteCarouselZip,
  listCarouselZips,
} from "@/features/news/carousel/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TTL_DAYS = 90;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET ?? "";
  if (!authHeader || !cronSecret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const expected = `Bearer ${cronSecret}`;
  if (!constantTimeEqual(authHeader, expected)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ts = new Date().toISOString();
  const cutoff = Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000;

  try {
    const zips = await listCarouselZips();
    const expired = zips.filter(
      (z) => new Date(z.created_at).getTime() < cutoff,
    );

    let deletedCount = 0;
    for (const z of expired) {
      try {
        await deleteCarouselZip(z.name);
        deletedCount++;
      } catch (err) {
        console.error(
          JSON.stringify({
            event: "blog_carousels_cleanup_delete_failed",
            pathname: z.name,
            error_class:
              err instanceof Error ? err.constructor.name : typeof err,
            error_message: (err instanceof Error
              ? err.message
              : String(err)
            ).slice(0, 200),
          }),
        );
      }
    }

    console.info(
      JSON.stringify({
        event: "blog_carousels_cleanup_run",
        deleted_count: deletedCount,
        scanned_count: zips.length,
        ttl_days: TTL_DAYS,
        ts,
      }),
    );

    return NextResponse.json({
      deleted_count: deletedCount,
      scanned_count: zips.length,
      ttl_days: TTL_DAYS,
      ts,
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "blog_carousels_cleanup_failed",
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error
          ? err.message
          : String(err)
        ).slice(0, 200),
        ts,
      }),
    );
    return new NextResponse("Internal error", { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
