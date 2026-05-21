# TODO.md — Estado vivo do site-ldc

> Harness v3.2. Última atualização: 2026-05-21.
> O TODO detalhado do pipeline IA foi absorvido neste arquivo em 2026-05-21 (Fase 6b da reorganização). Histórico via `git log --follow -- docs/plans/feature-contracts/F-007-pipeline-ia.md` e seguindo o submódulo. Features F-007/F-008/F-015/F-016/F-016b/F-018/F-019 estão em produção; pendências residuais ficam no §2 Backlog abaixo.

---

## §1 Em andamento

_(vazio — atualizar quando feature B/C/D entrar em execução)_

---

## §2 Backlog

> Itens em backlog **não têm Feature Contract** até serem promovidos para §1. Apenas linha-mãe + classe estimada.

- [ ] **[A] Atualizar link em `src/features/news/pipeline/__tests__/__fixtures__/bloomberg-pdfs/README.md:31`** — `docs/news/decisions/ADR-003-bloomberg-sinal-interno.md` → `docs/decisions/adr/ADR-003-bloomberg-sinal-interno.md`. Fazer na próxima feature B que tocar fixtures (regra "zero edit em `src/` na reorganização").
- [ ] **[A] Roadmap residual do pipeline IA** — pendências do antigo TODO de pipeline foram absorvidas em 2026-05-21. Features F-007/F-008/F-015/F-016/F-016b/F-018/F-019 estão em produção (histórico via `git log --follow -- docs/plans/feature-contracts/F-007-pipeline-ia.md`). Eventuais smoke tests pendentes ou follow-ups específicos devem virar Feature Contract dedicado em `docs/plans/feature-contracts/` quando promovidos.
- [ ] **[A] Limpar `bash.exe.stackdump` da raiz** — lixo de crash de shell (abr/2026). Apagar + garantir pattern `*.stackdump` no `.gitignore`.
- [ ] **[A] Adicionar `.data/` ao `.gitignore`** — diretório SQLite legacy do tempo do Prisma (out/2025). `git rm -r --cached .data/` após confirmar zero leitura em `scripts/*`.
- [ ] **[A] Declarar `runtime = 'nodejs'` explicitamente** nas rotas que usam Playwright (`/api/dividend-tax/report`, `/api/admin/wealth-planning/scenarios/[id]/pdf`).
- [ ] **[A] Adicionar `export const revalidate = 3600` em `src/app/sitemap.ts`** — cache 1h reduz custo Supabase em crawls Google/Bing.
- [ ] **[A] Renomear `/api/pgbl-simulator/pdf` → `/api/pgbl-simulator/report`** — endpoint retorna HTML inline para print-to-PDF, não PDF binário. Nome atual confunde.
- [ ] **[A] Verificar Google Search Console por URLs legacy `/news/*`** pós-pivot ADR-005. Se houver páginas ainda indexadas, garantir 301 ou removal request.
- [ ] **[A] Avaliar dividir/comprimir runbooks que excedem ≤150 linhas** — `admin-panel-uso.md` (285), `seo-visibilidade.md` (440), `google-sheets-setup.md` (175). Possível split por seção (login/posts/materiais/upload; GA4/Pixel/LGPD/Schema). Decisão na próxima sessão de wiki lint.
- [ ] **[B] Limpar `.env.example` removendo legacy Prisma/NextAuth** — `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` são órfãos pré-Supabase. `package.json` não tem `@prisma/client` nem `prisma`. Validar nenhum `scripts/*.ts` ainda lê antes de remover.
- [ ] **[B] Investigar `site-ldc/site-ldc/site-ldc/`** — snapshot legacy de jan/2025 dentro do repo. Arquivar em `docs/_archive/legacy-jan-2025/` ou apagar após confirmar zero referência viva.
- [ ] **[B] Mover `wealth-planning/` (raiz) para `docs/wealth-planning-planning/`** — 4 arquivos `.md` + 1 `.xlsm` são planejamentos operacionais do dono, não código. Criar README explicando origem. Não executar até futura sessão dedicada.
- [ ] **[B] Consolidar Zod em `packages/shared/types/`** — hoje os schemas vivem em `src/features/news/contracts/`, `src/lib/dividend-tax/types.ts`, `src/lib/wealth-planning/validations.ts`, `src/lib/pgbl/calculations.ts`. Mover sob demanda dentro de Feature Contract da próxima feature relevante. Não fazer big-bang.
- [ ] **[B] Ativar testes e2e para fluxos admin** — `/admin/posts`, `/admin/materials`, `/admin/wealth-planning`. Hoje só há testes em `src/lib/dividend-tax/__tests__/`, `src/lib/wealth-planning/__tests__/`, `src/features/news/{pipeline,carousel,compliance,prompts}/__tests__/`.
- [ ] **[B] Auditar `src/middleware.ts`** — lógica de auth/redirect não documentada. Ler e documentar em `docs/wiki/modules/auth-admin.md`.
- [ ] **[B] Avaliar ISR em `/blog/[slug]`** — hoje render dinâmico por request (sem `revalidate`, sem `generateStaticParams`). Adicionar `revalidate: 60` ou tag-based revalidation.
- [ ] **[B] Avaliar migração `content/materiais/` (MDX legacy) para Supabase `Material`** — só se ainda houver `.mdx` ativos lá; descartar se órfão.
- [ ] **[B] Decidir destino de `src/lib/wealth-planning/pdf-generator-enhanced.ts`** — coexiste com v1 e v2 sem caller identificado. Consolidar com v2 ou deletar.
- [ ] **[B] Reescrever/condensar `docs/contracts/contracts-pipeline-ia.md`** — anexo de 462 linhas referencia 5 schemas apagados pós-pivot ADR-005 (`briefing.ts`, `admin.ts`, `persistence.ts`, `digest.ts`, `telegram.ts`). Reduzir para ~150-200 linhas focadas no que existe hoje (`approval.ts`, `carousel.ts`, `compliance.ts`, `openai.ts`, `perplexity.ts`, `pipeline.ts`, `telemetry.ts`).
- [ ] **[C] Versionar 10 schemas Supabase órfãos** — `BlogPost`, `Material`, `Category`, `MaterialCategory`, `BlogPostApprovalToken`, `carousel_runs`, `ebook_leads`, `wealth_planning_clients`/`wealth_planning_scenarios`, **`User`**, **`Client`** foram criados fora de `supabase/migrations/`. Capturar schema atual em SQL idempotente (`CREATE TABLE IF NOT EXISTS`) sem alterar produção. Ver `DECISIONS_LOG.md` (decisão aberta).
- [ ] **[C] Decidir ADR-008 — política de IP em formulários** — `ip_hash` SHA-256 em `news_events` (telemetria de leitor) vs `ip_address` texto em `guia_leads` (consentimento explícito via form). Promover a ADR após confirmação humana.
- [ ] **[C] Auditar uso de `next.config.ts: ignoreDuringBuilds`** — dívida explícita; lint local é obrigatório. Plano de eliminação dentro de Feature Contract dedicado.
- [ ] **[C] Habilitar CI N2** — `.github/workflows/ci.yml` tem N2/N3 comentados como TODO. Promover quando integration tests existirem para fluxos críticos.
- [ ] **[C] Adicionar rate limiting** — endpoints públicos sem proteção (BUG-005 + BUG-006). Padrão por IP+rota; considerar `@vercel/firewall` ou middleware Edge.
- [ ] **[C] Confirmar comportamento de `/wealth-planning` showcase** — `MeetingWizard` público persiste algo no Supabase ou é client-only? Documentar em `wiki/modules/wealth-planning.md`.
- [ ] **[C] Auditar `src/lib/pgbl/calculations.ts`** — ano de tabela IR é hardcoded ou parametrizado? Plano de atualização anual.
- [ ] **[D] Limpar `ldc-project-476717-b9cd681b3bfa.json` do histórico Git** — credencial Google service account commitada antes da entrada do pattern em `.gitignore`. Plano: rotacionar service account no GCP Console + `git rm --cached` + decidir reescrita de histórico. Ver `docs/wiki/runbooks/secrets-rotation.md`.

---

## §3 Concluídas

Histórico em `git log`. Resumo curto de features C/D em `docs/wiki/features/F-NNN.md`. Eventos cronológicos em `docs/wiki/log.md`.

---

## §4 Decisões abertas

_(vazio — registrar aqui dúvidas operacionais sem ADR ainda, com prazo)_

Decisões fechadas → `docs/plans/DECISIONS_LOG.md`. Arquiteturais → `docs/decisions/adr/`.

---

## §5 Bugs

| ID | Descrição | Repro | Classe | Domínio | Urgência | Impacto | Esforço | Modo | Status | Notas |
|---|---|---|---|---|---|---|---|---|---|---|
| BUG-001 | Credencial Google `ldc-project-*.json` commitada no histórico Git antes do pattern em `.gitignore` | `git log --all -- 'site-ldc/ldc-project-*.json'` | D | secrets | P2 | alto | > 2h | production | TRIADO | rotacionar service account + decidir `git filter-repo`; runbook em `docs/wiki/runbooks/secrets-rotation.md` |
| BUG-002 | `/api/setup-admin` ativo em produção SEM auth — cria admin com email/senha hardcoded e retorna senha no JSON | `curl -i -X POST https://ldccapital.com.br/api/setup-admin` → 404 confirmado pós-deploy 2026-05-20 | D | iam/secrets | **P0** | **crítico — comprometimento total do painel** | < 30min | fast-fix | **RESOLVIDO em 27d87a3 (2026-05-20)** | rota deletada inteira (1 arquivo + pasta); seed seguro coberto por `scripts/sync-admin-users.ts` (já versionado). Próximos passos: (a) atualizar wiki modules/auth-admin, modules/admin-panel, architecture, overview e `CURRENT_REALITY.md` removendo refs à rota (outra sessão Harness v3.2); (b) decisão pendente: rotacionar `ADMIN_PASSWORD` env (fora do escopo deste fix) |
| BUG-003 | `/api/admin/add-users` SEM auth — cria 3 admins fixos com `ADMIN_SYNC_PASSWORD` default `LdcBlog2026` | inspecionar `src/app/api/admin/add-users/route.ts:1-15` | D | iam | P1 | alto (depende da senha ser default) | 1-2h | standard | TRIADO | adicionar `checkAdminAuth` ou mover lógica para `scripts/sync-admin-users.ts` (verificar conteúdo do script); rotacionar default password |
| BUG-004 | `/api/admin/media` SEM `checkAdminAuth` no GET handler — gap arquitetural (bucket é público, então não vaza, mas viola padrão `/api/admin/*`) | inspecionar `src/app/api/admin/media/route.ts` | C | iam | P2 | médio | 30-60min | standard | TRIADO | adicionar `checkAdminAuth` na próxima feature B que tocar o módulo de mídia admin |
| BUG-005 | `/api/dividend-tax/report` SEM rate limiting — Playwright é caro (CPU + memória); DDoS trivial | inspecionar head de `src/app/api/dividend-tax/report/route.ts` (ausência de limiter) | C | dos | P2 | médio (custo Playwright + degradação) | 1-2h | standard | TRIADO | adicionar limiter por IP (ex.: 5 req/min); considerar `@vercel/firewall` ou middleware Edge |
| BUG-006 | Sem rate limiting em endpoints públicos de lead capture — `/api/lead`, `/api/contato`, `/api/dividend-tax/{calculate,lead}`, ebook, guia. Risco DDoS + spam de leads | inspecionar heads dos route files | C | dos/spam | P3 | médio (qualidade de pipeline de lead) | 2-4h | standard | TRIADO | padronizar limiter; co-implementar com BUG-005 |
| BUG-007 | `/api/pgbl-simulator/pdf` valida só presença `inputs && result` sem Zod — viola Anti-SPEC §6.5 (validação 100% em IO externo) | inspecionar `src/app/api/pgbl-simulator/pdf/route.ts:18-23` | C | iam/cvm | P3 | médio (rota protegida por checkAdminAuth; só admin chama) | 30-60min | standard | TRIADO | criar schema Zod em validators dedicado; próxima feature B/C que tocar PGBL |
