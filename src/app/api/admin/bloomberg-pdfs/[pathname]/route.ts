/**
 * F-016b — Deletar PDF Bloomberg individual do Vercel Blob.
 *
 * DELETE protegido por sessão Supabase admin. Param `pathname` é o caminho
 * completo do blob (URI-encoded pelo client). Validação de path traversal:
 * pathname decodificado precisa começar com `bloomberg-pdfs/` e não conter
 * `..` — protege contra deletar fora do prefixo Bloomberg.
 *
 * Anti-SPEC §6.2b: deletar é a única operação destrutiva exposta publicamente
 * em Bloomberg artifacts; reforça TTL voluntário antes do cleanup automático
 * de 30 dias.
 */

import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { checkAdminAuth } from "@/lib/auth-check";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BLOB_PREFIX = "bloomberg-pdfs/";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ pathname: string }> },
) {
  const user = await checkAdminAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json(
      { error: "Blob storage not configured" },
      { status: 500 },
    );
  }

  const { pathname: rawPathname } = await context.params;
  let pathname: string;
  try {
    pathname = decodeURIComponent(rawPathname);
  } catch {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  // Path traversal guard: somente blobs sob o prefixo bloomberg-pdfs/.
  if (!pathname.startsWith(BLOB_PREFIX) || pathname.includes("..")) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  try {
    await del(pathname, { token: blobToken });
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
