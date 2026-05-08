/**
 * F-019 v2.0 — testes do mapping CarouselScript → ComplianceCheckInput.
 * Cobertura: CA-033 (compliance per slide+caption) + Anti-SPEC §6.2b.
 */
import { describe, expect, it } from "vitest";
import { checkCarouselCompliance } from "../compliance-mapper";
import type { CarouselScript } from "../../contracts/carousel";
import { CAROUSEL_PROMPT_VERSION } from "../../contracts/carousel";

function baseScript(): CarouselScript {
  return {
    blog_post_id: "5a157c14-b06b-4e85-8312-13942b88b914",
    blog_post_slug: "selic-petroleo-janela-fiscal-implicacoes-uhnw",
    generated_at: "2026-05-08T14:00:00.000Z",
    prompt_version: CAROUSEL_PROMPT_VERSION,
    slides: [
      {
        index: 1,
        type: "hook",
        title: "Hook title",
        body: "Juros altos não são o vilão para alto patrimônio.",
        image_prompt: "skyline ao entardecer",
      },
      {
        index: 2,
        type: "contexto",
        title: "Por que agora",
        body: "O regime macro mudou.",
        image_prompt: null,
      },
      {
        index: 3,
        type: "dado",
        title: "Selic 14,75%",
        body: "Selic em 14,75% e IPCA revisado.",
        image_prompt: "mãos sobre documento",
      },
      {
        index: 4,
        type: "pergunta",
        title: "Como sua estrutura responde?",
        body: "Decisões patrimoniais exigem governança formalizada.",
        image_prompt: null,
      },
      {
        index: 5,
        type: "prova",
        title: "Estrutura > tática",
        body: "Famílias de alto patrimônio privilegiam processo.",
        image_prompt: null,
      },
      {
        index: 6,
        type: "CTA",
        title: "Diagnóstico patrimonial LDC",
        body: "Se você toma decisões sobre patrimônio acima de R$ 1 milhão, vale uma conversa estruturada. Sem compromisso. Link na bio.",
        image_prompt: "livro aberto sobre mesa",
      },
    ],
    caption_instagram: "Selic alta. Famílias de alto patrimônio precisam de governança.",
    caption_linkedin: "Selic em 14,75% e janela fiscal aberta.",
    hashtags: ["#PlanejamentoPatrimonial", "#UHNW", "#JanelaFiscal"],
  };
}

describe("F-019 v2 compliance-mapper", () => {
  it("CA-033 happy path: payload limpo passa", () => {
    const result = checkCarouselCompliance(baseScript());
    expect(result.passed).toBe(true);
  });

  it("CA-033: ticker BR em slide.body bloqueia", () => {
    const script = baseScript();
    script.slides[2].body = "PETR4 pode subir após Copom.";
    const result = checkCarouselCompliance(script);
    expect(result.passed).toBe(false);
    expect(
      result.violations.some(
        (v) => v.type === "ticker_br" && v.source.kind === "slide",
      ),
    ).toBe(true);
  });

  it("CA-033: prescrição em slide.title bloqueia (compre)", () => {
    const script = baseScript();
    script.slides[0].title = "Compre títulos públicos agora";
    const result = checkCarouselCompliance(script);
    expect(result.passed).toBe(false);
  });

  it("Anti-SPEC §6.2b: 'Bloomberg' em caption_instagram bloqueia", () => {
    const script = baseScript();
    script.caption_instagram = "Análise baseada em dados da Bloomberg.";
    const result = checkCarouselCompliance(script);
    expect(result.passed).toBe(false);
  });

  it("Anti-SPEC §6.2b: hashtag #Bloomberg bloqueia", () => {
    const script = baseScript();
    script.hashtags = ["#Macro", "#UHNW", "#Bloomberg"];
    const result = checkCarouselCompliance(script);
    expect(result.passed).toBe(false);
    expect(
      result.violations.some(
        (v) => v.source.kind === "hashtag" && v.match === "#Bloomberg",
      ),
    ).toBe(true);
  });
});
