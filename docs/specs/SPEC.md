# SPEC — site-ldc (LDC Capital)

> Snapshot 2026-05-21. SPEC consolidado do produto inteiro.
> Anexo denso: [`./spec-pipeline-ia.md`](./spec-pipeline-ia.md) (cobre §3+§4 em detalhe).
> Contratos legíveis: [`../contracts/CONTRACTS.md`](../contracts/CONTRACTS.md) (raiz) + [`../contracts/contracts-pipeline-ia.md`](../contracts/contracts-pipeline-ia.md) (anexo).
> Fonte de RFs retroativos: [`../product/PRD.md`](../product/PRD.md) + [`../plans/CURRENT_REALITY.md`](../plans/CURRENT_REALITY.md).

---

## §0 Propósito e leitura

**Este SPEC define COMPORTAMENTO observável** do site-ldc — o que o sistema faz, com quais entradas/saídas e quais critérios de aceite (CAs) testáveis. O **PRD** (`../product/PRD.md`) define o **PORQUÊ** e a intenção; este SPEC define o **COMO**.

**Numeração — colisão resolvida:** §6 é tradicionalmente reservado à **Anti-SPEC** em todo o projeto (vide ADR-001..ADR-007 + `spec-pipeline-ia.md`). Domínios funcionais ocupam **§1..§5 e §7..§14**.

**Fonte de verdade por domínio:**

| Domínio | Comportamento (SPEC) | Contratos | Decisões |
|---|---|---|---|
| Pipeline IA + Carrossel | `./spec-pipeline-ia.md` (anexo denso 1031 linhas) | `../contracts/contracts-pipeline-ia.md` | ADR-001..ADR-007 |
| Demais 11 domínios | este arquivo (resumos densos) | `../contracts/CONTRACTS.md` (a criar 6c.2) | sem ADRs dedicados hoje |
| Estado real do código | `../plans/CURRENT_REALITY.md` | — | — |
| Memória sintetizada | `../wiki/` (overview, architecture, modules, runbooks) | — | — |

**Anti-SPEC §6 é SAGRADA** — não alterável sem autorização explícita de Eduardo. Toda feature B/C/D passa por §6 no Prompt 3 (QA do PR).

**Convenção de RF/CA neste SPEC:** prefixo do domínio (`RF-INST-NNN`, `CA-BLOG-NNN`, etc.) para evitar colisão com `RF-005..RF-015` autoritativos do anexo `spec-pipeline-ia.md`.

---

## §1 Site institucional público

**RFs cobertos:**
- **RF-INST-001** — Home renderiza Header, Hero, DirectionSection, QuoteSection, ServicesGridPremium, TestimonialsCarousel, FAQ, LeadForm, Footer (`src/app/page.tsx`).
- **RF-INST-002** — Páginas estáticas `/consultoria`, `/equipe`, `/contato`, `/trabalhe-conosco`, `/informacoes-regulatorias`, `/politica-privacidade`, `/termos-de-uso` renderizam com metadata SEO completo.
- **RF-INST-003** — Botão WhatsApp flutuante presente em todas as páginas (env `NEXT_PUBLIC_WHATSAPP_LDC`).
- **RF-INST-004** — `/informacoes-regulatorias` lista PDFs em `public/documentos/regulatorios/`.

**Critérios de aceite:**
- **CA-INST-01** — Home retorna HTTP 200; lighthouse render sem erros JS críticos. `[VERIFICAR]` baseline.
- **CA-INST-02** — Cada página estática tem `<title>` + `<meta description>` definidos via `metadata` do App Router.
- **CA-INST-03** — WhatsApp button renderiza somente se `NEXT_PUBLIC_WHATSAPP_LDC` está setado; link `wa.me/<numero>`.
- **CA-INST-04** — `/informacoes-regulatorias` lista mínimo Código de Ética + Conduta acessíveis.

**Comportamento esperado:** páginas estáticas via App Router (server components), sem dependência de Supabase em runtime (exceto onde já existe via componente compartilhado como `LeadForm`). Disclaimer literal CVM 3976-4 só onde aplicável (rodapé, regulatorios) — não exibido em todas as páginas.

**ADRs aplicáveis:** ADR-004 (compliance HARD afeta toda copy regulatória); ADR-007 (estratégia de disclaimer).
**Anexo denso:** nenhum (síntese suficiente).
**Anti-SPEC pontual:** §6.2 (compliance HARD), §6.3 (disclaimer literal só em editorial completo — institucional regulatorio é editorial).

---

## §2 Blog & CMS público + admin

**RFs cobertos:**
- **RF-BLOG-001** — `/blog` lista posts publicados (`BlogPost.published=true`) ordenados por `publishedAt desc` com categorias.
- **RF-BLOG-002** — `/blog/[slug]` renderiza artigo individual; `notFound()` se slug ausente (`src/app/blog/[slug]/page.tsx:137`); render dinâmico por request (sem ISR hoje).
- **RF-BLOG-003** — Duas vias coexistentes para `published=true`: (a) token F-018 via email Marcos (`/api/posts/approve`); (b) admin manual `/admin/posts/edit/[id]`.
- **RF-BLOG-004** — Admin CRUD via `/admin/posts/{page,new,edit/[id]}` + `/api/admin/posts/*` protegido por `checkAdminAuth` (aceita `ADMIN` ou `EDITOR`).
- **RF-BLOG-005** — `readingTime` calculado via lib `reading-time` em INSERT/UPDATE de `BlogPost`.
- **RF-BLOG-006** — Disclaimer literal CVM 3976-4 vai DENTRO de `BlogPost.content` (responsabilidade do autor/pipeline — ADR-007).

**Critérios de aceite:**
- **CA-BLOG-01** — GET `/api/blog/posts` retorna apenas `BlogPost.published=true`; fallback `[]` em erro de DB (`api/blog/posts/route.ts:9`).
- **CA-BLOG-02** — `/blog/[slug]` com slug inexistente retorna 404 (`notFound()`).
- **CA-BLOG-03** — POST/PUT `/api/admin/posts*` sem `checkAdminAuth` válido (ADMIN/EDITOR) retorna 401.
- **CA-BLOG-04** — F-018 token aprovação muda `BlogPost.published` para `true` no primeiro clique; tokens já consumidos retornam idempotência.
- **CA-BLOG-05** — `readingTime` é string formatada ("3 min read") salva no DB no momento do save admin.
- **CA-BLOG-06** — Categorias listadas em `/api/blog/categories` correspondem à tabela `Category`.

**Comportamento esperado:** blog é o canal editorial único pós-pivot ADR-005 (substitui o legado `/news` MDX). Pipeline IA escreve `published=false`; humano (Marcos via F-018 ou admin manual) decide publicar. Audit trail via `news_events` (para token F-018) + `git log` do admin (para edit manual).

**ADRs:** ADR-002 (MDX legacy descontinuado), ADR-005 (pivot artigo denso), ADR-007 (disclaimer em editorial).
**Anexo denso:** parte de `./spec-pipeline-ia.md` cobre o caminho IA → BlogPost.
**Anti-SPEC:** §6.2 (CVM HARD em todo `content`), §6.3 (disclaimer literal obrigatório em editorial completo), §6.6 (`BlogPost` é tabela intocável sem migration plan).

---

## §3 Pipeline IA → BlogPost (resumo)

> **Resumo denso.** Detalhes em [`./spec-pipeline-ia.md`](./spec-pipeline-ia.md) (1031 linhas, RFs RF-005..RF-008, RF-015 vigentes pós-pivot ADR-005).

**RFs cobertos (extraídos do anexo):**
- **RF-005** — Extração de texto de PDFs Bloomberg (pdfjs-dist vetorial; Gemini 2.5 fallback raster).
- **RF-006** — Queries Perplexity Sonar Pro com filtro `has_public_coverage=true` (defesa Anti-SPEC §6.2b).
- **RF-007** — Geração via OpenAI GPT-5-mini com Structured Outputs + hard fail R$5 (`OpenAiCostExceededError`).
- **RF-008** — Compliance check 100% per-artigo via `runComplianceCheck` (engine F-005).
- **RF-015** — Telemetria estruturada em `news_pipeline_runs`, `news_pipeline_errors`, `news_events`.

**Critérios de aceite (síntese):**
- **CA-NEWS-CRON** — `/api/news/cron` dispara `runPipeline()` apenas se `CRON_SECRET` timing-safe valida E `NEWS_PIPELINE_ENABLED=true` (RNF-007).
- **CA-NEWS-LOCK** — Lock distribuído via índice parcial `idx_news_pipeline_runs_status_triggered` impede execuções concorrentes (CB-006; migration `20260429120000`).
- **CA-NEWS-COST** — Custo OpenAI > R$5/run aborta com `OpenAiCostExceededError`.
- **CA-NEWS-COMPLIANCE** — Artigo com violação Anti-SPEC §6.2 marca `status='blocked_compliance'` em `news_pipeline_runs` e NÃO insere em `BlogPost`.
- **CA-NEWS-IDEMPOTENT** — Slug duplicado é detectado via `findExistingArticleBySlug` e marcado `status='duplicate'` (não insere).
- **CA-NEWS-INSERT** — Artigo válido entra em `BlogPost(published=false)` + dispara F-018 (token aprovação).

**Comportamento esperado:** cron Vercel agenda 2x/dia (10h e 17h UTC). Cada run lê até 4 PDFs do bucket `bloomberg-pdfs`, gera queries Perplexity, monta `BlogArticleGenerationRequest`, valida compliance, insere `BlogPost(published=false)`. Aprovação humana via F-018 (ver §11).

**ADRs:** ADR-001 (stack IA travada), ADR-003 (Bloomberg sinal interno), ADR-004 (compliance guardrails), ADR-005 (pivot BlogPost).
**Anexo:** [`./spec-pipeline-ia.md`](./spec-pipeline-ia.md) — autoritativo.
**Anti-SPEC:** §6.1 (sem Anthropic SDK), §6.2 (CVM HARD), §6.2b (Bloomberg jamais citado), §6.4 (sem polling — cron único trigger), §6.5 (Zod 100% em IO IA), §6.6 (`BlogPost`, `news_*` intocáveis), §6.7 (toda mudança aqui = D).

---

## §4 Distribuição social — Carrossel F-019 (resumo)

> **Resumo denso.** Detalhes em [`../plans/feature-contracts/F-019-carousel.md`](../plans/feature-contracts/F-019-carousel.md) + [`./spec-pipeline-ia.md`](./spec-pipeline-ia.md) §carousel.

**RFs cobertos:**
- **RF-CAR-001** — POST `/api/admin/posts/[id]/carousel` gera carrossel de `BlogPost.published=true` via OpenAI Structured Outputs + DALL-E 3.
- **RF-CAR-002** — Dual variation: 6 slides LDC institucional + 6 slides Luciano pessoal (ADR-006).
- **RF-CAR-003** — INSERT auditoria em `carousel_runs` com `status='success' | 'compliance_blocked' | 'failed'`.

**Critérios de aceite:**
- **CA-CAR-01** — Trigger requer `checkAdminAuth` (ADMIN/EDITOR) + post `published=true`.
- **CA-CAR-02** — Script gerado passa por re-validação `CarouselScriptStrict` (regex Bloomberg embarcado).
- **CA-CAR-03** — Compliance check per-slide E per-caption — não basta per-artigo.
- **CA-CAR-04** — DALL-E 3 ativa slides 1/3/6; fallback text-only se DALL-E erro; aborta tudo (HTTP 422) se `ImageGenBloombergError`.
- **CA-CAR-05** — `packCarouselZip` produz buffer único contendo 12 PNGs.
- **CA-CAR-06** — Disclaimer literal CVM 3976-4 NÃO aparece em slide/caption (Anti-SPEC §6.3 + ADR-007).
- **CA-CAR-07** — Guard de custo R$1 por geração: `openai_cost_brl > 1` marca `status='failed'` com `error_message='cost_exceeded'` (mas não bloqueia retorno do script — direção do Eduardo "custo é sentinela").
- **CA-CAR-08** — TTL 90 dias do ZIP via cron `/api/admin/blog-carousels/cleanup` (`0 5 * * *` UTC).

**Comportamento esperado:** carrossel é trigger manual do admin pós-aprovação editorial. ZIP gerado é distribuído fora do site (IG/LinkedIn). Em produção desde 2026-05-09.

**ADRs:** ADR-006 (X-mock + dual + DALL-E + R$1 guard), ADR-007 (disclaimer estratégia).
**Anexo:** `../plans/feature-contracts/F-019-carousel.md` (Feature Contract original).
**Anti-SPEC:** §6.2 (CVM HARD em slide+caption), §6.2b (Bloomberg jamais visível em hero DALL-E), §6.3 (sem disclaimer literal em social), §6.5 (Zod refines + Strict re-validação), §6.7 (mudança aqui = D).

---

## §5 Calculadora de tributação de dividendos 2026

**RFs cobertos:**
- **RF-DIV-001** — `/calculadora-tributacao-dividendos-2026` com `metadata.robots: noindex/nofollow/noarchive/nosnippet`.
- **RF-DIV-002** — POST `/api/dividend-tax/calculate` valida `dividendTaxSimulationInputSchema` (Zod) e retorna `DividendTaxSimulationResult` (breakdown por fonte/regime/redutor/IRPF).
- **RF-DIV-003** — POST `/api/dividend-tax/lead` captura lead + mapeia `totalAnnualDividends` para range Sheets (`0-300k`, `300k-1m`, `1m-5m`, `5m-10m`, `10m-30m`, `acima-30m`).
- **RF-DIV-004** — POST `/api/dividend-tax/report` gera HTML report + PDF via Playwright (público; **sem `checkAdminAuth`**).
- **RF-DIV-005** — `generateDividendTaxAlerts` produz warnings (`alerts-engine.ts`) com tom regulatório.

**Critérios de aceite:**
- **CA-DIV-01** — Cálculo coberto por Lei 15.270/2025; testes em `src/lib/dividend-tax/__tests__/`.
- **CA-DIV-02** — Erro de schema (Zod) → 400 com `ZodError.flatten()`; outros erros → 500 genérico.
- **CA-DIV-03** — `/lead` persiste em `Client` (tabela órfã — não `Lead`; ver §9) + grava em Sheets.
- **CA-DIV-04** — Alertas (`alerts-engine`) nunca recomendam ação operacional (Anti-SPEC §6.2).
- **CA-DIV-05** — Página tem `robots: noindex` para evitar indexação (campanha privada).

**Comportamento esperado:** calculadora pública qualifica leads UHNW (range mínimo de Sheets é 300k de dividendos anuais). PDF report é gerado on-demand sem persistir em Storage (streamed). **BUG-005 ativo** — sem rate limiting em `/report` (Playwright caro; DDoS trivial).

**ADRs:** nenhum dedicado.
**Anexo denso:** nenhum (síntese suficiente; documento herdado `GUIA_CALCULADORA_TRIBUTACAO_DIVIDENDOS.md` é guia operacional).
**Anti-SPEC:** §6.2 (CVM HARD em alerts + report), §6.5 (Zod 100% em IO público), §6.7 (mudança em `calculator.ts`/`tax-constants.ts` ≥ C).

---

## §6 Anti-SPEC (SAGRADA)

> **🛑 SEÇÃO SAGRADA.** Nenhum agente altera esta seção sem autorização humana explícita de Eduardo. Toda feature B/C/D passa por esta lista no Prompt 3 (QA do PR).

### §6.1 — Sem Anthropic SDK

Proibido importar `@anthropic-ai/sdk` ou qualquer SDK Anthropic. Stack IA travada por **ADR-001**: OpenAI GPT-5-mini + Perplexity Sonar Pro + Google Gemini 2.5 (fallback). Mudança aqui exige novo ADR aprovado por Eduardo.

### §6.2 — Compliance CVM HARD

Zero ticker (regex BR + US — engine F-005), zero recomendação operacional, zero promessa de retorno, zero prescrição. Aplica-se a **TODO** conteúdo gerado para o público: `BlogPost.content`, slides do carrossel, captions, alertas da calculadora, copy institucional editável. Engine `runComplianceCheck` é o gate técnico (ver `src/features/news/compliance/`). Violação bloqueia INSERT/render em qualquer ponto do pipeline.

### §6.2b — Bloomberg PDF é sinal interno autoral

PDF Bloomberg via email é **input privado autoral** (**ADR-003**). **Jamais citar** como fonte em qualquer output público (`BlogPost`, slide, caption, social, JSON-LD, sitemap). Defense in depth obrigatório: system prompt → Zod refines → `runComplianceCheck` per-artigo → `runComplianceCheck` per-slide/caption → post-DALL-E filter "no Bloomberg branding". 5 camadas cobertas em `./spec-pipeline-ia.md` §RNF-008 e `../wiki/runbooks/bloomberg-pdf-handling.md`.

### §6.3 — Disclaimer literal CVM 3976-4 só em editorial completo

Disclaimer literal vive em: `/blog` (dentro de `BlogPost.content` por responsabilidade do autor/pipeline), email de aprovação F-018 ao Marcos, README do ZIP de carrossel. **NÃO** aparece em: slides do carrossel, captions IG/LinkedIn, anúncios pagos, formulários de lead, alertas de calculadora. Social media segue **ADR-007** — guardrails técnicos multi-camada (5 camadas em §6.2b) substituem o disclaimer literal.

### §6.4 — Sem polling; cron Vercel é o único trigger temporal

Proibido `setInterval`, `setTimeout` de polling, `useEffect` que poll endpoint, ou qualquer timer ad-hoc em server ou client. Trigger temporal único = **Vercel Cron** declarado em `vercel.json` (5 schedules ativos hoje — ver §11 + `../wiki/runbooks/news-pipeline-cron.md`). Disparo manual de cron deve ser via UI admin (`/api/admin/bloomberg-pdfs/trigger-pipeline`) com auth dual.

### §6.5 — Validação Zod 100% em IO externo

Todo input/output externo passa por Zod parse antes do uso. Cobre: OpenAI Structured Outputs (com re-validação Strict pós-call por causa de `.url()/.uuid()/.optional()` que quebram `zodResponseFormat`), Perplexity, Gemini, Supabase RPC, request bodies de API routes, payloads de webhook. Sem `as any`, sem `JSON.parse` direto em payload externo. Schemas vivem em `src/features/*/contracts/` e `src/lib/*/validators.ts` (consolidação alvo: `packages/shared/types/` — backlog TODO §2 classe B).

### §6.6 — Tabelas e endpoints intocáveis sem migration plan + ADR

**Tabelas (15):** `BlogPost`, `Material`, `Category`, `MaterialCategory`, `BlogPostApprovalToken`, `carousel_runs`, `ebook_leads`, `wealth_planning_clients`/`_scenarios`, `User`, `Client` (todas órfãs — backlog TODO §2 classe C para versionar), mais as 5 versionadas: `news_events`, `news_pipeline_runs`, `news_pipeline_errors`, `news_publications`, `guia_leads`.

**APIs:** `/api/admin/*`, `/api/news/cron`, `/api/posts/{approve,reject,cleanup-expired-tokens}`, `/api/dividend-tax/*`, `/api/pgbl-simulator/*`, `/api/lead`, `/api/contato`, `/api/auth/callback`, `/api/blog/*`, `/api/materials`, `/api/material-categories`.

**Cron:** `vercel.json` é **congelado** fora de feature D explícita.

**Prompts IA:** `src/features/news/prompts/*` é **congelado** fora de C/D explícita (ADR-007).

Detalhe completo + envs sensíveis: `../plans/CURRENT_REALITY.md` §8.

### §6.7 — Produção exige rollback + staging + smoke

Features que tocam produção (banco real, env real, cron real, deploy real, prompts IA, RLS, schema) = **classe D obrigatória**. Feature Contract + cursor-brief + rollback plan + staging + smoke test. CI N3. Sem exceção. Modo: Production (Harness v3.2).

### §6.8 — Submódulo Git

O repo `site-ldc/` é submódulo Git dentro do wrapper `Projetos_App_Desktop/site-ldc/`. Operações versionadas (commit, push, merge) acontecem **dentro** de `site-ldc/site-ldc/`. Wrapper só atualiza ponteiro do submódulo. **Nunca** rodar `git submodule update --remote` sem aprovação explícita — pode reverter trabalho local. Detalhe em `AGENTS.md §13`.

---

## §7 Simulador PGBL

**RFs cobertos:**
- **RF-PGBL-001** — `/pgbl-simulator` calcula benefício fiscal PGBL via `calcularPGBL(inputs)` em `src/lib/pgbl/calculations.ts`.
- **RF-PGBL-002** — Inputs: `rendaBrutaAnual`, `percentualAporte` (0-12%), `periodoAnos`, `rentabilidadeAnual` (%), `regimeTributacao` (`'regressiva' | 'progressiva'`).
- **RF-PGBL-003** — UI renderiza `PGBLChart` (Recharts) + `PGBLTable` + comparação com cenário sem PGBL.
- **RF-PGBL-004** — POST `/api/pgbl-simulator/pdf` retorna **HTML inline** (não PDF binário — endpoint mal nomeado; backlog A para renomear para `/report`), protegido por `checkAdminAuth`.

**Critérios de aceite:**
- **CA-PGBL-01** — Limite de dedução respeitado: 12% da renda bruta anual.
- **CA-PGBL-02** — Regime regressivo aplica tabela decrescente até 10% após 10 anos.
- **CA-PGBL-03** — Regime progressivo aplica tabela IR vigente (`[VERIFICAR]` ano parametrizado ou hardcoded em `calculations.ts`).
- **CA-PGBL-04** — `/api/pgbl-simulator/pdf` sem auth → 401.
- **CA-PGBL-05** — UI esconde botão "Gerar PDF" quando não-admin (`[VERIFICAR]` UX condicional).

**Comportamento esperado:** simulação pública; conversão se dá pelo consultor (que tem o "PDF"/HTML). Cálculo é determinístico e parametrizado pelo input do usuário.

**ADRs:** nenhum.
**Anexo:** nenhum.
**Anti-SPEC:** §6.2 (sem prescrição), §6.5 (Zod 100% em input do POST), §6.7 (mudança em alíquota/tabela = C/D anual).

---

## §8 Wealth Planning

**RFs cobertos:**
- **RF-WP-001** — Showcase público `/wealth-planning` renderiza `MeetingWizard` (`src/components/wealth-planning/v2/MeetingWizard.tsx`) — `[VERIFICAR]` se persiste no Supabase ou é client-only.
- **RF-WP-002** — Admin CRUD `/admin/wealth-planning/{clients,scenarios,compare}` protegido por `checkAdminAuth`.
- **RF-WP-003** — `runStressTests(inputs, scenarios.base, DEFAULT_STRESS_TESTS)` + `generateActionPlan(...)` em `src/lib/wealth-planning/calculations.ts`.
- **RF-WP-004** — Geração de PDF via `openPDFv2(...)` em `pdf-generator-v2.ts` quando flag `WEALTH_PLANNING_PDF_V2=true` (default).
- **RF-WP-005** — Feature flags: `WEALTH_PLANNING_V2`, `WEALTH_PLANNING_STRESS_TESTS`, `WEALTH_PLANNING_PDF_V2`, `WEALTH_PLANNING_SUCCESSION_THRESHOLD` (default R$ 2.000.000).
- **RF-WP-006** — Comparação multi-cenário em `/admin/wealth-planning/compare`.

**Critérios de aceite:**
- **CA-WP-01** — Todo endpoint admin requer `checkAdminAuth` (`ADMIN`/`EDITOR`).
- **CA-WP-02** — Cálculo de taxa real: `(1 + nominal) / (1 + inflação) - 1` (`calculations.ts:23-29`).
- **CA-WP-03** — Bloco de sucessão exibido se `patrimonio >= WEALTH_PLANNING_SUCCESSION_THRESHOLD`.
- **CA-WP-04** — Feature flags lidas via `src/lib/feature-flags.ts`; default `true` para v2/stress/pdfv2.
- **CA-WP-05** — Stress tests cobrem cenários `DEFAULT_STRESS_TESTS` (lista em `src/types/wealth-planning-v2.ts`).

**Comportamento esperado:** módulo de uso fiduciário pelo consultor para clientes reais. **LGPD aplicável** — dados de cliente real persistidos em tabelas órfãs `wealth_planning_clients`/`_scenarios` (`[VERIFICAR]` nomes reais). 3 geradores de PDF coexistem (v1 legacy, v2 default, `enhanced` sem caller identificado — backlog B para decidir destino do `enhanced`).

**ADRs:** nenhum dedicado. **ADR-010 (candidato)** — política LGPD para retenção/exclusão.
**Anexo denso:** documento herdado `wealth-planning/` (raiz do repo — backlog B para mover para `docs/wealth-planning-planning/`).
**Anti-SPEC:** §6.2 (sem prescrição em copy exibida ao cliente), §6.6 (`wealth_planning_*` intocável), §6.7 (mudança em cálculos fiduciários = C/D; LGPD = D).

---

## §9 Materiais (público + admin)

**RFs cobertos:**
- **RF-MAT-001** — `/materiais` lista publicados (`Material.published=true`) com taxonomia (`MaterialCategory`).
- **RF-MAT-002** — `/materiais/[slug]` renderiza material individual — `[VERIFICAR]` se lê `Material.content` ou MDX em `content/materiais/`.
- **RF-MAT-003** — Admin CRUD `/admin/materials/{page,new,edit/[id]}` + `/api/admin/materials/{route,[id]/route}` com `checkAdminAuth`.
- **RF-MAT-004** — Upload de cover e fileUrl via `/api/admin/upload` (UUID + bucket `ldc-assets` path `materials/`).
- **RF-MAT-005** — PDFs regulatórios servidos estaticamente em `public/documentos/regulatorios/`.

**Critérios de aceite:**
- **CA-MAT-01** — GET `/api/materials` retorna apenas publicados; fallback `[]` em erro.
- **CA-MAT-02** — Admin CRUD bloqueia sem `checkAdminAuth`.
- **CA-MAT-03** — Upload aceita PDF + imagem (`[VERIFICAR]` validações de mime/size em `upload/route.ts`).
- **CA-MAT-04** — `/materiais/[slug]` 404 se slug não existe ou `published=false`.

**Comportamento esperado:** distribuição de ebooks, guias, relatórios. Cada material pode ter cover (imagem), fileUrl (download) e/ou content (texto inline). Tabela `Material` órfã (backlog C para versionar).

**ADRs:** nenhum.
**Anexo:** documento herdado `../manual_admin_blog_materiais.md`.
**Anti-SPEC:** §6.2 (CVM HARD em `content`), §6.6 (`Material`, `MaterialCategory` intocáveis).

---

## §10 Lead capture (5 caminhos)

**RFs cobertos:**
- **RF-LEAD-001** — `/api/contato` — schema Zod inline (`nome, email, titulo, mensagem`) → Sheets + email Resend/SMTP.
- **RF-LEAD-002** — `/api/lead` — `leadFormSchema` → tabela **`Client`** (NÃO `Lead` — `route.ts:41` "tabela Lead não existe") com `(name, email, phone, notes)` onde `notes` concatena patrimônio + origem + IP.
- **RF-LEAD-003** — `/api/dividend-tax/lead` — range mapping Sheets (ver §5).
- **RF-LEAD-004** — Form ebook em `/ebook-investimentos-internacionais` → tabela `ebook_leads` (órfã) via `src/lib/ebook-leads/`.
- **RF-LEAD-005** — Form guia em `/guia` → tabela `guia_leads` (versionada) via `src/lib/guia-leads/` + migration `20260519_create_guia_leads.sql`.
- **RF-LEAD-006** — Página `/guia-pdf` é pública mas **não indexada** (fora do sitemap; print-to-PDF do browser).

**Critérios de aceite:**
- **CA-LEAD-01** — Todo POST falha graciosa: `leadSaved = sheetsResult.success || supabaseResult.success`; se ambos falham → 500 (`api/lead/route.ts:120`).
- **CA-LEAD-02** — Validação Zod sempre; erro de schema → 400.
- **CA-LEAD-03** — Persistência IP: `news_events.ip_hash` (SHA-256 do leitor anônimo) **vs** `guia_leads.ip_address` (texto puro, consentimento explícito do lead). **ADR-008 (candidato)** formaliza a política.
- **CA-LEAD-04** — Sheets espelha todas as 5 fontes em planilha única (`GOOGLE_SHEETS_ID`).
- **CA-LEAD-05** — `/diagnostico-gratuito` e `/calculadora-*` têm `robots: noindex/nofollow` (campanhas privadas).

**Comportamento esperado:** 5 formulários, persistência dual (Supabase + Sheets) para auditoria espelhada. **BUG-006 ativo** — sem rate limiting nos 5 endpoints públicos (risco DDoS + spam).

**ADRs:** **ADR-008 (candidato)** — política de IP.
**Anexo:** nenhum.
**Anti-SPEC:** §6.5 (Zod 100% em form), §6.6 (`Client`, `ebook_leads`, `guia_leads` intocáveis), §6.7 (mudança em fluxo Sheets/email/IP ≥ C).

---

## §11 Painel `/admin`

**RFs cobertos:**
- **RF-ADM-001** — `/admin/login` chama `signIn` (`auth-supabase.ts:11-37`) → `supabase.auth.signInWithPassword`.
- **RF-ADM-002** — `checkAdminAuth` (`auth-check.ts:9-…`) lê sessão SSR + valida role.
- **RF-ADM-003** — Roles aceitos: `ADMIN`, `EDITOR` (`auth-check.ts:65-67` bloqueia `USER` e demais).
- **RF-ADM-004** — `role` single source = Supabase Auth `user_metadata.role`. Tabela `User` é **espelho** mantido por UPSERT em `auth-check.ts:36-47`. Fallback DB se metadata vazio (linha 56).
- **RF-ADM-005** — Cookies Supabase: `sb-xvbpqlojxwbvqizmixrr-*` (project ref hardcoded `auth-supabase.ts:17`).
- **RF-ADM-006** — `robots.ts` faz `disallow: /admin/`.

**Critérios de aceite:**
- **CA-ADM-01** — Login válido → cookie `sb-*` setado + redirect para `/admin/dashboard`.
- **CA-ADM-02** — Logout chama `signOut()` → `window.location.href = '/admin/login'` (`auth-supabase.ts:47`).
- **CA-ADM-03** — `checkAdminAuth` retorna `null` se `getUser` erra OU role ∉ `{ADMIN, EDITOR}` → API responde 401.
- **CA-ADM-04** — Tabela `User` é UPSERTed a cada `checkAdminAuth` (sincroniza metadata → DB).

**Comportamento esperado:** painel para Eduardo, Marcos, Luciano (todos ADMIN hoje). Papel `EDITOR` está habilitado em `checkAdminAuth` mas `[VERIFICAR]` se há código que grava metadata = `EDITOR` (provável uso futuro via Studio manual). **BUG-003 ativo** — `/api/admin/add-users` SEM auth. **BUG-004 ativo** — `/api/admin/media` SEM auth. (**BUG-002 resolvido em 27d87a3.**)

**ADRs:** **ADR-009 (candidato)** — política role em `user_metadata.role` vs tabela `User` (decisão histórica).
**Anexo:** nenhum.
**Anti-SPEC:** §6.6 (`User` intocável), §6.7 (mudança em auth/middleware = C/D).

---

## §12 Workflow de aprovação editorial por email (F-018)

**RFs cobertos:**
- **RF-F018-001** — Pipeline IA grava `BlogPost(published=false)` + cria `BlogPostApprovalToken(status='pending', expires_at=now+7d)`.
- **RF-F018-002** — Resend envia email com links `/api/posts/approve?token=<rawToken>` e `/api/posts/reject?token=...` para `NEWS_APPROVAL_RECIPIENT_EMAIL` + CCs.
- **RF-F018-003** — `handleApproval(request, "approve"|"reject")` em `src/features/news/notifications/approval-handler.ts` muda `BlogPost.published` E token `status='approved'|'rejected'`.
- **RF-F018-004** — Cron `0 3 * * *` UTC marca `pending` antigos como `expired` (`/api/posts/cleanup-expired-tokens`).

**Critérios de aceite:**
- **CA-F018-01** — Token único; primeiro clique decide; cliques subsequentes são idempotentes.
- **CA-F018-02** — Auditoria via `news_events.ip_hash` (SHA-256 do IP do clicador; sentinela `"0"x64` para origem server).
- **CA-F018-03** — TTL exato 7 dias (mencionado em cabeçalho de `cleanup-expired-tokens/route.ts`).
- **CA-F018-04** — Token expirado (post-TTL) retorna mensagem amigável + status `expired` no DB.
- **CA-F018-05** — Cron de cleanup usa `CRON_SECRET` timing-safe (RNF-007).

**Comportamento esperado:** Marcos é decisor formal de compliance editorial. Email envia para TO + CC; qualquer destinatário pode clicar (debate de visibilidade resolvido em CC). Cron noturno mantém auditoria limpa.

**ADRs:** ADR-004 (compliance + audit), ADR-005 (pipeline + aprovação humana).
**Anexo:** nenhum (handler simples; lógica documentada no header de `posts/approve/route.ts`).
**Anti-SPEC:** §6.2 (artigo aprovado segue CVM HARD), §6.6 (`BlogPostApprovalToken`, `BlogPost` intocáveis).

---

## §13 Importação Bloomberg PDF

**RFs cobertos:**
- **RF-BB-001** — `/admin/bloomberg-pdfs` aceita drag-drop de 1-10 PDFs (≤10MB cada).
- **RF-BB-002** — Upload via Supabase Storage `createSignedUploadUrl` (token 2h). Servidor valida apenas `{filename, contentType, sizeBytes}` — **nunca o conteúdo**.
- **RF-BB-003** — Bucket `bloomberg-pdfs` privado; service role bypassa RLS; sem URL pública.
- **RF-BB-004** — Trigger opcional do pipeline via `/api/admin/bloomberg-pdfs/trigger-pipeline` (dual auth: sessão admin OR `CRON_SECRET`).
- **RF-BB-005** — Cron de cleanup `0 4 * * *` UTC deleta PDFs > 30 dias.

**Critérios de aceite:**
- **CA-BB-01** — Auth admin obrigatório para todos os endpoints exceto cleanup (que usa `CRON_SECRET`).
- **CA-BB-02** — UI debounce 30s entre triggers de pipeline.
- **CA-BB-03** — Conteúdo do PDF **NUNCA** sai do servidor: telemetria registra apenas contagem de tokens, queries Perplexity geradas, error_message sem conteúdo.
- **CA-BB-04** — Defense in depth 5 camadas em qualquer feature que toque o pipeline IA (ver §6.2b).
- **CA-BB-05** — TTL voluntário 30 dias enforced via cron (Anti-SPEC §6.2b + ToS Bloomberg).

**Comportamento esperado:** PDFs Bloomberg via email são input privado autoral. Migrado de Vercel Blob → Supabase Storage em 2026-05-08 (cabeçalho de `bloomberg-pdfs/upload/route.ts`).

**ADRs:** ADR-003 (sagrada).
**Anexo:** `../wiki/runbooks/bloomberg-pdf-handling.md` (runbook de defense in depth).
**Anti-SPEC:** §6.2b (toda a seção), §6.6 (bucket + endpoints intocáveis), §6.7 (mudança = D).

---

## §14 SEO / sitemap / robots / JSON-LD

**RFs cobertos:**
- **RF-SEO-001** — `/sitemap.xml` lê `BlogPost` + `Material` publicados via `createSupabaseAdminClient`; fallback `staticPages` em erro.
- **RF-SEO-002** — `/robots.txt` disallow `/admin/`, `/api/`, `/_next/`, `/static/`; aponta para `${baseUrl}/sitemap.xml`.
- **RF-SEO-003** — JSON-LD via `getOrganizationSchema()` + `getLocalBusinessSchema()` em `src/lib/schema.ts`, injetado por `<JsonLd>` no `layout.tsx`.
- **RF-SEO-004** — Páginas com `metadata.robots: noindex/nofollow` para campanhas: `/diagnostico-gratuito`, `/calculadora-tributacao-dividendos-2026`, `/guia`, `/guia-pdf`, `/ebook-investimentos-internacionais` (todas FORA do sitemap por design).

**Critérios de aceite:**
- **CA-SEO-01** — `/sitemap.xml` retorna XML válido contendo todas as URLs estáticas + posts/materiais `published=true`.
- **CA-SEO-02** — Sitemap **regenerado a cada request** (sem `revalidate` declarado) — backlog B para adicionar `revalidate: 3600`.
- **CA-SEO-03** — Em erro de Supabase, sitemap retorna apenas `staticPages` (10 URLs base).
- **CA-SEO-04** — `getOrganizationSchema()` NÃO cita "Bloomberg" (Anti-SPEC §6.2b — `[VERIFICAR]` `src/lib/schema.ts`).

**Comportamento esperado:** indexação correta de institucional + blog + materiais; exclusão proposital de campanhas. JSON-LD presente em todas as páginas via layout root.

**ADRs:** nenhum.
**Anexo:** `../GUIA_VISIBILIDADE_SEO.md` + `../RELATORIO_SEO_OTIMIZACAO.md` (documentação herdada).
**Anti-SPEC:** §6.2b (JSON-LD nunca menciona Bloomberg), §6.7 (mudança de política de indexação ≥ C).

---

## §15 Roadmap de SPEC

**Anexos densos por domínio a criar (sob demanda):**

| Domínio | Status | Anexo proposto | Quando criar |
|---|---|---|---|
| Pipeline IA + Carrossel | ✅ existe | `spec-pipeline-ia.md` | — |
| Wealth Planning | candidato | `spec-wealth-planning.md` | Quando próxima feature C/D tocar `wealth_planning_*` (LGPD + cálculos fiduciários) |
| Calculadora dividendos 2026 | candidato | `spec-dividend-tax.md` | Quando regulamentação adicional da Lei 15.270/2025 chegar |
| Outros 9 domínios | **não previsto** | — | Síntese atual neste SPEC raiz é suficiente para classes A/B; C/D promove feature contract dedicado em `../plans/feature-contracts/` |

**Backlog SPEC em `TODO.md §2`:**
- Promover `spec-wealth-planning.md` quando trigger de LGPD ou refator de cálculo aparecer.
- Promover `spec-dividend-tax.md` se nova Lei adicional alterar `tax-constants.ts`.

**ADRs candidatos pendentes (replicados de PRD §16.3):**
- ADR-008 — política de IP em formulários.
- ADR-009 — política de role em `user_metadata.role` vs tabela `User`.
- ADR-009b — política de schema versionada (consolidar 10 órfãs).
- ADR-010 — política LGPD para `wealth_planning_*`.

---

## §16 Glossário

> Glossário canônico vive em `../product/PRD.md §17`. Sumário rápido aqui:

- **UHNW** — Ultra High Net Worth (≥ R$ 1M; threshold ampliado por ADR-007).
- **CVM 3976-4** — registro de consultora de valores mobiliários.
- **Anti-SPEC §6** — bloco sagrado deste SPEC (8 itens, §6.1..§6.8). Não alterável sem autorização humana.
- **F-018** — workflow de aprovação editorial por email (§12).
- **F-019** — carrossel social (§4).
- **F-005** — engine de compliance (`runComplianceCheck`).
- **TAB-ÓRFÃ** — tabela Supabase em produção sem migration versionada (10 hoje).
- **`ip_hash` / `ip_address`** — distinção §10 + ADR-008 candidato.
- **`user_metadata.role`** — single source operacional de papel (§11).
- **Render dinâmico (Next.js)** — sem ISR (aplica-se a `/blog/[slug]` e `/sitemap.xml` hoje).

Termos completos: `../product/PRD.md §17`.

---

**FIM — SPEC.md raiz** · Próximo passo: Fase 6c.2 (`docs/contracts/CONTRACTS.md` raiz — espelho legível dos Zod existentes, lista onde vivem hoje em `src/`, linka anexo `contracts-pipeline-ia.md`).
