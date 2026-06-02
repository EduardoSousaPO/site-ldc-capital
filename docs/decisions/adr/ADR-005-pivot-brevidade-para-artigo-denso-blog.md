# ADR-005 — Pivot 2026-04-29: Brevidade Inteligente em `/news` → Artigo denso em `/blog` (Supabase BlogPost)

- **Status:** aceito
- **Data:** 2026-04-29
- **Autor:** Eduardo Sousa (decisão), formalizado por Claude no fluxo SDD-avancado
- **Substitui:** parcialmente ADR-002 (persistência via MDX commit GitHub) — ver §"Consequências"
- **Convive com:** ADR-001 (stack IA OpenAI+Perplexity+Gemini), ADR-003 (Bloomberg como sinal interno), ADR-004 (compliance via guardrails técnicos) — todos continuam válidos

---

## Contexto

A feature `/news` foi originalmente concebida (CONCEITO_NEWS_LDC.md, 2026-04-23) como **briefing diário em formato Brevidade Inteligente** — ~280-340 palavras, formato fixo (Por que importa / Os números / Entre as linhas / O que fica de olho), inspirado em Axios Smart Brevity + Bloomberg Opinion. A pesquisa de mercado (matriz_concorrentes.md) validou essa decisão como janela competitiva — nenhuma consultoria fee-based BR operava esse formato.

O pipeline foi implementado nas features F-001 a F-011 e estava operacional em modo dev: F-007 gerou um briefing real em smoke test (2026-04-28, custo R$0,30, qualidade publicável), F-008 estava em desenvolvimento (Vercel Cron + commit GitHub via Octokit + drafts em Vercel Blob).

Em **2026-04-29**, reunião entre Eduardo e Marcos Farias Meneghel (sócio operacional da LDC) trouxe feedback explícito sobre a feature:

1. **Formato:** "expressou o desejo de que o conteúdo automatizado fosse mais completo, visando transformá-lo em artigos mais robustos para o blog. Sua ideia é que o conteúdo automático seja mais denso e útil para o cliente, servindo como um 'YouTube para o blog' com assuntos mais pesquisáveis e amplos, em vez de resumos diários de notícias minuciosas."
2. **Local:** "Eles concordaram em colocar o conteúdo dentro do blog" (em vez de seção `/news` separada).
3. **Categorias:** "Marcos sugeriu a criação de categorias mais específicas, como 'planejamento financeiro' e 'investimento internacional'" — alinhadas ao blog existente.
4. **Aprovação editorial:** "validação fosse direcionada para seu e-mail" — Marcos recebe email com link para aprovar/rejeitar (em vez de admin `/admin/news`).
5. **Reaproveitamento:** "Adicionar reaproveitamento de conteúdo ao escopo. Incluir rascunhos de carrossel para Instagram/LinkedIn."

Investigação técnica subsequente revelou descoberta arquitetural crítica: **o blog em produção lê posts da tabela Supabase `BlogPost` via `createSupabaseAdminClient()`** ([src/app/lib/blog.ts:56-78](../../src/app/lib/blog.ts)). Os 3 arquivos `.mdx` em `content/blog/` não são consumidos. Existe também tabela `Category` separada com lookup. Admin completo já existe em `/admin/posts/new` com markdown editor (`@uiw/react-md-editor`), upload de imagem e autosave.

## Decisão

**Pivotar 100%** para a nova arquitetura:

1. **Pipeline IA gera artigos densos (800-1500 palavras)**, não briefings curtos. Tom de referência: David J. Mullen Jr. ("The Million-Dollar Financial Advisor") + Renato Breia (Nord Wealth) + Andrey Nousi (CFA) — narrativa de dados macro/geopolítica, mentor sênior, foco em estratégia patrimonial UHNW de médio-longo prazo.
2. **Persistência:** `INSERT` direto na tabela Supabase `BlogPost` com `published=false`, **não** mais MDX em filesystem nem commit GitHub. Sem Octokit, sem `archived-slugs.generated.ts`, sem Vercel rebuild.
3. **URL:** posts ficam em `/blog/[slug]` plano (não em `/blog/news/[slug]` ou subpasta). Categoria diferencia origem AI-pipeline vs manual.
4. **8 categorias** definidas e criadas em produção em 2026-04-29 (migration `blog_categories_news_pivot`):
   - `macro-brasil`, `macro-global`, `geopolitica`, `planejamento-financeiro`, `investimento-internacional`, `renda-fixa-credito`, `mercado-de-capitais-br`, `analises-e-estrategia`
5. **Aprovação editorial:** token-based via email (Resend já instalado) — Marcos recebe link, clica "aprovar" → endpoint faz `UPDATE published=true`. Substitui workflow `/admin/news` (descontinuado).
6. **Reuso pós-go-live:** módulo de geração de carrossel Instagram/LinkedIn via `@vercel/og` + templates React (estilo Andrey Nousi/Renato Breia). Substitui Mailchimp digest e Telegram bot (descontinuados).
7. **Estado dos `/news/*`:** rotas redirecionam 301 para `/blog`. Header.tsx removida entrada "News". Conteúdo (5 mocks) descartado — pipeline gera novos diretamente em `BlogPost`.

## Alternativas consideradas

- **A — Manter Brevidade Inteligente (decisão original):**
  - Prós: janela competitiva única no mercado fee-based BR; pesquisa de produto validada; 8 features já operacionais (F-001 a F-011).
  - Contras: Marcos (sócio operacional) explicitamente preferiu artigo denso; conflito interno LDC sobre posicionamento do produto; perderia oportunidade de SEO denso para blog.
  - **Por que não:** decisão estratégica de produto compete a Marcos como sócio operacional. Brevidade Inteligente fica registrada como caminho descartado em release distinto, pode ser revisitada em v2 se métricas do artigo denso forem fracas.

- **B — Manter `/news` (Brevidade) + adicionar `/blog/news/` (artigo denso) — DOIS PRODUTOS:**
  - Prós: preserva valor de F-007 já implementado; permite testes A/B entre formatos.
  - Contras: dobra custo de manutenção (dois pipelines, dois schemas, dois admins); confusão de posicionamento; aumenta complexidade SEO (conteúdo similar em duas URLs).
  - **Por que não:** Marcos pediu pivot, não diversificação. Manter dois produtos por hipótese é caro e dispersivo.

- **C — Híbrido tático: ajustar formato existente para 600-900 palavras mantendo URL `/news`:**
  - Prós: menor refator; preserva infraestrutura SEO de F-011 (sitemap, JSON-LD, llms.txt).
  - Contras: Marcos foi específico sobre "dentro do blog"; manter URL `/news` cria ambiguidade SEO; identidade visual do `/blog` já está consolidada e tem padrão de markdown rendering (ReactMarkdown) que aproveita.
  - **Por que não:** compromisso parcial não atende Marcos integralmente; manter a feature em URL própria depois do pivot soa como teimosia.

## Consequências

### Positivas

- **Arquitetura simplifica drasticamente:** sem Octokit, sem GitHub PAT, sem `archived-slugs.generated.ts`, sem Vercel rebuild a cada publicação. Pipeline IA → INSERT BlogPost → email approval → UPDATE published=true. Cabe mentalmente em 1 diagrama.
- **Reuso máximo da infraestrutura existente:** admin `/admin/posts` já cobre edição. Blog já renderiza posts. Categoria já existe como entidade Supabase. ReactMarkdown já está em uso. F-001/F-002/F-005/F-009 e partes técnicas de F-007 (extractor, Perplexity, OpenAI client, Gemini fallback, format-detector) **continuam válidos e reaproveitados em F-015**.
- **SEO maior:** artigos densos (800-1500 palavras) têm muito mais chance de ranquear em queries macro/geopolítica que briefings de 280 palavras. Janela GEO/LLM (ADR-003 §11.B) preservada e amplificada.
- **Tom alinhado a David Mullen Jr. + Renato Breia + Andrey Nousi** — autoridade técnica calma, analista macro/geopolítico, foco em estratégia patrimonial. Atende público UHNW que tem assessoria/banker e busca segunda fonte editorial.
- **Reaproveitamento natural para redes sociais:** artigo aprovado vira input do gerador de carrossel (F-019, pós-go-live). Estilo Andrey Nousi/Renato Breia replicável via templates React + `@vercel/og`.
- **Custos operacionais menores:** sem GitHub PAT rotacionando trimestralmente; sem custo de Vercel rebuild a cada publicação.

### Negativas / trade-offs

- **Perde-se a janela competitiva da Brevidade Inteligente UHNW:** matriz_concorrentes.md mostrava que nenhuma consultoria fee-based BR operava o formato; passamos para uma categoria onde Suno/Empiricus/Money Times competem com artigos densos. Mitigação: o tom (David Mullen Jr. + macro/geopolítica + tom UHNW) e a profundidade analítica diferenciam — não estamos competindo em volume, estamos competindo em curadoria editorial.
- **Trabalho descartado:** F-006 (admin `/admin/news`), F-008 inteiro (Octokit, drafts em Vercel Blob, news_publications, lock distribuído elaborado), F-010 (Mailchimp digest), F-012 (Telegram bot). Custo afundado de ~30-40% do esforço cumulativo. Mitigação: aceito como custo de aprendizado — pivot mais tarde teria sido mais caro.
- **Sem versionamento git de conteúdo:** posts em Supabase não têm `git revert` nativo. Mitigação: tabela `BlogPost` tem `updatedAt`, `publishedAt`, e podemos adicionar `BlogPost_audit_log` no futuro se compliance exigir.
- **Sem `/llms.txt` automatizado de F-011:** descartado (lia `content/news/_drafts/`). F-016 vai refazer apontando para BlogPost rows publicadas, ou descartar definitivamente. Decisão pendente em F-016.

### Neutras

- **Anti-SPEC §6.2 (compliance CVM)** continua sagrada e aplicada. Substituições/proibições idênticas.
- **Anti-SPEC §6.2b (Bloomberg autoral)** continua sagrada. Bloomberg como sinal interno, jamais fonte pública. F-005 (compliance check) continua sendo obrigatório no pipeline.
- **ADR-001 (stack IA)** confirmado e mantido. OpenAI GPT-5-mini + Perplexity Sonar Pro + Gemini Flash continuam.
- **Anti-SPEC §6.3 (proibições técnicas)** continua. Nada de Anthropic SDK, nada de cliente JS para tracking, etc.
- **Custo mensal ainda dentro do teto R$200/mês** — Gemini Flash gratuito (com billing como fallback per DEBT-003), OpenAI gpt-5-mini com prompt cache, Perplexity Sonar Pro estável.

## Estado pós-pivot (executado 2026-04-29)

**Apagado:**
- `src/app/news/`, `src/app/admin/news/`, `src/app/api/news/`, `src/app/api/admin/news/` (rotas)
- `content/news/` (5 mocks + draft do smoke F-007)
- `src/features/news/persistence/` (publish-local, publish-github, draft-storage, publications-db de F-006/F-008)
- `src/features/news/seo/` (json-ld, llms-txt, archived-slugs, base-url de F-011)
- `src/features/news/components/` (BriefingCard, BriefingHeader, BriefingBody, ShareButtons, Disclaimer, CategoriaFilter de F-003/F-004)
- `src/features/news/lib/` (read-briefings.ts)
- `src/features/news/contracts/{admin,briefing,digest,persistence,telegram}.ts`
- `src/features/news/constants/categorias.ts`
- `src/features/news/prompts/system-prompt.ts` (Brevidade v1.1)
- `src/features/news/contracts/openai.ts`, `pipeline/openai-client.ts`, `pipeline/orchestrator.ts`, `pipeline/pipeline-db.ts` (serão recriados em F-015)
- `scripts/generate-archived-list.ts`, `scripts/generate-llms-txt.ts`
- `public/llms.txt`
- Testes correspondentes
- `@octokit/rest` desinstalado de `package.json`

**Mantido (reaproveita em F-015):**
- `src/features/news/compliance/` (engine F-005 — checker, fixtures, blacklists)
- `src/features/news/telemetry/` (track, hash-ip, extract-request-meta, cliente Supabase isolado de F-009)
- `src/features/news/pipeline/` exceto orchestrator/openai-client/pipeline-db: extractor, format-detector, gemini-fallback, perplexity-client, pdf-storage + 4 PDFs Bloomberg fixtures
- `src/features/news/contracts/{compliance,perplexity,pipeline,telemetry}.ts`
- `src/features/news/constants/{compliance-blacklist,perplexity-domains,disclaimers}.ts`
- `src/features/news/prompts/turno-queries.ts`

**Ajustado:**
- `src/middleware.ts` — matcher `/news/*` agora retorna 301 redirect para `/blog`
- `src/app/components/Header.tsx` — entrada "News" removida do menu
- `src/app/sitemap.ts` — seção `/news` removida; sitemap lista BlogPost direto via Supabase
- `.env.example` — removidas envs obsoletas (`GITHUB_PAT`, `GITHUB_REPO_*`, `NEWS_PUBLISHING_ENABLED`, `NEWS_DIGEST_API_KEY`, `TELEGRAM_*`)
- `package.json` — removido `prebuild` script + dep `@octokit/rest`
- `src/features/news/contracts/index.ts` — re-exports atualizados
- Tabela Supabase `Category` — 7 novas categorias inseridas via migration `blog_categories_news_pivot` (1 já existia)

**Validação:** `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (44/44 passing) — tudo verde pós-pivot.

## Roadmap pós-pivot

| Feature | Classe | Descrição |
|---|---|---|
| **F-015** | C | Refactor pipeline: novo system prompt v2 (artigo denso, tom Mullen+macro), novo schema `BlogArticleDraft`, `INSERT` em Supabase BlogPost (`published=false`), endpoint `/api/news/cron` adaptado |
| **F-016** | B | 301 redirects validados, refator opcional do sitemap/SEO para BlogPost (JSON-LD `Article`, llms.txt apontando para BlogPost), descarte definitivo do que não migrou |
| **F-018** | C | Aprovação por email (token-based) para Marcos. Resend envia link → endpoint atualiza `published=true` |
| **F-019** | B | Gerador de carrossel Instagram/LinkedIn estilo Andrey Nousi/Renato Breia, via `@vercel/og` + templates React |

Features descontinuadas: **F-006** (admin `/admin/news` redundante com `/admin/posts`), **F-008** (Octokit + draft-storage Blob + publications + lock elaborado), **F-010** (Mailchimp weekly digest), **F-012** (Telegram bot).

## Referências

- CONCEITO_NEWS_LDC.md — proposta original Brevidade Inteligente (2026-04-23)
- Reunião Eduardo+Marcos 2026-04-29 — feedback que motivou o pivot ("Reunião iniciada às 2026_04_29 16_32 GMT-03_00 - Anotações do Gemini.md")
- ADR-001 — stack IA (mantida)
- ADR-002 — persistência via MDX + GitHub API (substituída pela decisão deste ADR)
- ADR-003 — Bloomberg como sinal interno (mantido)
- ADR-004 — compliance via guardrails técnicos (mantido)
- Migration Supabase `blog_categories_news_pivot` aplicada em 2026-04-29 (8 categorias do blog)
- Schema Supabase `BlogPost` em [src/app/lib/blog.ts:22-37](../../src/app/lib/blog.ts) — fonte de verdade para o pipeline pós-pivot
