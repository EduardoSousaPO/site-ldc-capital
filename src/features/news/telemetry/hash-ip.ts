import { createHash } from "node:crypto";

/**
 * SHA-256(salt + ip) em hex de 64 chars.
 * Anti-SPEC §6.2: IP NUNCA é armazenado em texto puro.
 * Salt opcional via env NEWS_IP_HASH_SALT (default: string vazia).
 * Função pura e determinística.
 */
export function hashIp(ip: string): string {
  const salt = process.env.NEWS_IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}${ip}`).digest("hex");
}
