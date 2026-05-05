# CONTRACTS — LDC News → Pipeline IA para `/blog`

> ⚠️ **PIVOT 2026-04-29 — ver [ADR-005](./decisions/ADR-005-pivot-brevidade-para-artigo-denso-blog.md):** schemas `Briefing*`, `BriefingDraft`, `CommitRequest`, `CommitResponse`, `WeeklyDigestRequest/Response`, `TelegramPostRequest/Response`, `AdminBriefingActionRequest/Response`, `AdminListBriefingsQuery` foram **APAGADOS** na limpeza pós-pivot. Ver `git log` para histórico.
>
> **Schemas vigentes pós-pivot** (em [src/features/news/contracts/](../../src/features/news/contracts/)):
> - `compliance.ts` — `ComplianceCheckResult`, `ComplianceViolation` (mantido — engine F-005)
> - `pipeline.ts` — `BloombergFormat`, `UploadPdfRequest/Response`, `PdfExtractionResult`, `GenerationJob`, `PipelineRun`, `GenerationResult`, `TriggerType`, `PipelineRunStatus` (mantido — pipeline runtime)
> - `perplexity.ts` — `PerplexityQuery`, `PerplexityCitation`, `PerplexityResponse`, `PERPLEXITY_DOMAIN_FILTER` (mantido — fontes públicas)
> - `telemetry.ts` — `TelemetryEvent`, `TelemetryEventType`, `ShareChannel` (mantido — F-009)
>
> **Schemas a serem criados em F-015** (NÃO ainda implementados):
> - `BlogArticleDraft` — substitui `BriefingDraft`. 800-1500 palavras, anatomia mais flexível com subcabeçalhos H2/H3
> - `BlogArticleGenerationRequest`, `BlogArticleGenerationResponse` — substituem `BriefingGenerationRequest/Response`
> - Tipos `BlogPostInsert`, `BlogPostUpdate` — derivados do schema Supabase `BlogPost`
>
> **Schemas a serem criados em F-018** (aprovação email):
> - `BlogPostApprovalToken` — schema da tabela nova de tokens
>
> **Source of truth é o código Zod.** Em divergência, prevalece o código.

---

> Documentação histórica abaixo (pré-pivot), mantida para auditoria. Schemas marcados como APAGADOS não existem mais no código.
> Versão: 1.0 — alinhada à SPEC v1.1.

---

## Como usar

```ts
import {
  Briefing,
  BriefingFrontmatter,
  BriefingGenerationResponse,
  ComplianceCheckResult,
  PerplexityQuery,
  // ...
} from "@/features/news/contracts";

const result = BriefingFrontmatter.safeParse(data);
if (!result.success) {
  // tratar erros de validação
}
```

Todos os schemas usam **Zod v4** (já em `package.json`). 100% dos inputs externos (request body, response de APIs, frontmatter MDX) **DEVEM** ser validados via `safeParse` antes de uso.

---

## 1. Briefing — entidade central

[src/features/news/contracts/briefing.ts](../../src/features/news/contracts/briefing.ts)

### Enums

- **`CategoriaBriefing`**: `"macro_brasil" | "macro_global" | "geopolitica" | "commodities" | "renda_fixa" | "internacional_uhnw" | "sucessao_tributacao" | "setorial"`
- **`BriefingStatus`**: `"pending_review" | "blocked_compliance" | "published" | "archived"`

### `FonteCitavel`

URL pública citável. **Bloomberg é rejeitado por refine** (RNF-008).

| Campo | Tipo | Validação |
|---|---|---|
| url | string URL | `!/bloomberg\.(com\|net\|com\.br)/i` |
| title | string | 3-200 chars |
| dominio | string | 3-80 chars, `!/bloomberg/i` |

### `NumeroBriefing`

Bullet de "Os números" (3-5 por briefing).

| Campo | Tipo | Validação |
|---|---|---|
| texto | string | 5-220 chars |
| fonte_url | string URL | obrigatório |
| fonte_nome | string | 3-80 chars |

### `BriefingFrontmatter`

Frontmatter YAML do MDX. Todo briefing publicado tem este shape.

| Campo | Tipo | Validação |
|---|---|---|
| title | string | 5-80 chars + **≤8 palavras** (refine) |
| slug | string | kebab-case `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| categoria | `CategoriaBriefing` | enum |
| data_publicacao | string | ISO 8601 datetime |
| tempo_leitura_min | int | 1-3 |
| por_que_importa | string | 20-200 chars |
| numeros | array | 3-5 itens |
| entre_as_linhas | string | 20-300 chars |
| o_que_fica_de_olho | string | 10-150 chars |
| imagem_destacada_url | string URL | opcional |
| imagem_destacada_alt | string | opcional, ≤120 chars |
| fontes | array `FonteCitavel` | 1-8 itens |
| autor | literal | sempre `"Editorial LDC"` |
| status | `BriefingStatus` | enum |
| cvm_disclaimer_version | literal | sempre `"1.0"` |
| fonte_origem_pdf_ids | array UUID | opcional, rastreabilidade |

### `Briefing`

Frontmatter + body.

Estende `BriefingFrontmatter` com:
- `body`: string 50-2500 chars (markdown renderizado)
- `view_count`: int ≥0 (default 0)
- `share_count`: int ≥0 (default 0)

### `BriefingListItem`

Subset usado na página índice e cards (sem body).

`pick({ title, slug, categoria, data_publicacao, tempo_leitura_min, por_que_importa, imagem_destacada_url, imagem_destacada_alt })`

---

## 2. Compliance — guardrails CVM + autoral

[src/features/news/contracts/compliance.ts](../../src/features/news/contracts/compliance.ts)

### `ComplianceViolationType`

`"ticker_br" | "ticker_us" | "phrase_prescriptive" | "promise_return" | "bloomberg_as_source" | "bloomberg_in_body"`

### `ComplianceViolationField`

`"body" | "fontes_url" | "fontes_dominio" | "fontes_title" | "title" | "por_que_importa" | "entre_as_linhas" | "o_que_fica_de_olho" | "numeros"`

### `ComplianceViolation`

| Campo | Tipo |
|---|---|
| type | `ComplianceViolationType` |
| match | string (substring violadora) |
| field | `ComplianceViolationField` |
| line_number | int ≥0 |
| severity | literal `"hard_block"` |
| message | string |

### `ComplianceCheckResult`

```ts
{ passed: boolean, violations: ComplianceViolation[], checked_at: ISO8601 }
```

---

## 3. Pipeline — extração e geração

[src/features/news/contracts/pipeline.ts](../../src/features/news/contracts/pipeline.ts)

### `BloombergFormat`

`"PBN" | "BFW" | "BN" | "APW" | "UNKNOWN"`
- **PBN** = Bloomberg Brazilian News (in Portuguese)
- **BFW** = Bloomberg First Word
- **BN** = Bloomberg News (geralmente traduzido)
- **APW** = Associated Press
- **UNKNOWN** = formato não reconhecido (fallback)

### `TriggerType`

`"cron_morning" | "cron_afternoon" | "manual_upload" | "manual_admin"`

### `UploadPdfRequest`

```ts
{ files: { name, size: ≤10MB, contentType: "application/pdf" }[1..10] }
```

Multi-PDF (1-10 arquivos por upload — derivado do uso real do Eduardo).

### `UploadedPdf`

| Campo | Tipo |
|---|---|
| id | UUID |
| blob_url | string URL |
| filename | string |
| format_detected | `BloombergFormat` |
| size_bytes | int ≥1 |
| uploaded_at | ISO 8601 |
| auto_translated | boolean (default false) |

### `PdfExtractionResult`

| Campo | Tipo |
|---|---|
| pdf_id | UUID |
| format | `BloombergFormat` |
| text_normalized | string (pós-filtros de metaconteúdo) |
| text_length | int ≥0 |
| used_gemini_fallback | boolean |
| auto_translated | boolean |
| table_data_blocks | string[] (blocos `<table_data>` extraídos) |
| filtered_sections | string[] (seções removidas: "O que estamos lendo" etc.) |

### `GenerationJob`

```ts
{ trigger_type, pdf_ids?, triggered_by? (email) }
```

### `PipelineRun`

Registro auditável persistido em Supabase tabela `news_pipeline_runs`.

| Campo | Tipo |
|---|---|
| id | UUID |
| triggered_at | ISO 8601 |
| trigger_type | `TriggerType` |
| pdf_ids_used | UUID[] |
| perplexity_queries | string[] |
| openai_total_tokens | int ≥0 |
| openai_cost_brl | number ≥0 |
| briefings_generated | int ≥0 |
| briefings_blocked | int ≥0 |
| themes_discarded_no_public_source | int ≥0 |
| bloomberg_citation_attempts | int ≥0 |
| status | `"running" \| "success" \| "failed"` |
| error_message | string \| null |
| duration_ms | int ≥0 |

### `GenerationResult`

Retorno do endpoint `/api/news/generate`.

```ts
{ run_id, status, briefings_pending_review, briefings_blocked, themes_discarded, duration_ms }
```

---

## 4. Perplexity — fontes públicas citáveis

[src/features/news/contracts/perplexity.ts](../../src/features/news/contracts/perplexity.ts)

### Constante exportada

```ts
PERPLEXITY_DOMAIN_FILTER = [
  "reuters.com", "ft.com", "valor.com.br", "neofeed.com.br",
  "wsj.com", "economist.com", "infomoney.com.br", "axios.com"
]
```

**Bloomberg explicitamente fora.**

### `PerplexityQuery`

| Campo | Tipo | Validação |
|---|---|---|
| query | string | 10-500 chars |
| tema_categoria | string | livre |
| search_recency_filter | literal | `"day"` |
| search_domain_filter | string[] | refine: nenhum item contém `bloomberg` |
| return_citations | literal | `true` |

### `PerplexityCitation`

| Campo | Tipo | Validação |
|---|---|---|
| url | string URL | refine: `!/bloomberg/i` |
| title | string | opcional |
| dominio | string | obrigatório |

### `PerplexityResponse`

```ts
{ query, tema_categoria, content, citations: PerplexityCitation[], has_public_coverage: boolean }
```

`has_public_coverage = false` ⇒ tema descartado (CA-012b).

---

## 5. OpenAI — geração estruturada

[src/features/news/contracts/openai.ts](../../src/features/news/contracts/openai.ts)

### `BriefingGenerationRequest`

Input que o pipeline monta ANTES de chamar GPT-5-mini.

```ts
{
  bloomberg_signals: { pdf_id, format, text, auto_translated }[],
  public_sources: { tema_categoria, perplexity_content, citations: FonteCitavel[] }[],
  turno: "manha" | "tarde",
  data_referencia: ISO 8601
}
```

### `BriefingDraft`

Schema do JSON que o GPT-5-mini retorna por briefing (Structured Outputs).

| Campo | Tipo |
|---|---|
| title | string 5-80 |
| slug | kebab-case |
| categoria | `CategoriaBriefing` |
| por_que_importa | string 20-200 |
| numeros | `NumeroBriefing[3..5]` |
| entre_as_linhas | string 20-300 |
| o_que_fica_de_olho | string 10-150 |
| body_markdown | string 50-2500 |
| fontes | `FonteCitavel[1..8]` |
| imagem_destacada_url | string URL opcional |
| imagem_destacada_alt | string ≤120 opcional |
| fonte_origem_pdf_ids | UUID[] (rastreabilidade) |

### `BriefingGenerationResponse`

```ts
{
  briefings: BriefingDraft[0..3],
  themes_discarded: { tema, reason: "no_public_source"|"off_topic"|"duplicate" }[],
  metadata: { model, total_tokens, cached_tokens, cost_brl }
}
```

---

## 6. Admin — ações editoriais

[src/features/news/contracts/admin.ts](../../src/features/news/contracts/admin.ts)

### `AdminAction`

`"approve_publish" | "save_edits" | "archive" | "republish_telegram" | "discard"`

### `AdminBriefingActionRequest`

```ts
{ briefing_slug, action, edits?: Partial<Briefing> }
```

### `AdminBriefingActionResponse`

```ts
{ briefing_slug, new_status, github_commit_sha?, public_url? }
```

### `AdminListBriefingsQuery`

```ts
{ status?, limit: 1-100 (default 20), offset: ≥0 (default 0) }
```

---

## 7. Persistência — commit GitHub

[src/features/news/contracts/persistence.ts](../../src/features/news/contracts/persistence.ts)

### `CommitRequest`

| Campo | Tipo | Validação |
|---|---|---|
| filepath | string | regex `^content/news/(_drafts/)?\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.mdx$` |
| content_mdx | string | ≥100 chars |
| message | string | 10-120 chars |
| frontmatter | `BriefingFrontmatter` | reaproveita schema canônico |

### `CommitResponse`

```ts
{ sha: ≥7 chars, url: string URL, branch: string }
```

---

## 8. Weekly Digest — Mailchimp

[src/features/news/contracts/digest.ts](../../src/features/news/contracts/digest.ts)

### `WeeklyDigestRequest`

```ts
{ week: "current"|"previous" (default "current"), limit: 1-10 (default 5) }
```

### `WeeklyDigestResponse`

```ts
{ week_start, week_end, briefings: BriefingListItem[], html: string ≥100 chars, generated_at }
```

`html` já vem inline-styled (compatível Mailchimp campaign editor).

---

## 9. Telemetria

[src/features/news/contracts/telemetry.ts](../../src/features/news/contracts/telemetry.ts)

### `TelemetryEventType`

`"view" | "share" | "cta_diagnostico" | "weekly_digest_render" | "telegram_posted" | "published" | "blocked_compliance" | "theme_discarded_no_public_source"`

### `ShareChannel`

`"telegram" | "linkedin" | "x" | "copy_link"`

(Sem WhatsApp por design — Anti-SPEC §6.4.)

### `TelemetryEvent`

| Campo | Tipo | Validação |
|---|---|---|
| type | `TelemetryEventType` | enum |
| briefing_slug | string | opcional |
| share_channel | `ShareChannel` | opcional |
| ip_hash | string | regex SHA-256 hex `^[a-f0-9]{64}$` |
| user_agent | string | ≤500 chars |
| referer | string URL | opcional |
| ts | ISO 8601 | obrigatório |

**IP em texto puro nunca é armazenado** (RNF-007).

---

## 10. Telegram (Marco 2)

[src/features/news/contracts/telegram.ts](../../src/features/news/contracts/telegram.ts)

### `TelegramPostRequest`

```ts
{ briefing_slug, title, por_que_importa, url_publica }
```

### `TelegramPostResponse`

```ts
{ message_id: int|null, posted_at, success: boolean, error_message?: string }
```

---

## Princípios de design

1. **Bloomberg como anti-fonte:** três schemas (`FonteCitavel`, `PerplexityQuery`, `PerplexityCitation`) têm `refine` que rejeita Bloomberg explicitamente. **Quem violar tem failure de validação no parse — não dá para "esquecer".**
2. **Slugs e formatos de path:** regex em `BriefingFrontmatter.slug` e `CommitRequest.filepath` impede arquivos fora do padrão.
3. **Tipos derivados (`z.infer`)** são exportados junto com schemas — uso direto em props React e handlers.
4. **`literal`** para `autor`, `cvm_disclaimer_version`, `search_recency_filter`, `return_citations` — campos com valor fixo travado no contrato.
5. **`refine` para regras de negócio** (≤8 palavras, sem Bloomberg, etc.) ficam *no schema*, não dispersos pelo código.
6. **Reaproveitamento:** `CommitRequest.frontmatter` usa `BriefingFrontmatter` direto — uma única fonte de verdade.

---

## Validação

Schemas verificados via `npx tsc --noEmit -p tsconfig.json` em 2026-04-27 — **zero erros**.

---

*Próximo passo: ADRs em `docs/news/decisions/` para decisões arquiteturais com trade-off real.*
