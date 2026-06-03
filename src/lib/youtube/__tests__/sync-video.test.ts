import { describe, expect, it } from "vitest";
import { isWithinCooldown, REFRESH_COOLDOWN_MS } from "../sync-video";

const NOW = new Date("2026-06-02T12:00:00.000Z");

describe("isWithinCooldown — CA-008 (rate-limit 1/min)", () => {
  it("null/sem sync → fora do cooldown", () => {
    expect(isWithinCooldown(null, NOW)).toBe(false);
  });

  it("sync há 30s → dentro do cooldown", () => {
    const synced = new Date(NOW.getTime() - 30_000).toISOString();
    expect(isWithinCooldown(synced, NOW)).toBe(true);
  });

  it("sync há mais de 1 min → fora do cooldown", () => {
    const synced = new Date(NOW.getTime() - REFRESH_COOLDOWN_MS - 1).toISOString();
    expect(isWithinCooldown(synced, NOW)).toBe(false);
  });

  it("timestamp inválido → fora do cooldown", () => {
    expect(isWithinCooldown("not-a-date", NOW)).toBe(false);
  });
});
