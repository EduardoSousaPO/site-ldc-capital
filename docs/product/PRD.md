# PRD — site-ldc (LDC Capital)

> Snapshot 2026-05-21. PRD retroativo do produto inteiro.
> Anti-SPEC §6 (sagrada) vive em `docs/specs/SPEC.md` (Fase 6c).
> Fonte de fatos: `docs/plans/CURRENT_REALITY.md`. ADRs: `docs/decisions/adr/`. SPEC autoritativa do pipeline IA: `docs/specs/spec-pipeline-ia.md`.

---

## §0 Contexto e identidade

**LDC Capital** — consultoria de patrimônio registrada na **CVM 3976-4**. Modelo **fee-based**, sem comissões de produto, sem conflitos de interesse declarados.

- **Público-alvo:** clientes UHNW (Ultra High Net Worth) com patrimônio investível ≥ R$ 1M. Threshold operacional ampliado em ADR-007 (originalmente R$ 50M; ampliação amplia escopo de comunicação mantendo o nicho UHNW como foco).
- **Estilo editorial:** "Editorial LDC" (voz autoral institucional, anônima), tom referência David Mullen Jr. + macro/geopolítico + Renato Breia (operação) + Andrey Nousi (estética visual). Definido em ADR-005 + `docs/specs/spec-pipeline-ia.md`.
- **Slogan corrente:** "Raízes no interior, olhos no horizonte" (visto em `src/app/consultoria/page.tsx:13`).
- **Riscos regulatórios existenciais:**
  - **CVM 3976-4** — compliance HARD (sem ticker, sem recomendação operacional, sem promessa de retorno, sem prescrição). ADR-004.
  - **Bloomberg ToS** — PDF Bloomberg é sinal interno autoral; nunca citado em output público. ADR-003.

## §1 Visão de produto

O site **é hoje** uma plataforma Next.js 15 (App Router) em produção na Vercel que combina (a) apresentação institucional + lead capture, (b) editorial automatizado por pipeline IA com aprovação humana, (c) calculadoras públicas regulatórias (dividendos 2026, PGBL), (d) painel admin para gestão de conteúdo e planejamento patrimonial de clientes reais, (e) distribuição social (carrossel F-019).

O site **NÃO é**:
- Plataforma transacional (zero pagamento, zero corretora).
- App de banco / serviço financeiro regulado por circular Bacen.
- Newsletter independente (a Mailchimp é gerida fora deste repo; pivot ADR-005 removeu o digest do escopo).
- Canal de recomendação de ativos (Anti-SPEC §6.2 absoluta).

**Métricas-norte (sumarizadas — `[VERIFICAR]` baseline numérico):**
1. **Volume de leads qualificados** captados pelos 5 formulários e calculadoras (`/contato`, `/lead`, `/dividend-tax/lead`, ebook, guia).
2. **Throughput do pipeline IA** — runs sucesso/dia, taxa `blocked_compliance`, custo OpenAI por run (hard cap R$5 — ADR-005).
3. **Alcance editorial** — visitas únicas a `/blog/[slug]`, share rate via `news_events`, CTA conversion para diagnóstico.
4. **Conversão de calculadora → diagnóstico** — fluxo dividendos 2026 → captura de lead UHNW elegível.
5. **Cumprimento de SLA de aprovação F-018** — janela ≤ 7 dias entre pipeline insert e Marcos aprovar/rejeitar.

## §2 Restrições de produção (CRÍTICO)

Replica `CURRENT_REALITY.md §8` + `architecture.md §9`. Toda mudança que toca os itens abaixo = **classe D** (Anti-SPEC §6.6 + §6.7).

### §2.1 Tabelas intocáveis

**Versionadas (5):** `news_events`, `news_pipeline_runs`, `news_pipeline_errors`, `news_publications`, `guia_leads`.

**Órfãs (10) — sem migration versionada:** `BlogPost`, `Material`, `Category`, `MaterialCategory`, `BlogPostApprovalToken`, `carousel_runs`, `ebook_leads`, `wealth_planning_clients`/`_scenarios`, `User` (espelho de `user_metadata.role`), `Client` (usada por `/api/lead` em vez de `Lead`). Backlog TODO §2 classe C: "Versionar 10 schemas Supabase órfãos".

### §2.2 APIs intocáveis sem classe D

- `/api/admin/*` (todo o painel).
- `/api/news/cron`, `/api/posts/{approve,reject,cleanup-expired-tokens}`.
- `/api/dividend-tax/{calculate,lead,report}`, `/api/pgbl-simulator/pdf`.
- `/api/lead`, `/api/contato`, `/api/auth/callback`.
- `/api/blog/*`, `/api/materials`, `/api/material-categories`.

### §2.3 Envs sensíveis

`CRON_SECRET`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*`, `RESEND_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` (BUG-001), `NEWS_PIPELINE_ENABLED`, `NEWS_IP_HASH_SALT`, `NEWS_APPROVAL_*`, `EBOOK_FROM_*`, `ADMIN_*` (BUG-003), `SMTP_*`.

### §2.4 Cron e prompts congelados

- `vercel.json` (5 schedules) é congelado fora de feature D explícita.
- `src/features/news/prompts/*` é congelado fora de C/D explícita (ADR-007).

---

## §3 Site institucional público

**Propósito:** apresentar LDC Capital (quem somos, equipe, modelo de consultoria, regulatório, vagas) e captar lead via formulários e CTA WhatsApp.

**Usuário-alvo:** visitante UHNW prospecting ou referido, sem login.

**CAs principais (inferidos do código — `[VERIFICAR]` se há fonte autoritativa em PRD legacy):**
- **CA-INST-01:** home renderiza Header, Hero, DirectionSection, QuoteSection, ServicesGridPremium, TestimonialsCarousel, FAQ, LeadForm, Footer (`src/app/page.tsx`).
- **CA-INST-02:** páginas estáticas `/consultoria`, `/equipe`, `/contato`, `/trabalhe-conosco`, `/informacoes-regulatorias`, `/politica-privacidade`, `/termos-de-uso` renderizam com metadata SEO completo.
- **CA-INST-03:** botão WhatsApp flutuante presente em todas as páginas (`src/components/WhatsAppButton.tsx`, env `NEXT_PUBLIC_WHATSAPP_LDC`).
- **CA-INST-04:** `/informacoes-regulatorias` lista PDFs em `public/documentos/regulatorios/` (Código de Ética e Conduta + demais).

**Estado:** produção estável.
**Classe típica de mudança:** A (copy, asset) ou B (novo componente Radix isolado).
**Arquivos-chave:** `src/app/{page,consultoria,equipe,contato,trabalhe-conosco,informacoes-regulatorias,politica-privacidade,termos-de-uso}/page.tsx`, `src/app/components/*`, `src/components/WhatsAppButton.tsx`, `src/components/JsonLd.tsx`.
**ADRs aplicáveis:** ADR-004 (compliance HARD afeta toda copy regulatória), ADR-007 (disclaimer em editorial).
**Feature contracts:** nenhum (legado, pré-Harness).
**Módulo Wiki:** ver fluxo unificado em `docs/wiki/overview.md` (este escopo é tratado coletivamente como "institucional", sem módulo dedicado).

## §4 Blog & CMS

**Propósito:** publicar editorial denso para nicho UHNW (artigos longos pós-pivot ADR-005), gerado por pipeline IA + admin manual, com 2 caminhos de aprovação.

**Usuário-alvo:** público (leitura) + admin Eduardo/Marcos (curadoria) + Marcos (aprovação F-018).

**CAs principais:**
- **CA-BLOG-01:** `/blog` lista posts publicados (`BlogPost.published=true`), ordenados por `publishedAt desc`, com categorias.
- **CA-BLOG-02:** `/blog/[slug]` renderiza artigo individual; `notFound()` se slug ausente (`src/app/blog/[slug]/page.tsx:137`). Render dinâmico por request (sem ISR).
- **CA-BLOG-03:** **2 caminhos para `published=true`** coexistem: (a) token F-018 via email Marcos (`/api/posts/approve`); (b) admin manual `/admin/posts/edit/[id]` muda flag diretamente.
- **CA-BLOG-04:** admin CRUD via `/admin/posts/{page,new,edit/[id]}` + `/api/admin/posts/*` protegido por `checkAdminAuth` (aceita ADMIN ou EDITOR).
- **CA-BLOG-05:** `readingTime` calculado automaticamente via lib `reading-time`.
- **CA-BLOG-06:** disclaimer literal CVM 3976-4 vai DENTRO de `content` (editorial completo — ADR-007).

**Estado:** produção. Pivot 2026-04-29 mudou input do pipeline (de MDX `/news` para `BlogPost` Supabase).
**Classe típica:** B (CRUD/UI), C (RLS/schema), D (pipeline ou prompts).
**Arquivos-chave:** `src/app/blog/{page,[slug]/page}.tsx`, `src/app/admin/posts/**`, `src/app/api/admin/posts/{route,[id]/route,[id]/carousel}`, `src/app/api/blog/{posts,categories}/route.ts`, `src/app/lib/blog.ts`.
**Tabelas:** `BlogPost` (órfã), `Category` (órfã), `BlogPostApprovalToken` (órfã).
**ADRs:** ADR-002 (MDX legacy), ADR-005 (pivot artigo denso), ADR-007 (disclaimer).
**Feature contracts:** `docs/plans/feature-contracts/F-007-pipeline-ia.md` (legacy parcial), `F-008-cron-commit.md` (legacy).
**Módulo Wiki:** `docs/wiki/modules/blog-cms.md`.

## §5 Pipeline IA → BlogPost

**Propósito:** gerar 2 artigos densos/dia automaticamente a partir de PDFs Bloomberg (sinal interno) + fontes públicas Perplexity, com compliance HARD, aprovação humana via F-018, custo limitado a R$5/run.

**Usuário-alvo:** o pipeline em si é não-interativo. Output consumido por leitores de `/blog` após aprovação. Marcos é o gatekeeper humano.

**CAs principais (extraídos de `docs/specs/spec-pipeline-ia.md` — RFs sobreviventes ao pivot ADR-005):**
- **CA-NEWS-RF005:** extração de texto de PDFs Bloomberg (vetorial via pdfjs-dist; raster via Gemini 2.5 fallback) — RF-005.
- **CA-NEWS-RF006:** queries Perplexity Sonar Pro com filtro `has_public_coverage=true` (defesa Anti-SPEC §6.2b) — RF-006.
- **CA-NEWS-RF007:** geração via OpenAI GPT-5-mini com Structured Outputs + Zod refines; hard fail se custo > R$5 (`OpenAiCostExceededError`) — RF-007.
- **CA-NEWS-RF008:** compliance check 100% per-artigo via `runComplianceCheck` (engine F-005) — RF-008.
- **CA-NEWS-RF015:** telemetria estruturada em `news_pipeline_runs` (run lifecycle), `news_pipeline_errors` (erros), `news_events` (consumo do leitor) — RF-015.
- **CA-NEWS-CB006:** lock distribuído via índice parcial `idx_news_pipeline_runs_status_triggered` para evitar race entre cron concorrente (migration `20260429120000`).
- **CA-NEWS-RNF007:** auth `CRON_SECRET` timing-safe equal em todas rotas cron.
- **CA-NEWS-FF:** feature flag `NEWS_PIPELINE_ENABLED` default `false`; Eduardo liga após smoke autorizado.

**Estado:** produção sob feature flag. Crons agendados (10h + 17h UTC).
**Classe típica:** **D obrigatória**.
**Arquivos-chave:** `src/features/news/pipeline/orchestrator.ts`, `extractor.ts`, `gemini-fallback.ts`, `format-detector.ts`, `perplexity-client.ts`, `openai-client.ts`, `blogpost-db.ts`, `pdf-storage.ts`, `cover-image-gen.ts`, `compliance/checker.ts`, `prompts/`, `telemetry/`, `persistence/approval-token-storage.ts`. Endpoint: `src/app/api/news/cron/route.ts`.
**Tabelas:** `news_pipeline_runs`, `news_pipeline_errors`, `news_events` (versionadas), `BlogPost`, `Category`, `BlogPostApprovalToken` (órfãs).
**ADRs:** ADR-001 (stack IA), ADR-003 (Bloomberg sinal interno), ADR-004 (compliance guardrails), ADR-005 (pivot).
**Feature contracts:** `docs/plans/feature-contracts/F-007-pipeline-ia.md`, `F-008-cron-commit.md` (legacy).
**SPEC autoritativa anexa:** `docs/specs/spec-pipeline-ia.md` (RFs RF-005, RF-006, RF-007, RF-008, RF-015 vigentes; demais descontinuados).
**Módulo Wiki:** `docs/wiki/modules/news-pipeline.md`. Runbook: `docs/wiki/runbooks/news-pipeline-cron.md`.

## §6 Distribuição social — Carrossel F-019

**Propósito:** transformar post aprovado em carrossel social (Instagram/LinkedIn) via X-mock screenshot + DALL-E 3 hero, com 2 variações (LDC institucional + Luciano pessoal). Disparado manualmente pelo admin (não cron).

**Usuário-alvo:** Eduardo / Luciano gestor de redes sociais. Não pública diretamente.

**CAs principais:**
- **CA-CAR-01:** trigger via POST `/api/admin/posts/[id]/carousel` requer `checkAdminAuth` + `BlogPost.published=true`.
- **CA-CAR-02:** OpenAI Structured Outputs gera script com Zod `CarouselScript` + re-validação `CarouselScriptStrict` (Bloomberg via regex no Strict).
- **CA-CAR-03:** compliance check per-slide e per-caption (não só per-artigo).
- **CA-CAR-04:** DALL-E 3 nos slides 1/3/6; fallback text-only se DALL-E falha; aborta tudo se `ImageGenBloombergError`.
- **CA-CAR-05:** render 12 PNGs (6 LDC + 6 Luciano) → `packCarouselZip` → ZIP único em bucket `blog-carousels`.
- **CA-CAR-06:** INSERT em `carousel_runs` com `status='success'|'compliance_blocked'|'failed'` (custo > R$1 marca `failed` mas não bloqueia retorno).
- **CA-CAR-07:** disclaimer literal CVM 3976-4 NÃO aparece em slide/caption (compliance via guardrails — ADR-007).
- **CA-CAR-08:** TTL 90 dias do ZIP via cron `/api/admin/blog-carousels/cleanup` (`0 5 * * *` UTC).

**Estado:** **produção desde 2026-05-09** (ADR-006).
**Classe típica:** **D**.
**Arquivos-chave:** `src/features/news/carousel/generator.ts`, render/zip submódulos, `src/app/api/admin/posts/[id]/carousel/route.ts`, `src/app/api/admin/blog-carousels/cleanup/route.ts`.
**Tabelas:** `carousel_runs` (órfã).
**ADRs:** ADR-006 (X-mock + dual + DALL-E + R$1 guard), ADR-007 (disclaimer estratégia).
**Feature contracts:** `docs/plans/feature-contracts/F-019-carousel.md`.
**Módulo Wiki:** `docs/wiki/modules/news-pipeline.md` §F-019.

## §7 Calculadora de tributação de dividendos 2026

**Propósito:** simulação privada do impacto da Lei 15.270/2025 para investidores UHNW; converte engajamento em lead qualificado.

**Usuário-alvo:** público qualificado (dividendos anuais > R$ 300k é o range mínimo do mapping Sheets).

**CAs principais (inferidos do código — `[VERIFICAR]` se há PRD próprio):**
- **CA-DIV-01:** `/calculadora-tributacao-dividendos-2026` com `metadata.robots: noindex/nofollow/noarchive/nosnippet`.
- **CA-DIV-02:** POST `/api/dividend-tax/calculate` valida `dividendTaxSimulationInputSchema` (Zod) e retorna `DividendTaxSimulationResult` com breakdown por fonte / regime / redutor / IRPF.
- **CA-DIV-03:** POST `/api/dividend-tax/lead` mapeia `totalAnnualDividends` para range Sheets (`0-300k`, `300k-1m`, `1m-5m`, `5m-10m`, `10m-30m`, `acima-30m`) + persiste `Client` (`[VERIFICAR]`).
- **CA-DIV-04:** POST `/api/dividend-tax/report` gera HTML report + PDF via Playwright; **sem `checkAdminAuth`** (público).
- **CA-DIV-05:** `generateDividendTaxAlerts` produz warnings (`alerts-engine.ts`) com tom regulatório (sem recomendação operacional — Anti-SPEC §6.2).

**Estado:** produção. Lei 15.270/2025 em vigor; mudanças regulamentares posteriores exigirão revisão de `tax-constants.ts`.
**Classe típica:** B (UI/copy), C (cálculo fiscal, alertas, novo campo).
**Arquivos-chave:** `src/app/calculadora-tributacao-dividendos-2026/page.tsx`, `src/components/dividend-tax/*`, `src/lib/dividend-tax/{calculator,alerts-engine,constants,tax-constants,pdf-generator,report-template,types,validators}.ts`, `src/app/api/dividend-tax/{calculate,lead,report}/route.ts`.
**Tabelas:** `Client` (órfã, compartilhada com `/api/lead`) — `[VERIFICAR]` se há tabela própria.
**ADRs:** nenhum dedicado.
**Feature contracts:** nenhum (pré-Harness; documento `GUIA_CALCULADORA_TRIBUTACAO_DIVIDENDOS.md` é guia operacional, não Feature Contract).
**Bugs abertos:** BUG-005 (sem rate limiting em `/report`).
**Módulo Wiki:** `docs/wiki/modules/calculadora-dividendos.md`.

## §8 Simulador PGBL

**Propósito:** simular benefício fiscal de aporte PGBL (regime regressivo/progressivo) com gráfico + tabela + "PDF" admin-only.

**Usuário-alvo:** público interessado em previdência privada; conversão para captação via consultor.

**CAs principais:**
- **CA-PGBL-01:** `/pgbl-simulator` com client component lê `calcularPGBL(inputs)` em `src/lib/pgbl/calculations.ts`.
- **CA-PGBL-02:** inputs: `rendaBrutaAnual`, `percentualAporte` (0-12%), `periodoAnos`, `rentabilidadeAnual` (%), `regimeTributacao` ('regressiva' | 'progressiva').
- **CA-PGBL-03:** UI renderiza `PGBLChart` (Recharts) + `PGBLTable` + comparação cenário sem PGBL.
- **CA-PGBL-04:** POST `/api/pgbl-simulator/pdf` retorna **HTML inline** (não PDF binário — endpoint mal nomeado, backlog TODO §2 classe A para renomear), protegido por `checkAdminAuth`.

**Estado:** produção. Tabelas IR vigentes; `[VERIFICAR]` se ano é parametrizado em `calculations.ts`.
**Classe típica:** A/B (UI), C (fórmulas / alíquotas).
**Arquivos-chave:** `src/app/pgbl-simulator/page.tsx`, `src/lib/pgbl/calculations.ts`, `src/components/pgbl/{PGBLChart,PGBLTable}.tsx`, `src/app/api/pgbl-simulator/pdf/route.ts`.
**Tabelas:** nenhuma (sem persistência).
**ADRs:** nenhum.
**Feature contracts:** nenhum.
**Pontos de atenção:** sem testes em `src/lib/pgbl/`.
**Módulo Wiki:** `docs/wiki/modules/pgbl-simulator.md`.

## §9 Wealth Planning (admin + showcase público)

**Propósito:** ferramenta interna de planejamento patrimonial fiduciário para clientes reais (LGPD aplicável). Showcase público `/wealth-planning` demonstra o wizard.

**Usuário-alvo:** consultor LDC (admin) gerindo cenários de cliente real; visitante público vê o wizard como prova de capacidade.

**CAs principais:**
- **CA-WP-01:** showcase `/wealth-planning` renderiza `MeetingWizard` (`src/components/wealth-planning/v2/MeetingWizard.tsx`) — `[VERIFICAR]` se persiste algo no Supabase ou é client-only.
- **CA-WP-02:** admin CRUD via `/admin/wealth-planning/{clients/*,scenarios/*,compare}` protegido por `checkAdminAuth`.
- **CA-WP-03:** cálculo: `runStressTests(inputs, scenarios.base, DEFAULT_STRESS_TESTS)` + `generateActionPlan(...)` em `src/lib/wealth-planning/calculations.ts`.
- **CA-WP-04:** geração de PDF pelo consultor via `openPDFv2(...)` em `pdf-generator-v2.ts` (feature flag `WEALTH_PLANNING_PDF_V2` default `true`).
- **CA-WP-05:** feature flags em runtime: `WEALTH_PLANNING_V2`, `WEALTH_PLANNING_STRESS_TESTS`, `WEALTH_PLANNING_PDF_V2`, `WEALTH_PLANNING_SUCCESSION_THRESHOLD` (default 2.000.000 BRL).
- **CA-WP-06:** comparação multi-cenário em `/admin/wealth-planning/compare`.

**Estado:** produção. 3 geradores de PDF coexistem (v1 legacy, v2 default, `enhanced` sem caller identificado — backlog).
**Classe típica:** B (UI/wizard), C (cálculos fiduciários), D (schema cliente/cenário + LGPD).
**Arquivos-chave:** `src/app/wealth-planning/page.tsx`, `src/app/admin/wealth-planning/**`, `src/lib/wealth-planning/{calculations,validations,pdf-generator,pdf-generator-v2,pdf-generator-enhanced,pdf-template}.ts(x)`, `src/components/wealth-planning/**`, `src/types/wealth-planning{,-v2}.ts`, `src/app/api/admin/wealth-planning/{clients,scenarios}/**`.
**Tabelas:** `wealth_planning_clients`, `wealth_planning_scenarios` (órfãs, `[VERIFICAR]` nomes reais).
**ADRs:** nenhum dedicado. Candidato futuro: ADR sobre LGPD + retenção de dados de cliente.
**Feature contracts:** nenhum.
**Documentação herdada:** pasta `wealth-planning/` na raiz do repo (planejamentos `.md` + `.xlsm` órfãos; backlog mover para `docs/wealth-planning-planning/`).
**Módulo Wiki:** `docs/wiki/modules/wealth-planning.md`.

## §10 Materiais (público + admin)

**Propósito:** distribuir ebooks, guias, relatórios e PDFs regulatórios para captação e demonstração de expertise. Cada material pode ter cover, fileUrl e conteúdo HTML/MDX.

**Usuário-alvo:** público qualificado fazendo download; admin LDC publicando.

**CAs principais:**
- **CA-MAT-01:** `/materiais` lista materiais publicados (`Material.published=true`) e taxonomia (`MaterialCategory`).
- **CA-MAT-02:** `/materiais/[slug]` renderiza material individual — `[VERIFICAR]` se lê `Material.content` ou MDX em `content/materiais/`.
- **CA-MAT-03:** admin CRUD via `/admin/materials/{page,new,edit/[id]}` + `/api/admin/materials/{route,[id]/route}` protegido por `checkAdminAuth`.
- **CA-MAT-04:** uploads via `/api/admin/upload` (UUID + bucket `ldc-assets` path `materials/`).
- **CA-MAT-05:** PDFs regulatórios servidos estaticamente em `public/documentos/regulatorios/`.

**Estado:** produção. MDX legacy em `content/materiais/` (`[VERIFICAR]` se ainda em uso).
**Classe típica:** B.
**Arquivos-chave:** `src/app/materiais/{page,[slug]/page}.tsx`, `src/app/admin/materials/**`, `src/app/api/{materials,material-categories,admin/materials/**}/route.ts`, `src/app/lib/materials.ts`.
**Tabelas:** `Material`, `MaterialCategory` (órfãs).
**ADRs:** nenhum.
**Feature contracts:** nenhum. Manual operacional: `docs/wiki/runbooks/admin-panel-uso.md`.
**Módulo Wiki:** `docs/wiki/modules/materiais.md`.

## §11 Lead capture (5 caminhos)

**Propósito:** capturar leads UHNW elegíveis para diagnóstico R1 (sessão gratuita) via múltiplos pontos de contato, com persistência dual (Supabase + Google Sheets) para auditoria espelhada.

**Usuário-alvo:** prospect UHNW; equipe comercial LDC consumindo via Sheets.

**CAs principais:**
- **CA-LEAD-01:** `/api/contato` (POST) — schema Zod inline (nome, email, titulo, mensagem) → Sheets + email Resend/SMTP.
- **CA-LEAD-02:** `/api/lead` (POST) — `leadFormSchema`; persiste em **`Client`**, não `Lead` ("tabela Lead não existe" — comentário `route.ts:41`); falha graciosa `leadSaved = sheetsResult.success || supabaseResult.success`.
- **CA-LEAD-03:** `/api/dividend-tax/lead` (POST) — range mapping Sheets + persistência (`[VERIFICAR]` tabela).
- **CA-LEAD-04:** Ebook landing — POST `[VERIFICAR]` endpoint; tabela `ebook_leads` (órfã).
- **CA-LEAD-05:** Guia landing — POST `[VERIFICAR]` endpoint; tabela `guia_leads` (única versionada, `20260519_create_guia_leads.sql`). Campos: `nome, whatsapp, email, patrimonio_range, qualificado, ip_address, user_agent, origem='landing-guia'`.
- **CA-LEAD-06:** `/diagnostico-gratuito` e `/calculadora-*` têm `robots: noindex/nofollow` (campanhas).
- **CA-LEAD-07:** Política de IP: `ip_hash` SHA-256 em `news_events` (telemetria de leitor anônimo) vs `ip_address` texto em `guia_leads` (consentimento explícito). ADR-008 candidato.

**Estado:** produção. 5 caminhos, 4 tabelas (3 órfãs + 1 versionada), 1 planilha Sheets compartilhada.
**Classe típica:** B (form/UI), C (schema lead, Sheets, IP).
**Arquivos-chave:** `src/app/{contato,diagnostico-gratuito,ebook-investimentos-internacionais,guia,guia-pdf}/page.tsx`, `src/app/api/{contato,lead,dividend-tax/lead}/route.ts`, `src/components/{landing-ebook,guia}/**`, `src/lib/{ebook-leads,guia-leads,google-sheets,email}.ts`, `src/app/lib/schema.ts` (`leadFormSchema`).
**Tabelas:** `Client`, `ebook_leads` (órfãs); `guia_leads` (versionada).
**ADRs:** ADR-008 candidato (política IP).
**Feature contracts:** nenhum.
**Bugs abertos:** BUG-001 (credencial Google Sheets); BUG-006 (sem rate limiting nos 5 endpoints).
**Módulo Wiki:** `docs/wiki/modules/lead-capture.md`.

## §12 Painel `/admin`

**Propósito:** painel unificado para gestão de blog, materiais, PDFs Bloomberg, planejamento patrimonial e configuração. Auth via Supabase + 3 roles (ADMIN, EDITOR, USER).

**Usuário-alvo:** Eduardo (ADMIN), Marcos (ADMIN), Luciano (ADMIN). `[VERIFICAR]` se há EDITOR ativo (provável uso futuro).

**CAs principais:**
- **CA-ADM-01:** login via `signInWithPassword` em `/admin/login`; cookies Supabase `sb-xvbpqlojxwbvqizmixrr-*`.
- **CA-ADM-02:** `checkAdminAuth` lê sessão SSR (`createSupabaseServerClient`); valida `role ∈ {ADMIN, EDITOR}`; bloqueia USER (`auth-check.ts:65-67`).
- **CA-ADM-03:** role single source = `user_metadata.role` no Supabase Auth; tabela `User` (órfã) é espelho via UPSERT (`auth-check.ts:36-47`); fallback DB se metadata vazio (linha 56).
- **CA-ADM-04:** rotas admin sob `/admin/{dashboard,login,posts,categories,materials,bloomberg-pdfs,wealth-planning,settings}`.
- **CA-ADM-05:** `disallow` de `/admin/` em `robots.ts`.

**Estado:** produção.
**Classe típica:** C (auth, RLS, role); D (auth flow, JWT custom claim).
**Arquivos-chave:** `src/lib/{auth-supabase,supabase-server,supabase,auth-check}.ts`, `src/middleware.ts` (`[VERIFICAR]` conteúdo), `src/app/admin/**`, `src/app/api/auth/callback/route.ts`, `src/app/api/admin/**`.
**Tabelas:** `User` (órfã, espelho de metadata).
**ADRs:** nenhum dedicado. Candidato: ADR-009 sobre role em `user_metadata` vs tabela.
**Feature contracts:** nenhum.
**Bugs abertos:** BUG-002 (RESOLVIDO em 27d87a3), BUG-003 (`/api/admin/add-users` sem auth), BUG-004 (`/api/admin/media` sem auth).
**Módulo Wiki:** `docs/wiki/modules/auth-admin.md` + `docs/wiki/modules/admin-panel.md`.

## §13 Workflow de aprovação por email (F-018)

**Propósito:** Marcos (sócio operacional, decisor formal de compliance editorial) aprova ou rejeita cada `BlogPost` gerado por IA via 1-click no email, com TTL 7 dias e auditoria.

**Usuário-alvo:** Marcos (TO) + Eduardo/Luciano (CC). Qualquer destinatário pode clicar; primeiro clique decide.

**CAs principais:**
- **CA-F018-01:** pipeline IA grava `BlogPost(published=false)` + cria `BlogPostApprovalToken(status='pending', expires_at=now+7d)`.
- **CA-F018-02:** Resend envia email com link `/api/posts/approve?token=<rawToken>` e `/api/posts/reject?token=...` para `NEWS_APPROVAL_RECIPIENT_EMAIL` + `NEWS_APPROVAL_CC_EMAILS`.
- **CA-F018-03:** primeiro clique decide; handler `handleApproval` em `src/features/news/notifications/approval-handler.ts` muda `BlogPost.published` (approve) ou mantém `false` (reject) + token recebe `status='approved'|'rejected'`.
- **CA-F018-04:** auditoria via `news_events.ip_hash` (SHA-256 do IP do clicador; sentinela `"0"x64` para origem server).
- **CA-F018-05:** cron `0 3 * * *` UTC marca tokens `pending` antigos como `expired` (`/api/posts/cleanup-expired-tokens`).

**Estado:** produção.
**Classe típica:** C (token + email + dados sensíveis).
**Arquivos-chave:** `src/features/news/notifications/approval-handler.ts`, `src/features/news/persistence/approval-token-storage.ts`, `src/app/api/posts/{approve,reject,cleanup-expired-tokens}/route.ts`.
**Tabelas:** `BlogPostApprovalToken` (órfã), `BlogPost` (mutação `published`), `news_events` (auditoria).
**ADRs:** ADR-004 (compliance + audit), ADR-005 (pipeline + aprovação humana).
**Feature contracts:** F-018 era item legacy de roadmap pós-pivot — histórico absorvido em `TODO.md` raiz em 2026-05-21 (Fase 6b).
**Módulo Wiki:** `docs/wiki/modules/news-pipeline.md` §2.2 + `blog-cms.md` §2.1.

## §14 Importação Bloomberg PDF

**Propósito:** capturar PDFs Bloomberg via email como **sinal interno autoral** (ADR-003) para alimentar o pipeline IA. Servidor nunca lê o conteúdo do PDF (signed upload).

**Usuário-alvo:** Eduardo (admin que faz upload). PDFs NUNCA são expostos a usuário público nem citados em output.

**CAs principais:**
- **CA-BB-01:** `/admin/bloomberg-pdfs` aceita drag-drop de 1-10 PDFs (≤10MB cada).
- **CA-BB-02:** upload via Supabase Storage `createSignedUploadUrl` (token 2h); servidor valida apenas `{filename, contentType, sizeBytes}` (nunca o conteúdo).
- **CA-BB-03:** bucket `bloomberg-pdfs` privado; service role bypassa RLS; sem URL pública.
- **CA-BB-04:** trigger opcional do pipeline via `/api/admin/bloomberg-pdfs/trigger-pipeline` (dual auth: sessão admin OU `CRON_SECRET`; debounce UI 30s; `trigger_type='manual_upload'`).
- **CA-BB-05:** TTL voluntário 30 dias via cron `0 4 * * *` UTC (`/api/admin/bloomberg-pdfs/cleanup`) — enforcement Anti-SPEC §6.2b + ToS Bloomberg.
- **CA-BB-06:** defense in depth 5 camadas (system prompt → Zod refines → compliance per-artigo → compliance per-slide/caption → post-DALL-E filter).
- **CA-BB-07:** zero logging do conteúdo do PDF em texto puro (telemetria registra apenas contagem de tokens, queries Perplexity geradas, error_message sem conteúdo).

**Estado:** produção. Migrado de Vercel Blob para Supabase Storage em 2026-05-08.
**Classe típica:** **D**.
**Arquivos-chave:** `src/app/api/admin/bloomberg-pdfs/{route,[pathname]/route,upload/route,cleanup/route,trigger-pipeline/route}`, `src/app/admin/bloomberg-pdfs/page.tsx`, `src/features/news/pipeline/{pdf-storage,extractor,gemini-fallback,format-detector}.ts`.
**Tabelas:** nenhuma própria; tocadas indiretamente (`news_pipeline_runs` com `trigger_type='manual_upload'`).
**Storage:** bucket `bloomberg-pdfs` (privado, TTL 30d).
**ADRs:** ADR-003 (sagrada).
**Feature contracts:** F-016b (citado em cabeçalhos das rotas; em `docs/plans/feature-contracts/` `[VERIFICAR]` se existe arquivo dedicado — hoje só F-007/F-008/F-019 estão lá).
**Módulo Wiki:** `docs/wiki/modules/news-pipeline.md` §F-016b. Runbook: `docs/wiki/runbooks/bloomberg-pdf-handling.md`.

## §15 SEO / sitemap / robots / JSON-LD

**Propósito:** indexação correta do institucional + blog + materiais; exclusão proposital de campanhas e admin; presença em buscadores + LLMs.

**Usuário-alvo:** crawlers (Googlebot, Bingbot, GPTBot, etc.); LDC equipe via Search Console.

**CAs principais:**
- **CA-SEO-01:** `/sitemap.xml` dinâmico lê `BlogPost` + `Material` publicados do Supabase via `createSupabaseAdminClient`; em erro, fallback `staticPages` apenas (`src/app/sitemap.ts:108-112`).
- **CA-SEO-02:** sitemap não declara `revalidate` — regenerado a cada request (backlog TODO §2 classe B para `revalidate: 3600`).
- **CA-SEO-03:** `/robots.txt` disallow `/admin/`, `/api/`, `/_next/`, `/static/`; aponta para `${baseUrl}/sitemap.xml`.
- **CA-SEO-04:** páginas fora do sitemap **intencionalmente**: `/diagnostico-gratuito`, `/calculadora-tributacao-dividendos-2026`, `/guia`, `/guia-pdf`, `/ebook-investimentos-internacionais` (landings de campanha; `noindex`).
- **CA-SEO-05:** JSON-LD via `getOrganizationSchema()` + `getLocalBusinessSchema()` em `src/lib/schema.ts`, injetado pelo `<JsonLd>` no `layout.tsx`.
- **CA-SEO-06:** Anti-SPEC §6.2b — JSON-LD não pode citar Bloomberg (`[VERIFICAR]` `getOrganizationSchema()`).

**Estado:** produção.
**Classe típica:** B (sitemap/robots/schema), C (mudar política de indexação).
**Arquivos-chave:** `src/app/{sitemap,robots}.ts`, `src/lib/schema.ts`, `src/components/{JsonLd,Analytics}.tsx`.
**ADRs:** nenhum dedicado.
**Feature contracts:** nenhum. Guia operacional vivo: `docs/wiki/runbooks/seo-visibilidade.md`. Histórico (Janeiro 2025): `docs/_archive/relatorio-seo-otimizacao-2025-01.md`. Histórico (Outubro 2025): `docs/_archive/database-optimizations-2025-10.md`.
**Módulo Wiki:** `docs/wiki/modules/seo-sitemap.md`.

---

## §16 Roadmap consolidado

### §16.1 Próximas features (TODO §2 backlog)

**Classe A (housekeeping):**
- Limpar `bash.exe.stackdump` da raiz; pattern no `.gitignore`.
- `.data/` ao `.gitignore` + `git rm -r --cached`.
- Declarar `runtime = 'nodejs'` em rotas Playwright (`/api/dividend-tax/report`, wealth-planning PDF).
- `revalidate: 3600` em `src/app/sitemap.ts`.
- Renomear `/api/pgbl-simulator/pdf` → `/api/pgbl-simulator/report` (retorna HTML, não PDF).
- Audit Google Search Console por URLs legacy `/news/*` (pós-pivot ADR-005).

**Classe B:**
- Limpar `.env.example` removendo legacy Prisma/NextAuth.
- Investigar snapshot legacy `site-ldc/site-ldc/site-ldc/` (jan/2025).
- Mover `wealth-planning/` (raiz) para `docs/wealth-planning-planning/`.
- Consolidar Zod em `packages/shared/types/` (sob demanda).
- Ativar testes e2e para fluxos admin.
- Auditar `src/middleware.ts`.
- Avaliar ISR em `/blog/[slug]`.
- Avaliar migração `content/materiais/` (MDX legacy) → Supabase.
- Decidir destino de `pdf-generator-enhanced.ts`.

**Classe C:**
- **Versionar 10 schemas Supabase órfãos** (`BlogPost`, `Material`, `Category`, `MaterialCategory`, `BlogPostApprovalToken`, `carousel_runs`, `ebook_leads`, `wealth_planning_clients`/`_scenarios`, `User`, `Client`).
- Decidir ADR-008 (política IP).
- Auditar `next.config.ts: ignoreDuringBuilds`.
- Habilitar CI N2.
- Rate limiting (BUG-005 + BUG-006).
- Confirmar comportamento de `MeetingWizard` showcase público.
- Auditar `src/lib/pgbl/calculations.ts` (ano IR parametrizado vs hardcoded).

**Classe D:**
- Limpar `ldc-project-*.json` do histórico Git (BUG-001).

### §16.2 Bugs abertos (TODO §5)

| ID | Status | Classe | Descrição curta |
|---|---|---|---|
| BUG-001 | TRIADO | D | Credencial Google service account no histórico Git. |
| BUG-002 | **RESOLVIDO em 27d87a3 (2026-05-20)** | D | `/api/setup-admin` SEM auth — rota deletada via fast-fix em sessão paralela. |
| BUG-003 | TRIADO | D | `/api/admin/add-users` SEM auth; senha default `LdcBlog2026`. |
| BUG-004 | TRIADO | C | `/api/admin/media` SEM `checkAdminAuth`. |
| BUG-005 | TRIADO | C | Sem rate limiting em `/api/dividend-tax/report` (Playwright caro). |
| BUG-006 | TRIADO | C | Sem rate limiting nos 5 endpoints públicos de lead capture. |

### §16.3 Decisões abertas (`DECISIONS_LOG.md` + ADRs candidatos)

**ADRs candidatos (não promovidos):**
- **ADR-008** — política de IP (`ip_hash` em `news_events` vs `ip_address` texto em `guia_leads`).
- **ADR-009** — política de role em `user_metadata.role` vs tabela `User` separada.
- **ADR-009b** — política de schema versionada (consolidação dos 10 órfãos).
- **ADR-010** — política LGPD para `wealth_planning_*` (retenção, exclusão).

**Decisões operacionais ativas (`DECISIONS_LOG.md`):**
- Adoção Cenário C v3.2 (gradual, sem refactor preventivo).
- `User` + `user_metadata.role` coexistem (metadata é source of truth).
- `/api/lead` usa `Client` em vez de `Lead` (dívida de naming).
- `/api/pgbl-simulator/pdf` retorna HTML (dívida de naming).

---

## §17 Glossário

- **UHNW** — Ultra High Net Worth (≥ R$ 1M patrimônio investível; threshold operacional ampliado por ADR-007).
- **CVM 3976-4** — registro da LDC Capital como consultora de valores mobiliários junto à CVM.
- **Fee-based** — modelo de remuneração via taxa fixa do cliente, sem comissões de produto (sem conflito de interesse declarado).
- **Pipeline IA** — orchestrator que processa PDFs Bloomberg + Perplexity → OpenAI GPT-5-mini → `BlogPost(published=false)`.
- **F-018** — feature de aprovação editorial por email (Marcos clica link → `published=true`).
- **F-019** — feature de carrossel social (X-mock screenshot + DALL-E 3 dual variation).
- **F-005** — engine de compliance check (`runComplianceCheck`).
- **F-007 / F-008** — features legacy do pipeline IA (pré-pivot ADR-005; SPEC parcialmente vigente).
- **F-016b** — feature de upload + storage de PDFs Bloomberg (signed URL Supabase Storage).
- **`ip_hash`** — SHA-256 hex (64 chars) do IP do usuário, com salt opcional `NEWS_IP_HASH_SALT`. Telemetria de leitor anônimo.
- **`ip_address`** — IP em texto puro armazenado em `guia_leads` (consentimento explícito do lead via form).
- **`user_metadata.role`** — campo no Supabase Auth com valores `ADMIN`/`EDITOR`/`USER`. Single source operacional do papel do admin.
- **Anti-SPEC §6** — bloco sagrado da SPEC com restrições não-alteráveis sem autorização humana (compliance CVM, Bloomberg sinal interno, stack IA travada, etc.).
- **TAB-ÓRFÃ** — tabela Supabase em produção sem migration versionada em `supabase/migrations/`.
- **Cenário C (Harness v3.2)** — projeto em produção; adoção gradual; zero refactor preventivo.
- **Render dinâmico (Next.js)** — página/rota regenerada a cada request, sem ISR ou static generation. Aplicado hoje a `/blog/[slug]` e `/sitemap.xml`.

---

**FIM — PRD.md** · Migração `docs/news/` → estrutura unificada concluída em 2026-05-21 (Fase 6b). Próximo passo: Fase 6c — criar `docs/specs/SPEC.md` raiz (consolida Anti-SPEC §6 + linka `docs/specs/spec-pipeline-ia.md`) + `docs/contracts/CONTRACTS.md` raiz (espelho legível dos Zod).
