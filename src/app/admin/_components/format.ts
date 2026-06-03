// Helpers de formatação para o painel de vídeos (pt-BR).
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ensureUtcIso } from "@/lib/analytics/aggregate-leads";

const nf = new Intl.NumberFormat("pt-BR");

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return nf.format(n);
}

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(ensureUtcIso(iso)), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(parseISO(ensureUtcIso(iso)), { addSuffix: true, locale: ptBR });
  } catch {
    return "—";
  }
}

/** ratio (0..1) → "1,23%". null → "—". */
export function formatPct(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined) return "—";
  return `${(ratio * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
