-- ============================================================================
-- F-008 — Tabela de auditoria de publicações de briefings (commit GitHub)
-- Cobre: SPEC §RF-010 (commit GitHub rastreável), §CA-022 (commit SHA
--        registrado em Supabase), Anti-SPEC §6.2 (auditoria CVM completa).
-- ============================================================================
--
-- Cada briefing publicado tem UMA entrada (PK por slug). A linha registra:
--   - SHA do commit que publicou (criado por publishBriefingGitHub)
--   - Branch alvo (permite distinguir publicações em main vs staging-test
--     durante o smoke test do F-008 sem poluir auditoria de produção)
--   - run_id opcional do pipeline que gerou o draft (FK soft via SET NULL)
--   - status atual: 'published' | 'archived'
--   - Timestamps separados para publicação e arquivamento
--
-- Idempotência: publishBriefingGitHub faz SELECT por (briefing_slug, branch);
-- se já existe, retorna o commit_sha existente sem novo commit no GitHub.
--
-- RLS: replica padrão de F-009 (news_pipeline_runs / news_events) — apenas
-- service_role tem acesso full; nem anon nem authenticated podem ler.

CREATE TABLE IF NOT EXISTS public.news_publications (
  briefing_slug TEXT PRIMARY KEY,
  commit_sha TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'main',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  archived_commit_sha TEXT,
  pipeline_run_id UUID REFERENCES public.news_pipeline_runs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_news_publications_published_at
  ON public.news_publications (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_publications_status_published_at
  ON public.news_publications (status, published_at DESC);

ALTER TABLE public.news_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to news publications"
  ON public.news_publications FOR ALL TO service_role
  USING (true) WITH CHECK (true);
