/**
 * Persistência de drafts bloqueados por compliance (F-015b — Bug #2).
 *
 * Quando `runComplianceCheck` HARD-block um artigo, o orchestrator descartaria
 * o draft sem auditoria. Aqui persistimos o draft + violations em Vercel Blob
 * sob `news-blocked-drafts/{run_id}/{slug}.json` para o time editorial poder
 * revisar a calibração do system prompt.
 *
 * Reaproveita padrão de `pdf-storage.ts`. Em ambientes sem
 * `BLOB_READ_WRITE_TOKEN` (dev local sem Vercel Blob configurado), retorna
 * null silenciosamente — o orchestrator continua com o log estruturado.
 *
 * Anti-SPEC §6.3: log de erro NUNCA expõe `body_markdown` completo nem URLs
 * de fontes. O conteúdo só vai para o Blob, que é privado para o time
 * (Vercel Blob não é indexável por IA por default; em produção, manter
 * `access: "public"` exige URL secreta — se quiser ACL fechada, F-016
 * pode trocar por bucket privado Supabase).
 */

import type { BlogArticleDraft } from "@/features/news/contracts/openai";
import type { ComplianceViolation } from "@/features/news/contracts/compliance";

const BLOB_PREFIX = "news-blocked-drafts/";

interface BlobPutClient {
  put(
    pathname: string,
    body: string,
    options: {
      access: "public";
      addRandomSuffix?: boolean;
      contentType?: string;
      token: string;
    },
  ): Promise<{ url: string }>;
}

export interface PersistBlockedDraftInput {
  run_id: string;
  article: BlogArticleDraft;
  violations: ComplianceViolation[];
  blocked_at: string;
}

export interface PersistBlockedDraftOptions {
  /** Permite injetar mock do Vercel Blob nos testes. */
  blobClient?: BlobPutClient;
}

/**
 * Persiste o draft bloqueado em Vercel Blob. Retorna URL pública (Vercel Blob
 * não tem ACL — segurança via URL não-adivinhável + path com run_id UUID).
 *
 * Falha graciosa: token ausente → null sem throw; erro do Blob → log + null.
 */
export async function persistBlockedDraft(
  input: PersistBlockedDraftInput,
  options: PersistBlockedDraftOptions = {},
): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || token.trim().length === 0) {
    console.warn(
      JSON.stringify({
        event: "blocked_draft_persist_skipped",
        reason: "no_blob_token",
        run_id: input.run_id,
        slug: input.article.slug,
      }),
    );
    return null;
  }

  const pathname = `${BLOB_PREFIX}${input.run_id}/${input.article.slug}.json`;
  const payload = JSON.stringify({
    blocked_at: input.blocked_at,
    run_id: input.run_id,
    violations: input.violations,
    article: input.article,
  });

  try {
    const blob = options.blobClient ?? ((await import("@vercel/blob")) as BlobPutClient);
    const result = await blob.put(pathname, payload, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      token,
    });
    return result.url;
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: "blocked_draft_persist_failed",
        run_id: input.run_id,
        slug: input.article.slug,
        error_class:
          err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error
          ? err.message
          : String(err)
        ).slice(0, 200),
      }),
    );
    return null;
  }
}

export const __BLOCKED_DRAFT_STORAGE_INTERNALS = {
  BLOB_PREFIX,
};
