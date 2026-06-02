# ADR-007 — Estratégia compliance: disclaimer literal CVM 3976-4 só no /blog, guardrails do prompt em social

- **Status:** aceito
- **Data:** 2026-05-09
- **Autor:** Eduardo Sousa (decisão), formalizado por Claude
- **Convive com:** ADR-001 (stack IA), ADR-003 (Bloomberg autoral), ADR-004 (compliance via guardrails técnicos), ADR-005 (pivot artigo denso), ADR-006 (pivot carrossel X-mock)

---

## Contexto

A SPEC original (RNF-002) e o prompt v2.1 do carrossel exigiam que o **disclaimer literal CVM 3976-4** aparecesse:

> "LDC Capital · CVM 3976-4 · Conteúdo educacional. Não constitui recomendação de investimento."

em **todos os artefatos públicos** — incluindo:
- Rodapé do BlogPost completo em `/blog`
- Email de aprovação para Marcos
- Slide 6 (CTA) do carrossel
- Captions Instagram + LinkedIn

A intenção era defesa em profundidade: cada artefato carrega sua própria proteção CVM. Funciona bem em conteúdo editorial denso (artigo de 1.200 palavras tem espaço sobrando), mas em **social media** o disclaimer literal tem dois problemas observados no smoke #FINAL v2.1:

1. **Quebra o ritmo de tweet** — o slide 6 ocupa ~30% da altura visível com o disclaimer institucional, que entra como bloco de texto cinza (PublicSans 22) abaixo do convite. O leitor de Instagram/LinkedIn lê isso como "letra miúda"; perde o efeito convidativo do CTA.

2. **Disconto vs refs validadas** — Andrey Nousi (instagram.com/andreynousi) e Renato Breia (instagram.com/renatobreia), as duas referências canônicas que motivaram o pivot ADR-006, **não usam disclaimer literal CVM em social**. Carregam compliance via vocabulário e contexto (zero recomendação operacional, zero promessa de retorno) e mantêm o disclaimer apenas em conteúdo editorial completo. Manter o disclaimer literal nos slides distancia o output do padrão do nicho UHNW.

A decisão CVM da LDC já é robusta por outras camadas (ADR-004): regex de tickers, blacklist de frases prescritivas, regex de promessa de retorno, Bloomberg autoral (§6.2b). O disclaimer literal é uma **camada adicional**, não a única.

## Decisão

**O disclaimer literal "LDC Capital · CVM 3976-4 · Conteúdo educacional. Não constitui recomendação de investimento." vive APENAS em:**

1. **BlogPost completo** em `/blog/[slug]` — artigo editorial denso, disclaimer no rodapé padrão (mantido como em ADR-004).
2. **Email de aprovação token-based** para Marcos (workflow F-018) — mantido.
3. **README.md** dentro do ZIP do carrossel — audit trail interno; postador (Eduardo) lê o lembrete antes de copiar caption.

**O disclaimer literal NÃO aparece em:**

1. `slide.body` do slide 6 (CTA) do carrossel.
2. `caption_instagram` do ZIP.
3. `caption_linkedin` do ZIP.
4. Imagens AI hero geradas por DALL-E (já era proibido — Anti-SPEC §6.2b).

**Compliance social passa a ser garantida via guardrails do prompt v2.2 (multi-camada):**

- **Camada 1** — proibições no system prompt (zero ticker, zero prescrição, zero promessa, zero Bloomberg)
- **Camada 2** — Schema Zod Strict refines (regex tickers, regex Bloomberg em title/body/captions/hashtags/image_prompt)
- **Camada 3** — `runComplianceCheck()` engine F-005 aplicada per-slide e per-caption
- **Camada 4** — defesa post-DALL-E: boilerplate "no Bloomberg branding, no books with visible text"
- **Camada 5** — revisão humana (Eduardo aprova o ZIP visualmente antes de postar; rate limit 10/dia/user)

## Alternativas consideradas

- **A — Manter disclaimer literal em todos os artefatos (status quo v2.1):**
  - Prós: defesa em profundidade máxima; CVM dificilmente questiona presença literal em todo lugar.
  - Contras: quebra ritmo do tweet; distancia do padrão do nicho; bytes que poderiam carregar mais conteúdo são gastos em fórmula institucional.
  - **Por que não:** Eduardo (entidade responsável pela LDC) avaliou risco regulatório residual aceitável dadas as 5 camadas de guardrail técnico. Conformidade vem do CONTEÚDO (zero recomendação, zero promessa), não do TEXTO LITERAL repetido.

- **B — Disclaimer literal apenas no slide 6 (CTA), removido das captions:**
  - Prós: meio-termo; PNG do slide pode "rodar fora do contexto" (repost, story, screenshot).
  - Contras: ainda quebra o ritmo do CTA; o slide 6 é o que mais converte (link na bio), e o disclaimer comprime o convite.
  - **Por que não:** o slide 6 É o componente mais sensível — onde o leitor decide clicar ou não. Comprimir o convite é o pior trade-off possível.

- **C — Disclaimer ABREVIADO em social ("LDC · CVM 3976-4 · Educacional"):**
  - Prós: presença mínima; menos byte budget consumido.
  - Contras: parece "letra miúda escondida" (pior posicionamento que ausência total); abreviar texto regulatório enfraquece o argumento de "presença literal robusta" sem ganhar ritmo de leitura.
  - **Por que não:** ou faz completo no editorial (vale as 90 chars), ou faz zero em social (carrega compliance via outras camadas). Meio-termo perde os dois benefícios.

## Consequências

### Positivas

- **Carrossel respira:** slide 6 vira convite limpo. Mais espaço visual para imagem hero + tipografia consultiva. Aumenta conversão estimada do CTA.
- **Alinhamento com refs:** Andrey Nousi e Renato Breia operam exatamente esse padrão. LDC entra no formato canônico do nicho UHNW.
- **Threshold ampliado** (R$50M → R$1M, mudança paralela em v2.2) abre audiência potencial 50× maior. Sem disclaimer comprimindo o CTA, o convite fica mais convidativo para esse range expandido.
- **Defense in depth preservada:** 5 camadas de guardrail técnico continuam ativas. Compliance vem do CONTEÚDO, não do TEXTO repetido.

### Negativas / trade-offs (RISCO RESIDUAL)

- **Risco regulatório CVM marginalmente maior em cenário adverso:** se um post viralizar em contexto fora do esperado (repost por terceiro sem README), defesa fica nas 4 camadas técnicas (sem 5ª camada literal). Probabilidade BAIXA dado que Eduardo aprova cada carrossel antes de postar.
- **Mitigação aceita:** Eduardo se compromete a manter o disclaimer em **todo conteúdo editorial completo** do `/blog`, e a incluir manualmente o disclaimer caso publique trecho fora do contexto carrossel (story, comentário, repost). README.md do ZIP reforça esse lembrete.
- **Inconsistência aparente** entre `/blog` (com disclaimer) e carrossel (sem) é decisão consciente: cada formato tem sua estratégia. Em fiscalização CVM, defesa: "o conteúdo editorial completo da LDC carrega compliance literal; social media segue padrão do nicho fee-based brasileiro com compliance via vocabulário e guardrails técnicos".

### Neutras

- ADR-004 (compliance via guardrails) continua plenamente válido. ADR-007 estende-o ao domínio de social media com estratégia diferenciada.
- README.md do ZIP carrega seção compliance reescrita: "Carrossel gerado com guardrails CVM (zero recomendação operacional, zero promessa de retorno, zero ticker). Para conteúdo completo + disclaimer literal CVM 3976-4, ver artigo em /blog."

## Implementação técnica (consolidada em prompt v2.2)

- Bump fingerprint `blog-carousel-v2.1-2026-05-09` → `blog-carousel-v2.2-2026-05-09`
- Tabela de substituições amplia: `UHNW` → `alto patrimônio`, `famílias UHNW` → `famílias de alto patrimônio`, `ultra high net worth` → `famílias de grande patrimônio`, `ultra-high net worth` → `alto patrimônio`
- Threshold: `R$ 50 milhões` → `R$ 1 milhão` em few-shot examples e instruction (R$50M marcado como deprecated)
- Slide 6 CTA spec: corpo limpo sem disclaimer; instruction explícita "PROIBIDO: 'CVM 3976-4', 'Conteúdo educacional', 'Não constitui recomendação' no body"
- Captions IG/LinkedIn: instruction explícita "NÃO incluir disclaimer literal"
- Tests prompt-voice atualizados para v2.2 (4 testes novos para os 4 pares de substituição UHNW; 2 testes novos para disclaimer ausente em CTA + captions; 1 teste novo para threshold R$1M)

## Rollback plan

Se análise jurídica posterior (eventual contratação de Mattos Filho/BMA) recomendar disclaimer literal de volta nos slides:

1. Bump prompt para v2.3 com disclaimer reativado.
2. Atualizar few-shot examples e tests.
3. Re-gerar carrosséis em produção sob demanda (não há rollback de carrosséis já postados — ficam como artefatos individuais).
4. Compliance check engine F-005 não muda (já trata disclaimer ausente como warning, não bloqueio).

## Referências

- ADR-004 — Compliance CVM via guardrails técnicos (precedente do mesmo princípio: defesa em camadas, sem dependência exclusiva de texto literal).
- ADR-006 — Pivot carrossel X-mock screenshot (refs Andrey Nousi e Renato Breia que motivam estratégia v2.2).
- Smoke #FINAL v2.1 (`carousel_run_id=acb76110-bd29-4a91-b1ac-dab34a054497`) — observação visual que motivou ADR-007 (disclaimer comprimindo CTA).
- Resolução CVM 19/2021, 20/2021, 21/2021 — quadro regulatório base.
- Precedente Empiricus 2018 — caminho "publisher" CVM já estabelecido para conteúdo editorial brasileiro.
