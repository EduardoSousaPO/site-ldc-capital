# Runbook: rollback-vercel

> Reverter deploy de `https://ldccapital.com.br` quando algo quebra em produção.
> Decisão em < 5 minutos: rollback Vercel UI (rápido) ou revert Git (auditável).

## §1 Quando rollback

- Smoke pós-deploy (§6 do `deploy-vercel.md`) retorna ≠ 200 onde esperado.
- Erro 500 sustentado em rota crítica (`/blog`, `/api/news/cron`, formulários de lead).
- Cliente reporta bug visível.
- Pipeline IA cron grava lixo em `BlogPost` ou em `news_pipeline_runs` em loop.

## §2 Caminho A — Rollback via Vercel UI (mais rápido, ~2 min)

1. Vercel → Project `site-ldc` → Deployments.
2. Localizar o último deploy `Ready` ANTES do quebrado.
3. Menu `...` → **Promote to Production**.
4. Confirmar.
5. Vercel re-publica o build cacheado em segundos.
6. Validar com `curl -sI` (§3 abaixo).

**Vantagem:** sem build, sem espera. **Limitação:** Git history fica fora de sincronia com produção até você criar revert depois.

## §3 Validação pós-rollback

```bash
curl -sI https://ldccapital.com.br/ | head -1                                 # 200
curl -sI https://ldccapital.com.br/blog | head -1                             # 200
curl -sI https://ldccapital.com.br/sitemap.xml | head -1                      # 200
curl -sI https://ldccapital.com.br/api/blog/posts | head -1                   # 200
curl -sI -X POST https://ldccapital.com.br/api/setup-admin | head -1          # 404 (BUG-002)
```

Se algum check falhar, repetir Caminho A para um deploy ainda mais antigo.

## §4 Caminho B — Revert via Git (auditável, ~10 min)

Quando Caminho A está OK mas você quer Git refletindo o estado de produção:

```bash
cd site-ldc/site-ldc
git log --oneline -5                              # identificar SHA quebrado
git revert <SHA-quebrado>                          # revert commit (não force push)
git push origin master
```

Após push, Vercel builda + deploya o revert. Validar com §3 de novo.

**Nunca use** `git reset --hard` + force push em master (Anti-SPEC §6.6 + AGENTS.md §14).

## §5 Caminho C — Cron mal configurado (precisa pausar IMEDIATAMENTE)

Se o problema é cron rodando sozinho e fazendo dano (pipeline IA inserindo lixo em loop, cleanup deletando coisa errada):

1. **Desligar feature flag primeiro** (sem deploy):
   - Vercel → Project → Settings → Environment Variables (Production).
   - `NEWS_PIPELINE_ENABLED=false` (pipeline IA).
   - Save + Redeploy (instantâneo).
2. Depois fazer rollback Caminho A ou B para reverter o commit que introduziu o bug.

Crons já agendados que não dependem de feature flag (`cleanup-*`) precisam ser desabilitados em `vercel.json` (= classe D, exige novo deploy revertido).

## §6 Banco de dados / Storage não reverte com Vercel rollback

Vercel revert volta o código, mas:
- Linhas inseridas em `BlogPost`, `news_pipeline_runs`, `Client`, `Material` etc. **permanecem**.
- Arquivos em Supabase Storage (`ldc-assets`, `bloomberg-pdfs`, `blog-carousels`) **permanecem**.
- Migrations aplicadas (raras — só 7 versionadas) **não revertem**.

Para reverter dados, ver `supabase-migration.md` §rollback ou agir manualmente via Supabase Studio.

## §7 Pós-rollback obrigatório

1. Linha em `docs/wiki/log.md` tipo `INCIDENT` com: hora, sintoma, SHA quebrado, SHA estável, causa raiz (se conhecida).
2. Se bug capaz de voltar → criar runbook dedicado em `docs/wiki/runbooks/bug-<slug>.md`.
3. Item em `TODO.md §5` com classe e plano de correção definitiva.
4. Cron pausado? Anotar em `wiki/log.md` quando religar.

## §8 Quando rollback NÃO é o caminho

- **Bug fix de 1 linha** → `/fast-fix` (Prompt 0) é mais rápido que rollback + re-fix.
- **Migration applied** → não dá rollback Vercel; precisa migration reversa (`supabase/migrations/*_down.sql`).
- **Env var quebrada** → editar env vars no Vercel UI + Redeploy do último build (sem rebuild).

## §9 Permissões necessárias

Acesso `Member` ou superior no projeto Vercel `ldccapital`. Pedir a Eduardo se faltar acesso.
