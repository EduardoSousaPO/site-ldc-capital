# Risk Classification — site-ldc

> Exemplos concretos do projeto. Use como referência ao classificar nova feature.
> Última atualização: 2026-05-20. Será populada com mais exemplos conforme features rodarem.

## Tabela canônica

| Classe | Definição | Exemplos no site-ldc |
|---|---|---|
| **A** | Trivial, sem contrato, sem efeito além da UI estática | Ajuste de copy do FAQ em `/equipe` · troca de cor de botão · typo em label · mudança de texto em rodapé · ajuste de tamanho de imagem em hero |
| **B** | CRUD/endpoint não crítico, contrato isolado | Novo CRUD em `/admin/materials` (categoria nova) · adicionar campo opcional em form de contato · novo CTA em `/blog` · adicionar nova rota MDX legacy em `/news` · novo componente Radix isolado |
| **C** | Auth, dados sensíveis, copy regulatória, contrato público | Mudança em `src/lib/auth-supabase.ts` · alteração de RLS em `BlogPost` · alteração de regra de compliance em `src/features/news/compliance/` · copy do disclaimer CVM em `/blog` · novo endpoint que lê `news_events.ip_hash` · refactor de `src/lib/dividend-tax/calculator.ts` (cálculo fiscal) · alteração em prompt de geração IA (afeta tom regulatório) |
| **D** | Produção, banco real, env, deploy, cron, IA externa, compliance | Nova rota `/api/news/*` com cron (Vercel) · migration em `news_pipeline_runs` ou `BlogPost` · rotação de `CRON_SECRET` · novo provedor IA (precisa rever ADR-001) · novo provider de email · alteração em `vercel.json` cron schedule · subir nova service account Google · feature toggle em `NEWS_PIPELINE_ENABLED` em produção · qualquer feature que toca `src/features/news/pipeline/orchestrator.ts` em prod |

## Desempates (ordem)

1. Toca produção / cron / banco real / env / deploy → **D**.
2. Toca auth, dados sensíveis (RLS, ip_hash), copy CVM, fluxo IA de produção → **C**.
3. Cria/altera contrato Zod ou rota pública → **mínimo B**.
4. Isolado, sem contrato, sem efeito além da UI estática → **A**.
5. Em dúvida, **suba**.

## Domínios automaticamente sensíveis (sempre ≥ C)

- `src/lib/auth-*.ts`
- `src/lib/supabase-server.ts`
- `src/features/news/compliance/`
- `src/features/news/pipeline/orchestrator.ts`
- `src/features/news/prompts/`
- `src/lib/dividend-tax/calculator.ts`
- `src/lib/wealth-planning/calculations.ts`
- Qualquer arquivo de copy regulatória CVM (disclaimer, termos, política)

## Domínios automaticamente D

- `supabase/migrations/`
- `vercel.json`
- `.env*`
- `src/app/api/news/cron/`
- `src/app/api/admin/bloomberg-pdfs/` (cron de cleanup)
- `src/app/api/admin/blog-carousels/` (cron de cleanup)
- `src/app/api/posts/cleanup-expired-tokens/`
- Qualquer endpoint chamado por cron Vercel
