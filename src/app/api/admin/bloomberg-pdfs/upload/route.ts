/**
 * F-016b — Upload de PDFs Bloomberg via client-side upload (token issuer).
 *
 * O fluxo `multipart/form-data` direto pra Function (versão anterior) batia no
 * limite hard de 4.5MB do Vercel Functions (`FUNCTION_PAYLOAD_TOO_LARGE`).
 * PDFs Bloomberg típicos têm 5-15MB. Com `handleUpload` do `@vercel/blob/client`,
 * o servidor só emite token assinado e o browser sobe direto pro Blob — sem
 * passar pelo runtime da Function.
 *
 * Auth via sessão Supabase admin (`checkAdminAuth()`); rejeição lança Error e
 * `handleUpload` devolve 4xx pro client. Validações (MIME, size) movidas para
 * `onBeforeGenerateToken` — Vercel Blob honra `allowedContentTypes` e
 * `maximumSizeInBytes` no upload em si.
 *
 * Anti-SPEC §6.2b (sagrada): conteúdo dos PDFs nunca é processado aqui — só
 * pathname/size em logs estruturados. `addRandomSuffix:false` mantém pathname
 * determinístico (cliente já compõe timestamp + slug + index).
 */

import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { checkAdminAuth } from "@/lib/auth-check";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BLOB_PREFIX = "bloomberg-pdfs/";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await checkAdminAuth();
        if (!user) {
          throw new Error("Unauthorized");
        }
        if (!pathname.startsWith(BLOB_PREFIX)) {
          throw new Error(`Invalid pathname prefix (expected ${BLOB_PREFIX})`);
        }
        if (!pathname.toLowerCase().endsWith(".pdf")) {
          throw new Error("Only .pdf files allowed");
        }
        return {
          allowedContentTypes: ["application/pdf"],
          addRandomSuffix: false,
          maximumSizeInBytes: MAX_FILE_SIZE,
          tokenPayload: JSON.stringify({
            uploader_domain: user.email?.split("@")[1] ?? "unknown",
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.info(
          JSON.stringify({
            event: "bloomberg_pdf_uploaded",
            pathname: blob.pathname,
            url: blob.url,
            token_payload: tokenPayload,
          }),
        );
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upload failed";
    console.error(
      JSON.stringify({
        event: "bloomberg_pdf_upload_failed",
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: message.slice(0, 200),
      }),
    );
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
