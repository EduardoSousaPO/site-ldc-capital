# Feature Contract — F-019 Gerador de carrossel Instagram/LinkedIn

> Contrato operacional. Classe **B** — UI nova + integração IA + persistência (Supabase Storage). Sem mudança em compliance engine.

---

## Identificação

- **ID:** F-019
- **Nome:** Gerador de carrossel Instagram/LinkedIn (estilo Mullen + Breia + Nousi)
- **Risco:** **B**
- **Cobre:** RF-019, CA-031..CA-038, ADR-005 (reaproveitamento de conteúdo pós-pivot), Anti-SPEC §6.1, §6.2 (sagrada), §6.2b (sagrada), §6.3
- **Branch:** `feat/F-019-carousel-generator`
- **Base:** `master` @ commit `0041a62` (smoke #5 F-016b Supabase Storage migration mergeado)
- **Data:** 2026-05-09

---

## Objetivo

Permitir que Eduardo gere — em um clique a partir de `/admin/posts/edit/[id]` — um ZIP com PNGs prontos para postar no Instagram (1080×1350) e LinkedIn (1080×1080), reaproveitando o conteúdo de um `BlogPost` aprovado por Marcos. Substitui Mailchimp weekly digest e Telegram bot (descontinuados no pivot 2026-04-29).

**Distribuição NÃO automatizada** — Eduardo posta manualmente, respeitando Anti-SPEC §6.1.

---

## Definition of Ready (DoR)

- [x] RF-019 e CAs explícitos na SPEC §1, §4 (CA-031..CA-038)
- [x] ADR-005 (pivot) documenta o escopo de reaproveitamento
- [x] Compliance engine F-005 frozen e reusável via `runComplianceCheck()` (engine não-modificável)
- [x] Stack IA travada (OpenAI gpt-5-mini), proibido Anthropic SDK (memória `feedback_no_anthropic_sdk`)
- [x] Memória `feedback_openai_structured_outputs` lida (schema relaxado + re-validação strict)
- [x] Memória `feedback_supabase_js_multi_table` lida (cliente untyped quando necessário)
- [x] BlogPost CRUD + aprovação token-based já em produção (F-018)
- [x] `supabase-storage-admin.ts` já existe e funcional (smoke #5 F-016b)
- [x] Fontes IvyMode + Public Sans em `src/fonts/` (uso decidido pelo Eduardo)
- [x] Paleta confirmada: dark `#262d3d`, light `#FFFFFF`, accent `#98ab44`, hairline `#344645`
- [x] BlogPost real disponível para smoke: `5a157c14-b06b-4e85-8312-13942b88b914`
- [ ] **Pré-requisito:** migration `create_blog_carousels_bucket_and_runs_table` aplicada via `mcp__supabase__apply_migration`
- [ ] **Pré-requisito:** `npm install jszip` (autorizado por Eduardo no plano)

---

## Critérios de aceite

- **CA-031** Botão "Gerar carrossel" só renderiza/habilita se `BlogPost.published=true`. Em rascunhos: disabled com tooltip "Aprove o artigo antes de gerar carrossel".
- **CA-032** OpenAI gpt-5-mini com Structured Outputs (`zodResponseFormat` schema relaxado) retorna 5-7 slides. Re-validação com `CarouselScriptStrict` é obrigatória.
- **CA-033** `runComplianceCheck()` aplicado a cada slide e a ambas as captions; HARD-block aborta tudo, retorna 422 + grava `carousel_runs.status='compliance_blocked'`.
- **CA-034** `@vercel/og` renderiza PNG nos 2 formatos sem erro, com IvyMode + Public Sans carregadas via `fs.readFileSync`.
- **CA-035** ZIP contém `instagram/slide-N.png`, `linkedin/slide-N.png`, `caption-instagram.md`, `caption-linkedin.md`, `README.md`.
- **CA-036** Bucket `blog-carousels` é privado; signed URL expira em 24h.
- **CA-037** Custo ≤R$0,05 logado em `carousel_runs.openai_cost_brl`. Rate limit ≤10/dia/user via SELECT em `carousel_runs` → 429 quando atingido.
- **CA-038** Anti-SPEC §6.2b: regex `/bloomberg/i` em slides + captions + hashtags. Match → bloqueia geração inteira.

---

## Escopo incluído

### Contratos Zod (`src/features/news/contracts/carousel.ts`)

```ts
// Schema relaxado para zodResponseFormat (sem .url/.uuid/.optional)
export const CarouselScript = z.object({
  blog_post_id: z.string(),       // re-validado strict downstream com .uuid()
  blog_post_slug: z.string(),
  generated_at: z.string(),       // re-validado strict com .datetime()
  prompt_version: z.literal("blog-carousel-v1.0-2026-05-09"),
  slides: z.array(CarouselSlide).min(5).max(7),
  caption_instagram: z.string().max(2200),
  caption_linkedin: z.string().max(3000),
  hashtags: z.array(z.string()).min(3).max(8),
});

export const CarouselScriptStrict = /* mesmo, mas com .url/.uuid/.datetime */;
```

### Prompt (`src/features/news/carousel/prompt.ts`)

`BLOG_CAROUSEL_SYSTEM_PROMPT_v1.0` — fingerprint imutável `blog-carousel-v1.0-2026-05-09`. Tom Mullen + Breia + Nousi consistente com `system-prompt v2.1` do artigo. Few-shot com 1-2 exemplos. Regras Anti-SPEC explícitas (§6.2 e §6.2b). NÃO modifica `system-prompt.ts` existente (frozen).

### Generator (`src/features/news/carousel/generator.ts`)

`generateCarousel(blogPostId, generatedByUserId): Promise<CarouselGenerationResult>`:

1. Busca BlogPost via `blogpost-db` (reuso da `findExistingArticleBySlug` + cliente untyped)
2. Chama OpenAI `chat.completions.create` com `zodResponseFormat(CarouselScript)`
3. Re-valida com `CarouselScriptStrict.parse()`
4. Aplica `runComplianceCheck()` em cada slide (mapeando para `ComplianceCheckInput`) e em `caption_instagram`/`caption_linkedin`
5. Regex `/bloomberg/i` em slides + captions + hashtags (defense in depth §6.2b)
6. Em caso de bloqueio: INSERT `carousel_runs` com `status='compliance_blocked'` + lança `ComplianceBlockedError` com violations
7. Renderiza 2 formatos × N slides via `render.ts`
8. Empacota via `zip.ts`
9. Upload em `supabase-storage-admin` bucket `blog-carousels`, pathname `{slug}-carousel-{ts}.zip`
10. `createSignedUrl(pathname, 60*60*24)`
11. INSERT `carousel_runs` (`status='success'`, custo, duração)
12. Retorna `{ signedUrl, expiresAt, slides: [{ index, type, title }], carouselRunId, costBrl }`

### Render (`src/features/news/carousel/render.ts`)

```ts
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

const ivyModeBold = fs.readFileSync(path.join(process.cwd(), "src/fonts/IvyMode-Bold.otf"));
const publicSansRegular = fs.readFileSync(path.join(process.cwd(), "src/fonts/PublicSans-Regular.ttf"));

export async function renderSlide(slide, index, total, format): Promise<Buffer> {
  const dimensions = format === "instagram" ? { width: 1080, height: 1350 } : { width: 1080, height: 1080 };
  const response = new ImageResponse(<Template ... />, {
    ...dimensions,
    fonts: [
      { name: "IvyMode", data: ivyModeBold, weight: 700, style: "normal" },
      { name: "PublicSans", data: publicSansRegular, weight: 400, style: "normal" },
    ],
  });
  return Buffer.from(await response.arrayBuffer());
}
```

### Templates (`src/features/news/carousel/templates/*.tsx`)

- **`SlideHook.tsx`** — slide 1, fundo `#262d3d`, título IvyMode Bold 64-80px, hairline `#98ab44` 3px no topo
- **`SlideContent.tsx`** — `contexto`/`dado`/`prova`, fundo `#FFFFFF`, hairline `#344645` 1px, body Public Sans 32-40px, accent `#98ab44` em destaques
- **`SlideQuestion.tsx`** — `pergunta`, fundo `#262d3d`, IvyMode italic 56px, accent verde-oliva
- **`SlideCTA.tsx`** — slide final, logo LDC + footer compliance fixo: "LDC Capital · CVM 3976-4 · Conteúdo educacional. Não constitui recomendação de investimento."

Comum a todos: numeração "X/N" canto superior direito (Public Sans Bold 22px, opacidade 60%). Sem charts/imagens externas no MVP.

### Zip (`src/features/news/carousel/zip.ts`)

```ts
export async function packCarouselZip(payload: {
  slug: string;
  ts: string;
  instagram: Buffer[];
  linkedin: Buffer[];
  captionInstagram: string;
  captionLinkedin: string;
}): Promise<{ filename: string; buffer: Buffer }> {
  const zip = new JSZip();
  payload.instagram.forEach((b, i) => zip.file(`instagram/slide-${i + 1}.png`, b));
  payload.linkedin.forEach((b, i) => zip.file(`linkedin/slide-${i + 1}.png`, b));
  zip.file("caption-instagram.md", payload.captionInstagram);
  zip.file("caption-linkedin.md", payload.captionLinkedin);
  zip.file("README.md", README_TEMPLATE);
  return { filename: `${payload.slug}-carousel-${payload.ts}.zip`, buffer: await zip.generateAsync({ type: "nodebuffer" }) };
}
```

### Route (`src/app/api/admin/posts/[id]/carousel/route.ts`)

POST. `checkAdminAuth()` → 401. Lê BlogPost; se `published=false` → 409. Rate limit:
```sql
SELECT COUNT(*) FROM carousel_runs
WHERE generated_by_user_id = $1 AND generated_at > NOW() - INTERVAL '24 hours' AND status = 'success';
```
≥10 → 429. Chama `generateCarousel()`. `maxDuration=300`.

### UI

- `CarouselButton.tsx` (Client) — botão verde-oliva no header de `/admin/posts/edit/[id]`. Disabled se `!post.published` com tooltip. Click → spinner → POST.
- `CarouselPreviewModal.tsx` (Client) — modal com grid de slides preview (thumb por type), botão "Baixar ZIP" (signed URL), "Copiar caption Instagram", "Copiar caption LinkedIn". Toast vermelho com violations se 422.
- Edit em `src/app/admin/posts/edit/[id]/page.tsx` — adicionar `<CarouselButton />` no header, ao lado dos botões "Salvar" / "Excluir".

### Cleanup cron (`src/app/api/admin/blog-carousels/cleanup/route.ts`)

Análogo a `/api/admin/bloomberg-pdfs/cleanup` mas com `supabase-storage-admin` bucket `blog-carousels`. Auth `CRON_SECRET` timing-safe. Lista zips, deleta `created_at < NOW() - 90d`. Log estruturado `blog_carousels_cleanup_run`.

`vercel.json`: `{ path: "/api/admin/blog-carousels/cleanup", schedule: "0 5 * * *" }` (05h UTC, fora dos horários do pipeline 10/17h, cleanup tokens 03h e cleanup PDFs 04h).

---

## Escopo excluído

- **NÃO** automação de postagem (Anti-SPEC §6.1)
- **NÃO** charts/tabelas/imagens externas nos slides no MVP
- **NÃO** edição inline dos slides — geração é one-shot, rate limit cobre
- **NÃO** versão em inglês (Anti-SPEC §6.1)
- **NÃO** integração com Buffer/Hootsuite
- **NÃO** modificação do `system-prompt.ts` v2.1 do artigo (frozen)
- **NÃO** modificação da `compliance/checker.ts` engine (frozen — só CONSOME)

---

## Arquivos

### Que podem ser alterados

- `src/features/news/contracts/carousel.ts` (NOVO)
- `src/features/news/carousel/**/*` (NOVOS — prompt, generator, render, zip, templates)
- `src/app/api/admin/posts/[id]/carousel/**/*` (NOVOS)
- `src/app/api/admin/blog-carousels/cleanup/**/*` (NOVOS)
- `src/app/admin/posts/edit/[id]/CarouselButton.tsx` (NOVO)
- `src/app/admin/posts/edit/[id]/CarouselPreviewModal.tsx` (NOVO)
- `src/app/admin/posts/edit/[id]/page.tsx` (ALTERADO — adicionar CarouselButton no header)
- `vercel.json` (ALTERADO — 5º cron)
- `package.json` + `package-lock.json` (jszip)
- `docs/news/TODO.md` + `docs/news/SPEC.md` (este e o feature contract)

### Que NÃO podem ser alterados sem pausa

- `src/features/news/contracts/{compliance,perplexity,pipeline,telemetry,openai,approval}.ts` — frozen
- `src/features/news/compliance/*` — engine F-005, só CONSOME
- `src/features/news/prompts/system-prompt.ts` — v2.1 do artigo, frozen
- `src/features/news/pipeline/blogpost-db.ts` — reaproveita helpers, mas sem modificar
- `src/lib/supabase-storage-admin.ts` — helper smoke #5, frozen
- `src/middleware.ts` — auth admin já cobre
- Anti-SPEC §6 da SPEC — sagrada

---

## Contratos

- [ ] Criar `src/features/news/contracts/carousel.ts` — `SlideType`, `CarouselSlide`, `CarouselScript` (relaxed) + `CarouselScriptStrict` (re-validation)
- [ ] Atualizar `src/features/news/contracts/index.ts` para re-exportar os novos types se necessário
- [x] **NÃO criar contrato novo fora de `carousel.ts`** — qualquer outro contrato exige reabertura da FASE 4

---

## Testes obrigatórios (Classe B — N1, ≥8 testes)

| Teste | Tipo | Cobre CA | Arquivo |
|---|---|---|---|
| CarouselButton renderiza disabled em draft, enabled em published | unit (RTL) | CA-031 | `src/app/admin/posts/edit/[id]/__tests__/CarouselButton.test.tsx` |
| OpenAI mock retorna 5-7 slides + schema strict valida | integration (mock) | CA-032 | `src/features/news/carousel/__tests__/generator.test.ts` |
| ticker em slide.body bloqueia + grava `status='compliance_blocked'` | integration | CA-033 | `src/features/news/carousel/__tests__/compliance.test.ts` |
| render retorna Buffer PNG nos 2 formatos | unit (mock ImageResponse) | CA-034 | `src/features/news/carousel/__tests__/render.test.ts` |
| zip contém estrutura correta (instagram/, linkedin/, captions, README) | unit | CA-035 | `src/features/news/carousel/__tests__/zip.test.ts` |
| route POST retorna signed URL com expiresAt 24h adiante | integration (mock storage) | CA-036 | `src/app/api/admin/posts/[id]/carousel/__tests__/route.test.ts` |
| custo BRL ≤ 0.05 logado + 429 quando ≥10/dia | integration | CA-037 | idem |
| **negativo:** "Bloomberg" em caption-instagram bloqueia geração | integration | CA-038 / §6.2b | `src/features/news/carousel/__tests__/compliance.test.ts` |
| **negativo:** route 401 sem auth admin | integration | RNF-007 | `src/app/api/admin/posts/[id]/carousel/__tests__/route.test.ts` |
| **negativo:** route 409 quando BlogPost.published=false | integration | CA-031 | idem |

Total esperado: ≥10 testes. Acima do mínimo de ≥8.

---

## Comandos obrigatórios (CI N1)

- `npm run lint` — zero erros nos arquivos novos
- `npm run typecheck` — verde
- `npm test` — todos passando (107 anteriores + ≥10 novos)
- `npm run build` — verde, novos endpoints registrados

---

## Infra / Produção

- **Migration necessária?** Sim — `create_blog_carousels_bucket_and_runs_table` (bucket privado + tabela com FKs CASCADE em `BlogPost(id)` e ON DELETE CASCADE; FK em `auth.users(id)` para `generated_by_user_id`).
- **Migration destrutiva?** Não. Tabela e bucket novos.
- **Cursor Agent via MCP?** Sim — `mcp__supabase__apply_migration` autorizado por Eduardo.
- **Env vars novas:** nenhuma. Reutiliza `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `CRON_SECRET`.
- **Staging obrigatório?** Smoke local com `BlogPost id=5a157c14-b06b-4e85-8312-13942b88b914` antes de PR. Smoke produção opcional após merge.
- **Feature flag?** Não — feature é opt-in pelo botão; sem cron disparando geração automática.
- **Rollback plan (≤5 linhas):**
  1. `git revert <SHA>` na branch após merge — feature isolada, sem side effects de cron.
  2. `DROP TABLE carousel_runs;` (CASCADE não afeta BlogPost).
  3. Bucket `blog-carousels`: deletar via MCP `mcp__supabase__execute_sql` se necessário.
  4. Sem rollback de envs.

---

## Evidência esperada (Matriz de Validação)

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-031 | `CarouselButton.test.tsx::disabled_when_draft` | unit | — | — |
| CA-032 | `generator.test.ts::strict_validation_passes` | integration | — | — |
| CA-033 | `compliance.test.ts::ticker_blocks_generation` | integration | — | — |
| CA-034 | `render.test.ts::renders_both_formats` | unit | — | — |
| CA-035 | `zip.test.ts::full_structure` | unit | — | — |
| CA-036 | `route.test.ts::signed_url_24h` | integration | — | — |
| CA-037 | `route.test.ts::cost_logged_and_rate_limit` | integration | — | — |
| CA-038 | `compliance.test.ts::bloomberg_in_caption_blocks` | integration | — | — |
| Smoke | `BlogPost id=5a157c14-...` gerar carrossel + abrir ZIP | manual | — | screenshots dos 2 formatos + carousel_runs row |

---

## Anti-SPEC — checagem específica para F-019

- [ ] §6.1 — feature NÃO posta em IG/LinkedIn; ZIP é entregue para postagem manual
- [ ] §6.2 — `runComplianceCheck()` aplicado a cada slide + ambas captions (verificado em CA-033)
- [ ] §6.2b — regex `/bloomberg/i` cobre slides + captions + hashtags (verificado em CA-038)
- [ ] §6.3 — sem Anthropic SDK (verificado por grep no PR); rate limit server-side; sem polling
- [ ] §6.3 — schema relaxado + re-validação strict (memória `feedback_openai_structured_outputs`)
- [ ] §6.4 — sem chat widget; ZIP é fluxo síncrono request/response

---

## Gate de autonomia

**Pode prosseguir** automaticamente em:

- `src/features/news/contracts/carousel.ts`, `src/features/news/carousel/**/*` (todos novos)
- `src/app/api/admin/posts/[id]/carousel/**/*` e `src/app/api/admin/blog-carousels/**/*` (todos novos)
- `src/app/admin/posts/edit/[id]/Carousel*.tsx` (novos)
- `src/app/admin/posts/edit/[id]/page.tsx` — apenas adicionar `<CarouselButton />` no header
- `vercel.json` — adicionar 5º cron
- `package.json`/`package-lock.json` — apenas `jszip` (autorizado)

**Pause OBRIGATÓRIA antes de:**

- Aplicar migration via MCP (autorizado por Eduardo, mas confirmar antes de executar)
- Modificar contracts frozen (`compliance.ts`, `pipeline.ts`, `perplexity.ts`, `telemetry.ts`, `openai.ts`, `approval.ts`)
- Modificar `system-prompt.ts` v2.1 do artigo
- Modificar `compliance/checker.ts` engine F-005
- Modificar `supabase-storage-admin.ts`
- Adicionar dep nova além de `jszip` (precisa autorização explícita)

---

## Resultado final

- **Status:** em execução (Fase 1 — docs)
- **PR:** —
- **SHA:** —
- **Data de merge:** —
- **Evidência consolidada:** —

---

*F-019 fecha o arco de reaproveitamento da feature `/blog`. Após o merge, o pipeline LDC News tem o ciclo completo: PDF Bloomberg → artigo denso → aprovação Marcos → carrossel IG/LinkedIn → distribuição manual. Próximas iterações pós-go-live podem incluir charts embutidos, edição de slides na UI e templates alternativos. Tudo entra em ADRs novos.*
