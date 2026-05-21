# ADRs — site-ldc

> 7 ADRs estabelecidos. Local canônico desde Fase 6b (2026-05-21) — antes viviam em `docs/news/decisions/`, migrados via `git mv` (histórico via `git log --follow`).

## ADRs estabelecidos

| ADR | Tema | Arquivo |
|---|---|---|
| **ADR-001** | Stack IA — OpenAI + Perplexity + Gemini (proibido Anthropic) | [`./ADR-001-stack-ia-openai-perplexity.md`](./ADR-001-stack-ia-openai-perplexity.md) |
| **ADR-002** | Persistência MDX via GitHub API (legado pré-pivot) | [`./ADR-002-persistencia-mdx-github-api.md`](./ADR-002-persistencia-mdx-github-api.md) |
| **ADR-003** | Bloomberg sinal interno autoral | [`./ADR-003-bloomberg-sinal-interno.md`](./ADR-003-bloomberg-sinal-interno.md) |
| **ADR-004** | Compliance via guardrails técnicos | [`./ADR-004-compliance-via-guardrails-tecnicos.md`](./ADR-004-compliance-via-guardrails-tecnicos.md) |
| **ADR-005** | Pivot brevidade → artigo denso em BlogPost | [`./ADR-005-pivot-brevidade-para-artigo-denso-blog.md`](./ADR-005-pivot-brevidade-para-artigo-denso-blog.md) |
| **ADR-006** | Carrossel F-019 = X-mock screenshot | [`./ADR-006-pivot-carrossel-x-mock-screenshot.md`](./ADR-006-pivot-carrossel-x-mock-screenshot.md) |
| **ADR-007** | Disclaimer literal só em editorial completo | [`./ADR-007-compliance-disclaimer-estrategia.md`](./ADR-007-compliance-disclaimer-estrategia.md) |

## ADRs candidatos (em backlog)

Ver `docs/plans/DECISIONS_LOG.md` + `TODO.md §2 Backlog`:

- **ADR-008** — política de IP em formulários (`ip_hash` vs `ip_address` texto).
- **ADR-009** — política de role em `user_metadata.role` vs tabela `User` separada.
- **ADR-009b** — política de schema versionada (consolidação das 10 tabelas órfãs).
- **ADR-010** — política LGPD para `wealth_planning_*`.

## Quando criar um ADR novo

Crie `ADR-NNN-<slug>.md` neste diretório quando:
- Decisão técnica grande com tradeoff explícito.
- Provavelmente vai voltar ao debate.
- Bloqueia/desbloqueia múltiplas features.

Decisões pequenas / operacionais → `docs/plans/DECISIONS_LOG.md`.

Template sugerido: ver formato dos ADR-001..007 existentes.
