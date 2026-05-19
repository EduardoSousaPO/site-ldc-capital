CREATE TABLE IF NOT EXISTS guia_leads (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           TEXT        NOT NULL,
  whatsapp       TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  patrimonio_range TEXT      NOT NULL CHECK (patrimonio_range IN ('menos_100k','100k_300k','300k_500k','acima_500k')),
  qualificado    BOOLEAN     NOT NULL DEFAULT false,
  origem         TEXT        NOT NULL DEFAULT 'landing-guia',
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guia_leads_qualificado  ON guia_leads(qualificado);
CREATE INDEX IF NOT EXISTS idx_guia_leads_created_at   ON guia_leads(created_at DESC);
