# Módulo: blog-cms

> Render público de `/blog` (lista + post individual) e CRUD admin. **Dois caminhos coexistentes** para `BlogPost.published=true`: token F-018 (automático pós-pipeline IA) e admin manual.

## §1 Escopo

**Público:**
- `src/app/blog/page.tsx` — lista (client component, fetch `/api/blog/posts`).
- `src/app/blog/[slug]/page.tsx` — post individual.
- `src/app/api/blog/posts/route.ts` (GET) — lista posts publicados via lib `src/app/lib/blog.ts`.
- `src/app/api/blog/categories/route.ts` (GET) — taxonomia.

**Admin:**
- `src/app/admin/posts/{page,new,edit/[id]}/page.tsx`.
- `src/app/api/admin/posts/{route,[id]/route}` — CRUD com `checkAdminAuth`.
- `src/app/api/admin/posts/[id]/carousel/route.ts` — trigger F-019 (ver `modules/news-pipeline.md`).
- `src/app/api/admin/categories/{route,[id]/route}`.

**Aprovação por token (F-018):**
- `src/app/api/posts/approve/route.ts` (GET) — Marcos clica link no email → muda `published=true`.
- `src/app/api/posts/reject/route.ts` (GET) — token rejeitado, `published` permanece `false`.
- `src/app/api/posts/cleanup-expired-tokens/route.ts` — cron 00h BRT, TTL 7d.

## §2 Fluxos principais

### 2.1 Caminho A — Publicação via token F-018 (automático, pipeline IA)
1. Pipeline IA insere `BlogPost(published=false)` (ver `modules/news-pipeline.md`).
2. F-018 gera `BlogPostApprovalToken(pending)` + envia email Resend com link `/api/posts/approve?token=<rawToken>` para `NEWS_APPROVAL_RECIPIENT_EMAIL` (Marcos) + `NEWS_APPROVAL_CC_EMAILS`.
3. Marcos clica → `handleApproval(request, "approve")` em `src/features/news/notifications/approval-handler.ts`.
4. Primeiro clique decide; token marca `approved | rejected`. Auditoria via `news_events.ip_hash`.
5. `published=true` → post aparece em `/blog` na próxima leitura (cache Next.js + Supabase sem CDN custom).

### 2.2 Caminho B — Publicação via admin manual
1. Admin em `/admin/posts/edit/[id]` edita conteúdo/flag.
2. PUT `/api/admin/posts/[id]` com `checkAdminAuth`.
3. Update direto em `BlogPost` (service role bypassa RLS).
4. `published=true` ou `=false` controlado manualmente.

### 2.3 Render público
1. `/blog/page.tsx` (client) chama `GET /api/blog/posts` que invoca `getBlogPosts()` em `src/app/lib/blog.ts`.
2. Em erro, API retorna `[]` (fallback silencioso — `route.ts:9`).
3. `/blog/[slug]/page.tsx` busca por slug; chama `notFound()` (Next.js) na linha 137 se ausente → renderiza `app/not-found.tsx`.
4. **Render dinâmico por request** — `generateStaticParams` foi removido (comentário linha 105); sem `revalidate` explícito; `generateMetadata` + componente consultam Supabase a cada hit. Backlog TODO §2 classe B: avaliar ISR (`revalidate: 60` ou tag-based) para `/blog/[slug]`.

## §3 Tabelas / Storage

- **`BlogPost`** (órfã — fora de migrations): colunas conhecidas `slug, title, content, summary, category, cover, published, publishedAt, readingTime, updatedAt`. RLS `[VERIFICAR]` — cabeçalho de `news_telemetry.sql` cita "Padrão RLS: replica BlogPost (service_role full access; sem leitura anon/authenticated)".
- **`Category`** (órfã) — taxonomia.
- **`BlogPostApprovalToken`** (órfã) — TTL 7 dias, status `pending|approved|rejected|expired`.
- **Storage:** cover images em `ldc-assets` (path `images/`).

## §4 Env vars e dependências externas

- Resend (`RESEND_API_KEY`, `EBOOK_FROM_EMAIL` reusada como remetente).
- F-018 destinatários: `NEWS_APPROVAL_RECIPIENT_EMAIL`, `NEWS_APPROVAL_CC_EMAILS`.
- `CRON_SECRET` para `cleanup-expired-tokens`.

## §5 Riscos e classe típica de mudança

- Ajuste de copy / UI / layout do `/blog/[slug]` → **A/B**.
- Novo endpoint público que lê `BlogPost` → **B**.
- Mudança em RLS, schema, ou trigger de publicação → **C/D**.
- Mudança no fluxo F-018 (token, validação, expiry) → **C** (auth + dados sensíveis).
- Anti-SPEC §6.6 — `BlogPost` é tabela intocável sem migration plan.

## §6 ADRs e referências

- **ADR-002** — Persistência MDX via GitHub API (legado pré-pivot; `/news` MDX descontinuado).
- **ADR-005** — Pivot brevidade → artigo denso em BlogPost (define o que entra no `content`).
- **ADR-007** — Disclaimer literal CVM 3976-4 vai DENTRO do `content` (editorial completo).
- Feature contracts: `docs/plans/feature-contracts/F-007-pipeline-ia.md`, `F-008-cron-commit.md` (legacy).
- SPEC autoritativa do conteúdo: `docs/specs/spec-pipeline-ia.md`.
- Manual operacional: `docs/wiki/runbooks/admin-panel-uso.md`.

## §7 Runbooks relacionados

- `docs/wiki/runbooks/news-pipeline-cron.md` — overlap com pipeline.
- `docs/wiki/runbooks/blog-rollback.md` — reverter publicação errada (a criar pós-incidente).

## §8 Pontos de atenção atuais

- **2 caminhos coexistentes** para `published=true` — auditoria fica em `news_events` (apenas pipeline) + `git log` do admin (apenas manual). Sem trilha unificada.
- **Schema `BlogPost` fora de `supabase/migrations/`** — backlog TODO §2 classe C.
- **`/api/blog/posts` fallback silencioso `[]` em erro** — pode mascarar problema de DB.
- **`[VERIFICAR]`** — RLS exata de `BlogPost` em produção (cabeçalho cita "service_role full access; sem leitura anon/authenticated"). Junto dos 10 schemas órfãos.
- **Render dinâmico em produção** — sem ISR; toda visita ao `/blog/[slug]` consulta Supabase. Backlog TODO §2 classe B para avaliar `revalidate: 60` ou tag-based.
