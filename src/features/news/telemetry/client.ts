import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { TelemetryEvent } from "../contracts/telemetry";

// Insert shape derivado do contrato Zod canônico para evitar duplicação.
// `id` é auto-gerado (gen_random_uuid()) e omitido do Insert.
type NewsEventInsert = z.input<typeof TelemetryEvent>;

export interface NewsTelemetryDB {
  public: {
    Tables: {
      news_events: {
        Row: NewsEventInsert & { id: string };
        Insert: NewsEventInsert;
        Update: Partial<NewsEventInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type NewsTelemetryClient = SupabaseClient<NewsTelemetryDB>;

let cachedClient: NewsTelemetryClient | null = null;

function buildClient(): NewsTelemetryClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "[news/telemetry] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.",
    );
  }
  return createClient<NewsTelemetryDB>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getNewsTelemetryClient(): NewsTelemetryClient {
  if (!cachedClient) {
    cachedClient = buildClient();
  }
  return cachedClient;
}

export function __resetNewsTelemetryClientForTests(): void {
  cachedClient = null;
}
