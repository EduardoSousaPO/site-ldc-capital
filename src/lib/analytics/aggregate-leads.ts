// Agregações puras de leads (rows da tabela Client) para os dashboards.
// Recebe rows e devolve séries/contagens determinísticas. Sem I/O, sem Date.now
// implícito: janelas temporais recebem um `referenceDate` explícito (testável).
//
// Pure functions — cobertas por testes (CA-004).

import { differenceInCalendarDays, format, parseISO } from "date-fns";

/** Subset de Client necessário para as agregações. */
export interface LeadRow {
  createdAt: string; // ISO timestamp
  utm_campaign: string | null;
  utm_source: string | null;
  utm_content: string | null;
  notes?: string | null;
}

export interface CountBucket {
  key: string;
  count: number;
}

export interface DayBucket {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * Normaliza timestamp para ISO com timezone. Colunas `timestamp without time
 * zone` (ex.: Client.createdAt) chegam sem 'Z'/offset, mas guardam UTC — sem
 * isso o parse assume horário local e quebra janelas 7d/30d e tempo relativo.
 */
export function ensureUtcIso(value: string): string {
  if (/(?:[zZ]|[+-]\d\d:?\d\d)$/.test(value)) return value;
  return value.replace(" ", "T") + "Z";
}

function safeParse(iso: string): Date | null {
  try {
    const d = parseISO(ensureUtcIso(iso));
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** Conta leads agrupados por utm_campaign (null → "(sem campanha)"), desc. */
export function aggregateLeadsByCampaign(rows: LeadRow[]): CountBucket[] {
  return groupAndSort(rows, (r) => r.utm_campaign ?? "(sem campanha)");
}

/** Conta leads agrupados por utm_source (null → "(direto)"), desc. */
export function aggregateLeadsBySource(rows: LeadRow[]): CountBucket[] {
  return groupAndSort(rows, (r) => r.utm_source ?? "(direto)");
}

function groupAndSort(rows: LeadRow[], keyFn: (r: LeadRow) => string): CountBucket[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/**
 * Série de leads por dia nos últimos `days` dias (inclui dias com zero).
 * `referenceDate` = "hoje" lógico (default: agora). Datas em UTC-naive via format.
 */
export function aggregateLeadsByDay(
  rows: LeadRow[],
  days: number,
  referenceDate: Date,
): DayBucket[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const d = safeParse(row.createdAt);
    if (!d) continue;
    const diff = differenceInCalendarDays(referenceDate, d);
    if (diff < 0 || diff >= days) continue;
    const key = format(d, "yyyy-MM-dd");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Preenche o range completo (do mais antigo ao mais recente) com zeros.
  const series: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(referenceDate);
    day.setDate(day.getDate() - i);
    const key = format(day, "yyyy-MM-dd");
    series.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return series;
}

/** Filtra leads dentro da janela dos últimos `days` dias (janela inclusiva). */
export function filterLeadsInWindow<T extends Pick<LeadRow, "createdAt">>(
  rows: T[],
  days: number,
  referenceDate: Date,
): T[] {
  return rows.filter((row) => {
    const d = safeParse(row.createdAt);
    if (!d) return false;
    const diff = differenceInCalendarDays(referenceDate, d);
    return diff >= 0 && diff < days;
  });
}

/** Quantos leads caíram nos últimos `days` dias (janela inclusiva). */
export function countLeadsInWindow(
  rows: LeadRow[],
  days: number,
  referenceDate: Date,
): number {
  let count = 0;
  for (const row of rows) {
    const d = safeParse(row.createdAt);
    if (!d) continue;
    const diff = differenceInCalendarDays(referenceDate, d);
    if (diff >= 0 && diff < days) count += 1;
  }
  return count;
}

export interface LeadsSummary {
  total: number;
  withUtm: number;
  sharePct: number; // % de leads com utm_source preenchido (0..100)
  topCampaigns: CountBucket[];
}

/** Resumo para os cards do dashboard global. `topN` campanhas (default 3). */
export function summarizeLeads(rows: LeadRow[], topN = 3): LeadsSummary {
  const total = rows.length;
  const withUtm = rows.filter((r) => Boolean(r.utm_source)).length;
  const sharePct = total === 0 ? 0 : Math.round((withUtm / total) * 1000) / 10;
  return {
    total,
    withUtm,
    sharePct,
    topCampaigns: aggregateLeadsByCampaign(rows.filter((r) => r.utm_campaign)).slice(0, topN),
  };
}

/** Filtra rows cujo utm_content casa com algum youtube_video_id rastreado. */
export function leadsForVideo(rows: LeadRow[], youtubeVideoId: string): LeadRow[] {
  return rows.filter((r) => r.utm_content === youtubeVideoId);
}
