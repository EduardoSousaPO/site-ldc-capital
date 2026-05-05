import { TelemetryEvent } from "../contracts/telemetry";
import { getNewsTelemetryClient } from "./client";

/**
 * Registra um evento de telemetria em `public.news_events`.
 *
 * Cobre SPEC §RF-015 / §CA-029. Anti-SPEC §6.2 (sem PII em texto puro: o
 * caller é responsável por já passar `ip_hash` derivado de `hashIp()`).
 *
 * Padrão de uso:
 *
 *     // server-side, fire-and-forget — telemetria NUNCA bloqueia request HTTP
 *     void track({ type: "view", briefing_slug, ip_hash, user_agent, ts });
 *
 *     // ou, se preferir explicitar o tratamento:
 *     await track(event);
 *
 * Em caso de payload inválido, lança ZodError (uso interno indica bug).
 * Em caso de erro do Supabase, registra em `console.error` e retorna
 * sem throw — Anti-SPEC §6.3 manda telemetria não quebrar UX.
 */
export async function track(event: TelemetryEvent): Promise<void> {
  const parsed = TelemetryEvent.parse(event);

  try {
    const client = getNewsTelemetryClient();
    const { error } = await client.from("news_events").insert(parsed);
    if (error) {
      console.error(
        "[news/telemetry] falha ao inserir evento:",
        error.message,
      );
    }
  } catch (err) {
    console.error("[news/telemetry] erro inesperado:", err);
  }
}
