# Módulo: auth-admin

> Autenticação Supabase (SSR + browser) e helper `checkAdminAuth` para proteger rotas API/admin.

## §1 Escopo

- `src/lib/auth-supabase.ts` — funções `signIn`, `signOut`, `getCurrentUser` (browser client).
- `src/lib/supabase-server.ts` — `createSupabaseServerClient` (SSR cookies).
- `src/lib/supabase.ts` — `createSupabaseBrowserClient`, `createSupabaseAdminClient` (service role).
- `src/lib/auth-check.ts` — `checkAdminAuth()` retorna `User | null` usado em todas as APIs admin. **Aceita `ADMIN` e `EDITOR`** (`auth-check.ts:65-67` bloqueia qualquer outro role, incluindo `USER`).
- `src/middleware.ts` — Edge middleware. **Conteúdo não auditado** — backlog TODO §2 classe B ("Auditar `src/middleware.ts`").
- `src/app/admin/login/page.tsx` — UI de login.
- `src/app/api/auth/callback/route.ts` — sincroniza sessão Supabase via cookies.

**Roles em uso (3):**
- `ADMIN` — acesso total. Gravado por `/api/setup-admin` (BUG-002) e `/api/admin/add-users` (BUG-003).
- `EDITOR` — acesso a rotas admin (`checkAdminAuth` aceita). **`[VERIFICAR]` quem grava role EDITOR — provável via Supabase Studio manual, não vi código que gere.**
- `USER` — default no upsert (`auth-check.ts:42` `role: normalizedRole || "USER"`). Bloqueado de `/api/admin/*` em `auth-check.ts:65`.

## §2 Fluxos principais

### 2.1 Login (browser)
1. Usuário em `/admin/login` chama `signIn(email, password)` (`auth-supabase.ts:11-37`).
2. Antes do `signInWithPassword`, código limpa cookies `sb-*` de outros projects (`auth-supabase.ts:14-30`) — project ref hardcoded em `auth-supabase.ts:17` = `xvbpqlojxwbvqizmixrr`.
3. `supabase.auth.signInWithPassword({ email, password })`.
4. Sessão grava cookies `sb-xvbpqlojxwbvqizmixrr-*` que são lidos no SSR.

### 2.2 Verificação em API route
1. API call para `/api/admin/*` chama `checkAdminAuth()` (`auth-check.ts:9-…`).
2. Helper cria `createSupabaseServerClient` (lê cookies SSR) + `createSupabaseAdminClient` (service role para queries privilegiadas).
3. `supabase.auth.getUser()` → se erro/null → retorna `null` → API responde 401.
4. Lê `role` do `user_metadata.role` (linha 32-33); se vazio, faz fallback para a tabela `User` (linha 56).
5. UPSERT em tabela `User` para sincronizar metadata → DB (`auth-check.ts:36-47`).
6. Bloqueia qualquer role diferente de `ADMIN` ou `EDITOR` (`auth-check.ts:65-67`).

### 2.3 Determinação do `role`
- Browser: `getCurrentUser()` em `auth-supabase.ts:54-73` lê `user.user_metadata?.role || 'USER'`.
- Seed inicial: `/api/setup-admin/route.ts:11-15` grava `user_metadata: { role: 'ADMIN' }` ao criar usuário (BUG-002).
- **Single source operacional** = Supabase Auth `user_metadata.role`. Tabela `User` é **espelho** mantido por UPSERT no `checkAdminAuth` (auth-check linha 36-47), usada como fallback apenas se metadata vazio (linha 56).

## §3 Tabelas / Storage

- **`User` (TAB-ÓRFÃ — fora de migrations)** — espelho do `user_metadata.role`. Colunas conhecidas: `id, email, name, role` (visto em `auth-check.ts:36-47` UPSERT). UPSERT a cada chamada de `checkAdminAuth` sincroniza metadata → tabela. Operacionalmente secundária; metadata é o source of truth. Backlog TODO §2 classe C: "Versionar 10 schemas Supabase órfãos".
- Supabase Auth (gerenciada pela plataforma) é a fonte primária do `user_metadata.role`.
- Valores de role: `ADMIN`, `EDITOR`, `USER` (este último default no upsert).

## §4 Env vars e dependências externas

- `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY`.
- Project ref hardcoded em `auth-supabase.ts:17` (`xvbpqlojxwbvqizmixrr`) — se URL mudar, atualizar aqui também.

Detalhe completo: `CURRENT_REALITY.md §3`.

## §5 Riscos e classe típica de mudança

- Qualquer alteração em auth = **classe C mínima**, **D** se tocar middleware ou claim do JWT.
- Anti-SPEC §6.6 — endpoints `/api/admin/*` e `/api/auth/callback` são intocáveis sem migration plan + ADR.
- Cuidado especial com `signOut` — redireciona com `window.location.href = '/admin/login'` (`auth-supabase.ts:47`); em SSR isso falha silenciosamente.

## §6 ADRs e referências

- Nenhum ADR dedicado hoje. Possíveis candidatos:
  - **ADR-009 (candidato)** — Política de role em `user_metadata.role` vs tabela `User` separada (decisão histórica retroativa).
- Fonte de verdade futura: `docs/specs/SPEC.md` §auth (a criar na Fase 6).

## §7 Runbooks relacionados

- `docs/wiki/runbooks/secrets-rotation.md` — rotação de `SUPABASE_SERVICE_ROLE_KEY` (a criar na Fase 4).
- `docs/wiki/runbooks/admin-user-seed.md` — criar admin inicial sem expor `/api/setup-admin` (a criar pós-resolução BUG-002).

## §8 Pontos de atenção atuais

- **BUG-002 (P0)** — `/api/setup-admin` cria admin SEM auth e retorna senha no JSON. Em remediação por sessão paralela.
- **BUG-003 (P1)** — `/api/admin/add-users` cria 3 admins fixos SEM auth, com senha default `LdcBlog2026`.
- **BUG-004 (P2)** — `/api/admin/media` sem `checkAdminAuth` no GET handler.
- **`[VERIFICAR]`** — `src/middleware.ts` não foi inspecionado; pode haver lógica de auth/redirect adicional. Backlog TODO §2 classe B.
- **`[VERIFICAR]`** — Quem grava `user_metadata.role === 'EDITOR'`. Provável via Supabase Studio manual.
- **Project ref hardcoded** em `auth-supabase.ts:17` — não usa env. Mudança de project Supabase exige edit manual.
- **Tabela `User` órfã** (espelho de metadata) — schema fora de migrations. Junto dos 10 órfãos no backlog.
