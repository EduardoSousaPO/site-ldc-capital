-- Adiciona rastreio de envio do guia para o cron de backfill
-- guia_sent_at: timestamp do envio bem-sucedido via edge function send-ebook-email
-- guia_message_id: ID retornado pelo Resend para auditoria
ALTER TABLE guia_leads
  ADD COLUMN IF NOT EXISTS guia_sent_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS guia_message_id TEXT NULL;

-- Index parcial: cron lê apenas leads pendentes, sem custo de scan total
CREATE INDEX IF NOT EXISTS idx_guia_leads_pending_send
  ON guia_leads (created_at)
  WHERE guia_sent_at IS NULL;

COMMENT ON COLUMN guia_leads.guia_sent_at IS
  'Timestamp do envio do PDF do guia via send-ebook-email. NULL = ainda nao enviado.';

COMMENT ON COLUMN guia_leads.guia_message_id IS
  'Resend message ID retornado pela edge function. Usado para auditoria/debug.';
