/**
 * F-016b — Listagem de PDFs Bloomberg em Vercel Blob.
 *
 * GET protegido por sessão Supabase admin. Retorna PDFs em `bloomberg-pdfs/`
 * uploaded nos últimos 30 dias (mesmo TTL do cleanup), ordenados por
 * `uploaded_at` desc.
 *
 * Anti-SPEC §6.2b: pathname expõe slug do filename apenas — buffer e conteúdo
 * jamais são lidos aqui (a UI só precisa de metadata).
 */

import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { checkAdminAuth } from "@/lib/auth-check";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BLOB_PREFIX = "bloomberg-pdfs/";
const TTL_DAYS = 30;

interface PdfEntry {
  url: string;
  pathname: string;
  size_bytes: number;
  uploaded_at: string;
}

export async function GET() {
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

  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX, token: blobToken });
    const cutoff = Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000;
    const entries: PdfEntry[] = blobs
      .filter((b) => b.pathname.toLowerCase().endsWith(".pdf"))
      .map((b) => ({
        url: b.url,
        pathname: b.pathname,
        size_bytes: b.size,
        uploaded_at: new Date(b.uploadedAt).toISOString(),
      }))
      .filter((e) => new Date(e.uploaded_at).getTime() >= cutoff)
      .sort(
        (a, b) =>
          new Date(b.uploaded_at).getTime() -
          new Date(a.uploaded_at).getTime(),
      );

    return NextResponse.json({ pdfs: entries });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "bloomberg_pdf_list_failed",
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error
          ? err.message
          : String(err)
        ).slice(0, 200),
      }),
    );
    return NextResponse.json({ error: "List failed" }, { status: 500 });
  }
}
