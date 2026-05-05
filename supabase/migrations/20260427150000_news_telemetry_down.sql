-- ============================================================================
-- Rollback de F-009 — Telemetria /news
-- Ordem inversa do up: errors (FK) → runs → events.
-- CASCADE removeria policies/indexes implicitamente.
-- ============================================================================

DROP TABLE IF EXISTS public.news_pipeline_errors CASCADE;
DROP TABLE IF EXISTS public.news_pipeline_runs CASCADE;
DROP TABLE IF EXISTS public.news_events CASCADE;
