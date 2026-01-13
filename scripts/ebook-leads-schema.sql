-- =====================================================
-- TABELA: ebook_leads
-- Landing page de e-book de investimentos internacionais
-- =====================================================

-- Criar tabela de leads
CREATE TABLE IF NOT EXISTS ebook_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Dados do lead
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  valor_investimento VARCHAR(50) NOT NULL,
  
  -- Tracking UTM
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  
  -- Origem
  landing_page VARCHAR(100) DEFAULT 'ebook-investimentos-internacionais',
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Status (fluxo WhatsApp)
  status VARCHAR(30) DEFAULT 'pending_whatsapp',
  -- Status possíveis:
  -- 'pending_whatsapp' = Formulário preenchido, aguardando envio no WhatsApp
  -- 'whatsapp_initiated' = Lead enviou mensagem no WhatsApp
  -- 'email_confirmed' = IA confirmou o e-mail
  -- 'ebook_sent' = E-book enviado por e-mail
  -- 'qualifying' = Em processo de qualificação pela IA
  -- 'qualified' = Lead qualificado
  -- 'not_qualified' = Lead não qualificado
  -- 'converted' = Virou cliente
  
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  
  -- WhatsApp tracking
  whatsapp_sent_at TIMESTAMPTZ,
  whatsapp_confirmed_at TIMESTAMPTZ,
  
  -- Constraint de unicidade
  CONSTRAINT ebook_leads_email_landing_unique UNIQUE (email, landing_page)
);

-- Índices para consultas
CREATE INDEX IF NOT EXISTS idx_ebook_leads_created_at ON ebook_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebook_leads_status ON ebook_leads(status);
CREATE INDEX IF NOT EXISTS idx_ebook_leads_utm_source ON ebook_leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_ebook_leads_valor ON ebook_leads(valor_investimento);
CREATE INDEX IF NOT EXISTS idx_ebook_leads_email ON ebook_leads(email);

-- Habilitar RLS (Row Level Security)
ALTER TABLE ebook_leads ENABLE ROW LEVEL SECURITY;

-- Policy: permitir inserção pública (anônimo pode inserir)
CREATE POLICY "Permitir inserção de leads" ON ebook_leads
  FOR INSERT
  WITH CHECK (true);

-- Policy: leitura apenas para usuários autenticados (admin)
CREATE POLICY "Admins podem ler leads" ON ebook_leads
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: atualização apenas para usuários autenticados (admin)
CREATE POLICY "Admins podem atualizar leads" ON ebook_leads
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Comentário na tabela
COMMENT ON TABLE ebook_leads IS 'Leads capturados na landing page de e-book de investimentos internacionais';
