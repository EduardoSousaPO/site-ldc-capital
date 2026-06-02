# ADR-003 — Bloomberg como sinal interno de tema (nunca como fonte pública citável)

- **Status:** aceito
- **Data:** 2026-04-27
- **Autor:** Claude (proposta), Eduardo Sousa (aprovação implícita ao enviar 4 PDFs Bloomberg para calibração da SPEC)
- **Substitui:** —

---

## Contexto

A LDC tem assinatura Bloomberg corporativa. PDFs diários ("Bloomberg Brazilian News", "Bloomberg First Word", "Bloomberg News" traduzido por máquina, "Associated Press" traduzido) são insumo riquíssimo: dados de mercado, fluxo institucional, análise de bancos, agenda do dia.

Ao analisar 4 PDFs reais que o Eduardo compartilhou em 2026-04-27, ficou explícito que o conteúdo Bloomberg:
1. **É assinatura privada paga** — não é redistribuível por ToS Bloomberg.
2. **Contém matérias com ângulos exclusivos** que não estão (ainda) em mídia pública aberta.
3. **Lista tickers e empresas individualmente** (Petrobras, Vale, Raízen, Casino, PetroReconcavo, Brava Energia, Assai ADRs) — risco direto de violação CVM se forem citados nominalmente em briefing público.
4. **Inclui contatos privados de repórteres + emails internos** — material que NÃO pode ser exposto.

A proposta inicial do conceito (CONCEITO_NEWS_LDC.md §5) tratava Bloomberg como fonte primária — o que cria risco contratual (redistribuição de conteúdo pago) e regulatório (parafrasear ângulo único pode entrar em zona cinza CVM).

## Decisão

**Bloomberg PDF é tratado como SINAL INTERNO DE TEMA, processado em memória, NUNCA citado como fonte pública.**

Pipeline:
1. PDFs Bloomberg → extraídos via `pdfjs-dist` localmente, marcados `<bloomberg_signal>` no input do GPT.
2. GPT-5-mini lê os signals **apenas para identificar temas candidatos**.
3. Para cada tema candidato, **Perplexity Sonar Pro** é consultado com `search_domain_filter` que **EXCLUI bloomberg.com** explicitamente.
4. **Se Perplexity retorna zero citações públicas para o tema, o tema é DESCARTADO** — não vira briefing.
5. GPT-5-mini gera briefing usando APENAS as fontes públicas retornadas pelo Perplexity (Reuters, FT, Valor, neofeed, WSJ, Economist, InfoMoney, Axios).
6. Briefing publicado cita SOMENTE URLs públicas — Bloomberg jamais aparece.

**Bloqueios técnicos** (defense in depth):
- Schema Zod `FonteCitavel` rejeita URLs com `bloomberg`.
- Schema Zod `PerplexityCitation` rejeita URLs com `bloomberg`.
- Schema Zod `PerplexityQuery.search_domain_filter` rejeita arrays contendo `bloomberg`.
- Compliance check pós-geração detecta `bloomberg` em `fontes[].url`/`dominio` → bloqueia briefing.
- Compliance check detecta a palavra "Bloomberg" no `body` → flag para revisão humana.
- Vercel Blob auto-cleanup remove PDFs Bloomberg após 30 dias.

## Alternativas consideradas

- **A — Bloomberg como fonte direta (proposta original do conceito):**
  - Prós: pipeline mais simples (uma fonte só); ângulos exclusivos viram diferencial editorial.
  - Contras: viola ToS Bloomberg; cria risco contratual sério; expõe dados não-públicos; concentra dependência num único vendor caro.
  - **Por que não:** risco existencial. Bloomberg processa violações de redistribuição com agressividade. Custo potencial > qualquer benefício.

- **B — Não usar Bloomberg de jeito nenhum, depender só de Perplexity:**
  - Prós: simplicidade total; zero risco contratual.
  - Contras: perde a vantagem informacional do clipping curado por jornalistas Bloomberg; Perplexity sozinho retorna conteúdo mais raso e pode perder timing.
  - **Por que não:** Eduardo já paga Bloomberg. Não usar como sinal interno é desperdiçar input de altíssimo valor que orienta a IA para os temas certos do dia.

- **C — Bloomberg + Perplexity, citando ambos como fontes:**
  - Prós: máxima cobertura.
  - Contras: igual à alternativa A no quesito risco. "Citar" Bloomberg é o problema, não "usar" Bloomberg.
  - **Por que não:** mesmo motivo de A.

## Consequências

### Positivas
- **Risco contratual com Bloomberg = ~zero.** Conteúdo do PDF nunca atravessa fronteira pública.
- **Compliance CVM mais robusto:** o filtro Bloomberg-out + Perplexity-only garante que toda afirmação no briefing tem URL pública verificável e citável.
- **Bloomberg vira "navegador editorial":** orienta a IA para os 5-7 temas mais relevantes do dia, sem virar fonte direta. É como ter um editor humano dizendo "olha esses temas hoje" e depois a IA buscar fontes públicas.
- **Defense in depth:** 6 camadas de bloqueio (refine Zod x3, compliance check x2, blob TTL) — improvável que vaze.

### Negativas / trade-offs
- **Pipeline mais complexo:** dois sistemas (Bloomberg + Perplexity) vs um só. Mais código para manter, mais pontos de falha.
- **Latência maior:** chamada Perplexity adicional para cada tema candidato (~2s/query × 5 temas = ~10s extras na rodada). Mitigação: paralelizar via `Promise.all`.
- **Temas Bloomberg-exclusivos viram lacuna editorial:** se Bloomberg furou um movimento que ninguém público cobriu ainda, perdemos esse briefing. Aceitável: prioridade é compliance > velocidade editorial.
- **Custo Perplexity adicional:** 5 queries/rodada × 30 rodadas/mês = 150 queries × R$ 0,5/query = R$ 75/mês adicional. Cabe no teto de R$ 200/mês.

### Neutras
- System prompt OpenAI fica mais longo (precisa instruir explicitamente "não cite Bloomberg, descarte tema sem cobertura pública") — aumenta levemente o custo de tokens, mitigado pelo prompt cache.
- Auditoria fica mais simples: cada briefing tem trilha clara `bloomberg_pdf_id → perplexity_query → public_citations` rastreável em `news_pipeline_runs`.

## Referências

- SPEC `docs/specs/spec-pipeline-ia.md` §RNF-008 (proteção autoral Bloomberg), §6.2b (Anti-SPEC), CA-011, CA-012b, CA-014b, CB-017
- CONTRACTS `docs/contracts/contracts-pipeline-ia.md` §1 (FonteCitavel refine), §4 (Perplexity refine)
- 4 PDFs Bloomberg analisados em 2026-04-27 (mensagem do Eduardo na conversa SDD)
