/**
 * F-019 v2.0 — testes do image-gen wrapper (CA-041 + Anti-SPEC §6.2b).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateSlideImage,
  generateImagesForSlides,
  ImageGenBloombergError,
  buildFullImagePrompt,
} from "../image-gen";

const FAKE_PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString(
  "base64",
);

function makeOpenAiMock(
  override: Partial<{
    parse: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    images: {
      generate:
        override.parse ??
        vi.fn().mockResolvedValue({
          data: [{ b64_json: FAKE_PNG_B64 }],
        }),
    },
  };
}

describe("F-019 v2.1 image-gen — buildFullImagePrompt boilerplate", () => {
  it("concatena conceito + boilerplate completo (Anti-SPEC §6.2b)", () => {
    const full = buildFullImagePrompt("skyline de São Paulo ao golden hour");
    expect(full).toMatch(/^skyline de São Paulo ao golden hour\./);
    expect(full).toContain("Editorial photography");
    expect(full).toContain("16:9");
    expect(full).toContain("premium UHNW aesthetic");
    expect(full).toContain("no readable text or letters anywhere");
    expect(full).toContain("no logos");
    expect(full).toContain("no Bloomberg branding");
  });

  it("remove pontuação final do conceito antes de concatenar", () => {
    const full = buildFullImagePrompt("livro aberto sobre madeira.");
    // Sem ".." duplicado: conceito sem ponto + ". Boilerplate."
    expect(full.match(/\.\./g)).toBeNull();
    expect(full).toContain("livro aberto sobre madeira. Editorial");
  });

  it("hardening v2.1 (2026-05-09): boilerplate proíbe texto em livros", () => {
    const full = buildFullImagePrompt("livro aberto sobre madeira");
    // Após hallucination "PRUM/WAST MORTH" no smoke v2.1.
    expect(full).toContain("no books with visible pages or covers");
    expect(full).toContain("no documents with words");
  });

  it("hardening v2.2 (2026-05-09): boilerplate proíbe folders/portfolios/labels", () => {
    const full = buildFullImagePrompt("mãos sobre documento");
    // Após "PREMIUM" hallucination em pasta no smoke v2.2.
    expect(full).toContain("no folders or portfolios with covers");
    expect(full).toContain("no products with names");
    expect(full).toContain("no marketing copy");
  });

  it("hardening v2.2: boilerplate generaliza 'no readable text or letters anywhere'", () => {
    const full = buildFullImagePrompt("skyline ao entardecer");
    // Mais forte que "no text on image" — DALL-E ignora "image" e gera
    // letras em superfícies de objetos. "anywhere" cobre objetos.
    expect(full).toContain("no readable text or letters anywhere");
  });

  it("hardening v2.2: boilerplate proíbe signs/signage", () => {
    const full = buildFullImagePrompt("interior de boardroom");
    // Defesa contra placas, indicações, etc.
    expect(full).toContain("no signs or signage");
  });
});

describe("F-019 v2 image-gen", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("CA-041 happy path: retorna buffer e custo BRL", async () => {
    const result = await generateSlideImage(
      { prompt: "Skyline editorial premium", slideIndex: 1 },
      { openaiClient: makeOpenAiMock() as never },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.cost_brl).toBeGreaterThan(0);
      expect(result.attempts).toBe(1);
    }
  });

  it("Anti-SPEC §6.2b: lança ImageGenBloombergError ANTES de chamar API", async () => {
    const generateSpy = vi.fn();
    const client = { images: { generate: generateSpy } } as never;
    await expect(
      generateSlideImage(
        { prompt: "Bloomberg terminal screen", slideIndex: 3 },
        { openaiClient: client },
      ),
    ).rejects.toBeInstanceOf(ImageGenBloombergError);
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("CA-041 fallback gracioso: 3 retries esgotados retornam ok=false", async () => {
    const failingMock = vi
      .fn()
      .mockRejectedValue(new Error("api timeout"));
    const result = await generateSlideImage(
      { prompt: "Skyline editorial", slideIndex: 1 },
      {
        openaiClient: { images: { generate: failingMock } } as never,
        maxRetries: 3,
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("openai_api_error");
      expect(result.attempts).toBe(3);
    }
    expect(failingMock).toHaveBeenCalledTimes(3);
  }, 30000);

  it("generateImagesForSlides: pula slides sem image_prompt", async () => {
    const generateSpy = vi.fn().mockResolvedValue({
      data: [{ b64_json: FAKE_PNG_B64 }],
    });
    const result = await generateImagesForSlides(
      [
        { index: 1, image_prompt: "Skyline" },
        { index: 2, image_prompt: null },
        { index: 3, image_prompt: "Mãos em mesa" },
      ],
      { openaiClient: { images: { generate: generateSpy } } as never },
    );
    expect(generateSpy).toHaveBeenCalledTimes(2);
    expect(result.images[1]).toBeInstanceOf(Buffer);
    expect(result.images[2]).toBeNull();
    expect(result.images[3]).toBeInstanceOf(Buffer);
    expect(result.failures).toHaveLength(0);
  });
});
