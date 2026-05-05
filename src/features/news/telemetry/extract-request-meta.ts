import { hashIp } from "./hash-ip";

const FALLBACK_IP = "0.0.0.0";
const USER_AGENT_MAX_LEN = 500;

export interface RequestMeta {
  ip_hash: string;
  user_agent: string;
  referer?: string;
}

/**
 * Lê headers de Request server-side (Next.js Route Handler / Server Action)
 * e devolve metadados anonimizados prontos para `track()`.
 *
 * Anti-SPEC §6.2: IP é hasheado antes de sair desta função.
 * user_agent é truncado em 500 chars para alinhar com o schema TelemetryEvent.
 */
export function extractRequestMeta(req: Request): RequestMeta {
  const headers = req.headers;
  const xForwardedFor = headers.get("x-forwarded-for");
  const xRealIp = headers.get("x-real-ip");

  const firstForwarded = xForwardedFor?.split(",")[0]?.trim();
  const rawIp = firstForwarded || xRealIp || FALLBACK_IP;

  const userAgent = (headers.get("user-agent") ?? "").slice(0, USER_AGENT_MAX_LEN);
  const referer = headers.get("referer") ?? headers.get("referrer") ?? undefined;

  return {
    ip_hash: hashIp(rawIp),
    user_agent: userAgent,
    ...(referer ? { referer } : {}),
  };
}
