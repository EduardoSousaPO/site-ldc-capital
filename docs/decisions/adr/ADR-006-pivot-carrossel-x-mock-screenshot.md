# ADR-006 — Pivot do formato carrossel: editorial → X.com mock screenshot

- **Status:** aceito
- **Data:** 2026-05-09
- **Autor:** Eduardo Sousa (decisão), formalizado por Claude no fluxo SDD-avancado
- **Substitui parcialmente:** RF-019 v1.0 (templates editoriais SlideHook/Content/Question/CTA — formato approved no batch #15 e descartado antes do PR)
- **Convive com:** ADR-001 (stack IA), ADR-003 (Bloomberg autoral), ADR-004 (compliance), ADR-005 (pivot artigo denso)

---

## Contexto

F-019 v1.0 entregou templates editoriais (hook, content, question, CTA) em IG portrait + LinkedIn square, com tipografia LDC (IvyMode + Public Sans) e paleta de marca (`#262d3d` / `#FFFFFF` / `#98ab44`). Smoke #15 batch foi aprovado: 5 PNGs Instagram + 1 LinkedIn hook validados visualmente, JSON real do BlogPost smoke #5 gerou 6 slides limpos com custo R$0,0398 e zero violações compliance.

Em **2026-05-09**, Eduardo revisitou referências visuais explícitas — Andrey Nousi (instagram.com/andreynousi) e Renato Breia (instagram.com/renatobreia) — e identificou que o formato dominante no nicho UHNW é distinto: **screenshots simulados de tweets do X (twitter.com)** com avatar circular, nome + ✓ verificado azul, handle, badge X.com top-right, body em PT-BR com **bold em palavras-chave**, e imagem AI editorial embedada apenas em slides selecionados (hook, dado, CTA).

A reunião explicitou que os templates editoriais v1.0, embora tipograficamente competentes, **não correspondem ao formato que ressoa com o público-alvo** (UHNW que consome conteúdo financeiro no padrão Nousi/Breia). Manter v1.0 em produção significaria entregar um carrossel que parece "report institucional", não "voz autoral analítica" — perdendo a janela competitiva.

## Decisão

**Pivotar 100% do formato visual** preservando toda a infra (route, ZIP, generator orchestration, UI, cleanup, tests). Reescrita completa de:

1. **Templates React:** os 4 arquivos (`SlideHook`, `SlideContent`, `SlideQuestion`, `SlideCTA`) são **substituídos por 1 único `SlideTweet.tsx`** que renderiza qualquer slide (hook/content/question/cta) no formato mock-tweet, parametrizado por `variation` (LDC institucional vs Luciano pessoal) e `hasImage` (presença de imagem AI hero).

2. **Schema Zod v2.0** — `slide.body` cap muda de 320 → **360 chars** (acomoda 3 parágrafos curtos como tweet); novo campo `slide.image_prompt` opcional (string ≤200 chars) que orienta DALL-E 3 nos slides 1, 3, 6; validação de bold markdown (máx 5 trechos `**xxx**` por slide).

3. **Prompt v2.0** — `BLOG_CAROUSEL_SYSTEM_PROMPT_v2.0` com fingerprint `blog-carousel-v2.0-2026-05-09`. Tom Mullen+Breia+Nousi mantido, **adaptado para sintaxe de tweet:** frases curtas, quebra de parágrafo com linha em branco, **bold inline** para números (`14,75%`) e marcas (`Morgan Stanley`).

4. **Geração de imagens AI** — novo módulo `image-gen.ts` chama OpenAI DALL-E 3 (`size:1792x1024`, `quality:standard`, `style:natural`) para slides 1/3/6. **Imagens são compartilhadas entre as 2 variações** (gera 3 imagens uma vez, reusa em LDC e Luciano). Defense in depth: regex Anti-SPEC §6.2b roda no `image_prompt` ANTES de chamar DALL-E; falha graciosa (3 retries) cai para slide text-only se DALL-E não responde.

5. **Duas variações por carrossel:**
   - **LDC** — avatar `ldc-capital.png`, displayName `LDC Capital`, handle `@ldc.capital`
   - **Luciano** — avatar `luciano-herzog.png`, displayName `Luciano Herzog`, handle `@luciano.herzog`
   - Conteúdo idêntico; só muda o header do mock-tweet
   - **Avatar LDC tem backdrop sutil `#1A2332`** atrás do círculo clipped (avatar tem alpha; sem backdrop, casco navy se mescla com bg X.com `#0F1419`)

6. **Estrutura do ZIP nova:** pastas `ldc/` e `luciano/` com 6 PNGs cada (12 totais), mais `caption-instagram.md`, `caption-linkedin.md`, `README.md` atualizado explicando as 2 variações. **Formato único 1080×1350** (IG portrait) — mesmo PNG vale para LinkedIn (descarte do 1080×1080 separado).

7. **Cost guard atualizado:** R$0,05 → **R$1,00**. Custo estimado real: R$0,04 (texto OpenAI gpt-5-mini) + R$0,66 (3× DALL-E 3 a R$0,22 = $0,04 USD × 5,5) = ~R$0,70/carrossel. Folga ~30% sobre estimativa para variabilidade FX e retries.

## Alternativas consideradas

- **A — Manter v1.0 editorial e descartar refs Nousi/Breia:**
  - Prós: zero retrabalho; smoke #15 aprovado; código pronto para PR.
  - Contras: formato dissociado do nicho UHNW que consome carrossel; perde a janela editorial; custo afundado é menor do que ROI de publicar formato genérico.
  - **Por que não:** Eduardo é o sócio operacional do produto e tem janela editorial limitada para validar formato. Insistir em v1.0 contra evidência de mercado seria sunk cost fallacy.

- **B — Hibridizar: manter editorial + adicionar mock-tweet como "extras" no ZIP:**
  - Prós: máxima flexibilidade; Eduardo escolhe por post.
  - Contras: dobra renders (24 PNGs/carrossel); confusão na decisão de qual usar; manutenção 2x.
  - **Por que não:** Andrey Nousi e Renato Breia operam APENAS o formato mock-tweet — não diversificam. Hibridização dilui identidade visual.

- **C — Mock-tweet com 1 variação só (LDC institucional):**
  - Prós: simplicidade; 6 PNGs ao invés de 12.
  - Contras: refs Andrey Nousi sobem com avatar pessoal próprio; LDC pode ganhar tração cruzando institucional + pessoal do Luciano (sócio de credenciais técnicas + fee-based).
  - **Por que não:** dual-variation é zero custo extra de IA (imagens compartilhadas) e 2x flexibilidade de distribuição. Eduardo posta no perfil que faz mais sentido por post.

## Consequências

### Positivas

- **Alinhamento com refs validadas pelo nicho UHNW** (Nousi, Breia) — formato que comprovadamente engaja o público-alvo de R$50M+ patrimônio.
- **Imagens AI editoriais** dão presença visual sem fotografia stock cara/inadequada.
- **Dual-variation** abre canal "perfil pessoal + institucional" sem custo extra de IA (apenas 6 renders adicionais — ~600ms de overhead).
- **Schema mais simples** — 1 template React (`SlideTweet`) vs 4 anteriores. Menos branching, menos bugs visuais por tipo.
- **Prompt v2.0 aproveita prompt cache** OpenAI (string literal estável) — fingerprint novo invalida cache uma única vez no rollout.
- **README.md do ZIP** orienta Eduardo qual variação usar em qual contexto (institucional vs pessoal).

### Negativas / trade-offs

- **Custo unitário sobe ~17×:** R$0,04 (v1.0) → R$0,70 (v2.0). Ainda bem abaixo do guard R$1,00 e dentro do teto R$200/mês mesmo com 1-2 carrosséis/dia.
- **Latência sobe:** 12 PNGs renderizados (vs 12 de IG+LI antes, mas agora com 3 chamadas DALL-E ~5-10s cada). Total estimado: 60-90s vs 20-30s do v1.0.
- **Sunk cost:** templates v1.0 (4 arquivos) e variation IG/LinkedIn descartados após 1 dia de uso. Trabalho técnico aproveitado: render pipeline, image cache module-scope, prompt cache config, cost calculator, route handler, ZIP packer, UI wiring.
- **DALL-E 3 não é determinístico:** 2 carrosséis do mesmo BlogPost geram imagens visualmente diferentes. Aceitável: cada carrossel é um artefato editorial individual; reprodutibilidade vem do JSON do CarouselScript, não dos PNGs.
- **Dependência de DALL-E:** se OpenAI Images API ficar fora, fallback text-only mantém o pipeline funcional mas sem hero images. Aceitável para v2.0; ADR futuro pode considerar Gemini Imagen como redundância.

### Neutras

- **Anti-SPEC §6.1, §6.2, §6.2b** seguem 100% válidas e aplicadas (compliance per slide + caption + image_prompt).
- **Cron schedule `0 5 * * *` mantido** — TTL 90d em `blog-carousels` continua igual.
- **Migration `carousel_runs`** intacta — schema serve v2.0 sem alteração.
- **Bucket privado `blog-carousels`** continua, signed URL 24h, mesmo padrão.

## Estado pós-pivot (a executar)

**Substituído:**
- `src/features/news/carousel/templates/SlideHook.tsx` → deletado, body absorvido em SlideTweet
- `src/features/news/carousel/templates/SlideContent.tsx` → deletado
- `src/features/news/carousel/templates/SlideQuestion.tsx` → deletado
- `src/features/news/carousel/templates/SlideCTA.tsx` → deletado
- `src/features/news/carousel/render.ts` → reescrito com `renderCarouselForVariation`
- `src/features/news/carousel/prompt.ts` → reescrito v2.0
- `src/features/news/contracts/carousel.ts` → schema v2.0 (body cap 360, image_prompt, bold markdown)
- `src/features/news/carousel/zip.ts` → estrutura ldc/+luciano/
- `src/app/api/admin/posts/[id]/carousel/route.ts` → cost guard R$1,00
- `src/app/admin/posts/edit/[id]/CarouselPreviewModal.tsx` → toggle LDC/Luciano
- Testes correspondentes

**Novo:**
- `src/features/news/carousel/templates/SlideTweet.tsx`
- `src/features/news/carousel/image-gen.ts`
- `public/images/avatars/ldc-capital.png` (256×256, gerado via script)
- `public/images/avatars/luciano-herzog.png` (256×256, gerado via script)
- `scripts/F-019-prepare-avatar-assets.ts` (utility one-shot; sharp transitive)

**Inalterado (reaproveitamento técnico):**
- `src/features/news/carousel/generator.ts` — orquestração, custo, compliance, INSERT carousel_runs
- `src/features/news/carousel/compliance-mapper.ts` — mapping CarouselScript → ComplianceCheckInput
- `src/features/news/carousel/carousel-runs-db.ts` — Supabase isolado
- `src/features/news/carousel/storage.ts` — upload + signed URL
- `src/app/api/admin/blog-carousels/cleanup/route.ts` — cron TTL 90d
- `vercel.json` — cron `0 5 * * *`
- Migration `carousel_runs` — schema permanece
- `public/images/carousel/logo-{dark,light}-bg-trimmed.png` — não usado em v2.0 mas mantido (custo zero de manutenção)

## Rollback plan

Se o smoke do v2.0 falhar visualmente ou se DALL-E entregar consistentemente imagens fora do tom UHNW:

1. Reverter o commit do pivot (preserva os 3 commits de docs/contracts/chore como base SDD).
2. v1.0 templates editoriais voltam ativos. Smoke #15 já validado.
3. Migration e bucket são compatíveis com ambas as versões — nada a desfazer no Supabase.
4. ADR-006 fica como "aceito → revertido" com nota explicando.

## Referências

- Reunião 2026-05-09: Eduardo apresenta refs Andrey Nousi e Renato Breia, identifica gap visual.
- ADR-005 (pivot brevidade → artigo denso) — precedente de pivot dentro do roadmap.
- DALL-E 3 pricing: https://openai.com/api/pricing — $0.040/image standard 1792×1024.
- Memórias `feedback_no_anthropic_sdk`, `feedback_openai_structured_outputs`, `feedback_supabase_js_multi_table`, `feedback_bloomberg_internal_signal` — mantidas.
