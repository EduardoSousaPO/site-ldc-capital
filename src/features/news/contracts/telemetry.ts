import { z } from "zod";

export const TelemetryEventType = z.enum([
  "view",
  "share",
  "cta_diagnostico",
  "weekly_digest_render",
  "telegram_posted",
  "published",
  "rejected",
  "blocked_compliance",
  "theme_discarded_no_public_source",
]);
export type TelemetryEventType = z.infer<typeof TelemetryEventType>;

export const ShareChannel = z.enum([
  "telegram",
  "linkedin",
  "x",
  "copy_link",
]);
export type ShareChannel = z.infer<typeof ShareChannel>;

export const TelemetryEvent = z.object({
  type: TelemetryEventType,
  briefing_slug: z.string().optional(),
  share_channel: ShareChannel.optional(),
  ip_hash: z.string().regex(/^[a-f0-9]{64}$/, "Deve ser SHA-256 hex"),
  user_agent: z.string().max(500),
  referer: z.string().url().optional(),
  ts: z.string().datetime(),
});
export type TelemetryEvent = z.infer<typeof TelemetryEvent>;
