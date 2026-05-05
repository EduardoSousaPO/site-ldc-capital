import { z } from "zod";

export const PERPLEXITY_DOMAIN_FILTER = [
  "reuters.com",
  "ft.com",
  "valor.com.br",
  "neofeed.com.br",
  "wsj.com",
  "economist.com",
  "infomoney.com.br",
  "axios.com",
] as const;

export const PerplexityQuery = z.object({
  query: z.string().min(10).max(500),
  tema_categoria: z.string(),
  search_recency_filter: z.literal("day"),
  search_domain_filter: z.array(z.string()).refine(
    (arr) => !arr.some((d) => /bloomberg/i.test(d)),
    { message: "Bloomberg não pode estar no domain filter (RNF-008)" },
  ),
  return_citations: z.literal(true),
});
export type PerplexityQuery = z.infer<typeof PerplexityQuery>;

export const PerplexityCitation = z.object({
  url: z.string().url().refine(
    (url) => !/bloomberg/i.test(url),
    { message: "Bloomberg não pode ser citação válida (RNF-008)" },
  ),
  title: z.string().optional(),
  dominio: z.string(),
});
export type PerplexityCitation = z.infer<typeof PerplexityCitation>;

export const PerplexityResponse = z.object({
  query: z.string(),
  tema_categoria: z.string(),
  content: z.string(),
  citations: z.array(PerplexityCitation),
  has_public_coverage: z.boolean(),
});
export type PerplexityResponse = z.infer<typeof PerplexityResponse>;
