# Runbook: supabase-migration

> Fluxo seguro para criar/aplicar migration em `supabase/migrations/`. Sempre staging primeiro.
> Mudança em migration = **classe D** (Anti-SPEC §6.6 + §6.7).

## §1 Pré-requisitos

- Feature Contract D aprovado em `docs/plans/feature-contracts/F-NNN.md`.
- Cursor-brief com **rollback plan** (`down.sql` para cada `up.sql`).
- Acesso ao Supabase project `xvbpqlojxwbvqizmixrr` (Eduardo).
- Supabase CLI instalado (`npm i -g supabase`) — opcional, mas recomendado.

## §2 Criar nova migration

```bash
cd site-ldc/site-ldc/supabase/migrations
# Nome: YYYYMMDDHHMMSS_<nome_descritivo>.sql + _down.sql
TS=$(date -u +%Y%m%d%H%M%S)
NAME=$1                              # ex: add_blog_post_tags
touch ${TS}_${NAME}.sql ${TS}_${NAME}_down.sql
```

Conteúdo padrão (`up.sql`):
```sql
-- ============================================================================
-- F-NNN — <descrição curta>
-- Cobre: SPEC §RF-XXX, Anti-SPEC §6.6 (alteração de tabela em produção).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.<nome> (
  -- colunas
);
CREATE INDEX IF NOT EXISTS idx_<nome>_<coluna> ON public.<nome>(<coluna>);

-- RLS — definir explicitamente (replicar padrão BlogPost se aplicável)
ALTER TABLE public.<nome> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "<nome>_service_role_all" ON public.<nome>
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

Conteúdo padrão (`down.sql`):
```sql
-- Reverso de YYYYMMDDHHMMSS_<nome>.sql
DROP TABLE IF EXISTS public.<nome>;
```

**Migrations idempotentes obrigatórias** (`IF NOT EXISTS` / `IF EXISTS`).

## §3 Aplicar em staging (Supabase branch)

Opção A — via Supabase MCP (esta sessão tem acesso):
```
mcp__supabase__create_branch  → cria branch isolada
mcp__supabase__apply_migration <branch> <sql>
mcp__supabase__execute_sql <branch> "<query de smoke>"
mcp__supabase__merge_branch  → só após validação
```

Opção B — via Supabase CLI local com Docker:
```bash
supabase start                       # sobe Postgres local
supabase migration up                # aplica todas pendentes
psql postgres://postgres:postgres@localhost:54322/postgres -c '\d public.<nome>'
```

## §4 Smoke test em staging

Após `apply_migration`:

1. Estrutura: `SELECT * FROM information_schema.columns WHERE table_name = '<nome>';`
2. RLS: `SELECT polname, polcmd FROM pg_policies WHERE tablename = '<nome>';` → conferir policies presentes.
3. Insert manual: `INSERT INTO public.<nome> (...) VALUES (...);` como service role → deve passar.
4. Insert anon (se RLS deveria bloquear): repetir com chave anon → deve falhar.
5. Reverso: aplicar `down.sql` e confirmar `DROP TABLE` ok.
6. Re-aplicar `up.sql` → migration deve ser idempotente.

## §5 Aplicar em produção

**Só após** §4 verde + Feature Contract aprovado + cursor-brief lido por Eduardo.

```bash
cd site-ldc/site-ldc
# Push do commit que inclui o arquivo *.sql
git add supabase/migrations/<TS>_<nome>.sql supabase/migrations/<TS>_<nome>_down.sql
git commit -m "feat(F-NNN): migration <nome>"
git push origin master
```

Aplicação real em produção:
- **Caminho recomendado:** via Supabase MCP `apply_migration` ou via Supabase Dashboard → SQL Editor copy/paste do `up.sql`.
- **Caminho CLI:** `supabase db push` (precisa env `SUPABASE_DB_URL` setada com password do project).

Anotar no commit body: SHA do commit + hora UTC da aplicação.

## §6 Verificação pós-prod

```sql
-- Validar via Supabase Studio (Production)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = '<nome>';
-- Policy
SELECT polname FROM pg_policies WHERE tablename = '<nome>';
```

Smoke da feature que depende da migration (rota nova, cron novo) — ver Feature Contract.

## §7 Rollback de migration aplicada

Se algo quebrar pós-deploy:

1. Pausar fluxo dependente (cron, feature flag) — `news-pipeline-cron.md §2`.
2. Aplicar `down.sql` em produção (Supabase Dashboard → SQL Editor).
3. Verificar dependências (FK, views, triggers) que dependem da tabela — pode quebrar se outra tabela referencia.
4. Revert do commit Git (`git revert <SHA>`) + push → Vercel re-publica código sem a migration.
5. Registrar `INCIDENT` em `wiki/log.md` + plano de re-aplicação em `TODO.md §1`.

## §8 Tabelas órfãs (não versionadas) — caso especial

**10 tabelas existem em produção sem migration** (`BlogPost`, `Material`, `Category`, `MaterialCategory`, `BlogPostApprovalToken`, `carousel_runs`, `ebook_leads`, `wealth_planning_clients`/`_scenarios`, `User`, `Client`). Backlog TODO §2 classe C: capturar schema atual em SQL idempotente sem alterar produção. Esse trabalho é "versionar retroativamente", não migration nova.

Receita curta:
```bash
# Em Supabase Studio → Database → Schema → Postgres dump da tabela
pg_dump -h <host> -U postgres -d postgres --schema-only -t public."<TabelaOrfa>" > <TS>_capture_<tabela>.sql
# Editar: adicionar IF NOT EXISTS em CREATE TABLE/INDEX/POLICY
# Salvar em supabase/migrations/
# NÃO aplicar — só commitar para versionar
```

## §9 Antipadrões

- `DROP TABLE` direto em produção sem `down.sql` correspondente.
- Migration sem RLS explícita.
- Migration sem `down.sql`.
- Aplicar em produção antes de staging.
- `git push` antes da migration ser smoke-aprovada.
- Mexer em `news_*`, `BlogPost`, `Material` sem Feature Contract D.

## §10 Referências

- `supabase/migrations/` — 7 migrations atuais.
- Anti-SPEC §6.6 (tabelas intocáveis) + §6.7 (produção = D).
- ADR-005 (pivot pipeline para BlogPost).
