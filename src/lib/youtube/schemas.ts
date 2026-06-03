// Schemas Zod de IO das rotas /api/admin/videos** e /analytics/utm (Anti-SPEC §6.5).

import { z } from "zod";
import { extractVideoId } from "./extract-video-id";

export const PERIOD_VALUES = ["7d", "30d", "90d", "all"] as const;
export type Period = (typeof PERIOD_VALUES)[number];

/** Mapeia período → nº de dias (all = 3650 ≈ 10 anos). */
export function periodToDays(period: Period): number {
  switch (period) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "all":
      return 3650;
  }
}

// POST /api/admin/videos
export const createTrackedVideoSchema = z.object({
  url: z
    .string()
    .min(1, "URL obrigatória")
    .refine((v) => extractVideoId(v) !== null, "URL do YouTube inválida"),
  utm_campaign: z.string().min(1, "Campanha obrigatória").max(80, "Campanha muito longa"),
  utm_term: z.string().max(120, "Descrição muito longa").optional().nullable(),
});
export type CreateTrackedVideoInput = z.infer<typeof createTrackedVideoSchema>;

// PATCH /api/admin/videos/[id]
export const patchTrackedVideoSchema = z
  .object({
    utm_campaign: z.string().min(1).max(80).optional(),
    utm_term: z.string().max(120).nullable().optional(),
  })
  .refine((o) => o.utm_campaign !== undefined || o.utm_term !== undefined, {
    message: "Nada para atualizar",
  });
export type PatchTrackedVideoInput = z.infer<typeof patchTrackedVideoSchema>;

// GET /api/admin/videos (querystring)
export const listVideosQuerySchema = z.object({
  campaign: z.string().optional(),
  period: z.enum(PERIOD_VALUES).default("all"),
  q: z.string().optional(),
  sort: z.enum(["leads_30d", "created_at"]).default("leads_30d"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListVideosQuery = z.infer<typeof listVideosQuerySchema>;

// GET /api/admin/videos/[id]/leads (querystring)
export const leadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type LeadsQuery = z.infer<typeof leadsQuerySchema>;

// GET /api/admin/analytics/utm (querystring)
export const analyticsUtmQuerySchema = z.object({
  period: z.enum(PERIOD_VALUES).default("30d"),
});
export type AnalyticsUtmQuery = z.infer<typeof analyticsUtmQuerySchema>;

/** Helper: parseia URLSearchParams num objeto plano (só chaves presentes). */
export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (value !== "") out[key] = value;
  }
  return out;
}
