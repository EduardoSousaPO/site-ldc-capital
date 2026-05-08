/**
 * F-016b — Listagem de PDFs Bloomberg em Supabase Storage.
 *
 * GET protegido por sessão Supabase admin. Retorna PDFs uploaded nos últimos
 * 30 dias (mesmo TTL do cleanup), ordenados por `created_at` desc.
 *
 * Migrado de Vercel Blob na 2026-05-08 — vide commits da época.
 *
 * Anti-SPEC §6.2b: bucket privado, service role bypassa RLS. URLs retornadas
 * são apenas o `path` (não public URL); o conteúdo só é acessível via API
 * autenticada.
 */

import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import {
  getSupabaseStorageAdmin,
  BLOOMBERG_PDFS_BUCKET,
} from "@/lib/supabase-storage-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TTL_DAYS = 30;
const LIST_LIMIT = 100;

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

  try {
    const supabase = getSupabaseStorageAdmin();
    const { data: files, error } = await supabase.storage
      .from(BLOOMBERG_PDFS_BUCKET)
      .list("", {
        limit: LIST_LIMIT,
        sortBy: { column: "created_at", order: "desc" },
      });
    if (error) {
      console.error(
        JSON.stringify({
          event: "bloomberg_pdf_list_failed",
          error_message: error.message.slice(0, 200),
        }),
      );
      return NextResponse.json({ error: "List failed" }, { status: 500 });
    }
    if (!files) return NextResponse.json({ pdfs: [] });

    const cutoff = Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000;
    const pdfs: PdfEntry[] = files
      .filter(
        (f) =>
          f.name.toLowerCase().endsWith(".pdf") && !f.name.startsWith("."),
      )
      .map((f) => {
        const created = f.created_at ?? f.updated_at ?? new Date().toISOString();
        const sizeRaw = (f.metadata as { size?: number } | null)?.size;
        return {
          url: f.name,
          pathname: f.name,
          size_bytes: typeof sizeRaw === "number" ? sizeRaw : 0,
          uploaded_at: new Date(created).toISOString(),
        };
      })
      .filter((e) => new Date(e.uploaded_at).getTime() >= cutoff);

    return NextResponse.json({ pdfs });
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
