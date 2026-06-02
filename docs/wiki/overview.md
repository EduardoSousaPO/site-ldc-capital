# Overview — site-ldc

> Síntese viva do que o site é hoje. Atualizado 2026-05-20.
> Para fatos detalhados com `arquivo:linha`, ver `docs/plans/CURRENT_REALITY.md`.
> Para "o quê e por quê" autoritativo: `docs/product/PRD.md` (a criar na Fase 6).

## Quem somos

**LDC Capital** — consultoria de patrimônio CVM 3976-4. Foco em clientes UHNW (R$1M+). Modelo fee-based, sem comissões de produto. Risco regulatório existencial: CVM + contratual Bloomberg (PDF é input privado, jamais citado).

## O que o site é

Plataforma Next.js 15 (App Router) em produção na Vercel desde 2025. Combina:
- **Institucional** — apresentação, equipe, FAQ, lead capture, materiais e ebook.
- **Editorial** — blog com posts gerados por **pipeline IA próprio** (OpenAI + Perplexity + Gemini), aprovados manualmente por sócio operacional, com carrossel social automatizado.
- **Calculadoras públicas** — tributação de dividendos 2026 (Lei 15.270/2025) e simulador PGBL.
- **Painel admin interno** — CRUD de posts/materiais/categorias, gestão de PDFs Bloomberg, planejamento patrimonial de clientes reais.

## 10 áreas funcionais

| # | Área | Render | Classe típica |
|---|---|---|---|
| 1 | Site institucional público (home, equipe, contato, regulatórios) | Server | A/B |
| 2 | Blog CMS (`/blog` render + admin CRUD) | Server + admin | B/C |
| 3 | Pipeline IA `/news` → BlogPost (cron 2x/dia + F-018 aprovação email) | Server + cron | **D** |
| 4 | Carrossel social F-019 (DALL-E + ZIP IG/LinkedIn) | Admin trigger | **D** |
| 5 | Calculadora de tributação de dividendos 2026 | Public + PDF | C |
| 6 | Simulador PGBL | Public + PDF (admin-only) | C |
| 7 | Wealth Planning (planejamento patrimonial de clientes) | Admin only | C |
| 8 | Materiais ricos (admin CRUD + listagem pública) | Server | B |
| 9 | Lead capture (contato, diagnóstico, ebook, guia) | Public forms | B/C |
| 10 | Painel admin + auth + SEO/sitemap | Admin / dinâmico | C |

Cada área tem 1 módulo dedicado em [`modules/`](modules/).

## Volume operacional

- **5 cron jobs Vercel** (pipeline 2x/dia + 3 cleanups noturnos) — ver `architecture.md` §6.
- **~30 rotas API** organizadas em: `/api/admin/*`, `/api/news/cron`, `/api/posts/*`, `/api/blog/*`, `/api/materials*`, `/api/dividend-tax/*`, `/api/pgbl-simulator/*`, `/api/lead`, `/api/contato`, `/api/auth/callback`.
- **~21 rotas públicas** (home + 13 páginas institucionais + 4 dinâmicas + sitemap/robots) — ver `CURRENT_REALITY.md` §4.1.
- **5 tabelas Supabase versionadas** + **~8 tabelas órfãs** criadas fora de `supabase/migrations/` (drift conhecido — ver `CURRENT_REALITY.md` §9.10).
- **3 buckets Storage** — `ldc-assets` (mídia genérica), `bloomberg-pdfs` (signed upload IA), `blog-carousels` (ZIPs F-019).

## Estado atual

- **Produção:** Vercel (`https://ldccapital.com.br`).
- **Branch principal Git:** `master` no submódulo; PRs vão para `main` no remoto.
- **Repo é submódulo Git** dentro do wrapper `Projetos_App_Desktop/site-ldc/` — ver `AGENTS.md §13`.
- **Pipeline IA gate:** `NEWS_PIPELINE_ENABLED` default `false`. Liga manualmente após smoke test.
- **F-019 carrossel:** em produção desde 2026-05-09 (ADR-006).

## Fundamentos não-negociáveis (Anti-SPEC §6 — `docs/specs/SPEC.md` na Fase 6)

1. **Proibido Anthropic SDK** (ADR-001).
2. **Bloomberg PDF é sinal interno autoral**, jamais citado (ADR-003).
3. **Compliance CVM HARD** (ADR-004) — sem ticker, sem recomendação, sem promessa, sem prescrição.
4. **Disclaimer literal só em editorial completo** (ADR-007) — slide/caption usam guardrails.
5. **Cron Vercel é único trigger temporal** — sem polling, sem timers ad-hoc.
6. **Validação Zod 100% em IO externo.**
7. **Features que tocam produção = classe D obrigatória.**

## Riscos abertos (sumário)

- **7 bugs no `TODO.md §5`** (1 resolvido, 6 abertos):
  - BUG-001 P2 — credencial Google no histórico Git (TRIADO).
  - BUG-002 P0 — `/api/setup-admin` sem auth (**RESOLVIDO em 27d87a3, 2026-05-20**, validado `curl 404`).
  - BUG-003 P1 — `/api/admin/add-users` sem auth (TRIADO).
  - BUG-004 P2 — `/api/admin/media` sem `checkAdminAuth` (TRIADO).
  - BUG-005 P2 — `/api/dividend-tax/report` sem rate limiting (TRIADO).
  - BUG-006 P3 — endpoints públicos de lead capture sem rate limiting (TRIADO).
  - BUG-007 P3 — `/api/pgbl-simulator/pdf` sem Zod (TRIADO).
- **8 tabelas Supabase fora de migrations** — drift staging/prod silencioso.
- **`next.config.ts:6` ignoreDuringBuilds: true** — lint local é obrigatório.

Detalhes operacionais: ver `architecture.md`. Detalhes por área: ver `modules/`. Fontes de verdade: ver `index.md`.
