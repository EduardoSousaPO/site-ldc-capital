# TODO — LDC News → Pipeline IA para `/blog` (LDC Capital)

> Estado vivo do projeto. Atualize ao iniciar feature, ao terminar, e ao fim do dia.
> SDD-avancado v3.1 — cada feature B/C/D traz Feature Contract inline (DoR + escopo + arquivos + matriz). Classe D usa contrato dedicado em [feature-contracts/](./feature-contracts/).

> ⚠️ **PIVOT 2026-04-29 — ver [ADR-005](./decisions/ADR-005-pivot-brevidade-para-artigo-denso-blog.md):** após reunião com Marcos (sócio operacional LDC), pipeline pivotou de Brevidade Inteligente em `/news` (MDX + commit GitHub) para **artigo denso em `/blog` (Supabase BlogPost)**. Tom: David Mullen Jr. + macro/geopolítico + Renato Breia + Andrey Nousi. F-006, F-008, F-010, F-012 descontinuadas. Novas features: F-015 (refactor pipeline), F-016 (cleanup), F-018 (aprovação email Marcos), F-019 (carrossel).

**Última revisão:** 2026-04-29 (pós-pivot)
**Fase:** execução — pivot recém-aplicado, F-015 é o próximo
**Foco atual:** próxima feature → F-015 (refactor pipeline para Supabase BlogPost)
**Marco 1 alvo (revisado):** 2026-05-25 (artigo denso + aprovação email + carrossel)

**Progresso pré-pivot:** F-001 ✅ · F-002 ✅ · F-003 ✅ · F-004 ✅ · F-005 ✅ · F-006 🔴 (descontinuada) · F-007 🟡 (parcialmente reaproveitada) · F-008 🔴 (descontinuada) · F-009 ✅ · F-010 🔴 (descontinuada) · F-011 🟡 (sitemap/SEO refeito em F-016) · F-012 🔴 (descontinuada)
**Roadmap pós-pivot:** F-015 (próxima) · F-016 · F-018 · F-019

---

## 1. Em andamento

> *(vazio — começar F-015 quando prompt for colado na CLI)*

---

## 1b. Roadmap pós-pivot (2026-04-29 → diante) — features ATIVAS

> Estas são as features vigentes após o pivot. Backlog Marco 1 abaixo (§2) está mantido para auditoria mas com features descontinuadas marcadas explicitamente.

### [ ] F-015 — Refactor pipeline IA para Supabase BlogPost (artigo denso, tom Mullen+macro)

- **Risco:** **C** — substitui core do pipeline; integra com BlogPost em produção
- **Cobre:** Brevidade → Artigo denso (ADR-005); RF-005, RF-006, RF-007 (extração + Perplexity + OpenAI mantidos), RF-008 (compliance mantido), Anti-SPEC §6.2 e §6.2b sagrada
- **Branch:** `feat/news-pipeline-blogpost`
- **CI alvo:** N2

**Resumo:** Reescreve `system-prompt.ts` (v2 — artigo denso, tom David Mullen + macro/geopolítica + Renato Breia + Andrey Nousi), substitui `BriefingDraft` por `BlogArticleDraft` (800-1500 palavras, anatomia mais flexível com subcabeçalhos H2/H3), reconstrói `orchestrator.ts` para fazer `INSERT` em Supabase `BlogPost` com `published=false` em vez de gravar `.mdx` em filesystem. Mantém compliance check (F-005), telemetria (F-009) e infraestrutura técnica (extractor, Perplexity, Gemini, format-detector). Endpoint `/api/news/cron` recriado para acionar o pipeline novo.

**Definition of Ready**
- [x] ADR-005 documenta pivot e arquitetura nova
- [x] 8 categorias criadas em `Category` table (migration `blog_categories_news_pivot`, 2026-04-29)
- [x] Schema `BlogPost` conhecido (`src/app/lib/blog.ts:22-37`)
- [x] Compliance engine F-005 mergeada e passing
- [x] Telemetria F-009 mergeada
- [x] Pipeline técnico F-007 (extractor, Perplexity, OpenAI client, Gemini, format-detector, fixtures Bloomberg) mergeado e reaproveitável
- [x] `.env` configurado (OPENAI_API_KEY, PERPLEXITY_API_KEY, GOOGLE_GEMINI_API_KEY, CRON_SECRET, NEWS_PIPELINE_ENABLED, NEWS_IP_HASH_SALT)

**Escopo incluído**
- `src/features/news/prompts/system-prompt.ts` (NOVO v2 — artigo denso, tom canônico)
- `src/features/news/contracts/openai.ts` (NOVO — `BlogArticleDraft`, `BlogArticleGenerationRequest`, `BlogArticleGenerationResponse`)
- `src/features/news/pipeline/openai-client.ts` (NOVO — adaptado para novo schema)
- `src/features/news/pipeline/orchestrator.ts` (NOVO — INSERT em BlogPost via Supabase)
- `src/features/news/pipeline/blogpost-db.ts` (NOVO — cliente Supabase isolado para BlogPost INSERT/UPDATE; reutiliza padrão de `news_pipeline_runs`)
- `src/app/api/news/cron/route.ts` (NOVO — endpoint protegido por CRON_SECRET, dispara orchestrator)
- Testes Vitest para os 4 acima (≥10 testes)

**Escopo excluído**
- 301 redirects `/news/*` (já feito no pivot)
- Carrossel Instagram/LinkedIn (F-019)
- Aprovação por email para Marcos (F-018)
- Refator do sitemap/SEO para BlogPost (F-016)

**Anti-SPEC relevante**
- §6.2 — compliance CVM HARD (sem ticker, sem prescrição, sem promessa)
- §6.2b — Bloomberg como sinal interno HARD
- §6.3 — sem polling, sem Anthropic SDK, validação Zod 100%

**Tom canônico do artigo (v2)**
- David J. Mullen Jr. (Million-Dollar Financial Advisor): mentor sênior, processo, "manage relationships not money"
- Renato Breia (Nord Wealth): dado-pergunta-validação, planejamento sucessório
- Andrey Nousi (CFA): narrativa de dados contraintuitiva, hook macro, conexão com tese maior
- Estrutura: hook narrativo → contexto histórico → análise técnica (números+fontes) → implicação UHNW → cenários (sem prescrição) → encerramento educativo
- 800-1500 palavras
- Subcabeçalhos H2/H3, exemplos, comparações setoriais
- "Cenários a monitorar" em vez de "O que fica de olho" (forward-looking lista)

---

### [ ] F-016 — Cleanup pós-pivot (sitemap/SEO refator, redirect validação, JSON-LD)

- **Risco:** B
- **Cobre:** RF-013 refator (NewsArticle JSON-LD → Article JSON-LD), 301 redirects validados, opcional `/llms.txt` apontando para BlogPost
- **CI alvo:** N1
- **Resumo:** Refator do sitemap/SEO de F-011 para apontar para BlogPost rows; testes de regressão dos 301 redirects `/news/*` → `/blog`; opcional regenerar `/llms.txt` listando últimos 50 BlogPost (decisão durante a feature: manter `/llms.txt` ou descartar). Migration descarte da tabela `news_publications` que era de F-008 descontinuada.

---

### [ ] F-018 — Aprovação editorial por email para Marcos (token-based)

- **Risco:** **C** — afeta workflow de publicação real
- **Cobre:** workflow de aprovação Marcos (substituição do `/admin/news` descontinuado); RF-009 reformulado
- **CI alvo:** N2
- **Resumo:** Resend (já instalado) envia email para Marcos quando pipeline gera novo `BlogPost` em `published=false`. Email tem links tokenizados "Aprovar" e "Rejeitar". Endpoint `/api/posts/approve?token=XXX` faz `UPDATE published=true`. Token expira em 7 dias, single-use, gerado via crypto random + hash. Tabela nova `BlogPostApprovalToken` no Supabase.

---

### [ ] F-019 — Gerador de carrossel Instagram/LinkedIn (estilo Andrey Nousi/Renato Breia)

- **Risco:** B
- **Cobre:** novo escopo aprovado em 2026-04-29 (reaproveitamento de conteúdo)
- **CI alvo:** N1
- **Resumo:** Após Marcos aprovar artigo, IA gera roteiro de carrossel (5-7 slides com tipo: hook, dado, pergunta, prova, CTA). Templates React renderizam via `@vercel/og` (1080x1350 Instagram portrait, 1080x1080 LinkedIn quadrado). Output: ZIP com PNGs + legenda sugerida. UI: botão "Gerar carrossel" em `/admin/posts/[id]`. Custo estimado: R$0,05/carrossel.

---

## 2. Backlog Marco 1 (pipeline + admin + go-live) — pré-pivot, AUDITORIA HISTÓRICA

> Ordem é intencional. F-001 e F-002 antes de tudo. F-005 (compliance) antes de F-007 (pipeline) porque pipeline depende de compliance check para bloquear.

---

### [ ] F-001 — Setup de pacotes, env vars e configuração base

- **Risco:** A (não toca produção, sem contrato externo, isolado)
- **Cobre:** infraestrutura para todas as RFs
- **Branch:** direto em `main` (classe A permite)
- **CI alvo:** N1 (lint + typecheck + build)

**Resumo:** Adicionar dependências novas ao `package.json`, registrar env vars necessárias em `.env.example`, e configurar `vercel.json` com crons (sem implementar handlers ainda — só registrar a infraestrutura).

**Arquivos**
- `package.json` — adicionar `@vercel/og`, `@octokit/rest`
- `.env.example` — adicionar `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_GEMINI_API_KEY` (caminho normal — PDFs Bloomberg via email são raster), `GITHUB_PAT`, `CRON_SECRET`, `NEWS_DIGEST_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `vercel.json` — adicionar `crons: [{ path: "/api/news/cron", schedule: "0 10 * * *" }, { path: "/api/news/cron", schedule: "0 17 * * *" }]`

**Critérios de aceite**
- [ ] `npm install` roda sem erros
- [ ] `npm run typecheck` verde
- [ ] `npm run build` verde
- [ ] `.env.example` listando todas as 8 vars novas

**Testes mínimos:** `lint + typecheck + build` (Classe A não exige unit test).

---

### [ ] F-002 — Constantes, disclaimers e blacklist de compliance

- **Risco:** A (constantes puras, sem efeito em runtime)
- **Cobre:** RF-008, RNF-002 (input para F-005)
- **CI alvo:** N1

**Resumo:** Centralizar todas as strings imutáveis: disclaimer CVM, lista de categorias, regex de tickers BR/US, frases proibidas, lista de domínios Bloomberg.

**Arquivos**
- `src/features/news/constants/disclaimers.ts` — texto fixo CVM, versão "1.0"
- `src/features/news/constants/categorias.ts` — labels human-readable das 8 categorias
- `src/features/news/constants/compliance-blacklist.ts` — regex e arrays:
  - `TICKER_BR_REGEX = /\b[A-Z]{4}\d{1,2}\b/g`
  - `TICKER_US_LIST = ["AAPL", "TSLA", "NVDA", "MSFT", ...]` (~50 tickers populares)
  - `PHRASE_PRESCRIPTIVE_REGEX = /\b(compre|venda|vai (subir|cair)|rentabilidade garantida|lucro garantido|investimento certo|oportunidade única|não pode perder)\b/gi`
  - `PROMISE_RETURN_REGEX = /\d+\s*%\s+[a-z]*\s*(de retorno|de lucro|garantido|certo)/gi`
  - `BLOOMBERG_DOMAINS = /bloomberg\.(com|net|com\.br)|bloomberglinea/i`
  - `BLOOMBERG_BODY_FLAG = /\bbloomberg\b/i`
- `src/features/news/constants/perplexity-domains.ts` — re-exporta `PERPLEXITY_DOMAIN_FILTER` do contrato

**Critérios de aceite**
- [ ] Cada constante exportada e tipada
- [ ] Disclaimer literal corresponde EXATAMENTE ao texto da SPEC §CA-005
- [ ] Lista de tickers US tem ≥50 entradas (cobertura razoável)

**Testes mínimos:** `lint + typecheck`.

---

### [ ] F-003 — Rota pública `/news` (página índice)

- **Risco:** B (rota pública nova, contrato HTTP novo, mas estática/ISR)
- **Cobre:** RF-001, CA-001, CA-002
- **Branch:** `feat/news-index`
- **CI alvo:** N1

**Definition of Ready**
- [x] RF-001 e CAs claros
- [x] Contratos Zod prontos: `BriefingListItem` em `src/features/news/contracts/briefing.ts`
- [x] Padrão visual herda de `/blog` (já existe)
- [x] Sem migration de banco
- [ ] Mock data (5 briefings escritos manualmente em `content/news/_drafts/` para validar layout antes de F-007 estar pronto)

**Escopo incluído**
- `src/app/news/page.tsx` — Server Component que lê `content/news/*.mdx` filtrando `status="published"`
- `src/app/news/loading.tsx` — skeleton com grid de 6 cards
- Grid responsivo (3 col desktop, 2 tablet, 1 mobile) com cards
- Filtro por categoria via query param `?categoria=macro_global`
- Reading-time exibido (já tem `reading-time` package)
- Empty state: "Os primeiros briefings chegam em breve"
- Meta tags Open Graph + Twitter para a página índice

**Escopo excluído**
- Busca textual full-text (Anti-SPEC §6.1, fica para v2)
- Schema NewsArticle (vai em F-011, Marco 2)
- Telemetria de view do índice (vai em F-009)

**Arquivos que podem ser alterados**
- `src/app/news/page.tsx`
- `src/app/news/loading.tsx`
- `src/features/news/components/BriefingCard.tsx`
- `src/features/news/components/CategoriaFilter.tsx`
- `src/features/news/lib/read-briefings.ts` (helper que lê MDX do filesystem)

**Arquivos que NÃO podem ser alterados sem pausa**
- `docs/news/SPEC.md`, `docs/news/CONTRACTS.md`
- `src/features/news/contracts/*.ts`
- `src/app/blog/*` (rota `/blog` permanece intocada)

**Critérios de aceite**
- [ ] **CA-001:** Lista exibe briefings ordenados por data desc, TTFB <500ms
- [ ] **CA-002:** Filtro por categoria funciona via URL `?categoria=...`

**Testes mínimos** (Classe B = ≥1 teste por CA)

| Teste | Tipo | Cobre CA | Arquivo |
|---|---|---|---|
| Lista filtra por categoria | unit | CA-002 | `src/features/news/lib/__tests__/read-briefings.test.ts` |
| Empty state quando 0 briefings | unit | CA-001 | idem |
| Reading-time é exibido | unit (component) | CA-001 | `src/features/news/components/__tests__/BriefingCard.test.tsx` |

**Anti-SPEC relevante** (SPEC §6)
- §6.1 — NÃO criar opt-in de newsletter na página índice
- §6.1 — NÃO botão WhatsApp
- §6.4 — Nenhum chat widget

---

### [ ] F-004 — Rota pública `/news/[slug]` (briefing individual + OG card)

- **Risco:** B (rota pública nova; OG image dinâmica)
- **Cobre:** RF-002, RF-011, RF-012, CA-003, CA-004, CA-005, CA-023, CA-024, CA-025
- **Branch:** `feat/news-briefing-page`
- **CI alvo:** N1

**Definition of Ready**
- [x] Anatomia Brevidade Inteligente em SPEC §1 RF-002
- [x] Schema `Briefing` no contrato
- [x] `gray-matter` + `next-mdx-remote` já no projeto

**Escopo incluído**
- `src/app/news/[slug]/page.tsx` — Server Component, lê MDX, renderiza estrutura Brevidade Inteligente
- `src/app/news/[slug]/opengraph-image.tsx` — `@vercel/og` gera PNG 1200x630
- Botões de share: Telegram, LinkedIn, X, copiar link (sem WhatsApp)
- Disclaimer fixo no rodapé (importado de F-002)
- 410 Gone se status="archived"
- Página 404 limpa se slug não existe

**Escopo excluído**
- Schema NewsArticle JSON-LD (vai em F-011)
- Telemetria de view (vai em F-009)
- Bot Telegram (vai em F-012)

**Arquivos**
- `src/app/news/[slug]/page.tsx`
- `src/app/news/[slug]/opengraph-image.tsx`
- `src/features/news/components/BriefingHeader.tsx`
- `src/features/news/components/BriefingBody.tsx`
- `src/features/news/components/ShareButtons.tsx`
- `src/features/news/components/Disclaimer.tsx`

**Critérios de aceite**
- [ ] **CA-003:** anatomia Brevidade renderiza na ordem correta com todos os campos
- [ ] **CA-004:** tempo de leitura via `reading-time`
- [ ] **CA-005:** disclaimer EXATAMENTE igual ao texto da SPEC, com classe styling correta
- [ ] **CA-023:** OG card 1200x630 em <1s
- [ ] **CA-024:** botões share geram URLs corretos
- [ ] **CA-025:** zero referências a WhatsApp em todo o JSX (lint check)

**Testes mínimos**

| Teste | Tipo | Cobre CA | Arquivo |
|---|---|---|---|
| Renderização ordem dos campos | unit (component) | CA-003 | `src/features/news/components/__tests__/BriefingBody.test.tsx` |
| Disclaimer literal | unit | CA-005 | `src/features/news/components/__tests__/Disclaimer.test.tsx` |
| Telegram URL formato correto | unit | CA-024 | `src/features/news/components/__tests__/ShareButtons.test.tsx` |
| Ausência de WhatsApp | lint custom rule + unit | CA-025 | idem |
| OG card snapshot | snapshot | CA-023 | `src/app/news/[slug]/__tests__/og.test.ts` |

**Anti-SPEC relevante**
- §6.4 — sem WhatsApp
- §6.2 — disclaimer exato sempre presente

---

### [ ] F-005 — Compliance check engine (regex tickers + frases + Bloomberg)

- **Risco:** **C** — guardrail de compliance, regra de negócio crítica, falsos negativos têm impacto regulatório real (CVM)
- **Cobre:** RF-008, CA-015, CA-016, CA-017, CA-014b, CB-014, CB-017
- **Branch:** `feat/news-compliance-engine`
- **CI alvo:** **N2** (lint + typecheck + unit + integration + build)

**Definition of Ready**
- [x] Lista de regex e blacklist em F-002 (constantes)
- [x] Schema `ComplianceCheckResult`, `ComplianceViolation` em contracts
- [x] ADR-004 documenta a estratégia de guardrails técnicos
- [x] SPEC §RF-008 detalha cada tipo de violação
- [ ] Anti-SPEC §6.2 e §6.2b revisadas explicitamente para esta feature
- [ ] Test fixtures: 20 briefings exemplares (10 violadores + 10 limpos) para validar regex

**Escopo incluído**
- `src/features/news/compliance/checker.ts` — função `runComplianceCheck(briefing: BriefingDraft): ComplianceCheckResult`
- Verifica todos os campos string do briefing: `title`, `por_que_importa`, `entre_as_linhas`, `o_que_fica_de_olho`, `body_markdown`, `numeros[].texto`
- Verifica `fontes[].url` e `fontes[].dominio` contra `BLOOMBERG_DOMAINS`
- Retorna `passed` + array completo de `ComplianceViolation` (não para na primeira — Eduardo precisa ver TODAS)
- Cada violation tem `field`, `match`, `line_number`, `type`, `message` em PT-BR
- Função pura, idempotente, sem side effects

**Escopo excluído**
- NÃO altera o briefing (read-only check)
- NÃO chama API externa
- NÃO grava no banco (caller é responsável por persistir resultado)

**Arquivos**
- `src/features/news/compliance/checker.ts`
- `src/features/news/compliance/__tests__/checker.test.ts`
- `src/features/news/compliance/__fixtures__/violating-briefings.ts`
- `src/features/news/compliance/__fixtures__/clean-briefings.ts`

**Critérios de aceite**
- [ ] **CA-015:** ticker BR (PETR4, VALE3, BBAS3) detectado em qualquer campo
- [ ] **CA-016:** frase prescritiva detectada case-insensitive
- [ ] **CA-014b:** Bloomberg em `fontes[].url` ou `dominio` detectado
- [ ] **CB-014:** lista de regex é central + atualizável (auditoria mensal)
- [ ] **Test negativo obrigatório (Classe C):** "Vale a pena observar o setor de petróleo" NÃO bloqueia (palavra "Vale" não é ticker fora de contexto de regex)

**Testes mínimos** (Classe C exige ≥1 por CA + ≥1 edge + ≥1 negativo + integration)

| Teste | Tipo | Cobre | Arquivo |
|---|---|---|---|
| ticker_br_petr4 | unit | CA-015 | `checker.test.ts` |
| ticker_br_em_titulo | unit | CA-015 | idem |
| ticker_us_aapl | unit | CA-015 | idem |
| frase_compre | unit | CA-016 | idem |
| frase_compre_capitalizada | unit | CA-016 (case-insensitive) | idem |
| promessa_15_porcento_garantido | unit | CA-016 | idem |
| bloomberg_em_fontes_url | unit | CA-014b | idem |
| bloomberg_em_dominio | unit | CA-014b | idem |
| **edge: "Vale" como nome próprio fora de regex** | unit negativo | CA-015 (false-positive) | idem |
| **edge: 20 briefings limpos passam** | unit batch | qualidade global | idem |
| **edge: briefing 100% violador** | integration | múltiplas violations no mesmo briefing | idem |

**Anti-SPEC relevante** (revisada explicitamente para esta feature)
- §6.2 — todos os 7 itens (sem ticker, sem frase prescritiva, sem promessa retorno, etc.)
- §6.2b — todos os 5 itens (sem Bloomberg como fonte/corpo/parafraseado)
- §6.3 — bloqueio é server-side, nunca client-side

**Matriz de validação (preenchida no Prompt 3 — QA)**

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-015 | `checker.test.ts::CA-015 — ticker_br_petr4` | unit | passou | `npm test` (14/14) |
| CA-015 | `checker.test.ts::CA-015 — ticker_br_em_titulo` | unit | passou | `npm test` |
| CA-015 | `checker.test.ts::CA-015 — ticker_us_aapl` | unit | passou | `npm test` |
| CA-015 (edge negativo) | `checker.test.ts::CA-015 — vale_substantivo_nao_bate` | unit negativo | passou | `npm test` |
| CA-016 | `checker.test.ts::CA-016 — frase_compre` | unit | passou | `npm test` |
| CA-016 | `checker.test.ts::CA-016 — frase_compre_capitalizada` | unit | passou | `npm test` |
| CA-016 | `checker.test.ts::CA-016 — promessa_15_porcento_garantido` | unit | passou | `npm test` |
| CA-014b | `checker.test.ts::CA-014b — bloomberg_em_fontes_url` | unit | passou | `npm test` |
| CA-014b | `checker.test.ts::CA-014b — bloomberg_em_dominio` | unit | passou | `npm test` |
| CA-014b | `checker.test.ts::CA-014b — bloomberg_in_body` | unit | passou | `npm test` |
| CA-017 | `checker.test.ts::§6.3 — função é idempotente` | integration | passou | `npm test` |
| qualidade global | `checker.test.ts::edge — todos os 10 briefings limpos passam` | batch | passou | `npm test` |
| múltiplas violações | `checker.test.ts::integration — briefing 100% violador` | integration | passou | `npm test` |
| linha exata | `checker.test.ts::§6.3 — line_number reflete a linha real` | unit | passou | `npm test` |

**Notas:** começar pelas fixtures de teste; implementação direto pelo TDD. Lista de tickers US deve ser revisada com Eduardo antes do merge.

---

### [x] 🔴 F-006 — Admin `/admin/news` (lista + edit + aprovar + arquivar + upload multi-PDF) — **DESCONTINUADA 2026-04-29 (ADR-005)**

> **Status pós-pivot:** descontinuada. `/admin/posts` (existente no projeto) cobre o caso de uso para BlogPost direto. Aprovação editorial pelo Marcos vai por email tokenizado (F-018) em vez de UI admin dedicada. Trabalho de F-006 reaproveitado: zero — toda a feature foi apagada na limpeza pós-pivot.

- **Risco:** **C**
- **Status:** **CONCLUÍDO** — sessão executora externa — 2026-04-28 (Classe C, 25 testes novos passando, 97/97 totais verdes, build verde, validação visual em dev confirmada)
- **CI alvo:** N2 ✅
- **Dependência adicionada:** `@vercel/blob@^2.3.3` (autorizada em prompt)

**Entregáveis confirmados**
- ✅ `readAllBriefingsForAdmin()` em `src/features/news/lib/read-briefings.ts` — lê `content/news/` + `_drafts/`, ordena desc, filtra por status, paginação (default 20, max 100). `total` reflete pós-filtro / pré-paginação. Tipos `AdminBriefingRow` exportados inline (coesão).
- ✅ `readBriefingBySlug()` estendido para procurar em `_drafts/` também — public pages gateiam via `if (status !== "published") notFound()`. Metadata + OG image também gateadas para evitar leak de drafts (defense in depth)
- ✅ `locateBriefingFile()` exportado para que persistence saiba o `source` ("published" | "drafts") e o filepath real
- ✅ `src/features/news/persistence/publish-local.ts` — 4 funções puras: `publishBriefingLocal`, `archiveBriefingLocal`, `discardDraftLocal`, `saveBriefingEditsLocal`. Todas retornam `PersistenceResult` com `errorCode` estável. Banner `TODO(F-008)` no topo
- ✅ `GET /api/admin/news` — query Zod (status/limit/offset), responde `{ items, total }`. 401 sem auth
- ✅ `GET /api/admin/news/[slug]` — frontmatter + body + source + filepath
- ✅ `PATCH /api/admin/news/[slug]` — re-roda `runComplianceCheck` (F-005) sempre. Status final é determinado pelo compliance, NUNCA pelo caller (Anti-SPEC §6.2)
- ✅ `POST /api/admin/news/[slug]` — actions `approve_publish`/`archive`/`discard`/`save_edits`/`republish_telegram` (501 — F-012). approve_publish em blocked_compliance retorna 400 (Anti-SPEC §6.2)
- ✅ `POST /api/admin/news/upload-pdf` — multipart, 1-10 PDFs, ≤10MB cada, MIME server-side. Detecção de formato Bloomberg (PBN/BFW/BN/APW/UNKNOWN) por scan de primeiros 4KB. Vercel Blob storage com path `bloomberg-pdfs/YYYY-MM-DD-HHmmss-N.pdf`
- ✅ `/admin/news/page.tsx` — Tabs com 4 status + badges contagem; lista com badges (categoria, source, violations); ações inline (Aprovar, Arquivar, Descartar, Editar). CTA "Disparar pipeline" desabilitado (F-007)
- ✅ `/admin/news/[slug]/page.tsx` — editor `@uiw/react-md-editor` (Client wrapper via `dynamic({ ssr: false })`) + form completo de frontmatter; banner vermelho com violations destacadas quando `blocked_compliance`; botões Salvar / Aprovar (gated) / Arquivar / Descartar
- ✅ `/admin/news/upload/page.tsx` — input multi-file PDF com validação client-side espelhando server-side
- ✅ Fixture `content/news/_drafts/2026-04-28-fixture-pending-review.mdx` versionado para validação visual

**Arquivos criados (10)**
- `src/features/news/persistence/publish-local.ts`
- `src/features/news/persistence/__tests__/publish-local.test.ts` (12 testes)
- `src/app/api/admin/news/route.ts`
- `src/app/api/admin/news/[slug]/route.ts`
- `src/app/api/admin/news/upload-pdf/route.ts`
- `src/app/api/admin/news/__tests__/admin-api.test.ts` (13 testes)
- `src/app/admin/news/page.tsx`
- `src/app/admin/news/[slug]/page.tsx`
- `src/app/admin/news/upload/page.tsx`
- `content/news/_drafts/2026-04-28-fixture-pending-review.mdx`

**Arquivos alterados (3)**
- `src/features/news/lib/read-briefings.ts` (+`readAllBriefingsForAdmin`, +`locateBriefingFile`, `readBriefingBySlug` agora também lê `_drafts/`, paths via `getNewsDir()`/`getDraftsDir()` lazy)
- `src/app/news/[slug]/page.tsx` (`generateMetadata` + page gateiam por `status === "published"`; ArchivedBriefing já removido em F-011)
- `src/app/news/[slug]/opengraph-image.tsx` (gate por status — drafts caem no fallback genérico)
- `package.json` (`@vercel/blob` adicionado)

**Decisões tomadas**
- **Padrão de auth herdado:** `checkAdminAuth()` em `src/lib/auth-check.ts` (mesmo de `/api/admin/posts`). Páginas admin client-side fazem check redundante com `getCurrentUser()` + redirect (mesmo padrão de `/admin/posts`)
- **Editor MDX:** Client wrapper inline via `dynamic(() => import("@uiw/react-md-editor"), { ssr: false })` em `src/app/admin/news/[slug]/page.tsx` — replica padrão de `src/app/admin/posts/new/page.tsx`. Não foi criado componente compartilhado (mantém isolamento e evita acoplamento)
- **Mock de filesystem nos testes:** `vi.spyOn(process, "cwd").mockReturnValue(tmpRoot)` + `os.tmpdir()` por teste, com `beforeEach`/`afterEach` para garantir isolamento. Forced lazy resolution em `read-briefings.ts` e `publish-local.ts` (paths via `getNewsDir()` em vez de constantes top-level) para que o spy funcione entre rodadas
- **`archived-slugs.generated.ts` após arquivamento:** apenas no rebuild (`npm run prebuild`). API de archive retorna `notice` explícito instruindo Eduardo a rodar `prebuild` para o middleware F-011 refletir o 410. F-008 (cron+commit GitHub) vai automatizar via webhook
- **Persistence "modo dev" intencional:** todas as funções gravam no filesystem local. F-008 substitui por commit GitHub via Octokit, mas mantém a interface `PersistenceResult` estável. Banner explícito no topo do arquivo
- **Defense in depth contra leak de drafts:** ao estender `readBriefingBySlug` para `_drafts/`, gateei `generateMetadata` E `opengraph-image.tsx` por `status === "published"`. Drafts retornam título genérico + `robots: noindex,nofollow` + OG card fallback genérico. HTTP status do `notFound()` é 404 em produção (Next 15 dev mode às vezes serve 200 com 404-page no body — quirk conhecido, não é bug F-006)
- **detectBloombergFormat heurística mínima:** scan ASCII dos primeiros 4KB do PDF. Falha gracefully → UNKNOWN. Extração real chega em F-007 via pdfjs-dist + Gemini fallback

**Matriz de validação F-006**

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-018 | `admin-api.test.ts::GET — filtra por status retorna { items, total }` | integration | passou | `npm test` |
| CA-018 | `publish-local.test.ts::readAllBriefingsForAdmin — lista drafts + published, ordena desc, filtra` | integration | passou | idem |
| CA-018 | `publish-local.test.ts::readAllBriefingsForAdmin — limit/offset; total reflete filtro` | integration | passou | idem |
| CA-019 | `admin-api.test.ts::POST approve_publish move draft para content/news/` | integration | passou | idem |
| CA-019 | `publish-local.test.ts::publishBriefingLocal — move arquivo + ajusta status=published` | integration | passou | idem |
| CA-019 negativo / Anti-SPEC §6.2 | `admin-api.test.ts::approve_publish em blocked_compliance retorna 400` | integration negativo | passou | idem |
| CA-019 negativo / Anti-SPEC §6.2 | `publish-local.test.ts::publishBriefingLocal — rejeita blocked_compliance` | integration negativo | passou | idem |
| CA-017 | `admin-api.test.ts::PATCH salvar edits limpos mantém pending_review` | integration | passou | idem |
| CA-017 | `admin-api.test.ts::PATCH edição que cria violation → blocked_compliance` | integration | passou | idem |
| CA-017 | `publish-local.test.ts::saveBriefingEditsLocal — persiste violations quando blocked` | integration | passou | idem |
| CA-017 | `publish-local.test.ts::saveBriefingEditsLocal — limpa violations quando volta a pending` | integration | passou | idem |
| CA-008 | `admin-api.test.ts::upload PDF — rejeita .docx 400` | integration | passou | idem |
| CA-008 | `admin-api.test.ts::upload PDF — rejeita >10MB 413` | integration | passou | idem |
| CA-008b | `admin-api.test.ts::upload — rejeita >10 PDFs 400` | integration | passou | idem |
| CA-008b | `admin-api.test.ts::upload — aceita 1 PDF + detecta BFW` | integration | passou | idem |
| CA-020 | `admin-api.test.ts::GET sem auth retorna 401` | integration | passou | idem |
| CA-020 | `admin-api.test.ts::upload sem auth retorna 401` | integration | passou | idem |
| CA-020 | `dev :3003 → /admin/news redireciona 307 para /admin/login` | manual | passou | curl |
| RF-009 | `admin-api.test.ts::discard remove draft, rejeita publicado` | integration negativo | passou | idem |
| RF-009 | `publish-local.test.ts::discardDraftLocal — apaga draft de _drafts/` | integration | passou | idem |
| RF-009 invariante | `publish-local.test.ts::discard de publicado é rejeitado` | integration negativo | passou | idem |
| RF-009 / SPEC §CB-012 | `publish-local.test.ts::archiveBriefingLocal — published → archived in-place` | integration | passou | idem |
| RF-009 invariante | `publish-local.test.ts::archive de draft é rejeitado` | integration negativo | passou | idem |
| F-012 | `admin-api.test.ts::republish_telegram retorna 501` | integration | passou | idem |
| F-011 regressão | `dev :3003 — /news, /news/<live>, /sitemap.xml, /llms.txt continuam 200` | manual | passou | curl |

- **Risco:** **C** — admin altera estado público, dispara commits no repo, executa publicação. Auth obrigatória.
- **Cobre:** RF-004, RF-009, CA-008, CA-008b, CA-018, CA-019, CA-020
- **Branch:** `feat/news-admin`
- **CI alvo:** **N2**

**Definition of Ready**
- [x] Auth Supabase já existe em `/admin/login`, middleware existente
- [x] Padrão visual herda de `/admin/posts`
- [x] Contratos Zod `AdminBriefingActionRequest`, `AdminListBriefingsQuery`, `UploadPdfRequest`
- [x] Editor `@uiw/react-md-editor` já no projeto
- [ ] Tabela Supabase `news_pipeline_runs` criada (depende de F-009 — pode rodar em paralelo)

**Escopo incluído**
- `src/app/admin/news/page.tsx` — lista com 4 abas (`pending_review`, `blocked_compliance`, `published`, `archived`)
- `src/app/admin/news/[slug]/page.tsx` — editor MDX + preview + ações
- `src/app/admin/news/upload/page.tsx` — upload multi-PDF Bloomberg (1-10 arquivos)
- `src/app/api/admin/news/route.ts` — GET list (paginado)
- `src/app/api/admin/news/[slug]/route.ts` — GET, PATCH (save_edits), POST (approve_publish | archive | discard)
- `src/app/api/admin/news/upload-pdf/route.ts` — multipart, valida MIME, salva em Vercel Blob
- Hook de re-execução do compliance check ao salvar (chama F-005)
- Badge vermelho "Bloqueado — Compliance" com lista de violations destacadas
- Middleware existente protege todas as rotas

**Escopo excluído**
- Bot Telegram (F-012)
- Hook de commit GitHub (F-008 — separado por classe D)
- Geração IA (F-007)

**Arquivos**
- `src/app/admin/news/**/*` (todos novos)
- `src/app/api/admin/news/**/*` (todos novos)
- `src/features/news/admin/list-briefings.ts` (server helper)
- `src/features/news/admin/upload-pdf.ts` (Vercel Blob client)

**Critérios de aceite**
- [ ] **CA-018:** 4 abas com badges de contagem
- [ ] **CA-019:** aprovação dispara commit (delegado a F-008) + redireciona para `/news/[slug]` em ≤60s
- [ ] **CA-020:** middleware bloqueia acesso não autenticado (401 → redirect login)
- [ ] **CA-008:** upload de não-PDF rejeita 400; >10MB rejeita 413
- [ ] **CA-008b:** até 10 PDFs simultâneos; 11 rejeita 400
- [ ] **CA-017:** salvar edição re-executa compliance (chama F-005)

**Testes mínimos** (Classe C)

| Teste | Tipo | Cobre | Arquivo |
|---|---|---|---|
| Listagem filtra por status | integration | CA-018 | `__tests__/list-briefings.test.ts` |
| Auth bloqueia user sem sessão | integration | CA-020 | `__tests__/auth.test.ts` |
| Upload PDF valida MIME | integration | CA-008 | `__tests__/upload.test.ts` |
| Upload >10 PDFs rejeita | integration | CA-008b | idem |
| Aprovar move briefing para published + chama F-008 | integration | CA-019 | `__tests__/approve.test.ts` |
| Salvar edição re-roda compliance | integration | CA-017 | `__tests__/save-edits.test.ts` |
| **negativo:** user logado não-admin tenta aprovar | integration negativo | CA-020 | `__tests__/auth.test.ts` |

**Anti-SPEC relevante**
- §6.1 — não cria opt-in de newsletter
- §6.2 — admin não pode publicar briefing em `blocked_compliance` direto (re-check obrigatório)
- §6.3 — toda mutação valida via Zod

---

### [ ] F-007 — Pipeline de geração IA (Bloomberg → Perplexity → OpenAI → MDX draft)

- **Risco:** **D** — endpoint que afeta produção (cria conteúdo público após aprovação), consome custo real de APIs externas, integra 3 vendors. Falha aqui pode gerar custos altos ou conteúdo não-compliance.
- **Cobre:** RF-003, RF-005, RF-006, RF-007, RF-008 (integração), CA-006, CA-007, CA-009, CA-010, CA-010b, CA-011, CA-012, CA-012b, CA-013, CA-014, CA-014b, CB-001, CB-002, CB-003, CB-004, CB-006, CB-008, CB-015, CB-016, CB-019
- **Branch:** `feat/news-ia-pipeline`
- **CI alvo:** **N3** (lint + typecheck + unit + integration + e2e contract + build)
- **Feature Contract dedicado:** [feature-contracts/F-007-pipeline-ia.md](./feature-contracts/F-007-pipeline-ia.md) ← obrigatório classe D
- **Cursor brief com Rollback obrigatório:** mesmo arquivo

**Resumo:** Implementa o pipeline completo: extrai PDFs Bloomberg via `pdfjs-dist`, normaliza por formato, monta queries Perplexity excluindo Bloomberg, chama OpenAI GPT-5-mini com Structured Output validado por Zod, roda compliance check, persiste drafts. **NÃO publica nada — só cria drafts em `pending_review` ou `blocked_compliance`**.

Ver Feature Contract dedicado para detalhamento completo (escopo, arquivos, testes, rollback).

---

### [ ] 🔴 F-008 — Vercel Cron + commit GitHub para publicação — **DESCONTINUADA 2026-04-29 (ADR-005)**

> **Status pós-pivot:** descontinuada. Sem MDX em filesystem nem commit GitHub no fluxo novo (Supabase BlogPost direto). Vercel Cron continua em F-015 (apontando para o novo `/api/news/cron` que insere em `BlogPost`). Sem Octokit, sem `archived-slugs.generated.ts`, sem `news_publications`. Trabalho F-008 reaproveitado: parte de `pipeline-db.ts` (lock distribuído) foi simplificada — Supabase já dá idempotência via `slug` UNIQUE em BlogPost. Detalhamento original abaixo, mantido para auditoria.

- **Risco:** **D** — afeta produção real (commits no repo `main`, dispara rebuild Vercel, conteúdo vai público). Falha de PAT GitHub ou race condition pode bloquear publicação ou criar duplicatas.
- **Cobre:** RF-003, RF-010, CA-006, CA-007, CA-019, CA-021, CA-022, CB-005, CB-006
- **Branch:** `feat/news-cron-publish`
- **CI alvo:** **N3**
- **Feature Contract dedicado:** [feature-contracts/F-008-cron-commit.md](./feature-contracts/F-008-cron-commit.md)

**Resumo:** Implementa endpoint protegido `/api/news/cron` que valida `CRON_SECRET` e invoca o pipeline F-007. Implementa também a função de commit do MDX aprovado via Octokit + GitHub PAT, com lock distribuído (Supabase) para prevenir race conditions, retry com backoff, e rollback explícito.

Ver Feature Contract dedicado.

---

### [ ] F-009 — Telemetria Supabase (eventos + pipeline runs)

- **Risco:** B (escrita em tabela própria, sem PII em texto puro)
- **Cobre:** RF-015, RNF-007, CA-029
- **Branch:** `feat/news-telemetry`
- **CI alvo:** N1

**Definition of Ready**
- [x] Supabase já no projeto, padrão de migrations existe em `wealth-planning/`
- [x] Schemas `TelemetryEvent`, `PipelineRun` em contracts
- [x] IP hash via `crypto.createHash("sha256")`

**Escopo incluído**
- Migration: `news_events`, `news_pipeline_runs`, `news_pipeline_errors` (3 tabelas)
- `src/features/news/telemetry/track.ts` — função `track(event: TelemetryEvent)`
- Server Action que registra view ao acessar `/news/[slug]`
- Hook em `ShareButtons` que registra share por canal
- Hook em CTA "Agendar Diagnóstico" que registra `cta_diagnostico`

**Escopo excluído**
- Dashboard de analytics (v2)
- Heatmap, scroll depth (Anti-SPEC §8)

**Arquivos**
- `supabase/migrations/2026XXXX_news_telemetry.sql`
- `src/features/news/telemetry/track.ts`
- `src/features/news/telemetry/__tests__/track.test.ts`

**Critérios de aceite**
- [ ] **CA-029:** view registrado com `ip_hash` (sha256 hex 64 chars), nunca IP puro
- [ ] Migration aplica e rollback limpo

**Testes mínimos**

| Teste | Tipo | Cobre | Arquivo |
|---|---|---|---|
| track view sem PII | unit | CA-029 | `track.test.ts` |
| ip_hash é sha256 hex | unit | RNF-007 | idem |
| Schema valida event | unit | contracts | idem |

**Anti-SPEC relevante**
- §6.2 — não armazenar PII
- §6.3 — telemetria server-side, sem localStorage

---

## 3. Backlog Marco 2 (distribuição completa)

---

### [ ] 🔴 F-010 — Endpoint `/api/news/weekly-digest` para Mailchimp — **DESCONTINUADA 2026-04-29 (ADR-005)**

> **Status pós-pivot:** descontinuada. Marcos não pediu mais "weekly digest Mailchimp" — o foco do reaproveitamento de conteúdo virou **carrossel Instagram/LinkedIn** (F-019). Email weekly é coberto pela newsletter Mailchimp existente da LDC, sem necessidade de endpoint dedicado. Detalhamento original abaixo, mantido para auditoria.

- **Risco:** B (endpoint protegido, output formatado para sistema externo)
- **Cobre:** RF-014, CA-028
- **Branch:** `feat/news-weekly-digest`
- **CI alvo:** N1

**Definition of Ready**
- [x] Schema `WeeklyDigestRequest`, `WeeklyDigestResponse` em contracts
- [x] Mailchimp aceita HTML inline-styled em campaign editor (validado)
- [x] Telemetria pronta (F-009) para registrar `weekly_digest_render`

**Escopo incluído**
- `src/app/api/news/weekly-digest/route.ts` — GET com `x-api-key`
- HTML inline-styled, max-width 600px, fonte Public Sans, cores LDC
- Top 5 da semana por `view_count` desc, tie-break data
- View admin de preview em `/admin/news/weekly-digest`

**Escopo excluído**
- Envio direto para Mailchimp via API (Eduardo cola manualmente — simplicidade)
- Templates customizáveis (v2)

**Arquivos**
- `src/app/api/news/weekly-digest/route.ts`
- `src/app/admin/news/weekly-digest/page.tsx`
- `src/features/news/digest/render-html.ts`
- `src/features/news/digest/__tests__/render-html.test.ts`

**Critérios de aceite**
- [ ] **CA-028:** retorna HTML inline-styled compatível Mailchimp
- [ ] x-api-key inválido retorna 401
- [ ] Top 5 por view_count, tie-break data
- [ ] Registra evento `weekly_digest_render`

**Testes mínimos**

| Teste | Tipo | Cobre | Arquivo |
|---|---|---|---|
| Top 5 por view_count desc | unit | CA-028 | `render-html.test.ts` |
| HTML é inline-styled | unit (regex check) | CA-028 | idem |
| x-api-key inválido 401 | integration | RNF-007 | `route.test.ts` |
| Empty week (zero briefings) | unit edge | edge case | idem |

**Anti-SPEC relevante**
- §6.1 — não cria lista própria, só serve digest

---

### [x] F-011 — Schema NewsArticle + GEO (`/llms.txt`, sitemap) + DEBT-001

- **Risco:** B (additive — sem breaking change)
- **Status:** **CONCLUÍDO** — sessão executora externa — 2026-04-27 (Classe B, 17 testes novos passando, build verde, prebuild operacional, validação visual em dev confirmada)
- **Cobre:** RF-013, CA-026, CA-027 + DEBT-001 (CB-012 archived → 410 Gone)
- **CI alvo:** N1 ✅

**Entregáveis confirmados**
- ✅ JSON-LD `NewsArticle` + `BreadcrumbList` server-side em `/news/[slug]`
- ✅ JSON-LD `CollectionPage` server-side em `/news`
- ✅ `Organization` schema NÃO duplicado nas páginas /news (root layout já injeta `getOrganizationSchema()` globalmente — verificado em `src/app/layout.tsx`)
- ✅ `public/llms.txt` 2.1KB regenerado no `prebuild` com 5/50 briefings, sem Bloomberg, com disclaimer CVM 19/2021
- ✅ `src/app/sitemap.ts` estendido: `/news` (lastmod=max data_publicacao) + cada `/news/[slug]` com lastmod ISO. Archived excluídos
- ✅ DEBT-001 resolvido via **Opção A** (middleware + lista gerada): `src/middleware.ts` matcher `["/admin/:path*", "/news/:slug"]` retorna 410 Gone para slugs em `archived-slugs.generated.ts`. Validado em dev: `/news/<archived>` → 410, `/news/<live>` → 200, `/admin/news` → 307 (regressão F-006 OK), `/news/<archived>/opengraph-image` → 200 (matcher de segmento único exclui rotas filhas)

**Arquivos criados**
- `src/features/news/seo/base-url.ts`
- `src/features/news/seo/json-ld.ts`
- `src/features/news/seo/llms-txt.ts`
- `src/features/news/seo/archived-slugs.generated.ts` (versionado, AUTO-GENERATED)
- `src/features/news/seo/__tests__/json-ld.test.ts` (8 testes)
- `src/features/news/seo/__tests__/llms-txt.test.ts` (5 testes)
- `src/__tests__/middleware.test.ts` (4 testes — inclui regressão F-006)
- `src/app/__tests__/sitemap.test.ts` (3 testes)
- `scripts/generate-archived-list.ts`
- `scripts/generate-llms-txt.ts`

**Arquivos alterados**
- `src/middleware.ts` (matcher dual + branch `/news/[slug]` archived 410)
- `src/app/sitemap.ts` (entradas /news + slugs)
- `src/app/news/page.tsx` (CollectionPage JSON-LD)
- `src/app/news/[slug]/page.tsx` (NewsArticle + BreadcrumbList JSON-LD; ArchivedBriefing removido pois 410 ocorre antes de page rodar)
- `package.json` (script `prebuild`)
- `.env.example` (`NEXT_PUBLIC_SITE_URL` no bloco /news)

**Decisões registradas**
- **Opção A** sobre Opção C (404): cumpre SPEC §CB-012 literalmente (410, não 404). Lista archived é gerada no prebuild e versionada — git diff sinaliza alterações ao conjunto de slugs ocultos do índice público (auditoria). Middleware adicionou ~1ms de overhead apenas em requests `/news/[slug]` (Set lookup), zero impacto em outras rotas.
- Matcher `["/admin/:path*", "/news/:slug"]` (sem `[^/]+` constraint — path-to-regexp do Next já não atravessa slash). `/news/[slug]/opengraph-image` permanece servido normalmente (rota multi-segmento fora do matcher).
- Branch `/news/[slug]` no middleware retorna **antes** do bloco `/admin` (early return), garantindo zero side-effect de auth para rotas de news.
- Organization schema NÃO injetado em /news pages — root layout (`src/app/layout.tsx:145-146`) já registra `getOrganizationSchema()` globalmente via `<JsonLd data={...} />`.
- Reuso do componente `<JsonLd>` existente em `@/components/JsonLd` (DRY com fluxo de schema do site).

**Matriz de validação F-011**

| CA | Teste | Tipo | Status |
|---|---|---|---|
| CA-026 | `json-ld.test.ts::buildNewsArticleJsonLd — preenche os 11+ campos obrigatórios` | unit | passou |
| CA-026 | `json-ld.test.ts::buildBreadcrumbListJsonLd — 4 itens em ordem` | unit | passou |
| CA-026 | `json-ld.test.ts::buildCollectionPageJsonLd — limita hasPart a 20` | unit | passou |
| CA-026 | `json-ld.test.ts::usa imagem_destacada_url quando presente` | unit | passou |
| CA-026 | `json-ld.test.ts::fallback /opengraph-image quando ausente` | unit | passou |
| CA-027 | `llms-txt.test.ts::contém seção '## /news' + URL canônica + ordem desc` | unit | passou |
| CA-027 | `llms-txt.test.ts::respeita limite default 50` | unit | passou |
| CA-027 / Anti-SPEC §6.2b | `llms-txt.test.ts::NÃO menciona Bloomberg` | unit | passou |
| Anti-SPEC §6.2 | `llms-txt.test.ts::inclui disclaimer CVM 19/2021` | unit | passou |
| Anti-SPEC §6.1 | `llms-txt.test.ts::tom descritivo, sem CTA agressivo` | unit | passou |
| RNF-004 | `sitemap.test.ts::inclui /news + cada briefing publicado` | unit | passou |
| RNF-004 / CB-012 | `sitemap.test.ts::não inclui slugs quando reader vazio (archived filtrados)` | unit | passou |
| RNF-004 | `sitemap.test.ts::/news lastModified = max data_publicacao` | unit | passou |
| CB-012 | `middleware.test.ts::retorna 410 Gone para slug archived` | unit | passou |
| CB-012 | `middleware.test.ts::deixa passar slug NÃO archived` | unit | passou |
| CB-012 (regressão) | `middleware.test.ts::/admin/news NÃO entra no fluxo archived` | unit | passou |
| CB-012 | `middleware.test.ts::/admin/login permitido sem auth` | unit | passou |

---

### [ ] 🔴 F-012 — Bot Telegram que posta após publicação — **DESCONTINUADA 2026-04-29 (ADR-005)**

> **Status pós-pivot:** descontinuada. Reaproveitamento de conteúdo focou em **carrossel Instagram/LinkedIn** (F-019), não Telegram. Posicionamento UHNW prioriza LinkedIn > Telegram. Detalhamento original abaixo, mantido para auditoria.

- **Risco:** **C** — depende de webhook + token externo, falha pode duplicar postagens, exposição de canal público
- **Cobre:** RF-016, CA-030, CB-013
- **Branch:** `feat/news-telegram-bot`
- **CI alvo:** **N2**

**Definition of Ready**
- [x] Schema `TelegramPostRequest`, `TelegramPostResponse` em contracts
- [ ] Token Telegram + chat_id criados (Eduardo)
- [ ] Canal `t.me/ldcnews` criado e configurado

**Escopo incluído**
- `src/features/news/distribution/telegram.ts` — função `postBriefingToTelegram(req)`
- Hook em F-008 (após commit publicado) que chama postagem
- Botão "Republicar Telegram" em `/admin/news/[slug]` para retry manual (CB-013)
- Idempotência: se `briefing_slug` já tem `message_id` em telemetria, não posta de novo

**Escopo excluído**
- Bot interativo (responde perguntas — v2)
- Polling (usar webhook simples ou hook após commit é suficiente)

**Arquivos**
- `src/features/news/distribution/telegram.ts`
- `src/features/news/distribution/__tests__/telegram.test.ts`

**Critérios de aceite**
- [ ] **CA-030:** mensagem aparece no canal em <30s da publicação
- [ ] **CB-013:** falha do Telegram não bloqueia publicação; retry manual via admin
- [ ] Idempotente: republicar não duplica

**Testes mínimos** (Classe C)

| Teste | Tipo | Cobre | Arquivo |
|---|---|---|---|
| Post sucesso retorna message_id | integration (mock Telegram API) | CA-030 | `telegram.test.ts` |
| Falha do Telegram não bloqueia | integration | CB-013 | idem |
| Idempotência | integration | CA-030 | idem |
| **negativo:** token inválido retorna 401 sem retry | integration negativo | segurança | idem |

**Anti-SPEC relevante**
- §6.4 — apenas Telegram, LinkedIn, X (sem Discord, Reddit, etc.)

---

## 4. Concluído

- [x] **F-001 — Setup de pacotes, env vars e configuração base** — sessão diretor — 2026-04-27 (Classe A, CI N1 verde, lint/typecheck/build verdes)
- [x] **F-002 — Constantes, disclaimers e blacklist de compliance** — sessão diretor — 2026-04-27 (Classe A, 4 arquivos, zero erros)
- [x] **F-005 — Compliance Check Engine** — sessão executora externa — 2026-04-27 (Classe C, 14/14 testes passando, build verde, Vitest 4.1.5 instalado e configurado, 1 bug latente descoberto e mitigado)
  - Vitest 4.1.5 + @vitest/ui adicionados ao projeto; scripts `test`, `test:watch`, `test:ui`, `typecheck` registrados no `package.json`
  - `vitest.config.ts` com `tsconfigPaths: true` para herdar alias `@/`
  - 14 testes unitários cobrindo CA-015, CA-016, CA-014b, CA-017 + edge negativo "Vale" + idempotência + line_number + batch de 10 limpos
  - **Decisões registradas:** input `ComplianceCheckInput` permissivo (não usa schema `Briefing` com refine Zod, para defense in depth); Unicode boundary post-filter no checker para mitigar falso-positivo de single-letter US tickers em palavras com acentos PT-BR; `runComplianceCheck(briefing, { now })` com param opcional para testabilidade
- [x] **F-009 — Telemetria Supabase (migrations + função track + helpers)** — sessão executora externa via MCP Supabase — 2026-04-27 (Classe B, 12/12 testes passando, build verde, migration `news_telemetry` aplicada com sucesso em produção)
  - 3 tabelas criadas: `news_events`, `news_pipeline_runs`, `news_pipeline_errors` — todas com RLS habilitada e policy `Service role full access to <tabela>` replicando padrão do `BlogPost`
  - 4 indexes secundários + 3 PKs; partial index em `news_events.briefing_slug` (WHERE NOT NULL)
  - Cliente Supabase isolado em `src/features/news/telemetry/client.ts` com tipo local `NewsTelemetryDB` derivado de `z.input<typeof TelemetryEvent>` (sem `any`, sem cast cego)
  - Helpers: `hashIp` (SHA-256 hex 64 chars com salt opcional `NEWS_IP_HASH_SALT`), `extractRequestMeta` (lê `x-forwarded-for`/`x-real-ip`, trunca user_agent em 500 chars, aceita `Request` para máxima compatibilidade)
  - Função `track()` silencia erros de infra (Supabase down) mas propaga `ZodError` (bug interno do caller). Padrão recomendado: `void track(event)` no caller
  - Migration aplicada via `mcp__supabase__apply_migration` em `xvbpqlojxwbvqizmixrr` (sa-east-1, PG 17.4); rollback `*_down.sql` presente
  - **Aplicação requer ferramenta MCP Supabase** ativa na sessão — instalada via `claude mcp add --scope project` em 2026-04-27
- [x] **F-006 — Admin `/admin/news` (lista + edit + aprovar + arquivar + upload multi-PDF)** — sessão executora externa — 2026-04-28 (Classe C, 25 testes novos passando, 97/97 totais verdes, build verde com prebuild operacional)
  - 4 abas com badges (pending_review/blocked_compliance/published/archived); editor `@uiw/react-md-editor` + form completo de frontmatter; banner vermelho com violations destacadas; ações Aprovar/Arquivar/Descartar/Editar com gates Anti-SPEC §6.2 (approve_publish em blocked retorna 400)
  - Upload multi-PDF (1-10, ≤10MB cada) via Vercel Blob, MIME server-side; detecção heurística de formato Bloomberg (PBN/BFW/BN/APW/UNKNOWN)
  - Persistence em modo "filesystem local" — `publish-local.ts` move/grava `.mdx` em `content/news/` ou `_drafts/`. F-008 substitui por commit GitHub via Octokit mantendo interface `PersistenceResult` estável (banner `TODO(F-008)` no topo)
  - Re-roda `runComplianceCheck()` (F-005) em todo PATCH; status final é DETERMINADO pelo compliance, NUNCA pelo caller. Saída de `blocked_compliance` exige edição+save antes de publish (Anti-SPEC §6.2)
  - **Decisões registradas:** lazy path resolution (`getNewsDir()`/`getDraftsDir()`) para suportar testes com `vi.spyOn(process, "cwd")`; `readBriefingBySlug` agora também lê `_drafts/` — gateei `generateMetadata` + `opengraph-image.tsx` por `status === "published"` para evitar leak de drafts (defense in depth); editor MDX inline via `dynamic({ ssr: false })` (não criou wrapper compartilhado, mantém isolamento); `archived-slugs.generated.ts` regenerado apenas no `prebuild` — API de archive retorna `notice` instruindo Eduardo a rodar `prebuild` para middleware F-011 refletir
- [x] **F-011 — Schema NewsArticle + GEO (`/llms.txt` + sitemap dinâmico) + DEBT-001 (Route Handler 410 Gone)** — sessão executora externa — 2026-04-27 (Classe B, 17 testes novos passando, 72/72 totais verdes, build verde com prebuild operacional, validação visual em dev)
  - JSON-LD `NewsArticle` + `BreadcrumbList` server-side em `/news/[slug]`; `CollectionPage` server-side em `/news`. Organization schema NÃO duplicado pois root layout já injeta globalmente
  - `public/llms.txt` 2.1KB regenerado a cada build (`npm run prebuild`), 5/50 briefings, sem Bloomberg, com disclaimer CVM 19/2021. Tom descritivo (Anti-SPEC §6.1)
  - Sitemap estendido com `/news` (lastmod = max data_publicacao) + cada `/news/[slug]` publicado. Archived excluídos automaticamente via `readPublishedBriefings()`
  - **DEBT-001 resolvido — Opção A (middleware + lista gerada):** matcher dual `["/admin/:path*", "/news/:slug"]`, archived-slugs.generated.ts versionado e regenerado no prebuild. `/news/<archived>` → 410 Gone, `/admin/news` mantém auth (regressão F-006 OK)
  - Reuso do componente `@/components/JsonLd` existente
  - **Decisões registradas:** Opção A escolhida (vs Opção C de 404) por aderência literal à SPEC §CB-012 + auditoria via git diff da lista de archived; matcher `/news/:slug` (sem constraint redundante) isola opengraph-image e /admin/news; `getBaseUrl()` substitui `SITE_BASE_URL` literal nas pages de news (canonical agora correto em dev local)
- [x] **F-003 + F-004 — Rotas públicas /news + /news/[slug] + card OG + 5 mock briefings** — sessão executora externa — 2026-04-27 (Classe B, 21 testes novos passando, build verde, 4 rotas validadas via curl)
  - 5 mock briefings em `content/news/` distribuídos em 5 categorias (macro_global, geopolítica, macro_brasil, internacional_uhnw, sucessao_tributacao). Todos passam `runComplianceCheck` (zero violations)
  - `src/features/news/lib/read-briefings.ts` com `readPublishedBriefings` e `readBriefingBySlug`, validação Zod em 100% dos frontmatters, ignora `_drafts/`
  - 6 componentes em `src/features/news/components/`: `BriefingCard`, `BriefingHeader`, `BriefingBody` (react-markdown), `ShareButtons` (4 botões, ZERO WhatsApp), `Disclaimer` (texto literal de constants), `CategoriaFilter` (Server Component com Links)
  - Server Components + ISR (`revalidate=60`) — divergência proposital de `/blog` para SEO/GEO de F-011
  - OG image dinâmica em `src/app/news/[slug]/opengraph-image.tsx` via `@vercel/og`, runtime Node, 1200x630, fundo cor da categoria, fonte sans-serif default (sem fonte custom v1)
  - Identidade visual diferenciada: hero menor que `/blog` (12 py), label "LDC News · EDITORIAL DIÁRIO" discreto, cards 16:9 (vs 16:10 blog), categoria badge usa cor real (não verde LDC fixo)
  - Infra de testes evoluída: Vitest 4 + Rolldown + `@vitejs/plugin-react` + `jsdom` + `@testing-library/react` + `jest-dom`, `vitest.setup.ts` global
  - **Decisões registradas:** Server Components + ISR (vs `'use client'` do blog) por SEO; CategoriaFilter como Server Component com Links em vez de `useRouter`; `react-markdown` em vez de `next-mdx-remote` (briefings são Markdown puro); OG runtime Node sem fonte custom (aceitável v1); página archived retorna 200 com `TODO(F-011)` para implementar 410 quando F-011 (GEO/sitemap/Route Handlers) chegar
- [x] **F-007 — Pipeline de geração IA (Bloomberg → Perplexity → OpenAI → MDX draft)** — sessão executora externa — 2026-04-28 (Classe **D**, 133/133 testes passando, build verde, smoke test ao vivo gerando briefing real)
  - Stack final: pdfjs-dist (extração local) + Gemini 2.5 Flash multimodal (caminho normal — PDFs Bloomberg via email são raster) + Perplexity Sonar Pro (fontes públicas) + OpenAI GPT-5-mini Structured Output
  - 4 PDFs Bloomberg fixtures versionados em `src/features/news/pipeline/__tests__/__fixtures__/bloomberg-pdfs/` (com `.gitignore` de defesa em profundidade contra commit acidental — ToS Bloomberg)
  - System prompt v1.1 (~3.800 tokens, string literal estável para prompt cache OpenAI) com 8 seções: identidade, anatomia, categorias, compliance §6.2, Bloomberg §6.2b, descartes, saída, 2 exemplos few-shot
  - Pipeline orchestrator com idempotência via slug determinístico (hash 6-chars de date|slug|primeira-fonte-url), unescape de body markdown `\\n` → `\n`, hard fail R$5/rodada
  - Endpoint `POST /api/news/cron` protegido por `CRON_SECRET` via `timingSafeEqual` + feature flag `NEWS_PIPELINE_ENABLED`
  - Smoke test executado: 1 briefing real gerado em `content/news/_drafts/2026-04-28-juros-futuros-sobem-antes-do-copom-b4248f.mdx`, custo R$0,30, duration 100s (timeout Gemini 429 paralelo — em condição normal ~46s), 0 violações compliance, 0 menções Bloomberg
  - Cliente Supabase pipeline-db isolado untyped + helpers tipados (workaround para bug supabase-js v2 multi-table)
  - Schema OpenAI relaxado (sem `.url()`/`.uuid()`/`.optional()` que `zodResponseFormat` rejeita) + validação dura no `BriefingGenerationResponse.parse()` canônico downstream
  - **Bugs descobertos e documentados em memória:** OpenAI Structured Outputs rejeita `.url()`/`.uuid()`/`.optional()` (workaround); supabase-js v2 colapsa Insert para `never` com >1 tabela (workaround com cliente untyped + helpers)
  - **Decisões registradas:** Gemini Flash em vez de Pro (Pro retornou `limit: 0` no free tier); Flash free tier real é 20 RPD não 1500; PDFs gitignorados como defesa em profundidade ToS Bloomberg (acima da escolha original "versionar" do Eduardo — aprovado); retry transitório Gemini 503/429 com backoff 4s

---

## 5. Bloqueios

- [ ] *(vazio)*

---

## 6. Bugs abertos

| ID | Descrição curta | Repro | Gravidade | Classe se virar feature | Nota |
|---|---|---|---|---|---|
| BUG-001 | Constants em `compliance-blacklist.ts` usam `\b` ASCII; `TICKER_US_LIST` contém single-letter tickers (C, V, F, GE) que disparam falso-positivo em palavras PT-BR com acentos ("Câmbio" → match em "C") sob o regex compilado | Testado durante F-005; mitigado no checker via Unicode boundary post-filter | **Mitigado** (não aparece em produção) | A se virar feature isolada (constant pura) | Sugestão: atualizar `TICKER_US_REGEX` para usar lookarounds Unicode `(?<![\p{L}\p{N}_])(...)(?![\p{L}\p{N}_])` na próxima auditoria mensal de blacklist (CB-014 da SPEC). Eliminaria a divergência checker ↔ constant. |
| ~~DEBT-001~~ | ~~`/news/[slug]` com `status="archived"` retorna HTTP 200 em vez de 410 Gone~~ | ~~Acessar `/news/<slug>` de briefing arquivado~~ | **RESOLVIDO 2026-04-27 em F-011** (Opção A: middleware + `archived-slugs.generated.ts` + matcher dual `/news/:slug` retorna 410 Gone). Validado em dev. | — | — |
| DEBT-002 | Empty state da listagem `/news` não diferencia "ainda não há briefings" de "filtro `?categoria=X` sem resultados" — ambos mostram "Os primeiros briefings chegam em breve" | UX nicety, baixa visibilidade | Baixa | A | Iteração futura sem urgência |
| DEBT-003 | Gemini Flash free tier real é **20 RPD** (descoberto em F-007), não 1.500 RPD como esperado da documentação. Em produção (2 cron/dia × 5 PDFs = 10 RPD), está apertado mas cabe; qualquer ajuste de cadência ou re-rodada manual estoura | Em F-007 smoke test, alguns PDFs caíram em 429 e o pipeline ativou retry com backoff 4s | **Médio** se cadência aumentar | A (env config) ou D (provisionar billing) | **Habilitar billing no Google AI Studio antes de subir cron real em produção (F-008).** Custo Flash com billing é trivial (R$0,01-0,05/PDF). Sem billing, há risco de pipeline parar em meio à rodada |
| DEBT-004 | System prompt OpenAI tende a gerar body com ~270 palavras (alvo 280-340) e concentra fontes (ex.: InfoMoney 2x quando Perplexity retorna múltiplos resultados do mesmo domínio) | Validado no smoke test F-007 | Baixa (briefing ainda publicável) | A (refinar prompt) | Iteração v1.2 do system prompt: reforçar "≥280 palavras body" + "diversifique fontes — evite mesma fonte 2x consecutivos" |
| DEBT-005 | `themes_discarded` em `news_pipeline_runs` registra apenas contagem agregada, sem detalhe por tema (qual tema foi descartado e por que) | Não bloqueia debugging básico | Baixa | A (migration aditiva) | Adicionar coluna `themes_discarded_detail JSONB` numa próxima evolução do schema. Útil para debug e auditoria |
| DEBT-006 | OpenAI `zodResponseFormat` rejeita schemas com `.url()`, `.uuid()`, `.optional()` em refinamentos | Descoberto em F-007 mid-smoke; documentado em `feedback_openai_structured_outputs.md` na memória | **Compliance pattern firmado** | — | Esquemas para Structured Output devem usar `z.string()` simples no nível do LLM e validação dura via parse downstream. **Aplicar este pattern em features futuras que usem Structured Outputs** |
| DEBT-007 | supabase-js v2 colapsa `Insert` type para `never` quando há >1 tabela em `Tables` do tipo gerado | Descoberto em F-007; documentado em `feedback_supabase_js_multi_table.md` na memória | **Workaround firmado** | — | Cliente isolado untyped + helpers tipados na superfície é o pattern. **Aplicar este pattern em features futuras que precisem inserir em múltiplas tabelas via Supabase JS** |
| DEBT-008 | pdfjs-dist@5.4.449 falha 100% em Next 15.5.7 dev runtime com `Object.defineProperty called on non-object` (shim DOMMatrix em `extractor.ts:36-50` é insuficiente para o que pdfjs 5.x faz em globals — provavelmente Path2D/OffscreenCanvas/ImageData). Descoberto em smoke test F-015 (2026-05-02): 4/4 PDFs Bloomberg fixtures falharam na extração primária | `npm run dev` + dispara `/api/news/cron` com PDFs disponíveis em fixtures | **Mitigado em F-015b**: try/catch envolvendo pdfjs cai direto para Gemini sem propagar erro. Caminho de produção (Gemini é o normal — ADR-001 §atualização 2026-04-28) não muda | A (try/catch defensivo + log estruturado) | Não enriquecer shim — frágil e Next/pdfjs vão evoluir. Manter pdfjs como tentativa primária por defesa em profundidade caso futuros PDFs sejam searchable |
| DEBT-009 | Orchestrator F-015 descarta body de drafts bloqueados por compliance — só registra contagem `briefings_blocked++`. Impossível diagnosticar quais foram as violations e calibrar o prompt v2 sem reproduzir | Smoke F-015 (2026-05-02): 1 draft bloqueado com 2 violations não auditáveis | **Mitigado em F-015b**: log estruturado server-side com `violations[].type/field/match/line_number` (sem body, respeitando Anti-SPEC §6.3) + persistência opcional do body em Vercel Blob `news-blocked-drafts/` com TTL 7 dias para auditoria pelo diretor/Marcos | A (logging) + B (Vercel Blob com TTL — opcional) | Coluna `blocked_draft_blob_url` em `news_pipeline_runs` para link auditável. Cron de cleanup remove blobs >7 dias |
| DEBT-010 | System prompt v2 pode improvisar artigo "magro" em fim-de-semana/feriado quando Perplexity retorna conteúdo raso de renda fixa/setorial. Modelo deveria escolher `themes_discarded: [{reason: "no_public_source"}]` mas tentou produzir artigo e caiu em violation | Smoke F-015 (2026-05-02 sábado): artigo `silencio-sabado-risco-liquidez-renda-fixa-brasileira` improvisado | **Mitigado em parte na v2.1** (regras "off-topic é descarte" + "limite 2× re-uso URL" + "≥3 URLs distintas"). Cron Vercel só roda dia útil 07h/14h BRT em produção. Smoke real em dia útil vai validar | A (já parcialmente aplicada em v2.1) | Smoke #3 segunda 2026-05-04 vai mostrar se v2.1 resolveu sem precisar v2.2 |
| DEBT-011 | `BlogPostApprovalToken` com `status='pending'` e `expires_at < NOW()` ficam órfãos na tabela (Marcos não aprovou nem rejeitou em 7 dias). Tabela cresce indefinidamente sem cleanup recorrente | Após smoke #4 com Marcos não respondendo, tokens vão acumular | **Não bloqueante** — função `expirePendingTokensOlderThan(days)` já existe em F-018. Falta um caller periódico | A (Vercel Cron + endpoint protegido por CRON_SECRET) | Absorver em F-016: adicionar entrada em `vercel.json` para `/api/posts/cleanup-expired-tokens` schedule diário 03h UTC + endpoint correspondente. NÃO usar /schedule do Claude (operacional, não temporário) |
| DEBT-012 | `approval_email_sent` não é logado como evento estruturado quando email é enviado com sucesso. Apenas `approval_email_failed` em falha. Auditoria de produção fica cega para "Marcos recebeu email mas não clicou em 7 dias" | Smoke #3 F-018 isolado (2026-05-03): Resend messageId confirmado mas sem log estruturado correspondente | Baixa | A (1 linha em orchestrator.ts) | Adicionar `console.info({event:"approval_email_sent", run_id, blog_post_id, message_id, recipient_email_hash})` após `sendApprovalEmail` retornar success. Absorver em F-016 |
| DEBT-013 | `.env` com chave duplicada no fim do arquivo funciona por "última definição vence" do dotenv@17/Next, mas é frágil — qualquer ferramenta de parsing diferente pode falhar | Eduardo no smoke #3 (2026-05-03) colou as 4 envs temp no fim em vez de substituir; funcionou mas é pattern frágil | Operacional, não código | — | Em smokes futuros: SEMPRE substituir valor da chave existente, não duplicar no fim. Documentado como observação no relatório consolidado smoke #3 |

---

## 7. Ideias / parking lot

> Revisar a cada 2 semanas.

- Bot Telegram interativo (responde perguntas) — v2
- Audio/podcast version dos briefings via TTS — v2
- Tradução EN — v2
- Comentários públicos — v2 (compliance complexo)
- Camada 2 Premium paga — projeto separado
- Parecer jurídico Mattos Filho/BMA — opcional v2 se houver tração
- **Regenerar `src/types/database.types.ts`** via `mcp__supabase__generate_typescript_types` para incluir `news_*` (descoberto durante F-009). Quando feito, cliente isolado em `src/features/news/telemetry/client.ts` pode ser substituído pelo admin client compartilhado. Classe A. Não bloqueia roadmap.
- **🟠 Auditoria de segurança Supabase** — descoberto durante `get_advisors` em F-009: 23 issues pré-existentes incluindo `rls_disabled_in_public` em tabelas NextAuth (Account/Session/VerificationToken), `rls_policy_always_true` em Checkup/Holding/LLMRun/ebook_leads, Postgres com update disponível, MFA insuficiente, leaked password protection desligado, bucket `ldc-assets` público. Sugestão: feature dedicada Classe D após Marco 1 do `/news`, fora do escopo deste roadmap.

---

## 8. Definition of Done (DoD)

### Classe A
- [ ] CI N1 local verde (`npm run lint && npm run typecheck && npm run build`)
- [ ] TODO atualizado (item → Concluído com SHA)

### Classe B
- [ ] Tudo de A +
- [ ] Feature Contract preenchido acima
- [ ] Matriz de validação com status = passou em todos CAs
- [ ] CI verde no PR
- [ ] CONTRACTS.md atualizado se contratos mudaram

### Classe C
- [ ] Tudo de B +
- [ ] CI N2 verde (integration + contract + build)
- [ ] Anti-SPEC §6.2, §6.2b, §6.3 verificadas explicitamente
- [ ] Revisão humana antes do merge (Eduardo)

### Classe D (F-007, F-008)
- [ ] Tudo de C +
- [ ] CI N3 verde (e2e contract + smoke test)
- [ ] Feature Contract dedicado em `feature-contracts/F-NNN.md` com **Rollback** executável
- [ ] Staging validado antes de produção (Vercel Preview com env de teste)
- [ ] Smoke test pós-deploy registrado em DECISIONS_LOG (1 briefing real gerado e revisado pelo Eduardo)
- [ ] Custos OpenAI + Perplexity da rodada de smoke test ≤ R$ 5

---

## 9. Mapa de classes

| Classe | Features | CI alvo |
|---|---|---|
| A | F-001 ✅, F-002 ✅ | N1 |
| B | F-003 ✅, F-004 ✅, F-009 ✅, F-010, F-011 ✅ | N1 |
| C | F-005 ✅, F-006 ✅, F-012 | N2 |
| D | F-007, F-008 | N3 |

**Total: 12 features.** Marco 1 = F-001 a F-009 + F-011 + F-006 (10 ✅). Marco 2 = F-010 + F-012 (2 features restantes) + F-007 / F-008 (Classe D, ainda no Marco 1 alvo).

---

*Histórico vive em `git log`. Decisões operacionais que voltam ao debate vão para `docs/news/DECISIONS_LOG.md`. Produto e comportamento permanecem em SPEC/Anti-SPEC e só mudam com autorização do Eduardo.*
