# CONTRACTS — site-ldc (LDC Capital)

> Snapshot 2026-05-21. Catálogo legível dos contratos Zod do projeto.
> **Fonte de verdade = código em `src/`.** Este arquivo é índice navegável; **NÃO duplica definições Zod completas**.
> Anexo denso por domínio: [`./contracts-pipeline-ia.md`](./contracts-pipeline-ia.md) (cobre §3+§4).
> SPEC alinhado: [`../specs/SPEC.md`](../specs/SPEC.md). Anti-SPEC §6.5 (Zod 100% em IO externo).

---

## §0 Convenções

**Formato das tabelas:** `Schema | Arquivo:linha | Campos | Obrigatórios | Validações-chave`. Campos abreviados (`?` = opcional). Sem linhas duplicadas do código — para detalhes, abrir o arquivo.

**Onde os Zod vivem hoje (não consolidados):**

| Local | Conteúdo | Domínio coberto |
|---|---|---|
| `src/features/news/contracts/{approval,carousel,compliance,openai,perplexity,pipeline,telemetry}.ts` | Schemas Zod do pipeline IA + F-018 + F-019 | §3, §4, §12 |
| `src/lib/dividend-tax/validators.ts` + `types.ts` | Inputs/outputs da calculadora + lead | §5 |
| `src/lib/wealth-planning/validations.ts` + `src/types/wealth-planning{,-v2}.ts` | Inputs/outputs wealth-planning | §8 |
| `src/app/lib/schema.ts` | `leadFormSchema` (usado por `/api/lead`) | §10 |
| `src/lib/schema.ts` | JSON-LD builders (`getOrganizationSchema`, `getLocalBusinessSchema`) — **não-Zod** | §14 |
| `src/lib/pgbl/calculations.ts` | `PGBLInputs`/`PGBLResult` — **interfaces TS, não Zod** | §7 |
| `src/lib/auth-supabase.ts` | `User` interface — **não-Zod** | §11 |
| `src/app/lib/blog.ts`, `src/app/lib/materials.ts` | Shapes `BlogPost`/`Material` (tipos TS extraídos do Supabase) | §2, §9 |
| Inline em `src/app/api/*/route.ts` | Schemas pontuais (ex.: `/api/contato`, `/api/dividend-tax/report`) | §5, §10 |

**Política de consolidação:** `packages/shared/types/` é destino futuro. Migração sob demanda dentro de Feature Contract da próxima feature relevante — **não fazer big-bang**. Ver `TODO.md §2` (B). Hoje os Zod ficam por domínio.

**Regra Anti-SPEC §6.5:** validação Zod 100% em IO externo (OpenAI, Perplexity, Gemini, Supabase RPC, request bodies, payloads de webhook). Sem `as any`, sem `JSON.parse` direto em payload externo.

**Convenção de erro:** padrão é `schema.parse(body)` em handler de API route com `try/catch ZodError → 400 + flatten()`. Outros erros → 500 genérico (Anti-SPEC §6.3 — sem stack trace ao cliente).

**OpenAI Structured Outputs gotcha:** `.url()`, `.uuid()`, `.optional()` quebram `zodResponseFormat`. Padrão = schema relaxado para call + re-validação com schema strict pós-resposta. Aplicado em pipeline IA (`./contracts-pipeline-ia.md`) e carrossel F-019.

---

## §1 Site institucional

**Nenhum contrato Zod formal.** Páginas estáticas (server components) sem entrada externa validada. Componentes Radix/UI são tipados via TypeScript inline.

---

## §2 Blog & CMS

| Schema | Arquivo:linha | Campos | Obrigatórios | Validações-chave |
|---|---|---|---|---|
| `BlogPost` (shape TS, não Zod) | `src/app/lib/blog.ts:22-37` `[VERIFICAR linha exata]` | `id, slug, title, content, summary, category, cover, published, publishedAt, readingTime, createdAt, updatedAt` | `id, slug, title, content, category, published` | sem refines — tipo derivado da tabela Supabase órfã |
| `Category` (shape TS) | `src/app/lib/blog.ts` `[VERIFICAR linha + arquivo]` | `id, slug, name, description?, color?` `[VERIFICAR campos exatos]` | `id, slug, name` | sem refines |
| Schemas de payload admin (POST/PUT em `/api/admin/posts*`) | `src/app/api/admin/posts/route.ts` + `[id]/route.ts` | `title, slug, content, summary, category, cover, published` | `title, content, category` | `readingTime` calculado server-side via lib `reading-time` (`route.ts:2`) — não vem do client. **Validação completa `[VERIFICAR]`** — não vi schema Zod dedicado no head; pode ser parse inline |
| `BlogPostApprovalToken` (shape TS / Zod) | `src/features/news/contracts/approval.ts` `[VERIFICAR]` | `id, blogPostId, rawToken, tokenHash, status('pending'\|'approved'\|'rejected'\|'expired'), expiresAt, ipHash?, decidedAt?` | `id, blogPostId, tokenHash, status, expiresAt` | TTL 7 dias enforced via cron `/api/posts/cleanup-expired-tokens` |

**Tabelas Supabase associadas (todas órfãs — §6.6 SPEC):** `BlogPost`, `Category`, `BlogPostApprovalToken`. Sem migration versionada → consolidação em backlog C (`TODO.md §2`).

**Anti-SPEC pontual:** §6.5 (Zod 100% nos payloads admin — `[VERIFICAR]` se hoje há schema dedicado), §6.6 (tabelas intocáveis).

---

## §3 Pipeline IA → BlogPost (resumo)

> **Detalhes em [`./contracts-pipeline-ia.md`](./contracts-pipeline-ia.md)** (autoritativo, ~463 linhas).

Schemas principais vivendo em `src/features/news/contracts/`:

- **`pipeline.ts`** — `BloombergFormat`, `UploadPdfRequest/Response`, `PdfExtractionResult`, `GenerationJob`, `PipelineRun`, `GenerationResult`, `TriggerType` (enum: `cron`, `manual`, `manual_upload`), `PipelineRunStatus` (`running`, `success`, `failed`).
- **`perplexity.ts`** — `PerplexityQuery`, `PerplexityCitation`, `PerplexityResponse`, `PERPLEXITY_DOMAIN_FILTER`. Filtro `has_public_coverage=true` é defesa Anti-SPEC §6.2b.
- **`openai.ts`** — `BlogArticleDraft`, `BlogArticleGenerationRequest`, `BlogArticleGenerationResponse`. Padrão **schema relaxado + re-validação Strict** pós-Structured Outputs.
- **`compliance.ts`** — `ComplianceCheckResult`, `ComplianceViolation`. Engine F-005 (`runComplianceCheck`).
- **`telemetry.ts`** — `NewsPipelineRunInsert`, `NewsPipelineErrorInsert`, `NewsEventInsert` (com `ip_hash` SHA-256).

**Anti-SPEC pontual:** §6.1 (sem Anthropic), §6.2b (Bloomberg `has_public_coverage` filter), §6.5 (Zod refines incluindo Bloomberg regex no Strict).

---

## §4 Carrossel F-019 (resumo)

> **Detalhes em [`./contracts-pipeline-ia.md`](./contracts-pipeline-ia.md) §carousel**.

Schemas em `src/features/news/contracts/carousel.ts`:

- **`CarouselScript`** (relaxed) — usado em `zodResponseFormat` do OpenAI; permite campos sem `.uuid()/.url()`.
- **`CarouselScriptStrict`** — re-validação pós-Structured Outputs com regex Bloomberg embarcado nos refines (defesa §6.2b).
- **`CarouselSlide`** — body cap 360 caracteres, `image_prompt` ≤ 200 caracteres (apenas slides 1/3/6 levam image_prompt).
- **`CarouselRun`** — INSERT em `carousel_runs` com `status='success' | 'compliance_blocked' | 'failed'`.
- **`CarouselGeneratorRequest`** — `{blogPostId, variation?}`; auth dual (sessão admin ou `CRON_SECRET`).

**Anti-SPEC pontual:** §6.2 (compliance per-slide e per-caption), §6.2b (regex Bloomberg em Strict + post-DALL-E filter), §6.3 (sem disclaimer literal em slide), §6.5 (Zod relaxed + strict).

---

## §5 Calculadora de tributação de dividendos 2026

| Schema | Arquivo:linha | Campos | Obrigatórios | Validações-chave |
|---|---|---|---|---|
| `dividendTaxSimulationInputSchema` | `src/lib/dividend-tax/validators.ts` | `sources[], regime, businessContext?, investmentClub?, year` `[VERIFICAR campos exatos]` | `sources, regime, year` | refines aritméticos por tipo de fonte |
| `dividendTaxLeadSchema` | `src/lib/dividend-tax/validators.ts` | `name, email, whatsapp, totalAnnualDividends, simulationInput` | `name, email, whatsapp, totalAnnualDividends` | email regex (Zod nativo); whatsapp formato `[VERIFICAR]` |
| `reportPayloadSchema` (inline) | `src/app/api/dividend-tax/report/route.ts:11-14` | `input` (`dividendTaxSimulationInputSchema`), `leadName?` | `input` | reusa schema de cálculo |
| Tipos resultado | `src/lib/dividend-tax/types.ts` | `DividendTaxSimulationResult`, `IncomeCompositionResult`, `RedutorCalculationBreakdown`, `RegimeSimulationResult`, `ScenarioComparisonResult`, `ScenarioTaxBreakdown`, `IrpfmDeductionBreakdown`, `BusinessActivityType`, `BusinessTaxRegime`, `SourceCalculationResult`, `ClubTaxProjectionResult`, `DividendBusinessContextInput`, `DividendInvestmentClubInput`, `DividendSourceInput` | — | tipos TS (não-Zod) derivados dos validators |

**Constantes auxiliares:** `REDUTOR_TETO_BY_COMPANY_TYPE`, `getSourceTaxTreatment`, `TAX_CONSTANTS` em `src/lib/dividend-tax/constants.ts` e `tax-constants.ts`.

**Tabela destino do lead:** `Client` (órfã) + Google Sheets (range mapping por `totalAnnualDividends`).

**Anti-SPEC pontual:** §6.2 (alerts sem recomendação), §6.5 (Zod 100% em todos os 3 endpoints).

---

## §6 Anti-SPEC

> Reservada para Anti-SPEC do SPEC. Aqui apenas referência cruzada para [`../specs/SPEC.md §6`](../specs/SPEC.md) — itens §6.1..§6.8 (sagrados).

---

## §7 Simulador PGBL

| Schema/Tipo | Arquivo:linha | Campos | Obrigatórios | Validações-chave |
|---|---|---|---|---|
| `PGBLInputs` (interface TS) | `src/lib/pgbl/calculations.ts:14-21` | `rendaBrutaAnual: number`, `percentualAporte: number` (0-12%), `periodoAnos: number`, `rentabilidadeAnual: number` (%), `regimeTributacao: 'regressiva' \| 'progressiva'` | todos | **não-Zod** — tipo TS. Validação acontece via React Hook Form no client + sanity check no server `[VERIFICAR]` |
| `PGBLResult` (interface TS) | `src/lib/pgbl/calculations.ts:22-30` | `aporteAnual, beneficioFiscalAnual, valorBrutoAcumulado, valorLiquido, economiaFiscalTotal` `[VERIFICAR campos completos]` | todos | output do `calcularPGBL(inputs)`; sem validação Zod |

**Schema do payload `/api/pgbl-simulator/pdf`:** `{inputs, result, nomeConsultor, nomeLead}` — **inline parse JSON sem Zod** (`route.ts:18-23` valida só presença `inputs && result`). Backlog C: adicionar Zod schema (Anti-SPEC §6.5).

**Tabela destino:** nenhuma (sem persistência).

**Anti-SPEC pontual:** §6.5 quebrada hoje (`/pgbl-simulator/pdf` aceita JSON sem Zod). Item para Feature Contract futuro.

---

## §8 Wealth Planning

| Schema/Tipo | Arquivo:linha | Campos | Obrigatórios | Validações-chave |
|---|---|---|---|---|
| Schemas Zod do v2 | `src/lib/wealth-planning/validations.ts` `[VERIFICAR linhas]` | `QuickInputs`, `MeetingStepInputs`, ... `[VERIFICAR nomes exatos]` | — | refines de patrimônio mínimo + sucessão threshold (lido de `WEALTH_PLANNING_SUCCESSION_THRESHOLD`) |
| Tipos TS v1 | `src/types/wealth-planning.ts` | `ScenarioData, NotRetiredResults, RetiredResults, YearlyProjection, CalculationResults, FamilyProtection, ScenarioFormData` | — | tipos derivados dos cálculos |
| Tipos TS v2 | `src/types/wealth-planning-v2.ts` | `QuickInputs, AutoScenariosResult, StressTestConfig, DEFAULT_STRESS_TESTS, ActionPlan` | — | tipos v2 do modo reunião |
| Funções de cálculo | `src/lib/wealth-planning/calculations.ts` | `calculateRealRate`, `runStressTests`, `generateActionPlan` | — | inputs/outputs tipados via interfaces v1/v2 |

**Schemas de payload admin:**
- POST/PUT `/api/admin/wealth-planning/clients` — `[VERIFICAR]` schema (provável Zod ou tipo TS direto via Supabase client).
- POST/PUT `/api/admin/wealth-planning/scenarios` — usa `ScenarioFormData` (tipo TS) importado de `src/types/wealth-planning`.

**Tabelas destino:** `wealth_planning_clients`, `wealth_planning_scenarios` (órfãs — §6.6 SPEC; LGPD aplicável — ADR-010 candidato).

**Anti-SPEC pontual:** §6.5 (Zod 100% nos endpoints admin — `[VERIFICAR]`), §6.6 (tabelas intocáveis), §6.7 (LGPD = D).

---

## §9 Materiais

| Schema/Tipo | Arquivo:linha | Campos | Obrigatórios | Validações-chave |
|---|---|---|---|---|
| `Material` (shape TS) | `src/app/lib/materials.ts` `[VERIFICAR linha]` | `id, title, slug, description?, content?, category, type, cover?, fileUrl?, published, publishedAt?, createdAt, updatedAt` `[VERIFICAR campos exatos]` | `id, title, slug, category, type, published` | tipo derivado da tabela Supabase órfã |
| `MaterialCategory` (shape TS) | `src/app/lib/materials.ts` `[VERIFICAR]` | `id, slug, name, description?` | `id, slug, name` | sem refines |
| Schemas de payload admin (POST/PUT `/api/admin/materials*`) | `src/app/api/admin/materials/route.ts` + `[id]/route.ts` | `title, slug, description?, content?, category, type, cover?, fileUrl?, published` | `title, category, type` | **validação completa `[VERIFICAR]`** — não vi schema Zod dedicado |
| Upload payload (`/api/admin/upload`) | `src/app/api/admin/upload/route.ts` | `file: File` (multipart/form-data) | `file` | **validações de mime/size `[VERIFICAR]`** — não inspecionadas |

**Tabelas destino:** `Material`, `MaterialCategory` (órfãs — §6.6 SPEC).

**Anti-SPEC pontual:** §6.5 (admin sem Zod formal hoje), §6.6 (tabelas intocáveis).

---

## §10 Lead capture

| Schema | Arquivo:linha | Campos | Obrigatórios | Validações-chave / destino |
|---|---|---|---|---|
| `leadFormSchema` | `src/app/lib/schema.ts` `[VERIFICAR linhas]` | `name, email, phone, patrimonio?, origem?` `[VERIFICAR campos exatos]` | `name, email, phone` | usada por `/api/lead`. Destino: **tabela `Client`** (NÃO `Lead` — `route.ts:41`) com `notes` concatenando extras |
| `contatoFormSchema` (inline) | `src/app/api/contato/route.ts:5-10` | `nome (min 2), email (.email()), titulo (min 5), mensagem (min 10)` | todos | Destino: Google Sheets + email Resend/SMTP |
| `dividendTaxLeadSchema` | ver §5 | — | — | Destino: `Client` + Sheets |
| Ebook lead schema | `src/lib/ebook-leads/` `[VERIFICAR arquivo + nome]` | `name, email, whatsapp?` `[VERIFICAR campos]` | — | Destino: tabela `ebook_leads` (órfã) |
| Guia lead schema | `src/lib/guia-leads/` `[VERIFICAR arquivo + nome]` | `nome, whatsapp, email, patrimonio_range (enum: 'menos_100k'\|'100k_300k'\|'300k_500k'\|'acima_500k')` | `nome, whatsapp, email, patrimonio_range` | Destino: tabela `guia_leads` (**versionada** em `20260519_create_guia_leads.sql`); `ip_address` texto puro + `user_agent` armazenados — ADR-008 candidato |

**Política de IP (§10 SPEC + ADR-008 candidato):**
- `news_events.ip_hash` — SHA-256 do leitor anônimo (telemetria).
- `guia_leads.ip_address` — texto puro, consentimento explícito via form.

**Anti-SPEC pontual:** §6.5 (Zod 100% nos 5 endpoints — confirmado em `/lead`, `/contato`, `/dividend-tax/lead`; `[VERIFICAR]` ebook e guia), §6.6 (`Client`, `ebook_leads`, `guia_leads` intocáveis).

**Bug aberto:** BUG-006 — sem rate limiting nos 5 endpoints.

---

## §11 Painel /admin (auth + roles)

| Schema/Tipo | Arquivo:linha | Campos | Obrigatórios | Validações-chave |
|---|---|---|---|---|
| `User` (interface TS) | `src/lib/auth-supabase.ts:3-8` | `id: string, email: string, name?: string, role: string` | `id, email, role` | **não-Zod**. `role` valores aceitos: `'ADMIN' \| 'EDITOR' \| 'USER'` (`auth-check.ts:65-67` bloqueia outros) |
| Tabela `User` (órfã — espelho metadata) | `src/lib/auth-check.ts:36-47` (UPSERT) | `id, email, name, role` | mesmos campos | UPSERT a cada `checkAdminAuth`; single source operacional = `user_metadata.role` |
| Login payload | `src/lib/auth-supabase.ts:11` | `email: string, password: string` | ambos | sem schema Zod — passa direto para `supabase.auth.signInWithPassword` |
| `AuthCallbackPayload` (interface TS) | `src/app/api/auth/callback/route.ts:6-9` | `event: string, session: Session \| null` | `event` | tipo TS do `@supabase/supabase-js`; sem Zod |

**Anti-SPEC pontual:** §6.5 quebrada parcialmente (login payload sem Zod local — confiamos na lib Supabase). Aceitável; mas `[VERIFICAR]` se há rota futura que se beneficiaria.

**ADRs candidatos:** ADR-009 (role em `user_metadata` vs tabela `User`).

---

## §12 F-018 — Aprovação editorial por email

| Schema | Arquivo:linha | Campos | Obrigatórios | Validações-chave |
|---|---|---|---|---|
| `BlogPostApprovalToken` | `src/features/news/contracts/approval.ts` `[VERIFICAR]` | `id, blogPostId, tokenHash, status, expiresAt, ipHash?, decidedAt?` | `id, blogPostId, tokenHash, status, expiresAt` | TTL 7 dias; `tokenHash` = SHA-256 do `rawToken` (rawToken só no email) |
| `ApproveRequest` query | `src/app/api/posts/approve/route.ts` | `token: string` (query string) | `token` | parse manual via `URL.searchParams`; **sem schema Zod dedicado** `[VERIFICAR]` |
| `ApprovalResultPayload` | `src/features/news/notifications/approval-handler.ts` `[VERIFICAR]` | retorno do `handleApproval(request, "approve"\|"reject")` | — | INSERT em `news_events` com `ip_hash` |

**Tabela destino:** `BlogPostApprovalToken` (órfã).

**Anti-SPEC pontual:** §6.2 (artigo aprovado segue CVM HARD), §6.5 (`[VERIFICAR]` se token query é validado por Zod).

---

## §13 Bloomberg PDF (importação)

| Schema | Arquivo:linha | Campos | Obrigatórios | Validações-chave |
|---|---|---|---|---|
| `UploadPdfRequest` | `src/features/news/contracts/pipeline.ts` `[VERIFICAR linha]` | `filename: string, contentType: 'application/pdf', sizeBytes: number (≤10MB)` | todos | refine: `sizeBytes <= 10_000_000`; `contentType === 'application/pdf'` |
| `UploadPdfResponse` | mesmo arquivo | `{token, path, signedUrl, expiresAt}` | todos | servidor chama `storage.from('bloomberg-pdfs').createSignedUploadUrl(path)` |
| `BloombergPdfExtractionResult` | `src/features/news/contracts/pipeline.ts` | resultado de `extractPdf` (texto, formato vetorial/raster, metadados) | — | filtros anti-PII; nunca persiste conteúdo |
| Trigger pipeline payload | `src/app/api/admin/bloomberg-pdfs/trigger-pipeline/route.ts` | `{trigger_type?: 'manual_upload' \| 'manual', pdf_ids?: string[]}` | — | dual auth (sessão admin OR `CRON_SECRET`) |

**Storage:** bucket `bloomberg-pdfs` privado, TTL 30d, cleanup cron `0 4 * * *` UTC.

**Anti-SPEC pontual (sagrada):** §6.2b inteira. Defense in depth 5 camadas obrigatório em qualquer feature que toque o pipeline IA.

---

## §14 SEO / sitemap / robots / JSON-LD

| Builder/Schema | Arquivo:linha | Tipo | Saída |
|---|---|---|---|
| `getOrganizationSchema()` | `src/lib/schema.ts` `[VERIFICAR linha]` | **objeto JSON-LD, não Zod** | `Organization` schema.org com nome, CNPJ, CVM 3976-4, endereço, redes sociais |
| `getLocalBusinessSchema()` | `src/lib/schema.ts` `[VERIFICAR linha]` | objeto JSON-LD | `LocalBusiness` schema.org para SEO local |
| Sitemap entries | `src/app/sitemap.ts:4-113` | `MetadataRoute.Sitemap` (Next.js) | `url, lastModified, changeFrequency, priority` por URL |
| Robots entries | `src/app/robots.ts:3-22` | `MetadataRoute.Robots` (Next.js) | `rules[], sitemap` |

**Não há Zod aqui** — todas as estruturas são tipos do framework Next.js (`MetadataRoute.*`) ou objetos JSON-LD planos consumidos pelo `<JsonLd>`.

**Anti-SPEC pontual:** §6.2b — `getOrganizationSchema()` NÃO pode citar "Bloomberg" (`[VERIFICAR]` em `src/lib/schema.ts`).

---

## §15 Domínios sem contrato formal

- **Páginas estáticas** (`/equipe`, `/consultoria`, etc.) — server components sem entrada externa.
- **Componentes Radix/UI isolados** — tipados via TypeScript inline.
- **Sitemap/robots dinâmicos** — `MetadataRoute.*` do Next.js (§14).
- **Analytics + WhatsApp button** — sem validação (apenas env reads).
- **`/guia-pdf` page** — render HTML para print-to-PDF; sem payload externo (lê params da URL apenas para customização).

---

## §16 Política de consolidação futura

**Alvo:** `packages/shared/types/` — fonte de verdade unificada dos contratos Zod do projeto inteiro.

**Estado hoje:** Zod espalhado em 5 locais (ver §0 tabela). `packages/shared/types/.gitkeep` documenta o futuro destino.

**Estratégia:** sob demanda dentro de Feature Contract da próxima feature relevante por domínio. **Não fazer big-bang refactor** (DECISIONS_LOG 2026-05-20).

**Backlog em `TODO.md §2`:**
- **[B] Consolidar Zod em `packages/shared/types/`** — sob demanda.
- **[C] Versionar 10 schemas Supabase órfãos** — capturar schema atual em SQL idempotente (não-Zod, mas relacionado).
- **[A] Declarar `runtime = 'nodejs'`** em rotas Playwright.

---

## §17 Convenções de erro

**Padrão de validação em API routes:**

```ts
try {
  const body = await request.json();
  const data = mySchema.parse(body);  // ou safeParse + check .success
  // ...
} catch (err) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { success: false, errors: err.flatten() },
      { status: 400 }
    );
  }
  console.error(err);  // Anti-SPEC §6.3: nunca expor stack ao cliente
  return NextResponse.json({ success: false }, { status: 500 });
}
```

**OpenAI Structured Outputs gotcha (re-validação Strict):**

```ts
// Schema relaxado para zodResponseFormat (sem .url/.uuid/.optional)
const relaxed = z.object({ /* campos básicos */ });
// Schema strict para re-validação pós-call (com refines reais)
const strict = relaxed.extend({ /* .url(), .uuid(), refines */ });

const response = await openai.beta.chat.completions.parse({
  model: "gpt-5-mini",
  response_format: zodResponseFormat(relaxed, "schema"),
  messages: [...],
});
const parsed = strict.parse(response.choices[0].message.parsed);  // re-valida
```

Aplicado em pipeline IA (`./contracts-pipeline-ia.md`) e carrossel F-019.

**Telemetria de validação:** falhas Zod em produção devem ser registradas em `news_pipeline_errors` (para pipeline) ou em log estruturado (para outros endpoints), sem expor o body original ao cliente.

---

**FIM — CONTRACTS.md raiz** · Fonte de verdade segue sendo o código Zod em `src/`. Quando consolidação para `packages/shared/types/` acontecer (sob demanda), este arquivo será atualizado mantendo o formato catálogo.
