# Archive — site-ldc

> Documentos **datados** ou **snapshots históricos** preservados para auditoria. Não-operacionais.

## Propósito

Quando um documento legacy contém valor histórico (relatório com data explícita, status pontual, intervenção pontual já aplicada) mas **não tem encaixe vivo** em:

- `docs/product/PRD.md` (intenção atual)
- `docs/specs/SPEC.md` (comportamento atual)
- `docs/contracts/CONTRACTS.md` (contratos atuais)
- `docs/wiki/` (memória sintetizada viva)
- `docs/decisions/adr/` (decisões arquiteturais)
- `docs/plans/` (estado e templates vivos)

...ele vai para cá. Cada arquivo:

- Mantém **conteúdo congelado** (não atualizado).
- Tem **data explícita** no nome do arquivo (`<slug>-YYYY-MM[-DD].md`).
- Não recebe edição operacional pós-archive — apenas correção de link cruzado se outro doc apontar para ele.

## O que NÃO entra aqui

- Documento operacional vivo → vai para `docs/wiki/runbooks/` ou `docs/wiki/modules/`.
- Decisão arquitetural → vai para `docs/decisions/adr/`.
- Conteúdo já capturado em outro lugar do Harness v3.2 → não duplicar.

## Como referenciar

Quando um doc no `docs/wiki/` ou `docs/product/PRD.md` cita um archive, usar prefixo **"histórico (data):"** para sinalizar que é snapshot congelado:

> Histórico (Janeiro 2025): `docs/_archive/relatorio-sistema-admin-2025-01.md`.

## Conteúdo atual (snapshot 2026-05-21)

| Arquivo | Data original | Origem | Por que arquivado |
|---|---|---|---|
| `ARCHITECTURE-2026-05-21.md` | 2026-05-21 | `docs/ARCHITECTURE.md` (pré-Harness) | Conteúdo sobreposto com `wiki/architecture.md` vivo. Snapshot pré-Harness v3.2. |
| `relatorio-sistema-admin-2025-01.md` | Janeiro 2025 | `docs/relatorio_sistema_admin.md` | Relatório datado com checkmarks de status (pré-Harness). |
| `relatorio-seo-otimizacao-2025-01.md` | Janeiro 2025 | `docs/RELATORIO_SEO_OTIMIZACAO.md` | Relatório de SEO + recomendações datado. |
| `database-optimizations-2025-10.md` | 10/Out/2025 | `docs/database_optimizations.md` | Intervenção pontual (migrations de auto-fields já aplicadas). |

## Política de retenção

Indefinida. Arquivos em `docs/_archive/` permanecem para auditoria contínua. Caso futuramente cresçam demais, considerar mover para repositório separado de histórico.
