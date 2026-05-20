-- Add UTM attribution columns to public."Client".
-- Rationale: ver docs/analytics-ga4-utm.md §5. Atribuição de leads vindos do
-- YouTube (e demais campanhas) hoje vive em Client.notes (texto livre). Esta
-- migration cria colunas dedicadas, idempotente (IF NOT EXISTS) para permitir
-- reaplicar sem erro. O código continua aceitando NULL — campos opcionais.
-- Compatível com a constraint UNIQUE existente em Client.email (não altera).

ALTER TABLE public."Client"
  ADD COLUMN IF NOT EXISTS utm_source       text,
  ADD COLUMN IF NOT EXISTS utm_medium       text,
  ADD COLUMN IF NOT EXISTS utm_campaign     text,
  ADD COLUMN IF NOT EXISTS utm_content      text,
  ADD COLUMN IF NOT EXISTS utm_term         text,
  ADD COLUMN IF NOT EXISTS landing_page     text,
  ADD COLUMN IF NOT EXISTS referrer         text,
  ADD COLUMN IF NOT EXISTS utm_captured_at  timestamptz;

-- Indices parciais — só para linhas com UTM preenchido. Suportam segmentação
-- por campanha (caso de uso primário) sem custo em linhas legadas.
CREATE INDEX IF NOT EXISTS client_utm_campaign_idx
  ON public."Client" (utm_campaign)
  WHERE utm_campaign IS NOT NULL;

CREATE INDEX IF NOT EXISTS client_utm_source_idx
  ON public."Client" (utm_source)
  WHERE utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS client_utm_content_idx
  ON public."Client" (utm_content)
  WHERE utm_content IS NOT NULL;

COMMENT ON COLUMN public."Client".utm_source IS
  'Atribuição last-click capturada no /diagnostico-gratuito (youtube, google, instagram, …).';
COMMENT ON COLUMN public."Client".utm_campaign IS
  'Slug oficial: renda-fixa-credito, etfs-portfolio, holding-patrimonial, geopolitica-global, politica-macro-br, commodities-ativos. Ver docs/analytics-ga4-utm.md.';
COMMENT ON COLUMN public."Client".utm_content IS
  'YouTube videoId quando utm_source=youtube.';
COMMENT ON COLUMN public."Client".utm_captured_at IS
  'Momento da captura UTM no client (pode anteceder createdAt se o lead voltar do storage).';
