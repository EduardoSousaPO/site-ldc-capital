# Runbook: news-pipeline-cron

> Operar o pipeline IA (`/api/news/cron`) — pausar, inspecionar runs/errors, acionar manualmente.
> Documentação técnica completa: `docs/wiki/modules/news-pipeline.md`.

## §1 Schedules ativos

Vercel cron (`vercel.json`):

| UTC | BRT | Endpoint | Schedule |
|---|---|---|---|
| 10:00 | 07:00 | `/api/news/cron` | `0 10 * * *` (matinal) |
| 17:00 | 14:00 | `/api/news/cron` | `0 17 * * *` (vespertino) |

Crons de cleanup relacionados (intercalados):

| UTC | BRT | Endpoint |
|---|---|---|
| 03:00 | 00:00 | `/api/posts/cleanup-expired-tokens` |
| 04:00 | 01:00 | `/api/admin/bloomberg-pdfs/cleanup` |
| 05:00 | 02:00 | `/api/admin/blog-carousels/cleanup` |

## §2 Pausar pipeline IA (sem deploy)

1. Vercel → Project `site-ldc` → Settings → Environment Variables (`Production`).
2. Editar `NEWS_PIPELINE_ENABLED` → `false`.
3. Save.
4. Redeploy do último build via UI (não rebuilda, só publica novamente com env atualizada). ~30s.
5. Confirmar:
   ```bash
   curl -sX POST https://ldccapital.com.br/api/news/cron \
     -H "Authorization: Bearer <CRON_SECRET>" | head -c 200
   ```
   Esperar resposta indicando "pipeline disabled" (ou 200 com `skipped: true` conforme `route.ts`).

Cleanups continuam rodando (não dependem da flag).

## §3 Religar pipeline

1. Inverter passo §2.4: `NEWS_PIPELINE_ENABLED=true`.
2. Redeploy.
3. **Acionar manualmente uma vez** (§4) e inspecionar resultado antes de esperar próximo cron.

## §4 Acionamento manual (smoke test)

```bash
# Local (terminal Eduardo) — substituir CRON_SECRET real
curl -sX POST https://ldccapital.com.br/api/news/cron \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"trigger_type":"manual"}' | tee /tmp/news-cron-run.json
```

Body opcional: `{"trigger_type":"manual","pdf_ids":["<uuid1>","<uuid2>"]}` — força reentrância sobre PDFs específicos.

Resposta esperada: JSON com `run_id`, `status`, métricas. Anotar `run_id` para inspeção §5.

**ATENÇÃO:** acionamento manual conta como execução real — escreve em `news_pipeline_runs`, possivelmente em `BlogPost`. Não use em horário próximo de cron agendado (overlap pode colidir).

## §5 Inspecionar runs e errors via Supabase Studio

1. https://supabase.com/dashboard/project/xvbpqlojxwbvqizmixrr → Table editor.
2. Tabela `news_pipeline_runs`:
   ```sql
   select run_id, trigger_type, status, started_at, finished_at,
          articles_inserted, articles_blocked_compliance, articles_duplicate,
          openai_cost_brl, error_message
   from news_pipeline_runs
   order by started_at desc
   limit 20;
   ```
3. Tabela `news_pipeline_errors` (detalhe de erros por run):
   ```sql
   select run_id, error_type, error_message, occurred_at
   from news_pipeline_errors
   where run_id = '<seu-run-id>'
   order by occurred_at;
   ```
4. Tabela `news_events` (telemetria — view/share/cta/digest):
   ```sql
   select event_type, briefing_slug, created_at, ip_hash
   from news_events
   order by created_at desc
   limit 50;
   ```

## §6 Disparar pipeline a partir de PDFs Bloomberg novos

Caminho recomendado (via UI):
1. `/admin/bloomberg-pdfs` → upload PDFs (1-10).
2. Clicar "Trigger pipeline" → chama `/api/admin/bloomberg-pdfs/trigger-pipeline` (auth dual: sessão admin OU `CRON_SECRET`).
3. UI debounce 30s previne acionamento duplicado.
4. Inspecionar `run_id` retornado em `news_pipeline_runs` (§5) com `trigger_type='manual_upload'`.

Caminho via curl (script):
```bash
curl -sX POST https://ldccapital.com.br/api/admin/bloomberg-pdfs/trigger-pipeline \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

## §7 Pipeline rodando em loop ou inserindo lixo

1. **Pausar imediatamente** (§2).
2. Identificar última `run_id` problemática em `news_pipeline_runs`.
3. Inspecionar `news_pipeline_errors` para causa raiz.
4. Reverter posts inseridos:
   ```sql
   -- Inspecionar BlogPost criados pelo run (via timestamp)
   select id, slug, title, published, createdAt
   from "BlogPost"
   where createdAt > '<started_at do run problemático>'
     and createdAt < '<finished_at>';
   -- Deletar manualmente se confirmado lixo (RUN sob revisão humana)
   ```
5. Registrar `INCIDENT` em `docs/wiki/log.md`.
6. Religar §3 só após causa raiz corrigida.

## §8 Compliance bloqueou tudo (artigos `blocked_compliance`)

Esperado em casos de violação Anti-SPEC §6.2. Auditoria:
```sql
select run_id, articles_inserted, articles_blocked_compliance
from news_pipeline_runs
where started_at > now() - interval '7 days'
order by started_at desc;
```
Se taxa de bloqueio for > 50% por > 2 runs seguidos, suspender pipeline (§2) e revisar prompts em `src/features/news/prompts/` (= classe D, Anti-SPEC §6.6).

## §9 Custos

OpenAI tem hard fail em **R$5 por pipeline run** (`OpenAiCostExceededError`). Carrossel F-019 tem guard adicional **R$1 por geração** (ADR-006). Inspecionar `openai_cost_brl` em `news_pipeline_runs` — se sustentadamente > R$3, suspender e investigar.

## §10 Referências

- `src/app/api/news/cron/route.ts` — handler.
- `src/features/news/pipeline/orchestrator.ts` — `runPipeline()`.
- `docs/specs/spec-pipeline-ia.md` — RFs autoritativos.
- ADR-001 / ADR-003 / ADR-004 / ADR-005 / ADR-006 / ADR-007.
