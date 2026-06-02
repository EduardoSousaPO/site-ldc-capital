# ADR-004 — Compliance CVM 100% via guardrails técnicos (sem parecer jurídico no go-live)

- **Status:** aceito (com risco residual reconhecido)
- **Data:** 2026-04-27
- **Autor:** Eduardo Sousa (decisão explícita), formalizado por Claude
- **Substitui:** —

---

## Contexto

A `/news` é uma publicação editorial diária com risco regulatório real:
- **Resolução CVM 19/2021** — recomendação personalizada de investimento exige consultor CVM autorizado.
- **Resolução CVM 20/2021** — análise de valores mobiliários (CNPI) tem requisitos próprios.
- **Resolução CVM 21/2021** — agente autônomo / assessor.

A LDC Capital tem habilitação CVM 3976-4 como consultoria. A `/news` precisa se posicionar como **publicação editorial e analítica** (caminho "publisher" — precedente Empiricus 2018), não como recomendação personalizada nem análise de valores mobiliários.

O conceito original (CONCEITO_NEWS_LDC.md §9.A) recomendava:
> "Antes de publicar o primeiro briefing: passar concept + 5 briefings de exemplo por advogado de mercado de capitais (Mattos Filho, BMA, Demarest, Veirano ou boutique). Custo estimado parecer one-time: R$ 5-15k."

Eduardo, em mensagem de 2026-04-27, **removeu explicitamente esse requisito**:
> "pode retirar esse requisito, quero o mais simples possível e eficaz no início para colocar para rodar rápido"

## Decisão

**Compliance CVM da `/news` v1 é garantido 100% por guardrails técnicos + revisão humana, sem parecer jurídico prévio.** Parecer jurídico fica como recomendação opcional para v2 (após validar tração e antes de qualquer expansão de escopo, ex.: comentar ativos individuais).

**Guardrails técnicos obrigatórios (defense in depth, 6 camadas):**

1. **Schema Zod com refine** rejeita Bloomberg como fonte (3 schemas: `FonteCitavel`, `PerplexityCitation`, `PerplexityQuery`).
2. **Regex de bloqueio de tickers nominais BR/US** (`/\b[A-Z]{4}\d{1,2}\b/`, lista de ADRs comuns) → status `blocked_compliance`.
3. **Lista negra de frases prescritivas** ("compre", "venda", "vai subir", "rentabilidade garantida", etc.) → status `blocked_compliance`.
4. **Regex de promessa de retorno** (`/% [a-z]* (de retorno|garantido|certo)/i`) → bloqueio.
5. **Revisão humana 100% no Marco 1** — Eduardo aprova individualmente cada briefing antes de publicação. Sample 30% após estabilização.
6. **Disclaimer fixo CVM** no rodapé de todo briefing (texto exato em `src/features/news/constants/disclaimers.ts`):
   > "Conteúdo informativo e analítico. Não constitui recomendação personalizada de investimento conforme Resolução CVM 19/2021."

**Princípios editoriais (Anti-SPEC §6.2):**
- Voz "Editorial LDC" (anônima institucional) — não assina Luciano direto.
- Análise informacional macro, nunca prescrição operacional.
- "Carteira Estratégia LDC" mencionada só como referência ao método, com link para "saiba mais → consultoria CVM".
- Sem promessa de retorno em qualquer hipótese.

## Alternativas consideradas

- **A — Parecer jurídico Mattos Filho/BMA antes de go-live (proposta original do conceito):**
  - Prós: zero risco regulatório residual; tranquilidade jurídica; documento defensável em fiscalização CVM.
  - Contras: custo R$ 5-15k one-time; trava go-live por 2-4 semanas (tempo de revisão jurídica); over-engineered para v1 que tem volume baixo de leitores.
  - **Por que não (decisão Eduardo):** prioridade é go-live rápido para validar formato. Investir R$5-15k em parecer antes de saber se o produto pega audiência é prematuro.

- **B — Sem nenhum guardrail, confiando só na revisão humana do Eduardo:**
  - Prós: simplicidade máxima.
  - Contras: humanos erram; um ticker que escapa = exposição real CVM; não escala.
  - **Por que não:** ingênuo. Guardrails técnicos são "free" para implementar e pegam o que humano erra.

- **C — Apenas guardrails técnicos, sem revisão humana 100% no Marco 1:**
  - Prós: pipeline 100% automatizado.
  - Contras: a IA não sabe de tudo; falsos negativos da regex acontecem; conteúdo regulatório precisa de olho humano até estabilizar estilo.
  - **Por que não:** prematuro. Marco 1 é validação. Revisão humana 100% até semana 4 de produção.

## Consequências

### Positivas
- **Go-live em 5 semanas** (vs ~9 semanas com parecer jurídico).
- **Economia de R$ 5-15k** que pode ser reinvestida em conteúdo / divulgação.
- **6 camadas de defesa** = improvável que erro grave passe.
- **Disclaimer fixo + voz "Editorial LDC"** posicionam a `/news` como publicação editorial (caminho Empiricus 2018) — não recomendação personalizada.

### Negativas / trade-offs (RISCO RESIDUAL EXPLÍCITO)
- **Risco regulatório CVM existe**, ainda que mitigado. Cenário ruim: CVM abre processo administrativo se interpretar algum briefing como recomendação personalizada não autorizada.
  - Probabilidade: BAIXA (publicação editorial macro, sem ativos individuais, com disclaimer claro).
  - Impacto: ALTO (multa + dano reputacional + suspensão temporária da `/news`).
  - Mitigação adicional aceita: **Eduardo se compromete a, ao primeiro sinal de questionamento CVM, suspender publicações e contratar parecer reativo**.
- **Sem cobertura jurídica formal** caso surja questionamento — defesa precisa ser construída do zero.
- **Lista negra de regex precisa ser mantida** — novos termos prescritivos surgem; auditoria mensal recomendada.

### Neutras
- O parecer jurídico permanece como recomendação opcional v2, gatilho sugerido: tração estável + decisão de citar ativos individuais + decisão de monetizar diretamente a `/news`.
- Cada briefing carrega `cvm_disclaimer_version: "1.0"` no frontmatter — se o disclaimer mudar (ex.: nova resolução CVM), versão sobe e briefings antigos podem ser identificados.

## Referências

- SPEC `docs/specs/spec-pipeline-ia.md` §0 D-09, D-11, RF-008, RNF-002, §6.2 (Anti-SPEC), CB-014
- CONTRACTS `docs/contracts/contracts-pipeline-ia.md` §2 (Compliance), §1 (FonteCitavel refine)
- Conceito `CONCEITO_NEWS_LDC.md` §9 e §9.A (proposta original com parecer)
- Mensagem Eduardo 2026-04-27 (remoção explícita do requisito de parecer)
- Precedente Empiricus 2018: https://www.arenadopavini.com.br/arena-especial/empiricus-desiste-de-registro-de-profissional-de-investimento-para-nao-ser-regulada-pela-cvm
