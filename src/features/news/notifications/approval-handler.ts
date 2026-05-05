/**
 * Handler compartilhado entre /api/posts/approve e /api/posts/reject (F-018).
 *
 * Validação:
 *   1. Query param `token` → ApproveRequest.parse
 *   2. inspectToken(rawToken)
 *      - null → HTML 200 "Link inválido"
 *      - status != 'pending' OU used_at != null → HTML 200 "Já processado"
 *      - expires_at <= now → HTML 200 "Link expirado"
 *      - válido → segue
 *   3. Se action='approve':
 *        a. UPDATE BlogPost SET published=true, publishedAt=NOW()
 *        b. markTokenAsUsed(id, 'approved')
 *        c. track({type: 'published', briefing_slug, ip_hash, user_agent, ts})
 *        d. HTML 200 "✓ Publicado"
 *      Se action='reject':
 *        a. markTokenAsUsed(id, 'rejected')
 *        b. track({type: 'rejected', ...})
 *        c. HTML 200 "✕ Rejeitado"
 *
 * Idempotência: token já usado retorna mensagem clara (não 404 nem 410 — UX).
 *
 * Anti-SPEC §6.3: response NÃO ecoa o token. Logs de erro NÃO incluem
 * recipient_email em texto puro. ip_hash via F-009 hashIp().
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ApproveRequest } from "@/features/news/contracts/approval";
import {
  findValidTokenByRaw,
  inspectToken,
  markTokenAsUsed,
  type FinalApprovalStatus,
  type InspectTokenResult,
} from "@/features/news/persistence/approval-token-storage";
import { track } from "@/features/news/telemetry/track";
import { extractRequestMeta } from "@/features/news/telemetry/extract-request-meta";

export type ApprovalAction = "approve" | "reject";

interface BlogPostUpdateClientLike {
  from(table: string): {
    update(
      values: Record<string, unknown>,
    ): {
      eq(
        column: string,
        value: string,
      ): {
        select(cols: string): {
          maybeSingle(): Promise<{
            data: { slug: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    select(cols: string): {
      eq(
        column: string,
        value: string,
      ): {
        maybeSingle(): Promise<{
          data: { slug: string; published: boolean } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

let cachedBlogPostClient: SupabaseClient | null = null;

function getBlogPostClient(): SupabaseClient {
  if (cachedBlogPostClient) return cachedBlogPostClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "[news/approval-handler] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.",
    );
  }
  cachedBlogPostClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedBlogPostClient;
}

export function __resetApprovalHandlerForTests(): void {
  cachedBlogPostClient = null;
}

export function __setApprovalHandlerClientForTests(
  client: SupabaseClient,
): void {
  cachedBlogPostClient = client;
}

export interface HandleApprovalDeps {
  inspect?: typeof inspectToken;
  findValid?: typeof findValidTokenByRaw;
  markUsed?: typeof markTokenAsUsed;
  trackEvent?: typeof track;
  blogPostClient?: BlogPostUpdateClientLike;
  now?: () => Date;
}

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

function pageShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title} · LDC News</title>
    <style>
      body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;}
      .wrap{max-width:560px;margin:0 auto;padding:48px 24px;}
      .card{background:#ffffff;border:1px solid #e5e5e5;border-radius:8px;padding:32px;}
      h1{font-size:22px;font-weight:600;margin:0 0 12px;line-height:1.3;}
      p{font-size:15px;line-height:1.6;color:#404040;margin:0 0 12px;}
      a.btn{display:inline-block;padding:10px 20px;background:#0a3d62;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;font-size:14px;margin-top:16px;}
      .ok h1{color:#15803d;}
      .err h1{color:#991b1b;}
      .neutral h1{color:#404040;}
    </style>
  </head>
  <body>
    <div class="wrap">
      ${body}
    </div>
  </body>
</html>`;
}

function htmlResponse(
  status: number,
  variant: "ok" | "err" | "neutral",
  title: string,
  bodyHtml: string,
): Response {
  const card = `<div class="card ${variant}">${bodyHtml}</div>`;
  return new Response(pageShell(title, card), {
    status,
    headers: HTML_HEADERS,
  });
}

function safeAdminUrl(blogPostId: string): string {
  return `/admin/posts/${encodeURIComponent(blogPostId)}`;
}

function formatPtBR(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  } catch {
    return iso;
  }
}

export async function handleApproval(
  request: Request,
  action: ApprovalAction,
  deps: HandleApprovalDeps = {},
): Promise<Response> {
  const inspect = deps.inspect ?? inspectToken;
  const markUsed = deps.markUsed ?? markTokenAsUsed;
  const trackEvent = deps.trackEvent ?? track;
  const now = (deps.now ?? (() => new Date()))();

  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token") ?? "";
  const parsed = ApproveRequest.safeParse({ token: tokenParam });
  if (!parsed.success) {
    return htmlResponse(
      200,
      "err",
      "Link inválido",
      `<h1>Link inválido</h1><p>O token informado não tem o formato esperado. Verifique se o link foi copiado por completo, ou peça um novo email para o time editorial.</p>`,
    );
  }

  const state = await inspect(parsed.data.token);
  if (!state) {
    return htmlResponse(
      200,
      "err",
      "Link inválido",
      `<h1>Link inválido</h1><p>Este token não foi encontrado. Pode ter sido invalidado, ou o link veio truncado por seu cliente de email.</p>`,
    );
  }

  // Já processado (idempotência)
  if (state.used_at !== null || state.status !== "pending") {
    return htmlResponse(
      200,
      "neutral",
      "Já processado",
      `<h1>Esta ação já foi processada</h1>
       <p>Status atual: <strong>${state.status}</strong>${
         state.used_at
           ? ` em ${formatPtBR(state.used_at)} (horário de Brasília).`
           : "."
       }</p>
       <p>Cada link de aprovação é single-use. Se houve algum engano, peça ao time editorial para gerar um novo email.</p>
       <a class="btn" href="${safeAdminUrl(state.blog_post_id)}">Abrir admin</a>`,
    );
  }

  // Expirado
  if (new Date(state.expires_at).getTime() <= now.getTime()) {
    // Marca explicitamente como expired (best effort).
    try {
      await markUsed(state.id, "rejected", { now: () => now }).catch(() => {
        /* swallow — UX prioridade */
      });
    } catch {
      /* swallow */
    }
    return htmlResponse(
      200,
      "err",
      "Link expirado",
      `<h1>Link expirado</h1><p>Tokens de aprovação valem 7 dias. Peça ao time editorial para reenviar o email com um link novo.</p>`,
    );
  }

  // Recupera dados do BlogPost para obter slug (telemetria + UX) — opcional
  // mas barato. Se falhar, segue com slug = ""; orchestrator garante slug
  // existe (BlogPost.slug NOT NULL).
  let blogPostSlug = "";
  let blogPostPublishedAlready = false;
  try {
    const client = (deps.blogPostClient ??
      (getBlogPostClient() as unknown as BlogPostUpdateClientLike)) as BlogPostUpdateClientLike;
    const { data, error } = await client
      .from("BlogPost")
      .select("slug, published")
      .eq("id", state.blog_post_id)
      .maybeSingle();
    if (error) {
      console.warn(
        "[news/approval-handler] falha ao ler BlogPost:",
        error.message,
      );
    } else if (data) {
      blogPostSlug = data.slug;
      blogPostPublishedAlready = data.published;
    }
  } catch (err) {
    console.warn(
      "[news/approval-handler] erro inesperado ao ler BlogPost:",
      err instanceof Error ? err.message : err,
    );
  }

  // Telemetria — IP hash + user agent (server-side mas via clique de Marcos).
  // extractRequestMeta já retorna ip_hash (SHA-256 do IP) e user_agent truncado.
  const meta = extractRequestMeta(request);

  if (action === "approve") {
    // 1. UPDATE BlogPost para published=true (idempotente: se já published,
    // não duplica telemetria, mas marca o token como approved).
    if (!blogPostPublishedAlready) {
      try {
        const client = (deps.blogPostClient ??
          (getBlogPostClient() as unknown as BlogPostUpdateClientLike)) as BlogPostUpdateClientLike;
        const { error } = await client
          .from("BlogPost")
          .update({ published: true, publishedAt: now.toISOString() })
          .eq("id", state.blog_post_id)
          .select("slug")
          .maybeSingle();
        if (error) {
          throw new Error(error.message);
        }
      } catch (err) {
        console.error(
          "[news/approval-handler] falha ao publicar BlogPost:",
          err instanceof Error ? err.message : err,
        );
        return htmlResponse(
          500,
          "err",
          "Erro interno",
          `<h1>Erro ao publicar</h1><p>Ocorreu um problema ao atualizar o artigo. O token NÃO foi consumido — tente novamente em alguns minutos ou contate o time editorial.</p>`,
        );
      }
    }
    await markUsed(state.id, "approved" as FinalApprovalStatus, {
      now: () => now,
    });
    if (blogPostSlug.length > 0) {
      await trackEvent({
        type: "published",
        briefing_slug: blogPostSlug,
        ip_hash: meta.ip_hash,
        user_agent: meta.user_agent.length > 0 ? meta.user_agent : "approval-link",
        ts: now.toISOString(),
      });
    }
    const slugLink = blogPostSlug.length > 0
      ? `<p>Acesse: <a href="/blog/${encodeURIComponent(blogPostSlug)}">/blog/${blogPostSlug}</a></p>`
      : "";
    return htmlResponse(
      200,
      "ok",
      "Artigo publicado",
      `<h1>✓ Artigo publicado com sucesso</h1>
       <p>O artigo agora está visível em <code>/blog</code>.</p>
       ${slugLink}
       <a class="btn" href="${safeAdminUrl(state.blog_post_id)}">Abrir no admin</a>`,
    );
  }

  // action === "reject"
  await markUsed(state.id, "rejected" as FinalApprovalStatus, {
    now: () => now,
  });
  if (blogPostSlug.length > 0) {
    await trackEvent({
      type: "rejected",
      briefing_slug: blogPostSlug,
      ip_hash: meta.ip_hash,
      user_agent: meta.user_agent.length > 0 ? meta.user_agent : "approval-link",
      ts: now.toISOString(),
    });
  }
  return htmlResponse(
    200,
    "neutral",
    "Artigo rejeitado",
    `<h1>✕ Artigo rejeitado</h1>
     <p>O artigo NÃO será publicado e permanece em <strong>published=false</strong> no banco. Time editorial pode ainda revisar manualmente via admin se for o caso.</p>
     <a class="btn" href="${safeAdminUrl(state.blog_post_id)}">Abrir no admin</a>`,
  );
}

export const __APPROVAL_HANDLER_INTERNALS = {
  pageShell,
  htmlResponse,
  formatPtBR,
};

export type { InspectTokenResult };
