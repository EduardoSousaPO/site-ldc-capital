/**
 * Cliente Supabase Storage admin (service role).
 *
 * Usado pelas rotas `/api/admin/bloomberg-pdfs/*` e pelo pipeline reader
 * `pdf-storage.ts`. Substitui `@vercel/blob` em todo o ciclo Bloomberg PDFs
 * — Vercel Blob client SDK tem bug de CORS no `vercel.com/api/blob/` para
 * domínios custom (vide commit dessa migração para o histórico).
 *
 * Service role bypassa RLS — bucket `bloomberg-pdfs` é privado por design
 * (Anti-SPEC §6.2b sagrada — conteúdo Bloomberg jamais publicamente acessível).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseStorageAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para o cliente Storage admin.",
    );
  }
  cachedClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}

export const BLOOMBERG_PDFS_BUCKET = "bloomberg-pdfs";
