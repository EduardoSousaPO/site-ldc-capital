# Feature Contract — F-007 Pipeline de geração IA

> Contrato operacional. Classe **D** — afeta produção, custos reais, integra 3 vendors externos.

---

## Identificação

- **ID:** F-007
- **Nome:** Pipeline de geração IA (Bloomberg → Perplexity → OpenAI → MDX draft)
- **Risco:** **D**
- **Cobre:** RF-003, RF-005, RF-006, RF-007, RF-008 (integração), CA-006, CA-007, CA-009, CA-010, CA-010b, CA-011, CA-012, CA-012b, CA-013, CA-014, CA-014b, CB-001 a CB-008 (parcialmente), CB-015, CB-016, CB-019
- **Branch:** `feat/news-ia-pipeline`
- **Data:** 2026-04-27

---

## Objetivo

Implementar o pipeline completo que transforma PDFs Bloomberg + busca Perplexity em **drafts** de briefings em estado `pending_review` ou `blocked_compliance`, salvos em `content/news/_drafts/`. **Esta feature NÃO publica nada** — F-008 cuida do commit GitHub na publicação após aprovação manual do Eduardo.

---

## Definition of Ready (DoR)

- [x] RFs e CAs explícitos na SPEC §1, §4
- [x] Critérios de aceite testáveis (lista abaixo)
- [x] Escopo incluído/excluído descrito
- [x] Risco D confirmado (consome custo real, integra externos)
- [x] Arquivos prováveis listados
- [x] Testes esperados listados
- [x] Contratos Zod prontos: `BriefingGenerationRequest`, `BriefingGenerationResponse`, `BriefingDraft`, `PerplexityQuery`, `PerplexityResponse`, `PdfExtractionResult`, `PipelineRun`, `GenerationResult`
- [x] Dependências externas: OpenAI API, Perplexity API, Gemini API (fallback), Vercel Blob
- [x] Migration Supabase: `news_pipeline_runs`, `news_pipeline_errors` (criadas em F-009 — pré-requisito)
- [x] Impacto produção: cron 2x/dia em produção; smoke test obrigatório em Vercel Preview com env de teste antes de subir
- [ ] **Bloqueio até resolver:** F-002 (constantes), F-005 (compliance check engine) e F-009 (migrations Supabase) precisam estar prontos antes desta feature

---

## Critérios de aceite

- **CA-006:** Cron Vercel `0 10 * * *` e `0 17 * * *` (UTC) invocam `POST /api/news/cron` que delega ao pipeline.
- **CA-007:** Pipeline cria drafts SOMENTE em `pending_review` ou `blocked_compliance` — nunca publica direto.
- **CA-009:** `pdfjs-dist` extrai ≥1000 chars pós-filtro de metaconteúdo para um PDF Bloomberg padrão.
- **CA-010:** Fallback Gemini 2.5 Pro multimodal aciona quando texto pdfjs <1000 chars.
- **CA-010b:** Detecção de formato Bloomberg (PBN/BFW/BN/APW) pelo header da primeira linha.
- **CA-011:** Perplexity request inclui `search_domain_filter` SEM Bloomberg.
- **CA-012:** Perplexity response com ≥1 citation pública válida.
- **CA-012b:** Tema sem cobertura pública é descartado (não vira briefing) e contabilizado em `themes_discarded`.
- **CA-013:** OpenAI retorna JSON validado por Zod `BriefingGenerationResponse`.
- **CA-014:** System prompt cacheado — `cached_tokens > 0` da 2ª chamada do dia.
- **CA-014b:** ComplianceCheck bloqueia briefing com Bloomberg em `fontes[]`.

---

## Escopo incluído

- `src/features/news/pipeline/extractor.ts` — `extractPdf(pdfUrl): Promise<PdfExtractionResult>` usando `pdfjs-dist` + filtros de metaconteúdo (regex de "O que estamos lendo", "Mais conteúdo local", contatos, footer, "Inscreva-se na nossa newsletter").
- `src/features/news/pipeline/format-detector.ts` — `detectBloombergFormat(text): BloombergFormat` via regex no header.
- `src/features/news/pipeline/table-extractor.ts` — detecta padrões `[A-Z][A-Z0-9 ]+ [+-]?\d+,\d+%?` e encapsula em `<table_data>`.
- `src/features/news/pipeline/gemini-fallback.ts` — `extractPdfWithGemini(pdfUrl): Promise<string>` para PDFs imagem-pesados.
- `src/features/news/pipeline/perplexity-client.ts` — `queryPerplexity(query: PerplexityQuery): Promise<PerplexityResponse>` com retry 1x em timeout >15s.
- `src/features/news/pipeline/openai-client.ts` — `generateBriefings(req: BriefingGenerationRequest): Promise<BriefingGenerationResponse>` usando Structured Outputs com Zod schema.
- `src/features/news/prompts/system-prompt.ts` — system prompt Brevidade Inteligente + LDC voice + compliance + proibição Bloomberg + instrução de descarte de temas sem fonte pública. **Marcado para prompt cache** (string literal estável).
- `src/features/news/prompts/turno-queries.ts` — queries Perplexity por turno (manhã: macro global + macro Brasil + geopolítica; tarde: renda fixa + setorial + commodities).
- `src/features/news/pipeline/orchestrator.ts` — função principal `runPipeline(job: GenerationJob): Promise<GenerationResult>`:
  1. Lê últimos PDFs em Vercel Blob (ou `pdf_ids` específicos do job)
  2. Extrai cada PDF (com fallback Gemini)
  3. Identifica temas candidatos (lista de strings via call OpenAI auxiliar pequeno OU heurística de seções)
  4. Para cada tema, chama Perplexity em paralelo (`Promise.all`)
  5. Descarta temas sem `has_public_coverage`
  6. Monta `BriefingGenerationRequest` com `bloomberg_signals` + `public_sources`
  7. Chama OpenAI com Structured Output
  8. Para cada briefing retornado: roda compliance (F-005)
  9. Persiste como `.mdx` em `content/news/_drafts/` (write local — F-008 cuida do commit)
  10. Registra `PipelineRun` em Supabase
- `src/app/api/news/cron/route.ts` — handler que valida `CRON_SECRET` e chama `runPipeline({ trigger_type: "cron_morning" | "cron_afternoon" })`. **Endpoint não-cron** entra em F-008.
- Lock distribuído via Supabase (registro `news_pipeline_runs.status='running'`) para prevenir race condition (CB-006).
- Hard fail se custo OpenAI da rodada > R$ 5 (`openai_cost_brl > 5` → aborta antes de finalizar).

---

## Escopo excluído

- **NÃO commit GitHub** — esse é F-008. Pipeline só escreve em `content/news/_drafts/` localmente (filesystem do server).
- **NÃO Telegram bot** — F-012, Marco 2.
- **NÃO publicação automática** — sempre manual via admin (F-006).
- **NÃO retry agressivo** — falha logada + próximo cron tenta de novo (CB-001, CB-002, CB-005).
- **NÃO suporte a outros formatos PDF** que não Bloomberg (PBN/BFW/BN/APW + AP traduzido). Outros formatos retornam `format: "UNKNOWN"` e o briefing fica em `pending_review` para revisão manual.

---

## Arquivos

### Arquivos que podem ser alterados

- `src/features/news/pipeline/**/*` (todos novos)
- `src/features/news/prompts/**/*` (todos novos)
- `src/app/api/news/cron/route.ts` (novo)
- `src/features/news/__tests__/pipeline.integration.test.ts` (novo)
- `src/features/news/__tests__/__fixtures__/bloomberg-pdfs/*.pdf` (4 PDFs reais que o Eduardo já compartilhou)

### Arquivos que NÃO podem ser alterados sem pausa

- `docs/specs/spec-pipeline-ia.md`, `docs/contracts/contracts-pipeline-ia.md`, `docs/decisions/adr/*` (SPEC + ADRs)
- `src/features/news/contracts/*.ts` — mudança de contrato exige reabertura da FASE 4 do SDD
- `src/features/news/compliance/*` — engine vem de F-005, esta feature só CONSOME
- `next.config.ts`, `vercel.json` — `vercel.json` foi configurado em F-001
- Anti-SPEC SPEC §6 — sagrada

---

## Contratos

- [x] Contratos Zod já existem em `src/features/news/contracts/`:
  - `BriefingGenerationRequest`, `BriefingGenerationResponse`, `BriefingDraft` em `openai.ts`
  - `PerplexityQuery`, `PerplexityResponse` em `perplexity.ts`
  - `PdfExtractionResult`, `BloombergFormat`, `PipelineRun`, `GenerationResult`, `GenerationJob` em `pipeline.ts`
- [ ] **NÃO criar contrato novo** — se precisar, pausa para reabrir FASE 4
- [x] `CONTRACTS.md` está atualizado

---

## Testes obrigatórios (Classe D — N3)

| Teste | Tipo | Cobre CA | Arquivo |
|---|---|---|---|
| extrair texto de PDF PBN real (fixture) | unit | CA-009, CA-010b | `__tests__/extractor.test.ts` |
| extrair texto de PDF BFW com tabela de índices | unit | CA-009, CB-015 | idem |
| filtros removem "O que estamos lendo" | unit | CA-009 | idem |
| detecção de formato BFW vs PBN | unit | CA-010b | `__tests__/format-detector.test.ts` |
| Gemini fallback aciona em PDF curto | integration (mock) | CA-010 | `__tests__/gemini-fallback.test.ts` |
| Perplexity sem Bloomberg em domain filter | unit (refine schema) | CA-011 | `__tests__/perplexity-client.test.ts` |
| Perplexity rejeita citation com Bloomberg | unit | CA-012, RNF-008 | idem |
| OpenAI retorna JSON validado por Zod | integration (mock) | CA-013 | `__tests__/openai-client.test.ts` |
| Compliance bloqueia briefing com Bloomberg em fontes | integration | CA-014b | `__tests__/pipeline.integration.test.ts` |
| Tema sem cobertura pública é descartado | integration | CA-012b | idem |
| Pipeline end-to-end com PDF real → draft pending_review | **e2e contract test** | múltiplos | `__tests__/pipeline.e2e.test.ts` |
| **negativo:** PDF traduzido por máquina é flagged | unit | CB-016 | `__tests__/extractor.test.ts` |
| **negativo:** Perplexity timeout >15s aborta com retry | integration (mock) | CB-001 | `__tests__/perplexity-client.test.ts` |
| **negativo:** OpenAI excede budget aborta | integration (mock) | RNF-003 | `__tests__/openai-client.test.ts` |
| **edge:** 2 instâncias concorrentes — segunda detecta lock | integration | CB-006 | `__tests__/pipeline.integration.test.ts` |
| **smoke (manual):** rodar pipeline real em Vercel Preview com 1 PDF Bloomberg + reviewar 1 briefing real | manual evidenciado | qualidade | log + screenshot |

---

## Comandos obrigatórios (CI N3)

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:integration` (requer mock de OpenAI/Perplexity/Gemini via MSW)
- `npm run test:e2e` (pipeline contract test com fixture PDF)
- `npm run build`
- **Smoke manual:** dispara `/api/news/cron` em Vercel Preview com PDF de exemplo e Eduardo revisa o briefing gerado

---

## Infra / Produção

- **Migration necessária?** Sim (em F-009): `news_pipeline_runs`, `news_pipeline_errors`. Esta feature ASSUME que F-009 mergeada.
- **Migration destrutiva?** Não. Tabelas novas.
- **Cursor Agent via MCP?** Não para esta feature.
- **Env vars novas (a partir de F-001):**
  - `OPENAI_API_KEY` (obrigatório)
  - `PERPLEXITY_API_KEY` (obrigatório)
  - `GOOGLE_GEMINI_API_KEY` (**obrigatório em produção** — PDFs Bloomberg via email são raster, Gemini é caminho normal de extração)
  - `CRON_SECRET` (obrigatório, prod e preview com valores diferentes)
  - `BLOB_READ_WRITE_TOKEN` (Vercel Blob — provisionado pelo Vercel automaticamente)
- **Staging obrigatório?** **Sim.** Vercel Preview com env de teste + 1 rodada manual antes de subir cron para produção.
- **Feature flag?** Sim — env var `NEWS_PIPELINE_ENABLED=true` para ligar o cron em produção. Default `false` no merge inicial. Eduardo liga manualmente após smoke test.
- **Rollback plan (≤5 linhas):**
  1. Setar `NEWS_PIPELINE_ENABLED=false` em produção (Vercel env vars) — desliga o cron sem precisar revert do PR.
  2. Se precisar revert do código: `git revert <SHA>` no `feat/news-ia-pipeline` — não há migration destrutiva, então revert é seguro.
  3. Se há drafts órfãos em `content/news/_drafts/`: deletar manualmente via `/admin/news` (action `discard`).
  4. Validar logs de `news_pipeline_runs` para confirmar que o último run terminou em estado consistente (`success` ou `failed`, não `running`).
  5. Comunicar Eduardo + revisar custo OpenAI/Perplexity da semana via dashboard.

---

## Evidência esperada (Matriz de Validação — preenchida no Prompt 3)

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-006 | `pipeline.integration.test.ts::cron_invokes_pipeline` | integration | — | — |
| CA-007 | `pipeline.integration.test.ts::no_auto_publish` | integration | — | — |
| CA-009 | `extractor.test.ts::extract_pbn_real` | unit | — | — |
| CA-010 | `gemini-fallback.test.ts::triggers_below_threshold` | integration | — | — |
| CA-010b | `format-detector.test.ts::detect_bfw` | unit | — | — |
| CA-011 | `perplexity-client.test.ts::no_bloomberg_in_filter` | unit | — | — |
| CA-012b | `pipeline.integration.test.ts::theme_discarded` | integration | — | — |
| CA-013 | `openai-client.test.ts::structured_output_validates` | integration | — | — |
| CA-014b | `pipeline.integration.test.ts::compliance_blocks_bloomberg` | integration | — | — |
| Smoke | rodada real Preview + revisão Eduardo | manual | — | log + screenshot |

---

## Anti-SPEC — checagem específica para F-007

- [ ] §6.1 — pipeline NÃO publica automaticamente (verificado em CA-007).
- [ ] §6.2 — pipeline NÃO gera briefing recomendando ativo (verificado pelo compliance check F-005, integrado).
- [ ] §6.2b — pipeline NÃO cita Bloomberg (verificado por refine Zod + compliance).
- [ ] §6.3 — pipeline NÃO importa Anthropic SDK (verificado por lint custom rule).
- [ ] §6.3 — pipeline NÃO usa polling para detectar novo PDF — sempre cron + chamada explícita.

---

## Gate de autonomia

Pode prosseguir automaticamente enquanto:
- Arquivos alterados estão na lista permitida.
- CAs sendo implementados são os listados.
- Testes locais passam.
- `NEWS_PIPELINE_ENABLED=false` em produção (não há side effect público).

**Pausa obrigatória antes de:**
- Ligar `NEWS_PIPELINE_ENABLED=true` em produção (decisão Eduardo).
- Alterar contrato Zod (reabre FASE 4).
- Alterar prompt do sistema de forma que mude estilo do briefing — Eduardo precisa aprovar exemplos antes.
- Aumentar limite de PDFs aceitos (>10) ou tokens OpenAI (>5 BRL/rodada).

---

## Resultado final

- **Status:** em planejamento (não iniciado)
- **PR:** —
- **SHA:** —
- **Data de merge:** —
- **Evidência consolidada:** —

---

*Esta feature é o coração do sistema. Erro de qualidade aqui significa briefings ruins ou bloqueados em massa. Erro de compliance aqui significa risco regulatório real. Erro de custo aqui significa estourar o orçamento de R$200/mês. Os 3 vetores são monitorados em `news_pipeline_runs`.*
