# DECISIONS_LOG — Decisões operacionais

> Decisões pequenas que provavelmente voltam ao debate. Arquiteturais grandes vão em `docs/decisions/adr/`.
> Formato: 1 linha por decisão. Última atualização: 2026-05-20.

## 2026-05

- **2026-05-20** — Adoção do Harness v3.2 em modo Cenário C (projeto em produção). Adoção gradual, sem refactor preventivo. Features novas nascem v3.2; legado fica como está até ser tocado dentro de Feature Contract.
- **2026-05-20** — `packages/shared/types/` criado como destino final dos Zod, mas consolidação NÃO acontece agora. Migração sob demanda dentro de Feature Contract.
- **2026-05-20** — CI ativo apenas em N1 (lint + typecheck + test). N2/N3 comentados em `.github/workflows/ci.yml` como TODO até existirem integration/e2e tests que justifiquem.
- **2026-05-20** — Pasta `tests/{unit,integration,contract,e2e}/` criada vazia. Testes existentes permanecem em `src/**/__tests__/`. Migração eventual sob demanda.
- **2026-05-20** — ADRs do pipeline `/news` permanecem em `docs/news/decisions/`. `docs/decisions/adr/README.md` apenas LINKA — sem duplicação até decisão futura de mover.
- **2026-05-21** — **Supersede 2026-05-20:** decisão revertida. Fase 6b da reorganização Harness v3.2 moveu os 7 ADRs via `git mv` para `docs/decisions/adr/` (local canônico). Feature contracts F-007/F-008/F-019 para `docs/plans/feature-contracts/`. SPEC e CONTRACTS do pipeline IA para `docs/specs/spec-pipeline-ia.md` e `docs/contracts/contracts-pipeline-ia.md`. TODO do pipeline absorvido no `TODO.md` raiz. **Pasta `docs/news/` deixou de existir.** Histórico preservado via `git log --follow`.
- **2026-05-21** — **Fase 6c.3 — classificação das 10 docs legacy concluída.** 4 archived (snapshots datados — ARCHITECTURE, relatorio_sistema_admin, RELATORIO_SEO_OTIMIZACAO, database_optimizations); 6 movidas para Wiki (3 módulos: components-radix, design-system, assets-catalog; 3 runbooks: admin-panel-uso, seo-visibilidade, google-sheets-setup). `docs/_archive/` é destino canônico para snapshots históricos sem encaixe em PRD/SPEC/Wiki — convenção: nome `<slug>-YYYY-MM[-DD].md`, refs prefixadas com "histórico (data):". `docs/` raiz fica sem `.md` solto (apenas subpastas).
- **2026-05-20** — Submódulo Git: operações versionadas SEMPRE dentro de `site-ldc/site-ldc/`. Wrapper só atualiza ponteiro. Nenhum `git submodule update --remote` sem aprovação.
- **2026-05-20** — **Tabela `User` + `user_metadata.role` coexistem como espelho.** Single source operacional = Supabase Auth `user_metadata.role` (`auth-check.ts:32-33`). Tabela `User` recebe UPSERT a cada `checkAdminAuth` (linhas 36-47) e serve como fallback se metadata vazio (linha 56). Decisão: manter como está; documentar no `wiki/modules/auth-admin.md`; nada a corrigir agora.
- **2026-05-20** — **`/api/lead` persiste em tabela `Client`, não `Lead`** (comentário em `route.ts:41` registra "tabela Lead não existe"). Decisão: documentar como dívida de naming; renomear exige migration; manter `Client` por compatibilidade até consolidação dos 10 schemas órfãos (backlog TODO §2 classe C).
- **2026-05-20** — **`/api/pgbl-simulator/pdf` retorna HTML inline, não PDF binário** (browser usa print-to-PDF). Endpoint mal nomeado. Decisão: backlog TODO §2 classe A para renomear para `/api/pgbl-simulator/report`; não bloqueante.
