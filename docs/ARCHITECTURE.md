# Arquitetura do Projeto — LDC Capital

## Visão Geral

Site institucional + suite de ferramentas financeiras para a LDC Capital (CVM 3976-4), gestora UHNW.

**URL de produção:** https://www.ldccapital.com.br

---

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 15.5.3 |
| Linguagem | TypeScript | 5 |
| Estilização | Tailwind CSS v4 | 4 |
| Componentes UI | shadcn/ui + Radix UI | — |
| Banco de dados | Supabase (PostgreSQL) | — |
| Autenticação | Supabase Auth | — |
| Formulários | React Hook Form + Zod | — |
| Gráficos | Recharts | 2.12.7 |
| Carrossel | Embla Carousel | — |
| Conteúdo MDX | next-mdx-remote + gray-matter | — |
| Email | Resend | — |
| Planilhas | Google Sheets API | — |
| IA (news pipeline) | OpenAI SDK + Perplexity | — |
| Testes | Vitest | — |

**ADR-001:** Não usar Anthropic SDK. Stack de IA travada em OpenAI + Perplexity.

---

## Estrutura de Diretórios

```
site-ldc/                          ← repo git (working dir real)
└── site-ldc/                      ← projeto Next.js
    ├── src/
    │   ├── app/                   ← rotas (Next.js App Router)
    │   │   ├── (páginas)          ← ver seção Rotas abaixo
    │   │   ├── api/               ← Route Handlers (API endpoints)
    │   │   ├── components/        ← componentes específicos de app
    │   │   ├── lib/               ← utilitários de conteúdo (blog, mdx, faq...)
    │   │   ├── layout.tsx         ← layout raiz com Header, Footer, providers
    │   │   ├── globals.css        ← estilos globais + design tokens
    │   │   ├── sitemap.ts         ← sitemap dinâmico
    │   │   └── robots.ts          ← robots.txt dinâmico
    │   ├── components/            ← componentes reutilizáveis (ver COMPONENTS.md)
    │   ├── features/              ← lógica de features complexas
    │   │   └── news/              ← pipeline de news/carrossel com IA
    │   ├── lib/                   ← utilitários transversais
    │   ├── types/                 ← tipos TypeScript globais
    │   ├── hooks/                 ← React hooks customizados
    │   ├── fonts/                 ← configuração de fontes (next/font)
    │   └── middleware.ts          ← proteção de rotas (Supabase auth)
    ├── content/
    │   ├── blog/                  ← posts em MDX (arquivo)
    │   └── materiais/             ← materiais em MDX (arquivo)
    ├── public/                    ← assets estáticos (ver ASSETS.md)
    ├── docs/                      ← documentação interna
    ├── scripts/                   ← scripts de setup, seed, testes
    ├── supabase/                  ← migrações SQL
    └── [configs]                  ← next.config.ts, tailwind, tsconfig...
```

**Nota:** O repo git raiz (`site-ldc/`) contém o projeto em `site-ldc/site-ldc/`. O diretório de trabalho do Claude deve sempre apontar para `site-ldc/site-ldc/`.

---

## Rotas do Site

### Páginas Institucionais

| Rota | Arquivo | Descrição |
|---|---|---|
| `/` | `app/page.tsx` | Home — Hero, ServiçosGrid, Depoimentos, FAQ, CTA |
| `/consultoria` | `app/consultoria/` | Metodologia e diferenciais |
| `/equipe` | `app/equipe/` | Grid da equipe com fotos e bios |
| `/contato` | `app/contato/` | Formulário + informações de contato |
| `/trabalhe-conosco` | `app/trabalhe-conosco/` | Página de carreiras/vagas |
| `/informacoes-regulatorias` | `app/informacoes-regulatorias/` | Documentos regulatórios CVM |
| `/politica-privacidade` | `app/politica-privacidade/` | Política de Privacidade (LGPD) |
| `/termos-de-uso` | `app/termos-de-uso/` | Termos de Uso |

### Conteúdo / Blog

| Rota | Arquivo | Descrição |
|---|---|---|
| `/blog` | `app/blog/` | Listagem de posts com busca e categorias |
| `/blog/[slug]` | `app/blog/[slug]/` | Post individual (MDX) |
| `/materiais` | `app/materiais/` | Listagem de e-books e guias |
| `/materiais/[slug]` | `app/materiais/[slug]/` | Material individual com download |

### Ferramentas Financeiras

| Rota | Arquivo | Descrição |
|---|---|---|
| `/wealth-planning` | `app/wealth-planning/` | Planejamento patrimonial (formulário wizard + PDF) |
| `/wealth-planning/admin` | `app/wealth-planning/admin/` | Painel admin — CRUD de clientes e cenários |
| `/pgbl-simulator` | `app/pgbl-simulator/` | Simulador de previdência PGBL |
| `/calculadora-tributacao-dividendos-2026` | `app/calculadora-tributacao-dividendos-2026/` | Calculadora de tributação de dividendos |

### Landing Pages / Lead Capture

| Rota | Arquivo | Descrição |
|---|---|---|
| `/ebook-investimentos-internacionais` | `app/ebook-investimentos-internacionais/` | Landing do e-book com captura de lead |
| `/diagnostico-gratuito` | `app/diagnostico-gratuito/` | Lead magnet — diagnóstico de carteira |

### Admin CMS

| Rota | Arquivo | Descrição |
|---|---|---|
| `/admin` | `app/admin/` | Painel administrativo (auth obrigatória) |
| `/admin/blog` | `app/admin/blog/` | CRUD de posts do blog |
| `/admin/materiais` | `app/admin/materiais/` | CRUD de materiais |

---

## Banco de Dados (Supabase)

### Tabelas principais

| Tabela | Propósito |
|---|---|
| `blog_posts` | Posts do blog (metadados; conteúdo em MDX no repo) |
| `materials` | Materiais para download |
| `wealth_planning_clients` | Clientes do wealth planning |
| `wealth_planning_scenarios` | Cenários e planos de cada cliente |
| `ebook_leads` | Leads capturados na landing do e-book |
| `admin_users` | Usuários com acesso ao painel admin |

Migrações em `supabase/`. Scripts de schema em `scripts/supabase-schema.sql`.

### Storage

- `uploads/covers/` — capas de blog e materiais
- `uploads/materials/` — PDFs dos materiais para download

---

## Autenticação

- **Provider:** Supabase Auth (email/senha)
- **Middleware:** `src/middleware.ts` protege rotas `/admin/*` e `/wealth-planning/admin`
- **Client helpers:** `src/lib/auth-supabase.ts`, `src/lib/auth-check.ts`, `src/lib/auth-server.ts`
- Clientes Supabase: `src/lib/supabase.ts` (client), `src/lib/supabase-server.ts` (server)

---

## Pipeline de News/Carrossel (Feature F-019)

Pasta: `src/features/news/`

Gera automaticamente carrosséis para Instagram com IA:
1. Perplexity busca notícias recentes
2. OpenAI processa e redige os slides
3. Compliance checker valida o texto (sem recomendações diretas)
4. Gerador de imagem cria os slides visuais com a identidade LDC
5. Cron job publica automaticamente (F-008)

ADRs relevantes: `docs/news/decisions/ADR-001` a `ADR-007`

---

## Integrações Externas

| Serviço | Uso | Configuração |
|---|---|---|
| Supabase | Banco de dados + Auth + Storage | `.env` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) |
| Resend | Envio de e-mails transacionais | `.env` (`RESEND_API_KEY`) |
| Google Sheets | CRM leve / registro de leads | `.env` (`GOOGLE_SHEETS_*`) |
| OpenAI | Pipeline de news (carrossel IA) | `.env` (`OPENAI_API_KEY`) |
| Perplexity | Busca de notícias para carrossel | `.env` (`PERPLEXITY_API_KEY`) |
| Google Gemini | Backup/alternativa de IA | `.env` (`GOOGLE_GEMINI_API_KEY`) — free tier: 20 req/dia |

**Bloomberg:** PDFs da Bloomberg são usados como sinal interno — nunca citados publicamente (ADR-003). Defense in depth obrigatório.

---

## Variáveis de Ambiente

Ver `.env.example` na raiz do projeto. Principais:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
GOOGLE_GEMINI_API_KEY=
GOOGLE_SHEETS_ID=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
NEXT_PUBLIC_SITE_URL=https://www.ldccapital.com.br
```

---

## Fluxo de Conteúdo

```
MDX em content/blog/      → processado por src/app/lib/mdx.ts
                          → renderizado em /blog/[slug]
                          → admin CMS em /admin/blog para criar/editar

Supabase Storage          → uploads de capas e PDFs via /admin
                          → servidos diretamente pelo storage público

Pipeline IA (news)        → cron job → Perplexity → OpenAI → Supabase
                          → carrossel gerado automaticamente
```

---

## Comandos Principais

```bash
npm run dev          # servidor local (porta 3000)
npm run build        # build de produção
npm run typecheck    # npx tsc --noEmit (sem build)
npm run lint         # ESLint
npm run test         # Vitest
```

---

## Decisões Arquiteturais (ADRs)

Ver `docs/news/decisions/` para os 7 ADRs do projeto:

- **ADR-001:** Stack IA — OpenAI + Perplexity (sem Anthropic SDK)
- **ADR-002:** Persistência de conteúdo via MDX + GitHub API
- **ADR-003:** Bloomberg como sinal interno apenas (não citar publicamente)
- **ADR-004:** Compliance via guardrails técnicos no pipeline
- **ADR-005:** Pivot de brevidade para artigo denso no blog
- **ADR-006:** Pivot carrossel X mock screenshot
- **ADR-007:** Estratégia de disclaimer de compliance
