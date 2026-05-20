-- Rollback de 20260520120000_client_utm_columns.sql.
-- Remove índices parciais e colunas UTM. Idempotente.

DROP INDEX IF EXISTS public.client_utm_content_idx;
DROP INDEX IF EXISTS public.client_utm_source_idx;
DROP INDEX IF EXISTS public.client_utm_campaign_idx;

ALTER TABLE public."Client"
  DROP COLUMN IF EXISTS utm_captured_at,
  DROP COLUMN IF EXISTS referrer,
  DROP COLUMN IF EXISTS landing_page,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_source;
