/**
 * F-016b — Cron diário (04h UTC / 01h BRT) para deletar PDFs Bloomberg >30d.
 *
 * Anti-SPEC §6.2b (sagrada) + ToS Bloomberg: artifact tem TTL voluntário
 * de 30 dias. Sem este cron, bucket Supabase `bloomberg-pdfs` acumula
 * indefinidamente.
 *
 * Migrado de Vercel Blob na 2026-05-08.
 *
 * Auth via `CRON_SECRET` em `Authorization: Bearer ...` (timing-safe — RNF-007),
 * mesmo padrão do `/api/posts/cleanup-expired-tokens`. Disparado pelo Vercel
 * Cron — schedule fora dos horários de pipeline (07/14h BRT) e do cleanup
 * de tokens (00h BRT).
 */

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseStorageAdmin,
  BLOOMBERG_PDFS_BUCKET,
} from "@/lib/supabase-storage-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TTL_DAYS = 30;
const LIST_LIMIT = 1000;

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
    const supabase = getSupabaseStorageAdmin();
    const { data: files, error: listError } = await supabase.storage
      .from(BLOOMBERG_PDFS_BUCKET)
      .list("", {
        limit: LIST_LIMIT,
        sortBy: { column: "created_at", order: "asc" },
      });
    if (listError) {
      console.error(
        JSON.stringify({
          event: "bloomberg_pdfs_cleanup_failed",
          error_message: listError.message.slice(0, 200),
          ts,
        }),
      );
      return new NextResponse("Internal error", { status: 500 });
    }

    const allFiles = files ?? [];
    const expired = allFiles.filter((f) => {
      const created = f.created_at ?? f.updated_at;
      if (!created) return false;
      return new Date(created).getTime() < cutoff;
    });

    let deletedCount = 0;
    if (expired.length > 0) {
      const paths = expired.map((f) => f.name);
      const { error: deleteError } = await supabase.storage
        .from(BLOOMBERG_PDFS_BUCKET)
        .remove(paths);
      if (deleteError) {
        console.error(
          JSON.stringify({
            event: "bloomberg_pdf_cleanup_delete_failed",
            error_message: deleteError.message.slice(0, 200),
            attempted_count: paths.length,
          }),
        );
      } else {
        deletedCount = paths.length;
      }
    }

    console.info(
      JSON.stringify({
        event: "bloomberg_pdfs_cleanup_run",
        deleted_count: deletedCount,
        scanned_count: allFiles.length,
        ttl_days: TTL_DAYS,
        ts,
      }),
    );

    return NextResponse.json({
      deleted_count: deletedCount,
      scanned_count: allFiles.length,
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
