# Project Wiki — site-ldc

> Memória sintetizada viva. **NUNCA** fonte de verdade — síntese de PRD/SPEC/CONTRACTS/ADR/código real.
> Última atualização: 2026-05-20.

## Por onde começar

1. [Overview](overview.md) — o que o site é hoje.
2. [Architecture](architecture.md) — arquitetura técnica viva.
3. [Log](log.md) — histórico cronológico de mudanças relevantes.

## Memória por área (13 módulos em `modules/`)

- [`auth-admin`](modules/auth-admin.md) — Login Supabase, `checkAdminAuth`, `role` em `user_metadata`.
- [`admin-panel`](modules/admin-panel.md) — Painel `/admin/*` + APIs `/api/admin/*` (CRUD + storage + auth).
- [`blog-cms`](modules/blog-cms.md) — Render público `/blog` + CRUD posts; 2 caminhos para `published=true`.
- [`news-pipeline`](modules/news-pipeline.md) — Pipeline IA cron 2x/dia + F-018 aprovação por email.
- [`materiais`](modules/materiais.md) — `/materiais` público + `/admin/materials/*` CRUD.
- [`wealth-planning`](modules/wealth-planning.md) — Planejamento patrimonial de cliente (LGPD).
- [`calculadora-dividendos`](modules/calculadora-dividendos.md) — Calculadora Lei 15.270/2025 + PDF.
- [`pgbl-simulator`](modules/pgbl-simulator.md) — Simulador PGBL + PDF admin-only.
- [`lead-capture`](modules/lead-capture.md) — 5 formulários públicos (contato/diagnóstico/ebook/guia).
- [`seo-sitemap`](modules/seo-sitemap.md) — `sitemap.ts` + `robots.ts` + JSON-LD.
- [`design-system`](modules/design-system.md) — Paleta + tipografia + tokens Tailwind LDC.
- [`components-radix`](modules/components-radix.md) — Guia de componentes Radix/UI/shadcn.
- [`assets-catalog`](modules/assets-catalog.md) — Catálogo de logos + fontes + imagens em `public/`.

Runbooks operacionais em `runbooks/` (9):
- `deploy-vercel.md` — caminho default + envs Production + smoke pós-deploy.
- `rollback-vercel.md` — caminhos A/B/C para reverter produção.
- `news-pipeline-cron.md` — operar pipeline IA + inspecionar runs/errors.
- `supabase-migration.md` — fluxo seguro de migration (staging → produção).
- `secrets-rotation.md` — rotação BUG-001 + BUG-003 + chaves IA + Supabase.
- `bloomberg-pdf-handling.md` — Anti-SPEC §6.2b + defense in depth 5 camadas.
- `admin-panel-uso.md` — manual operacional do admin (CRUD posts/materiais/upload).
- `seo-visibilidade.md` — guia operacional SEO (GA4 + Pixel + LGPD + Schema + sitemap).
- `google-sheets-setup.md` — setup Google Cloud + service account + Sheets API.

Outros diretórios:
- `features/` — resumo de 1 parágrafo por feature C/D após merge.
- `context/` — Context Packs por tarefa (descartáveis).

Snapshots históricos (não-operacionais) em [`../_archive/`](../_archive/README.md).

## Fontes de verdade (NÃO substituir pela wiki)

| Domínio | Fonte autoritativa |
|---|---|
| Produto (site inteiro) | `docs/product/PRD.md` |
| Comportamento + Anti-SPEC §6 | `docs/specs/SPEC.md` |
| Contratos executáveis | `src/features/*/contracts/`, `src/lib/*/validations.ts`, `packages/shared/types/` |
| Contratos legíveis (espelho) | `docs/contracts/CONTRACTS.md` |
| Anexo SPEC do pipeline IA | `docs/specs/spec-pipeline-ia.md`, `docs/contracts/contracts-pipeline-ia.md`, `docs/decisions/adr/ADR-001..007.md` |
| Feature contracts | `docs/plans/feature-contracts/F-007,F-008,F-019.md` |
| Estado real do código | `docs/plans/CURRENT_REALITY.md` |
| Decisões arquiteturais | `docs/decisions/adr/` |
| Decisões operacionais | `docs/plans/DECISIONS_LOG.md` |
| Regras de agente | `AGENTS.md` |
| Ajustes Claude Code | `CLAUDE.md` |
| Estado vivo | `TODO.md` (raiz) + `git log` |

## Tamanhos-alvo (lint)

| Página | Limite |
|---|---|
| `index.md` | ≤ 80 linhas |
| `log.md` | ≤ 200 linhas |
| `overview.md` | ≤ 150 linhas |
| `architecture.md` | ≤ 150 linhas |
| `modules/<mod>.md` | ≤ 200 linhas |
| `features/<F-NNN>.md` | ≤ 30 linhas |
| `runbooks/<slug>.md` | ≤ 150 linhas |
| `context/<F-NNN>.md` | ≤ 150 linhas |
