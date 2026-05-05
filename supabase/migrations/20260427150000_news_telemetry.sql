-- ============================================================================
-- F-009 — Telemetria /news (LDC Capital)
-- Cobre: SPEC §RF-015, §RNF-007, §CA-029, Anti-SPEC §6.2 (sem PII), §6.3 (server-side)
-- Padrão RLS: replica BlogPost (service_role full access; sem leitura anon/authenticated)
-- ============================================================================

-- ─── public.news_events ─────────────────────────────────────────────────────
-- Eventos discretos: view, share, cta, render do digest, etc.
-- ip_hash é SHA-256 hex (64 chars). NUNCA armazena IP em texto puro.
CREATE TABLE IF NOT EXISTS public.news_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'view',
    'share',
    'cta_diagnostico',
    'weekly_digest_render',
    'telegram_posted',
    'published',
    'blocked_compliance',
    'theme_discarded_no_public_source'
  )),
  briefing_slug TEXT,
  share_channel TEXT CHECK (share_channel IS NULL OR share_channel IN (
    'telegram', 'linkedin', 'x', 'copy_link'
  )),
  ip_hash TEXT CHECK (ip_hash IS NULL OR ip_hash ~ '^[a-f0-9]{64}$'),
  user_agent TEXT,
  referer TEXT,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_events_briefing_ts
  ON public.news_events (briefing_slug, ts DESC)
  WHERE briefing_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_events_type_ts
  ON public.news_events (type, ts DESC);

ALTER TABLE public.news_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to news events"
  ON public.news_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── public.news_pipeline_runs ──────────────────────────────────────────────
-- Telemetria de cada execução do pipeline IA (cron ou manual).
-- Espelha contracts/pipeline.ts → PipelineRun.
CREATE TABLE IF NOT EXISTS public.news_pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'cron_morning', 'cron_afternoon', 'manual_upload', 'manual_admin'
  )),
  pdf_ids_used UUID[] NOT NULL DEFAULT '{}',
  perplexity_queries TEXT[] NOT NULL DEFAULT '{}',
  openai_total_tokens INTEGER NOT NULL DEFAULT 0,
  openai_cost_brl NUMERIC(10, 4) NOT NULL DEFAULT 0,
  briefings_generated INTEGER NOT NULL DEFAULT 0,
  briefings_blocked INTEGER NOT NULL DEFAULT 0,
  themes_discarded_no_public_source INTEGER NOT NULL DEFAULT 0,
  bloomberg_citation_attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  error_message TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_news_pipeline_runs_status_triggered
  ON public.news_pipeline_runs (status, triggered_at DESC);

ALTER TABLE public.news_pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to news pipeline runs"
  ON public.news_pipeline_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── public.news_pipeline_errors ────────────────────────────────────────────
-- Erros granulares por estágio do pipeline.
-- ON DELETE CASCADE para limpeza ao remover um run.
CREATE TABLE IF NOT EXISTS public.news_pipeline_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.news_pipeline_runs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  error_class TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_pipeline_errors_run
  ON public.news_pipeline_errors (run_id);

ALTER TABLE public.news_pipeline_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to news pipeline errors"
  ON public.news_pipeline_errors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
