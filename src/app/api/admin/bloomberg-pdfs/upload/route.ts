/**
 * F-016b — Upload de PDFs Bloomberg pela página admin.
 *
 * POST multipart com 1..N arquivos `application/pdf`. Auth via sessão Supabase
 * admin (`checkAdminAuth()`); o middleware `/admin/*` cobre só páginas — para
 * `/api/admin/*` validamos explicitamente aqui.
 *
 * Anti-SPEC §6.2b (sagrada): conteúdo dos PDFs Bloomberg jamais é logado em
 * texto puro. Logs estruturados emitem apenas filename + size + status. URLs
 * do Blob são `access:'public'` apenas tecnicamente — clientes públicos não
 * têm o pathname dinâmico, e o cleanup TTL 30 dias garante que `bloomberg-pdfs/`
 * não acumule histórico.
 *
 * Limites (RNF-007 / Anti-SPEC §6.3):
 *   - até 10 arquivos por request
 *   - cada arquivo ≤ 10 MB
 *   - somente `application/pdf`
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { checkAdminAuth } from "@/lib/auth-check";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BLOB_PREFIX = "bloomberg-pdfs/";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

interface UploadedEntry {
  url: string;
  pathname: string;
  filename: string;
  size_bytes: number;
  uploaded_at: string;
}

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

export async function POST(request: NextRequest) {
  const user = await checkAdminAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    console.error(
      JSON.stringify({
        event: "bloomberg_pdf_upload_failed",
        reason: "blob_token_missing",
      }),
    );
    return NextResponse.json(
      { error: "Blob storage not configured" },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((v): v is File => v instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES} per request)` },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: `Invalid type for "${file.name}" (only application/pdf)` },
        { status: 400 },
      );
    }
    if (file.size <= 0) {
      return NextResponse.json(
        { error: `Empty file "${file.name}"` },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `"${file.name}" exceeds 10MB limit`,
          max_bytes: MAX_FILE_SIZE,
        },
        { status: 413 },
      );
    }
  }

  const ts = timestampUtc();
  const uploaded: UploadedEntry[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const slug = slugifyFilename(file.name);
    const pathname = `${BLOB_PREFIX}${ts}-${i}-${slug}.pdf`;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await put(pathname, buffer, {
        access: "public",
        contentType: "application/pdf",
        addRandomSuffix: false,
        token: blobToken,
      });
      uploaded.push({
        url: result.url,
        pathname: result.pathname ?? pathname,
        filename: file.name,
        size_bytes: file.size,
        uploaded_at: new Date().toISOString(),
      });
      console.info(
        JSON.stringify({
          event: "bloomberg_pdf_uploaded",
          pathname,
          size_bytes: file.size,
        }),
      );
    } catch (err) {
      console.error(
        JSON.stringify({
          event: "bloomberg_pdf_upload_failed",
          pathname,
          size_bytes: file.size,
          error_class:
            err instanceof Error ? err.constructor.name : typeof err,
          error_message: (err instanceof Error
            ? err.message
            : String(err)
          ).slice(0, 200),
        }),
      );
      return NextResponse.json(
        { error: `Upload failed for "${file.name}"` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ uploaded });
}
