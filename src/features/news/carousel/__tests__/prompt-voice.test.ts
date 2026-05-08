/**
 * F-019 v2.2 — guardrails do tom consultivo no system prompt.
 *
 * v2.2 mudanças:
 *   - threshold R$50M→R$1M
 *   - UHNW substituições (4 pares novos)
 *   - CTA SEM disclaimer literal (ADR-007 — vive só em /blog)
 *   - Captions IG/LinkedIn SEM disclaimer literal
 */
import { describe, expect, it } from "vitest";
import {
  BLOG_CAROUSEL_SYSTEM_PROMPT,
  CAROUSEL_PROMPT_VERSION,
} from "../prompt";

describe("F-019 v2.2 prompt — voice consultivo + ADR-007", () => {
  it("fingerprint bumped para v2.2-2026-05-09", () => {
    expect(CAROUSEL_PROMPT_VERSION).toBe("blog-carousel-v2.2-2026-05-09");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain(
      "blog-carousel-v2.2-2026-05-09",
    );
  });

  it("define tom consultivo (não professor, não vendedor)", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("mentor consultivo");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("Não é professor expondo");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("não é vendedor");
  });

  it("define limite de frase (máx 18-20 palavras, ideal 8-15)", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(/Máximo\s+18[-–]20\s+palavras/i);
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(/8[-–]15/);
  });

  it("inclui tabela de substituições jargão→PT-BR direto (mantém v2.1)", () => {
    const requiredSubstitutions: Array<[string, string]> = [
      ["compressão de prêmio", "redução do retorno"],
      ["horizonte multigeracional", "longo prazo da família"],
      ["regime fiscal", "ambiente de impostos"],
      ["termos de troca", "balança comercial"],
      ["pass-through", "repasse"],
      ["alocação estratégica", "como você divide o patrimônio"],
      ["estrutura societária", "estrutura da holding"],
    ];
    for (const [jargao, alvo] of requiredSubstitutions) {
      expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain(jargao);
      expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain(alvo);
    }
  });

  // ─── v2.2 — UHNW substitutions ──────────────────────────────────────────
  it("v2.2: tabela substituições inclui UHNW → alto patrimônio (4 pares novos)", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(/UHNW.*alto patrimônio/i);
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("famílias UHNW");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("ultra high net worth");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("ultra-high net worth");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("famílias de grande patrimônio");
  });

  it("v2.2: instrução sobre alternância 'alto/grande patrimônio' presente", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("Variação natural");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("alto patrimônio");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("grande patrimônio");
  });

  // ─── v2.2 — Threshold R$ 1 milhão ───────────────────────────────────────
  it("v2.2: threshold R$ 1 milhão presente nos exemplos do CTA", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("R$ 1 milhão");
  });

  it("v2.2: threshold R$ 50 milhões marcado como deprecated nos few-shot", () => {
    // Aparece apenas como contraexemplo "Ruim em v2.2"
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(/deprecated/i);
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("audiência 50× maior");
  });

  // ─── v2.2 — Disclaimer ADR-007 ──────────────────────────────────────────
  it("v2.2: CTA few-shot NÃO inclui 'CVM 3976-4'", () => {
    // Procura o exemplo positivo do slide 6 v2.2 e verifica que não tem CVM no body
    const v22Cta = BLOG_CAROUSEL_SYSTEM_PROMPT.match(
      /EXEMPLO BOM v2\.2 — slide 6[\s\S]*?Por quê é ruim em v2\.2/,
    );
    expect(v22Cta).not.toBeNull();
    if (!v22Cta) return;
    // Dentro do bloco do exemplo positivo (até "EXEMPLO RUIM"), não pode ter
    // "CVM 3976-4" no body do CTA. Mas o EXEMPLO RUIM logo abaixo tem como
    // contraexemplo — separamos pelo título.
    const positiveOnly = v22Cta[0].split("EXEMPLO RUIM")[0];
    expect(positiveOnly).not.toContain("CVM 3976-4");
    expect(positiveOnly).not.toContain("Não constitui recomendação");
  });

  it("v2.2: instrução explícita 'CTA sem disclaimer literal' presente", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("ADR-007");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(
      /SEM disclaimer literal/i,
    );
  });

  it("v2.2: captions instruction PROÍBE 'CVM 3976-4' e 'Conteúdo educacional'", () => {
    // Dentro da seção "Regra dura para AMBAS as captions"
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain(
      "Regra dura para AMBAS as captions",
    );
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(
      /Captions IG e LinkedIn NÃO devem conter[\s\S]*?CVM 3976-4/,
    );
  });

  // ─── Mantidos da v2.1 ──────────────────────────────────────────────────
  it("define hook contra-intuitivo no slide 1", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(/hook\s+contra-intuitivo/i);
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain(
      "olhando pro lugar errado",
    );
  });

  it("define estrutura Primeiro/Segundo/Terceiro nos slides 3-5", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("**Primeiro**");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("**Segundo**");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("**Terceiro**");
  });

  it("proíbe linguagem motivacional/marketeira", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("OPORTUNIDADE ÚNICA");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(/coach\s+motivacional/i);
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("segredo dos milionários");
  });

  it("preserva regras Anti-SPEC §6.2 e §6.2b sagradas", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("§6.2b");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(/Bloomberg/);
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("PETR4");
  });

  it("define caps de schema v2.2 (body 360, máx 5 bold por slide)", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("360 chars");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("máximo 5 trechos");
  });

  it("orienta evitar 'livro aberto' como image_prompt (DALL-E hallucination)", () => {
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toContain("livro aberto");
    expect(BLOG_CAROUSEL_SYSTEM_PROMPT).toMatch(/hallucina/i);
  });
});
