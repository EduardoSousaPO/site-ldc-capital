# Módulo: calculadora-dividendos

> Calculadora pública de tributação de dividendos 2026 — simulação privada do impacto da **Lei 15.270/2025**. UI client-side + 3 endpoints (calculate / lead / report) + geração de PDF via Playwright.

## §1 Escopo

**Página:**
- `src/app/calculadora-tributacao-dividendos-2026/page.tsx` — server component, **`robots: noindex/nofollow/noarchive/nosnippet`** (página privada de campanha).
- Componente: `src/components/dividend-tax/DividendTaxCalculator.tsx` + auxiliares em `src/components/dividend-tax/`.

**APIs:**
- `/api/dividend-tax/calculate/route.ts` (POST) — valida Zod, executa `calculateDividendTax`, retorna `{input, result}`.
- `/api/dividend-tax/lead/route.ts` (POST) — captura lead pós-cálculo. Mapeia dividendos anuais para range Sheets (`0-300k`, `300k-1m`, `1m-5m`, `5m-10m`, `10m-30m`, `acima-30m`).
- `/api/dividend-tax/report/route.ts` (POST) — gera HTML via `generateDividendTaxReportHtml` + PDF via `generatePdfFromHtml` (Playwright).

**Libs (`src/lib/dividend-tax/`):**
- `calculator.ts` — `calculateDividendTax(input)` retorna `DividendTaxSimulationResult` com breakdowns por fonte, regime, redutor, IRPF.
- `alerts-engine.ts` — `generateDividendTaxAlerts` (warnings baseados no resultado).
- `constants.ts` — `REDUTOR_TETO_BY_COMPANY_TYPE`, `getSourceTaxTreatment`.
- `tax-constants.ts` — `TAX_CONSTANTS` (alíquotas, faixas).
- `types.ts` — types Zod-compatíveis (`DividendTaxSimulationInput`, etc.).
- `validators.ts` — `dividendTaxSimulationInputSchema`, `dividendTaxLeadSchema` (Zod).
- `pdf-generator.ts` — `generatePdfFromHtml` via Playwright.
- `report-template.ts` — `generateDividendTaxReportHtml` (template HTML para PDF).

**Documento herdado:** `GUIA_CALCULADORA_TRIBUTACAO_DIVIDENDOS.md` (raiz do repo).

## §2 Fluxos principais

### 2.1 Cálculo
1. UI preenche form com fontes de dividendos, regime, contexto de negócio (`BusinessActivityType`, `BusinessTaxRegime`), clube de investimento (opcional).
2. POST `/api/dividend-tax/calculate` (`route.ts:7-21`).
3. Valida com `dividendTaxSimulationInputSchema.parse(body)`.
4. `calculateDividendTax(validatedInput)` aplica: cálculos por fonte → `IncomeCompositionResult` → `RedutorCalculationBreakdown` → `RegimeSimulationResult` → `ScenarioComparisonResult` (atual vs Lei 15.270) → `ScenarioTaxBreakdown` + IRPFm.
5. Retorna `{success: true, input, result}` 200.
6. Em `ZodError` → 400 com detalhes do schema; outros erros → 500.

### 2.2 Captura de lead pós-cálculo
1. UI exibe resultado + CTA "Receber análise completa".
2. POST `/api/dividend-tax/lead` com nome/email/whatsapp + cópia do `DividendTaxSimulationInput`.
3. Valida com `dividendTaxLeadSchema.parse`.
4. Mapeia `totalAnnualDividends` para range Sheets (faixas em `route.ts:7-13`).
5. Persiste em Supabase + envia para Google Sheets via `src/lib/google-sheets.ts` (BUG-001 envolvido).

### 2.3 Geração de PDF report
1. POST `/api/dividend-tax/report` com `{input, leadName?}` (validado por `reportPayloadSchema`).
2. Recalcula `calculateDividendTax(input)` para garantir dados frescos.
3. `getLogoBase64()` lê logo de `public/images/` (`readFileSync`).
4. `generateDividendTaxReportHtml(input, result, logoBase64, leadName)` produz HTML.
5. `generatePdfFromHtml(html)` usa Playwright para render → buffer PDF.
6. Retorna PDF como response com `Content-Type: application/pdf`.

## §3 Tabelas / Storage

- Lead capture provavelmente grava em tabela `Lead` (compartilhada com `/api/lead`) ou tabela própria `dividend_tax_leads` — `[VERIFICAR]` lendo o body completo de `/api/dividend-tax/lead/route.ts`.
- Sheets row criada em planilha do `GOOGLE_SHEETS_ID`.
- Sem storage de PDFs — streamed direto na response.

## §4 Env vars e dependências externas

- `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (+ `ldc-project-*.json` BUG-001).
- Supabase (`SUPABASE_SERVICE_ROLE_KEY` para Lead).
- Playwright (instalado como dep; usado para render do PDF).
- `NEXT_PUBLIC_SITE_URL` (referência em JSON-LD se aplicável).

## §5 Riscos e classe típica de mudança

- Ajuste de UI/labels/textos do form → **B** (cuidado com tom regulatório).
- Mudança em `calculator.ts` ou `constants.ts` (alíquotas, fórmulas) → **C** — afeta cálculo fiscal regulatório.
- Mudança em alertas (`alerts-engine.ts`) → **C** (texto e gatilhos podem soar como recomendação).
- Anti-SPEC §6.2 — disclaimer "simulação privada", sem recomendação operacional.
- Geração de PDF muda template → **B** (apenas layout); muda CTA / disclaimer → **C**.

## §6 ADRs e referências

- Nenhum ADR dedicado. Candidato: ADR sobre versionamento de `TAX_CONSTANTS` quando Lei 15.270/2025 sofrer regulamentação adicional.
- Documento herdado: `GUIA_CALCULADORA_TRIBUTACAO_DIVIDENDOS.md`.

## §7 Runbooks relacionados

- `docs/wiki/runbooks/sheets-credential-rotation.md` (a criar — BUG-001).
- `docs/wiki/runbooks/playwright-pdf-debug.md` (a criar — pdfs distorcidos em prod).

## §8 Pontos de atenção atuais

- **Lei 15.270/2025** — qualquer regulamentação superveniente exige revisão de `TAX_CONSTANTS` e `constants.ts`. Classe C/D conforme escopo.
- **Playwright no runtime de produção** — Vercel suporta via Node runtime, mas cold start pode ser lento. `[VERIFICAR]` se há `runtime: 'nodejs'` declarado em `/api/dividend-tax/report/route.ts` (eu não inspecionei).
- **Sem testes** para os endpoints (`calculate`/`lead`/`report`). Há testes para `calculator.ts`, `alerts-engine.ts`, `validators.ts` em `src/lib/dividend-tax/__tests__/`.
- **BUG-001** — credencial Google usada por `/api/dividend-tax/lead`. Rotação documentada em runbook futuro.
- **`/api/dividend-tax/report` é público** — `[VERIFICAR]` se há rate limiting ou se qualquer requisição pode disparar geração de PDF (custo Playwright).
- **`[VERIFICAR]`** — Nome real da tabela de Lead (`Lead`? `dividend_tax_leads`?).
