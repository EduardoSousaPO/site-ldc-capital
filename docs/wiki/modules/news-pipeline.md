# Módulo: news-pipeline

> Pipeline IA que gera artigos densos em `BlogPost` a partir de PDFs Bloomberg + fontes públicas. Cron 2x/dia + aprovação humana por email (F-018) + carrossel social opcional (F-019). **Domínio mais sensível do site.**

## §1 Escopo

**Orchestrator:** `src/features/news/pipeline/orchestrator.ts` — `runPipeline()`.

**Submódulos:**
- `pipeline/extractor.ts` — pdfjs-dist para Bloomberg vetorial.
- `pipeline/gemini-fallback.ts` — Gemini 2.5 para Bloomberg raster.
- `pipeline/format-detector.ts` — detecta vetorial vs raster.
- `pipeline/perplexity-client.ts` — fontes públicas citáveis.
- `pipeline/openai-client.ts` — geração de artigo (Structured Outputs, hard fail R$5).
- `pipeline/blogpost-db.ts` — INSERT em `BlogPost`.
- `pipeline/pdf-storage.ts` — leitura do bucket `bloomberg-pdfs`.
- `pipeline/cover-image-gen.ts` — DALL-E para cover do artigo.
- `pipeline/blocked-draft-storage.ts` — drafts bloqueados por compliance.
- `compliance/checker.ts` — `runComplianceCheck` (engine F-005).
- `prompts/` — system prompts (congelados; mudança = C/D).
- `telemetry/` — gravação em `news_events`, `news_pipeline_runs`, `news_pipeline_errors`.
- `notifications/approval-handler.ts` — F-018 token GET handler.
- `persistence/approval-token-storage.ts` — F-018 CRUD em `BlogPostApprovalToken`.
- `carousel/` — F-019 generator + render + zip (ver `modules/blog-cms.md` §2.1 e ADR-006).

**Endpoints:**
- `/api/news/cron/route.ts` — POST/GET, `CRON_SECRET` + `NEWS_PIPELINE_ENABLED`.
- `/api/posts/approve|reject/route.ts` — token público F-018.
- `/api/posts/cleanup-expired-tokens/route.ts` — cron 00h BRT, TTL 7d.
- `/api/admin/posts/[id]/carousel/route.ts` — trigger F-019.
- `/api/admin/bloomberg-pdfs/trigger-pipeline/route.ts` — disparo manual.
- `/api/admin/bloomberg-pdfs/cleanup/route.ts` — cron 01h BRT, TTL 30d.
- `/api/admin/blog-carousels/cleanup/route.ts` — cron 02h BRT, TTL 90d.

## §2 Fluxos principais

### 2.1 Pipeline principal (`runPipeline()` em `orchestrator.ts`)
1. `recordPipelineRun` → `news_pipeline_runs` status='running'.
2. `listLatestBloombergPdfs` — até 4 PDFs do bucket `bloomberg-pdfs`.
3. `extractPdf` paralelo. `format-detector` decide vetorial (pdfjs) vs raster (Gemini fallback).
4. `getQueriesForTurno` + `queryPerplexity` paralelo.
5. Filtra Perplexity por `has_public_coverage=true` — **defesa Anti-SPEC §6.2b** (PDF Bloomberg jamais cita como fonte).
6. Monta `BlogArticleGenerationRequest` com sinais internos (Bloomberg) + fontes externas (Perplexity).
7. `generateBlogArticles` (OpenAI Structured Outputs). **Hard fail R$5** via `OpenAiCostExceededError`.
8. Para cada artigo retornado:
   - `runComplianceCheck` (engine F-005).
   - Idempotência via `findExistingArticleBySlug`.
   - `findCategoryIdAndNameBySlug`.
   - `insertBlogPost(published=false)`.
   - Telemetria F-009: `published | blocked_compliance | duplicate`.
9. `updatePipelineRun(run_id, status="success"|"failed", métricas)`.

**Hard fails (throw):** custo OpenAI > R$5; erro de extração/Perplexity em TODAS as fontes (zero signals AND zero public_sources).

### 2.2 F-018 — Aprovação por email
1. Pipeline grava token em `BlogPostApprovalToken(status='pending', expires_at=now+7d)`.
2. Resend envia email com link `approve` + `reject` para Marcos + CCs.
3. Marcos clica → GET `/api/posts/approve?token=<rawToken>` → `handleApproval(request, "approve")` → muda `BlogPost.published=true` + token `status='approved'`.
4. Primeiro clique decide; qualquer destinatário (TO/CC) pode acessar. Auditoria via `news_events.ip_hash` (sentinela `"0"x64` para origem server).
5. Cron `cleanup-expired-tokens` (00h BRT) marca `pending` antigos como `expired`.

### 2.3 F-019 — Carrossel social
Ver `modules/blog-cms.md` §2 (compartilha `BlogPost` como input) e `architecture.md` §7.2. Generator em `src/features/news/carousel/generator.ts`. Endpoint `/api/admin/posts/[id]/carousel`. INSERT em `carousel_runs`.

## §3 Tabelas / Storage

- **Versionadas:** `news_events`, `news_pipeline_runs`, `news_pipeline_errors`, `news_publications` (legacy F-008).
- **Órfãs (críticas):** `BlogPost`, `Category`, `BlogPostApprovalToken`, `carousel_runs`.
- **Buckets:** `bloomberg-pdfs` (signed upload, TTL 30d), `blog-carousels` (ZIPs, TTL 90d), `ldc-assets` (cover images via `pipeline/cover-image-gen.ts`).
- **Índice parcial:** `idx_news_pipeline_runs_status_triggered` para lock distribuído (migration `20260429120000`).

## §4 Env vars e dependências externas

- IA: `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_GEMINI_API_KEY`.
- Cron: `CRON_SECRET`, `NEWS_PIPELINE_ENABLED` (default `false`).
- Telemetria: `NEWS_IP_HASH_SALT` (opcional).
- F-018: `NEWS_APPROVAL_RECIPIENT_EMAIL`, `NEWS_APPROVAL_CC_EMAILS`, `RESEND_API_KEY`, `EBOOK_FROM_EMAIL`/`EBOOK_FROM_NAME` (reusado como remetente).
- Storage: `SUPABASE_SERVICE_ROLE_KEY`.

## §5 Riscos e classe típica de mudança

Toda mudança aqui = **classe D obrigatória.** Anti-SPEC §6 inteira aplicável:
- §6.1 — sem Anthropic SDK.
- §6.2 — compliance CVM HARD.
- §6.2b — Bloomberg sinal interno (defesa: filter `has_public_coverage=true` + post-DALL-E filters + hashtag check).
- §6.3 — disclaimer literal só em editorial completo (NÃO em slide/caption F-019).
- §6.4 — cron Vercel é único trigger.
- §6.5 — Zod 100% em IO externo.
- §6.6 — tabelas/endpoints intocáveis.
- §6.7 — produção = D.

## §6 ADRs e referências

- **ADR-001** — Stack IA (OpenAI + Perplexity + Gemini). Anthropic SDK proibido.
- **ADR-003** — Bloomberg sinal interno.
- **ADR-004** — Compliance via guardrails técnicos (5 camadas).
- **ADR-005** — Pivot artigo denso em BlogPost.
- **ADR-006** — Carrossel F-019 (X-mock + dual + DALL-E + R$1 guard).
- **ADR-007** — Disclaimer literal só em editorial completo; social via guardrails.
- **SPEC autoritativa:** `docs/specs/spec-pipeline-ia.md` (RFs sobreviventes pós-pivot: RF-005, RF-006, RF-007, RF-008, RF-015).
- **Feature contracts:** `docs/plans/feature-contracts/F-007-pipeline-ia.md`, `F-008-cron-commit.md` (legacy), `F-019-carousel.md`.
- **TODO autoritativo:** `TODO.md` raiz (TODO específico do pipeline foi absorvido em 2026-05-21 — Fase 6b).

## §7 Runbooks relacionados

- `docs/wiki/runbooks/news-pipeline-cron.md` — operar cron, pausar via `NEWS_PIPELINE_ENABLED`, inspecionar runs/errors (a criar na Fase 4).
- `docs/wiki/runbooks/bloomberg-pdf-handling.md` — Anti-SPEC §6.2b enforcement.
- `docs/wiki/runbooks/secrets-rotation.md` — `CRON_SECRET`, IA keys.

## §8 Pontos de atenção atuais

- **Pipeline gate `NEWS_PIPELINE_ENABLED`** — atualmente `false` em produção (default). Eduardo liga após smoke test autorizado.
- **Custo OpenAI** — guard R$5/pipeline run; carrossel F-019 tem guard adicional R$1 (ADR-006).
- **Gemini free tier 20 RPD** — produção precisa billing habilitado (ver `CLAUDE.md` Memórias-chave §7).
- **OpenAI Structured Outputs limitations** — `.url()`, `.uuid()`, `.optional()` quebram `zodResponseFormat`. Schema relaxado + re-validação estrita após call.
- **`[VERIFICAR]`** — RLS de `BlogPost`, `BlogPostApprovalToken`, `carousel_runs` (todas órfãs).
- **`[VERIFICAR]`** — Schema autoritativa de `carousel_runs` (estrutura inferida do generator, não da migration).
