/**
 * Envio do email de aprovação editorial (F-018).
 *
 * Marcos Farias Meneghel é o destinatário principal (decisor formal). Eduardo
 * e Luciano podem ir em CC para visibilidade — qualquer destinatário pode
 * clicar nos links de aprovar/rejeitar; **token é único, primeiro clique
 * decide**. Auditoria de "quem clicou" via `news_events.ip_hash` (F-009).
 *
 * Anti-SPEC §6.3: nunca logar `recipient_email`/`ccEmails` em texto puro
 * em mensagens de erro; nunca expor o `rawToken` em log.
 *
 * RNF-007: o link tem `?token=<rawToken>` — não logar a URL inteira.
 */

import { Resend } from "resend";

const FALLBACK_FROM = "LDC Capital <onboarding@resend.dev>";

export interface SendApprovalEmailInput {
  blogPostId: string;
  blogPostSlug: string;
  blogPostTitle: string;
  blogPostSummary: string;
  blogPostCategoria: string;
  rawToken: string;
  baseUrl: string;
  /** Marcos — destinatário principal (decisor formal). */
  recipientEmail: string;
  /** Eduardo + Luciano — visibilidade. Vazio significa sem CC. */
  ccEmails: string[];
}

export interface SendApprovalEmailDeps {
  /** Permite injetar mock do Resend nos testes. */
  resend?: { emails: { send: ResendSend } };
}

type ResendSend = (payload: ResendSendPayload) => Promise<ResendSendResult>;

interface ResendSendPayload {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
}

interface ResendSendResult {
  data?: { id?: string } | null;
  error?: { message?: string } | null;
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Parse de CSV de emails para array bem-formado. Ignora vazios, faz trim,
 * descarta entradas que não passem no regex `local@dominio.tld`.
 */
export function parseCcEmails(csv: string | undefined | null): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && EMAIL_REGEX.test(e));
}

function getFromAddress(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  const email = process.env.EBOOK_FROM_EMAIL;
  const name = process.env.EBOOK_FROM_NAME ?? "LDC Capital";
  if (email && email.length > 0) return `${name} <${email}>`;
  return FALLBACK_FROM;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Mapping email → nome legível, usado no rodapé do email para diferenciar
 * "Destinatário principal: Marcos Farias Meneghel" de "Destinatário principal:
 * Eduardo Sousa" (em smokes controlados onde Eduardo se auto-notifica).
 *
 * Hardcode aceitável enquanto o time editorial cabe em 3 pessoas. Ao crescer,
 * migrar para `User` no Supabase com role=EDITOR e fallback de display name.
 *
 * Para adicionar um novo destinatário, edite este mapping (e atualize os
 * testes correspondentes em `__tests__/approval-email.test.ts`).
 */
const RECIPIENT_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  "marcos.meneghel@ldccapital.com.br": "Marcos Farias Meneghel",
  "eduardo.sousa@ldccapital.com.br": "Eduardo Sousa",
  "luciano.herzog@ldccapital.com.br": "Luciano Herzog",
};

export function displayNameFor(email: string): string {
  if (typeof email !== "string" || email.length === 0) return "";
  return RECIPIENT_DISPLAY_NAMES[email.toLowerCase()] ?? email;
}

function renderEmailHtml(input: SendApprovalEmailInput): string {
  const approveUrl = `${input.baseUrl}/api/posts/approve?token=${encodeURIComponent(input.rawToken)}`;
  const rejectUrl = `${input.baseUrl}/api/posts/reject?token=${encodeURIComponent(input.rawToken)}`;
  const adminUrl = `${input.baseUrl}/admin/posts/${encodeURIComponent(input.blogPostId)}`;

  const title = escapeHtml(input.blogPostTitle);
  const summary = escapeHtml(input.blogPostSummary);
  const categoria = escapeHtml(input.blogPostCategoria);
  const slug = escapeHtml(input.blogPostSlug);
  const recipientName = escapeHtml(displayNameFor(input.recipientEmail));
  const ccLine =
    input.ccEmails.length > 0
      ? `<p style="font-size:12px;color:#737373;line-height:1.6;margin:0 0 6px;"><strong>Em cópia:</strong> ${escapeHtml(
          input.ccEmails.map((e) => displayNameFor(e)).join(", "),
        )} (visibilidade — também podem aprovar/rejeitar caso necessário).</p>`
      : "";

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <div style="max-width:640px;margin:0 auto;padding:32px 24px;">
      <h1 style="font-size:18px;font-weight:600;color:#1a1a1a;margin:0 0 8px;">Novo artigo aguardando sua aprovação editorial</h1>
      <p style="font-size:14px;color:#525252;margin:0 0 24px;">Editorial LDC · pipeline IA · ${categoria}</p>
      <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:8px;padding:24px;margin:0 0 24px;">
        <h2 style="font-size:20px;font-weight:600;line-height:1.4;color:#1a1a1a;margin:0 0 12px;">${title}</h2>
        <p style="font-size:14px;line-height:1.6;color:#404040;margin:0 0 16px;">${summary}</p>
        <p style="font-size:12px;color:#737373;margin:0;">Slug previsto: <code>/blog/${slug}</code></p>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
        <tr>
          <td style="padding-right:12px;">
            <a href="${approveUrl}" style="display:inline-block;padding:14px 28px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">✓ Aprovar e publicar</a>
          </td>
          <td>
            <a href="${rejectUrl}" style="display:inline-block;padding:14px 28px;background:#dc2626;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">✕ Rejeitar</a>
          </td>
        </tr>
      </table>
      <p style="font-size:13px;color:#525252;margin:0 0 8px;">Quer revisar antes? <a href="${adminUrl}" style="color:#0a3d62;text-decoration:underline;">Ver artigo completo no admin</a>.</p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">
      <p style="font-size:12px;color:#737373;line-height:1.6;margin:0 0 6px;"><strong>Destinatário principal:</strong> ${recipientName} (decisor editorial).</p>
      ${ccLine}
      <p style="font-size:12px;color:#737373;line-height:1.6;margin:0;"><strong>Token expira em 7 dias.</strong> Cada link é single-use — o primeiro clique decide.</p>
    </div>
  </body>
</html>`;
}

export interface SendApprovalEmailResult {
  messageId: string;
}

/**
 * Envia o email de aprovação. Em testes, injete `deps.resend` com mock.
 *
 * Em runtime: lê `RESEND_API_KEY` e instancia `Resend` se ainda não foi
 * passado por `deps`. Falha de envio resulta em throw — o caller no
 * orchestrator captura e segue (artigo já está em BlogPost com `published=false`).
 */
export async function sendApprovalEmail(
  input: SendApprovalEmailInput,
  deps: SendApprovalEmailDeps = {},
): Promise<SendApprovalEmailResult> {
  if (!input.recipientEmail || !EMAIL_REGEX.test(input.recipientEmail)) {
    throw new Error(
      "[news/approval-email] recipientEmail inválido — sendApprovalEmail abortado.",
    );
  }

  const resend =
    deps.resend ??
    (() => {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error(
          "[news/approval-email] RESEND_API_KEY ausente — sendApprovalEmail abortado.",
        );
      }
      return new Resend(apiKey);
    })();

  const subject = `[LDC News] Aprovação editorial: ${input.blogPostTitle}`;
  const html = renderEmailHtml(input);
  const from = getFromAddress();

  const payload: ResendSendPayload = {
    from,
    to: [input.recipientEmail],
    subject,
    html,
  };
  if (input.ccEmails.length > 0) {
    payload.cc = input.ccEmails;
  }

  const result = await resend.emails.send(payload);
  if (result.error) {
    throw new Error(
      `[news/approval-email] Resend retornou erro: ${result.error.message ?? "unknown"}`,
    );
  }
  const messageId = result.data?.id ?? "";
  return { messageId };
}

export const __APPROVAL_EMAIL_INTERNALS = {
  EMAIL_REGEX,
  RECIPIENT_DISPLAY_NAMES,
  getFromAddress,
  renderEmailHtml,
};
