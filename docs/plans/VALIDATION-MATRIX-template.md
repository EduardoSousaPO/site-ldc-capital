# Validation Matrix — Template (Prompt 3 / QA)

> Obrigatório para B/C/D. Sem evidência objetiva → `MUDANÇAS_SOLICITADAS`. Nunca `APROVADO` sem evidência.
> Harness v3.2 — site-ldc.

## Cabeçalho

- **Feature:** F-NNN — <nome>
- **Classe:** A | B | C | D
- **PR / branch:** <link / nome>
- **Data do QA:** YYYY-MM-DD
- **Revisor:** Claude Code (auto-QA) + Eduardo (humano em C/D)

## Matriz

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-001 | `<arquivo::nome_do_teste>` | unit | passou | `npm test -- <padrão>` log com `✔ passed` |
| CA-002 | `<arquivo::nome>` | integration | passou | mesma saída + assertions visíveis |
| CA-003 | `<arquivo::nome>` | contract | passou | Zod schema match log |
| CA-004 | `<arquivo::nome>` | e2e | passou | Playwright report (link) |
| CA-005 | N/A | smoke (só D) | passou | script exit 0 |

## Critérios de evidência válida

✅ **Conta como evidência:**
- Saída de `npm test` com nome de teste e `✔ passed`.
- Playwright report linkado.
- CI log com `✔ passed` no nível da classe.
- Migration aplicada em staging com `select` mostrando estrutura nova.
- Smoke script com exit code 0.

❌ **NÃO conta:**
- "O código parece correto."
- "Eu testei manualmente." (sem print/log)
- Teste com `.skip` ou `.only`.
- Cobertura genérica sem amarração ao CA.
- Print de CI verde sem o teste nominal aparecendo.

## Anti-SPEC §6 — checklist final

- [ ] §6.1 — Nenhum import de `@anthropic-ai/sdk` introduzido.
- [ ] §6.2 — Compliance CVM verificado (sem ticker, recomendação, promessa, prescrição).
- [ ] §6.2b — Bloomberg não citado em nenhum output (defense in depth verificado).
- [ ] §6.3 — Disclaimer literal apenas em editorial completo (não em slide/caption).
- [ ] §6.4 — Sem polling introduzido (cron Vercel é único trigger temporal).
- [ ] §6.5 — Validação Zod 100% em todo IO externo da feature.
- [ ] §6.6 — Tabelas/endpoints intocáveis preservados (ou migration plan aprovado).
- [ ] §6.7 — Classe D tem staging + rollback + smoke documentados.
- [ ] §6.8 — Operação no submódulo (não no wrapper).

## Decisão

- [ ] **APROVADO** — todos os CAs com evidência objetiva. CI verde no nível da classe. Anti-SPEC §6 limpa.
- [ ] **MUDANÇAS_SOLICITADAS** — pelo menos 1 CA sem evidência ou Anti-SPEC com risco identificado.
- [ ] **BLOQUEADO** — conflito objetivo (CI vermelho persistente, ambiguidade em produção, autorização humana necessária).

## Notas pós-merge (se APROVADO)

- [ ] Linha em `docs/wiki/log.md` tipo `RELEASE`
- [ ] Resumo ≤ 30 linhas em `docs/wiki/features/F-NNN.md` (C/D)
- [ ] Context Pack deletado de `docs/wiki/context/F-NNN.md`
- [ ] `docs/wiki/modules/<mod>.md` atualizado se aplicável
- [ ] Runbook criado/atualizado se feature gera operação recorrente
