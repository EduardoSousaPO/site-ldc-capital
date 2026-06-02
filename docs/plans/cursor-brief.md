# Cursor Brief — `<F-NNN nome da feature>`

> **Template vazio.** Preencher só quando promovido pela próxima feature classe D que precisar de Cursor Agent (infra/MCP).
> Cursor Agent só entra com brief assinado por Eduardo. Sem este arquivo preenchido, Cursor não é acionado.
> Última atualização do template: 2026-05-21.

---

## §1 Identificação

- **Feature:** `F-NNN — <nome curto>`
- **Classe:** **D** (única classe que aciona Cursor — infra/MCP).
- **Data:** `<YYYY-MM-DD>`
- **PR / branch alvo:** `<feat/F-NNN-slug>`
- **Assinado por:** Eduardo (sem assinatura, Cursor não age).
- **Feature Contract base:** [`./feature-contracts/F-NNN.md`](./feature-contracts/F-NNN.md)
- **Modo:** Production (Harness v3.2 §14 Cenário C).

---

## §2 Contexto

> Cursor não conhece o projeto. Aponte o mínimo necessário; ele lê na ordem.

1. `AGENTS.md` — contrato universal + memórias-chave (anti-Anthropic + Bloomberg + submódulo Git).
2. `docs/plans/CURRENT_REALITY.md` — estado real do código + 10 tabelas órfãs + 7 bugs abertos.
3. `docs/specs/SPEC.md` §6 — **Anti-SPEC sagrada** (8 itens).
4. `docs/wiki/index.md` — mapa da memória sintetizada.
5. `docs/decisions/adr/ADR-NNN-*.md` — ADRs relevantes da feature (citar quais).
6. Runbook(s) operacional(is) aplicável(is) em `docs/wiki/runbooks/`.

**Por que Cursor (e não Claude Code direto):** `<infra/MCP específica que justifica — ex.: Supabase MCP para apply_migration em prod, deploy CLI, etc.>`

---

## §3 Tarefa

> 1-3 parágrafos. Inclua o output esperado e o critério objetivo de sucesso.

`<descrever>`

**Output esperado:** `<artefato concreto — ex.: migration aplicada em staging + smoke verde + PR aberto>`.
**Critério objetivo de sucesso:** `<CA da Feature Contract — ex.: CA-NNN passou com evidência X>`.

---

## §4 Limites

### Arquivos permitidos (toda alteração aqui)

- `<lista exata — ex.: supabase/migrations/<TS>_<nome>.sql + _down.sql>`
- `<arquivo Y>`

### Arquivos **proibidos** (qualquer alteração exige pausa imediata)

- Tudo fora da lista acima.
- `src/features/news/prompts/*` — congelado (ADR-007).
- `.env*` — não tocar (rotação via Vercel UI, ver `docs/wiki/runbooks/secrets-rotation.md`).
- `vercel.json` — congelado fora de Feature Contract dedicado.

### Anti-SPEC §6 aplicável a esta feature

`<citar itens específicos — ex.: §6.1 Anthropic, §6.2 CVM HARD, §6.2b Bloomberg, §6.4 sem polling, §6.5 Zod 100%, §6.6 tabelas intocáveis, §6.7 produção = D, §6.8 submódulo Git>`.

Em caso de conflito com qualquer item de §6 → `BLOQUEADO`, voltar a Eduardo.

---

## §5 Rollback Plan (OBRIGATÓRIO)

> Sem rollback claro, o brief NÃO sai. Cursor recusa sem este bloco preenchido.

1. **Reverter código:** `<git revert <SHA> + push, ou Vercel rollback via UI — ver docs/wiki/runbooks/rollback-vercel.md>`.
2. **Reverter banco (se aplicável):** `<aplicar migration *_down.sql via Supabase MCP ou Studio>`.
3. **Reverter env (se aplicável):** `<env vars atualizadas em Vercel; reverter via UI + redeploy último build estável>`.
4. **Janela de detecção:** `<5 min após deploy? 1h? 24h?>`. Após este prazo, considerar rollback como "correção em hotfix" e não revert direto.
5. **Quem aciona:** `<Eduardo / Cursor sob aprovação>`.
6. **Comando de validação pós-rollback:** `<curl -sI <endpoint> | head -1 → esperar 200/404 conforme caso>`.

---

## §6 Staging

> Antes da produção, validação obrigatória em staging.

1. **Como provisionar staging:** `<Supabase MCP create_branch + apply_migration; OU Vercel preview deploy + envs de preview>`.
2. **Smoke em staging:** `<lista de comandos exatos com URLs preview>`.
3. **Critério para promover para produção:** `<todos os smokes em staging verdes + Anti-SPEC §6 checada + Eduardo OK>`.
4. **Cleanup staging pós-promoção:** `<Supabase MCP merge_branch ou delete_branch após Eduardo confirmar>`.

---

## §7 Smoke (pós-execução em produção)

> Comandos exatos. Cursor cola output literal no PR ou no relatório de fechamento.

```bash
# Exemplo — adaptar por feature
curl -sI https://ldccapital.com.br/<endpoint> | head -1   # esperar 200
curl -sX POST https://ldccapital.com.br/api/<rota> -H "Authorization: Bearer $CRON_SECRET" | head -c 200
# Validação Supabase
mcp__supabase__execute_sql production "select count(*) from <tabela> where ..."
```

**Critério de sucesso do smoke:** `<exit code 0 em todos os comandos + saída esperada de cada um>`.
**Em caso de falha:** abortar; acionar §5 Rollback; registrar `INCIDENT` em `docs/wiki/log.md`.

---

## §8 Regras invariantes

- **Submódulo Git** — operações versionadas SEMPRE dentro de `site-ldc/site-ldc/` (ver `AGENTS.md §13`). Wrapper só atualiza ponteiro. Nunca `git submodule update --remote` sem aprovação.
- **Sem `--no-verify`** em commits (`AGENTS.md §14`).
- **Sem `git push --force` em main/master.**
- **CI N1 verde obrigatório** antes de promover staging → produção.
- **Validation Matrix preenchida** com evidência objetiva em todos os CAs (`docs/plans/VALIDATION-MATRIX-template.md`).
- **Linha em `docs/wiki/log.md` tipo `RELEASE`** após deploy verde — sem isso a feature D não fecha (regra `AGENTS.md §2.12`).

---

## §9 Fechamento

Cursor entrega ao final:
1. SHA do commit + URL do PR.
2. Output dos comandos de smoke.
3. Evidência objetiva por CA na Validation Matrix.
4. Linha proposta para `docs/wiki/log.md` (`RELEASE`).
5. Resumo ≤ 30 linhas para `docs/wiki/features/F-NNN.md` (pós-merge).
