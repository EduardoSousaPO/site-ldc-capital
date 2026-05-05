-- ============================================================================
-- F-008 — Rollback da tabela news_publications
-- ============================================================================

DROP POLICY IF EXISTS "Service role full access to news publications"
  ON public.news_publications;

DROP INDEX IF EXISTS public.idx_news_publications_status_published_at;
DROP INDEX IF EXISTS public.idx_news_publications_published_at;

DROP TABLE IF EXISTS public.news_publications;
