# CLAUDE.md — Ajustes específicos do Claude Code (Harness v3.2)

> Última atualização: 2026-05-20.

## Leitura inicial obrigatória (toda sessão)

Nesta ordem, antes de tocar qualquer arquivo:

1. `docs/wiki/index.md` — mapa da memória sintetizada.
2. `AGENTS.md` — contrato universal de agentes (papéis, classes, gates, Anti-SPEC pointer).
3. Este arquivo (`CLAUDE.md`).
4. `TODO.md` — estado vivo + Feature Contract inline da tarefa atual.
5. Feature Contract da tarefa (inline em `TODO.md` ou em `docs/plans/feature-contracts/F-NNN.md`).
6. `docs/wiki/context/F-NNN.md` se a tarefa veio de outro agente.
7. `docs/wiki/log.md` últimos 30 dias se contexto histórico relevante.

Se está vazio, leia `docs/plans/CURRENT_REALITY.md` para entender o estado real do código.

---

## Memórias-chave do projeto (não esquecer)

1. **Anti-Anthropic absoluto.** Nunca importe `@anthropic-ai/sdk` ou similar. Stack IA é OpenAI GPT-5-mini + Perplexity Sonar Pro + Gemini 2.5 (ADR-001).
2. **Bloomberg é sinal interno autoral.** PDFs Bloomberg via email são input privado. Jamais citar como fonte (ADR-003).
3. **Layout aninhado.** Working dir do repo Git real é `site-ldc/site-ldc/`. O wrapper acima só tem o manual `.claude/`. Todos os paths absolutos começam de `C:/Users/edusp/Projetos_App_Desktop/site-ldc/site-ldc/`.
4. **Submódulo.** O repo é submódulo Git. Não rode `git submodule update --remote` sem aprovação.
5. **CVM 3976-4.** Qualquer feature de conteúdo IA = classe C/D. Anti-SPEC §6 é sagrada.

---

## Stack técnica resumida

- **Framework:** Next.js 15.5 (App Router) + React 19 + TypeScript 5 (strict).
- **Styling:** Tailwind 4 + Radix UI + shadcn (`components.json`).
- **Path alias:** `@/*` → `src/*`.
- **DB:** Supabase (Postgres + Auth + Storage). Migrations em `supabase/migrations/` (7 hoje).
- **Hospedagem:** Vercel. Cron jobs em `vercel.json` (5 jobs ativos).
- **IA:** OpenAI (`openai@6`), Perplexity (HTTP direto), Gemini (`@google/generative-ai@0.24`).
- **Storage de PDFs/imagens:** Vercel Blob + Supabase Storage (bucket `ldc-assets`).
- **Testes:** Vitest 4. Arquivos em `src/**/__tests__/**/*.test.{ts,tsx}` ou `src/**/*.test.{ts,tsx}`. Exclui `wealth-planning` (pasta órfã na raiz, não confundir com `src/lib/wealth-planning/`).

---

## Comandos canônicos

```bash
npm run lint        # ESLint (next config)
npm run typecheck   # tsc --noEmit
npm test            # vitest run (CI mode)
npm run test:watch  # vitest interativo
npm run build       # next build (ignora erros de ESLint por ADR; lint local é obrigatório)
npm run dev         # next dev (porta 3000)
```

**N1 CI = lint + typecheck + test.** Build é local para debug; CI não roda build hoje.

---

## Estados de retorno (resumo)

- **CONTINUE** — vou para o próximo passo, dentro do contrato.
- **PAUSE** — pare para revisar ou aprovar (fim de fase, ação fora do gate).
- **BLOQUEADO** — preciso de decisão humana. Descreva conflito + 2 opções + o que destrava.

Aprovação dada em sessão A **não vale** para sessão B. Toda nova sessão começa lendo este arquivo.

---

## Ações que **sempre** exigem PAUSE / aprovação explícita

- `git add` / `git commit` / `git push` / `git mv` / `git rebase` / `git submodule update`.
- Criar/atualizar PR via `gh`.
- Editar `.env*`, `supabase/migrations/`, `vercel.json`, `next.config.ts`, `tsconfig.json`.
- Rodar `npm run db:seed`, `npm run admin:sync-users`, `setup-sheets`, qualquer script em `scripts/` que toque banco/Sheets/email.
- Acionar manualmente endpoints `/api/admin/*`, `/api/news/cron`, ou qualquer rota que escreva em produção.
- Tocar arquivos fora da lista do Feature Contract.

---

## Anti-padrões específicos para o Claude Code aqui

- **"Vou só commitar rapidinho para ver se passa no CI."** Não. Eduardo aprova cada commit.
- **"O lint está reclamando, vou desabilitar a regra."** Não. Corrija ou pause.
- **"Esse mock fica mais rápido que IT real."** Em rota de produção, IT > mock.
- **"Esse `as any` resolve o tipo."** Pause. Provavelmente é o bug Supabase-js v2 multi-table — use cliente untyped + helper tipado.
- **"OpenAI Structured Outputs aceita `.url()`."** Não. Schema relaxado + re-validação estrita após call.
- **"Vou clonar a credencial Google em outro arquivo para testar."** BLOQUEADO. Credencial no histórico Git já é dívida de segurança ativa (TODO §5).

---

## Apontadores essenciais

- Regras universais de agente → `AGENTS.md`.
- Anti-SPEC §6 sagrada → `docs/specs/SPEC.md` §6.
- Feature Contract template → `docs/plans/FEATURE-CONTRACT-template.md`.
- Risk classification (exemplos do projeto) → `docs/plans/risk-classification.md`.
- Estado real do código → `docs/plans/CURRENT_REALITY.md`.
- Anexo SPEC do pipeline IA (autoritativo) → `docs/specs/spec-pipeline-ia.md`, `docs/contracts/contracts-pipeline-ia.md`, `docs/decisions/adr/ADR-001..007.md`.
- Snapshots históricos (não-operacionais) → `docs/_archive/` (sem editar; referências prefixadas com "histórico (data):").

Em qualquer dúvida estratégica → PAUSE.
