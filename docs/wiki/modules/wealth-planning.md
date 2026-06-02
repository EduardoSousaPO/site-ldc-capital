# Módulo: wealth-planning

> Planejamento patrimonial de clientes reais. Showcase público (`MeetingWizard`) + CRUD admin com cenários, stress tests, PDF v1/v2 e plano de ação. **Dados de cliente real → LGPD aplicável.**

## §1 Escopo

**Público (showcase):**
- `src/app/wealth-planning/page.tsx` (client component) — exibe `MeetingWizard` para demonstração.

**Admin (uso real):**
- `src/app/admin/wealth-planning/page.tsx` — landing do módulo.
- `src/app/admin/wealth-planning/clients/{new,[id]/page,[id]/edit}` — CRUD cliente.
- `src/app/admin/wealth-planning/scenarios/{new,[id]/edit,[id]/results}` — CRUD cenário + resultados.
- `src/app/admin/wealth-planning/compare/page.tsx` — comparar cenários.

**APIs:**
- `/api/admin/wealth-planning/clients/{route,[id]/route}` — CRUD com `checkAdminAuth`.
- `/api/admin/wealth-planning/scenarios/{route,[id]/route,[id]/calculate,[id]/pdf}` — CRUD + cálculo + PDF.

**Libs e tipos:**
- `src/lib/wealth-planning/calculations.ts` — `calculateRealRate`, `runStressTests`, `generateActionPlan`, `YearlyProjection`, etc.
- `src/lib/wealth-planning/validations.ts` — schemas Zod.
- `src/lib/wealth-planning/pdf-generator.ts` — PDF v1 (legacy).
- `src/lib/wealth-planning/pdf-generator-v2.ts` — PDF v2 (atual, default true).
- `src/lib/wealth-planning/pdf-generator-enhanced.ts` — `[VERIFICAR]` qual variante usa.
- `src/lib/wealth-planning/pdf-template.tsx` — template React-PDF.
- `src/types/wealth-planning.ts`, `src/types/wealth-planning-v2.ts` — types.

**Componentes:** `src/components/wealth-planning/v2/MeetingWizard.tsx` + outros sob `src/components/wealth-planning/`.

## §2 Fluxos principais

### 2.1 Showcase público
1. `/wealth-planning` (client) renderiza `MeetingWizard`. **`[VERIFICAR]` se persiste dados no Supabase ou é puramente client-side** (provável client-only — showcase deveria ser stateless).
2. Wizard captura `QuickInputs` em N steps.
3. `runStressTests(inputs, scenarios.base, DEFAULT_STRESS_TESTS)` + `generateActionPlan(...)`.
4. Botão "Exportar PDF" chama `openPDFv2(inputs, scenarios, stressTests, actionPlan)` em `pdf-generator-v2.ts`. Engine: `[VERIFICAR]` Playwright/React-PDF/HTML print.

**3 geradores de PDF coexistem:**
- `pdf-generator.ts` (v1, legacy).
- `pdf-generator-v2.ts` (v2 atual, default true via flag `WEALTH_PLANNING_PDF_V2`).
- `pdf-generator-enhanced.ts` — **sem caller identificado** `[VERIFICAR]` via `grep "pdf-generator-enhanced" src/`. Backlog TODO §2 classe B: "Decidir destino de `pdf-generator-enhanced.ts` (consolidar com v2 ou deletar)".

### 2.2 Admin — CRUD de cliente + cenário
1. Admin em `/admin/wealth-planning/clients/new` cria cliente (nome, contato, dados patrimoniais).
2. POST `/api/admin/wealth-planning/clients` → `checkAdminAuth` → INSERT em `wealth_planning_clients` (`[VERIFICAR]` nome real — leia `.from('...')` no head do route).
3. Cria cenário em `/admin/wealth-planning/scenarios/new` referenciando cliente.
4. POST `/api/admin/wealth-planning/scenarios` → INSERT em `wealth_planning_scenarios` (`[VERIFICAR]` nome real).
5. Cálculo: GET `/api/admin/wealth-planning/scenarios/[id]/calculate` aplica `runStressTests` e armazena resultados.
6. PDF: GET `/api/admin/wealth-planning/scenarios/[id]/pdf` gera PDF do cenário. **Provável streamed** (padrão das outras rotas é gerar inline e retornar; `[VERIFICAR]` no head do route).
7. Comparação: `/admin/wealth-planning/compare` mostra múltiplos cenários do mesmo cliente lado a lado.

### 2.3 Feature flags em runtime
Lidas via `src/lib/feature-flags.ts`:
- `WEALTH_PLANNING_V2` — `NEXT_PUBLIC_WEALTH_PLANNING_V2 === 'true'`. Liga novo fluxo de reunião.
- `WEALTH_PLANNING_STRESS_TESTS` — default `true` (only `false` se env explicitamente `'false'`).
- `WEALTH_PLANNING_PDF_V2` — default `true`. Falso → cai no v1 (`pdf-generator.ts`).
- `WEALTH_PLANNING_SUCCESSION_THRESHOLD` — número (default 2.000.000 BRL) que decide quando exibir bloco de sucessão.

## §3 Tabelas / Storage

- **`wealth_planning_clients`** (órfã — fora de migrations) — `[VERIFICAR]` nome real + colunas + RLS.
- **`wealth_planning_scenarios`** (órfã) — `[VERIFICAR]` nome real + colunas + RLS.
- **PDFs gerados:** `[VERIFICAR]` se salvos em `ldc-assets` ou apenas streamados como resposta HTTP.

## §4 Env vars e dependências externas

- `NEXT_PUBLIC_WEALTH_PLANNING_V2`, `NEXT_PUBLIC_WP_STRESS_TESTS`, `NEXT_PUBLIC_WP_PDF_V2`, `NEXT_PUBLIC_WP_SUCCESSION_THRESHOLD`.
- Supabase (`SUPABASE_SERVICE_ROLE_KEY` para CRUD admin).
- Sem IA, sem Sheets, sem email.

## §5 Riscos e classe típica de mudança

- Ajuste de UI / wizard / componente isolado → **B**.
- Mudança em `calculations.ts` (fórmulas financeiras) → **C** (cálculo regulatório/fiduciário).
- Mudança em schema `wealth_planning_*` ou RLS → **D** (LGPD + dados de cliente real).
- Nova feature flag ou alteração de comportamento default → **C**.
- Anti-SPEC §6.2 — sem promessa de retorno, sem recomendação operacional, sem prescrição. Texto exibido ao cliente deve respeitar.

## §6 ADRs e referências

- Nenhum ADR dedicado. Candidato futuro: ADR sobre LGPD + retenção de dados de cliente.
- Templates de planejamento herdados em `wealth-planning/` (raiz do repo, órfão) — backlog TODO §2 (mover para `docs/wealth-planning-planning/`).

## §7 Runbooks relacionados

- `docs/wiki/runbooks/lgpd-cliente-data.md` (a criar) — política de retenção e exclusão de dados de cliente.
- `docs/wiki/runbooks/wealth-planning-pdf-debug.md` (a criar) — debug PDF v2 com Playwright/canvas.

## §8 Pontos de atenção atuais

- **LGPD** — única área que armazena dados de cliente real (não lead anônimo). Toda mudança aqui herda restrição LGPD.
- **3 geradores de PDF coexistem** — v1 (legacy), v2 (default via flag `WEALTH_PLANNING_PDF_V2`), `enhanced` (sem caller identificado). Backlog TODO §2 classe B para decidir destino do `enhanced`.
- **Schemas órfãs** — `wealth_planning_clients`/`wealth_planning_scenarios` sem migration. Backlog TODO §2 classe C com nota LGPD.
- **`vitest.config.ts:16`** exclui pasta `wealth-planning/` raiz (planejamentos órfãos), mas **inclui** `src/lib/wealth-planning/__tests__/`.
- **Testes existentes** em `src/lib/wealth-planning/__tests__/` cobrem `calculations` e `validations`. Sem testes para os endpoints admin nem para componentes.
- **`[VERIFICAR]`** — Se `MeetingWizard` público em `/wealth-planning` persiste algo no Supabase (showcase deveria ser stateless) ou se é puramente client-side.
