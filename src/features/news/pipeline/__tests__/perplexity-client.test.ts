import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryPerplexity } from "../perplexity-client";
import {
  PerplexityQuery,
  PERPLEXITY_DOMAIN_FILTER,
} from "@/features/news/contracts/perplexity";

const baseQuery = {
  query: "Quais foram os principais movimentos macro Brasil hoje?",
  tema_categoria: "macro_brasil",
  search_recency_filter: "day" as const,
  search_domain_filter: [...PERPLEXITY_DOMAIN_FILTER],
  return_citations: true as const,
};

describe("perplexity-client", () => {
  beforeEach(() => {
    vi.stubEnv("PERPLEXITY_API_KEY", "pplx-test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sem_bloomberg_no_filter — Zod refine rejeita bloomberg.com em domain filter (CA-011, RNF-008)", () => {
    expect(() =>
      PerplexityQuery.parse({
        ...baseQuery,
        search_domain_filter: ["reuters.com", "bloomberg.com"],
      }),
    ).toThrow();
  });

  it("filtra_citation_bloomberg_post_response — defense in depth contra Bloomberg vazado (RNF-008)", async () => {
    const response = await queryPerplexity(baseQuery, {
      httpClient: async () => ({
        choices: [{ message: { content: "Análise..." } }],
        search_results: [
          { url: "https://www.reuters.com/markets/abc", title: "Reuters" },
          { url: "https://www.bloomberg.com/news/zzz", title: "Bloomberg leak" },
          { url: "https://www.ft.com/content/xyz", title: "FT" },
        ],
        citations: [
          "https://www.reuters.com/markets/abc",
          "https://bloomberg.net/news/leak2",
        ],
      }),
    });
    expect(response.citations.length).toBe(2); // Reuters + FT
    for (const c of response.citations) {
      expect(c.url.toLowerCase()).not.toContain("bloomberg");
      expect(c.dominio.toLowerCase()).not.toContain("bloomberg");
    }
    expect(response.has_public_coverage).toBe(true);
  });

  it("timeout_15s_retry_1x — falha 1x e tenta novamente (CB-001)", async () => {
    let calls = 0;
    const response = await queryPerplexity(baseQuery, {
      httpClient: async () => {
        calls++;
        if (calls === 1) throw new Error("timeout");
        return {
          choices: [{ message: { content: "ok" } }],
          search_results: [{ url: "https://www.reuters.com/x", title: "x" }],
        };
      },
    });
    expect(calls).toBe(2);
    expect(response.has_public_coverage).toBe(true);
  });

  it("aborta_apos_2_falhas — lança após 1 retry (CB-001)", async () => {
    await expect(
      queryPerplexity(baseQuery, {
        httpClient: async () => {
          throw new Error("502 Bad Gateway");
        },
      }),
    ).rejects.toThrow(/após 2 tentativas/);
  });

  it("zero_citations_marca_has_public_coverage_false (CA-012b)", async () => {
    const response = await queryPerplexity(baseQuery, {
      httpClient: async () => ({
        choices: [{ message: { content: "Análise educacional sem fontes" } }],
        citations: [],
        search_results: [],
      }),
    });
    expect(response.has_public_coverage).toBe(false);
    expect(response.citations).toHaveLength(0);
  });
});
