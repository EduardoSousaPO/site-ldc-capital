# Runbook: deploy-vercel

> Receita para subir mudanças para `https://ldccapital.com.br` (produção) ou para preview.
> Quando algo dá errado: ver `rollback-vercel.md`.

## §1 Pré-requisitos

- Permissão de admin no projeto Vercel `ldccapital`.
- Branch `master` (submódulo) ou `main` (remoto) atualizada — `git pull` antes.
- CI N1 verde (lint + typecheck + test) — ver `.github/workflows/ci.yml`.

## §2 Deploy de produção via Git (caminho default)

1. No submódulo:
   ```bash
   cd site-ldc/site-ldc
   git status                       # working tree limpo
   git pull --rebase origin master
   ```
2. Confirmar CI N1 local:
   ```bash
   npm run lint && npm run typecheck && npm test
   ```
3. Push:
   ```bash
   git push origin master           # branch local
   ```
4. Atualizar ponteiro do submódulo no wrapper (se necessário):
   ```bash
   cd ..
   git add site-ldc
   git commit -m "chore: bump site-ldc submodule"
   git push
   ```
5. Vercel detecta push, dispara build automático. Acompanhar em https://vercel.com/ldccapital/site-ldc/deployments.

## §3 Deploy manual via CLI (somente se Git falhar)

```bash
cd site-ldc/site-ldc
npx vercel --prod                  # confirma se quer prod
```

Login: `npx vercel login` (uma vez por sessão).

## §4 Env vars obrigatórias (Production)

Set no painel Vercel → Project → Settings → Environment Variables (escopo `Production`):

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=ldc-assets`.
- IA: `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_GEMINI_API_KEY`.
- Cron: `CRON_SECRET`, `NEWS_PIPELINE_ENABLED` (geralmente `false` até smoke).
- F-018: `NEWS_APPROVAL_RECIPIENT_EMAIL`, `NEWS_APPROVAL_CC_EMAILS`.
- Email: `RESEND_API_KEY`, `EBOOK_FROM_EMAIL`, `EBOOK_FROM_NAME`, `CONTATO_EMAIL`, SMTP fallback (`SMTP_HOST/PORT/USER/PASS`).
- Sheets: `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (BUG-001 — rotacionar antes de deploy se mudou).
- Site: `NEXT_PUBLIC_SITE_URL=https://ldccapital.com.br`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_WHATSAPP_LDC`.
- Wealth flags: `NEXT_PUBLIC_WEALTH_PLANNING_V2`, `NEXT_PUBLIC_WP_*`.
- Telemetria: `NEWS_IP_HASH_SALT` (opcional).
- Admin seed: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_SYNC_PASSWORD` (BUG-003 — rotacionar do default `LdcBlog2026`).

Lista canônica: `.env.example` (após limpeza Prisma/NextAuth — backlog TODO §2).

## §5 Preview deployments (branches e PRs)

- Branches `feat/*` ou PRs criam preview automático.
- URL: `https://site-ldc-<hash>-ldccapital.vercel.app`.
- Env scope: copia `Preview` (não `Production`). Configurar separadamente se necessário (chaves IA preview separadas, `NEXT_PUBLIC_SITE_URL` apontando para preview).

## §6 Verificação pós-deploy (smoke obrigatório)

Após Vercel marcar deploy `Ready`:

1. Home: `curl -sI https://ldccapital.com.br/ | head -1` → `200 OK`.
2. Blog: `curl -sI https://ldccapital.com.br/blog | head -1` → `200`.
3. Sitemap: `curl -sI https://ldccapital.com.br/sitemap.xml | head -1` → `200`.
4. API pública: `curl -sI https://ldccapital.com.br/api/blog/posts | head -1` → `200`.
5. Painel admin (esperado redirect ou 401): `curl -sI https://ldccapital.com.br/admin/dashboard | head -1`.
6. `/api/setup-admin` (pós-BUG-002 fix): `curl -sI -X POST https://ldccapital.com.br/api/setup-admin | head -1` → `404`.
7. Cron de produção continua agendado: `vercel.json` schedules ainda registrados (Vercel UI → Cron Jobs).

Em qualquer falha → `rollback-vercel.md`.

## §7 Deploy bloqueado por CI vermelho

1. CI N1 falhando = não merge / não deploy.
2. Identifique falha no GitHub Actions: lint / typecheck / test.
3. Corrija localmente, novo commit, novo push. **Não use `--no-verify`** (`AGENTS.md §14`).
4. Se feature urgente e CI flaky, ver `/fast-fix` com escalation para Standard se tocar produção.

## §8 Cron Vercel novo ou mudado

Mudar `vercel.json` = **classe D** (Anti-SPEC §6.6). Exige Feature Contract + rollback plan + smoke. Ver `news-pipeline-cron.md`.

## §9 Domínio custom e DNS

Domínio principal `ldccapital.com.br` configurado em Vercel → Project → Domains. Mudança aqui = classe D, requer staging primeiro. Não documentado em detalhe — pedir a Eduardo se necessário.
