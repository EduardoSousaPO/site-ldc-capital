import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  __resetBlogpostDbForTests,
  __setBlogpostClientForTests,
  findCategoryIdAndNameBySlug,
  findExistingArticleBySlug,
  insertBlogPost,
} from "../blogpost-db";
import type { BlogArticleDraft } from "@/features/news/contracts/openai";

interface ChainResult {
  data: unknown;
  error: { message: string } | null;
}

function makeChain(result: ChainResult) {
  const chain: Record<string, unknown> = {};
  const fn = () => chain;
  chain.select = vi.fn(fn);
  chain.insert = vi.fn(fn);
  chain.update = vi.fn(fn);
  chain.eq = vi.fn(fn);
  chain.order = vi.fn(fn);
  chain.limit = vi.fn(fn);
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  return chain;
}

function makeMockClient(
  byTable: Record<string, ChainResult>,
): SupabaseClient {
  return {
    from: vi.fn((table: string) => {
      const r = byTable[table] ?? { data: null, error: null };
      return makeChain(r);
    }),
  } as unknown as SupabaseClient;
}

function makeArticle(): BlogArticleDraft {
  return {
    title: "Artigo de teste para insertBlogPost — macro global denso e canônico",
    slug: "artigo-teste-insert-blogpost",
    categoria_slug: "macro-global",
    summary:
      "Resumo executivo do artigo de teste para validar insertBlogPost com payload coerente, dentro dos limites Zod do schema canônico.",
    hook: "Hook do artigo de teste com tamanho mínimo aceitável para passar o min(80) do schema relaxado.",
    body_markdown:
      "# Artigo de teste\n\n" +
      "Conteúdo de teste com volume suficiente para passar o minimum 2000 chars do BlogArticleDraft.\n\n".repeat(
        50,
      ),
    cenarios: [
      {
        titulo: "Cenário 1",
        descricao: "Descrição do cenário 1 forward-looking.",
        gatilho: null,
      },
      {
        titulo: "Cenário 2",
        descricao: "Descrição do cenário 2 forward-looking.",
        gatilho: "Reunião de junho",
      },
    ],
    fontes: [
      {
        url: "https://www.reuters.com/test",
        title: "Reuters test",
        dominio: "reuters.com",
      },
      {
        url: "https://www.ft.com/test",
        title: "FT test",
        dominio: "ft.com",
      },
    ],
    fonte_origem_pdf_ids: [],
  };
}

describe("blogpost-db", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key-fake");
    __resetBlogpostDbForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    __resetBlogpostDbForTests();
    vi.restoreAllMocks();
  });

  it("findCategoryIdAndNameBySlug retorna {id, name} para slug existente e cacheia o resultado", async () => {
    const client = makeMockClient({
      Category: {
        data: {
          id: "72859827-299e-4b95-8067-bee799ba3937",
          name: "Macro Global",
          slug: "macro-global",
        },
        error: null,
      },
    });
    __setBlogpostClientForTests(client);

    const first = await findCategoryIdAndNameBySlug("macro-global");
    expect(first).toEqual({
      id: "72859827-299e-4b95-8067-bee799ba3937",
      name: "Macro Global",
    });

    // Segunda chamada deve usar cache — `from` chamado só 1x.
    const second = await findCategoryIdAndNameBySlug("macro-global");
    expect(second).toEqual(first);
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("insertBlogPost insere com published=false e authorDisplayName='Editorial LDC'", async () => {
    const insertedRow = {
      id: "post-id-fresh",
      slug: "artigo-teste-insert-blogpost",
    };
    const insertChain = makeChain({ data: insertedRow, error: null });
    const client = {
      from: vi.fn(() => insertChain),
    } as unknown as SupabaseClient;
    __setBlogpostClientForTests(client);

    const article = makeArticle();
    const result = await insertBlogPost({
      article,
      categoryId: "cat-id-1",
      categoryName: "Macro Global",
      authorId: "user-admin-1",
    });

    expect(result).toEqual(insertedRow);
    // Verifica payload: precisa ter published=false e authorDisplayName correto.
    const insertCall = (insertChain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(insertCall).toMatchObject({
      title: article.title,
      slug: article.slug,
      content: article.body_markdown,
      summary: article.summary,
      category: "Macro Global",
      categoryId: "cat-id-1",
      published: false,
      authorId: "user-admin-1",
      authorDisplayName: "Editorial LDC",
      cover: null,
    });
    expect(insertCall.readingTime).toMatch(/^\d+ min$/);
  });

  it("findExistingArticleBySlug retorna existente para idempotência (slug duplicado)", async () => {
    const existing = {
      id: "post-id-existente",
      slug: "boj-banco-central-emergente-2026",
      published: false,
    };
    const client = makeMockClient({
      BlogPost: { data: existing, error: null },
    });
    __setBlogpostClientForTests(client);

    const result = await findExistingArticleBySlug(
      "boj-banco-central-emergente-2026",
    );
    expect(result).toEqual(existing);
  });

  it("findExistingArticleBySlug retorna null quando slug não existe (caminho feliz para insert)", async () => {
    const client = makeMockClient({
      BlogPost: { data: null, error: null },
    });
    __setBlogpostClientForTests(client);

    const result = await findExistingArticleBySlug("slug-inexistente");
    expect(result).toBeNull();
  });
});
