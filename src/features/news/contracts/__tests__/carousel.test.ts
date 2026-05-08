/**
 * F-019 v2.0 — testes dos contratos Zod (relaxed + strict + image_prompt + bold).
 */
import { describe, expect, it } from "vitest";
import {
  CAROUSEL_PROMPT_VERSION,
  CarouselScript,
  CarouselScriptStrict,
  CarouselSlide,
  CarouselSlideStrict,
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
      title: "Juros altos não são o vilão para alto patrimônio",
      body: "Em regimes de **Selic 14,75%**, a janela fiscal pesa mais que a taxa nominal.",
      image_prompt: "skyline urbano de São Paulo ao golden hour",
    },
    {
      index: 2,
      type: "contexto" as const,
      title: "Por que agora",
      body: "O regime macro mudou. **Selic** alta + **petróleo** caro convergem.",
      image_prompt: null,
    },
    {
      index: 3,
      type: "dado" as const,
      title: "Selic 14,75% IPCA 5,3%",
      body: "**Selic** em 14,75% e **IPCA** projetado em 5,3%.",
      image_prompt: "mãos em mesa de madeira segurando documento",
    },
    {
      index: 4,
      type: "pergunta" as const,
      title: "Como sua estrutura responde?",
      body: "Decisões patrimoniais exigem governança formalizada.",
      image_prompt: null,
    },
    {
      index: 5,
      type: "prova" as const,
      title: "Estrutura > tática",
      body: "Famílias UHNW privilegiam processo.",
      image_prompt: null,
    },
    {
      index: 6,
      type: "CTA" as const,
      title: "Diagnóstico patrimonial LDC",
      body: "Se você toma decisões sobre patrimônio acima de **R$ 1 milhão**, vale uma conversa estruturada. Sem compromisso. Link na bio.",
      image_prompt: "interior de biblioteca clássica com madeira escura",
    },
  ],
  caption_instagram:
    "Juros altos não são o vilão. Famílias de alto patrimônio precisam repensar governança e janela fiscal.",
  caption_linkedin:
    "Selic em 14,75% e janela fiscal aberta para holdings de alto patrimônio.",
  hashtags: ["#PlanejamentoPatrimonial", "#UHNW", "#JanelaFiscal"],
};

describe("F-019 v2 contracts — CarouselScript (relaxed)", () => {
  it("aceita payload completo válido (happy path com image_prompt + bold)", () => {
    const result = CarouselScript.safeParse(validScript);
    expect(result.success).toBe(true);
  });

  it("aceita slide com image_prompt=null", () => {
    const slide = {
      index: 2,
      type: "contexto",
      title: "Test",
      body: "Body without image.",
      image_prompt: null,
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(true);
  });

  it("rejeita prompt_version diferente do canônico v2.0", () => {
    const bad = { ...validScript, prompt_version: "blog-carousel-v1.0-2026-05-09" };
    expect(CarouselScript.safeParse(bad).success).toBe(false);
  });
});

describe("F-019 v2 contracts — body cap 360 chars", () => {
  it("body de 360 chars aceita", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "x".repeat(360),
      image_prompt: null,
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(true);
  });

  it("body >360 chars rejeita", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "x".repeat(361),
      image_prompt: null,
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(false);
  });
});

describe("F-019 v2 contracts — bold markdown validation strict", () => {
  it("body com ≤5 trechos **xxx** passa strict", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "**a** e **b** com **c** e **d**, **e**.",
      image_prompt: null,
    };
    expect(CarouselSlideStrict.safeParse(slide).success).toBe(true);
  });

  it("body com 6 trechos **xxx** falha strict", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "**a** **b** **c** **d** **e** **f**.",
      image_prompt: null,
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(true);
    expect(CarouselSlideStrict.safeParse(slide).success).toBe(false);
  });
});

describe("F-019 v2.1 contracts — image_prompt fix", () => {
  it("image_prompt válido (apenas conceito) passa em ambos", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "ok",
      image_prompt: "skyline de São Paulo ao golden hour",
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(true);
    expect(CarouselSlideStrict.safeParse(slide).success).toBe(true);
  });

  it("image_prompt >120 chars rejeita", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "ok",
      image_prompt: "x".repeat(121),
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(false);
  });

  it("image_prompt com boilerplate 'editorial photography' falha strict", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "ok",
      image_prompt: "editorial photography of skyline",
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(true);
    expect(CarouselSlideStrict.safeParse(slide).success).toBe(false);
  });

  it("image_prompt com boilerplate '16:9 ratio' falha strict", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "ok",
      image_prompt: "skyline urbano em 16:9 ratio editorial",
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(true);
    expect(CarouselSlideStrict.safeParse(slide).success).toBe(false);
  });

  it("image_prompt com 'no Bloomberg' (boilerplate) falha strict", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "ok",
      image_prompt: "skyline editorial no Bloomberg branding",
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(true);
    expect(CarouselSlideStrict.safeParse(slide).success).toBe(false);
  });

  it("image_prompt=null aceito (slides text-only)", () => {
    const slide = {
      index: 2,
      type: "contexto",
      title: "ok",
      body: "ok",
      image_prompt: null,
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(true);
    expect(CarouselSlideStrict.safeParse(slide).success).toBe(true);
  });
});

describe("F-019 v2 contracts — Anti-SPEC §6.2b", () => {
  it("'Bloomberg' em image_prompt passa relaxed e falha strict", () => {
    const slide = {
      index: 1,
      type: "hook",
      title: "ok",
      body: "ok",
      image_prompt: "Bloomberg terminal close-up",
    };
    expect(CarouselSlide.safeParse(slide).success).toBe(true);
    expect(CarouselSlideStrict.safeParse(slide).success).toBe(false);
  });

  it("'Bloomberg' em slide.body passa relaxed e falha strict", () => {
    const bad = JSON.parse(JSON.stringify(validScript));
    bad.slides[2].body = "Conforme apurou a Bloomberg, a Selic subiu.";
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });

  it("hashtag #Bloomberg passa relaxed e falha strict", () => {
    const bad = { ...validScript, hashtags: ["#Macro", "#UHNW", "#Bloomberg"] };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });

  it("hashtag PT-BR com acento (ç, ã, õ) é aceita no strict", () => {
    const ok = {
      ...validScript,
      hashtags: ["#GovernançaFamiliar", "#AlocaçãoEstratégica", "#PlanejamentoSucessório"],
    };
    expect(CarouselScript.safeParse(ok).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(ok).success).toBe(true);
  });
});

describe("F-019 v2 contracts — strict re-validation", () => {
  it("happy path passa strict", () => {
    expect(CarouselScriptStrict.safeParse(validScript).success).toBe(true);
  });

  it("blog_post_id não-UUID falha strict", () => {
    const bad = { ...validScript, blog_post_id: "not-a-uuid" };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });

  it("slug fora do kebab-case falha strict", () => {
    const bad = { ...validScript, blog_post_slug: "Selic_Elevada Petróleo" };
    expect(CarouselScript.safeParse(bad).success).toBe(true);
    expect(CarouselScriptStrict.safeParse(bad).success).toBe(false);
  });
});
