# Módulo: seo-sitemap

> Geração dinâmica de `sitemap.xml` + `robots.txt` + JSON-LD (Organization + LocalBusiness). Estratégia: indexar institucional + blog + materiais; **excluir** admin, APIs e campanhas (`/diagnostico-gratuito`, `/calculadora-tributacao-dividendos-2026`).

## §1 Escopo

- `src/app/sitemap.ts` — dinâmico, lê `BlogPost` + `Material` publicados do Supabase.
- `src/app/robots.ts` — estático, disallow `/admin/`, `/api/`, `/_next/`, `/static/`.
- `src/lib/schema.ts` — `getOrganizationSchema`, `getLocalBusinessSchema` (JSON-LD).
- `src/components/JsonLd.tsx` — componente que injeta JSON-LD no `<head>` (chamado pelo `layout.tsx:7-8`).
- `src/components/Analytics.tsx` — Meta Pixel + Google Analytics (se aplicável).
- Pages com `metadata.robots: noindex` explícito: `/calculadora-tributacao-dividendos-2026/page.tsx:8-13`, `/diagnostico-gratuito/page.tsx:8-11`.

**Guia operacional vivo:** `docs/wiki/runbooks/seo-visibilidade.md`. **Histórico (Janeiro 2025):** `docs/_archive/relatorio-seo-otimizacao-2025-01.md`.

## §2 Fluxos principais

### 2.1 Sitemap
1. Build/runtime chama `sitemap()` em `src/app/sitemap.ts:4`.
2. `siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ldccapital.com.br"`.
3. Monta `staticPages: MetadataRoute.Sitemap` com 10 URLs fixas + priorities/changeFrequency (`sitemap.ts:8-69`).
4. `createSupabaseAdminClient()` → query `BlogPost.select("slug, updatedAt, publishedAt, published")` ordenado por `updatedAt desc`.
5. Filtra `post.published === true` → mapeia para `/blog/${slug}` com `priority: 0.7`, `changeFrequency: monthly`.
6. Repete o padrão para `Material` → `/materiais/${slug}` com `priority: 0.6`.
7. Retorna `[...staticPages, ...blogPages, ...materialPages]`.
8. Em erro Supabase → fallback `staticPages` apenas (log no console).

**Páginas fora do sitemap (proposital — todas landings de campanha):**
- `/calculadora-tributacao-dividendos-2026` — campanha (`noindex`).
- `/diagnostico-gratuito` — campanha (`noindex`).
- `/guia` + `/guia-pdf` — landing privada não-indexada.
- `/ebook-investimentos-internacionais` — landing de campanha; fora do sitemap proposital.
- Todas as rotas `/admin/*` e `/api/*` (disallow via `robots.ts`).

**Política de cache:** `sitemap.ts` não declara `revalidate` nem `force-dynamic`. Por causa do `createSupabaseAdminClient()`, Next.js trata como dynamic — **regenerado a cada hit**. Backlog TODO §2 classe B: "Adicionar `export const revalidate = 3600` em `sitemap.ts` (cache 1h reduz custo Supabase em crawls)".

### 2.2 Robots
- `userAgent: "*"` → `allow: "/"` exceto disallow para `/admin/`, `/api/`, `/_next/`, `/static/`.
- Aponta para `${baseUrl}/sitemap.xml`.

### 2.3 JSON-LD
- `getOrganizationSchema()` — schema "Organization" (LDC Capital + CVM 3976-4 + endereço + redes sociais).
- `getLocalBusinessSchema()` — schema "LocalBusiness" para SEO local.
- Ambos injetados via `JsonLd` no `layout.tsx`.

## §3 Tabelas / Storage

- Sitemap lê: `BlogPost` (slug, updatedAt, publishedAt, published) + `Material` (slug, updatedAt, publishedAt, published).
- Sem storage próprio.

## §4 Env vars e dependências externas

- `NEXT_PUBLIC_SITE_URL` (default `https://ldccapital.com.br`).
- Supabase service role (via `createSupabaseAdminClient` no `sitemap.ts`).
- `[VERIFICAR]` se `NEXT_PUBLIC_META_PIXEL_ID` afeta também (provavelmente só `Analytics.tsx`).

## §5 Riscos e classe típica de mudança

- Ajuste de schema JSON-LD → **B**.
- Adicionar/remover páginas do sitemap → **B**.
- Mudar `robots.ts` (disallow/allow) → **B** com cuidado: erro pode des-indexar o site inteiro.
- Mudar política de indexação (campanha sair de `noindex`) → **C** (compliance + estratégia).
- Anti-SPEC §6.3 — disclaimer literal só em editorial. JSON-LD não deve "exibir" disclaimer (não é o canal).

## §6 ADRs e referências

- Nenhum ADR. Candidato futuro: ADR sobre política de indexação de páginas de campanha.
- Documentação operacional viva:
  - `docs/wiki/runbooks/seo-visibilidade.md` — guia de visibilidade SEO (GA4 + Pixel + LGPD + Schema + sitemap).
- Histórico (snapshots datados):
  - `docs/_archive/relatorio-seo-otimizacao-2025-01.md` — relatório de otimização (Janeiro 2025).
  - `docs/_archive/database-optimizations-2025-10.md` — intervenção de perf em queries (Outubro 2025; auto-fields aplicados).

## §7 Runbooks relacionados

- `docs/wiki/runbooks/sitemap-debug.md` (a criar) — diagnosticar páginas faltando no sitemap (publish status, RLS, cache).
- `docs/wiki/runbooks/jsonld-validate.md` (a criar) — validar com Google Rich Results Test após mudança de schema.

## §8 Pontos de atenção atuais

- **Sitemap depende de leitura Supabase em runtime** — falha de DB causa fallback para `staticPages` apenas (perde blog + materiais).
- **Sem revalidação declarada** — sitemap regenerado a cada request. Backlog TODO §2 classe B para adicionar `revalidate: 3600`.
- **`/ebook-investimentos-internacionais` fora do sitemap** — intencional (landing de campanha).
- **JSON-LD pode citar "Bloomberg"** indiretamente via descrição de serviços — Anti-SPEC §6.2b. `[VERIFICAR]` `getOrganizationSchema()` em `src/lib/schema.ts` confirma não citação.
- **Páginas legacy (`/news`)** — pós-pivot ADR-005, blog é canal único. Backlog TODO §2 classe A: "Verificar Google Search Console por URLs `/news/*` indexadas; garantir 301 ou removal request".
