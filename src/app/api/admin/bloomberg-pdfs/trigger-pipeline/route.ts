/**
 * F-016b — Auto-trigger do pipeline IA após upload de PDFs Bloomberg.
 *
 * Dual auth (Anti-SPEC §6.3):
 *   1. Sessão Supabase admin (usuário Eduardo via `/admin/bloomberg-pdfs`); OU
 *   2. `Authorization: Bearer ${CRON_SECRET}` (timing-safe — RNF-007).
 *
 * Reuso máximo: chama `runPipeline()` do orchestrator existente — não duplica
 * lógica. Diferenças vs `/api/news/cron`:
 *   - aceita sessão admin como auth alternativa (UI debounce 30s);
 *   - força `trigger_type = "manual_upload"` (auditoria em `news_pipeline_runs`);
 *   - emite log `bloomberg_pdf_pipeline_triggered` com `trigger_source`
 *     (admin_session | cron_secret) sem expor email completo.
 *
 * Feature flag `NEWS_PIPELINE_ENABLED` continua respeitada — se desligada,
 * 503 com mensagem clara para Eduardo religar antes de disparar.
 */

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/features/news/pipeline/orchestrator";
import { checkAdminAuth } from "@/lib/auth-check";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

type AuthOk =
  | { ok: true; source: "admin_session"; emailDomain: string }
  | { ok: true; source: "cron_secret" };

type AuthResult = AuthOk | { ok: false };

async function authenticate(request: NextRequest): Promise<AuthResult> {
  // 1) CRON_SECRET (Bearer)
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET ?? "";
  if (authHeader && cronSecret) {
    const expected = `Bearer ${cronSecret}`;
    if (constantTimeEqual(authHeader, expected)) {
      return { ok: true, source: "cron_secret" };
    }
  }

  // 2) Sessão admin
  const user = await checkAdminAuth();
  if (user) {
    const emailDomain = user.email?.split("@")[1] ?? "unknown";
    return { ok: true, source: "admin_session", emailDomain };
  }

  return { ok: false };
}

async function handle(request: NextRequest): Promise<Response> {
  const auth = await authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NEWS_PIPELINE_ENABLED !== "true") {
    return NextResponse.json(
      {
        error: "pipeline_disabled",
        message:
          "Pipeline desligado. Liga em Vercel envs antes de disparar.",
      },
      { status: 503 },
    );
  }

  const triggerSource = auth.source;
  const triggerEmailDomain =
    auth.source === "admin_session" ? auth.emailDomain : null;

  console.info(
    JSON.stringify({
      event: "bloomberg_pdf_pipeline_triggered",
      trigger_source: triggerSource,
      trigger_email_domain: triggerEmailDomain,
    }),
  );

  try {
    const result = await runPipeline({ trigger_type: "manual_upload" });
    console.info(
      JSON.stringify({
        event: "bloomberg_pdf_pipeline_completed",
        trigger_source: triggerSource,
        run_id: result.run_id,
        status: result.status,
        briefings_pending_review: result.briefings_pending_review,
        briefings_blocked: result.briefings_blocked,
        themes_discarded: result.themes_discarded,
        duration_ms: result.duration_ms,
      }),
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "bloomberg_pdf_pipeline_failed",
        trigger_source: triggerSource,
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error
          ? err.message
          : String(err)
        ).slice(0, 200),
      }),
    );
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export const POST = handle;
