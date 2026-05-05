# ADR-002 — Persistência via MDX commitado no repo + GitHub API (em vez de Supabase)

- **Status:** **SUBSTITUÍDO POR ADR-005** em 2026-04-29 (pivot Brevidade Inteligente → Artigo denso no blog Supabase)
- **Data original:** 2026-04-27
- **Autor:** Eduardo Sousa (decisão), formalizado por Claude no fluxo SDD-avancado
- **Substituído por:** [ADR-005](./ADR-005-pivot-brevidade-para-artigo-denso-blog.md)
- **Razão da substituição:** após reunião com Marcos (sócio operacional LDC) em 2026-04-29, decidiu-se pivotar de `/news` (Brevidade Inteligente em MDX commitado) para `/blog` (artigo denso em Supabase BlogPost). Sem MDX, sem commit GitHub, sem Octokit, sem rebuild Vercel a cada publicação. Trabalho de F-008 que dependia desta decisão (publish-github.ts, draft-storage.ts, news_publications) foi descartado e está fora do escopo pós-pivot. Ver ADR-005 para detalhes completos.

---

> **NOTA HISTÓRICA:** o conteúdo abaixo descreve a decisão arquitetural que prevaleceu de 2026-04-27 a 2026-04-29 (formato Brevidade Inteligente + persistência MDX). Mantido para auditoria. Para a arquitetura vigente (post-2026-04-29), consulte ADR-005 e a SPEC vigente.

---

## Contexto

O sistema precisa persistir briefings publicados de forma que:
- Seja **versionável** (ver evolução, reverter se necessário)
- Seja **rápido para servir** (LCP < 2,5s, RNF-001)
- **Suporte ISR (Incremental Static Regeneration) do Next.js**
- Permita **edit/aprovação manual pelo Eduardo** sem fricção
- Seja **auditável para compliance CVM**

O projeto já tem dois padrões em uso para conteúdo:
1. **MDX commitado no repo** (`content/blog/*.mdx`) — usado por `/blog`
2. **Supabase** (tabelas `posts`, `materials`) — usado pelo admin de marketing

Os dois padrões são válidos. Era preciso escolher um para `/news`.

## Decisão

**Persistir briefings publicados como arquivos `.mdx` em `content/news/YYYY-MM-DD-{slug}.mdx`, commitados no repo via GitHub API (Octokit + PAT).** Vercel detecta o commit e dispara rebuild ISR. Drafts (estado `pending_review` ou `blocked_compliance`) ficam em `content/news/_drafts/` (ignorado pelo build de produção via padrão no `.gitignore` do conteúdo de draft).

Telemetria (views, shares, conversions) — essa sim — fica em **Supabase** (tabelas `news_events`, `news_pipeline_runs`, `news_pipeline_errors`).

## Alternativas consideradas

- **A — Supabase como single source of truth (briefings em tabela `news_briefings`):**
  - Prós: commit não bloqueia publicação (latência menor); admin já tem padrão Supabase; índices e queries fáceis.
  - Contras: rebuild ISR precisa de webhook adicional; sem versionamento git nativo (precisaria implementar versionamento na tabela); reverter um briefing publicado vira operação SQL (frágil); telemetria e conteúdo se misturam.
  - **Por que não:** versionamento git é "de graça" para conteúdo editorial. O custo de implementar versionamento equivalente em Supabase é alto.

- **B — Notion / Sanity / Contentful como CMS externo:**
  - Prós: editor visual mais rico; aprovação multi-pessoa nativa.
  - Contras: novo vendor + custo recorrente; pipeline de IA precisa POST para CMS externo (latência); fora da arquitetura do projeto.
  - **Por que não:** Eduardo explicitamente pediu "mais simples possível e eficaz". Adicionar CMS externo viola simplicidade.

- **C — Híbrido: rascunho em Supabase, publicação cria MDX no repo:**
  - Prós: drafts não poluem o repo; publicação ainda tem versionamento git.
  - Contras: dobra a superfície (dois shapes para manter sincronizados); contratos Zod precisam representar ambos estados.
  - **Por que não:** complexidade extra para benefício marginal. A solução adotada (drafts em `content/news/_drafts/` ignorado pelo build) entrega o mesmo benefício sem dobrar a stack.

## Consequências

### Positivas
- **Versionamento gratuito:** `git log content/news/2026-04-27-fed-corta-juros.mdx` mostra histórico completo de edições.
- **Rebuild ISR Vercel é incremental** — apenas a página do briefing novo + o índice `/news` revalidam, custo de build próximo de zero.
- **Reverter um briefing publicado é `git revert`** — operação familiar, rastreável.
- **Padrão consistente com `/blog`** — Eduardo já entende o modelo mental.
- **Conteúdo pode ser editado em qualquer editor MDX** — `@uiw/react-md-editor` já está instalado.
- **Auditoria CVM:** commit tem autor, data, mensagem; histórico imutável.

### Negativas / trade-offs
- **Latência de publicação:** commit GitHub + rebuild ISR pode levar até 60s da aprovação até a página pública (CA-019). Mitigação: aceitável dado o uso (não é breaking news em segundos).
- **Dependência de PAT GitHub** com permissão `repo`. Mitigação: rotação trimestral; secret separado para CI vs produção.
- **Race condition** se duas publicações acontecerem ao mesmo tempo (improvável com 1 admin). Mitigação: GitHub API serializa commits no mesmo branch; conflito resolvido com retry (CB-005).
- **PRs do Dependabot e similares mexerão em `content/news/`** — improvável, mas se acontecer, regra `path` no PR template exclui esse diretório.

### Neutras
- Novas env vars: `GITHUB_PAT` (com escopo `repo` no monorepo do site).
- `next.config.ts` precisa permitir MDX em `content/news/` — mesmo padrão do `content/blog/` existente.
- Schema `BriefingFrontmatter` já está no contrato (`src/features/news/contracts/briefing.ts`) e cobre todos os campos persistidos.

## Referências

- SPEC `docs/news/SPEC.md` §0 D-05, RF-010, CA-021, CA-022, CB-005
- CONTRACTS `docs/news/CONTRACTS.md` §1 (BriefingFrontmatter), §7 (CommitRequest)
- Padrão precedente: [content/blog/](../../../content/blog/), [src/app/blog/[slug]/](../../../src/app/blog/[slug]/)
