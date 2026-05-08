/**
 * F-019 v2.0 — testes do empacotamento ZIP (CA-042).
 */
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { packCarouselZip } from "../zip";
import type { CarouselScriptStrict } from "../../contracts/carousel";
import { CAROUSEL_PROMPT_VERSION } from "../../contracts/carousel";

function baseScript(): CarouselScriptStrict {
  return {
    blog_post_id: "5a157c14-b06b-4e85-8312-13942b88b914",
    blog_post_slug: "selic-petroleo-janela-fiscal",
    generated_at: "2026-05-08T14:00:00.000Z",
    prompt_version: CAROUSEL_PROMPT_VERSION,
    slides: [
      { index: 1, type: "hook", title: "Hook", body: "Body hook.", image_prompt: "Skyline." },
      { index: 2, type: "contexto", title: "Contexto", body: "Body contexto.", image_prompt: null },
      { index: 3, type: "dado", title: "Dado", body: "Body dado.", image_prompt: "Mãos em mesa." },
      { index: 4, type: "pergunta", title: "Pergunta", body: "Body pergunta.", image_prompt: null },
      { index: 5, type: "prova", title: "Prova", body: "Body prova.", image_prompt: null },
      { index: 6, type: "CTA", title: "CTA", body: "Body cta.", image_prompt: "Livro aberto." },
    ],
    caption_instagram: "Caption IG.",
    caption_linkedin: "Caption LinkedIn.",
    hashtags: ["#A", "#B", "#C"],
  };
}

const FAKE_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("F-019 v2 zip", () => {
  it("CA-042: ZIP contém estrutura ldc/+luciano/ + captions + README", async () => {
    const script = baseScript();
    const result = await packCarouselZip({
      script,
      ldcPngs: Array(6).fill(FAKE_PNG),
      lucianoPngs: Array(6).fill(FAKE_PNG),
      carouselRunId: "00000000-0000-0000-0000-000000000001",
      generatedAt: script.generated_at,
    });

    expect(result.size_bytes).toBeGreaterThan(0);
    expect(result.filename).toBe(
      "selic-petroleo-janela-fiscal-carousel-20260508-140000.zip",
    );

    const zip = await JSZip.loadAsync(result.buffer);
    const names = Object.keys(zip.files);

    expect(names).toContain("caption-instagram.md");
    expect(names).toContain("caption-linkedin.md");
    expect(names).toContain("README.md");
    for (let i = 1; i <= 6; i++) {
      expect(names.some((n) => n.startsWith(`ldc/slide-${i}-`))).toBe(true);
      expect(names.some((n) => n.startsWith(`luciano/slide-${i}-`))).toBe(true);
    }
    expect(names).toContain("ldc/slide-1-hook.png");
    expect(names).toContain("luciano/slide-6-cta.png");
  });

  it("README inclui run_id, 2 variações e nota de compliance", async () => {
    const script = baseScript();
    const result = await packCarouselZip({
      script,
      ldcPngs: Array(6).fill(FAKE_PNG),
      lucianoPngs: Array(6).fill(FAKE_PNG),
      carouselRunId: "00000000-0000-0000-0000-000000000999",
      generatedAt: script.generated_at,
    });
    const zip = await JSZip.loadAsync(result.buffer);
    const readme = await zip.file("README.md")!.async("string");
    expect(readme).toContain("00000000-0000-0000-0000-000000000999");
    expect(readme).toContain("CVM 3976-4");
    expect(readme).toContain("ldc/");
    expect(readme).toContain("luciano/");
    expect(readme).toContain("institucional");
    expect(readme).toContain("pessoal");
  });

  it("README documenta image_gen_failures quando há fallback text-only", async () => {
    const script = baseScript();
    const result = await packCarouselZip({
      script,
      ldcPngs: Array(6).fill(FAKE_PNG),
      lucianoPngs: Array(6).fill(FAKE_PNG),
      carouselRunId: "00000000-0000-0000-0000-000000000888",
      generatedAt: script.generated_at,
      imageGenFailures: [
        { slide_index: 3, reason: "openai_api_error" },
      ],
    });
    const zip = await JSZip.loadAsync(result.buffer);
    const readme = await zip.file("README.md")!.async("string");
    expect(readme).toContain("text-only");
    expect(readme).toContain("slides 3");
    expect(readme).toContain("openai_api_error");
  });

  it("rejeita quando contagem de PNGs não bate", async () => {
    const script = baseScript();
    await expect(
      packCarouselZip({
        script,
        ldcPngs: Array(5).fill(FAKE_PNG),
        lucianoPngs: Array(6).fill(FAKE_PNG),
        carouselRunId: "00000000-0000-0000-0000-000000000002",
        generatedAt: script.generated_at,
      }),
    ).rejects.toThrow(/LDC PNGs/);
  });
});
