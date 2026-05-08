/**
 * F-016b — Cron diário (04h UTC / 01h BRT) para deletar PDFs Bloomberg >30d.
 *
 * Anti-SPEC §6.2b (sagrada) + ToS Bloomberg: artifact tem TTL voluntário
 * de 30 dias. Sem este cron, `bloomberg-pdfs/` acumula indefinidamente.
 *
 * Auth via `CRON_SECRET` em `Authorization: Bearer ...` (timing-safe — RNF-007),
 * mesmo padrão do `/api/posts/cleanup-expired-tokens`. Disparado pelo Vercel
 * Cron — schedule fora dos horários de pipeline (07/14h BRT) e do cleanup
 * de tokens (00h BRT).
 */

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { list, del } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BLOB_PREFIX = "bloomberg-pdfs/";
const TTL_DAYS = 30;

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

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json(
      { error: "Blob storage not configured" },
      { status: 500 },
    );
  }

  const ts = new Date().toISOString();
  const cutoff = Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000;

  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX, token: blobToken });

    const expired = blobs.filter(
      (b) => new Date(b.uploadedAt).getTime() < cutoff,
    );

    let deletedCount = 0;
    for (const b of expired) {
      try {
        await del(b.url, { token: blobToken });
        deletedCount++;
      } catch (err) {
        console.error(
          JSON.stringify({
            event: "bloomberg_pdf_cleanup_delete_failed",
            pathname: b.pathname,
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
        event: "bloomberg_pdfs_cleanup_run",
        deleted_count: deletedCount,
        scanned_count: blobs.length,
        ttl_days: TTL_DAYS,
        ts,
      }),
    );

    return NextResponse.json({
      deleted_count: deletedCount,
      scanned_count: blobs.length,
      ttl_days: TTL_DAYS,
      ts,
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "bloomberg_pdfs_cleanup_failed",
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
