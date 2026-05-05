/**
 * Storage para `BlogPostApprovalToken` (F-018).
 *
 * Princípios:
 *   - Raw token gerado via `crypto.randomBytes(32)` (64 hex chars). Retornado
 *     apenas 1× no `createApprovalToken()` (vai pro link do email). Não fica
 *     no banco.
 *   - `token_hash` armazenado é SHA-256(raw_token). Defesa contra dump
 *     (RNF-007 + Anti-SPEC §6.3).
 *   - TTL 7 dias (configurável via `tokenTtlMs`).
 *   - Single-use: `markTokenAsUsed` seta `used_at = NOW()` + `status` final.
 *   - Cliente Supabase isolado (mesmo padrão F-009/F-015 — memória
 *     `feedback_supabase_js_multi_table`).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { ApprovalTokenStatus } from "@/features/news/contracts/approval";

const TOKEN_BYTES = 32; // → 64 hex chars
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let cachedClient: SupabaseClient | null = null;

function buildClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "[news/approval-token-storage] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getClient(): SupabaseClient {
  if (!cachedClient) cachedClient = buildClient();
  return cachedClient;
}

export function __resetApprovalTokenStorageForTests(): void {
  cachedClient = null;
}

export function __setApprovalTokenClientForTests(client: SupabaseClient): void {
  cachedClient = client;
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface CreateApprovalTokenOptions {
  /** Override de TTL (ms). Default 7 dias. */
  tokenTtlMs?: number;
  /** Override do gerador (testes determinísticos). */
  rawTokenGenerator?: () => string;
  /** Override de "agora" (testes). */
  now?: () => Date;
}

export interface CreateApprovalTokenResult {
  /** Token bruto — vai APENAS no link do email. Não persistido. */
  raw_token: string;
  expires_at: string;
  token_id: string;
}

export async function createApprovalToken(
  blog_post_id: string,
  recipient_email: string,
  options: CreateApprovalTokenOptions = {},
): Promise<CreateApprovalTokenResult> {
  const ttl = options.tokenTtlMs ?? DEFAULT_TTL_MS;
  const now = (options.now ?? (() => new Date()))();
  const expiresAt = new Date(now.getTime() + ttl);

  const rawToken =
    options.rawTokenGenerator?.() ??
    randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);

  const insertPayload = {
    blog_post_id,
    token_hash: tokenHash,
    status: "pending" as const,
    recipient_email,
    expires_at: expiresAt.toISOString(),
  };

  const client = getClient();
  const { data, error } = await client
    .from("BlogPostApprovalToken")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `[news/approval-token-storage] falha ao criar token: ${error?.message ?? "no data"}`,
    );
  }

  const row = data as { id: string };
  return {
    raw_token: rawToken,
    expires_at: expiresAt.toISOString(),
    token_id: row.id,
  };
}

export interface ValidTokenRef {
  id: string;
  blog_post_id: string;
  recipient_email: string;
}

export interface FindValidTokenOptions {
  now?: () => Date;
}

/**
 * Hash o input + busca em BlogPostApprovalToken por:
 *   - token_hash igual
 *   - status = 'pending'
 *   - expires_at > NOW()
 *
 * Retorna null para token inválido / expirado / já usado / inexistente.
 * NUNCA retorna o `token_hash` para o caller — só identificadores.
 */
export async function findValidTokenByRaw(
  rawToken: string,
  options: FindValidTokenOptions = {},
): Promise<ValidTokenRef | null> {
  if (typeof rawToken !== "string" || rawToken.length === 0) return null;
  const tokenHash = hashToken(rawToken);
  const now = (options.now ?? (() => new Date()))();

  const client = getClient();
  const { data, error } = await client
    .from("BlogPostApprovalToken")
    .select("id, blog_post_id, recipient_email, status, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.warn(
      "[news/approval-token-storage] erro ao buscar token:",
      error.message,
    );
    return null;
  }
  if (!data) return null;

  const row = data as {
    id: string;
    blog_post_id: string;
    recipient_email: string;
    status: string;
    expires_at: string;
    used_at: string | null;
  };

  if (row.status !== "pending") return null;
  if (row.used_at !== null) return null;
  if (new Date(row.expires_at).getTime() <= now.getTime()) return null;

  return {
    id: row.id,
    blog_post_id: row.blog_post_id,
    recipient_email: row.recipient_email,
  };
}

export interface InspectTokenResult {
  id: string;
  blog_post_id: string;
  recipient_email: string;
  status: "pending" | "approved" | "rejected" | "expired";
  expires_at: string;
  used_at: string | null;
}

/**
 * Inspeciona o estado completo de um token (existe? usado? expirado?). Usado
 * pelos endpoints /api/posts/approve e /reject para diferenciar mensagem ao
 * usuário entre "token inválido" vs. "já processado" vs. "expirado".
 *
 * Retorna null APENAS se o token não existe (hash não bate). Para todos os
 * outros estados (pending/approved/rejected/expired), retorna a row.
 */
export async function inspectToken(
  rawToken: string,
): Promise<InspectTokenResult | null> {
  if (typeof rawToken !== "string" || rawToken.length === 0) return null;
  const tokenHash = hashToken(rawToken);

  const client = getClient();
  const { data, error } = await client
    .from("BlogPostApprovalToken")
    .select("id, blog_post_id, recipient_email, status, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.warn(
      "[news/approval-token-storage] erro ao inspecionar token:",
      error.message,
    );
    return null;
  }
  if (!data) return null;

  return data as InspectTokenResult;
}

export type FinalApprovalStatus = "approved" | "rejected";

export async function markTokenAsUsed(
  tokenId: string,
  status: FinalApprovalStatus,
  options: { now?: () => Date } = {},
): Promise<void> {
  ApprovalTokenStatus.parse(status); // sanity (também aceita pending/expired — descartado)
  const usedAt = (options.now ?? (() => new Date()))().toISOString();

  const client = getClient();
  const { error } = await client
    .from("BlogPostApprovalToken")
    .update({ status, used_at: usedAt })
    .eq("id", tokenId);

  if (error) {
    throw new Error(
      `[news/approval-token-storage] falha ao marcar token ${tokenId} como ${status}: ${error.message}`,
    );
  }
}

/**
 * Manutenção: marca tokens pendentes vencidos como `expired`. Retorna a
 * quantidade afetada. Útil para cron de limpeza (não chamado pelo orchestrator
 * — pode entrar em F-016 ou release separado).
 */
export async function expirePendingTokensOlderThan(
  days: number,
  options: { now?: () => Date } = {},
): Promise<number> {
  const now = (options.now ?? (() => new Date()))();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const client = getClient();
  const { data, error } = await client
    .from("BlogPostApprovalToken")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", cutoff.toISOString())
    .select("id");

  if (error) {
    throw new Error(
      `[news/approval-token-storage] falha ao expirar tokens: ${error.message}`,
    );
  }
  return Array.isArray(data) ? data.length : 0;
}

export const __APPROVAL_TOKEN_INTERNALS = {
  TOKEN_BYTES,
  DEFAULT_TTL_MS,
  hashToken,
};
