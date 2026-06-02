# AGENTS.md — Contrato com agentes (Harness v3.2)

> Versão: 3.2 — Project Wiki + Fast Fix. Escopo: dev solo, 1 agente gerador.
> Última atualização: 2026-05-20.

Toda sessão começa lendo, nesta ordem: `docs/wiki/index.md` → este arquivo → `CLAUDE.md` (se Claude Code) → `TODO.md` → Feature Contract da tarefa.

---

## 1. Papéis

| Agente | Função | Quando entra |
|---|---|---|
| **Claude Code** | Gerador principal. Lê SPEC/Anti-SPEC/contratos, implementa, abre PR. | Default em toda feature. |
| **Codex** | Continuidade quando Claude esgota tokens. Lê `wiki/context/F-NNN.md`. | Mid-feature handoff. |
| **Cursor Agent** | Infra/MCP de classe D (deploy, env, migration) sob `cursor-brief.md`. | Apenas se Eduardo explicitar. |
| **CI (GitHub Actions)** | Avaliador independente. Gerador ≠ avaliador. | Toda push/PR. |
| **Eduardo (humano)** | Decisor único. Aprova classe D, Anti-SPEC e ADRs. | Sempre que `BLOQUEADO`. |

**Princípio:** gerador e avaliador são separados. CI é a única autoridade técnica que aprova merge.

---

## 2. Princípios não-negociáveis

1. Estado único: `TODO.md` + `git log`. Sem `state/`, `progress.jsonl`, `handoffs/`, `AGENT-BRIEFS/`.
2. Feature é a unidade. Nunca task atômica.
3. Contrato é código: Zod em `packages/shared/types/` (alvo) ou `src/features/*/contracts/` (hoje). `CONTRACTS.md` é espelho legível.
4. Anti-SPEC §6 é sagrada (ver `docs/specs/SPEC.md`). Não alterável sem autorização humana.
5. CI verde no nível da classe = condição de merge.
6. Produção exige staging + rollback + smoke. Classe D, não negociável.
7. Wiki é memória sintetizada, **NUNCA** fonte de verdade.
8. Fast Fix é exceção justificada, não norma.
9. Toda feature B/C/D termina com 1 linha em `docs/wiki/log.md`.
10. Suba a classe em dúvida. Nunca desça.

---

## 3. Classificação de risco A/B/C/D

| Classe | Definição | Exemplos no site-ldc | CI alvo | Cerimônia |
|---|---|---|---|---|
| **A** | Trivial, sem contrato | Ajuste de copy em FAQ, cor de botão, typo em label `/equipe` | N1 | TODO inline + commit |
| **B** | CRUD/endpoint não crítico | Novo CRUD em `/admin/materials`, novo campo em form de contato, nova rota MDX em `/news` legacy | N1 + matriz | DoR + Feature Contract inline + branch `feat/*` |
| **C** | Auth, dados sensíveis | Mudança em `auth-supabase.ts`, RLS de `BlogPost`, novo endpoint que lê `news_events.ip_hash`, copy regulatória CVM | N2 | Feature Contract detalhado + Validation Mode + revisão humana sugerida |
| **D** | Produção, banco real, env, deploy, cron, IA externa | Nova rota `/api/news/*` com cron, migration em `news_pipeline_runs`, rotação de `CRON_SECRET`, novo provedor IA, mudança em prompt de compliance, deploy real | N3 | Feature Contract + cursor-brief + rollback + staging + smoke + feature flag |

**Desempates (ordem):**
1. Toca produção/cron/banco real/env → D.
2. Toca auth, dados sensíveis, copy CVM, fluxo IA → C.
3. Cria/altera contrato Zod ou rota pública → mínimo B.
4. Isolado sem contrato → A.
5. Em dúvida, suba.

Referência completa: `docs/plans/risk-classification.md`.

---

## 4. Definition of Ready (DoR)

Feature B/C/D não entra em execução com DoR incompleta. Em domínio sensível (auth, pagamento, dados, produção) → `BLOQUEADO — DEFINITION OF READY INCOMPLETA`.

- [ ] RFs vinculados (ou justificativa).
- [ ] CAs claros e testáveis.
- [ ] Escopo **incluído** descrito.
- [ ] Escopo **excluído** descrito.
- [ ] Classe A/B/C/D confirmada.
- [ ] Arquivos prováveis listados.
- [ ] Testes esperados (unit/integration/contract/e2e/smoke).
- [ ] Contratos Zod necessários (ou decisão de que não).
- [ ] Dependências externas.
- [ ] Impacto em banco (Supabase tables + RLS).
- [ ] Impacto em produção (staging, rollback, feature flag).

Onde vive: inline no item do `TODO.md`, junto com o Feature Contract.

---

## 5. Feature Contract

Obrigatório para B/C/D. Template: `docs/plans/FEATURE-CONTRACT-template.md`.

**Campos:** ID · nome · risco · cobre RF(s) · branch · CI alvo · objetivo · DoR · CAs · escopo incluído/excluído · arquivos permitidos/proibidos · contratos Zod · matriz teste→tipo→CA→arquivo · comandos CI · infra/produção (só C/D: migration, env, staging, feature flag, **rollback plan**) · Anti-SPEC relevante · matriz de validação (preenchida no QA) · gate de autonomia.

Onde vive:
1. **Preferência:** bloco inline no `TODO.md`.
2. Alternativa: `docs/plans/feature-contracts/F-NNN.md` se passar de ~40 linhas (típico C/D).

---

## 6. Gates de autonomia

Claude Code pode agir sozinho dentro destes limites. Fora deles, **PAUSE** e reporte.

| Ação | A | B | C | D |
|---|---|---|---|---|
| Editar arquivos listados no Feature Contract | ✅ | ✅ | ✅ | ✅ |
| Editar arquivo fora da lista | PAUSE | PAUSE | PAUSE | PAUSE |
| Rodar `npm run lint`, `npm run typecheck`, `npm test` | ✅ | ✅ | ✅ | ✅ |
| Rodar `npm run build` | ✅ | ✅ | ✅ | ✅ |
| `git add` / `git commit` | PAUSE | PAUSE | PAUSE | PAUSE |
| `git push` | PAUSE | PAUSE | PAUSE | PAUSE |
| Criar PR | PAUSE | PAUSE | PAUSE | PAUSE |
| Tocar arquivos em `supabase/migrations/` | PAUSE | PAUSE | PAUSE | PAUSE |
| Tocar `.env*` | PAUSE | PAUSE | PAUSE | PAUSE |
| Rodar scripts de seed/migration localmente | PAUSE | PAUSE | PAUSE | PAUSE |
| Acionar cron/endpoint de produção | BLOQUEADO | BLOQUEADO | BLOQUEADO | BLOQUEADO |

**Regra de ouro:** Claude Code **nunca** comita, faz push, abre PR ou executa scripts que tocam produção sem aprovação explícita de Eduardo nesta sessão. Aprovação dada em sessão A NÃO vale para sessão B.

---

## 7. Estados de retorno

| Estado | Significado | Quando usar |
|---|---|---|
| **CONTINUE** | Vou para o próximo passo dentro dos limites do contrato. | Sucesso do passo atual. |
| **PAUSE** | Estou parando para você revisar ou aprovar. | Fim de fase, ação fora do gate de autonomia, dúvida operacional. |
| **BLOQUEADO** | Não consigo prosseguir sem decisão humana. | DoR incompleta em domínio sensível, conflito com Anti-SPEC, falta de evidência objetiva, CI vermelho persistente, ambiguidade em produção. |

Sempre que retornar `BLOQUEADO`, descreva: (a) o conflito objetivo, (b) 2 opções com tradeoff, (c) o que você precisa para destravar.

---

## 8. Project Wiki (`docs/wiki/`)

Memória sintetizada viva entre fontes brutas (logs, prints, decisões, transcripts) e os agentes.

**Páginas:**

| Página | Conteúdo | Limite |
|---|---|---|
| `wiki/index.md` | Mapa principal — primeira leitura | ≤ 80 linhas |
| `wiki/log.md` | Histórico cronológico (INGEST/SETUP/RELEASE/BUGFIX) | ≤ 200 linhas |
| `wiki/overview.md` | Projeto em 1 página | ≤ 150 linhas |
| `wiki/architecture.md` | Arquitetura técnica viva | ≤ 150 linhas |
| `wiki/modules/<mod>.md` | Memória por área | ≤ 200 linhas |
| `wiki/features/<F-NNN>.md` | Resumo de 1 parágrafo após merge (C/D) | ≤ 30 linhas |
| `wiki/runbooks/<slug>.md` | Receitas operacionais | ≤ 150 linhas |
| `wiki/context/<F-NNN>.md` | Context Pack descartável | ≤ 150 linhas |

**Cadência:**
- Toda feature B/C/D termina com 1 linha em `wiki/log.md`.
- Antes de handoff entre agentes: `/wiki context F-NNN`.
- A cada 2-4 semanas ou antes de release: `/wiki lint`.

**Anti-padrões:** editar `architecture.md` para "caber" a feature (ajuste SPEC primeiro), `/wiki lint` antes de cada microtarefa, wiki virar diário.

---

## 9. Fast Fix (`/fast-fix`)

Bug urgente classe A/B sem domínios sensíveis, < 30 min. Gates duros:

| Gate | Se falha |
|---|---|
| Toca auth/payment/dados sensíveis | SAIR — escalar |
| Toca migration, env, deploy, cron, RLS | SAIR — Production |
| Diff > 50 linhas ou > 3 arquivos | SAIR |
| Tempo > 30 min | SAIR |
| Sem teste reproduzindo | SAIR |
| ≥ 2 ocorrências passadas | SAIR — Deep Work |

Termina com: linha em `wiki/log.md` tipo `BUGFIX` + runbook se bug capaz de voltar.

---

## 10. ADRs estabelecidos (não rediscutir sem autorização)

Todos em `docs/decisions/adr/`.

- **ADR-001 — Stack IA OpenAI + Perplexity + Gemini.** Proibido Anthropic SDK.
- **ADR-002 — Persistência MDX via GitHub API.** Legado `/news`; pivot atual usa Supabase BlogPost (ver ADR-005).
- **ADR-003 — Bloomberg sinal interno autoral.** PDF nunca citado, defense in depth.
- **ADR-004 — Compliance via guardrails técnicos.** Zod refines + runComplianceCheck multi-camada.
- **ADR-005 — Pivot brevidade para artigo denso em BlogPost.** F-007/F-008 escrevem direto em Supabase.
- **ADR-006 — Carrossel F-019 = X-mock screenshot.** SlideTweet.tsx + 2 variações + DALL-E 3 hero + guard R$1,00.
- **ADR-007 — Disclaimer literal só em editorial completo.** Social media via guardrails multi-camada; threshold UHNW R$1M.

---

## 11. Memórias-chave (verdade do projeto)

1. **Anti-Anthropic:** proibido importar `@anthropic-ai/sdk` ou similar. Stack travada (ADR-001).
2. **Bloomberg sinal interno:** PDF é input privado autoral. Nunca citar como fonte. Defense in depth obrigatório (ADR-003).
3. **Working dir aninhado:** repo Git real em `site-ldc/site-ldc/`. Wrapper acima só tem manual e `.claude/`.
4. **Submódulo Git:** o repo é submódulo dentro do wrapper. Operações versionadas acontecem DENTRO do submódulo; o wrapper só atualiza o ponteiro.
5. **OpenAI Structured Outputs:** `.url()`, `.uuid()`, `.optional()` quebram `zodResponseFormat`. Usar schema relaxado e re-validar com schema estrito após a chamada.
6. **Supabase-js v2 multi-table TS bug:** Tables com >1 entrada colapsam Insert para `never`. Isolar em cliente untyped + helpers tipados (ver `src/lib/supabase-storage-admin.ts`).
7. **Gemini Flash free tier:** 20 RPD. Produção precisa billing habilitado.
8. **CVM 3976-4:** consultoria de patrimônio com risco regulatório existencial. Qualquer feature de conteúdo IA = classe C/D.
9. **next.config.ts ignora ESLint no build** (`ignoreDuringBuilds: true`). Dívida explícita; lint local é obrigatório.

---

## 12. CI por níveis

| Nível | Scripts | Obrigatório para |
|---|---|---|
| **N1** | `npm run lint` · `npm run typecheck` · `npm test` | A, B, Fast Fix |
| **N2** | N1 + integration tests + contract tests + `npm run build` | B relevante, C |
| **N3** | N2 + e2e + smoke + migration validation + preview deploy check | C crítica, D |

Hoje só **N1 está ativo** em `.github/workflows/ci.yml`. N2/N3 estão comentados como TODO até features futuras justificarem.

---

## 13. Submódulo Git — protocolo

O repo `site-ldc/` é submódulo Git dentro do wrapper `Projetos_App_Desktop/site-ldc/`. Implicações:

- Toda mudança versionada acontece **dentro** de `site-ldc/site-ldc/`.
- `git status` no wrapper mostra " M site-ldc" indicando ponteiro de submódulo modificado.
- Para commitar mudança: `cd site-ldc && git add ... && git commit ... && git push`. Depois, no wrapper: `git add site-ldc && git commit -m "update submodule pointer"`.
- **NUNCA** rode `git submodule update --remote` sem aprovação — pode reverter trabalho local.

Em dúvida → PAUSE.

---

## 14. Antipadrões

- "TODO.md só na cabeça hoje" → não.
- "Refactor preventivo porque o código está feio" → não. Refactor por oportunidade dentro de Feature Contract.
- "Classe B mas começou a tocar produção" → reclassifique ANTES de continuar.
- "Classe D sem rollback, só dessa vez" → bloqueia no Prompt 3.
- "Mexi num arquivo fora da lista porque estava no caminho" → BLOQUEADO sem justificativa.
- "Vou usar Fast Fix nesse bug de auth/pipeline IA" → escalar, sempre.
- "Aprovar PR sem matriz" → proibido para B/C/D.
- "Editar Anti-SPEC para caber a feature" → pause e confirme com humano.
- "Esqueci de atualizar `wiki/log.md`" → feature B/C/D não fecha.
- "Edito `wiki/architecture.md` para caber a feature" → ajuste SPEC primeiro.
- "Aprovar PR de classe D sem staging" → bloqueia no Prompt 3.
- "Importar Anthropic SDK temporariamente" → BLOQUEADO. ADR-001 é trava física.
- "Citar Bloomberg porque foi onde a informação veio" → BLOQUEADO. ADR-003 é absoluta.

---

## 15. Referências rápidas

| Preciso de... | Vai em... |
|---|---|
| Mapa da memória sintetizada | `docs/wiki/index.md` |
| Histórico vivo | `docs/wiki/log.md` |
| Context Pack reusável entre agentes | `docs/wiki/context/F-NNN.md` |
| Runbook operacional | `docs/wiki/runbooks/<slug>.md` |
| Resumo da feature após merge | `docs/wiki/features/F-NNN.md` |
| Estado atual + Feature Contract inline | `TODO.md` |
| O quê e por quê (site inteiro) | `docs/product/PRD.md` |
| RFs + CAs + Anti-SPEC | `docs/specs/SPEC.md` |
| Contratos legíveis | `docs/contracts/CONTRACTS.md` |
| Contratos executáveis | `src/features/*/contracts/` + `packages/shared/types/` (consolidação futura) |
| Estado real do repo | `docs/plans/CURRENT_REALITY.md` |
| Decisão arquitetural | `docs/decisions/adr/` |
| Decisão operacional recorrente | `docs/plans/DECISIONS_LOG.md` |
| Anexo SPEC do pipeline IA | `docs/specs/spec-pipeline-ia.md`, `docs/contracts/contracts-pipeline-ia.md`, `docs/decisions/adr/*` |
| Feature contracts | `docs/plans/feature-contracts/F-007,F-008,F-019` |
| Snapshots históricos (não-operacionais) | `docs/_archive/README.md` + arquivos datados |
