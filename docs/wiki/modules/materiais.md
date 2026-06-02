# Módulo: materiais

> Listagem pública de materiais ricos (ebooks, guias, relatórios) + CRUD admin. Cada material pode ter cover, fileUrl (PDF/zip) e conteúdo HTML/MDX.

## §1 Escopo

**Público:**
- `src/app/materiais/page.tsx` (client component, lista).
- `src/app/materiais/[slug]/page.tsx` (server, material individual).
- `src/app/api/materials/route.ts` (GET) — chama `getMaterials()` em `src/app/lib/materials.ts`.
- `src/app/api/material-categories/route.ts` (GET) — chama `getMaterialCategories()`.

**Admin:**
- `src/app/admin/materials/{page,new,edit/[id]}/page.tsx`.
- `src/app/api/admin/materials/{route,[id]/route}` — CRUD com `checkAdminAuth`.

**Conteúdo:**
- `content/materiais/` — MDX legacy (`[VERIFICAR]` se ainda renderizado ou se foi migrado para `Material.content` no Supabase).
- `public/documentos/regulatorios/*.pdf` — PDFs regulatórios servidos estaticamente.

## §2 Fluxos principais

### 2.1 Render público
1. `/materiais/page.tsx` (client) fetch `/api/materials` + `/api/material-categories`.
2. APIs chamam libs `src/app/lib/materials.ts`.
3. Fallback `[]` em erro (`route.ts:9`).
4. `/materiais/[slug]/page.tsx` renderiza um material individual; `[VERIFICAR]` se lê `content` MDX inline ou `fileUrl` para download.

### 2.2 CRUD admin
1. `/admin/materials/new` ou `/admin/materials/edit/[id]` — form com cover upload, fileUrl, category, type, published.
2. POST/PUT `/api/admin/materials` ou `/api/admin/materials/[id]` (`route.ts:3-15`).
3. `checkAdminAuth` → 401 se falha.
4. Insert/update em `Material` via service role client.
5. Upload de arquivos via `/api/admin/upload` (gera UUID + grava em `ldc-assets`, path `materials/`) ou direto via `media/route.ts`.

## §3 Tabelas / Storage

- **`Material`** (órfã — fora de migrations): colunas conhecidas `id, title, slug, description, content, category, type, cover, fileUrl, published, …` (vistas em `src/app/api/admin/materials/route.ts:6-19`).
- **`MaterialCategory`** (órfã): taxonomia.
- **Storage:** `ldc-assets` bucket, paths `materials/` (arquivos) e `images/` (covers).
- RLS `[VERIFICAR]` — inferindo replica padrão BlogPost.

## §4 Env vars e dependências externas

- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (default `ldc-assets`).
- Sem integração externa adicional (sem IA, sem email, sem Sheets para este módulo).

## §5 Riscos e classe típica de mudança

- Ajuste de UI/listagem → **B**.
- Novo campo em `Material` schema → **C** (mexe em tabela órfã sem migration).
- Mudança no `getPublicUrl` ou política de bucket → **C**.
- Anti-SPEC §6.6 — `Material` é intocável sem migration plan.

## §6 ADRs e referências

- Nenhum ADR dedicado. Conteúdo é institucional, sem fluxo IA.
- Manual operacional: `docs/wiki/runbooks/admin-panel-uso.md`.

## §7 Runbooks relacionados

- `docs/wiki/runbooks/blob-cleanup.md` (a criar) — limpeza ad-hoc de arquivos órfãos no bucket.

## §8 Pontos de atenção atuais

- **Schema `Material` + `MaterialCategory` órfãs** — sem migration versionada. Backlog TODO §2 classe C.
- **`/api/materials` fallback `[]`** — mascara erro de DB.
- **`content/materiais/` MDX legacy** — `[VERIFICAR]` se ainda em uso ou se foi migrado integralmente.
- **`[VERIFICAR]`** — Path real do `[slug]/page.tsx` para entender se busca por `Material.slug` no DB ou se lista de `content/materiais/*.mdx`.
- **Sem testes** em `src/app/admin/materials/` nem em `src/app/lib/materials.ts`.
