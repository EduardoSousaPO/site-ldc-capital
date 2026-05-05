import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateBlogArticles,
  OpenAiCostExceededError,
  OpenAiSchemaParseError,
} from "../openai-client";
import type { BlogArticleGenerationRequest } from "@/features/news/contracts/openai";

const baseRequest: BlogArticleGenerationRequest = {
  bloomberg_signals: [
    {
      pdf_id: "pdf-1",
      format: "PBN",
      text: "Sinal Bloomberg interno (não citável).",
      auto_translated: false,
    },
  ],
  public_sources: [
    {
      tema_categoria: "macro_global",
      perplexity_content: "BoJ aumentou guidance...",
      citations: [
        {
          url: "https://www.reuters.com/markets/asia/jgb-2026",
          title: "JGB 30Y yield",
          dominio: "reuters.com",
        },
        {
          url: "https://www.ft.com/content/yen-2026",
          title: "Yen revaluation",
          dominio: "ft.com",
        },
      ],
    },
  ],
  turno: "manha",
  data_referencia: "2026-05-02",
};

function makeValidArticle() {
  return {
    title: "Como o BoJ virou banco central emergente em 2026 — implicações UHNW",
    slug: "boj-banco-central-emergente-2026",
    categoria_slug: "macro-global" as const,
    summary:
      "Pela primeira vez em duas décadas, o BoJ se comporta como banco central emergente. Para famílias UHNW com legacy positions em iene, o trade-off entre câmbio e sucessão mudou de natureza.",
    hook: "Pela primeira vez desde a virada do milênio, o Banco do Japão se comportou em 2026 como banco central emergente, alterando os incentivos para alocação patrimonial UHNW que conviveu com YCC por uma década inteira.",
    body_markdown:
      "Pela primeira vez desde a virada do milênio, o Banco do Japão se comportou em 2026 como banco central emergente. " +
      "O JGB de 30 anos cravou 2,5%, primeiro fechamento acima dessa marca desde 2008.\n\n## Como chegamos aqui\n\n" +
      "O arco começa em 2016 com Yield Curve Control. ".repeat(40) +
      "\n\n## O que os dados mostram\n\n" +
      "O 30Y japonês rendia 0,7% em 2023 e fecha 2,5% em 2026. ".repeat(30) +
      "\n\n## Implicação UHNW\n\n" +
      "Famílias com legacy positions em iene enfrentam trade-off de duration. ".repeat(20) +
      "\n\n## Cenários a monitorar\n\nLista forward-looking. ".repeat(10) +
      "\n\n## Encerramento\n\nProcesso supera tática.",
    cenarios: [
      {
        titulo: "Aceleração do BoJ",
        descricao: "Inflação acima de 2,5% leva BoJ a 1,25% até dezembro.",
        gatilho: "Reunião BoJ de julho",
      },
      {
        titulo: "Recessão global",
        descricao: "ISM EUA abaixo de 45 contrai diferencial Fed-BoJ.",
        gatilho: "Payroll de junho",
      },
    ],
    fontes: [
      {
        url: "https://www.reuters.com/markets/asia/jgb-2026",
        title: "JGB 30Y yield",
        dominio: "reuters.com",
      },
      {
        url: "https://www.ft.com/content/yen-2026",
        title: "Yen revaluation",
        dominio: "ft.com",
      },
    ],
    fonte_origem_pdf_ids: ["pdf-1"],
  };
}

interface MockClientHandle {
  mock: { chat: { completions: { parse: ReturnType<typeof vi.fn> } } };
  parseFn: ReturnType<typeof vi.fn>;
}

function makeMockClient(opts: {
  parsedResponse?: unknown;
  usage?: unknown;
  throwError?: Error;
}): MockClientHandle {
  const parseFn = vi.fn(async () => {
    if (opts.throwError) throw opts.throwError;
    return {
      choices: [{ message: { parsed: opts.parsedResponse } }],
      usage: opts.usage,
      model: "gpt-5-mini",
    };
  });
  return {
    mock: {
      chat: {
        completions: { parse: parseFn },
      },
    },
    parseFn,
  };
}

describe("openai-client / generateBlogArticles", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-fake");
    vi.stubEnv("OPENAI_INPUT_USD_PER_1M", "0.25");
    vi.stubEnv("OPENAI_CACHED_INPUT_USD_PER_1M", "0.025");
    vi.stubEnv("OPENAI_OUTPUT_USD_PER_1M", "2.0");
    vi.stubEnv("OPENAI_USD_BRL_RATE", "5.0");
    vi.stubEnv("OPENAI_MAX_COST_BRL_PER_RUN", "5.0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("retorna schema válido quando OpenAI responde com Structured Output bem-formado", async () => {
    const article = makeValidArticle();
    const mockResponse = {
      articles: [article],
      themes_discarded: [],
      metadata: {
        model: "gpt-5-mini",
        total_tokens: 0,
        cached_tokens: 0,
        cost_brl: 0,
      },
    };
    const { mock } = makeMockClient({
      parsedResponse: mockResponse,
      usage: {
        prompt_tokens: 5000,
        completion_tokens: 1500,
        total_tokens: 6500,
        prompt_tokens_details: { cached_tokens: 4000 },
      },
    });

    const result = await generateBlogArticles(baseRequest, {
      openaiClient: mock as never,
    });

    expect(result.articles).toHaveLength(1);
    expect(result.articles[0]?.slug).toBe("boj-banco-central-emergente-2026");
    expect(result.articles[0]?.categoria_slug).toBe("macro-global");
    // Metadata é sobrescrito pelo cliente com valores reais derivados de usage.
    expect(result.metadata.model).toBe("gpt-5-mini");
    expect(result.metadata.cached_tokens).toBe(4000);
    expect(result.metadata.total_tokens).toBe(6500);
    expect(result.metadata.cost_brl).toBeGreaterThan(0);
    expect(result.metadata.cost_brl).toBeLessThan(5); // dentro do limite
  });

  it("hard fail OpenAiCostExceededError quando custo > R$5/rodada", async () => {
    vi.stubEnv("OPENAI_MAX_COST_BRL_PER_RUN", "0.0001"); // limite mínimo

    const mockResponse = {
      articles: [],
      themes_discarded: [],
      metadata: {
        model: "gpt-5-mini",
        total_tokens: 0,
        cached_tokens: 0,
        cost_brl: 0,
      },
    };
    const { mock } = makeMockClient({
      parsedResponse: mockResponse,
      usage: {
        prompt_tokens: 100_000,
        completion_tokens: 50_000,
        total_tokens: 150_000,
        prompt_tokens_details: { cached_tokens: 0 },
      },
    });

    await expect(
      generateBlogArticles(baseRequest, {
        openaiClient: mock as never,
      }),
    ).rejects.toBeInstanceOf(OpenAiCostExceededError);
  });

  it("JSON malformado: retry 1x e depois throw OpenAiSchemaParseError", async () => {
    const failure = new Error(
      "Zod schema validation failed: 'articles' missing",
    );
    const handle = makeMockClient({ throwError: failure });

    await expect(
      generateBlogArticles(baseRequest, {
        openaiClient: handle.mock as never,
      }),
    ).rejects.toBeInstanceOf(OpenAiSchemaParseError);

    // 1 retry default → 2 chamadas totais
    expect(handle.parseFn.mock.calls.length).toBe(2);
  });

  it("filtra artigo com Bloomberg em fontes (defense in depth Anti-SPEC §6.2b)", async () => {
    const dirtyArticle = makeValidArticle();
    dirtyArticle.fontes = [
      {
        url: "https://www.bloomberg.com/news/articles/2026-05-02/yen",
        title: "Yen story",
        dominio: "bloomberg.com",
      },
      {
        url: "https://www.ft.com/content/yen",
        title: "Yen FT",
        dominio: "ft.com",
      },
    ];
    const cleanArticle = makeValidArticle();
    cleanArticle.slug = "outro-artigo-limpo";
    cleanArticle.title = "Outro artigo macro global limpo, sem Bloomberg em fontes";

    const mockResponse = {
      articles: [dirtyArticle, cleanArticle],
      themes_discarded: [],
      metadata: {
        model: "gpt-5-mini",
        total_tokens: 0,
        cached_tokens: 0,
        cost_brl: 0,
      },
    };
    const { mock } = makeMockClient({
      parsedResponse: mockResponse,
      usage: {
        prompt_tokens: 3000,
        completion_tokens: 1000,
        total_tokens: 4000,
        prompt_tokens_details: { cached_tokens: 0 },
      },
    });

    const result = await generateBlogArticles(baseRequest, {
      openaiClient: mock as never,
    });

    expect(result.articles).toHaveLength(1);
    expect(result.articles[0]?.slug).toBe("outro-artigo-limpo");
  });
});
