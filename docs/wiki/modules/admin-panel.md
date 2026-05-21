# Módulo: admin-panel

> Painel administrativo `/admin/*` + APIs `/api/admin/*` para CRUD de posts, materiais, categorias, mídia, PDFs Bloomberg e planejamento patrimonial.

## §1 Escopo

**Páginas (`src/app/admin/`):**
- `/admin/login`, `/admin/dashboard`, `/admin/settings`.
- `/admin/posts/{page,new,edit/[id]}`.
- `/admin/categories/page.tsx`.
- `/admin/materials/{page,new,edit/[id]}`.
- `/admin/bloomberg-pdfs/page.tsx` — upload + trigger pipeline.
- `/admin/wealth-planning/{page,clients/*,scenarios/*,compare}` — ver `modules/wealth-planning.md`.

**APIs (`src/app/api/admin/`):**
- `posts/{route,[id]/route,[id]/carousel}` — CRUD posts + F-019 trigger.
- `categories/{route,[id]/route}`.
- `materials/{route,[id]/route}`.
- `media/route.ts` — list assets do bucket (**BUG-004:** sem `checkAdminAuth` no GET).
- `upload/route.ts` — upload genérico, gera UUID, grava em bucket `ldc-assets`.
- `bloomberg-pdfs/{route,[pathname]/route,upload/route,cleanup/route,trigger-pipeline/route}`.
- `blog-carousels/cleanup/route.ts` — cron 02h BRT.
- `wealth-planning/clients/*`, `wealth-planning/scenarios/*`.
- `add-users/route.ts` — **BUG-003:** seed de 3 admins SEM auth.

**Rota fora de `/api/admin/` mas com escopo admin:**
- `/api/setup-admin/route.ts` — **BUG-002:** seed inicial SEM auth.

## §2 Fluxos principais

### 2.1 CRUD de post (caminho admin manual)
1. Usuário admin em `/admin/posts/new` ou `/admin/posts/edit/[id]` preenche form.
2. POST/PUT para `/api/admin/posts` ou `/api/admin/posts/[id]` (`src/app/api/admin/posts/route.ts`).
3. `checkAdminAuth` → 401 se falha.
4. Calcula `readingTime` via lib `reading-time` (`route.ts:2`).
5. Insert/update em `BlogPost` via `createSupabaseAdminClient` (service role → bypassa RLS).
6. Possibilidade de mudar `published` diretamente — alternativa ao token F-018 (ver `modules/blog-cms.md`).

### 2.2 Upload de PDF Bloomberg → trigger pipeline
1. Admin em `/admin/bloomberg-pdfs` clica upload.
2. Client POST `{ filename, contentType, sizeBytes }` para `/api/admin/bloomberg-pdfs/upload`.
3. Server valida (auth + tipo PDF + tamanho ≤10MB) e chama Supabase Storage `createSignedUploadUrl(path)` — token 2h.
4. Client PUT direto no `signedUrl` com body do arquivo.
5. Opcionalmente, UI chama `/api/admin/bloomberg-pdfs/trigger-pipeline` (dual auth: sessão admin OU `CRON_SECRET` bearer).
6. Pipeline executa com `trigger_type='manual_upload'` (auditoria em `news_pipeline_runs`).

### 2.3 Cleanup crons (intercalado)
- `0 3 * * *` UTC → `posts/cleanup-expired-tokens` (tokens F-018 expiram em 7d).
- `0 4 * * *` UTC → `bloomberg-pdfs/cleanup` (PDFs > 30d, Anti-SPEC §6.2b).
- `0 5 * * *` UTC → `blog-carousels/cleanup` (ZIPs F-019 > 90d).

## §3 Tabelas / Storage

- **Tabelas tocadas (admin CRUD):** `BlogPost`, `Material`, `Category`, `MaterialCategory`, `carousel_runs`, `BlogPostApprovalToken`, `wealth_planning_clients`/`_scenarios`. **Todas órfãs** (sem migration versionada — ver `CURRENT_REALITY.md §10.6`).
- **Storage buckets:** `ldc-assets` (default `SUPABASE_STORAGE_BUCKET`), `bloomberg-pdfs` (signed upload), `blog-carousels` (ZIPs F-019).

## §4 Env vars e dependências externas

`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_STORAGE_BUCKET`, `CRON_SECRET` (para `trigger-pipeline` dual auth), `ADMIN_SYNC_PASSWORD` (BUG-003 default `LdcBlog2026`).

## §5 Riscos e classe típica de mudança

- **Anti-SPEC §6.6** — `/api/admin/*` e tabelas associadas são intocáveis sem migration plan + ADR.
- Classe típica:
  - Ajuste de UI sem contrato → **A/B**.
  - CRUD endpoint novo → **B**.
  - Mudança em RLS/auth/role → **C**.
  - Mudança em cron, env, storage policy → **D**.
- Service role bypassa RLS — toda API admin que usa `createSupabaseAdminClient` é privilegiada. Cuidar para não vazar service role no client.

## §6 ADRs e referências

- ADR-003, ADR-004 (compliance) — afetam o que pode aparecer no CMS.
- `docs/wiki/runbooks/admin-panel-uso.md` — manual operacional.
- Histórico (Janeiro 2025): `docs/_archive/relatorio-sistema-admin-2025-01.md` (relatório de estado pré-Harness).

## §7 Runbooks relacionados

- `docs/wiki/runbooks/secrets-rotation.md` (BUG-001 + service role).
- `docs/wiki/runbooks/admin-user-seed.md` (a criar pós-BUG-002).
- `docs/wiki/runbooks/bloomberg-pdf-handling.md` (Anti-SPEC §6.2b).

## §8 Pontos de atenção atuais

- **BUG-002 (P0)** — `/api/setup-admin` em remediação por sessão paralela.
- **BUG-003 (P1)** — `/api/admin/add-users` sem auth.
- **BUG-004 (P2)** — `/api/admin/media` sem `checkAdminAuth`.
- **8 tabelas órfãs** — drift staging/prod silencioso. Backlog TODO §2 classe C.
- **`[VERIFICAR]`** — Se `checkAdminAuth` verifica `role === 'ADMIN'` ou aceita qualquer usuário autenticado.
- **`@vercel/blob` ainda nas deps** apesar da migração de 2026-05-08 para Supabase Storage — candidato a remoção futura.
