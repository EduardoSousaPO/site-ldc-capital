/**
 * F-016b — Deletar PDF Bloomberg individual do Supabase Storage.
 *
 * DELETE protegido por sessão Supabase admin. Param `pathname` é o nome do
 * arquivo no bucket (URI-encoded pelo client). Validação contra path
 * traversal: nada com `/` ou `..`.
 *
 * Migrado de Vercel Blob na 2026-05-08.
 *
 * Anti-SPEC §6.2b: deletar é a única operação destrutiva exposta publicamente
 * em Bloomberg artifacts; reforça TTL voluntário antes do cleanup automático
 * de 30 dias.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import {
  getSupabaseStorageAdmin,
  BLOOMBERG_PDFS_BUCKET,
} from "@/lib/supabase-storage-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ pathname: string }> },
) {
  const user = await checkAdminAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pathname: rawPathname } = await context.params;
  let pathname: string;
  try {
    pathname = decodeURIComponent(rawPathname);
  } catch {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  // Path traversal guard — bucket plano: sem subdiretórios, sem ".."
  if (
    pathname.includes("..") ||
    pathname.includes("/") ||
    !pathname.toLowerCase().endsWith(".pdf")
  ) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseStorageAdmin();
    const { error } = await supabase.storage
      .from(BLOOMBERG_PDFS_BUCKET)
      .remove([pathname]);
    if (error) {
      console.error(
        JSON.stringify({
          event: "bloomberg_pdf_delete_failed",
          pathname,
          error_message: error.message.slice(0, 200),
        }),
      );
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    console.info(
      JSON.stringify({
        event: "bloomberg_pdf_deleted",
        pathname,
      }),
    );
    return NextResponse.json({ deleted: pathname });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "bloomberg_pdf_delete_failed",
        pathname,
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error
          ? err.message
          : String(err)
        ).slice(0, 200),
      }),
    );
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
