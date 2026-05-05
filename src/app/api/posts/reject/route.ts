/**
 * Endpoint público GET /api/posts/reject?token=<rawToken> (F-018).
 *
 * Marcos clica no link "rejeitar" → BlogPost permanece published=false e
 * o token é marcado como rejected. Auditoria via news_events.ip_hash.
 */

import { handleApproval } from "@/features/news/notifications/approval-handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleApproval(request, "reject");
}
