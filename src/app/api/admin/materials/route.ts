import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { createSupabaseAdminClient } from "@/lib/supabase";

type RawMaterial = {
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

type AuthorInfo = {
  id: string;
  name: string | null;
  email: string | null;
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

export async function GET() {
  try {
    console.log("Starting materials fetch...");

    const user = await checkAdminAuth();
    console.log("Auth check result:", user ? "authenticated" : "not authenticated");

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("Material")
      .select(materialSelection)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching materials via Supabase:", error);
      return NextResponse.json(
        { error: "Failed to load materials" },
        { status: 500 }
      );
    }

    const materials = (data as RawMaterial[] | null) ?? [];
    const enriched = await attachAuthors(materials, supabase);

    console.log(`Found ${enriched.length} materials`);
    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await checkAdminAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
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
    } = body;

    if (!title || !category || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const supabase = createSupabaseAdminClient();
    // Supabase client no Database types available here; cast to preserve DX.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const materialBuilder = supabase.from("Material") as any;

    const { data, error } = await materialBuilder
      .insert({
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
        pages: pages ? parseInt(pages) : null,
        published: published || false,
        featured: featured || false,
        authorId: user.id,
        publishedAt: published ? new Date().toISOString() : null,
      })
      .select(materialSelection)
      .single();

    if (error) {
      console.error("Error creating material via Supabase:", error);
      return NextResponse.json(
        { error: "Failed to create material", details: error.message },
        { status: 500 }
      );
    }

    const enriched = await attachAuthors([data as RawMaterial], supabase);
    return NextResponse.json(enriched[0], { status: 201 });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function attachAuthors(materials: RawMaterial[], supabase = createSupabaseAdminClient()) {
  const authorIds = Array.from(
    new Set(materials.map((mat) => mat.authorId).filter((id): id is string => !!id))
  );

  const authorsMap: Record<string, AuthorInfo> = {};

  if (authorIds.length > 0) {
    const { data: authors, error } = await supabase
      .from("User")
      .select("id, name, email")
      .in("id", authorIds);

    if (error) {
      console.warn("Failed to fetch authors for materials:", error.message);
    } else {
      const authorRows =
        (authors as Array<{ id: string; name: string | null; email: string | null }> | null) ?? [];

      authorRows.forEach((author) => {
        if (author.id) {
          authorsMap[author.id] = {
            id: author.id,
            name: author.name ?? null,
            email: author.email ?? null,
          };
        }
      });
    }
  }

  return materials.map((material) => ({
    ...material,
    author: authorsMap[material.authorId ?? ""] ?? {
      id: material.authorId ?? "",
      name: null,
      email: "",
    },
  }));
}
