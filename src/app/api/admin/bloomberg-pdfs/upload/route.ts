/**
 * F-016b — Upload de PDFs Bloomberg via Supabase Storage signed upload URL.
 *
 * Migrado de Vercel Blob (`@vercel/blob/client`) na 2026-05-08 — o client SDK
 * tinha bug de CORS no `vercel.com/api/blob/` para domínios custom. Supabase
 * Storage emite signed upload URLs que aceitam CORS de qualquer origem.
 *
 * Fluxo:
 *   1. Client POST `{ filename, contentType, sizeBytes }` para esta rota.
 *   2. Server valida auth admin + tipo PDF + tamanho ≤10MB + slug.
 *   3. Server chama `storage.from(bucket).createSignedUploadUrl(path)` e
 *      devolve `{ token, path, signedUrl }` — o token é válido por 2 horas.
 *   4. Client faz PUT direto no `signedUrl` com o body do arquivo.
 *
 * Anti-SPEC §6.2b (sagrada): o servidor jamais lê o conteúdo do PDF — só
 * gera token. Bucket privado, service role bypassa RLS, conteúdo Bloomberg
 * jamais é exposto publicamente.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import {
  getSupabaseStorageAdmin,
  BLOOMBERG_PDFS_BUCKET,
} from "@/lib/supabase-storage-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function slugifyFilename(raw: string): string {
  const withoutExt = raw.replace(/\.pdf$/i, "");
  const slug = withoutExt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug.length > 0 ? slug : "bloomberg-pdf";
}

function timestampUtc(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "-" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

interface RequestBody {
  filename?: unknown;
  contentType?: unknown;
  sizeBytes?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await checkAdminAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const filename = typeof body.filename === "string" ? body.filename : "";
  const contentType =
    typeof body.contentType === "string" ? body.contentType : "";
  const sizeBytes =
    typeof body.sizeBytes === "number" ? body.sizeBytes : NaN;

  if (!filename || !filename.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "filename must end with .pdf" },
      { status: 400 },
    );
  }
  if (contentType !== "application/pdf") {
    return NextResponse.json(
      { error: "Only application/pdf is allowed" },
      { status: 400 },
    );
  }
  if (
    !Number.isFinite(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > MAX_FILE_SIZE
  ) {
    return NextResponse.json(
      { error: `File size must be in (0, ${MAX_FILE_SIZE}] bytes` },
      { status: 413 },
    );
  }

  const slug = slugifyFilename(filename);
  const ts = timestampUtc();
  const random = Math.random().toString(36).slice(2, 8);
  const path = `${ts}-${random}-${slug}.pdf`;

  try {
    const supabase = getSupabaseStorageAdmin();
    const { data, error } = await supabase.storage
      .from(BLOOMBERG_PDFS_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error(
        JSON.stringify({
          event: "bloomberg_pdf_signed_url_failed",
          path,
          error_message: error?.message?.slice(0, 200) ?? "unknown",
        }),
      );
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 },
      );
    }

    console.info(
      JSON.stringify({
        event: "bloomberg_pdf_upload_url_issued",
        path,
        size_bytes: sizeBytes,
        uploader_domain: user.email?.split("@")[1] ?? "unknown",
      }),
    );

    return NextResponse.json({
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "bloomberg_pdf_signed_url_failed",
        path,
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error
          ? err.message
          : String(err)
        ).slice(0, 200),
      }),
    );
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
