# Feature Contract — F-008 Vercel Cron + commit GitHub para publicação

> Contrato operacional. Classe **D** — afeta produção real (commits no `main`, dispara rebuild Vercel, conteúdo vai público).

---

## Identificação

- **ID:** F-008
- **Nome:** Vercel Cron + commit GitHub para publicação
- **Risco:** **D**
- **Cobre:** RF-003 (parte cron), RF-010 (commit), CA-006, CA-007, CA-019, CA-021, CA-022, CB-005, CB-006
- **Branch:** `feat/news-cron-publish`
- **Data:** 2026-04-27

---

## Objetivo

Implementar (a) o endpoint `/api/news/cron` que recebe os disparos do Vercel Cron 2x/dia e delega para o pipeline F-007, e (b) a função de commit GitHub que persiste briefings aprovados como MDX em `content/news/` no repo, disparando rebuild ISR do Vercel. Inclui lock distribuído, retry, idempotência e rollback explícito.

---

## Definition of Ready (DoR)

- [x] RFs e CAs claros na SPEC §RF-010, §CA-021, §CA-022
- [x] ADR-002 documenta a estratégia MDX + GitHub API
- [x] Schema `CommitRequest`, `CommitResponse` em contracts
- [x] Padrão `BriefingFrontmatter` reaproveitado em `CommitRequest.frontmatter`
- [x] F-007 é dependência (esta feature consome `runPipeline()` do F-007)
- [ ] **Bloqueio até resolver:** F-007 e F-006 mergeados antes desta feature (a função de commit é chamada pelo admin de F-006 quando aprova; o cron é chamado pelo Vercel mas delega a F-007)
- [ ] PAT GitHub criado pelo Eduardo com escopo `repo` no repo `site-ldc/site-ldc` (pré-requisito de produção)
- [ ] Branch `main` configurada com proteção que permite commits do bot (autor `LDC News Bot <bot@ldccapital.com.br>`)

---

## Critérios de aceite

- **CA-006:** Vercel Cron `0 10 * * *` e `0 17 * * *` (UTC = 07h e 14h BRT) chamam `POST /api/news/cron` com header `Authorization: Bearer ${CRON_SECRET}`.
- **CA-007:** Pipeline disparado pelo cron NÃO publica direto — só cria drafts (esse comportamento vem do F-007, mas validado aqui na integração).
- **CA-019:** Após Eduardo aprovar um briefing em `/admin/news`, o commit acontece em <5s e a página `/news/[slug]` retorna HTTP 200 em <60s (rebuild ISR).
- **CA-021:** Frontmatter MDX inclui todos os campos obrigatórios validados por Zod `BriefingFrontmatter`.
- **CA-022:** Commit GitHub é assinado como `LDC News Bot <bot@ldccapital.com.br>`, autor + commit message + SHA registrados em Supabase.
- **CB-005:** Falha do commit (rate limit, conflito) faz retry 2x com backoff (5s, 30s); persistente vira `pending_publish`.
- **CB-006:** Lock distribuído impede 2 instâncias do cron rodarem simultaneamente.

---

## Escopo incluído

- `src/app/api/news/cron/route.ts` — handler do cron:
  - Valida `Authorization: Bearer ${CRON_SECRET}` (timing-safe compare)
  - Detecta turno (manhã = hora UTC <12, tarde >=12) — para passar `trigger_type` correto ao F-007
  - Chama `runPipeline()` do F-007
  - Retorna `GenerationResult` ao Vercel (ele loga sucesso/erro em Vercel Logs)
- `src/features/news/persistence/github-commit.ts`:
  - Cliente Octokit com `auth: process.env.GITHUB_PAT`
  - Função `commitBriefing(req: CommitRequest): Promise<CommitResponse>`:
    - Renderiza MDX (`gray-matter` para frontmatter + body markdown)
    - Move arquivo de `content/news/_drafts/{filename}` para `content/news/{filename}` (delete + create no mesmo commit)
    - Mensagem: `news: publish {slug}` ou `news: archive {slug}` ou `news: edit {slug}`
    - Autor: `LDC News Bot <bot@ldccapital.com.br>`
    - Retry com backoff em caso de 409 (conflito) ou 403 (rate limit secundário)
- `src/features/news/persistence/release-lock.ts` — lock via Supabase:
  - `acquireLock(jobId): Promise<boolean>` — INSERT em `news_pipeline_runs` com status='running'; se conflito de PK em janela de 90s, retorna false
  - `releaseLock(runId)` — UPDATE status='success'|'failed'
- Hook em F-006 (`/api/admin/news/[slug]` POST com action='approve_publish') que chama `commitBriefing()` após validação.
- Telemetria: registro de `published` event, e SHA do commit em `news_pipeline_runs`.

---

## Escopo excluído

- **NÃO bot Telegram** — F-012 tem hook após este commit.
- **NÃO sitemap regeneration manual** — Vercel ISR cobre via revalidate de `/sitemap.xml` em F-011.
- **NÃO commit em branches além de `main`** — sem suporte a staging via branch separado (staging é Vercel Preview que pode ler do mesmo `main`).

---

## Arquivos

### Arquivos que podem ser alterados

- `src/app/api/news/cron/route.ts` (novo)
- `src/features/news/persistence/**/*` (todos novos)
- `src/features/news/persistence/__tests__/*.test.ts`

### Arquivos que NÃO podem ser alterados sem pausa

- `docs/news/SPEC.md`, `docs/news/CONTRACTS.md`, ADRs
- `src/features/news/contracts/*` (mudança de contrato reabre FASE 4)
- `src/features/news/pipeline/*` (vem de F-007, esta feature CONSOME)
- `src/features/news/compliance/*` (vem de F-005)
- `vercel.json` (configurado em F-001)
- `next.config.ts`
- `content/news/**/*` em modo dev — produção SIM, esta feature gerencia

---

## Contratos

- [x] Contratos prontos: `CommitRequest`, `CommitResponse` em `src/features/news/contracts/persistence.ts`; `PipelineRun` em `pipeline.ts`.
- [ ] **NÃO criar contrato novo.**
- [x] CONTRACTS.md atualizado.

---

## Testes obrigatórios (Classe D — N3)

| Teste | Tipo | Cobre CA | Arquivo |
|---|---|---|---|
| Cron sem CRON_SECRET retorna 401 | integration | CA-006, RNF-007 | `__tests__/cron.test.ts` |
| Cron com CRON_SECRET válido invoca pipeline | integration (mock pipeline) | CA-006 | idem |
| Commit cria arquivo em content/news/ | integration (mock Octokit) | CA-022 | `__tests__/github-commit.test.ts` |
| Commit com message correto + autor bot | integration | CA-022 | idem |
| Frontmatter inclui todos campos obrigatórios | integration | CA-021 | idem |
| Retry 409 conflito 2x com backoff | integration | CB-005 | idem |
| Retry esgota → status pending_publish | integration | CB-005 | idem |
| Lock acquire em INSERT concorrente | integration (Postgres test container) | CB-006 | `__tests__/release-lock.test.ts` |
| **e2e (manual) Vercel Preview:** aprovar briefing real → commit aparece no GitHub → /news/[slug] resolve em <60s | e2e manual evidenciado | CA-019 | log + screenshot do commit |
| **smoke pós-deploy:** primeira aprovação em produção tem rollback testado | manual | rollback | log |
| **negativo:** PAT inválido retorna 401 do GitHub | integration (mock) | RNF-007 | `__tests__/github-commit.test.ts` |
| **negativo:** content_mdx <100 chars rejeitado por Zod | unit | contracts | idem |
| **edge:** 2 commits paralelos do mesmo slug — segundo detecta conflito e renomeia para `-2` | integration | CB-007 | idem |

---

## Comandos obrigatórios (CI N3)

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:integration` (com Octokit mock + Supabase test container)
- `npm run test:e2e` (manual em Vercel Preview, evidenciado em log)
- `npm run build`
- **Smoke obrigatório pós-deploy:** Eduardo aprova primeiro briefing em produção; verifica:
  - Commit aparece em github.com/.../commits
  - `/news/[slug]` retorna 200 em <60s
  - `news_pipeline_runs` tem registro com status='success' + commit_sha
  - Telemetria registrou evento `published`

---

## Infra / Produção

- **Migration necessária?** Não — usa tabelas criadas em F-009 (`news_pipeline_runs`).
- **Migration destrutiva?** Não.
- **Cursor Agent via MCP?** Não.
- **Env vars novas (a partir de F-001):**
  - `GITHUB_PAT` (obrigatório, escopo `repo`)
  - `CRON_SECRET` (obrigatório)
  - `GITHUB_REPO_OWNER` (default `EduardoSousaPO` ou similar)
  - `GITHUB_REPO_NAME` (default `site-ldc`)
  - `GITHUB_BRANCH` (default `main`)
- **Staging obrigatório?** **Sim** — Vercel Preview com `GITHUB_BRANCH=staging-test` (branch separada usada apenas para smoke). NUNCA commitar direto em `main` antes do smoke test.
- **Feature flag?** Sim — `NEWS_PUBLISHING_ENABLED=true`. Se false, o admin pode aprovar mas o commit não acontece (apenas log "publishing disabled"). Permite ligar o admin antes de ligar a publicação real.
- **Rollback plan (≤5 linhas):**
  1. Setar `NEWS_PUBLISHING_ENABLED=false` em produção — desliga commits sem revert do código.
  2. Se já há briefings publicados que precisam ser despublicados: usar `/admin/news` action `archive` (cria commit que move para `_archived/`).
  3. Em caso extremo (erro grave em produção): `git revert <SHA do publish>` direto no GitHub web; Vercel rebuild remove a página em <60s.
  4. Rotacionar `GITHUB_PAT` se houver suspeita de comprometimento.
  5. Comunicar Eduardo + auditar `news_pipeline_runs` da janela afetada.

---

## Evidência esperada (Matriz de Validação)

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-006 | `cron.test.ts::valid_secret_invokes_pipeline` | integration | — | — |
| CA-019 | smoke Vercel Preview manual | e2e manual | — | screenshot do commit + log de tempo |
| CA-021 | `github-commit.test.ts::frontmatter_complete` | integration | — | — |
| CA-022 | `github-commit.test.ts::author_message` | integration | — | — |
| CB-005 | `github-commit.test.ts::retry_on_conflict` | integration | — | — |
| CB-006 | `release-lock.test.ts::concurrent_lock` | integration | — | — |
| Rollback | rollback manual em Vercel Preview | manual | — | log |

---

## Anti-SPEC — checagem específica para F-008

- [ ] §6.1 — commit NÃO acontece sem aprovação manual (verificado por integração com F-006).
- [ ] §6.3 — drafts em `content/news/_drafts/` ficam em pasta ignorada pelo build de produção (validar com Next.js config).
- [ ] §6.3 — sem polling para detectar publicação. Hook é explícito do action `approve_publish`.
- [ ] §6.2 — commit message NÃO inclui PII de leitor; só slug + ação.

---

## Gate de autonomia

Pode prosseguir automaticamente enquanto:
- Arquivos alterados na lista permitida.
- `NEWS_PUBLISHING_ENABLED=false` (sem efeito real em produção).
- Mock Octokit em testes.

**Pausa obrigatória antes de:**
- Ligar `NEWS_PUBLISHING_ENABLED=true` (decisão Eduardo + smoke test obrigatório).
- Trocar branch de destino (`GITHUB_BRANCH`).
- Alterar autor do bot ou formato da commit message.
- Adicionar permissões ao PAT.

---

## Resultado final

- **Status:** em planejamento
- **PR:** —
- **SHA:** —
- **Data de merge:** —
- **Evidência consolidada:** —

---

*Falha aqui significa briefings aprovados que nunca aparecem público (silenciosa) ou commits errados no `main` (visível e desconfortável). Lock distribuído + idempotência + rollback são não-negociáveis.*
