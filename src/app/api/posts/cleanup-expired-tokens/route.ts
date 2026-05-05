/**
 * Cron diário (00h BRT / 03h UTC) — F-016 / DEBT-011.
 *
 * Marca como `expired` os tokens em `BlogPostApprovalToken` que estão
 * `pending` e cujo `expires_at` já passou (TTL 7 dias). Sem o cron, rows
 * `pending` antigos acumulam quando Marcos ignora emails — não quebra nada,
 * mas suja o índice e dificulta auditoria.
 *
 * Auth via `CRON_SECRET` em `Authorization: Bearer ...` (timing-safe — RNF-007).
 * Disparado pelo Vercel Cron diariamente às 03h UTC (= 00h BRT, fora dos
 * horários do pipeline às 07h e 14h BRT).
 *
 * Anti-SPEC §6.3: log estruturado JSON sem expor IDs ou emails.
 */

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { expirePendingTokensOlderThan } from "@/features/news/persistence/approval-token-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CLEANUP_DAYS = 7;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET ?? "";
  if (!authHeader || !cronSecret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const expected = `Bearer ${cronSecret}`;
  if (!constantTimeEqual(authHeader, expected)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ts = new Date().toISOString();
  try {
    const expiredCount = await expirePendingTokensOlderThan(CLEANUP_DAYS);

    console.info(
      JSON.stringify({
        event: "tokens_cleanup_run",
        expired_count: expiredCount,
        ttl_days: CLEANUP_DAYS,
        ts,
      }),
    );

    return NextResponse.json({
      expired_count: expiredCount,
      ttl_days: CLEANUP_DAYS,
      ts,
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "tokens_cleanup_failed",
        error_class: err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error
          ? err.message
          : String(err)
        ).slice(0, 200),
        ts,
      }),
    );
    return new NextResponse("Internal error", { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
