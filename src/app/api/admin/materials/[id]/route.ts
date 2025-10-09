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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAdminAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("Material")
      .select(materialSelection)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching material via Supabase:", error);
      return NextResponse.json(
        { error: "Failed to fetch material" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const enriched = await attachAuthors([data as RawMaterial], supabase);
    return NextResponse.json(enriched[0]);
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAdminAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    const supabase = createSupabaseAdminClient();

    const { data: existingMaterial, error: fetchError } = await supabase
      .from("Material")
      .select("id, title, slug, published, authorId")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching material before update:", fetchError);
      return NextResponse.json({ error: "Failed to load material" }, { status: 500 });
    }

    if (!existingMaterial) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    let slug = existingMaterial.slug as string;
    if (title && title !== existingMaterial.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (title) {
      updateData.title = title;
      updateData.slug = slug;
    }
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (category) updateData.category = category;
    if (type) updateData.type = type;
    if (cover !== undefined) updateData.cover = cover;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (fileName !== undefined) updateData.fileName = fileName;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (pages !== undefined) updateData.pages = pages ? parseInt(pages) : null;
    if (published !== undefined) {
      updateData.published = published;
      if (published && !existingMaterial.published) {
        updateData.publishedAt = new Date().toISOString();
      }
    }
    if (featured !== undefined) updateData.featured = featured;

    const { data, error: updateError } = await supabase
      .from("Material")
      .update(updateData)
      .eq("id", id)
      .select(materialSelection)
      .single();

    if (updateError) {
      console.error("Error updating material via Supabase:", updateError);
      return NextResponse.json(
        { error: "Failed to update material" },
        { status: 500 }
      );
    }

    const enriched = await attachAuthors([data as RawMaterial], supabase);
    return NextResponse.json(enriched[0]);
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAdminAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("Material").delete().eq("id", id);

    if (error) {
      console.error("Error deleting material via Supabase:", error);
      return NextResponse.json(
        { error: "Failed to delete material" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting material:", error);
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
      (authors ?? []).forEach((author) => {
        if (author?.id) {
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
