/**
 * F-019 — testes dos contratos Zod (relaxed + strict).
 *
 * Cobre o pattern de duas camadas (memória `feedback_openai_structured_outputs`):
 * o schema relaxado é aceito pelo `zodResponseFormat`; o strict pega tudo que
 * o relaxado deixou passar (URL inválida, UUID malformado, Bloomberg em qualquer
 * lugar, slug fora do kebab-case).
 */
import { describe, expect, it } from "vitest";
import {
  CAROUSEL_PROMPT_VERSION,
  CarouselScript,
  CarouselScriptStrict,
  CarouselSlide,
  SlideType,
} from "../carousel";

const validBlogPostId = "5a157c14-b06b-4e85-8312-13942b88b914";

const validScript = {
  blog_post_id: validBlogPostId,
  blog_post_slug: "selic-elevada-petroleo-caro-uhnw",
  generated_at: "2026-05-09T13:00:00.000Z",
  prompt_version: CAROUSEL_PROMPT_VERSION,
  slides: [
    {
      index: 1,
      type: "hook" as const,
      title: "Selic 13,75% e Brent perto de 110: a janela fiscal mudou",
      body: "Pela primeira vez desde 2015, dois choques estruturais coexistem em horizonte UHNW de planejamento patrimonial.",
    },
    {
      index: 2,
      type: "contexto" as const,
      title: "Por que importa agora",
      body: "Famílias com horizonte multidecadal precisam revisitar duration, exposição cambial e governança da holding antes do exercício 2027.",
    },
    {
      index: 3,
      type: "dado" as const,
      title: "O número que reorganiza a tese",
      body: "Selic permanece em 13,75% pelo 4º trimestre, com NTN-B 2035 acima de 6,2% real, segundo dados do Tesouro.",
    },
    {
      index: 4,
      type: "pergunta" as const,
      title: "A pergunta de planejamento",
      body: "O que a sua holding precisa decidir até dezembro de 2026 — e quem na família tem assinatura para deliberar?",
    },
    {
      index: 5,
      type: "prova" as const,
      title: "Mecanismo, não recomendação",
      body: "Estruturas patrimoniais expostas a Brasil enfrentam trade-off entre carry real elevado e o repricing implícito da reforma tributária.",
    },
    {
      index: 6,
      type: "CTA" as const,
      title: "Diagnóstico patrimonial LDC",
      body: "Conteúdo educacional. Não constitui recomendação. Conheça o método LDC — link na bio.",
    },
  ],
  caption_instagram:
    "A janela fiscal brasileira mudou. Selic 13,75% e Brent caro coexistem como choques estruturais. Para famílias UHNW, o que importa não é a alíquota — é o calendário de decisão familiar antes de 2027.",
  caption_linkedin:
    "Selic em 13,75% e petróleo elevado abrem uma janela patrimonial inédita desde 2015. Análise editorial LDC sobre como famílias UHNW podem revisitar duration, exposição cambial e governança da holding antes da virada tributária de 2027. Conteúdo educacional, não recomendação.",
  hashtags: ["#PlanejamentoPatrimonial", "#UHNW", "#Macro", "#Selic"],
};

describe("F-019 contracts — CarouselScript (relaxed)", () => {
  it("aceita payload completo válido (happy path)", () => {
    const result = CarouselScript.safeParse(validScript);
    expect(result.success).toBe(true);
  });

  it("rejeita slides fora do range 5-7", () => {
    const tooFew = { ...validScript, slides: validScript.slides.slice(0, 4) };
    expect(CarouselScript.safeParse(tooFew).success).toBe(false);

    const tooMany = {
      ...validScript,
      slides: [
        ...validScript.slides,
        ...validScript.slides.slice(0, 2),
      ].slice(0, 8),
    };
    expect(CarouselScript.safeParse(tooMany).success).toBe(false);
  });

  it("rejeita type fora do enum SlideType", () => {
    const bad = {
      ...validScript,
      slides: [
        {
          ...validScript.slides[0],
          type: "outro" as unknown as SlideType,
        },
        ...validScript.slides.slice(1),
      ],
    };
    expect(CarouselScript.safeParse(bad).success).toBe(false);
  });

  it("rejeita prompt_version diferente do literal canônico", () => {
    const bad = { ...validScript, prompt_version: "v0.1-foo" };
    expect(CarouselScript.safeParse(bad).success).toBe(false);
  });
});

describe("F-019 contracts — CarouselScriptStrict (re-validação downstream)", () => {
  it("aceita o mesmo payload válido em strict", () => {
    const result = CarouselScriptStrict.safeParse(validScript);
    expect(result.success).toBe(true);
  });

  // Regression do pattern: estes payloads PASSAM no relaxed mas FALHAM no strict
  // — confirma que a duplicação dos schemas tem propósito (memória
  // `feedback_openai_structured_outputs`).
  it("PADRÃO RELAXED→STRICT: blog_post_id não-UUID passa relaxed e falha strict", () => {
    const bad = { ...validScript, blog_post_id: "not-a-uuid" };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });

  it("PADRÃO RELAXED→STRICT: generated_at não-ISO passa relaxed e falha strict", () => {
    const bad = { ...validScript, generated_at: "ontem" };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });

  it("PADRÃO RELAXED→STRICT: slug fora do kebab-case passa relaxed e falha strict", () => {
    const bad = { ...validScript, blog_post_slug: "Selic_Elevada Petróleo" };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });

  it("Anti-SPEC §6.2b: 'Bloomberg' em slide.body passa relaxed e falha strict", () => {
    const bad = {
      ...validScript,
      slides: [
        {
          ...validScript.slides[0],
          body: "Conforme apurou a Bloomberg, a Selic permanece elevada.",
        },
        ...validScript.slides.slice(1),
      ],
    };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    const strictResult = CarouselScriptStrict.safeParse(bad);
    expect(strictResult.success).toBe(false);
  });

  it("Anti-SPEC §6.2b: 'Bloomberg' em caption_instagram passa relaxed e falha strict", () => {
    const bad = {
      ...validScript,
      caption_instagram:
        "Análise baseada em dados da Bloomberg sobre Selic e câmbio.",
    };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });

  it("Anti-SPEC §6.2b: 'Bloomberg' em hashtag passa relaxed e falha strict", () => {
    const bad = {
      ...validScript,
      hashtags: ["#Macro", "#UHNW", "#Bloomberg"],
    };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });

  it("hashtag inválida (espaços/símbolos) passa relaxed e falha strict", () => {
    const bad = {
      ...validScript,
      hashtags: ["#hash com espaço", "#UHNW", "#Macro"],
    };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });
});

describe("F-019 contracts — CarouselSlide bounds", () => {
  it("title >80 chars rejeita", () => {
    const bad = {
      index: 1,
      type: "hook",
      title: "x".repeat(81),
      body: "ok",
    };
    expect(CarouselSlide.safeParse(bad).success).toBe(false);
  });

  it("body >180 chars rejeita", () => {
    const bad = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "x".repeat(181),
    };
    expect(CarouselSlide.safeParse(bad).success).toBe(false);
  });
});
