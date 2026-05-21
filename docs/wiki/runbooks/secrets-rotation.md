# Runbook: secrets-rotation

> Rotacionar credenciais expostas ou periódicas. Cobre **BUG-001** (Google service account no histórico Git) e **BUG-003** (`ADMIN_SYNC_PASSWORD` default `LdcBlog2026`) em detalhe.
> Toda rotação = **classe C ou D** (auth + dados sensíveis).

## §1 Princípios

1. **Rotacionar antes de remover do código** — gerar nova credencial, ativar em produção, depois revogar a antiga.
2. **Janela curta de coexistência** — duas chaves válidas o mínimo possível (idealmente < 1 hora).
3. **Auditoria** — registrar em `wiki/log.md` tipo `INCIDENT` (se em resposta a vazamento) ou `RELEASE` (se rotação preventiva): data, env afetado, SHA do deploy.
4. **Nunca commitar nova credencial** — sempre via Vercel UI.

## §2 BUG-001 — Google service account (`ldc-project-*.json`)

**Contexto:** o arquivo `ldc-project-476717-b9cd681b3bfa.json` foi commitado antes da entrada do pattern `ldc-project-*.json` em `.gitignore:37`. Permanece no histórico Git, mesmo com `git rm --cached`. Já está em `.gitignore` (não é re-comitado).

### 2.1 Rotação no Google Cloud Console (sem reescrever histórico)

1. https://console.cloud.google.com → Project `ldc-project-476717` → IAM & Admin → Service Accounts.
2. Localizar a service account exposta (`<nome>@ldc-project-476717.iam.gserviceaccount.com`).
3. **Keys** → "Add Key" → "Create new key" → tipo JSON → download.
4. **Não commitar** o JSON novo. Salvar em local seguro (1Password, gestor de segredo).
5. Extrair `client_email` e `private_key` do JSON novo.
6. Vercel → Project `site-ldc` → Settings → Environment Variables (Production):
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` → atualizar.
   - `GOOGLE_PRIVATE_KEY` → atualizar (escapar `\n` como `\\n` na UI Vercel).
7. Redeploy do último build (Vercel UI) — 30s.
8. Smoke: submeter form de lead em `/contato` e validar linha em Google Sheets.
9. Voltar ao Console → desabilitar (não deletar) a key antiga. **Manter desabilitada por 7 dias** para auditoria.
10. Após 7 dias sem incidente → deletar key antiga.

### 2.2 Decidir sobre reescrita do histórico (opcional)

Reescrever histórico Git remove a credencial vazada, mas:
- Quebra todos os clones (force push obrigatório no `main`/`master`).
- Submódulo Git complica (wrapper aponta para SHAs antigos).
- Vercel revalida builds antigos perdidos.

Receita (somente se Eduardo aprovar explicitamente — risco alto):
```bash
# Backup completo do repo antes
git clone --mirror <url> backup-pre-filter.git

# Usar git-filter-repo (não BFG, mais simples)
pip install git-filter-repo
cd site-ldc/site-ldc
git filter-repo --path ldc-project-476717-b9cd681b3bfa.json --invert-paths

# Force push (BLOQUEADO sem aprovação explícita Eduardo)
git push --force origin master   # NÃO RODAR sem confirmação
```

**Recomendação:** rotação no Console (§2.1) basta para fechar o vetor de ataque. Reescrita de histórico é opcional. Decisão fica em `TODO.md §5 BUG-001`.

## §3 BUG-003 — `ADMIN_SYNC_PASSWORD` default `LdcBlog2026`

**Contexto:** `/api/admin/add-users/route.ts:11` usa `ADMIN_SYNC_PASSWORD` env ou cai em `"LdcBlog2026"` hardcoded. Combinado com a rota sem auth (BUG-003), qualquer requisição cria 3 admins fixos.

### 3.1 Rotação imediata da senha de seed

1. Gerar nova senha forte:
   ```bash
   openssl rand -base64 32
   ```
2. Vercel → Production env vars: `ADMIN_SYNC_PASSWORD` → atualizar com valor novo.
3. Redeploy.
4. Forçar reset de senha dos 3 admins existentes (Eduardo, Marcos, Luciano) via Supabase Dashboard → Auth → Users → "Reset password".
5. Notificar Marcos e Luciano por canal seguro com nova senha temporária ou magic link.

### 3.2 Remediação definitiva (depende do fix de BUG-003)

1. Adicionar `checkAdminAuth` em `/api/admin/add-users/route.ts` OU mover lógica inteira para `scripts/sync-admin-users.ts` (já existe).
2. Após fix: a rota não cria admins anon → senha default deixa de ser vetor crítico.

## §4 `CRON_SECRET`

Rotação preventiva a cada 6 meses ou após qualquer suspeita de vazamento.

1. Gerar: `openssl rand -hex 32`.
2. Vercel Production env: `CRON_SECRET` → novo valor.
3. Redeploy.
4. Smoke: aguardar próximo cron Vercel (`/api/news/cron`) — deve responder 200 (`CRON_SECRET` em uso pela Vercel é sincronizado automaticamente para os crons configurados em `vercel.json`).
5. Validar manual:
   ```bash
   curl -sX POST https://ldccapital.com.br/api/news/cron \
     -H "Authorization: Bearer <novo_CRON_SECRET>" | head -c 100
   ```

## §5 Chaves IA (`OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_GEMINI_API_KEY`)

Rotação trimestral ou após incidente.

1. Console do provedor (platform.openai.com / api.perplexity.ai / aistudio.google.com).
2. Criar nova key, manter antiga ativa.
3. Vercel Production env → atualizar a env correspondente.
4. Redeploy.
5. Smoke manual do pipeline (`news-pipeline-cron.md §4`).
6. Revogar key antiga no console.

## §6 `SUPABASE_SERVICE_ROLE_KEY`

**Procedimento delicado** — service role bypassa RLS. Coordenar com Eduardo.

1. Supabase Dashboard → Project Settings → API → "Roll API keys" → service_role.
2. Vercel Production env → `SUPABASE_SERVICE_ROLE_KEY` → novo valor.
3. Redeploy.
4. Smoke: admin login + listar BlogPost via `/api/admin/posts` (precisa service role).
5. Sem janela de coexistência possível — Supabase invalida a antiga imediatamente. Aceitar janela de ~30s de erro 500 durante redeploy.

## §7 `RESEND_API_KEY` + SMTP fallback

1. resend.com → API Keys → criar nova → revogar antiga após smoke.
2. Vercel Production env → `RESEND_API_KEY` → novo valor.
3. Redeploy + smoke (submeter `/contato` e validar email recebido).
4. SMTP: rotacionar `SMTP_PASS` se senha de app comprometida (`smtp.gmail.com` → conta → senhas de app).

## §8 Pós-rotação obrigatório

- Linha em `docs/wiki/log.md` tipo `RELEASE` (rotação preventiva) ou `INCIDENT` (resposta a vazamento) — data, env, SHA de redeploy.
- Atualizar `TODO.md §5 BUG-NNN` se a rotação fechou um bug.
- Conferir `.gitignore` ainda contém patterns dos arquivos de credencial.
