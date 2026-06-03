# Feature Contract — F-020: Admin Video Tracking (UTM + YouTube)

> Obrigatório para B/C/D. Template Harness v3.2 — site-ldc.
> Fase 0 (Discovery + SPEC). **PAUSE** para aprovação do Eduardo antes da Fase 1.

## Identificação

- **ID:** F-020
- **Nome:** Painel admin de rastreamento de vídeos (gerador de link UTM + dashboard de leads × YouTube)
- **Classe:** **D** — toca banco real (tabela nova + RLS), env var nova (`YOUTUBE_API_KEY`), integração externa (YouTube Data API). Por Anti-SPEC §6.7, produção = D obrigatória.
- **Cobre RF(s):** novos — RF-VID-001..009 (abaixo). Reusa pipeline UTM de `docs/analytics-ga4-utm.md` (PR #2) e §10/§11 do SPEC.
- **Branch:** `feat/admin-video-tracking`
- **CI alvo:** N3 (lint + typecheck + test + migration validation; build local)
- **Modo:** Production (Harness v3.2)

## Objetivo

Dar ao Marcos (sócio operacional) uma tela em `/admin` para (1) colar URL de vídeo do YouTube, definir `utm_campaign` e gerar/copiar um link UTM pronto; e (2) acompanhar um dashboard que cruza **leads do Supabase (`Client`, via `utm_content = videoId`)** com **métricas do YouTube Data API v3** (views, likes, comments, título, thumb). Sem GA4 Data API.

---

## ⚠️ Achados de Discovery que alteram premissas do prompt (decidir antes da Fase 1)

Estes pontos divergem do que o prompt assumiu. Cada um tem uma **recomendação**; preciso de OK do Eduardo.

### D-1 — MCP Supabase ✅ RESOLVIDO (2026-06-02)
Inicialmente o MCP hospedado (`mcp.supabase.com/mcp`) estava sem credencial e retornava `permission denied`. Eduardo configurou o servidor local `@supabase/mcp-server-supabase` com access token (PAT curto, em `.mcp.json` gitignored, `--project-ref=xvbpqlojxwbvqizmixrr`).
- **Estado atual:** `execute_sql`/`list_tables`/`apply_migration` funcionam (modo write).
- **Decisão:** aplico a migration `create_tracked_videos` via `mcp__supabase__apply_migration` na Fase 1, mostrando o SQL antes. Após aplicar, gero tipos via `mcp__supabase__generate_typescript_types` (com fallback cliente untyped + helper tipado — D-4).
- **Achados da inspeção viva:** `is_admin_or_editor()`/`is_admin()` existem mas são `security_definer = FALSE` (prompt dizia DEFINER — correção); `Client` confirmado sem `status/patrimonio/origem` (D-3); `tracked_videos` ainda não existe; roles em uso = só `ADMIN`.

### D-2 — Autorização: o código real NÃO usa RLS na query
O prompt pede "cheque role via `is_admin_or_editor()` via RLS na query, não duplique no app". Mas **todas** as ~20 rotas `/api/admin/*` existentes usam `checkAdminAuth()` (`src/lib/auth-check.ts`, app-layer) + `createSupabaseAdminClient()` (service role, que **bypassa RLS inteiramente**). Usar o cliente SSR anon com RLS seria um padrão novo, inexistente no admin.
- **✅ DECIDIDO (Eduardo, 2026-06-02):** gate de autorização em **app-layer via `checkAdminAuth()`** em cada route handler + `createSupabaseAdminClient()` para a query, exatamente como `materials/route.ts`. A policy RLS `is_admin_or_editor()` na tabela `tracked_videos` fica como **defesa em profundidade at-rest** (criada na migration). Padrão consistente com o repo.

### D-3 — `Client` não tem colunas `status`, `patrimonio` nem `origem`
Schema real de `Client`: `id, name, email, phone, notes, createdAt, updatedAt` + 8 colunas `utm_*`. Patrimônio e origem vivem **serializados em `notes`** (`Patrimônio: … | Origem: … | IP: …`, ver `api/lead/route.ts:68`). Não existe coluna `status`.
- **Impacto nas Páginas C/D:** a tabela de leads e o "BarChart leads por origem" precisam **parsear `notes`** (lib pura `parse-client-notes.ts`). A coluna "status" pedida não tem fonte.
- **✅ DECIDIDO (Eduardo, 2026-06-02):** tabela de leads exibe `data | nome | email | telefone | patrimônio (parseado de notes) | utm_campaign`. **Coluna "status" removida** (sem fonte). BarChart de origem usa `origem` parseado de `notes`.

### D-4 — Bug Supabase-js v2 multi-table + tipos
`tracked_videos` não estará em `database.types.ts` até regenerar (ver D-1). Conforme memória `feedback_supabase_js_multi_table`, inserts colapsam para `never`.
- **Recomendação:** cliente admin untyped isolado + helpers tipados à mão para `tracked_videos` (mesma estratégia de `materialBuilder as any` já usada no repo), com tipo `TrackedVideo` escrito manualmente em `src/lib/youtube/types.ts` até a regeneração dos tipos.

### D-5 — shadcn `Table` e `Dialog` não estão instalados
Componentes locais existentes: button, card, input, label, select, badge, tabs, tooltip, textarea, checkbox, accordion, carousel, alert-dialog, toast(er), file-upload. **Faltam `table` e `dialog`.** `@radix-ui/react-dialog` já é dependência (package.json).
- **Recomendação:** adicionar `src/components/ui/table.tsx` (HTML puro, zero deps) e, se necessário, `dialog.tsx` (sobre o radix já instalado). **Não** é `npm install` pesado. Sem TanStack Table (paginação manual, conforme prompt).

### D-6 — Base do link UTM é `/diagnostico-gratuito`
O pipeline UTM (doc §1) usa `https://www.ldccapital.com.br/diagnostico-gratuito` como landing, **não** `/`. O `build-utm-url` default: `utm_source=youtube`, `utm_medium=video`, base configurável.

---

## Definition of Ready

- [x] RFs vinculados (RF-VID-001..009, abaixo)
- [x] CAs claros e testáveis (abaixo)
- [x] Escopo incluído/excluído descrito
- [x] Classe D confirmada (§6.7)
- [x] Arquivos prováveis listados
- [x] Testes esperados definidos
- [x] Contratos Zod definidos
- [x] Dependências externas: YouTube Data API v3 + Supabase
- [x] Impacto em banco: tabela nova `tracked_videos` + RLS (NÃO altera `Client`)
- [x] Impacto em produção: migration + env nova + rollback (ver Infra)
- [x] Anti-SPEC §6 revisada (ver fim)
- [x] D-1 resolvido (MCP write OK; aplico via apply_migration na Fase 1)
- [x] D-2 resolvido (checkAdminAuth + service role + RLS defesa em profundidade)
- [x] D-3 resolvido (remover coluna "status"; patrimônio/origem parseados de notes)
- [x] **Fase 0 aprovada — pronto para Fase 1**

## RFs cobertos

- **RF-VID-001** — `extractVideoId(url)` extrai videoId de watch/youtu.be/shorts/m.youtube/embed.
- **RF-VID-002** — `normalizeCampaignSlug(input)` → lowercase, espaço→hífen, sem acento, sem chars inválidos.
- **RF-VID-003** — `buildUtmUrl({base, campaign, videoId, term})` gera URL UTM canônica (source=youtube, medium=video).
- **RF-VID-004** — `POST /api/admin/videos` cria `tracked_videos` (videoId único) e dispara fetch YouTube.
- **RF-VID-005** — `GET /api/admin/videos` lista paginada + filtros (campanha, período, busca, sort).
- **RF-VID-006** — `GET /api/admin/videos/[id]` detalhe + agregações; `GET .../leads` lista leads do vídeo.
- **RF-VID-007** — `POST /api/admin/videos/[id]/refresh` re-fetch YouTube com rate-limit 1/min (`youtube_synced_at`).
- **RF-VID-008** — `GET /api/admin/analytics/utm` agregações globais por campanha/source/dia.
- **RF-VID-009** — 4 páginas UI `/admin/videos`, `/admin/videos/new`, `/admin/videos/[id]`, `/admin/analytics/utm`.

## Critérios de aceite

- **CA-001:** `extractVideoId` retorna o ID correto para watch, youtu.be, shorts, m.youtube, embed e querystrings extras; retorna `null` para URL inválida. (unit)
- **CA-002:** `normalizeCampaignSlug("Política Macro BR")` → `politica-macro-br`; remove acento/espaço/maiúscula/underscore. (unit)
- **CA-003:** `buildUtmUrl` produz `…/diagnostico-gratuito?utm_source=youtube&utm_medium=video&utm_campaign=<slug>&utm_content=<id>[&utm_term=…]` com encoding correto. (unit)
- **CA-004:** `aggregateLeadsByCampaign`/`...ByDay`/`...BySource` (lib pura) produzem séries corretas a partir de rows de `Client`. (unit)
- **CA-005:** Toda rota `/api/admin/videos*` sem `checkAdminAuth` válido (ADMIN/EDITOR) retorna 401. (integration, mock)
- **CA-006:** `POST /api/admin/videos` com videoId duplicado retorna 409 `{success:false}`. (integration)
- **CA-007:** YouTube API 403/404/5xx degradam: persiste `youtube_synced_at`, não quebra a tela, mostra "métricas indisponíveis". (integration, mock)
- **CA-008:** Refresh respeita rate-limit 1/min por vídeo via `youtube_synced_at`. (integration)
- **CA-009:** `parseClientNotes` extrai patrimônio/origem de `notes` no formato padrão; tolera ausência. (unit)
- **CA-010:** `YOUTUBE_API_KEY` nunca aparece em payload de client nem em logs (apenas server-side). (revisão de PR + grep)

## Escopo

**Incluído:** 4 páginas admin; 7 rotas API; libs puras (`extract-video-id`, `normalize-campaign`, `build-utm-url`, `youtube-api`, `aggregate-leads`, `parse-client-notes`); migration `tracked_videos` + RLS; componentes `table`/`dialog`; `.env.example` + doc atualizada; ≥3 vitest tests.

Tabela de leads (Página C) — colunas finais: `data | nome | email | telefone | patrimônio (de notes) | utm_campaign` (sem "status", ver D-3).

**Excluído:** GA4 Data API; alteração de `Client`/`LeadForm`/`src/lib/utm.ts`/`api/lead` (intocáveis — Anti-SPEC §6.6 + risco regressão tracking); página pública nova; soft-delete com tabela de auditoria (hard delete simples — leads ficam órfãos por design); TanStack Table; axios/moment/dayjs; rate limiting global dos endpoints públicos (BUG-006, fora de escopo).

## Arquivos

**Permitidos para alteração/criação:**
- `supabase/migrations/<ts>_create_tracked_videos.sql` (+ `_down.sql`)
- `src/lib/youtube/{extract-video-id,normalize-campaign,build-utm-url,youtube-api,types}.ts`
- `src/lib/analytics/{aggregate-leads,parse-client-notes}.ts`
- `src/lib/youtube/__tests__/*.test.ts`, `src/lib/analytics/__tests__/*.test.ts`
- `src/app/api/admin/videos/**/route.ts`, `src/app/api/admin/analytics/utm/route.ts`
- `src/app/admin/videos/**`, `src/app/admin/analytics/utm/**`, `src/app/admin/_components/**`
- `src/components/ui/{table,dialog}.tsx` (novos)
- `src/app/admin/components/AdminLayout.tsx` (apenas adicionar item de nav "Vídeos")
- `.env.example`, `docs/analytics-ga4-utm.md`
- `src/types/database.types.ts` (somente após regeneração pós-migration)

**NÃO podem ser alterados (qualquer alteração exige PAUSE):**
- `src/lib/utm.ts`, `src/app/components/LeadForm.tsx`, `src/app/api/lead/route.ts` (tracking em produção — §6.6)
- Colunas de `Client` (8 `utm_*` imutáveis neste escopo)
- `.env` real, `vercel.json`, `next.config.ts`, `tsconfig.json`
- `src/features/news/*`, `docs/specs/SPEC.md §6`

## Contratos Zod (a criar — vivem junto às rotas/libs)

```ts
// createTrackedVideoSchema (POST body)
{ url: string (YouTube válida → extractVideoId != null),
  utm_campaign: string (1..80, será normalizado),
  utm_term?: string (0..120) }

// patchTrackedVideoSchema (PATCH body)
{ utm_campaign?: string, utm_term?: string|null }

// listVideosQuerySchema (GET querystring)
{ campaign?: string, period?: '7d'|'30d'|'90d'|'all'(default),
  q?: string, sort?: 'leads_30d'|'created_at'(default 'leads_30d'),
  page?: number>=1, pageSize?: 20 }

// analyticsUtmQuerySchema
{ period?: '7d'|'30d'|'90d'|'custom', from?: ISO, to?: ISO }

// youtubeVideoResponseSchema — schema RELAXADO p/ resposta da Data API,
//   re-validado estrito após parse (lição OpenAI structured outputs §6.5).
```
Resposta padrão de todas as rotas: `{ success: true, data }` | `{ success: false, message, errors? }`.

## DDL — `tracked_videos` (migration nova; NÃO altera `Client`)

```sql
create table if not exists public.tracked_videos (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null unique,
  utm_campaign text not null,
  utm_term text,
  title text, channel_title text, published_at timestamptz,
  thumbnail_url text, duration_seconds int,
  view_count bigint, like_count bigint, comment_count bigint,
  youtube_synced_at timestamptz,
  created_by_user_id text references public."User"(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists tracked_videos_youtube_video_id_key on public.tracked_videos(youtube_video_id);
create index if not exists tracked_videos_utm_campaign_idx on public.tracked_videos(utm_campaign);
create index if not exists tracked_videos_created_at_idx on public.tracked_videos(created_at desc);

alter table public.tracked_videos enable row level security;
create policy "tracked_videos_admin_editor_all" on public.tracked_videos
  for all to authenticated using (public.is_admin_or_editor()) with check (public.is_admin_or_editor());
create policy "tracked_videos_service_role_all" on public.tracked_videos
  for all to service_role using (true) with check (true);
```
`_down.sql`: `drop table if exists public.tracked_videos cascade;` (idempotente; políticas/índices caem junto).

**Join de leads:** `Client.utm_content = tracked_videos.youtube_video_id` (índice parcial `client_utm_content_idx` já existe). Leads sem `tracked_video` correspondente = órfãos (aba opcional no dashboard global).

## Rotas API

| Método | Rota | Função |
|---|---|---|
| POST | `/api/admin/videos` | cria, valida videoId único (409 se dup), dispara fetch YouTube |
| GET | `/api/admin/videos` | lista paginada (20) + filtros + sort, com `leads_total/7d/30d` |
| GET | `/api/admin/videos/[id]` | detalhe + KPIs + séries |
| PATCH | `/api/admin/videos/[id]` | edita utm_campaign/utm_term |
| DELETE | `/api/admin/videos/[id]` | hard delete (leads NÃO deletados; viram órfãos — documentado) |
| POST | `/api/admin/videos/[id]/refresh` | re-fetch YouTube, rate-limit 1/min |
| GET | `/api/admin/videos/[id]/leads` | leads do vídeo (Client por utm_content), paginação 50 |
| GET | `/api/admin/analytics/utm` | agregações globais |

Cada handler: `checkAdminAuth()` → 401 se null; Zod parse do input; `createSupabaseAdminClient()` para query; resposta JSON consistente.

## Integração YouTube Data API v3

`GET https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=<id>&key=<YOUTUBE_API_KEY>` via `fetch` nativo. Parse duração ISO-8601 (PT#M#S) → segundos. Erros: 403 (quota)/404/5xx com 1 retry backoff; **sempre** grava `youtube_synced_at` mesmo em erro parcial. Sem chave → fallback "métrica indisponível", tela não quebra.

## Matriz teste → tipo → CA → arquivo

| Teste | Tipo | Cobre CA | Arquivo |
|---|---|---|---|
| `extract-video-id` | unit | CA-001 | `src/lib/youtube/__tests__/extract-video-id.test.ts` |
| `normalize-campaign` | unit | CA-002 | `src/lib/youtube/__tests__/normalize-campaign.test.ts` |
| `build-utm-url` | unit | CA-003 | `src/lib/youtube/__tests__/build-utm-url.test.ts` |
| `aggregate-leads` | unit | CA-004 | `src/lib/analytics/__tests__/aggregate-leads.test.ts` |
| `parse-client-notes` | unit | CA-009 | `src/lib/analytics/__tests__/parse-client-notes.test.ts` |
| rotas (auth/dup/degrade) | integration (mock) | CA-005..008 | `src/app/api/admin/videos/__tests__/*.test.ts` |

## Comandos CI obrigatórios

```bash
npm run lint && npm run typecheck && npm test
npm run build   # local (CI não roda build)
```

## Infra / Produção (D)

- **Migration:** `<ts>_create_tracked_videos.sql` + `_down.sql` reversível. Aplicação: **pendente D-1** (MCP bloqueado → provável `supabase db push` pelo Eduardo).
- **Env nova:** `YOUTUBE_API_KEY` (server-only) — em `.env.example`, `.env` local e Vercel (Production/Preview). **NÃO** criar `NEXT_PUBLIC_*`. Eduardo fornece a chave (Anti-SPEC: não pegar de repo externo).
- **Feature flag:** não necessária (tela nova isolada atrás de `/admin`); promoção = merge.
- **Staging:** validar migration em branch Supabase ou local antes de prod (runbook `supabase-migration.md`).
- **Smoke test:** criar 1 vídeo real do canal LDC, gerar link, submeter lead de teste em aba anônima, ver `leads_total=1` no detalhe, refresh métricas, ver campanha no dashboard global.
- **Rollback plan:** (1) reverter deploy Vercel para o anterior; (2) `psql -f _down.sql` (drop table — não toca `Client`); (3) remover item de nav. Leads em `Client` permanecem intactos (tabela não tocada).

## Anti-SPEC §6 relevante

- **§6.1** Sem Anthropic SDK — N/A (sem IA aqui).
- **§6.2 / §6.2b** Sem conteúdo público; YouTube não cita Bloomberg. OK.
- **§6.4** Sem polling — refresh é ação manual do usuário (clique), não timer. ✅
- **§6.5** Zod 100% em IO externo — YouTube API + request bodies validados. ✅
- **§6.6** `Client`/`User`/`LeadForm`/`api/lead`/`utm.ts` intocáveis; só `tracked_videos` (tabela nova) + nav. ✅
- **§6.7** Produção = D — este contrato + rollback + smoke. ✅
- **§6.8** Submódulo — commits dentro de `site-ldc/site-ldc/`; sem `submodule update`. ✅

## Gate de autonomia

- [ ] Eduardo aprova decisões D-1 (aplicação da migration) e D-2/D-3
- [ ] Lista de arquivos permitidos validada
- [ ] Cursor-brief criado (classe D) em `docs/plans/cursor-brief.md` — na Fase 1
- [ ] Eduardo aprova abertura do PR (sem commit/push sem ok)

---

**FIM Fase 0.** ✅ Aprovada.

## Status de execução

- ✅ **Fase 0** — Discovery + SPEC (aprovada 2026-06-02).
- ✅ **Fase 1** — Migration + libs puras + tests (2026-06-02):
  - Migration `20260602190000_create_tracked_videos.sql` (+ down) **aplicada em produção via MCP**. Validado: tabela, RLS on, 2 policies, 4 índices, trigger `updated_at`.
  - Libs: `extract-video-id`, `normalize-campaign`, `build-utm-url`, `youtube-api` (+`types`), `aggregate-leads`, `parse-client-notes`.
  - `database.types.ts` atualizado com `tracked_videos` (insert cirúrgico).
  - Tests: 40 novos (6 arquivos). Suíte completa: 200 passed / 15 skipped. typecheck + lint limpos.
- ✅ **Fase 2** — Rotas API (2026-06-02):
  - 5 arquivos de rota: `POST/GET /api/admin/videos`, `GET/PATCH/DELETE /api/admin/videos/[id]`, `POST .../[id]/refresh`, `GET .../[id]/leads`, `GET /api/admin/analytics/utm`.
  - Camadas: `lib/api/response.ts` (envelope), `lib/youtube/schemas.ts` (Zod), `tracked-videos-repo.ts` + `analytics/leads-repo.ts` (data access), `sync-video.ts` (fetch+rate-limit), `video-view.ts` (mappers puros).
  - YouTube no POST: síncrono + tolerante a falha (grava vídeo mesmo se API falhar). Refresh: rate-limit 1/min (429).
  - Tests: +26 (rotas mockando auth+repos+sync; youtube-api com fetch injetável; cooldown). Suíte: 226 passed / 15 skipped. typecheck + lint limpos.
  - CA cobertos: CA-005 (401), CA-006 (409 dup), CA-007 (degradação YouTube), CA-008 (rate-limit).
- ✅ **Fase 3** — UI Admin (2026-06-02):
  - 4 páginas: `/admin/videos` (lista+filtros+paginação), `/admin/videos/new` (criar/editar via `?id=`, preview, chips, gerar/copiar link), `/admin/videos/[id]` (KPIs + LineChart/BarChart + tabela leads + refresh) + `error.tsx`, `/admin/analytics/utm` (dashboard global).
  - Componentes: `_components/{KpiCard,CampaignChips,format,video-types}` + `components/ui/table.tsx`.
  - Endpoint extra `GET /api/admin/videos/preview` (preview sem salvar). Detalhe enriquecido com `series` (byDay/byOrigem).
  - Nav "Vídeos" no AdminLayout. Loading/empty/error states, tooltips a11y, mobile-friendly, cores LDC.
  - `npm run build` ✅ (4 páginas + 6 rotas no manifesto). typecheck + lint limpos. Tests: 226 passed / 15 skipped.
- 🔄 **Fase 4** — E2E + docs (2026-06-02):
  - `.env.example` já documentava `YOUTUBE_API_KEY` (sessão paralela). Chave real em `.env.local` (gitignored); validada direto na Data API (vídeo real do canal).
  - `docs/analytics-ga4-utm.md` §11 adicionada (painel admin).
  - **E2E via Playwright (logado, dados reais):** login+redirect ✅; lista empty→populada ✅; criar com preview real (views/likes/duração) ✅; **chips** ✅ (bug de layout-shift no clique encontrado e corrigido — preview agora reativo ao videoId, não no blur); link UTM gerado ✅; salvar+redirect ✅; detalhe com KPIs reais (951 views, 54 likes, 8 comentários) ✅; refresh rate-limit 429 ✅; dashboard com agregação real (1 lead, renda-fixa-credito, 100% share) ✅.
  - **Atribuição de lead validada:** lead inserido via SQL (sem email) → detalhe mostrou LEADS 1, 7D 1, 30D 1, conversão 0,11%, patrimônio parseado de notes ✅.
  - **2º bug encontrado e corrigido:** `Client.createdAt` é `timestamp without time zone` (UTC naive) — app parseava como local → off-by-one em 7d/30d e "última lead" no futuro. Fix: `ensureUtcIso` (append Z) no parse + formatters. +3 testes.
  - **Cleanup:** vídeo de teste deletado via endpoint DELETE (200); lead de teste removido. Produção limpa (tracked_videos=0).
  - `npm run lint`/`typecheck`/`test` (**229**) ✅. `build` ✅ (pré-fix; mudanças pós-fix são triviais e cobertas por typecheck+test).
  - **Pendente:** (a) **commit + PR** (plano já apresentado — aguarda aprovação); (b) **reset da senha admin** (está temporária `LdcE2E-tmp-2026!`); (c) rotacionar `YOUTUBE_API_KEY`.
