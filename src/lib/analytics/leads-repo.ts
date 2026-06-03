// Leitura de leads da tabela public."Client" (service role). Somente SELECT —
// a captura de leads (INSERT) é da rota pública /api/lead, intocável (Anti-SPEC §6.6).

import { createSupabaseAdminClient } from "@/lib/supabase";
import type { LeadRow } from "./aggregate-leads";

/** Lead detalhado para a tabela da Página C (inclui campos derivados de notes). */
export interface LeadDetailRow extends LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

const DETAIL_COLUMNS = "id, name, email, phone, notes, createdAt, utm_campaign, utm_source, utm_content";

// Cap defensivo: painel admin, escala de dezenas/centenas. Evita varrer base inteira.
const MAX_LEADS = 5000;

/** Todos os leads com algum UTM relevante (para agregações do dashboard). */
export async function fetchLeadsWithUtm(): Promise<LeadDetailRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("Client")
    .select(DETAIL_COLUMNS)
    .order("createdAt", { ascending: false })
    .limit(MAX_LEADS);
  if (error) throw new Error(error.message);
  return (data as LeadDetailRow[] | null) ?? [];
}

/** Leads de um vídeo específico (Client.utm_content = youtube_video_id), paginado. */
export async function fetchLeadsForVideo(
  youtubeVideoId: string,
  opts: { page: number; pageSize: number },
): Promise<{ leads: LeadDetailRow[]; total: number }> {
  const supabase = createSupabaseAdminClient();
  const from = (opts.page - 1) * opts.pageSize;
  const to = from + opts.pageSize - 1;
  const { data, error, count } = await supabase
    .from("Client")
    .select(DETAIL_COLUMNS, { count: "exact" })
    .eq("utm_content", youtubeVideoId)
    .order("createdAt", { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);
  return { leads: (data as LeadDetailRow[] | null) ?? [], total: count ?? 0 };
}
