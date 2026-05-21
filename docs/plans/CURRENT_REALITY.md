# CURRENT_REALITY.md — site-ldc (snapshot 2026-05-20)

> **Última revisão: 2026-05-21.** Reorganização Harness v3.2 concluída. Próximo refresh: após próxima feature classe C/D que mude o inventário (CURRENT_REALITY é vivo — atualizar quando inventário mudar).
>
> O que o repo FAZ hoje, lido do código. Sem aspiração, sem auditoria, sem proposta.
> Fonte primária: `src/`, `supabase/migrations/`, `vercel.json`, `package.json`. Qualquer afirmação sem citação direta vira `[VERIFICAR COM HUMANO]` em §10.

---

## §1 Stack atual

| Camada | Versão / política | Fonte |
|---|---|---|
| Framework | Next.js 15.5.3 (App Router) | `package.json:56` |
| Runtime React | 19.1.0 | `package.json:65` |
| Linguagem | TypeScript 5 (strict) | `package.json:99`, `tsconfig.json:7` |
| Path alias | `@/*` → `./src/*` | `tsconfig.json:21-23` |
| Styling | Tailwind 4 + `@tailwindcss/postcss` + Radix UI + shadcn | `package.json:80,95`, `components.json` |
| Testes | Vitest 4.1.5 + `@testing-library/react` 16 + jsdom 29 | `package.json:91,100`, `vitest.config.ts` |
| DB / Auth | Supabase (`@supabase/ssr@0.7`, `@supabase/supabase-js@2.57`) | `package.json:39-40` |
| Storage | Vercel Blob (`@vercel/blob@2.3`) **+** Supabase Storage (bucket `ldc-assets`) | `package.json:43`, `.env.example:5` |
| IA | OpenAI 6.10, Perplexity HTTP direto, Google Generative AI 0.24, pdfjs-dist 5.4 | `package.json:60,52,63` |
| Email | Resend 6.7 (canônico) + Nodemailer 7.0.6 (fallback SMTP) | `package.json:72,59` |
| MDX legacy | `@next/mdx@15.5`, `@mdx-js/loader@3.1`, `next-mdx-remote@6.0`, `gray-matter@4.0` | `package.json:28,26,57,53` |
| Charts / PDF | Recharts 2.12 · `@vercel/og@0.11` · `canvas@3.2` · `pdf-parse@2.4` · `playwright@1.57` (PDF render) | `package.json:71,44,45,62,64` |
| Form / validação | React Hook Form 7.63 · Zod 4.1 · Yup 1.7 · `@hookform/resolvers@5.2` | `package.json:67,77,76,25` |
| Lint policy (dívida) | `next.config.ts:6` — `eslint.ignoreDuringBuilds: true` (build não bloqueia por warning) | `next.config.ts:4-7` |
| `tsc` policy | Build não ignora erros TS (linha 21-24 está comentada) | `next.config.ts:21-24` |

---

## §2 Features ativas em produção

### 2.1 Site institucional público (home + páginas estáticas)
Home (`src/app/page.tsx`) compõe `Header / Hero / DirectionSection / QuoteSection / ServicesGridPremium / TestimonialsCarousel / FAQ / LeadForm / Footer`. Páginas adicionais: `/consultoria`, `/equipe`, `/contato`, `/diagnostico-gratuito`, `/trabalhe-conosco`, `/informacoes-regulatorias`, `/politica-privacidade`, `/termos-de-uso`. Estáticas e isoladas; classe típica de mudança = **A** (copy, asset) ou **B** (novo componente Radix).

### 2.2 Blog CMS (BlogPost Supabase + admin)
Render público em `src/app/blog/page.tsx` (client component) + `src/app/blog/[slug]/page.tsx`. Lista/categorias consumidas via `/api/blog/posts` e `/api/blog/categories` (`src/app/api/blog/*/route.ts` ambos GET, retornam `[]` em erro — fallback silencioso). Backend: tabela `BlogPost` no Supabase (com colunas `slug, title, content, summary, category, cover, published, publishedAt, readingTime, updatedAt`). Admin em `/admin/posts` (lista, novo, editar) protegido por `checkAdminAuth` em todas as rotas `/api/admin/posts*`. **`published=true` tem 2 caminhos coexistentes em produção:** (a) F-018 via token de aprovação por email (Marcos clica em `/api/posts/approve`); (b) admin manual em `/admin/posts/edit/[id]` muda a flag diretamente. Classe típica = **B** (ajuste CMS), **C** se mexer em RLS de `BlogPost`.

### 2.3 Pipeline IA `/news` → BlogPost (F-007/F-008/F-015/F-016/F-018)
Orchestrator em `src/features/news/pipeline/orchestrator.ts`. Disparado por `vercel.json` cron 2x/dia (10h + 17h UTC) via `/api/news/cron` (`src/app/api/news/cron/route.ts`). Fluxo (cabeçalho do orchestrator):
1. `recordPipelineRun` → run em `news_pipeline_runs` status='running'.
2. `listLatestBloombergPdfs` (até 4 PDFs em Supabase Storage `bloomberg-pdfs`).
3. `extractPdf` paralelo com fallback Gemini para raster.
4. `getQueriesForTurno` + `queryPerplexity` paralelo.
5. Filtra Perplexity por `has_public_coverage=true` (Anti-SPEC §6.2b).
6. `generateBlogArticles` via `openai-client.ts` (Structured Outputs + hard fail R$5).
7. Para cada artigo: `runComplianceCheck` → idempotência via slug → `insertBlogPost(published=false)` (Marcos aprova via F-018).
8. `updatePipelineRun` final com métricas.

Auth: `CRON_SECRET` timing-safe. Feature flag: `NEWS_PIPELINE_ENABLED` (default false). Cobre RF-005..RF-008 técnico, RF-015 telemetria. Pipeline insere com `published=false`; aprovação humana via F-018 (token email Marcos) — ver §2.2 para o caminho alternativo de publicação manual. Classe de mudança = **D**.

### 2.4 Carrossel social `/news` → BlogPost (F-019)
Generator em `src/features/news/carousel/generator.ts`. Acionado pelo admin via POST `/api/admin/posts/[id]/carousel/route.ts`:
1. `checkAdminAuth` → 401.
2. `generateCarouselScript` (OpenAI Structured Outputs + re-validação `CarouselScriptStrict`).
3. `checkCarouselCompliance` (engine F-005 + hashtag Bloomberg check).
4. `generateImagesForSlides` (DALL-E 3 para slides 1/3/6; fallback text-only).
5. `renderCarouselAllVariations` → 12 PNGs (6 LDC + 6 Luciano).
6. `packCarouselZip` → buffer único.
7. INSERT em `carousel_runs` (status='success' / 'compliance_blocked' / 'failed').

Decisões: ADR-006 (X-mock screenshot, 2 variações, DALL-E 3 R$1 guard) e ADR-007 (disclaimer literal NÃO entra em slide/caption). **F-019 em produção desde 2026-05-09** (ADR-006); cron `0 5 * * *` UTC de cleanup do bucket `blog-carousels` ativo. Classe = **D**.

### 2.5 Calculadora de tributação de dividendos 2026
Página `src/app/calculadora-tributacao-dividendos-2026/page.tsx` (server component, `robots: noindex/nofollow`). Componente `DividendTaxCalculator` em `src/components/dividend-tax/`. Backend:
- `/api/dividend-tax/calculate/route.ts` — POST, valida com `dividendTaxSimulationInputSchema` (Zod), executa `calculateDividendTax` em `src/lib/dividend-tax/calculator.ts`.
- `/api/dividend-tax/lead/route.ts` — POST, captura lead pós-cálculo, mapeia range de dividendos para Sheets.
- `/api/dividend-tax/report/route.ts` — POST, gera HTML report + PDF via Playwright.

Libs: `src/lib/dividend-tax/{calculator,alerts-engine,constants,tax-constants,pdf-generator,report-template,types,validators}.ts`. Testes em `src/lib/dividend-tax/__tests__/`. Lei 15.270/2025. Classe típica = **C** (cálculo fiscal).

### 2.6 Simulador PGBL
Página `src/app/pgbl-simulator/page.tsx` (client component) consumindo `calcularPGBL` de `src/lib/pgbl/calculations.ts`. Backend:
- `/api/pgbl-simulator/pdf/route.ts` — POST protegido por `checkAdminAuth` (gera PDF só para admins). Recebe `inputs`, `result`, `nomeConsultor`, `nomeLead`.

Regras: limite dedução 12% renda bruta, diferimento IR, tabela regressiva/progressiva. Classe = **C** (fiscal) para mudanças no cálculo, **B** para UI.

### 2.7 Wealth Planning (admin)
Página pública `/wealth-planning` (`src/app/wealth-planning/page.tsx`) é showcase do `MeetingWizard` (componente `src/components/wealth-planning/v2/MeetingWizard.tsx`). Geração de PDF v2 via `openPDFv2` em `src/lib/wealth-planning/pdf-generator-v2.ts`. Cálculos: `runStressTests`, `generateActionPlan`, `calculateRealRate`, etc. em `src/lib/wealth-planning/calculations.ts`. Feature flags em `src/lib/feature-flags.ts`: `WEALTH_PLANNING_V2`, `WEALTH_PLANNING_STRESS_TESTS`, `WEALTH_PLANNING_PDF_V2`, `WEALTH_PLANNING_SUCCESSION_THRESHOLD` (default R$2M).

Admin extensivo em `/admin/wealth-planning/` (clients, scenarios, compare, results). APIs em `/api/admin/wealth-planning/clients` e `/api/admin/wealth-planning/scenarios` (CRUD + `[id]/calculate` + `[id]/pdf`), todas protegidas por `checkAdminAuth`. Classe típica = **C** (cálculo + dados de cliente).

### 2.8 Materiais (admin + público)
Render público em `/materiais` (`src/app/materiais/page.tsx`, client component) e `/materiais/[slug]`. APIs públicas: `/api/materials` (GET) e `/api/material-categories` (GET) consumindo `getMaterials` e `getMaterialCategories` de `src/app/lib/materials.ts`. Admin: `/admin/materials/{page,new,edit/[id]}` + `/api/admin/materials/{route,[id]/route}` (CRUD com `checkAdminAuth`). Tabela `Material` no Supabase com `slug, title, description, content, category, type, cover, fileUrl, published`. Classe típica = **B**.

### 2.9 Lead capture (contato, diagnóstico, ebook, guia)
- **`/api/contato/route.ts`** — POST, valida com Zod inline (nome, email, titulo, mensagem). Envia para Google Sheets + email via Resend/SMTP.
- **`/api/lead/route.ts`** — POST, valida com `leadFormSchema` de `src/app/lib/schema.ts`. Persiste no Supabase via `createSupabaseAdminClient`.
- **`/diagnostico-gratuito`** — `robots: noindex/nofollow` (página de campanha). Reusa `LeadForm`.
- **`/ebook-investimentos-internacionais`** — landing dedicada com `FormSection` e tabela `ebook_leads` (lib `src/lib/ebook-leads/`).
- **`/guia` + `/guia-pdf`** — landing page com `GuiaLeadForm` + página de visualização HTML do PDF. Tabela `guia_leads` (migration `20260519000000_create_guia_leads.sql`).

Integração Sheets via service account em `ldc-project-476717-b9cd681b3bfa.json` (ver BUG-001 §9 / TODO §5). Classe típica = **B** (form novo) ou **C** (mudança no Sheets/Resend).

### 2.10 Painel `/admin` (auth + dashboard + settings)
Login: `/admin/login/page.tsx` chama `signIn` de `src/lib/auth-supabase.ts` (`signInWithPassword`). Auth helper: `checkAdminAuth` em `src/lib/auth-check.ts` valida sessão Supabase SSR e retorna `User | null`. Tabelas tocadas para definir papel = `[VERIFICAR COM HUMANO]` (provavelmente tabela `User` ou metadata Supabase Auth — não vi a migration). Dashboard em `/admin/dashboard`, settings em `/admin/settings`. Inclui `/admin/bloomberg-pdfs` (UI para upload + trigger pipeline). Classe típica = **C** (auth + dados sensíveis).

---

## §3 Integrações externas + envs sensíveis

| Serviço | Uso | Env vars | Cliente / arquivo | Classe mínima de mudança |
|---|---|---|---|---|
| Supabase Auth | Admin login + sessão SSR | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase.ts`, `supabase-server.ts`, `auth-supabase.ts`, `auth-check.ts` | C |
| Supabase Storage | Bucket default `ldc-assets` (mídia admin genérica, configurado por `SUPABASE_STORAGE_BUCKET`); buckets dedicados: `bloomberg-pdfs` (signed upload IA), `blog-carousels` (ZIPs F-019) | `SUPABASE_STORAGE_BUCKET` | `src/lib/supabase-storage-admin.ts` | C |
| Vercel Blob | Legacy (migrado para Supabase Storage em 2026-05-08 conforme cabeçalho de `bloomberg-pdfs/upload/route.ts`) | — | `@vercel/blob` dep ainda presente | B |
| Google Sheets | Captura de leads (contato, dividend-tax, ebook, guia) | `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` + `ldc-project-*.json` (BUG-001) | `src/lib/google-sheets.ts` | C |
| Resend | Email transacional (lead notification, ebook, F-018 aprovação) | `RESEND_API_KEY`, `EBOOK_FROM_EMAIL`, `EBOOK_FROM_NAME`, `CONTATO_EMAIL` | `src/lib/email.ts` | C |
| SMTP (Nodemailer) | Fallback se Resend falhar | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | `src/lib/email.ts` | C |
| OpenAI | Geração de artigos (Structured Outputs) + carrossel + DALL-E 3 | `OPENAI_API_KEY` | `src/features/news/pipeline/openai-client.ts`, `src/features/news/carousel/generator.ts` | D |
| Perplexity Sonar Pro | Fontes públicas citáveis | `PERPLEXITY_API_KEY` | `src/features/news/pipeline/perplexity-client.ts` | D |
| Google Gemini 2.5 | Fallback extração de PDF raster Bloomberg | `GOOGLE_GEMINI_API_KEY` | `src/features/news/pipeline/gemini-fallback.ts` | D |
| Vercel Cron | 5 schedules (ver §6) | — | `vercel.json` | D |
| Cron secret | Auth de cron endpoints | `CRON_SECRET` | timing-safe equal em todas as rotas cron | D |
| Pipeline feature flag | Liga/desliga IA | `NEWS_PIPELINE_ENABLED` (default `false`) | `/api/news/cron/route.ts` | D |
| IP hash salt | Telemetria SHA-256 do IP | `NEWS_IP_HASH_SALT` (opcional) | `src/features/news/telemetry/` | C |
| F-018 aprovação | Token + destinatários | `NEWS_APPROVAL_RECIPIENT_EMAIL`, `NEWS_APPROVAL_CC_EMAILS` | `src/features/news/notifications/approval-handler.ts` | C |
| Meta Pixel | Tracking de leads | `NEXT_PUBLIC_META_PIXEL_ID` | `src/components/Analytics.tsx` | A |
| WhatsApp | Botão flutuante | `NEXT_PUBLIC_WHATSAPP_LDC` | `src/components/WhatsAppButton.tsx` | A |
| Site URL canônico | sitemap + JSON-LD | `NEXT_PUBLIC_SITE_URL` | `sitemap.ts`, `robots.ts`, `lib/schema.ts` | A |
| Admin seed | Setup inicial | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_SYNC_PASSWORD` | `/api/setup-admin/route.ts`, `/api/admin/add-users/route.ts` | C |
| DATABASE_URL | (env presente mas sem cliente Prisma no `package.json`) | `DATABASE_URL` | `[VERIFICAR COM HUMANO]` §10.1 | — |

---

## §4 Rotas Next.js

### 4.1 Rotas públicas (App Router)

| Path | Arquivo | Render | Domínio sensível? |
|---|---|---|---|
| `/` | `src/app/page.tsx` | server | — |
| `/blog` | `src/app/blog/page.tsx` | client | — |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | server (assumido) | cvm/copy |
| `/consultoria` | `src/app/consultoria/page.tsx` | server | — |
| `/contato` | `src/app/contato/page.tsx` | server | — |
| `/diagnostico-gratuito` | `src/app/diagnostico-gratuito/page.tsx` | server (noindex) | — |
| `/ebook-investimentos-internacionais` | `src/app/ebook-investimentos-internacionais/page.tsx` | server | — |
| `/equipe` | `src/app/equipe/page.tsx` | server | — |
| `/guia` | `src/app/guia/page.tsx` | server | — |
| `/guia-pdf` | `src/app/guia-pdf/page.tsx` | client (render PDF HTML) | pública mas **não indexada** (fora do sitemap) — print-to-PDF do browser |
| `/informacoes-regulatorias` | `src/app/informacoes-regulatorias/page.tsx` | client | cvm |
| `/materiais` | `src/app/materiais/page.tsx` | client | — |
| `/materiais/[slug]` | `src/app/materiais/[slug]/page.tsx` | server (assumido) | — |
| `/calculadora-tributacao-dividendos-2026` | `src/app/calculadora-tributacao-dividendos-2026/page.tsx` | server (noindex) | cvm |
| `/pgbl-simulator` | `src/app/pgbl-simulator/page.tsx` | client | cvm |
| `/wealth-planning` | `src/app/wealth-planning/page.tsx` | client | cvm |
| `/politica-privacidade` | `src/app/politica-privacidade/page.tsx` | server | cvm |
| `/termos-de-uso` | `src/app/termos-de-uso/page.tsx` | server | cvm |
| `/trabalhe-conosco` | `src/app/trabalhe-conosco/page.tsx` | client | — |
| `/sitemap.xml` | `src/app/sitemap.ts` | dinâmico (lê Supabase) | — |
| `/robots.txt` | `src/app/robots.ts` | dinâmico (estático) | — |

### 4.2 Rotas admin (protegidas — disallow em robots.ts:13)

| Path | Arquivos |
|---|---|
| `/admin/login` | `src/app/admin/login/page.tsx` |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` |
| `/admin/posts` | `page.tsx`, `new/page.tsx`, `edit/[id]/page.tsx` |
| `/admin/categories` | `page.tsx` |
| `/admin/materials` | `page.tsx`, `new/page.tsx`, `edit/[id]/page.tsx` |
| `/admin/bloomberg-pdfs` | `page.tsx` |
| `/admin/wealth-planning` | `page.tsx`, `clients/{new,[id]/page,[id]/edit}`, `scenarios/{new,[id]/edit,[id]/results}`, `compare/page.tsx` |
| `/admin/settings` | `page.tsx` |

### 4.3 Rotas API

| Path | Método | Arquivo | Auth | Domínio sensível |
|---|---|---|---|---|
| `/api/auth/callback` | POST | `src/app/api/auth/callback/route.ts` | sessão Supabase | auth |
| `/api/contato` | POST | `src/app/api/contato/route.ts` | público | leads/cvm |
| `/api/lead` | POST | `src/app/api/lead/route.ts` | público | leads |
| `/api/blog/posts` | GET | `src/app/api/blog/posts/route.ts` | público | — |
| `/api/blog/categories` | GET | `src/app/api/blog/categories/route.ts` | público | — |
| `/api/materials` | GET | `src/app/api/materials/route.ts` | público | — |
| `/api/material-categories` | GET | `src/app/api/material-categories/route.ts` | público | — |
| `/api/dividend-tax/calculate` | POST | `…/calculate/route.ts` | público | cvm |
| `/api/dividend-tax/lead` | POST | `…/lead/route.ts` | público | leads/cvm |
| `/api/dividend-tax/report` | POST | `…/report/route.ts` | público | cvm |
| `/api/pgbl-simulator/pdf` | POST | `…/pdf/route.ts` | `checkAdminAuth` | cvm |
| `/api/posts/approve` | GET | `src/app/api/posts/approve/route.ts` | token único (F-018) | cron/cvm |
| `/api/posts/reject` | GET | `…/reject/route.ts` | token único (F-018) | cron/cvm |
| `/api/posts/cleanup-expired-tokens` | POST/GET | `…/cleanup-expired-tokens/route.ts` | `CRON_SECRET` | cron |
| `/api/news/cron` | POST/GET | `src/app/api/news/cron/route.ts` | `CRON_SECRET` + feature flag | cron/cvm/iam |
| `/api/admin/posts` (+ `[id]`, `[id]/carousel`) | CRUD | `src/app/api/admin/posts/…` | `checkAdminAuth` | cvm |
| `/api/admin/categories` (+ `[id]`) | CRUD | `…/admin/categories/…` | `checkAdminAuth` | cvm |
| `/api/admin/materials` (+ `[id]`) | CRUD | `…/admin/materials/…` | `checkAdminAuth` | — |
| `/api/admin/media` | GET | `…/admin/media/route.ts` | (sem `checkAdminAuth` no cabeçalho) `[VERIFICAR COM HUMANO]` §10.3 | storage |
| `/api/admin/upload` | POST | `…/admin/upload/route.ts` | `checkAdminAuth` | storage |
| `/api/admin/bloomberg-pdfs` (+ `[pathname]`, `upload`, `cleanup`, `trigger-pipeline`) | CRUD | `…/admin/bloomberg-pdfs/…` | `checkAdminAuth` + (cleanup/trigger têm `CRON_SECRET` alternativo) | bloomberg/cron |
| `/api/admin/blog-carousels/cleanup` | POST/GET | `…/admin/blog-carousels/cleanup/route.ts` | `CRON_SECRET` | cron |
| `/api/admin/wealth-planning/clients` (+ `[id]`) | CRUD | `…/wealth-planning/clients/…` | `checkAdminAuth` | clientes |
| `/api/admin/wealth-planning/scenarios` (+ `[id]`, `[id]/calculate`, `[id]/pdf`) | CRUD | `…/wealth-planning/scenarios/…` | `checkAdminAuth` | cvm/clientes |
| `/api/admin/add-users` | POST | `…/admin/add-users/route.ts` | **sem auth no cabeçalho** `[VERIFICAR COM HUMANO]` §10.4 | iam |
| `/api/setup-admin` | POST | `src/app/api/setup-admin/route.ts` | **sem auth no cabeçalho** — script one-shot? `[VERIFICAR COM HUMANO]` §10.5 | iam |

---

## §5 Tabelas Supabase + RLS conhecida

| Tabela | Migration ou origem | Propósito | RLS confirmada? | Quem escreve | Quem lê |
|---|---|---|---|---|---|
| `BlogPost` | (não consta em `supabase/migrations/`) `[VERIFICAR COM HUMANO]` §10.6 | Artigos do blog (CMS + pipeline IA pós-pivot) | `[VERIFICAR COM HUMANO]` (cabeçalho de `news_events.sql` cita "Padrão RLS: replica BlogPost (service_role full access; sem leitura anon/authenticated)") | admin via `checkAdminAuth`, pipeline IA (service role) | `/api/blog/posts`, `/api/blog/categories`, sitemap |
| `Material` | (não consta) `[VERIFICAR COM HUMANO]` §10.6 | Materiais ricos públicos | `[VERIFICAR COM HUMANO]` | admin via `checkAdminAuth` | `/api/materials`, sitemap |
| `Category` / `MaterialCategory` | (não consta) `[VERIFICAR COM HUMANO]` §10.6 | Taxonomia de blog e materiais | `[VERIFICAR COM HUMANO]` | admin | público (GET) |
| `news_events` | `20260427150000_news_telemetry.sql` | Telemetria de eventos (view/share/cta/digest) com `ip_hash` SHA-256 | sim (RLS replica BlogPost) | server-side via service role | tabela de log — leitura ad-hoc via Supabase Studio hoje (sem UI admin que faz SELECT) |
| `news_pipeline_runs` | `20260427150000_news_telemetry.sql` | Auditoria de execuções do pipeline (status, métricas, custo) | sim (cabeçalho cita padrão) | orchestrator (service role) | admin (futuro UI?) |
| `news_pipeline_errors` | `20260427150000_news_telemetry.sql` | Erros estruturados do pipeline | sim | orchestrator | admin |
| `news_publications` | `20260429120100_news_publications.sql` | Auditoria de publicações (SHA do commit GitHub; permanece para auditoria histórica pós-pivot) | sim | (legacy, F-008 descontinuada) | auditoria |
| `idx_news_pipeline_runs_status_triggered` (índice) | `20260429120000_news_pipeline_lock_index.sql` | Lock distribuído entre cron concorrente | — | — | — |
| `guia_leads` | `20260519000000_create_guia_leads.sql` | Leads do guia (`nome`, `whatsapp`, `email`, `patrimonio_range`, `qualificado`, `ip_address`, `user_agent`) | `[VERIFICAR COM HUMANO]` §10.8 — migration não mostra `CREATE POLICY` no head lido | `/api/lead` + form guia | admin (?) |
| `ebook_leads` | (provável `scripts/ebook-leads-schema.sql` aplicada manualmente) `[VERIFICAR COM HUMANO]` §10.9 | Leads do ebook | `[VERIFICAR COM HUMANO]` | landing ebook | admin (?) |
| `carousel_runs` | (não consta em `supabase/migrations/`) `[VERIFICAR COM HUMANO]` §10.10 | Auditoria F-019 (script + cost + slides + status) | `[VERIFICAR COM HUMANO]` | `/api/admin/posts/[id]/carousel` | admin |
| `BlogPostApprovalToken` | (não consta) `[VERIFICAR COM HUMANO]` §10.11 | Token de aprovação F-018 (Marcos), TTL 7d | `[VERIFICAR COM HUMANO]` | pipeline + `posts/approve|reject` + cron cleanup | server-side |
| Wealth Planning tables (clients, scenarios) | (não consta em `supabase/migrations/`) `[VERIFICAR — junto §10.6]` | CRUD do módulo admin | `[VERIFICAR]` | `/api/admin/wealth-planning/*` | admin |
| **`User`** (TAB-ÓRFÃ-9) | (não consta em `supabase/migrations/`) | Espelho do `user_metadata.role` mantido por UPSERT em `auth-check.ts:36-47`. Colunas: `id, email, name, role`. **Single source operacional ainda é `user_metadata`** (`auth-check.ts:32-33`); tabela é fallback se metadata vazio (linha 56) | `[VERIFICAR]` | UPSERT a cada `checkAdminAuth` | `checkAdminAuth` (fallback) |
| **`Client`** (TAB-ÓRFÃ-10) | (não consta em `supabase/migrations/`) | Persistência de leads do `/api/lead` — comentário `route.ts:41` diz "tabela `Lead` não existe". Insert `(name, email, phone, notes)` com notes concatenando patrimônio + origem + IP (`route.ts:42-51`) | `[VERIFICAR]` | `/api/lead` | admin (Supabase Studio) |

**Achado:** as únicas tabelas com migration versionada são `news_events`, `news_pipeline_runs`, `news_pipeline_errors`, `news_publications` e `guia_leads` (5). Todo o resto — **10 tabelas órfãs** (`BlogPost`, `Material`, `Category`, `MaterialCategory`, `BlogPostApprovalToken`, `carousel_runs`, `ebook_leads`, `wealth_planning_clients`/`_scenarios`, `User`, `Client`) — foi criado fora desta esteira (Supabase Studio? scripts em `scripts/supabase-schema.sql` e `scripts/ebook-leads-schema.sql`?). Ver §9.10 + §10.

---

## §6 Cron jobs Vercel (5)

| Schedule (UTC) | BRT | Endpoint | Arquivo | Env vars | Tabelas tocadas | Efeito |
|---|---|---|---|---|---|---|
| `0 10 * * *` | 07h | `/api/news/cron` | `src/app/api/news/cron/route.ts` | `CRON_SECRET`, `NEWS_PIPELINE_ENABLED`, IA keys | `news_pipeline_runs`, `news_pipeline_errors`, `BlogPost`, `BlogPostApprovalToken` | Pipeline IA matinal |
| `0 17 * * *` | 14h | `/api/news/cron` | idem | idem | idem | Pipeline IA vespertino |
| `0 3 * * *` | 00h | `/api/posts/cleanup-expired-tokens` | `…/cleanup-expired-tokens/route.ts` | `CRON_SECRET` | `BlogPostApprovalToken` (pending → expired após 7d) | Limpeza F-016/DEBT-011 |
| `0 4 * * *` | 01h | `/api/admin/bloomberg-pdfs/cleanup` | `…/bloomberg-pdfs/cleanup/route.ts` | `CRON_SECRET`, `SUPABASE_*` | Storage bucket `bloomberg-pdfs` (TTL 30d) | Anti-SPEC §6.2b enforcement |
| `0 5 * * *` | 02h | `/api/admin/blog-carousels/cleanup` | `…/blog-carousels/cleanup/route.ts` | `CRON_SECRET`, `SUPABASE_*` | Storage bucket `blog-carousels` (TTL 90d) | F-019 retention |

Todos com auth `CRON_SECRET` timing-safe equal. Cabeçalho de cada arquivo cita justificativa e escalonamento (cleanups intercalados para não sobrecarregar).

---

## §7 Cobertura de testes

**Há teste hoje em (`src/**/__tests__/`):**
- `src/lib/dividend-tax/__tests__/` — calculator + alerts + validators.
- `src/lib/wealth-planning/__tests__/` — calculations + validations.
- `src/features/news/pipeline/__tests__/` — orchestrator, openai-client, perplexity-client, extractor, pdf-storage, blogpost-db, blocked-draft-storage, format-detector, cover-image-gen, gemini-fallback.
- `src/features/news/carousel/__tests__/`.
- `src/features/news/compliance/__tests__/`.
- `src/features/news/prompts/__tests__/`.
- `src/app/__tests__/` (existe segundo `ls`, conteúdo não inspecionado em detalhe).

**NÃO há teste para:**
- Rotas admin (qualquer `src/app/admin/**`).
- Lead capture (formulários `/contato`, `/diagnostico-gratuito`, `/ebook-*`, `/guia`).
- `/pgbl-simulator` (UI + cálculo) — `src/lib/pgbl/calculations.ts` sem `__tests__/`.
- Componentes em `src/components/` (não vi `__tests__/` por amostragem).
- Fluxos e2e (Playwright instalado mas sem specs versionados).

**Config Vitest:**
- `vitest.config.ts:12-15` — `include: ["src/**/__tests__/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"]`.
- `vitest.config.ts:16` — `exclude: ["node_modules", ".next", "scripts", "wealth-planning"]`. A entrada `"wealth-planning"` refere-se à **pasta órfã `wealth-planning/` na raiz do repo** (planejamentos `.xlsm` + `.md`); `src/lib/wealth-planning/__tests__/` continua coberto via glob.

---

## §8 Restrições de produção (intocáveis sem migration plan + ADR)

**Tabelas:** `BlogPost`, `Material`, `Category`, `MaterialCategory`, `BlogPostApprovalToken`, `news_pipeline_runs`, `news_pipeline_errors`, `news_publications`, `news_events`, `carousel_runs`, `guia_leads`, `ebook_leads`, wealth-planning tables.

**APIs intocáveis:** `/api/admin/*`, `/api/news/cron`, `/api/dividend-tax/*`, `/api/pgbl-simulator/*`, `/api/lead`, `/api/contato`, `/api/auth/callback`, `/api/posts/{approve,reject,cleanup-expired-tokens}`, `/api/blog/*`, `/api/materials`, `/api/material-categories`.

**Envs sensíveis:** `CRON_SECRET`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `NEWS_PIPELINE_ENABLED`, `NEWS_IP_HASH_SALT`, `NEWS_APPROVAL_RECIPIENT_EMAIL`, `NEWS_APPROVAL_CC_EMAILS`, `EBOOK_FROM_EMAIL`, `EBOOK_FROM_NAME`, `ADMIN_*`, `SMTP_*`.

**Cron:** `vercel.json` é **congelado** fora de feature D explícita.

**Prompt IA:** `src/features/news/prompts/*` é **congelado** fora de C/D explícita (Anti-SPEC §6.3 + ADR-007).

**Migrations:** `supabase/migrations/*.sql` exige migration plan + ADR para qualquer alteração.

---

## §9 Dívida técnica conhecida (LISTAR, não corrigir)

1. **BUG-001 (TODO §5)** — Credencial Google `ldc-project-476717-b9cd681b3bfa.json` commitada no histórico Git antes da entrada do pattern em `.gitignore:37`. **Eduardo NÃO rotacionou ainda — permanece TRIADO.** Runbook em `docs/wiki/runbooks/secrets-rotation.md`.
2. **BUG-002 (TODO §5) — RESOLVIDO em 27d87a3 (2026-05-20)** — `/api/setup-admin` deletado via fast-fix em sessão paralela. Deploy Vercel validado por `curl -i -X POST https://ldccapital.com.br/api/setup-admin` → 404. Seed admin permanece via `scripts/sync-admin-users.ts`.
3. **BUG-003 (TODO §5)** — `/api/admin/add-users` SEM auth, cria 3 admins fixos com senha default `LdcBlog2026`. Modo: standard, adicionar `checkAdminAuth` ou mover para `scripts/sync-admin-users.ts`.
4. **BUG-004 (TODO §5)** — `/api/admin/media` SEM `checkAdminAuth` no GET handler. Gap arquitetural (bucket público hoje, não vaza dados). Modo: standard, próxima feature B do módulo mídia.
4b. **BUG-005 (TODO §5)** — `/api/dividend-tax/report` SEM rate limiting; Playwright é caro (CPU + memória); DDoS trivial. Classe C, P2. Modo: standard, padronizar limiter por IP.
4c. **BUG-006 (TODO §5)** — Sem rate limiting nos 5 endpoints públicos de lead capture (`/api/lead`, `/api/contato`, `/api/dividend-tax/{calculate,lead}`, ebook, guia). Classe C, P3. Co-implementar com BUG-005.
4d. **BUG-007 (TODO §5)** — `/api/pgbl-simulator/pdf` valida só presença `inputs && result` sem Zod — viola Anti-SPEC §6.5. Classe C, P3. Próxima feature B/C que tocar PGBL adiciona schema.
5. **`next.config.ts:4-7`** — `eslint.ignoreDuringBuilds: true`. Build não bloqueia warnings ESLint; lint local é obrigatório. (Backlog TODO §2.)
6. **`wealth-planning/`** órfão na raiz do repo (4 `.md` + 1 `.xlsm`) — planejamentos operacionais do dono. (Backlog TODO §2.)
7. **Zod espalhado** em `src/features/news/contracts/`, `src/lib/dividend-tax/{types,validators}.ts`, `src/lib/wealth-planning/validations.ts`, `src/app/lib/schema.ts`, `src/lib/schema.ts`. Alvo de consolidação: `packages/shared/types/`. (Backlog TODO §2.)
8. **Cobertura de teste irregular** — rotas admin, lead capture, pgbl-simulator, componentes UI sem `__tests__/`. (Backlog TODO §2.)
9. **Submódulo Git aninhado** — operações versionadas exigem 2 níveis de commit (`AGENTS.md §13`).
10. **10 tabelas Supabase fora de `supabase/migrations/`** (MAIOR risco arquitetural) — `BlogPost`, `Material`, `Category`, `MaterialCategory`, `BlogPostApprovalToken`, `ebook_leads`, `carousel_runs`, `wealth_planning_clients`/`wealth_planning_scenarios`, **`User`** (espelho de metadata), **`Client`** (usado por `/api/lead` em vez de `Lead`). Provavelmente criadas via Supabase Studio ou `scripts/supabase-schema.sql` + `scripts/ebook-leads-schema.sql` aplicados manualmente. Risco: drift entre staging/prod, divergência de RLS, ausência de auditoria de schema. Backlog TODO §2 classe C: "Versionar **10** schemas órfãos em `supabase/migrations/*` (SQL idempotente, sem alterar produção)". 4 ADRs candidatos: política de schema versionada, ip_hash vs ip texto (ADR-008), bucket único `ldc-assets` vs dedicated, role em user_metadata vs tabela `User`.
11. **`DATABASE_URL` + `NEXTAUTH_*`** em `.env.example:7-16` são legacy Prisma/NextAuth pré-Supabase. `package.json` não tem `@prisma/client` nem `next-auth`. Comentários órfãos. Diretório `.data/` (out/2025) é o SQLite dev daquela fase. (Backlog TODO §2 — classes A + B.)
12. **`bash.exe.stackdump`** (1.4 KB, 2026-04-28) versionado/órfão na raiz. Lixo de crash de shell — apagar é seguro. (Backlog TODO §2 classe A.)
13. **Snapshot legacy `site-ldc/site-ldc/site-ldc/`** (jan/2025) dentro do repo principal. Conteúdo provável: backup pré-reset. (Backlog TODO §2 classe B — arquivar em `docs/_archive/legacy-jan-2025/` ou apagar.)
14. **Scripts em `scripts/`** com vários `.ts`/`.sh`/`.js` heterogêneos (seed, sync-admin, setup-storage, test-* scripts). Sem README, sem categorização. Excluídos do `tsconfig.json:26` e `vitest.config.ts:16`. (Não corrigir agora.)

---

## §10 Itens [VERIFICAR COM HUMANO] — status pós-Fase 2

> Atualizado 2026-05-20 com respostas do Eduardo. Status: **[RESOLVIDO]** documenta confirmação, **[VIROU BUG-NNN]** moveu para TODO §5, **[PERMANECE]** aguarda sessão futura.

1. **`DATABASE_URL` em `.env.example`** — [RESOLVIDO] Legacy Prisma pré-Supabase. `.data/` é o SQLite local daquela fase. Backlog TODO §2 (classes A+B) cobre limpeza.

2. **`/guia-pdf` (rota pública vs interna)** — [RESOLVIDO] Pública mas não indexada (não está em sitemap; print-to-PDF do browser). §4.1 atualizado.

3. **`/api/admin/media` sem auth** — [VIROU BUG-004] Classe C, P2. Sem corrigir nesta sessão.

4. **`/api/admin/add-users` sem auth** — [VIROU BUG-003] Classe D, P1. Sem corrigir nesta sessão.

5. **`/api/setup-admin` sem auth** — [VIROU BUG-002] **Classe D, P0**. Cria admin hardcoded + retorna senha no JSON. Aguardando Eduardo confirmar se rota está exposta em produção; se confirmado, P0-emergência → fast-fix imediato em sessão paralela.

6. **Schemas autoritativas de `BlogPost`/`Material`/`Category`/`MaterialCategory`** — [PERMANECE — VERIFICAR COM EDUARDO] Provavelmente Supabase Studio ou `scripts/supabase-schema.sql`. Item de §9.10 + backlog TODO §2 classe C ("Versionar 8 schemas Supabase órfãos").

7. **`news_events` — quem lê?** — [RESOLVIDO POR ENQUANTO] Tabela de log; leitura ad-hoc via Supabase Studio. §5 atualizado. Confirmar em sessão futura se há UI admin que faz SELECT.

8. **RLS + `ip_address` texto puro em `guia_leads`** — [PERMANECE — ADR-008 CANDIDATO] Decisão proposital provável: telemetria de leitor (`news_events`) usa `ip_hash`; lead capture com consentimento explícito (`guia_leads`) usa `ip_address` texto. Promover a ADR após confirmação. Item B no backlog TODO §2.

9. **`ebook_leads` schema** — [PERMANECE — junto de §10.6] Provavelmente `scripts/ebook-leads-schema.sql` aplicada via Studio. Versionar junto.

10. **`carousel_runs` schema** — [PERMANECE — junto de §10.6] F-019 escreve em produção. Schema fora das migrations.

11. **`BlogPostApprovalToken` schema + TTL 7d** — [RESOLVIDO PARCIAL] TTL 7d confirmado pelo cabeçalho de `cleanup-expired-tokens/route.ts`. Schema fora das migrations — junto de §10.6.

12. **Wealth Planning tables** — [PERMANECE — junto de §10.6 + LGPD] Nomes prováveis: `wealth_planning_clients`, `wealth_planning_scenarios`. Versionamento com nota especial: dados de cliente real (LGPD aplicável).

13. **Origem do `role` em `User`** — [RESOLVIDO] Confirmado: `auth-supabase.ts:64-69` (`getCurrentUser`) lê `user.user_metadata.role || 'USER'`. `/api/setup-admin/route.ts:11-15` grava `user_metadata: { role: 'ADMIN' }`. Single source = Supabase Auth metadata, sem tabela separada. Será documentado em `docs/wiki/modules/auth-admin.md` (Fase 3).

14. **`bash.exe.stackdump`** — [RESOLVIDO] Lixo de crash. Backlog TODO §2 classe A para apagar + pattern `*.stackdump` no `.gitignore`.

15. **`site-ldc/site-ldc/site-ldc/` legacy** — [RESOLVIDO] Confirmado snapshot jan/2025. §9.13 + backlog TODO §2 classe B (arquivar ou apagar).

16. **`.data/`** — [RESOLVIDO] SQLite dev do tempo do Prisma. Backlog TODO §2 classe A (`gitignore` + `git rm -r --cached`).

17. **`ldc-project-*.json` rotacionado?** — [RESOLVIDO — NÃO ROTACIONADO] BUG-001 permanece TRIADO. Runbook na Fase 4. Decisão definitiva em sessão de security dedicada.

18. **F-019 carrossel em produção?** — [RESOLVIDO] **F-019 EM PRODUÇÃO desde 2026-05-09 (ADR-006)**. `/api/admin/posts/[id]/carousel` live, cron `0 5 * * *` cleanup ativo. §2.4 atualizado.

19. **Caminhos para `BlogPost.published=true`** — [RESOLVIDO] **Coexistem 2 caminhos:** (a) Pipeline IA insere `published=false` → F-018 envia email → Marcos clica `/api/posts/approve` → `published=true`. (b) Admin `/admin/posts/edit/[id]` muda `published` diretamente. §2.2 + §2.3 atualizados.

20. **Bucket real do `/api/admin/upload`** — [RESOLVIDO] Bucket único `ldc-assets` para mídia genérica (`SUPABASE_STORAGE_BUCKET` env). Buckets dedicados: `bloomberg-pdfs` (signed upload IA), `blog-carousels` (ZIPs F-019). §3 atualizado.

---

**FIM — CURRENT_REALITY.md.** Status: 13 itens [RESOLVIDO], 3 [VIROU BUG-002/003/004], 4 [PERMANECE — sessão futura]. Próximo passo: Fase 3 (`/wiki ingest CURRENT_REALITY` → `overview.md` + `architecture.md` + 10 módulos da Wiki).
