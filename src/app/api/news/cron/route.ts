/**
 * Endpoint cron do pipeline IA pós-pivot ADR-005.
 *
 * Disparado por Vercel Cron (manhã + tarde) ou manualmente. Cobre:
 *   - RNF-007: autenticação por CRON_SECRET (timing-safe equal)
 *   - Feature flag NEWS_PIPELINE_ENABLED — default false; Eduardo liga
 *     manualmente após smoke test autorizado
 *   - Detecção de turno por hora UTC (<12 = manhã; ≥12 = tarde)
 *   - Body opcional `{ trigger_type?, pdf_ids? }` para reentrância manual
 *
 * Erros internos voltam como 500 genérico — Anti-SPEC §6.3 proíbe vazar
 * tokens, IDs de PDF, ou stack traces para o cliente.
 */

import { timingSafeEqual } from "node:crypto";
import { runPipeline } from "@/features/news/pipeline/orchestrator";
import { TriggerType } from "@/features/news/contracts/pipeline";
import type { TriggerType as TriggerTypeT } from "@/features/news/contracts/pipeline";

// Vercel: garante execução em Node runtime (pdfjs e supabase precisam).
// Nunca virar static.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function defaultTriggerByUtcHour(): TriggerTypeT {
  return new Date().getUTCHours() < 12 ? "cron_morning" : "cron_afternoon";
}

interface CronBody {
  trigger_type?: string;
  pdf_ids?: unknown;
}

async function readBody(req: Request): Promise<CronBody> {
  if (req.method !== "POST") return {};
  const ctype = req.headers.get("content-type") ?? "";
  if (!ctype.toLowerCase().includes("application/json")) return {};
  try {
    const data = (await req.json()) as unknown;
    if (data && typeof data === "object") return data as CronBody;
  } catch {
    // body vazio ou JSON malformado → trata como ausência de body
  }
  return {};
}

async function handle(req: Request): Promise<Response> {
  // 1. Auth
  const authHeader = req.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET ?? "";
  if (!authHeader || !cronSecret) {
    return new Response(null, { status: 401 });
  }
  const expected = `Bearer ${cronSecret}`;
  if (!constantTimeEqual(authHeader, expected)) {
    return new Response(null, { status: 401 });
  }

  // 2. Feature flag
  if (process.env.NEWS_PIPELINE_ENABLED !== "true") {
    return Response.json(
      { error: "pipeline_disabled" },
      { status: 503 },
    );
  }

  // 3. Body opcional
  const body = await readBody(req);
  let triggerType: TriggerTypeT;
  if (body.trigger_type !== undefined) {
    const parsed = TriggerType.safeParse(body.trigger_type);
    if (!parsed.success) {
      return Response.json(
        { error: "invalid_trigger_type" },
        { status: 400 },
      );
    }
    triggerType = parsed.data;
  } else {
    triggerType = defaultTriggerByUtcHour();
  }

  let pdfIds: string[] | undefined;
  if (Array.isArray(body.pdf_ids)) {
    const filtered = body.pdf_ids.filter(
      (s): s is string => typeof s === "string" && s.length > 0,
    );
    if (filtered.length > 0) pdfIds = filtered;
  }

  // 4. Run pipeline
  try {
    const result = await runPipeline({
      trigger_type: triggerType,
      pdf_ids: pdfIds,
    });
    return Response.json(result);
  } catch (err) {
    console.error(
      "[news/cron] pipeline error:",
      err instanceof Error ? err.message : err,
    );
    return Response.json({ error: "internal" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
