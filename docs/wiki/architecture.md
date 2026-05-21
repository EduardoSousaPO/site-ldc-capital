# Architecture — site-ldc

> Síntese técnica viva. Atualizado 2026-05-20.
> Fonte autoritativa: `docs/specs/SPEC.md` (raiz, a criar na Fase 6c) + `docs/specs/spec-pipeline-ia.md` (anexo detalhado do pipeline IA, vigente pós-pivot ADR-005).
> Detalhes com `arquivo:linha`: `docs/plans/CURRENT_REALITY.md`.

## §1 Stack

- **Next.js 15.5.3 App Router** + **React 19.1** + **TypeScript 5 strict**.
- **Tailwind 4** + Radix UI + shadcn (`components.json`).
- **Vitest 4.1.5** + `@testing-library/react` 16 + jsdom 29.
- **Supabase** (Postgres + Auth + Storage) via `@supabase/ssr@0.7` e `@supabase/supabase-js@2.57`.
- **Vercel** hospeda + cron jobs (`vercel.json`).
- Path alias: `@/*` → `src/*`.
- **Dívida ativa:** `next.config.ts:6` `ignoreDuringBuilds: true` (build não bloqueia warnings ESLint).

## §2 Estrutura de pastas relevante

```
src/
├── app/                    App Router (páginas + APIs)
│   ├── api/                ~30 rotas (admin/, news/cron, posts/, blog/, ...)
│   ├── admin/              Painel protegido por checkAdminAuth
│   ├── (rotas públicas)/   blog, materiais, calculadora-*, pgbl-*, wealth-*, ...
│   └── lib/                Libs locais ao app (blog, materials, schema, mdx)
├── features/news/          Pipeline IA (orchestrator, compliance, prompts, carousel)
├── lib/                    Libs gerais (auth, supabase, dividend-tax, wealth-planning, pgbl)
├── components/             UI + dividend-tax + wealth-planning + landing-ebook
├── hooks/, types/, fonts/  Auxiliares
└── middleware.ts           Edge middleware (auth?)
```

## §3 Integrações externas

| Serviço | Uso | Cliente | Classe mínima |
|---|---|---|---|
| Supabase Auth/DB/Storage | Sessão SSR, dados, buckets | `src/lib/supabase{,-server,-storage-admin}.ts` | C |
| OpenAI 6.10 (GPT-5-mini + DALL-E 3) | Geração de artigos + carrossel + hero images | `src/features/news/pipeline/openai-client.ts`, `carousel/generator.ts` | D |
| Perplexity Sonar Pro | Fontes públicas citáveis | `src/features/news/pipeline/perplexity-client.ts` | D |
| Google Gemini 2.5 (free tier 20 RPD) | Fallback extração de PDF raster Bloomberg | `src/features/news/pipeline/gemini-fallback.ts` | D |
| Vercel Blob | Legacy (migrado para Supabase Storage em 2026-05-08) | `@vercel/blob` dep | B |
| Google Sheets | Captura leads (contato, dividend-tax, ebook, guia) | `src/lib/google-sheets.ts` + `ldc-project-*.json` (BUG-001) | C |
| Resend 6.7 + SMTP fallback | Email transacional + F-018 aprovação | `src/lib/email.ts` | C |
| Playwright | Render de PDF (dividend-tax/report, wealth-planning PDF v2) | `src/lib/dividend-tax/pdf-generator.ts`, `wealth-planning/pdf-generator-v2.ts` | C |
| Meta Pixel + WhatsApp | Tracking + CTA | `src/components/Analytics.tsx`, `WhatsAppButton.tsx` | A |

## §4 Tabelas Supabase

**Versionadas em `supabase/migrations/` (5):** `news_events`, `news_pipeline_runs`, `news_pipeline_errors`, `news_publications`, `guia_leads`.

**Órfãs (criadas fora da esteira — 8):** `BlogPost`, `Material`, `Category`, `MaterialCategory`, `BlogPostApprovalToken`, `carousel_runs`, `ebook_leads`, `wealth_planning_clients`/`wealth_planning_scenarios`. Risco: drift staging/prod. Backlog TODO §2 classe C: "Versionar 8 schemas órfãos".

Detalhe por tabela: `CURRENT_REALITY.md §5`.

## §5 Auth e papéis

- Login: `signInWithPassword` via `src/lib/auth-supabase.ts:32-37`.
- Sessão SSR server-side: `createSupabaseServerClient` em `src/lib/supabase-server.ts`.
- Helper para API routes: `checkAdminAuth` em `src/lib/auth-check.ts`.
- **`role` único source = Supabase Auth `user_metadata.role`** (`auth-supabase.ts:64-69` lê; `/api/setup-admin/route.ts:11-15` grava). Sem tabela `User` separada.
- Cookies do Supabase ficam em `sb-xvbpqlojxwbvqizmixrr-*` (project ref hardcoded em `auth-supabase.ts:17`).

## §6 Cron Vercel (5 schedules)

| UTC | BRT | Endpoint | Efeito |
|---|---|---|---|
| `0 10 * * *` | 07h | `/api/news/cron` | Pipeline IA matinal |
| `0 17 * * *` | 14h | `/api/news/cron` | Pipeline IA vespertino |
| `0 3 * * *` | 00h | `/api/posts/cleanup-expired-tokens` | Expira tokens F-018 (TTL 7d) |
| `0 4 * * *` | 01h | `/api/admin/bloomberg-pdfs/cleanup` | Deleta PDFs Bloomberg > 30d (Anti-SPEC §6.2b) |
| `0 5 * * *` | 02h | `/api/admin/blog-carousels/cleanup` | Deleta ZIPs F-019 > 90d |

Todos com `CRON_SECRET` timing-safe equal. Escalonamento intercalado.

## §7 Fluxos críticos

### 7.1 Pipeline IA `/news` → BlogPost (ADR-005, F-007/F-008/F-015)

Cron → `/api/news/cron` → `runPipeline()` em `src/features/news/pipeline/orchestrator.ts`:
1. `recordPipelineRun` → `news_pipeline_runs` status='running'.
2. `listLatestBloombergPdfs` (até 4 PDFs do bucket `bloomberg-pdfs`).
3. `extractPdf` paralelo + fallback Gemini para raster.
4. `getQueriesForTurno` + `queryPerplexity` paralelo → filtra `has_public_coverage=true` (defesa Anti-SPEC §6.2b).
5. `generateBlogArticles` (OpenAI Structured Outputs, hard fail R$5).
6. Para cada artigo: `runComplianceCheck` (F-005) → idempotência por slug → `insertBlogPost(published=false)`.
7. F-018: email com token a Marcos → GET `/api/posts/approve?token=...` → `published=true`.
8. `updatePipelineRun` final com métricas.

Alternativa de publicação: admin manual em `/admin/posts/edit/[id]`.

### 7.2 Carrossel F-019 (ADR-006)

POST `/api/admin/posts/[id]/carousel` → `src/features/news/carousel/generator.ts`:
1. `checkAdminAuth`.
2. `generateCarouselScript` (OpenAI Structured Outputs + re-validação `CarouselScriptStrict`).
3. `checkCarouselCompliance` (engine F-005 + hashtag Bloomberg check).
4. `generateImagesForSlides` (DALL-E 3 nos slides 1/3/6; fallback text-only se erro DALL-E).
5. `renderCarouselAllVariations` → 12 PNGs (6 LDC institucional + 6 Luciano pessoal).
6. `packCarouselZip` → buffer único.
7. INSERT em `carousel_runs` (status='success' / 'compliance_blocked' / 'failed').

Guard de custo: R$1 por geração (ADR-006). Em produção desde 2026-05-09.

### 7.3 Lead capture (5 formulários)

`/contato` → `/api/contato` (validação Zod inline + Sheets + email).
`/diagnostico-gratuito`, home → `/api/lead` (`leadFormSchema` + Supabase `Lead`).
`/calculadora-tributacao-dividendos-2026` → `/api/dividend-tax/lead` (Supabase + Sheets com range mapping).
`/ebook-investimentos-internacionais` → tabela `ebook_leads` via `src/lib/ebook-leads/`.
`/guia` → `guia_leads` via `src/lib/guia-leads/` + migration `20260519_create_guia_leads.sql`.

## §8 ADRs estabelecidos

Todos em `docs/decisions/adr/`:

- **ADR-001** — Stack IA OpenAI + Perplexity + Gemini (Anthropic SDK proibido).
- **ADR-002** — Persistência MDX via GitHub API (legado pré-pivot).
- **ADR-003** — Bloomberg sinal interno autoral.
- **ADR-004** — Compliance via guardrails técnicos (5 camadas).
- **ADR-005** — Pivot brevidade → artigo denso em BlogPost.
- **ADR-006** — Carrossel = X-mock screenshot + dual variation + DALL-E 3 (R$1 guard).
- **ADR-007** — Disclaimer literal CVM 3976-4 só em editorial completo; social via guardrails.

ADRs candidatos (em backlog): **ADR-008** política de IP em formulários (`ip_hash` vs `ip_address` texto).

## §9 Dívida arquitetural ativa

1. **8 tabelas Supabase fora de migrations** — maior risco. Versionar como SQL idempotente sem alterar produção.
2. **`next.config.ts:6`** `ignoreDuringBuilds: true` — dívida explícita; lint local obrigatório.
3. **Zod espalhado** em `src/features/news/contracts/`, `src/lib/dividend-tax/*`, `src/lib/wealth-planning/*`, `src/app/lib/schema.ts`, `src/lib/schema.ts`. Consolidação alvo: `packages/shared/types/` (sob demanda).
4. **Cobertura de teste irregular** — rotas admin e formulários de lead sem `__tests__/`. CI N2/N3 comentados aguardando.
5. **Submódulo Git aninhado** — 2 níveis de commit para versionar.
6. **4 bugs em `TODO.md §5`** — BUG-001/002/003/004.

Mais detalhe: `CURRENT_REALITY.md §9`.
