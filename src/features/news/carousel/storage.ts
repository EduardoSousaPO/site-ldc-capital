/**
 * F-019 — Helpers de Supabase Storage para o bucket privado `blog-carousels`.
 *
 * Reusa `getSupabaseStorageAdmin()` (smoke #5 F-016b — service role bypassa
 * RLS por design). Bucket `blog-carousels` tem `public=false`, então links
 * são SEMPRE signed URLs com expiry.
 *
 * Anti-SPEC §6.3: jamais loga bytes do ZIP nem o token de signed URL inteiro.
 */

import { getSupabaseStorageAdmin } from "@/lib/supabase-storage-admin";

export const BLOG_CAROUSELS_BUCKET = "blog-carousels";
const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60; // 24h — CA-036

export interface UploadCarouselZipInput {
  pathname: string;
  buffer: Buffer;
}

export interface UploadedCarouselZipRef {
  pathname: string;
  signed_url: string;
  expires_at: string;
}

export async function uploadCarouselZipAndSign(
  input: UploadCarouselZipInput,
): Promise<UploadedCarouselZipRef> {
  const client = getSupabaseStorageAdmin();
  const storage = client.storage.from(BLOG_CAROUSELS_BUCKET);

  const { error: uploadErr } = await storage.upload(input.pathname, input.buffer, {
    contentType: "application/zip",
    upsert: false,
  });
  if (uploadErr) {
    throw new Error(
      `[carousel/storage] falha ao subir ZIP em ${input.pathname}: ${uploadErr.message}`,
    );
  }

  const { data: signed, error: signErr } = await storage.createSignedUrl(
    input.pathname,
    SIGNED_URL_TTL_SECONDS,
  );
  if (signErr || !signed) {
    throw new Error(
      `[carousel/storage] falha ao gerar signed URL: ${signErr?.message ?? "no data"}`,
    );
  }

  const expires_at = new Date(
    Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
  ).toISOString();

  return {
    pathname: input.pathname,
    signed_url: signed.signedUrl,
    expires_at,
  };
}

/** Lista zips no bucket (usado pelo cleanup cron). */
export async function listCarouselZips(): Promise<
  Array<{ name: string; created_at: string }>
> {
  const client = getSupabaseStorageAdmin();
  const { data, error } = await client.storage
    .from(BLOG_CAROUSELS_BUCKET)
    .list("", { limit: 1000, sortBy: { column: "created_at", order: "asc" } });

  if (error) {
    throw new Error(`[carousel/storage] list falhou: ${error.message}`);
  }
  return (data ?? []).map((f) => ({
    name: f.name,
    created_at: f.created_at ?? new Date().toISOString(),
  }));
}

/** Remove um ZIP do bucket (usado pelo cleanup cron). */
export async function deleteCarouselZip(pathname: string): Promise<void> {
  const client = getSupabaseStorageAdmin();
  const { error } = await client.storage
    .from(BLOG_CAROUSELS_BUCKET)
    .remove([pathname]);
  if (error) {
    throw new Error(
      `[carousel/storage] delete falhou para ${pathname}: ${error.message}`,
    );
  }
}
