-- ============================================================================
-- F-008 — Índice parcial para lock distribuído de pipeline runs
-- Cobre: SPEC §CB-006 (race condition entre instâncias concorrentes do cron),
--        Feature Contract F-008 Parte 3.
-- ============================================================================
--
-- Justificativa do índice parcial:
--   A query de aquisição de lock filtra apenas linhas em status='running' nos
--   últimos 5 minutos. Um índice parcial reduz drasticamente o tamanho e o
--   custo de escrita: apenas linhas em status='running' entram no índice; ao
--   transicionar para 'success' ou 'failed' (no finishPipelineRun), a linha
--   sai automaticamente. Em regime estacionário, o índice tem 0 ou 1 entrada.
--
-- Query alvo (orchestrator.acquireLockOrAbort):
--   SELECT id FROM public.news_pipeline_runs
--   WHERE status = 'running'
--     AND triggered_at > NOW() - INTERVAL '5 minutes'
--   LIMIT 1;
--
-- IMPORTANTE: o orchestrator garante que o status seja sempre atualizado para
-- 'success' ou 'failed' no finally do runPipeline. Linhas em 'running' fora
-- da janela de 5 min são consideradas "stale" (instância derrubada) e não
-- bloqueiam novas execuções.

CREATE INDEX IF NOT EXISTS idx_news_pipeline_runs_status_recent
  ON public.news_pipeline_runs (status, triggered_at DESC)
  WHERE status = 'running';
