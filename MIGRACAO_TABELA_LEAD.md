# ✅ Migração: Tabela Lead no Supabase

## 🎯 Problema Resolvido

O formulário de leads estava tentando salvar em arquivo JSON (`leads.json`), o que não funciona em produção (Vercel) porque o sistema de arquivos é somente leitura. Agora os leads são salvos diretamente no Supabase.

## ✅ Solução Implementada

1. **Criada tabela `Lead` no Supabase** - Armazena todos os leads do formulário
2. **Integração Supabase** - Leads são salvos automaticamente no banco de dados
3. **Google Sheets como backup** - Continua funcionando se configurado
4. **Sistema robusto** - Se Supabase funcionar, o lead é salvo (mesmo se Google Sheets falhar)

## 📋 Estrutura da Tabela Lead

```sql
CREATE TABLE "Lead" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  patrimonio text,
  origem text,
  origemFormulario text NOT NULL DEFAULT 'Home',
  ip text,
  userAgent text,
  status text NOT NULL DEFAULT 'Novo',
  observacoes text,
  createdAt timestamptz NOT NULL DEFAULT now(),
  updatedAt timestamptz NOT NULL DEFAULT now()
);
```

## 🔧 Como Aplicar a Migração

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o seguinte SQL:

```sql
-- Criar tabela Lead
CREATE TABLE IF NOT EXISTS public."Lead" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  patrimonio text,
  origem text,
  origemFormulario text NOT NULL DEFAULT 'Home',
  ip text,
  userAgent text,
  status text NOT NULL DEFAULT 'Novo',
  observacoes text,
  createdAt timestamptz NOT NULL DEFAULT now(),
  updatedAt timestamptz NOT NULL DEFAULT now()
);

-- Criar trigger para updatedAt
CREATE TRIGGER handle_lead_updated_at
  BEFORE UPDATE ON public."Lead"
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updatedAt);

-- Criar índices
CREATE INDEX IF NOT EXISTS lead_email_idx ON public."Lead"(email);
CREATE INDEX IF NOT EXISTS lead_status_idx ON public."Lead"(status);
CREATE INDEX IF NOT EXISTS lead_created_at_idx ON public."Lead"(createdAt);

-- Habilitar RLS
ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;

-- Política: Permitir inserção pública (para formulários)
CREATE POLICY "lead_public_insert"
  ON public."Lead"
  FOR INSERT
  WITH CHECK (true);

-- Política: Apenas admins/editores podem ler e atualizar
CREATE POLICY "lead_admin_editor_all"
  ON public."Lead"
  FOR ALL
  USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') IN ('ADMIN', 'EDITOR'), false)
  )
  WITH CHECK (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') IN ('ADMIN', 'EDITOR'), false)
  );
```

5. Clique em **Run** para executar

### Opção 2: Via Supabase CLI

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

Ou execute o arquivo SQL diretamente:

```bash
supabase db remote commit --file scripts/supabase-schema.sql
```

## ✅ Verificação

Após aplicar a migração, você pode verificar se a tabela foi criada:

1. No Supabase Dashboard, vá em **Table Editor**
2. Você deve ver a tabela `Lead` listada
3. Teste o formulário no site - o lead deve aparecer na tabela

## 🔄 Fluxo de Funcionamento

1. **Usuário preenche o formulário** → Dados são validados
2. **Salva no Supabase** → Método principal (sempre tenta)
3. **Salva no Google Sheets** → Backup (se configurado)
4. **Envia emails** → Notificação e confirmação (se configurado)
5. **Retorna sucesso** → Se Supabase funcionou (mesmo se Google Sheets falhar)

## 📊 Acessar Leads

Os leads salvos podem ser acessados:

1. **Via Supabase Dashboard** → Table Editor → Lead
2. **Via Google Sheets** → Se configurado
3. **Via API Admin** → Futuramente pode ser criada uma interface admin

## ⚠️ Importante

- A tabela `Lead` precisa ser criada antes de fazer deploy
- Se a tabela não existir, o formulário retornará erro 500
- Verifique se as variáveis de ambiente do Supabase estão configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 🎉 Benefícios

✅ **Funciona em produção** - Não depende de sistema de arquivos
✅ **Sempre salva** - Supabase é o método principal
✅ **Backup automático** - Google Sheets continua funcionando
✅ **Seguro** - RLS configurado corretamente
✅ **Rastreável** - IP e User Agent salvos para análise

