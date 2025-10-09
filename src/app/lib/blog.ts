import { createSupabaseAdminClient } from "@/lib/supabase";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: string;
  cover?: string;
  published: boolean;
  readingTime?: string;
  date: string;
  updatedAt: string;
  author: {
    name: string | null;
    email: string;
  };
}

type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  category: string;
  cover: string | null;
  published: boolean;
  readingTime: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  authorId: string | null;
};

const postSelection = `
  id,
  title,
  slug,
  content,
  summary,
  category,
  cover,
  published,
  readingTime,
  createdAt,
  updatedAt,
  publishedAt,
  authorId
`;

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("BlogPost")
      .select(postSelection)
      .eq("published", true)
      .order("publishedAt", { ascending: false })
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching blog posts:", error);
      return [];
    }

    const rows = (data as BlogPostRow[] | null) ?? [];
    const authorMap = await fetchAuthorMap(rows, supabase);
    return rows.map((row) => transformPost(row, authorMap));
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("BlogPost")
      .select(postSelection)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching blog post:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    const row = data as BlogPostRow;
    const authorMap = await fetchAuthorMap([row], supabase);
    return transformPost(row, authorMap);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

export async function getBlogCategories(): Promise<string[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("BlogPost")
      .select("category")
      .eq("published", true);

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    const categories = new Set<string>();
    ((data as { category: string | null }[] | null) ?? []).forEach((row) => {
      if (row.category) {
        categories.add(row.category);
      }
    });

    return Array.from(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function fetchAuthorMap(rows: BlogPostRow[], supabase = createSupabaseAdminClient()) {
  const authorIds = Array.from(
    new Set(rows.map((row) => row.authorId).filter((id): id is string => !!id))
  );

  if (authorIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("User")
    .select("id, name, email")
    .in("id", authorIds);

  if (error) {
    console.warn("Failed to load authors for blog posts:", error.message);
    return {};
  }

  const authorRows =
    (data as Array<{ id: string; name: string | null; email: string | null }> | null) ?? [];

  return authorRows.reduce<Record<string, { name: string | null; email: string }>>((map, author) => {
    if (author.id) {
      map[author.id] = {
        name: author.name ?? null,
        email: author.email ?? "",
      };
    }
    return map;
  }, {});
}

function transformPost(
  row: BlogPostRow,
  authorMap: Record<string, { name: string | null; email: string }>
): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    summary: row.summary || "",
    category: row.category,
    cover: row.cover || "",
    published: row.published,
    readingTime: row.readingTime || "5 min",
    date: row.publishedAt || row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      name: authorMap[row.authorId ?? ""]?.name ?? null,
      email: authorMap[row.authorId ?? ""]?.email ?? "",
    },
  };
}
