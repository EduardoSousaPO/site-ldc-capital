import { createSupabaseAdminClient } from "@/lib/supabase";

export interface Material {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  category: string;
  type: string;
  cover?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  pages?: number;
  published: boolean;
  featured: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: {
    name: string | null;
    email: string;
  };
}

type MaterialRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  category: string;
  type: string;
  cover: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  pages: number | null;
  published: boolean;
  featured: boolean;
  downloadCount: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  authorId: string | null;
};

type AuthorRecord = {
  name: string | null;
  email: string;
};

const materialSelection = `
  id,
  title,
  slug,
  description,
  content,
  category,
  type,
  cover,
  fileUrl,
  fileName,
  fileSize,
  pages,
  published,
  featured,
  downloadCount,
  createdAt,
  updatedAt,
  publishedAt,
  authorId
`;

export async function getMaterials(): Promise<Material[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("Material")
      .select(materialSelection)
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("publishedAt", { ascending: false });

    if (error) {
      console.error("Error fetching materials:", error);
      return [];
    }

    const rows = (data as MaterialRow[] | null) ?? [];
    const authorMap = await fetchAuthorMap(rows, supabase);
    return rows.map((row) => transformMaterial(row, authorMap));
  } catch (error) {
    console.error("Error fetching materials:", error);
    return [];
  }
}

export async function getFeaturedMaterials(): Promise<Material[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("Material")
      .select(materialSelection)
      .eq("published", true)
      .eq("featured", true)
      .order("publishedAt", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error fetching featured materials:", error);
      return [];
    }

    const rows = (data as MaterialRow[] | null) ?? [];
    const authorMap = await fetchAuthorMap(rows, supabase);
    return rows.map((row) => transformMaterial(row, authorMap));
  } catch (error) {
    console.error("Error fetching featured materials:", error);
    return [];
  }
}

export async function getMaterialBySlug(slug: string): Promise<Material | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("Material")
      .select(materialSelection)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching material by slug:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Increment download count asynchronously
    // Supabase client sem tipos de schema; cast para evitar erros de compilação.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const materialBuilder = supabase.from("Material") as any;

    const materialData = data as MaterialRow;

    await materialBuilder
      .update({ downloadCount: (materialData.downloadCount ?? 0) + 1 })
      .eq("id", materialData.id);

    const authorMap = await fetchAuthorMap([materialData], supabase);
    const transformed = transformMaterial(materialData, authorMap);
    transformed.downloadCount = (materialData.downloadCount ?? 0) + 1;
    return transformed;
  } catch (error) {
    console.error("Error fetching material by slug:", error);
    return null;
  }
}

export async function getMaterialCategories(): Promise<string[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("Material")
      .select("category")
      .eq("published", true);

    if (error) {
      console.error("Error fetching material categories:", error);
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
    console.error("Error fetching material categories:", error);
    return [];
  }
}

async function fetchAuthorMap(rows: MaterialRow[], supabase = createSupabaseAdminClient()) {
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
    console.warn("Failed to load authors for materials:", error.message);
    return {};
  }

  const authorRows =
    (data as Array<{ id: string; name: string | null; email: string | null }> | null) ?? [];

  return authorRows.reduce<Record<string, AuthorRecord>>((map, author) => {
    if (author.id) {
      map[author.id] = {
        name: author.name ?? null,
        email: author.email ?? "",
      };
    }
    return map;
  }, {});
}

function transformMaterial(
  material: MaterialRow,
  authorMap: Record<string, AuthorRecord>
): Material {
  const author = authorMap[material.authorId ?? ""];

  return {
    id: material.id,
    title: material.title,
    slug: material.slug,
    description: material.description || "",
    content: material.content || "",
    category: material.category,
    type: material.type,
    cover: material.cover || "",
    fileUrl: material.fileUrl || "",
    fileName: material.fileName || "",
    fileSize: material.fileSize || "",
    pages: material.pages ?? undefined,
    published: material.published,
    featured: material.featured,
    downloadCount: material.downloadCount ?? 0,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
    publishedAt: material.publishedAt ?? undefined,
    author: {
      name: author?.name ?? null,
      email: author?.email ?? "",
    },
  };
}
