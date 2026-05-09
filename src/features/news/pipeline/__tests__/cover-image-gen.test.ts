/**
 * Testes para cover-image-gen.ts (capa AI dos BlogPosts gerados pelo pipeline).
 */
import { describe, expect, it, vi } from "vitest";
import {
  generateAndAttachCover,
  __COVER_IMAGE_GEN_INTERNALS,
} from "../cover-image-gen";

const {
  CATEGORY_TO_CONCEPT,
  DALL_E_BOILERPLATE,
  buildCoverPrompt,
  antiSpecConceptCheck,
  CoverPromptBloombergError,
  COVER_BUCKET,
  DALL_E_COST_BRL,
} = __COVER_IMAGE_GEN_INTERNALS;

describe("cover-image-gen / buildCoverPrompt", () => {
  it("inclui boilerplate + conceito da categoria", () => {
    const prompt = buildCoverPrompt("macro-brasil");
    expect(prompt).toContain(CATEGORY_TO_CONCEPT["macro-brasil"]);
    expect(prompt).toContain("Editorial photography");
    expect(prompt).toContain("dark navy and olive green");
    expect(prompt).toContain("no Bloomberg branding");
  });

  it("cobre as 8 categorias canônicas com conceito não vazio", () => {
    const slugs = [
      "macro-brasil",
      "macro-global",
      "geopolitica",
      "planejamento-financeiro",
      "investimento-internacional",
      "renda-fixa-credito",
      "mercado-de-capitais-br",
      "analises-e-estrategia",
    ] as const;
    for (const slug of slugs) {
      const concept = CATEGORY_TO_CONCEPT[slug];
      expect(concept, `categoria ${slug}`).toBeTruthy();
      expect(concept.length).toBeGreaterThan(20);
    }
  });

  it("Anti-SPEC §6.2b: nenhum conceito de categoria menciona Bloomberg", () => {
    // O boilerplate INCLUI 'no Bloomberg branding' propositalmente como
    // negative prompt ao DALL-E. O check só roda sobre o conceito.
    const concepts = Object.values(CATEGORY_TO_CONCEPT).join(" ");
    expect(/bloomberg/i.test(concepts)).toBe(false);
  });

  it("boilerplate inclui 'no Bloomberg branding' (negative prompt intencional)", () => {
    expect(/no Bloomberg branding/i.test(DALL_E_BOILERPLATE)).toBe(true);
  });
});

describe("cover-image-gen / antiSpecConceptCheck", () => {
  it("rejeita conceito contendo 'bloomberg' (case-insensitive)", () => {
    expect(() => antiSpecConceptCheck("Bloomberg terminal close-up")).toThrow(
      CoverPromptBloombergError,
    );
    expect(() => antiSpecConceptCheck("bloomberg")).toThrow();
  });

  it("aceita conceito sem Bloomberg", () => {
    expect(() =>
      antiSpecConceptCheck("São Paulo skyline at golden hour"),
    ).not.toThrow();
  });
});

describe("cover-image-gen / generateAndAttachCover", () => {
  it("retorna coverUrl=null quando openai falha (graceful, no throw)", async () => {
    const fakeOpenAi = {
      images: {
        generate: vi.fn().mockRejectedValue(new Error("DALL-E down")),
      },
    } as unknown as Parameters<typeof generateAndAttachCover>[1] extends infer D
      ? D extends { openaiClient?: infer O }
        ? O
        : never
      : never;

    const fakeSupabase = {
      storage: { from: vi.fn() },
      from: vi.fn(),
    } as unknown as Parameters<typeof generateAndAttachCover>[1] extends infer D
      ? D extends { supabaseClient?: infer S }
        ? S
        : never
      : never;

    const result = await generateAndAttachCover(
      { blogPostId: "test-id", categoriaSlug: "macro-brasil" },
      { openaiClient: fakeOpenAi, supabaseClient: fakeSupabase },
    );

    expect(result.coverUrl).toBe(null);
    expect(result.errorMessage).toContain("DALL-E down");
    expect(result.costBrl).toBe(0); // não chegou a chamar com sucesso
  });

  it("happy path: chama DALL-E + Supabase + retorna URL pública", async () => {
    const fakeOpenAi = {
      images: {
        generate: vi.fn().mockResolvedValue({
          data: [{ url: "https://cdn.openai.com/img.png" }],
        }),
      },
    };

    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = vi.fn().mockReturnValue({
      data: { publicUrl: "https://supabase.test/cover.png" },
    });
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const fakeSupabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: uploadMock,
          getPublicUrl: getPublicUrlMock,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: updateMock,
      }),
    };

    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    });

    const result = await generateAndAttachCover(
      { blogPostId: "post-1", categoriaSlug: "macro-brasil" },
      {
        openaiClient: fakeOpenAi as never,
        supabaseClient: fakeSupabase as never,
        fetchImpl: fakeFetch as never,
      },
    );

    expect(result.coverUrl).toBe("https://supabase.test/cover.png");
    expect(result.costBrl).toBe(DALL_E_COST_BRL);
    expect(result.errorMessage).toBe(null);
    expect(fakeOpenAi.images.generate).toHaveBeenCalledOnce();
    expect(uploadMock).toHaveBeenCalledOnce();
    expect(updateMock).toHaveBeenCalledOnce();
    expect(fakeSupabase.storage.from).toHaveBeenCalledWith(COVER_BUCKET);
  });
});
