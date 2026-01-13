// Script para criar tabela via Supabase REST API
const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extrair o host do URL
const host = new URL(supabaseUrl).host;

const sql = `
CREATE TABLE IF NOT EXISTS public.ebook_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  valor_investimento VARCHAR(50) NOT NULL,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  landing_page VARCHAR(100) DEFAULT 'ebook-investimentos-internacionais',
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(30) DEFAULT 'pending_whatsapp',
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  whatsapp_sent_at TIMESTAMPTZ,
  whatsapp_confirmed_at TIMESTAMPTZ,
  CONSTRAINT ebook_leads_email_landing_unique UNIQUE (email, landing_page)
);

-- Habilitar RLS
ALTER TABLE public.ebook_leads ENABLE ROW LEVEL SECURITY;

-- Policy para inserção pública
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ebook_leads' AND policyname = 'Permitir inserção de leads'
  ) THEN
    CREATE POLICY "Permitir inserção de leads" ON public.ebook_leads
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Policy para leitura autenticada
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ebook_leads' AND policyname = 'Admins podem ler leads'
  ) THEN
    CREATE POLICY "Admins podem ler leads" ON public.ebook_leads
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
`;

const options = {
  hostname: host,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  }
};

console.log('Tentando criar tabela via REST API...');
console.log('Host:', host);

// A API REST do Supabase não suporta exec_sql diretamente
// Vamos tentar inserir um registro para ver se a tabela existe

const testOptions = {
  hostname: host,
  port: 443,
  path: '/rest/v1/ebook_leads?select=id&limit=1',
  method: 'GET',
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  }
};

const req = https.request(testOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Tabela ebook_leads existe!');
    } else if (res.statusCode === 404 || data.includes('does not exist')) {
      console.log('❌ Tabela não existe.');
      console.log('\n📋 Por favor, execute o seguinte SQL no Supabase Dashboard:');
      console.log('   1. Acesse: https://supabase.com/dashboard');
      console.log('   2. Vá em: SQL Editor');
      console.log('   3. Cole o conteúdo de: scripts/ebook-leads-schema.sql');
      console.log('   4. Execute o SQL');
    }
  });
});

req.on('error', (e) => {
  console.error('Erro:', e.message);
});

req.end();
