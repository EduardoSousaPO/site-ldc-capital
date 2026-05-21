# Feature Contract — F-NNN: <nome curto>

> Obrigatório para B/C/D. Inline em `TODO.md` (preferido) ou aqui se ≥ 40 linhas (típico C/D).
> Template Harness v3.2 — site-ldc.

## Identificação

- **ID:** F-NNN
- **Nome:** <título>
- **Classe:** A | B | C | **D**
- **Cobre RF(s):** RF-XXX, RF-YYY (referência ao SPEC)
- **Branch:** `feat/F-NNN-slug` (B/C/D) | merge direto em `main` (A apenas)
- **CI alvo:** N1 | N2 | N3
- **Modo:** Standard | Deep Work | Production

## Objetivo

<1-3 frases — o que esta feature entrega e por quê.>

## Definition of Ready

- [ ] RFs vinculados (ou justificativa clara)
- [ ] CAs claros e testáveis
- [ ] Escopo **incluído** descrito
- [ ] Escopo **excluído** descrito
- [ ] Classe A/B/C/D confirmada (ver `risk-classification.md`)
- [ ] Arquivos prováveis de alteração listados
- [ ] Testes esperados (unit / integration / contract / e2e / smoke)
- [ ] Contratos Zod necessários (ou decisão explícita de que não)
- [ ] Dependências externas (OpenAI / Perplexity / Gemini / Supabase / Resend / Vercel Blob)
- [ ] Impacto em banco (tabelas tocadas, RLS, migration)
- [ ] Impacto em produção (staging, rollback, feature flag, cron)
- [ ] Anti-SPEC §6 revisada para conflitos

## Critérios de aceite

- **CA-001:** <texto>
- **CA-002:** <texto>
- **CA-003:** <texto>

## Escopo

**Incluído:** <listar>.

**Excluído:** <listar — proteção contra escopo crescer>.

## Arquivos

**Permitidos para alteração:**
- `src/...`
- `tests/...`

**NÃO podem ser alterados (qualquer alteração exige pausa):**
- `supabase/migrations/*` (a menos que esta feature seja D com migration plan)
- `.env*`
- `vercel.json`
- `src/features/news/compliance/*` (a menos que esta feature seja a compliance)
- Quaisquer arquivos fora da lista acima

## Contratos Zod

**A usar:** <referência>.
**A criar:** <Zod schema novo + onde mora>.

## Matriz teste → tipo → CA → arquivo

| Teste | Tipo | Cobre CA | Arquivo |
|---|---|---|---|
| `<nome>` | unit/integration/contract/e2e/smoke | CA-001 | `tests/.../<nome>.test.ts` |

## Comandos CI obrigatórios

```bash
npm run lint
npm run typecheck
npm test
# N2: + integration + contract + npm run build
# N3: + e2e + smoke + migration validation + preview deploy check
```

## Infra / Produção (só C/D)

- **Migration:** <arquivo + reversibilidade>
- **Env vars novas:** <lista + onde adicionar>
- **Feature flag:** <nome + default + critério de promoção>
- **Staging:** <plano de validação em staging>
- **Smoke test:** <comando ou checklist>
- **Rollback plan:** <passos exatos para reverter — obrigatório em D>

## Anti-SPEC §6 relevante

- §6.1 — Sem Anthropic SDK.
- §6.2 — Compliance CVM HARD.
- §6.2b — Bloomberg sinal interno.
- §6.3 — Disclaimer só em editorial completo.
- §6.4 — Sem polling.
- §6.5 — Validação Zod 100% em IO externo.
- §6.6 — Tabelas/endpoints intocáveis.
- §6.7 — Produção = classe D obrigatória.
- §6.8 — Submódulo Git.

## Matriz de validação (preenchida no QA — Prompt 3)

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-001 | `<nome>` | <tipo> | <passou/falhou/não coberto> | `<comando + saída>` |

## Gate de autonomia

- [ ] Lista de arquivos permitidos validada com Eduardo
- [ ] Cursor-brief criado se há classe D (em `docs/plans/cursor-brief.md`)
- [ ] Eduardo aprovou abertura do PR (não comitar/pushar sem ok)
