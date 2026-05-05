# ADR-001 — Stack de IA: OpenAI GPT-5-mini + Perplexity Sonar Pro (sem Anthropic)

- **Status:** aceito
- **Data:** 2026-04-27
- **Autor:** Eduardo Sousa (decisão), formalizado por Claude no fluxo SDD-avancado
- **Substitui:** —

---

## Contexto

O conceito original (`CONCEITO_NEWS_LDC.md`, 2026-04-23) propunha stack baseada em Anthropic:
- Anthropic Files API para extrair PDF Bloomberg (suporte nativo a PDF + OCR).
- Anthropic Claude Sonnet 4.6 para gerar briefings com prompt cache.
- Perplexity Sonar Pro para fontes frescas.

Ao formalizar a SPEC, foi confirmado que a LDC **não tem conta Anthropic**, mas tem:
- Conta OpenAI (SDK `openai` já instalado em `package.json`)
- Conta Google Gemini (SDK `@google/generative-ai` já instalado)
- Conta Perplexity (já contratada)

A Anti-SPEC §6.3 também impede importar Anthropic SDK sem ADR explícito, justamente para forçar essa decisão a passar pela porta da frente.

## Decisão

Usar **OpenAI GPT-5-mini com Structured Outputs (Zod schema)** para geração dos briefings, **`pdfjs-dist` (já instalado) para extração local de PDF**, e **Perplexity Sonar Pro** para fontes públicas citáveis. **Gemini 2.5 Pro multimodal** fica como fallback exclusivo para PDFs imagem-pesados (texto extraído < 1000 chars).

## Alternativas consideradas

- **A — Anthropic Files API + Claude Sonnet 4.6 (proposta original):**
  - Prós: Files API extrai PDF nativamente com OCR; Claude tem prompt cache mais barato (~50% de hit rate em uso típico); modelo é referência em texto longo coerente.
  - Contras: requer abrir conta Anthropic + provisionar billing; adiciona um SDK novo no projeto; introduz mais um vendor para manter env vars/rotação de keys.
  - **Por que não:** custo de provisionamento + atrito de novo vendor para um benefício marginal frente a OpenAI já configurada.

- **B — Gemini 2.5 Pro como motor primário (PDF nativo + geração):**
  - Prós: nativamente multimodal (PDF + imagem + texto numa única chamada); SDK já no projeto; preço competitivo.
  - Contras: Structured Outputs do Gemini ainda permitem drift ocasional fora do schema; não tem prompt caching tão maduro quanto OpenAI; menos teste em produção em pipelines deterministas (LDC valoriza idempotência).
  - **Por que não:** primário precisa ser o motor mais determinístico para JSON; Gemini fica relegado a fallback de PDF imagem-pesado, onde a multimodalidade brilha sem comprometer determinismo do briefing.

- **C — OpenAI GPT-4o (em vez de GPT-5-mini):**
  - Prós: modelo mais maduro, mais batido em produção.
  - Contras: ~3x mais caro que GPT-5-mini para a mesma tarefa; GPT-5-mini é treinado pós-GPT-5 com Structured Outputs sólido e preço otimizado para volume.
  - **Por que não:** custo. GPT-5-mini cabe folgado nos R$200/mês de teto e tem qualidade suficiente para Brevidade Inteligente (350 palavras estruturadas).

## Consequências

### Positivas
- **Zero novo vendor.** OpenAI + Gemini + Perplexity já estão configurados/contratados.
- **Custo mensal estimado revisado: R$ 60-130/mês** (vs R$ 190-310/mês da proposta original).
- **Structured Outputs do GPT-5-mini com Zod** eliminam classe inteira de bugs de parsing.
- **`pdfjs-dist` local** = zero custo de API por PDF + zero latência de rede para extração.
- **Prompt caching da OpenAI** ativo para o system prompt grande (regras Brevidade + compliance) — economia ~40% após 1ª invocação do dia.

### Negativas / trade-offs
- **Sem Files API nativa:** se aparecer PDF fora do padrão Bloomberg que `pdfjs-dist` não consiga ler bem, dependemos do fallback Gemini multimodal — caminho secundário menos testado.
- **Prompt cache do OpenAI tem TTL de 5min** — para invocações esparsas (>5min entre chamadas), perde-se o benefício. Mitigação: cron 2x/dia já garante hit no segundo briefing da rodada.
- **Reescrita de PDF complexo (tabelas) precisa de pré-processamento manual** (regex em `pdfjs-dist`), não vem "de graça" como na Files API.

### Neutras
- Novas env vars: `OPENAI_API_KEY` (já existe se OpenAI já é usado em outro lugar do projeto), `PERPLEXITY_API_KEY`, `GOOGLE_GEMINI_API_KEY` (mesmo nome usado pelo módulo checkup-ldc).

**Atualização 2026-04-28:** Descobriu-se durante F-007 que os PDFs Bloomberg que o Eduardo recebe via email são **raster** (não pesquisáveis). Isso significa que Gemini deixa de ser "fallback de edge case" e vira **caminho normal de produção**. Custo recorrente cabe no free tier do Google AI Studio (50 RPD em 2.5 Pro, 1500 RPD em Flash) para o volume da `/news` (~10 PDFs/dia). Se volume crescer ou free tier mudar, considerar billed tier ou substituir por OpenAI Vision (exigiria novo ADR).

## Referências

- SPEC `docs/news/SPEC.md` §0 D-08, RF-005, RF-006, RF-007
- CONTRACTS `docs/news/CONTRACTS.md` §3, §4, §5
- Conceito `CONCEITO_NEWS_LDC.md` §6 (proposta original com Anthropic)
- Anti-SPEC §6.3 — proibição de Anthropic sem ADR (este documento)
