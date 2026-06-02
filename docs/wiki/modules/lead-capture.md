# Módulo: lead-capture

> 5 formulários públicos de captura de lead — `/contato`, `/diagnostico-gratuito` + home, `/calculadora-tributacao-dividendos-2026`, `/ebook-investimentos-internacionais`, `/guia`. Cada um com seu endpoint e regras de persistência. Integração Google Sheets + Resend/SMTP transversal.

## §1 Escopo

**Páginas:**
- `src/app/contato/page.tsx` — form com `ContactForm`.
- `src/app/diagnostico-gratuito/page.tsx` — usa `LeadForm` (mesma componente do home), `robots: noindex/nofollow`.
- `src/app/page.tsx` (home) — bloco `LeadForm` no rodapé.
- `src/app/calculadora-tributacao-dividendos-2026/page.tsx` — usa `DividendTaxCalculator` que tem captura embutida (ver `modules/calculadora-dividendos.md`).
- `src/app/ebook-investimentos-internacionais/page.tsx` — landing dedicada com `FormSection` em `src/components/landing-ebook/`.
- `src/app/guia/page.tsx` — landing com `GuiaLeadForm` em `src/components/guia/`.
- `src/app/guia-pdf/page.tsx` — render HTML para print-to-PDF do guia (pública mas não indexada).

**APIs:**
- `/api/contato/route.ts` (POST) — schema Zod inline (`nome, email, titulo, mensagem`). Envia para Sheets + email Resend/SMTP.
- `/api/lead/route.ts` (POST) — usa `leadFormSchema` de `src/app/lib/schema.ts`. Persiste no Supabase via service role.
- `/api/dividend-tax/lead/route.ts` (POST) — ver `modules/calculadora-dividendos.md` §2.2.
- Ebook: `[VERIFICAR]` endpoint próprio. `src/lib/ebook-leads/` é a lib associada.
- Guia: `[VERIFICAR]` endpoint próprio (ou compartilha `/api/lead`?). `src/lib/guia-leads/` é a lib associada. Tabela `guia_leads` versionada em `20260519000000_create_guia_leads.sql`.

**Libs e schemas:**
- `src/app/lib/schema.ts` — `leadFormSchema` (Zod usado por `/api/lead`).
- `src/lib/schema.ts` — `getOrganizationSchema`, `getLocalBusinessSchema` (JSON-LD, ver `modules/seo-sitemap.md`).
- `src/lib/google-sheets.ts` — wrapper Sheets API com service account.
- `src/lib/email.ts` — Resend canônico + SMTP fallback.
- `src/lib/ebook-leads/`, `src/lib/guia-leads/` — domain libs.

## §2 Fluxos principais

### 2.1 `/api/contato` — formulário de contato
1. POST com `{nome, email, titulo, mensagem}`.
2. Valida com schema inline (`route.ts:5-10`).
3. Prepara dados para Sheets (`route.ts:18+`) + email para `CONTATO_EMAIL`.
4. `[VERIFICAR]` ordem: tenta Sheets primeiro, depois email? Falha graciosa?

### 2.2 `/api/lead` — lead genérico (home + diagnóstico)
1. POST com payload de `leadFormSchema`.
2. Valida + `createSupabaseAdminClient` (`route.ts:4-7`).
3. **Persiste em tabela `Client`, não `Lead`.** Comentário em `route.ts:41` diz "tabela Lead não existe". Insert com `(name, email, phone, notes)` onde `notes` concatena patrimônio + origem + IP (`route.ts:42-51`).
4. Falha graciosa: `leadSaved = sheetsResult.success || supabaseResult.success` (`route.ts:120`). Se ambos falham, retorna 500.
5. Retorna resposta padronizada `{ success, message }` com 400 em erro de parse JSON.

### 2.3 `/api/dividend-tax/lead`
Ver `modules/calculadora-dividendos.md` §2.2. Range mapping para Sheets (`0-300k`, `300k-1m`, etc.).

### 2.4 Ebook & Guia
- `/guia` → form → POST `[VERIFICAR endpoint]` → tabela `guia_leads` (campos `nome, whatsapp, email, patrimonio_range, qualificado, origem='landing-guia', ip_address, user_agent`).
- `/ebook-*` → form → POST `[VERIFICAR endpoint]` → tabela `ebook_leads` (órfã, fora de migrations).

### 2.5 Política de IP
- `guia_leads.ip_address` — texto puro (consentimento explícito via form).
- `news_events.ip_hash` — SHA-256 (telemetria de leitor anônimo).
- Decisão proposta como **ADR-008 (candidato)** no `TODO.md §2`.

## §3 Tabelas / Storage

| Tabela | Origem | Status |
|---|---|---|
| `guia_leads` | `supabase/migrations/20260519000000_create_guia_leads.sql` | versionada, RLS `[VERIFICAR]` |
| `ebook_leads` | provavelmente `scripts/ebook-leads-schema.sql` aplicada via Studio | órfã |
| **`Client`** — `/api/lead` | `[VERIFICAR]` schema autoritativa; **confirmado em uso** (`api/lead/route.ts:42-51`); comentário linha 41 diz "tabela Lead não existe" | órfã (TAB-ÓRFÃ-10) |
| Dividend-tax lead | `[VERIFICAR]` se compartilha `Client` ou se é Sheets-only sem persistência Supabase (provável Sheets-only) | `[VERIFICAR]` |

Sheets row criada em planilha `GOOGLE_SHEETS_ID` para todos os formulários (auditoria espelhada).

## §4 Env vars e dependências externas

- Sheets: `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` + arquivo `ldc-project-*.json` (**BUG-001**).
- Email: `RESEND_API_KEY`, `EBOOK_FROM_EMAIL`, `EBOOK_FROM_NAME`, `CONTATO_EMAIL`. Fallback SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
- Supabase para persistência (`SUPABASE_SERVICE_ROLE_KEY`).
- Webhook Resend (opcional): `EBOOK_WEBHOOK_SECRET` (comentado no `.env.example`).

## §5 Riscos e classe típica de mudança

- Ajuste de copy / form fields visuais → **B**.
- Novo formulário ou novo endpoint público → **B** (validar Zod, considerar rate limiting).
- Mudança no schema de lead (`Lead`, `ebook_leads`, etc.) → **C** (dados sensíveis + Sheets dependency).
- Mudança no fluxo de email (template, remetente, webhook) → **C**.
- Mudança na política de IP → **C** + ADR-008.
- Anti-SPEC §6.5 — toda rota com IO externo (form input + Sheets + email) precisa Zod 100%.

## §6 ADRs e referências

- **ADR-008 (candidato)** — política `ip_hash` vs `ip_address` texto (backlog TODO §2).
- `docs/decisions/adr/ADR-004` — compliance via guardrails (afeta texto exibido pós-submit).

## §7 Runbooks relacionados

- `docs/wiki/runbooks/secrets-rotation.md` — `GOOGLE_PRIVATE_KEY`, `RESEND_API_KEY`, SMTP credentials.
- `docs/wiki/runbooks/sheets-debug.md` (a criar) — quando linhas não aparecem no Sheets.
- `docs/wiki/runbooks/lead-replay.md` (a criar) — reenviar lead que falhou em Sheets/email.

## §8 Pontos de atenção atuais

- **BUG-001 (P2, D)** — credencial Google service account no histórico Git. Afeta TODOS os 5 fluxos via `src/lib/google-sheets.ts`.
- **`ebook_leads` órfã** — schema fora de migrations. Backlog TODO §2 classe C.
- **`Lead` (`/api/lead`)** — `[VERIFICAR]` nome real e schema. Provavelmente órfã também.
- **Falha graciosa em `/api/contato`** — `[VERIFICAR]` se Sheets-down OR email-down bloqueia o submit ou se grava no Supabase mesmo assim.
- **Sem rate limiting** declarado em qualquer endpoint público — `[VERIFICAR]` se há proteção via Vercel ou se é gap.
- **Sem testes** para endpoints de lead nem para componentes de form.
- **5 formulários, 5 caminhos de persistência** — sem trilha unificada de auditoria além do `git log` de leads no Supabase.
- **Nome `Client` em vez de `Lead`** — comentário "tabela Lead não existe" (`api/lead/route.ts:41`) sugere refator pendente. Dívida de naming; renomear exige migration. Por enquanto, `Client` permanece como nome real em produção.
- **BUG-006 (C, P3)** — Sem rate limiting em qualquer endpoint público de lead. Risco DDoS + spam.
