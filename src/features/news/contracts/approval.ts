import { z } from "zod";

/**
 * Contratos Zod para F-018 — aprovação editorial por email (token-based).
 *
 * Token raw é gerado via `crypto.randomBytes(32).toString("hex")` (64 hex chars)
 * e enviado APENAS no link do email para Marcos. No banco armazenamos só
 * `token_hash = SHA-256(raw_token)` — defense in depth contra dump da tabela
 * (RNF-007). Single-use: primeiro clique seta `used_at` e fecha o token.
 */

export const ApprovalTokenStatus = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
]);
export type ApprovalTokenStatus = z.infer<typeof ApprovalTokenStatus>;

export const ApprovalTokenRow = z.object({
  id: z.string().uuid(),
  // BlogPost.id é TEXT (default gen_random_uuid()), não uuid Postgres — schema
  // existente herdado do admin /admin/posts. O FK aceita TEXT.
  blog_post_id: z.string().min(1),
  token_hash: z.string().regex(/^[a-f0-9]{64}$/, "Deve ser SHA-256 hex"),
  status: ApprovalTokenStatus,
  recipient_email: z.string().email(),
  expires_at: z.string().datetime({ offset: true }),
  used_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
});
export type ApprovalTokenRow = z.infer<typeof ApprovalTokenRow>;

export const ApproveRequest = z.object({
  // Raw token vem do query string ?token=... — 64 chars hex.
  token: z.string().min(32).max(128),
});
export type ApproveRequest = z.infer<typeof ApproveRequest>;

export const ApprovalActionResult = z.object({
  success: z.boolean(),
  status: ApprovalTokenStatus,
  message: z.string(),
});
export type ApprovalActionResult = z.infer<typeof ApprovalActionResult>;
