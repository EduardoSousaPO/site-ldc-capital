# Runbook: bloomberg-pdf-handling

> **Anti-SPEC §6.2b (sagrada).** Bloomberg PDF é **sinal interno autoral**. JAMAIS citar como fonte em qualquer output público. Defense in depth obrigatório.
> ADR-003 — risco contratual existencial (ToS Bloomberg). Qualquer violação = `BLOQUEADO`.

## §1 Princípio absoluto

PDFs Bloomberg via email são **input privado autoral**. O pipeline usa para inspirar tópicos e ângulos. Mas:
- **Nunca** citar "Bloomberg" como fonte no artigo, slide, caption, social.
- **Nunca** referenciar reportagem, autor ou URL Bloomberg em output público.
- **Nunca** logar conteúdo do PDF em telemetria ou logs estruturados.

Fontes citáveis vêm **apenas** de Perplexity Sonar Pro com `has_public_coverage=true` (filtro em `orchestrator.ts` linhas 4-5 do cabeçalho — "filtra Perplexity por `has_public_coverage=true`").

## §2 Defense in depth — 5 camadas

| # | Camada | Onde |
|---|---|---|
| 1 | System prompt OpenAI proíbe citar Bloomberg | `src/features/news/prompts/` (congelado, ADR-007) |
| 2 | Zod refines no schema de saída rejeitam regex `/bloomberg/i` | `src/features/news/contracts/` |
| 3 | `runComplianceCheck` per-artigo rejeita menção a Bloomberg | `src/features/news/compliance/checker.ts` |
| 4 | `runComplianceCheck` per-slide e per-caption no F-019 | `src/features/news/carousel/generator.ts` |
| 5 | Post-DALL-E image filter rejeita "Bloomberg branding" | `src/features/news/carousel/` (image validation pós DALL-E) |

Qualquer artigo ou slide com violação → `status='blocked_compliance'` em `news_pipeline_runs` ou `carousel_runs`. NÃO publica.

## §3 Upload de PDFs Bloomberg

Via UI:
1. Admin login → `/admin/bloomberg-pdfs`.
2. Drag-drop até 10 PDFs (≤10MB cada).
3. Upload usa **signed URL** Supabase Storage (`createSignedUploadUrl`) — servidor NUNCA lê conteúdo (`/api/admin/bloomberg-pdfs/upload/route.ts` cabeçalho).
4. Arquivos vão para bucket `bloomberg-pdfs` (privado, service role bypassa RLS, sem URL pública).
5. Opcional: clicar "Trigger pipeline" → dispara `runPipeline()` com `trigger_type='manual_upload'`.

## §4 Retenção e cleanup

- **TTL voluntário: 30 dias** (Anti-SPEC §6.2b + ToS Bloomberg).
- Cron `0 4 * * *` UTC (`/api/admin/bloomberg-pdfs/cleanup`) deleta PDFs com `created_at < now() - 30 days`.
- Cleanup é **classe D** — qualquer mudança no TTL exige Feature Contract + ADR.
- Inspeção via Supabase Studio:
  ```sql
  -- Lista arquivos do bucket (via API; Studio não mostra objects diretos)
  -- Use o admin endpoint:
  ```
  ```bash
  curl -s https://ldccapital.com.br/api/admin/bloomberg-pdfs \
    -H "Cookie: <sessão admin>" | head -c 500
  ```

## §5 Inspecionar extrações (sem logar conteúdo)

PDFs viram texto via `pipeline/extractor.ts` (pdfjs-dist) ou `gemini-fallback.ts` (Gemini 2.5 para raster). O texto **nunca é persistido em texto puro**; apenas:
- Conta de tokens (`news_pipeline_runs.tokens_input`).
- Quantidade de queries Perplexity geradas a partir dos sinais.
- `news_pipeline_errors.error_message` em caso de falha — **nunca** com conteúdo.

Se precisar debugar extração:
1. Pegar `pdf_id` específico do bucket.
2. Em terminal local (não em CI / não em prod), rodar:
   ```bash
   cd site-ldc/site-ldc
   npx tsx scripts/test-extract.ts <pdf_id>   # se houver script; senão criar ad-hoc
   ```
3. **Nunca** colar o texto extraído em PR, commit, log, Slack, GitHub issue.

## §6 Anti-SPEC §6.2b — checks obrigatórios em features novas

Toda feature que toca o pipeline IA precisa validar:

- [ ] System prompt **explícita** proibição de citar Bloomberg.
- [ ] Schema Zod tem refine que rejeita `/bloomberg/i` em campos textuais.
- [ ] `runComplianceCheck` é chamado per-output.
- [ ] DALL-E prompts incluem boilerplate "no Bloomberg branding".
- [ ] Telemetria não persiste conteúdo Bloomberg em texto puro.
- [ ] Logs estruturados (JSON) não contêm conteúdo Bloomberg.

Falta de qualquer item → BLOQUEADO no Prompt 3 QA.

## §7 Incidente — Bloomberg citado em produção

1. **Suspender pipeline imediatamente** (`news-pipeline-cron.md §2`).
2. **Despublicar artigo** via `/admin/posts/edit/[id]` → `published=false`.
3. Se artigo em cache Google → solicitar removal em Search Console.
4. Se slides já distribuídos em IG/LinkedIn → deletar posts.
5. Inspecionar `news_pipeline_runs` e `compliance_violations` (se existir) para identificar qual camada falhou.
6. Reforçar camada quebrada (prompt, Zod, checker, image filter).
7. Registrar `INCIDENT` em `wiki/log.md`.
8. Não religar pipeline até PR de fix mergeado + smoke teste em staging.

## §8 Visualizar PDF Bloomberg (admin)

```bash
curl -s "https://ldccapital.com.br/api/admin/bloomberg-pdfs/<pathname>" \
  -H "Cookie: <sessão admin>" -o /tmp/bloomberg-<id>.pdf
```

Arquivo baixa para uso local. **Nunca** subir esse PDF para outro serviço (Gist, Discord, anexo de PR, Notion, etc.).

## §9 Referências

- **ADR-003** — Bloomberg sinal interno autoral.
- **ADR-004** — Compliance via guardrails técnicos.
- **ADR-007** — Disclaimer literal só em editorial completo.
- `docs/specs/spec-pipeline-ia.md` Anti-SPEC §6.2b.
- `src/features/news/pipeline/orchestrator.ts` — linha 5 do cabeçalho documenta filtro `has_public_coverage`.
- `src/features/news/compliance/checker.ts` — engine F-005.
