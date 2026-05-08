# SPEC — LDC News (`/news`) → Pipeline IA para `/blog`

> ⚠️ **PIVOT 2026-04-29 — ver [ADR-005](./decisions/ADR-005-pivot-brevidade-para-artigo-denso-blog.md):** após reunião com Marcos (sócio operacional LDC), pipeline pivotou de Brevidade Inteligente em `/news` (MDX + commit GitHub) para **artigo denso em `/blog` (Supabase BlogPost)**. Esta SPEC continua válida para os RFs que sobreviveram (RF-005, RF-006, RF-007 técnicos; RF-008 compliance; RF-015 telemetria) e está descontinuada para os RFs que viraram fora de escopo (RF-001, RF-002, RF-003, RF-004, RF-009, RF-010, RF-011, RF-012, RF-013, RF-014, RF-016 — implementação de `/news` rotas + admin + commit + digest + Telegram).
>
> **A SPEC vigente pós-pivot** está sendo redigida em F-015 (refactor pipeline) e F-018 (aprovação por email Marcos). Anti-SPEC §6.2 e §6.2b continuam SAGRADAS independente do pivot.

---

> Especificação funcional original (mantida para auditoria histórica e referência aos RFs/Anti-SPEC sobreviventes).
> Versão: 1.1 — Referência: `CONCEITO_NEWS_LDC.md` (PRD aprovado em 2026-04-23)
> v1.1 (2026-04-27): ajustes derivados de 4 PDFs Bloomberg reais — multi-PDF, separação Bloomberg-como-sinal vs fontes-públicas-citáveis, filtros de metaconteúdo, threshold pdfjs.
> Stack: Next.js 15 App Router (existente) + OpenAI GPT-5-mini + Perplexity Sonar Pro + pdfjs-dist (já instalado) + @vercel/og.

---

## 0. Decisões consolidadas (input do Eduardo)

| ID | Decisão | Valor |
|---|---|---|
| D-01 | URL final | `/news` |
| D-02 | Cadência inicial | 2 briefings/dia (07h e 14h America/Sao_Paulo, via Vercel Cron) |
| D-03 | Voz autoral | "Editorial LDC" (anônimo institucional) |
| D-04 | Aprovação editorial | Eduardo apenas (até estabilização do estilo) |
| D-05 | Persistência | MDX commitado no repo via GitHub API; telemetria em Supabase |
| D-06 | Auth do `/admin/news` | Reutiliza Supabase auth existente (`/admin/login`) |
| D-07 | Newsletter | Cenário B — `/news` NÃO cria opt-in próprio; alimenta newsletter Mailchimp existente via endpoint `weekly-digest` |
| D-08 | Stack IA | OpenAI GPT-5-mini (geração) + Perplexity Sonar Pro (fontes) + pdfjs-dist (extração PDF local) |
| D-09 | Compliance | 100% via guardrails técnicos (regex tickers + lista negra de frases + revisão humana). Sem parecer jurídico no go-live (decisão de simplicidade) |
| D-10 | Telegram público | Canal novo `t.me/ldcnews` em Marco 2 |
| D-11 | Parecer jurídico | **Removido do escopo** — fica como recomendação opcional para v2 |

---

## 1. Requisitos Funcionais (RF)

### RF-001 — Página índice `/news`
- **Descrição:** Sistema deve renderizar uma página em `/news` listando os briefings publicados em ordem cronológica reversa, com filtros por categoria.
- **Prioridade:** Alta
- **Cobre:** CA-001, CA-002
- **Contrato:** `src/features/news/contracts/briefing.ts` → `BriefingListItem`

### RF-002 — Página individual `/news/[slug]`
- **Descrição:** Sistema deve renderizar cada briefing publicado em página dedicada seguindo a anatomia Brevidade Inteligente (§8 do conceito): título ≤8 palavras, categoria, data, tempo de leitura, imagem destacada, "Por que importa", "Os números" (3-5 bullets), "Entre as linhas", "O que fica de olho", CTA, fontes citadas, disclaimer fixo CVM.
- **Prioridade:** Alta
- **Cobre:** CA-003, CA-004, CA-005
- **Contrato:** `src/features/news/contracts/briefing.ts` → `Briefing`

### RF-003 — Geração automática programada
- **Descrição:** Sistema deve executar o pipeline de geração 2x/dia (07h e 14h America/Sao_Paulo) via Vercel Cron, criando drafts no estado `pending_review` sem publicação automática.
- **Prioridade:** Alta
- **Cobre:** CA-006, CA-007
- **Contrato:** `src/features/news/contracts/pipeline.ts` → `GenerationJob`, `GenerationResult`

### RF-004 — Upload manual de múltiplos PDFs Bloomberg
- **Descrição:** Usuário admin autenticado deve conseguir fazer upload de **1 a 10 PDFs** Bloomberg simultaneamente em `/admin/news/upload` para alimentar o pipeline. PDFs aceitos: Bloomberg Brazilian News (PBN), Bloomberg First Word (BFW), Bloomberg News (BN), Associated Press traduzido (APW). Cada upload é arquivado em Vercel Blob com timestamp.
- **Prioridade:** Alta
- **Cobre:** CA-008, CA-008b
- **Contrato:** `src/features/news/contracts/pipeline.ts` → `UploadPdfRequest`, `UploadPdfResponse`

### RF-005 — Extração e normalização de texto de PDFs
- **Descrição:** Sistema deve extrair texto de PDFs Bloomberg usando `pdfjs-dist` (já instalado) e aplicar normalização específica por formato detectado:
  - **Detecção de formato:** primeira linha do PDF identifica origem (`Bloomberg Brazilian News`, `Bloomberg First Word`, `Bloomberg News`, `Associated Press`). Metadados anexados ao texto.
  - **Filtros de metaconteúdo:** remove blocos `## O que estamos lendo`, `## Mais conteúdo local`, `## Para entrar em contato com os repórteres/editores`, `## Empresas` (rodapé corporativo), `Inscreva-se na nossa newsletter`, footer "©2026 Bloomberg L.P.".
  - **Preservação de tabelas de dados:** detecta blocos com padrão `[ÍNDICE] [+/-]N,N%` e os encapsula em `<table_data>...</table_data>` para o LLM tratar como dados estruturados.
  - **Concatenação multi-PDF:** se múltiplos PDFs entrarem na rodada, cada um vira um bloco `<source_pdf id="N" tipo="PBN|BFW|BN|APW" data="ISO8601">...</source_pdf>` no input do LLM.
  - **Fallback Gemini 2.5 Pro multimodal** apenas quando texto extraído pós-filtro for < 1000 caracteres (PDF imagem-pesado real).
- **Prioridade:** Alta
- **Cobre:** CA-009, CA-010, CA-010b
- **Contrato:** `src/features/news/contracts/pipeline.ts` → `PdfExtractionResult`, `BloombergFormat`

### RF-006 — Consulta a fontes públicas via Perplexity (validação + citação)
- **Descrição:** Sistema deve consultar Perplexity Sonar Pro **para cada tema candidato extraído dos PDFs Bloomberg**, com objetivo duplo:
  - (a) **Validar** que o tema tem cobertura em mídia pública top-tier (não é furo Bloomberg-only)
  - (b) **Obter URLs públicas citáveis** (Reuters, FT, Valor, neofeed, etc.) que serão as fontes do briefing — **Bloomberg NUNCA é citado como fonte pública** (RNF-008)
- Parâmetros obrigatórios:
  - `model: "sonar-pro"`
  - `search_recency_filter: "day"`
  - `search_domain_filter: ["reuters.com", "ft.com", "valor.com.br", "neofeed.com.br", "wsj.com", "economist.com", "infomoney.com.br", "axios.com"]` — **Bloomberg.com EXPLICITAMENTE FORA** dessa lista
  - `return_citations: true`
- Se Perplexity retornar zero citações para um tema, o tema é **descartado** (não vira briefing).
- **Prioridade:** Alta
- **Cobre:** CA-011, CA-012, CA-012b
- **Contrato:** `src/features/news/contracts/perplexity.ts` → `PerplexityQuery`, `PerplexityResponse`

### RF-007 — Geração de briefing via OpenAI Structured Output
- **Descrição:** Sistema deve chamar OpenAI GPT-5-mini passando:
  - (a) Texto extraído dos PDFs Bloomberg como **sinal interno de tema** (marcado `<bloomberg_signal>...</bloomberg_signal>` — instrução do system prompt: "USE este conteúdo APENAS para identificar temas e contexto, NUNCA cite ou parafraseie diretamente, NUNCA mencione Bloomberg como fonte")
  - (b) Resultados Perplexity como **fontes públicas citáveis** (marcado `<public_sources>...</public_sources>`)
  - (c) System prompt cacheado com regras de Brevidade Inteligente + estilo LDC + guardrails compliance (Anti-SPEC §6 deste documento) + **proibição explícita de citar Bloomberg**
- Retorno deve ser JSON validado por Zod schema (`BriefingGenerationResponse`).
- **Prioridade:** Alta
- **Cobre:** CA-013, CA-014, CA-014b
- **Contrato:** `src/features/news/contracts/openai.ts` → `BriefingGenerationRequest`, `BriefingGenerationResponse`

### RF-008 — Guardrails de compliance CVM (bloqueio técnico)
- **Descrição:** Antes de qualquer briefing entrar no admin para revisão, sistema deve rodar checagem automática que bloqueia:
  - Tickers nominais brasileiros: regex `/\b[A-Z]{4}\d{1,2}\b/` (PETR4, VALE3, BBAS3, etc.)
  - Tickers ADR/EUA: lista de regex (ex: `/\b(AAPL|TSLA|...)\b/`) — lista mantida em `src/features/news/compliance/blacklist.ts`
  - Frases proibidas: "compre", "venda", "rentabilidade garantida", "lucro garantido", "vai subir", "vai cair", "investimento certo", "oportunidade única", "não pode perder" — match case-insensitive com word boundary
  - Promessa de retorno: regex de "% [a-z]* (de retorno|de lucro|garantido|certo)"
- **Resultado do bloqueio:** Briefing recebe status `blocked_compliance` e fica visível APENAS para o admin, com lista das violações encontradas. NUNCA publica.
- **Prioridade:** Alta (CVM hard requirement)
- **Cobre:** CA-015, CA-016, CA-017
- **Contrato:** `src/features/news/contracts/compliance.ts` → `ComplianceCheckResult`, `ComplianceViolation`

### RF-009 — Admin `/admin/news` (revisar / editar / aprovar / publicar)
- **Descrição:** Usuário admin autenticado deve conseguir:
  - Listar briefings em todos os estados (`pending_review`, `blocked_compliance`, `published`, `archived`)
  - Editar conteúdo de qualquer briefing antes da publicação (markdown editor)
  - Aprovar e publicar briefings em estado `pending_review`
  - Sobrescrever briefing em `blocked_compliance` apenas após edição manual + nova checagem
  - Arquivar briefings publicados (remove da listagem pública mas mantém URL com 410 Gone)
- **Prioridade:** Alta
- **Cobre:** CA-018, CA-019, CA-020
- **Contrato:** `src/features/news/contracts/admin.ts` → `AdminBriefingActionRequest`

### RF-010 — Persistência via MDX no repo + commit GitHub API
- **Descrição:** Briefing publicado é persistido como arquivo `.mdx` em `content/news/YYYY-MM-DD-{slug}.mdx` e committed via GitHub API com PAT (Personal Access Token) configurado em env. Vercel detecta o commit e dispara rebuild ISR. Drafts ficam em `content/news/_drafts/` (ignorado pelo build de produção).
- **Prioridade:** Alta
- **Cobre:** CA-021, CA-022
- **Contrato:** `src/features/news/contracts/persistence.ts` → `BriefingFrontmatter`, `CommitRequest`

### RF-011 — Card OG dinâmico
- **Descrição:** Sistema deve gerar card Open Graph 1200x630 para cada briefing usando `@vercel/og`, com tipografia LDC, cor de fundo da categoria, título do briefing, "LDC Capital · Editorial LDC", data. Servido em `/news/[slug]/opengraph-image`.
- **Prioridade:** Média
- **Cobre:** CA-023
- **Contrato:** N/A (output é PNG)

### RF-012 — Botões de compartilhamento social
- **Descrição:** Cada briefing deve ter botões de share para: Telegram (URL `t.me/share/url`), LinkedIn (intent), X/Twitter (intent), copiar link (clipboard nativo). **WhatsApp é proibido por decisão de produto** (D-12 implícita; ver Anti-SPEC §6).
- **Prioridade:** Média
- **Cobre:** CA-024, CA-025
- **Contrato:** N/A (frontend puro)

### RF-013 — Schema estruturado (SEO + GEO)
- **Descrição:** Cada briefing deve incluir JSON-LD válido para `NewsArticle`, `BreadcrumbList`, e `Organization (publisher=LDC Capital)`. A página índice deve incluir `CollectionPage`. Adicionar seção dedicada à `/news` em `/llms.txt` na raiz para indexação por LLMs (sonar-pro, ChatGPT-search, Perplexity, Claude). Sitemap deve listar `/news` e `/news/[slug]` com `<lastmod>` real.
- **Prioridade:** Alta (janela GEO 12-18 meses, §11.B do conceito)
- **Cobre:** CA-026, CA-027

### RF-014 — Endpoint `/api/news/weekly-digest` para Mailchimp
- **Descrição:** Endpoint protegido por API key (env `NEWS_DIGEST_API_KEY`) que retorna os top 5 briefings da semana corrente em formato HTML pronto para Mailchimp Campaign (template inline-styled). Critério de seleção: maior `view_count` da semana, com tie-break por data mais recente. Eduardo invoca manualmente sexta de manhã via cURL ou fetch e cola no Mailchimp.
- **Prioridade:** Alta
- **Cobre:** CA-028
- **Contrato:** `src/features/news/contracts/digest.ts` → `WeeklyDigestRequest`, `WeeklyDigestResponse`

### RF-015 — Telemetria básica
- **Descrição:** Sistema deve registrar em Supabase (tabela `news_events`):
  - `view`: page view de briefing individual (anônimo, IP hash)
  - `share`: clique em botão de share (canal específico)
  - `cta_diagnostico`: clique no CTA "Agendar Diagnóstico" do rodapé do briefing
  - `weekly_digest_render`: cada vez que o endpoint `weekly-digest` é chamado
- **Prioridade:** Média
- **Cobre:** CA-029
- **Contrato:** `src/features/news/contracts/telemetry.ts` → `TelemetryEvent`

### RF-016 — Bot Telegram (Marco 2)
- **Descrição:** Após publicação de um briefing, sistema deve postar automaticamente no canal público `t.me/ldcnews` o título + 1ª frase do "Por que importa" + link curto. Bot via webhook ou polling do Telegram Bot API.
- **Prioridade:** Média (não bloqueia Marco 1)
- **Cobre:** CA-030
- **Contrato:** `src/features/news/contracts/telegram.ts` → `TelegramPostRequest`

### RF-019 — Gerador de carrossel Instagram/LinkedIn (pós-pivot ADR-005) — **v1.0 DESATIVADO 2026-05-09 (ADR-006)**

> **⚠️ Substituído por RF-019b** (formato X-mock screenshot pós-pivot ADR-006). RF-019 v1.0 nunca chegou a produção — o batch #15 foi validado em smoke local mas descartado antes do PR. Mantido aqui para auditoria histórica.
- **Descrição (v1.0):** Sistema deve oferecer ao admin (Eduardo) a possibilidade de gerar, a partir de um `BlogPost` aprovado (`published=true`), um carrossel reaproveitável em Instagram (1080×1350) e LinkedIn (1080×1080). Pipeline:
  - (a) **OpenAI gpt-5-mini** com Structured Outputs (`zodResponseFormat`) gera `CarouselScript` (5-7 slides com tipos `hook|contexto|dado|pergunta|prova|CTA` + 2 captions específicas IG/LinkedIn + 3-8 hashtags), guiado por `BLOG_CAROUSEL_SYSTEM_PROMPT_v1.0` (tom Mullen+Breia+Nousi consistente com system-prompt v2.1 do artigo)
  - (b) `runComplianceCheck()` (engine F-005, frozen) aplicado a cada slide (title+body) e a ambas as captions; HARD-block aborta a geração inteira e retorna 422 com violations
  - (c) Regex anti-Bloomberg (defense in depth Anti-SPEC §6.2b) sobre slides + captions + hashtags
  - (d) Templates React (`SlideHook`, `SlideContent`, `SlideQuestion`, `SlideCTA`) com fontes da marca (IvyMode + Public Sans) renderizam via `@vercel/og` ImageResponse → PNG buffer
  - (e) `jszip` empacota PNGs (instagram/ + linkedin/) + `caption-instagram.md` + `caption-linkedin.md` + `README.md` com instruções
  - (f) ZIP persiste em Supabase Storage bucket privado `blog-carousels` (TTL 90d via cron); endpoint retorna signed URL 24h
  - (g) `carousel_runs` registra prompt_version, slides_count, openai tokens+custo BRL, status, zip_pathname
  - (h) Rate limit ≤10 carrosséis/dia/user (query em `carousel_runs`)
- **Distribuição não automatizada** — Eduardo posta manualmente (Anti-SPEC §6.1).
- **Prioridade:** Média (Marco 1 — reaproveitamento aprovado em 2026-04-29)
- **Cobre:** CA-031..CA-038 (v1.0, desativados — ver RF-019b)
- **Contrato:** `src/features/news/contracts/carousel.ts` v1.0 (substituído por v2.0 em ADR-006)

### RF-019b — Gerador de carrossel formato X.com mock-tweet (pós-pivot ADR-006)

- **Descrição:** Substituição do RF-019 v1.0. A partir de um `BlogPost` aprovado, sistema gera carrossel onde **cada slide é um screenshot simulado de tweet** com header X.com (avatar + nome + ✓ verificado azul + handle), body em PT-BR com **bold markdown** em palavras-chave, e imagem AI hero (DALL-E 3) embedada apenas em slides 1, 3 e 6. Pipeline:
  - (a) **OpenAI gpt-5-mini** com Structured Outputs gera `CarouselScript v2.0` (5-7 slides com `body` ≤360 chars + `image_prompt` opcional para slides 1/3/6 + 2 captions + hashtags). Prompt v2.0 fingerprint `blog-carousel-v2.0-2026-05-09`.
  - (b) `runComplianceCheck()` aplicado a cada slide e ambas captions; **regex `/bloomberg/i` adicional em `image_prompt`** (defense in depth Anti-SPEC §6.2b — DALL-E não pode inadvertidamente gerar Bloomberg branded content).
  - (c) **DALL-E 3** standard `1792×1024` style:natural — 3 chamadas (slides 1/3/6); custo ~R$0,22/imagem. Imagens **compartilhadas entre as 2 variações** (gera 1×, reusa 2×). Falha graciosa: 3 retries, fallback text-only se falhar.
  - (d) Template **único** `SlideTweet.tsx` renderiza qualquer tipo de slide (parametrizado por `variation` + `hasImage`).
  - (e) **Duas variações** geradas em sequência:
    - **LDC**: avatar `ldc-capital.png` + backdrop `#1A2332`, displayName "LDC Capital", handle `@ldc.capital`
    - **Luciano**: avatar `luciano-herzog.png` (sem backdrop), displayName "Luciano Herzog", handle `@luciano.herzog`
  - (f) **Formato único 1080×1350** (IG portrait — vale também para LinkedIn). 12 PNGs por carrossel (6 slides × 2 variações).
  - (g) ZIP com pastas `ldc/` e `luciano/` separadas + captions + README atualizado.
  - (h) Cost guard **R$1,00** (sentinela; estima R$0,70 real). Rate limit **mantido em 10/dia/user**.
- **Distribuição NÃO automatizada** — Eduardo posta manualmente (Anti-SPEC §6.1). Escolhe variação por contexto (institucional vs pessoal).
- **Prioridade:** Média (substitui RF-019)
- **Cobre:** CA-039..CA-042 (substituem CA-031..CA-038 v1.0 desativados)
- **Contrato:** `src/features/news/contracts/carousel.ts` → schema v2.0 (`SlideType`, `CarouselSlide` com `image_prompt` opcional, `CarouselScript` com `body.max(360)` + bold markdown validation)

---

## 2. Requisitos Não-Funcionais (RNF)

### RNF-001 — Performance
- TTFB `/news` < 500ms (página estática, ISR).
- LCP `/news/[slug]` < 2,5s em conexão 4G.
- API `weekly-digest` p95 < 1,5s.
- Pipeline de geração completo (PDF → Perplexity → OpenAI → MDX commit): < 90s.

### RNF-002 — Compliance CVM
- **Bloqueio técnico de tickers nominais e frases proibidas é hard requirement.**
- Disclaimer fixo CVM no rodapé de cada briefing: texto exato definido em `src/features/news/constants/disclaimers.ts`.
- Toda afirmação numérica nos briefings deve ter fonte citada com link funcional.
- Validação humana obrigatória no Marco 1 (100% dos briefings antes de publicar).

### RNF-003 — Custo operacional
- Custo mensal incremental de APIs ≤ R$ 200/mês:
  - OpenAI GPT-5-mini (~30 invocações/dia, prompt cache ativo): R$ 50-100/mês
  - Perplexity Sonar Pro (~30 queries/dia): R$ 80-120/mês
  - Vercel Blob (PDFs arquivados): R$ 10/mês
- Hard fail no pipeline se custo OpenAI da rodada > R$ 5 (token limit guard).

### RNF-004 — SEO/GEO
- Schema NewsArticle válido em 100% dos briefings (validado via Schema.org validator no CI).
- `/llms.txt` na raiz com seção `## /news` listando últimos 50 briefings + descrição do canal.
- Sitemap dinâmico inclui `/news` + cada `/news/[slug]` com `<lastmod>` igual à data de publicação.
- Meta tags Open Graph + Twitter Cards obrigatórias.

### RNF-005 — Acessibilidade
- WCAG 2.1 AA na página índice e nas páginas de briefing.
- Contraste ≥ 4,5:1 em todo texto.
- Imagens destacadas com `alt` descritivo.
- Botões de share com `aria-label` explícito.

### RNF-006 — Disponibilidade
- Herda 99,5% do Vercel atual.
- Pipeline de geração: idempotente. Se falhar em qualquer etapa, não publica nada e registra erro em Supabase (tabela `news_pipeline_errors`).
- Cron com retry implícito do Vercel (1 tentativa adicional após 5min em caso de timeout).

### RNF-007 — Segurança
- `/admin/news/*` exige sessão admin Supabase válida (middleware existente).
- `/api/news/generate` (cron internal): protegido por header `Authorization: Bearer ${CRON_SECRET}` (env var).
- `/api/news/weekly-digest`: protegido por header `x-api-key: ${NEWS_DIGEST_API_KEY}`.
- `/api/news/upload-pdf`: exige sessão admin + valida MIME type + limite 10MB por arquivo + máximo 10 arquivos por upload.
- Zod valida 100% dos inputs externos.

### RNF-008 — Proteção autoral Bloomberg (compliance contratual)
- Bloomberg PBN/BFW/BN é **assinatura privada** do Eduardo. Conteúdo dos PDFs é insumo interno, **não fonte pública citável**.
- **Briefings públicos NUNCA citam "Bloomberg" como fonte.** Lista de domínios proibidos como fonte pública: `bloomberg.com`, `bloomberg.net`, `bloomberglinea.com.br`, `bloomberg.com.br`.
- **Bloqueio técnico:** após geração, regex de compliance verifica se string `bloomberg` aparece em qualquer campo `fontes[].url` ou `fontes[].title` ou `fontes[].dominio` → se sim, bloqueia.
- PDFs Bloomberg são processados **em memória durante o pipeline** e arquivados em Vercel Blob com retenção de 30 dias. Logs de pipeline NÃO contêm corpo do PDF.
- System prompt OpenAI tem instrução explícita: "Bloomberg é sinal de tema interno, NUNCA fonte pública. Se um briefing depender exclusivamente de informação que só apareceu nos `<bloomberg_signal>`, descarte o briefing — não tente parafrasear."

---

## 3. Fluxos principais

### Fluxo 1 — Geração automática programada
**Pré-condição:** Vercel Cron configurado para 07h e 14h America/Sao_Paulo. Env vars `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GITHUB_PAT`, `CRON_SECRET` configuradas.

1. Vercel Cron chama `POST /api/news/generate` com `Authorization: Bearer ${CRON_SECRET}`
2. Endpoint valida secret. Se inválido, retorna 401.
3. Endpoint busca PDF Bloomberg mais recente em Vercel Blob `bloomberg-pdfs/` (se houver upload manual recente; opcional).
4. Se PDF existe: extrai texto via `pdfjs-dist`. Se texto < 300 chars, fallback para Gemini 2.5 Pro multimodal.
5. Chama Perplexity Sonar Pro com 3 queries temáticas pré-definidas para o turno (manhã = macro global + macro Brasil + geopolítica; tarde = renda fixa + setorial + commodities).
6. Monta prompt para OpenAI GPT-5-mini com (a) texto PDF (se houver), (b) resultados Perplexity, (c) system prompt cacheado.
7. OpenAI retorna JSON validado por Zod schema `BriefingGenerationResponse` (1-3 briefings).
8. Para cada briefing retornado:
   - Roda checagem de compliance (RF-008)
   - Se passou: cria `.mdx` em `content/news/_drafts/YYYY-MM-DD-{slug}.mdx` com status `pending_review`
   - Se bloqueou: cria `.mdx` com status `blocked_compliance` + lista de violações no frontmatter
9. Pipeline grava resultado em Supabase tabela `news_pipeline_runs`.
10. Endpoint retorna 200 com sumário dos briefings gerados.

**Pós-condição:** N briefings em estado `pending_review` ou `blocked_compliance` aparecem em `/admin/news`. **Nada é publicado automaticamente.**
**Cobre:** RF-003, RF-005, RF-006, RF-007, RF-008
**Tempo total esperado:** < 90s

### Fluxo 2 — Aprovação e publicação manual pelo admin
**Pré-condição:** Eduardo logado em `/admin/news`. Pelo menos 1 briefing em `pending_review`.

1. Eduardo abre `/admin/news` → vê lista de drafts
2. Clica em um briefing → entra em modo edição (markdown editor `@uiw/react-md-editor` já instalado)
3. Edita conteúdo se necessário (qualquer alteração re-roda compliance check ao salvar)
4. Clica "Aprovar e publicar"
5. Backend:
   - Move arquivo de `_drafts/` para `content/news/`
   - Faz commit via GitHub API com mensagem `news: publish {slug}`
   - Vercel detecta o commit → rebuild ISR
   - Posta no Telegram (Marco 2): título + 1ª frase + link curto
   - Registra evento `published` em Supabase
6. Eduardo é redirecionado para `/news/[slug]` (versão pública)

**Pós-condição:** Briefing público acessível em `/news/[slug]`, com card OG, schema NewsArticle, botões de share funcionais.
**Cobre:** RF-009, RF-010, RF-011, RF-012, RF-013, RF-016
**Tempo desde aprovação até público:** < 60s (build ISR Vercel)

### Fluxo 3 — Bloqueio de compliance
**Pré-condição:** Briefing gerado pela IA contém ticker nominal ou frase proibida.

1. Pipeline (Fluxo 1, passo 8) detecta violação via regex
2. Briefing salvo com status `blocked_compliance` + array `violations` no frontmatter
3. Em `/admin/news`, briefing aparece com badge vermelho "Bloqueado — Compliance"
4. Eduardo abre, vê lista das violações destacadas no texto
5. Edita removendo/reescrevendo
6. Salva → backend re-roda compliance
7. Se passou: status muda para `pending_review` e Eduardo pode aprovar
8. Se ainda bloqueia: continua em `blocked_compliance`. Briefing pode ser arquivado se não recuperável.

**Pós-condição:** Briefing nunca publicado em estado `blocked_compliance`. Histórico de violações fica auditável.
**Cobre:** RF-008, RF-009

### Fluxo 4 — Weekly digest para Mailchimp (sexta)
**Pré-condição:** Sexta de manhã. Pelo menos 5 briefings publicados na semana.

1. Eduardo (ou ferramenta automática Mailchimp via Zapier no futuro) chama `GET /api/news/weekly-digest?week=current` com header `x-api-key`
2. Backend:
   - Lê `content/news/*.mdx` filtrando publicações da semana corrente (segunda 00:00 a domingo 23:59 fuso BRT)
   - Ordena por `view_count` desc (Supabase telemetria), tie-break por data
   - Pega top 5
   - Renderiza HTML inline-styled compatível com Mailchimp (Mailchimp não suporta `<style>` em `<head>`)
   - Retorna `{ html: "...", briefings: [{slug, title, ...}] }`
3. Eduardo cola HTML no editor Mailchimp + envia campanha
4. Backend registra evento `weekly_digest_render` em Supabase

**Pós-condição:** Newsletter Mailchimp existente da LDC carrega seção "Top 5 da Semana" com links rastreáveis.
**Cobre:** RF-014, RF-015

### Fluxo 5 — Upload manual de PDF Bloomberg
**Pré-condição:** Eduardo recebe PDF Bloomberg, quer alimentar a próxima geração.

1. Eduardo abre `/admin/news/upload`
2. Faz upload do PDF (≤10MB, MIME `application/pdf`)
3. Backend salva em Vercel Blob `bloomberg-pdfs/YYYY-MM-DD-HHmm.pdf`
4. Eduardo opcionalmente clica "Gerar agora" → dispara `/api/news/generate` (mesmo endpoint do cron) com flag `manual: true`

**Pós-condição:** PDF disponível para próximas rodadas (cron consome o mais recente). Geração imediata opcional.
**Cobre:** RF-004

---

## 4. Critérios de Aceite (CA)

### CA-001 — Listagem `/news` ordenada por data desc (cobre RF-001)
```
Given: 10 briefings publicados em datas distintas nos últimos 30 dias
When: usuário acessa GET /news
Then: vê grid com os 10 briefings em ordem cronológica reversa
  And: cada card mostra título, categoria, "Por que importa" (1ª frase), data, tempo de leitura
  And: TTFB < 500ms
```

### CA-002 — Filtro por categoria (cobre RF-001)
```
Given: 20 briefings publicados, 5 de categoria "Macro Global"
When: usuário clica no filtro "Macro Global"
Then: lista é filtrada para os 5 briefings da categoria
  And: URL muda para /news?categoria=macro-global
  And: filtro é refletido no <title> da página para SEO
```

### CA-003 — Anatomia Brevidade Inteligente (cobre RF-002)
```
Given: briefing publicado em /news/exemplo-slug
When: usuário acessa a URL
Then: vê em ordem: título ≤8 palavras, categoria, data, tempo de leitura, imagem destacada,
      "Por que importa" (1 frase), "Os números" (3-5 bullets com fonte clicável), 
      "Entre as linhas" (1-2 frases), "O que fica de olho" (1 frase com data/evento), 
      CTA, "Compartilhe" com 4 botões, fontes, "© Editorial LDC Capital · CVM 3976-4", disclaimer fixo
  And: cada bullet de "Os números" tem ≥1 link externo válido (HTTP 200)
```

### CA-004 — Tempo de leitura calculado automaticamente (cobre RF-002)
```
Given: briefing com 280 palavras
When: página renderiza
Then: campo "tempo de leitura" exibe "1 min" (cálculo via reading-time package, já instalado)
```

### CA-005 — Disclaimer CVM presente em 100% dos briefings (cobre RF-002, RNF-002)
```
Given: qualquer briefing publicado
When: HTML é renderizado
Then: rodapé contém EXATAMENTE: 
      "Conteúdo informativo e analítico. Não constitui recomendação personalizada de investimento conforme Resolução CVM 19/2021."
  And: texto tem cor distinta (gray-500) e font-size ≥ 12px
```

### CA-006 — Cron dispara 07h e 14h (cobre RF-003)
```
Given: Vercel Cron configurado em vercel.json para "0 10 * * *" e "0 17 * * *" (UTC, equivale a 07h e 14h BRT)
When: horário programado chega
Then: POST /api/news/generate é invocado
  And: header Authorization Bearer CRON_SECRET é validado
  And: pipeline executa em < 90s
  And: resultado registrado em news_pipeline_runs
```

### CA-007 — Geração não publica automaticamente (cobre RF-003, Anti-SPEC §6)
```
Given: pipeline gera 2 briefings com sucesso
When: pipeline finaliza
Then: ambos os briefings têm status="pending_review"
  And: arquivos estão em content/news/_drafts/ (não em content/news/)
  And: nenhum aparece publicamente em /news
  And: Eduardo precisa aprovar manualmente em /admin/news
```

### CA-008 — Upload de PDF aceita apenas application/pdf ≤10MB (cobre RF-004)
```
Given: Eduardo logado em /admin/news/upload
When: tenta upload de arquivo .docx
Then: backend rejeita com 400 e mensagem "Formato inválido. Apenas PDF."

When: tenta upload de PDF de 12MB
Then: backend rejeita com 413 e mensagem "Arquivo excede 10MB."

When: faz upload de PDF válido de 4MB
Then: backend salva em Vercel Blob e retorna 200 com URL
```

### CA-008b — Upload aceita até 10 PDFs simultâneos (cobre RF-004)
```
Given: Eduardo seleciona 5 PDFs Bloomberg de manhã
When: faz upload em /admin/news/upload (multipart com 5 files)
Then: backend salva os 5 em Vercel Blob com timestamps distintos
  And: retorna 200 com array de URLs
  And: cada PDF é detectado por formato (PBN/BFW/BN/APW) na extração
  And: rejeita com 400 se >10 arquivos
```

### CA-009 — Extração de texto de PDF retorna ≥1000 chars pós-filtro (cobre RF-005)
```
Given: PDF Bloomberg PBN padrão com texto pesquisável
When: pdfjs-dist extrai texto E filtros de metaconteúdo são aplicados
Then: resultado tem >= 1000 caracteres
  And: blocos "O que estamos lendo", "Mais conteúdo local", contatos, footer foram removidos
  And: pipeline prossegue sem fallback
```

### CA-010 — Fallback Gemini para PDF imagem-pesado (cobre RF-005)
```
Given: PDF Bloomberg só com imagens (gráficos)
When: pdfjs-dist + filtros retorna < 1000 caracteres
Then: pipeline chama Gemini 2.5 Pro multimodal com o PDF
  And: aguarda resposta com texto extraído
  And: prossegue para Perplexity
```

### CA-010b — Detecção de formato Bloomberg (cobre RF-005)
```
Given: PDF cuja primeira linha contém "Bloomberg First Word"
When: PdfExtractor.detectFormat() executa
Then: retorna "BFW"
  And: texto normalizado vai com metadado source_type="BFW"
  And: tabela de índices ("Às 7:31..." pattern) é encapsulada em <table_data>
```

### CA-011 — Perplexity recebe domain filter SEM Bloomberg (cobre RF-006, RNF-008)
```
Given: pipeline chama Perplexity para query "macro global hoje"
When: request é montado
Then: payload inclui:
  - model: "sonar-pro"
  - search_recency_filter: "day"
  - search_domain_filter: ["reuters.com", "ft.com", "valor.com.br", 
                          "neofeed.com.br", "wsj.com", "economist.com",
                          "infomoney.com.br", "axios.com"]
  - return_citations: true
  And: NÃO contém "bloomberg.com" nem variantes em search_domain_filter
```

### CA-012 — Perplexity retorna citações com URLs válidos (cobre RF-006)
```
Given: Perplexity responde a uma query
When: response é parseado
Then: array citations tem >= 1 item
  And: cada citation tem URL HTTP 200 (testado via HEAD request opcional em testes integration)
  And: cada citation tem domínio em search_domain_filter
```

### CA-012b — Tema sem fonte pública é descartado (cobre RF-006, RNF-008)
```
Given: PDF Bloomberg traz tema X (ex: "rumor de M&A em empresa privada")
When: Perplexity retorna 0 citações para o tema X
Then: pipeline descarta o tema sem gerar briefing
  And: registra evento "theme_discarded_no_public_source" em news_pipeline_runs
  And: NÃO tenta parafrasear o tema usando só Bloomberg
```

### CA-013 — OpenAI retorna JSON válido (cobre RF-007)
```
Given: pipeline chama OpenAI GPT-5-mini com Structured Output schema=BriefingGenerationResponse
When: API responde
Then: response.choices[0].message.parsed é objeto que passa Zod parse
  And: contém array briefings de length 1-3
  And: cada briefing tem campos: titulo (≤80 chars), slug (kebab-case), categoria (enum), 
       por_que_importa (1 frase ≤200 chars), numeros (array 3-5 strings), 
       entre_as_linhas (1-2 frases), o_que_fica_de_olho (string), 
       fontes (array de {url, title})
```

### CA-014 — System prompt cacheado (cobre RF-007, RNF-003)
```
Given: pipeline faz 30 invocações diárias do OpenAI
When: invocações ocorrem em sequência
Then: usage.prompt_tokens_details.cached_tokens > 0 a partir da 2ª invocação do dia
  And: custo total/dia < R$ 5
```

### CA-014b — Bloqueio de Bloomberg como fonte (cobre RF-007, RNF-008)
```
Given: OpenAI retorna briefing com fontes=[{url:"https://bloomberg.com/...", ...}]
When: ComplianceCheck.run() é chamado
Then: detecta domínio bloomberg em fontes[].url
  And: retorna { passed: false, violations: [{type:"bloomberg_as_source", match:"bloomberg.com"}] }
  And: briefing fica com status "blocked_compliance"
  And: NÃO publica
```

### CA-015 — Bloqueio de ticker brasileiro (cobre RF-008)
```
Given: OpenAI retorna briefing com texto "...PETR4 pode subir..."
When: ComplianceCheck.run() é chamado
Then: retorna { passed: false, violations: [{type: "ticker_br", match: "PETR4", line: N}] }
  And: briefing fica com status "blocked_compliance"
  And: NÃO publica
```

### CA-016 — Bloqueio de frase proibida (cobre RF-008)
```
Given: OpenAI retorna briefing com texto "...investidores devem comprar este ativo..."
When: ComplianceCheck.run() é chamado
Then: detecta "comprar" via regex /\b(compre|venda|vai (subir|cair))\b/i
  And: retorna passed=false com violation
```

### CA-017 — Edição manual re-roda compliance (cobre RF-008, RF-009)
```
Given: Eduardo edita briefing em "blocked_compliance" e salva
When: backend recebe PATCH /api/admin/news/[id]
Then: ComplianceCheck.run() é executado novamente sobre o conteúdo editado
  And: se passou: status muda para "pending_review"
  And: se ainda bloqueia: status permanece "blocked_compliance" + nova lista de violações
```

### CA-018 — Admin lista briefings em todos os estados (cobre RF-009)
```
Given: Eduardo logado em /admin/news
When: página carrega
Then: vê 4 abas: "Pendentes" (pending_review), "Bloqueados" (blocked_compliance), 
      "Publicados" (published), "Arquivados" (archived)
  And: cada aba tem badge com contagem
  And: ordenação default: data desc
```

### CA-019 — Aprovação publica em < 60s (cobre RF-009, RF-010)
```
Given: briefing em pending_review
When: Eduardo clica "Aprovar e publicar"
Then: dentro de 5s, backend faz commit via GitHub API com mensagem "news: publish {slug}"
  And: Vercel webhook recebe push
  And: dentro de 60s, /news/[slug] retorna HTTP 200 (versão pública)
  And: card OG é gerado on-demand na primeira request
```

### CA-020 — Acesso não autenticado a /admin/news retorna 401 (cobre RF-009, RNF-007)
```
Given: usuário sem sessão Supabase
When: tenta acessar /admin/news
Then: middleware redireciona para /admin/login
  And: nenhum dado de briefing vaza
```

### CA-021 — MDX persistido com frontmatter completo (cobre RF-010)
```
Given: briefing aprovado e publicado
When: arquivo .mdx é gerado
Then: frontmatter contém:
  - title: string
  - slug: string (igual ao filename)
  - categoria: enum
  - data_publicacao: ISO 8601
  - tempo_leitura_min: number
  - por_que_importa: string
  - imagem_destacada_url: string opcional
  - fontes: array de {url, title}
  - status: "published"
  - autor: "Editorial LDC"
  - cvm_disclaimer_version: "1.0"
```

### CA-022 — Commit GitHub é assinado e bem-sucedido (cobre RF-010)
```
Given: GITHUB_PAT válido em env
When: backend commits arquivo via Octokit
Then: commit aparece em github.com/{org}/{repo}/commits no branch main (ou configurado)
  And: autor = "LDC News Bot <bot@ldccapital.com.br>"
  And: backend recebe SHA do commit e registra em Supabase
```

### CA-023 — Card OG renderiza em < 1s (cobre RF-011)
```
Given: briefing publicado em /news/exemplo
When: bot do LinkedIn faz GET /news/exemplo/opengraph-image
Then: recebe PNG 1200x630 em < 1s
  And: imagem contém: título do briefing, "LDC Capital · Editorial LDC", data
  And: tipografia segue stack LDC (Public Sans)
```

### CA-024 — Botões de share geram URLs corretos (cobre RF-012)
```
Given: briefing em /news/exemplo-slug
When: usuário clica botão Telegram
Then: abre nova janela com URL "https://t.me/share/url?url=https://ldccapital.com.br/news/exemplo-slug&text={title encoded}"
  And: evento "share.telegram" é registrado em Supabase
```

### CA-025 — Botão WhatsApp NÃO existe (cobre RF-012, Anti-SPEC §6)
```
Given: briefing em /news/exemplo-slug
When: HTML renderiza
Then: NÃO há nenhum elemento com link/intent para wa.me, whatsapp:// ou api.whatsapp.com
  And: lint check rejeita PRs que adicionem isso
```

### CA-026 — Schema NewsArticle válido (cobre RF-013)
```
Given: briefing publicado em /news/exemplo
When: HTML é inspecionado
Then: contém <script type="application/ld+json"> com schema NewsArticle válido
  And: campos obrigatórios: headline, datePublished, dateModified, author (Organization), 
       publisher (Organization name=LDC Capital), image, articleSection, mainEntityOfPage
  And: passa em validator.schema.org sem warnings
```

### CA-027 — /llms.txt inclui seção /news (cobre RF-013, RNF-004)
```
Given: arquivo /public/llms.txt na raiz
When: GET https://ldccapital.com.br/llms.txt
Then: response contém seção "## /news — Briefings diários LDC Capital"
  And: lista os últimos 50 briefings com {title, url, date, summary}
  And: arquivo é regenerado a cada publicação (via build ou ISR)
```

### CA-028 — Weekly digest retorna HTML inline-styled (cobre RF-014)
```
Given: 8 briefings publicados na semana corrente
When: GET /api/news/weekly-digest?week=current com x-api-key válido
Then: retorna 200 com { html: string, briefings: [...5 itens...] }
  And: html tem todos os estilos inline (compatível Mailchimp)
  And: html tem largura máxima 600px
  And: cada briefing tem título, "por que importa" (1 frase), CTA "Ler completo →" para /news/{slug}
  And: evento "weekly_digest_render" registrado em Supabase
```

### CA-029 — Telemetria registra view sem PII (cobre RF-015, RNF-007)
```
Given: usuário acessa /news/exemplo
When: página carrega
Then: tabela news_events recebe insert: 
  { type: "view", briefing_slug: "exemplo", ip_hash: sha256(IP), user_agent: string, ts: now() }
  And: NÃO armazena IP em texto puro nem cookie identificável
```

### CA-030 — Bot Telegram posta após publicação (cobre RF-016, Marco 2)
```
Given: bot configurado com token + chat_id do canal
When: briefing é publicado (Fluxo 2 passo 5)
Then: dentro de 30s, mensagem aparece no canal:
  "📊 {título}\n\n{primeira frase 'por que importa'}\n\n→ {link curto}"
  And: evento "telegram_posted" registrado em Supabase
```

> **⚠️ CA-031 a CA-038 abaixo: v1.0 DESATIVADO 2026-05-09 (ADR-006).** Mantidos para auditoria histórica. Vigentes pós-pivot: CA-039..CA-042.

### CA-031 — Botão "Gerar carrossel" só renderiza/habilita com published=true (cobre RF-019)
```
Given: BlogPost com published=false (rascunho)
When: Eduardo abre /admin/posts/edit/[id]
Then: botão "Gerar carrossel" aparece em estado disabled
  And: tooltip indica "Aprove o artigo antes de gerar carrossel"

Given: BlogPost com published=true
When: Eduardo abre /admin/posts/edit/[id]
Then: botão "Gerar carrossel" está habilitado em verde-oliva (#98ab44)
  And: ao clicar, dispara POST /api/admin/posts/[id]/carousel
```

### CA-032 — OpenAI retorna 5-7 slides validados pelo schema strict (cobre RF-019)
```
Given: BlogPost.content de ~1200 palavras, BLOG_CAROUSEL_SYSTEM_PROMPT_v1.0 carregado
When: generator chama OpenAI gpt-5-mini com Structured Outputs (schema relaxado)
Then: response.parsed passa em zodResponseFormat (relaxado)
  And: re-validação com schema strict passa
  And: slides.length entre 5 e 7
  And: cada slide tem type ∈ {hook, contexto, dado, pergunta, prova, CTA}
  And: title.length ≤ 80, body.length ≤ 320
        (smoke #5 evolução: 180 → 280 → 320. 180 cortava CTA com
        disclaimer literal CVM 3976-4 (~90 chars); 280 ainda truncava
        slide.prova; 320 + regra HARD no prompt elimina truncação)
  And: cada body termina com pontuação final (. ! ?) — regra HARD
        no prompt v1.0 evita greedy truncation pelo LLM
  And: caption_instagram.length ≤ 2200, caption_linkedin.length ≤ 3000
  And: hashtags.length entre 3 e 8
```

### CA-033 — runComplianceCheck() bloqueia ticker/prescrição em qualquer slide → 422 (cobre RF-019, RNF-002)
```
Given: OpenAI retorna slide com body "...PETR4 pode subir..."
When: generator aplica runComplianceCheck() no slide
Then: violations.length > 0 com type="ticker_br", match="PETR4"
  And: geração inteira aborta antes do render
  And: INSERT em carousel_runs com status="compliance_blocked", error_message com tipos das violations
  And: route retorna 422 com { violations, blog_post_id }
  And: ZIP NÃO é gerado e nenhum upload acontece
```

### CA-034 — @vercel/og renderiza PNG nos 2 formatos sem erro (cobre RF-019)
```
Given: CarouselScript validado com 6 slides, fontes IvyMode + Public Sans carregadas via fs.readFileSync
When: render.ts chama new ImageResponse(<SlideHook />, { width: 1080, height: 1350, fonts: [...] })
Then: response.body é Buffer não-vazio
  And: PNG decodificado tem dimensões 1080×1350 (Instagram portrait)
  And: mesmo template re-renderizado com width=1080, height=1080 retorna PNG LinkedIn square
  And: tipografia segue hierarquia: IvyMode Bold 64-80px (hook), Public Sans Regular 32-40px (body)
```

### CA-035 — ZIP contém estrutura completa (cobre RF-019)
```
Given: 6 slides renderizados nos 2 formatos
When: zip.ts empacota e retorna Buffer
Then: ZIP contém:
  - instagram/slide-1.png ... slide-6.png (1080×1350)
  - linkedin/slide-1.png ... slide-6.png (1080×1080)
  - caption-instagram.md (≤2200 chars)
  - caption-linkedin.md (≤3000 chars)
  - README.md com instruções de uso (drag&drop em IG/LinkedIn web, hashtags em comentário separado, disclaimer Anti-SPEC)
  And: filename do ZIP = "{slug}-carousel-{YYYYMMDD-HHmmss}.zip"
```

### CA-036 — Bucket privado + signed URL 24h (cobre RF-019, RNF-007)
```
Given: ZIP gerado e upload bem-sucedido em Supabase Storage bucket "blog-carousels"
When: route resolve a resposta
Then: bucket é privado (storage.buckets.public=false)
  And: createSignedUrl(zip_pathname, 60*60*24) retorna URL assinada
  And: endpoint retorna { signedUrl, expiresAt: ISO 8601, slides: [...preview metadata...], carouselRunId }
  And: signedUrl não é acessível sem o token (verificado em smoke local)
```

### CA-037 — Custo ≤R$0,05 + rate limit 10/dia (cobre RF-019, RNF-003)
```
Given: geração com gpt-5-mini ~3K input + 1K output tokens
When: generator finaliza com sucesso
Then: openai_cost_brl ≤ 0.05 (estimativa real ~R$0,005)
  And: carousel_runs.openai_total_tokens e openai_cost_brl populados
  And: se openai_cost_brl > 0.05, status="failed" + error_message="cost_exceeded"

Given: usuário já tem 10 carousel_runs com status='success' nas últimas 24h
When: Eduardo clica "Gerar carrossel"
Then: route retorna 429 com { error: "rate_limit_exceeded", message: "Limite diário atingido (10/dia)" }
  And: nenhuma chamada OpenAI é feita
```

### CA-038 — Anti-SPEC §6.2b: zero "Bloomberg" em qualquer artefato (cobre RF-019, §6.2b)
```
Given: CarouselScript validado pelo schema
When: generator aplica regex /bloomberg/i sobre slides[].title, slides[].body, caption_instagram, caption_linkedin, hashtags[]
Then: se qualquer match → status="compliance_blocked" com type="bloomberg_in_body"
  And: geração aborta antes do render
  And: route retorna 422 com violation
```

### CA-039 — SlideTweet renderiza header X.com correto por variação (cobre RF-019b)
```
Given: CarouselScript v2.0 validado, variação="ldc"
When: SlideTweet renderiza
Then: PNG 1080×1350 contém:
  - badge "X.com" canto superior direito (PublicSans Bold 26 #FFFFFF)
  - avatar circular 56×56 do arquivo ldc-capital.png com backdrop #1A2332
  - displayName "LDC Capital" PublicSans Bold 28 #FFFFFF
  - ✓ verificado azul (#1D9BF0) inline ao lado do nome
  - handle "@ldc.capital" PublicSans Regular 22 #71767B
  And: variação="luciano" usa luciano-herzog.png SEM backdrop
       e handle "@luciano.herzog"
```

### CA-040 — Body suporta bold markdown inline (cobre RF-019b)
```
Given: slide.body com sintaxe "Selic em **14,75%** ao ano"
When: SlideTweet renderiza
Then: trecho "14,75%" aparece em PublicSans Bold (mesmo size do body)
  And: restante em PublicSans Regular
  And: máximo 5 trechos **xxx** por slide.body (validação Zod)
  And: schema relaxado aceita; strict valida limite
```

### CA-041 — DALL-E 3 gera imagem hero para slides 1, 3, 6 com fallback (cobre RF-019b)
```
Given: slide.image_prompt populado em slides 1, 3, 6
When: image-gen.ts chama OpenAI Images API
Then: response retorna imagem 1792×1024
  And: buffer é cropped para 920×520 (16:9) e embedded no slide
  And: regex /bloomberg/i é aplicada no image_prompt ANTES da chamada
       (defense in depth Anti-SPEC §6.2b)

Given: DALL-E falha 3× consecutivas
When: pipeline detecta retries esgotados
Then: slide é renderizado SEM imagem (text-only)
  And: error_message logado em carousel_runs com lista de slides afetados
  And: status='success' SE outros slides OK; status='failed' SE todos falharem
```

### CA-042 — ZIP contém estrutura ldc/+luciano/ + cost guard R$1,00 (cobre RF-019b, RNF-003)
```
Given: 6 slides × 2 variações renderizados
When: zip.ts empacota
Then: ZIP contém:
  - ldc/slide-1-hook.png ... slide-6-cta.png
  - luciano/slide-1-hook.png ... slide-6-cta.png
  - caption-instagram.md
  - caption-linkedin.md
  - README.md (atualizado: explica 2 variações + uso institucional vs pessoal)

Given: openai_cost_brl + dalle_cost_brl > 1,00
When: pipeline finaliza
Then: status='failed' com error_message='cost_exceeded'
  And: ZIP é gerado mesmo assim (custo é sentinela, não bloqueio — Eduardo decide via auditoria)
  And: rate limit 10/dia/user permanece (mesmo padrão do v1.0)
```

---

## 5. Casos de borda

| ID | Cenário | Comportamento esperado | Prioridade |
|---|---|---|---|
| CB-001 | Perplexity API offline / timeout (>15s) | Pipeline registra erro, prossegue só com PDF se houver, ou aborta a rodada com log. Próximo cron tenta de novo. | Alta |
| CB-002 | OpenAI retorna JSON malformado / falha Zod | Retry 1x com prompt reforçado. Se falhar 2x, aborta rodada e registra em `news_pipeline_errors`. | Alta |
| CB-003 | OpenAI excede token limit antes de finalizar | Pipeline detecta `finish_reason: "length"`, aborta sem salvar draft. | Média |
| CB-004 | PDF Bloomberg corrompido | pdfjs-dist lança exceção. Pipeline tenta Gemini fallback. Se Gemini também falhar, aborta com erro logado. | Média |
| CB-005 | Commit GitHub falha (rate limit, conflito) | Retry 2x com backoff (5s, 30s). Se ainda falhar, briefing fica em `pending_publish` para retry manual. | Alta |
| CB-006 | Cron dispara duas instâncias concorrentes | Lock via Supabase (`news_pipeline_runs.status = 'running'`). Segunda instância detecta, aborta sem erro. | Alta |
| CB-007 | Slug colisão (mesmo título em dois dias) | Filename inclui data: `YYYY-MM-DD-{slug}.mdx`. Se ainda colidir, sufixo `-2`, `-3`. | Baixa |
| CB-008 | Briefing com >350 palavras (viola Brevidade) | OpenAI prompt tem hard limit; valida via Zod (`body.length`). Se exceder, briefing é truncado E entra em `pending_review` com flag warning. | Média |
| CB-009 | Imagem destacada Perplexity retorna URL morta | Validação async no momento da publicação (HEAD request). Se 4xx/5xx, fallback para card LDC genérico. | Baixa |
| CB-010 | Mailchimp campanha com >5 briefings (1 semana atípica) | Endpoint `weekly-digest` SEMPRE retorna top 5. Eduardo pode passar `?limit=N` para override (max 10). | Baixa |
| CB-011 | Vercel Blob estoura cota | PDFs com mais de 30 dias são auto-removidos via cron diário separado. | Baixa |
| CB-012 | Briefing publicado precisa ser despublicado (CVM, erro grave) | Eduardo arquiva em `/admin/news`. URL retorna 410 Gone com mensagem "Conteúdo removido". Sitemap remove o item. | Alta |
| CB-013 | Telegram bot offline / token expirado | Erro logado, briefing publicado normalmente em `/news`. Reenvio manual via botão "Republicar Telegram" no admin. | Baixa |
| CB-014 | Compliance regex falha negativa (ticker passou) | Eduardo deve detectar na revisão humana. Pós-incidente, lista negra é atualizada e regex é refinada. ADR documenta. | Alta (sensível) |
| CB-015 | PDF Bloomberg com tabela de índices quebrada em linhas avulsas pelo pdfjs | Pré-processamento detecta padrão `[A-Z][A-Z0-9 ]+ [+-]?\d+,\d+%?` e re-agrupa em bloco `<table_data>`. Se falhar, GPT recebe linhas avulsas e ainda consegue interpretar. | Média |
| CB-016 | PDF é Associated Press traduzido por máquina (qualidade ruim) | Detecção via header "Traduzido por máquina de Inglês para Português" → flag `auto_translated=true` no metadata. System prompt instrui GPT a "limpar" linguagem traduzida e priorizar reescrita ao invés de citação direta. | Média |
| CB-017 | GPT tenta citar "Bloomberg" como fonte mesmo com instrução proibitiva | RF-008 detecta via regex em fontes[].url/dominio. Briefing bloqueado. Em pipeline run, contador `bloomberg_citation_attempts` incrementa — se > 5 em 24h, alerta no admin (system prompt precisa reforço). | Alta (compliance contratual) |
| CB-018 | Rodada com >10 PDFs (Eduardo tentou enviar batch grande) | Upload rejeita com 400. Eduardo divide em 2+ uploads. | Baixa |
| CB-019 | PDFs Bloomberg de fontes diferentes cobrem o mesmo tema com ângulos distintos | GPT system prompt instrui: "Quando múltiplos PDFs cobrem o mesmo tema, sintetize em UM briefing — não duplique". Validação via Zod: dois briefings com `por_que_importa` similaridade > 0.85 (cosine simples) são merged ou um é descartado. | Média |

---

## 6. Anti-SPEC (o que o sistema NÃO DEVE fazer)

> **🛑 SEÇÃO SAGRADA.** Previne alucinação da IA, scope creep e violação de compliance CVM. Nenhum agente pode alterar esta seção sem autorização humana explícita do Eduardo. Toda feature B/C/D no TODO.md passa explicitamente por esta lista no Prompt 3 (QA do PR).

### 6.1 — Fora desta versão (Marco 1 + Marco 2)
- **NÃO criar paywall ou área "Premium"** na `/news`. Tudo aberto. Camada 2 Premium é projeto separado.
- **NÃO criar opt-in próprio de newsletter na `/news`.** Lista é a Mailchimp existente da LDC (Cenário B confirmado por Eduardo).
- **NÃO criar comentários públicos** ou seção de "discussion" abaixo dos briefings.
- **NÃO assinar briefing com nome individual** (Luciano, Marcos, etc.). Voz é "Editorial LDC" anônimo institucional.
- **NÃO implementar busca textual full-text** na `/news` no Marco 1. Filtro por categoria é suficiente.
- **NÃO criar dashboard público de "mais lidos do mês".** Telemetria é interna ao admin.
- **NÃO integrar com Discord, Reddit, Bluesky, Threads.** Distribuição inicial: Telegram + Mailchimp + LinkedIn + X.
- **NÃO criar versão em inglês ou outros idiomas.** Português BR exclusivo.

### 6.2 — Comportamentos proibidos (compliance CVM — hard requirement)
- **NÃO publicar briefing contendo ticker individual nominado** (PETR4, VALE3, AAPL, TSLA, etc.) sem revisão humana e edição. Bloqueio técnico via regex.
- **NÃO publicar frases prescritivas** ("compre", "venda", "vai subir", "vai cair", "rentabilidade garantida", "lucro garantido", "investimento certo", "oportunidade única", "não pode perder").
- **NÃO prometer retorno financeiro** ou retorno percentual em qualquer hipótese.
- **NÃO recomendar alocação personalizada.** Briefing é análise informacional macro, nunca recomendação CVM.
- **NÃO mencionar "Carteira Estratégia LDC" como produto vendável na `/news`.** Apenas como referência ao método LDC com link para "saiba mais → consultoria CVM" (segue Caminho C do report).
- **NÃO armazenar PII em telemetria.** IP é hasheado (sha256). Email só no Mailchimp (sistema externo, fora do escopo).
- **NÃO logar conteúdo de PDFs Bloomberg** com dados não-públicos em sistemas de log (Vercel logs, Supabase). Apenas processar em memória.
- **NÃO publicar automaticamente sem aprovação humana** durante todo o Marco 1 + Marco 2. Status `pending_review` é terminal sem ação manual.

### 6.2b — Proteção autoral Bloomberg (compliance contratual — hard requirement)
- **NÃO citar Bloomberg como fonte pública** em briefings. Bloomberg PBN/BFW/BN é assinatura privada do Eduardo, não conteúdo redistribuível.
- **NÃO incluir `bloomberg.com`, `bloomberg.net`, `bloomberglinea.*`, `bloomberg.com.br`** no array `fontes[]` de qualquer briefing publicado.
- **NÃO parafrasear trechos exclusivos** que apareçam apenas no Bloomberg sem cobertura pública confirmada via Perplexity. Se um tema só existe no Bloomberg, descartar.
- **NÃO mencionar "Bloomberg" no corpo do briefing** mesmo sem URL — ferramenta de busca textual no admin sinaliza ocorrências da palavra para revisão humana.
- **NÃO armazenar PDFs Bloomberg** por mais de 30 dias em Vercel Blob (auto-cleanup via cron diário).

### 6.3 — Padrões técnicos proibidos
- **NÃO usar polling para detectar publicação.** Vercel ISR + webhook GitHub é a única fonte de verdade.
- **NÃO usar localStorage/cookies para tracking.** Telemetria é server-side (registra na request).
- **NÃO criar endpoint de listagem `/api/news/*` sem paginação.** Limit default 20, max 100.
- **NÃO importar Anthropic SDK.** Stack confirmada é OpenAI + Perplexity + Gemini (fallback). Adicionar Anthropic exige ADR novo.
- **NÃO importar bibliotecas de chart client-side em briefings.** Imagens são PNG/JPG estáticos ou cards OG gerados server-side.
- **NÃO usar regex de compliance no client.** Bloqueio é server-side no pipeline. Cliente nunca recebe briefing bloqueado.
- **NÃO commitar `.mdx` em `content/news/_drafts/` para o branch main.** Drafts vivem em branch separado ou em Supabase, fora do build de produção.
- **NÃO cache de página `/news/[slug]` sem invalidação ao publicar.** ISR com revalidate=60s + on-demand revalidation no commit.

### 6.4 — Botões/integrações proibidos por escolha de produto
- **NÃO botão WhatsApp** em nenhum lugar da `/news`. Decisão produto Eduardo (não escala UHNW + ruído).
- **NÃO Pinterest, Reddit, Tumblr** ou qualquer rede que não seja Telegram/LinkedIn/X.
- **NÃO popup de exit-intent** ou lead magnets agressivos. CTA único: "Agendar Diagnóstico" no rodapé.
- **NÃO chatbot ou widget de chat ao vivo** na página.

### 6.5 — Fora de escopo (v2+)
- App mobile nativo
- Versão paga "LDC Research Premium" (Camada 2)
- Bot Telegram interativo (responde perguntas, gera briefings on-demand)
- Tradução automática para inglês
- Audio/podcast version (TTS dos briefings)
- Vídeo curto automático (Marcos pode usar briefing como roteiro, mas geração é fora de escopo)

---

## 7. Modelos de dados

### Entidade: Briefing (frontmatter MDX + body)
| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| title | string | Sim | 5-80 chars, ≤ 8 palavras (validado) |
| slug | string | Sim | kebab-case, único, regex `^[a-z0-9-]+$` |
| categoria | enum | Sim | "macro_brasil" \| "macro_global" \| "geopolitica" \| "commodities" \| "renda_fixa" \| "internacional_uhnw" \| "sucessao_tributacao" \| "setorial" |
| data_publicacao | ISO 8601 | Sim | auto |
| tempo_leitura_min | number | Sim | calculado via reading-time |
| por_que_importa | string | Sim | 1 frase, ≤ 200 chars |
| numeros | array | Sim | 3-5 itens; cada item: `{texto: string, fonte_url: string, fonte_nome: string}` |
| entre_as_linhas | string | Sim | 1-2 frases, ≤ 300 chars |
| o_que_fica_de_olho | string | Sim | 1 frase, ≤ 150 chars |
| imagem_destacada_url | string | Não | URL HTTPS válida; fallback card OG genérico |
| imagem_destacada_alt | string | Sim se imagem | ≤ 120 chars |
| fontes | array | Sim | ≥ 1 item; cada: `{url: string HTTPS, title: string, dominio: string}` |
| autor | string | Sim | sempre "Editorial LDC" (constante) |
| status | enum | Sim | "pending_review" \| "blocked_compliance" \| "published" \| "archived" |
| violations | array | Não | Preenchido se status="blocked_compliance" |
| cvm_disclaimer_version | string | Sim | "1.0" |
| view_count | number | Não | Internal Supabase, não vai no frontmatter |

### Entidade: PipelineRun (Supabase)
| Campo | Tipo | Obrigatório |
|---|---|---|
| id | UUID | Sim |
| triggered_at | timestamp | Sim |
| trigger_type | enum | Sim ("cron_morning" \| "cron_afternoon" \| "manual_upload" \| "manual_admin") |
| pdf_used_url | string | Não |
| perplexity_queries | jsonb | Sim (array das queries enviadas) |
| openai_total_tokens | number | Sim |
| openai_cost_brl | number | Sim |
| briefings_generated | number | Sim |
| briefings_blocked | number | Sim |
| status | enum | Sim ("running" \| "success" \| "failed") |
| error_message | text | Não |
| duration_ms | number | Sim |

### Entidade: NewsEvent (Supabase, telemetria)
| Campo | Tipo | Obrigatório |
|---|---|---|
| id | UUID | Sim |
| type | enum | Sim ("view" \| "share" \| "cta_diagnostico" \| "weekly_digest_render") |
| briefing_slug | string | Não (não aplicável a weekly_digest) |
| share_channel | enum | Não ("telegram" \| "linkedin" \| "x" \| "copy_link") |
| ip_hash | string | Sim (sha256) |
| user_agent | string | Sim |
| referer | string | Não |
| ts | timestamp | Sim |

### Entidade: ComplianceViolation (in-memory, salva em frontmatter quando aplicável)
| Campo | Tipo | Obrigatório |
|---|---|---|
| type | enum | Sim ("ticker_br" \| "ticker_us" \| "phrase_prescriptive" \| "promise_return" \| "bloomberg_as_source" \| "bloomberg_in_body") |
| match | string | Sim (substring violadora) |
| line_number | number | Sim |
| severity | enum | Sim ("hard_block" sempre v1) |
| field | enum | Sim ("body" \| "fontes_url" \| "fontes_dominio" \| "title" \| "por_que_importa" \| "entre_as_linhas") |

---

## 8. Limites de escopo

| Item | Motivo | Quando |
|---|---|---|
| Bot Telegram interativo | Marco 1 prioriza pipeline e qualidade editorial | Marco 2 (semana 4-5) |
| `/llms.txt` dinâmico | Marco 1 entrega versão estática gerada no build | Marco 2 |
| Telemetria avançada (heatmap, scroll depth) | Métrica binária view+share é suficiente para validar | v2 |
| Comentários e discussão pública | Compliance + esforço de moderação | v2+ |
| Multi-idioma | Foco BR R$1M+ | v2+ |
| Versão paga (Camada 2) | Projeto separado no roadmap LDC | v2 |
| Parecer jurídico Mattos Filho/BMA | Removido por decisão D-11 (simplicidade go-live) | Opcional v2 |

---

## 9. Rastreabilidade (RF ↔ feature ↔ classe ↔ CI)

> Tabela preenchida na FASE 6 ao criar TODO.md. Esqueleto inicial:

| RF | Cobre CAs | Feature (TODO.md) | Classe | CI alvo |
|---|---|---|---|---|
| RF-001 | CA-001, CA-002 | F-003 | B | N1 |
| RF-002 | CA-003, CA-004, CA-005 | F-004 | B | N1 |
| RF-003 | CA-006, CA-007 | F-008 | D | N3 |
| RF-004 | CA-008 | F-006 | C | N2 |
| RF-005 | CA-009, CA-010 | F-007 | B | N1 |
| RF-006 | CA-011, CA-012 | F-007 | B | N1 |
| RF-007 | CA-013, CA-014 | F-007 | C | N2 |
| RF-008 | CA-015, CA-016, CA-017 | F-005 | C | N2 |
| RF-009 | CA-018, CA-019, CA-020 | F-006 | C | N2 |
| RF-010 | CA-021, CA-022 | F-008 | D | N3 |
| RF-011 | CA-023 | F-009 | B | N1 |
| RF-012 | CA-024, CA-025 | F-009 | B | N1 |
| RF-013 | CA-026, CA-027 | F-010 | B | N1 |
| RF-014 | CA-028 | F-011 | B | N1 |
| RF-015 | CA-029 | F-012 | B | N1 |
| RF-016 | CA-030 | F-013 (Marco 2) | C | N2 |
| RF-019 (v1.0 desativado — ADR-006) | CA-031..CA-038 (auditoria) | F-019 v1.0 (descartado) | B | N1 |
| RF-019b (X-mock pós-pivot ADR-006) | CA-039..CA-042 | F-019 v2.0 | B | N1 |

---

## 10. Aprovação

- [x] RFs numerados e verificáveis (16 RFs)
- [x] RNFs documentados com alvos concretos (7 RNFs)
- [x] CAs em formato Given/When/Then (30 CAs)
- [x] Casos de borda mapeados (14 CBs)
- [x] Anti-SPEC sagrada preenchida (5 subseções, ~30 proibições)
- [x] Modelos de dados com validações
- [x] Tabela de rastreabilidade RF ↔ feature
- [ ] **SPEC revisada e aprovada pelo Eduardo** ← aguardando

---

*Próximo passo: contratos Zod em `src/features/news/contracts/*.ts` + espelho legível em `docs/news/CONTRACTS.md`.*
