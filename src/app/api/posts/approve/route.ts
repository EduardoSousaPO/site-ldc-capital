/**
 * Endpoint público GET /api/posts/approve?token=<rawToken> (F-018).
 *
 * Marcos clica no link do email → browser GET → este handler.
 * Token é único; primeiro clique decide. Qualquer destinatário (TO ou CC)
 * pode acessar — auditoria via news_events.ip_hash (F-009).
 */

import { handleApproval } from "@/features/news/notifications/approval-handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleApproval(request, "approve");
}
