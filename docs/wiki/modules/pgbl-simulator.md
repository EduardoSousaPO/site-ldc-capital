# Módulo: pgbl-simulator

> Simulador público de PGBL (Plano Gerador de Benefício Livre). UI client-side com cálculo determinístico + geração de PDF restrita a admins.

## §1 Escopo

**Página:**
- `src/app/pgbl-simulator/page.tsx` — client component. Consome `calcularPGBL`, `formatCurrency` de `src/lib/pgbl/calculations.ts`.

**Componentes:**
- `src/components/pgbl/PGBLChart.tsx` — gráfico de projeção (Recharts).
- `src/components/pgbl/PGBLTable.tsx` — tabela anual de valores.

**API:**
- `/api/pgbl-simulator/pdf/route.ts` (POST) — gera PDF do resultado. **Protegida por `checkAdminAuth`** (`route.ts:8`). Cliente público NÃO consegue baixar PDF — apenas consultores LDC logados podem.

**Lib:**
- `src/lib/pgbl/calculations.ts` — `PGBLInputs`, `PGBLResult`, `calcularPGBL`, `formatCurrency`, `formatPercentage`.

## §2 Fluxos principais

### 2.1 Cálculo
1. UI captura `PGBLInputs`: `rendaBrutaAnual`, `percentualAporte` (0-12%), `periodoAnos`, `rentabilidadeAnual` (% ex: 9.7), `regimeTributacao` ('regressiva' | 'progressiva').
2. `calcularPGBL(inputs)` retorna `PGBLResult`:
   - `aporteAnual` — `rendaBrutaAnual × percentualAporte/100`.
   - `beneficioFiscalAnual` — limite 12% da renda; tabela progressiva IR vigente.
   - `valorBrutoAcumulado` — composição anos × rentabilidade.
   - `valorLiquido` — bruto menos IR no resgate (regressiva: até 10% após 10 anos; progressiva: alíquota IR atual).
   - `economiaFiscalTotal` — soma do benefício fiscal anual.
3. UI renderiza `PGBLChart` + `PGBLTable` + comparação com cenário sem PGBL.

### 2.2 Geração de "PDF" (admin only) — na verdade HTML
**Endpoint mal nomeado:** apesar do nome `/api/pgbl-simulator/pdf`, NÃO gera PDF. Retorna HTML com `Content-Disposition: inline; filename="…html"`. Browser usa print-to-PDF do usuário (mesma estratégia que `/guia-pdf`). Backlog TODO §2 classe A: renomear para `/api/pgbl-simulator/report`.

1. UI exibe botão "Gerar PDF" apenas se admin autenticado (`[VERIFICAR]` UI condicional — backend confirma 401 sem `checkAdminAuth`).
2. POST `/api/pgbl-simulator/pdf` com `{inputs, result, nomeConsultor, nomeLead}`.
3. `checkAdminAuth` → 401 se não autenticado (`route.ts:9-12`).
4. Valida `inputs` e `result` presentes (`route.ts:18-23`).
5. Lê logo de `public/images/` via `readFileSync` e monta HTML.
6. Retorna HTML como response inline para o browser imprimir como PDF.

## §3 Tabelas / Storage

- Nenhuma tabela própria. Não persiste o cálculo nem o lead (PGBL não tem fluxo de captura de lead próprio hoje).
- PDF streamed na response, sem grava em Storage.

## §4 Env vars e dependências externas

- Supabase (para `checkAdminAuth`).
- Sem IA, sem Sheets, sem email.

## §5 Riscos e classe típica de mudança

- Ajuste de UI → **A/B**.
- Mudança em `calculations.ts` (regras de PGBL, alíquotas, fórmulas) → **C** (cálculo fiscal regulatório).
- Mudança nos limites (12%, tabela regressiva 10% após 10 anos) → **C** (alíquotas regulamentadas).
- Anti-SPEC §6.2 — simulação privada, sem recomendação. Texto exibido deve respeitar.

## §6 ADRs e referências

- Nenhum ADR. Cálculo segue regulamentação vigente (cabeçalho de `calculations.ts:3-10`).

## §7 Runbooks relacionados

- `docs/wiki/runbooks/playwright-pdf-debug.md` (compartilhado com calculadora-dividendos).

## §8 Pontos de atenção atuais

- **Sem testes** em `src/lib/pgbl/calculations.ts` — única lib de cálculo fiscal **sem `__tests__/`** (`CURRENT_REALITY.md §7`). Risco de regressão silenciosa. Backlog TODO §2 (parte de "Ativar testes e2e para fluxos admin").
- **"PDF gen" restrito a admin** — design intencional: o cálculo é público, mas o "material de venda" só sai pelo consultor. Mudança desse padrão = **C** (UX + compliance + dados de venda).
- **Endpoint mal nomeado** — `/api/pgbl-simulator/pdf` retorna HTML, não PDF. Backlog TODO §2 classe A para renomear para `/api/pgbl-simulator/report`.
- **`[VERIFICAR]`** — Se UI esconde o botão quando não-admin (UX) ou se só protege no backend.
- **Tabelas IR vigentes** — `[VERIFICAR]` se `calculations.ts` tem ano fixo ou se é parametrizado. Backlog TODO §2 classe C: "Auditar `src/lib/pgbl/calculations.ts` — ano IR parametrizado ou hardcoded; plano de atualização anual".
