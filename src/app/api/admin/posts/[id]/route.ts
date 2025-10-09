import { NextRequest, NextResponse } from "next/server";
import readingTime from "reading-time";
import { checkAdminAuth } from "@/lib/auth-check";
import { createSupabaseAdminClient } from "@/lib/supabase";

type RawPost = {
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

type AuthorInfo = {
  id: string;
  name: string | null;
  email: string | null;
};

type PostMeta = Pick<
  RawPost,
  "id" | "title" | "slug" | "content" | "readingTime" | "published" | "authorId"
>;

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
      .from("BlogPost")
      .select(postSelection)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching post via Supabase:", error);
      return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const postRow = data as RawPost;
    const enriched = await attachAuthors([postRow], supabase);
    return NextResponse.json(enriched[0]);
  } catch (error) {
    console.error("Error fetching post:", error);
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
    const payload = await request.json();
    const { title, content, summary, category, cover, published } = payload;

    const supabase = createSupabaseAdminClient();

    const { data: existingPostRow, error: fetchError } = await supabase
      .from("BlogPost")
      .select("id, title, slug, content, readingTime, published, authorId")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching post before update:", fetchError);
      return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
    }

    if (!existingPostRow) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingPost = existingPostRow as PostMeta;

    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    let newReadingTime = existingPost.readingTime;
    if (content && content !== existingPost.content) {
      const stats = readingTime(content);
      newReadingTime = stats.text;
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (title) {
      updateData.title = title;
      updateData.slug = slug;
    }
    if (content) {
      updateData.content = content;
      updateData.readingTime = newReadingTime;
    }
    if (summary !== undefined) updateData.summary = summary;
    if (category) updateData.category = category;
    if (cover !== undefined) updateData.cover = cover;
    if (published !== undefined) {
      updateData.published = published;
      if (published && !existingPost.published) {
        updateData.publishedAt = new Date().toISOString();
      }
    }

    // Supabase client no Database types available here; cast to preserve DX.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateBuilder = supabase.from("BlogPost") as any;
    const { data, error: updateError } = await updateBuilder
      .update(updateData)
      .eq("id", id)
      .select(postSelection)
      .single();

    if (updateError) {
      console.error("Error updating post via Supabase:", updateError);
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }

    const postRow = data as RawPost;
    const enriched = await attachAuthors([postRow], supabase);
    return NextResponse.json(enriched[0]);
  } catch (error) {
    console.error("Error updating post:", error);
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

    const { error } = await supabase.from("BlogPost").delete().eq("id", id);

    if (error) {
      console.error("Error deleting post via Supabase:", error);
      return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function attachAuthors(posts: RawPost[], supabase = createSupabaseAdminClient()) {
  const authorIds = Array.from(
    new Set(posts.map((post) => post.authorId).filter((id): id is string => !!id))
  );

  const authorsMap: Record<string, AuthorInfo> = {};

  if (authorIds.length > 0) {
    const { data: authors, error } = await supabase
      .from("User")
      .select("id, name, email")
      .in("id", authorIds);

    if (error) {
      console.warn("Failed to fetch authors for posts:", error.message);
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

  return posts.map((post) => ({
    ...post,
    author: authorsMap[post.authorId ?? ""] ?? {
      id: post.authorId ?? "",
      name: null,
      email: "",
    },
  }));
}
