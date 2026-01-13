import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do .env
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  console.log('Criando tabela ebook_leads...');
  
  // Executar SQL usando a função rpc
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ebook_leads (
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
    `
  });

  if (error) {
    console.error('Erro ao criar tabela:', error);
    
    // Tentar criar usando insert direto para testar se a tabela existe
    console.log('Tentando verificar se a tabela existe...');
    const { error: selectError } = await supabase
      .from('ebook_leads')
      .select('id')
      .limit(1);
    
    if (selectError?.code === '42P01') {
      console.log('Tabela não existe. Por favor, execute o SQL manualmente no Supabase Dashboard.');
      console.log('SQL disponível em: scripts/ebook-leads-schema.sql');
    } else if (!selectError) {
      console.log('✅ Tabela ebook_leads já existe!');
    } else {
      console.error('Erro ao verificar tabela:', selectError);
    }
  } else {
    console.log('✅ Tabela criada com sucesso!');
  }
}

createTable();
