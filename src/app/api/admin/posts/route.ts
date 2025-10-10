import { NextRequest, NextResponse } from "next/server";
import readingTime from "reading-time";
import { checkAdminAuth } from "@/lib/auth-check";
import { createSupabaseAdminClient } from "@/lib/supabase";
// no explicit id creation; database default handles it

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

type AuthorMap = Record<
  string,
  {
    id: string;
    name: string | null;
    email: string | null;
  }
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

export async function GET() {
  try {
    const user = await checkAdminAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("BlogPost")
      .select(postSelection)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching posts via Supabase:", error);
      return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
    }

    const posts = (data as RawPost[] | null) ?? [];
    const enriched = await attachAuthors(posts, supabase);

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Creating new post (Supabase)...");
    console.log("Environment check:", {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
    });

    const user = await checkAdminAuth();

    if (!user) {
      console.log("🚫 Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authorized:", user.email);

    const body = await request.json();
    console.log("Payload received:", {
      ...body,
      content: body.content ? "Content provided" : "No content",
    });

    const { title, content, summary, category, cover, published } = body;

    if (!title || !content) {
      console.log("⚠️ Missing required fields:", {
        title: !!title,
        content: !!content,
      });
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { title: !!title, content: !!content },
        },
        { status: 400 }
      );
    }

    const baseSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    console.log("Slug base:", baseSlug);

    const stats = readingTime(content);
    console.log("Reading time:", stats.text);

    const supabase = createSupabaseAdminClient();
    // Supabase client no Database types available here; cast to preserve DX.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postBuilder = supabase.from("BlogPost") as any;

    // ensure unique slug (case-insensitive)
    const { data: existingSlugsData } = await supabase
      .from("BlogPost")
      .select("slug")
      .ilike("slug", `${baseSlug}%`);

    const existingSlugs = (existingSlugsData as Array<{ slug: string }> | null) ?? [];
    const taken = new Set(existingSlugs.map((s) => (s.slug || "").toLowerCase()));
    let slug = baseSlug;
    if (taken.has(baseSlug.toLowerCase())) {
      // find next numeric suffix
      let maxN = 1;
      existingSlugs.forEach((s) => {
        const val = (s.slug || "").toLowerCase();
        if (val === baseSlug) maxN = Math.max(maxN, 1);
        const m = val.match(new RegExp(`^${baseSlug.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}-(\\d+)$`));
        if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
      });
      slug = `${baseSlug}-${maxN + 1}`;
    }
    console.log("Slug final:", slug);

    const { data, error } = await postBuilder
      .insert({
        title: title.trim(),
        slug,
        content,
        summary: summary?.trim() || null,
        category: category || "Geral",
        cover: cover || null,
        published: published || false,
        readingTime: stats.text,
        authorId: user.id,
        publishedAt: published ? new Date().toISOString() : null,
      })
      .select(postSelection)
      .single();

    if (error) {
      console.error("Error inserting post via Supabase:", error);
      return NextResponse.json(
        { error: "Failed to create post", details: error.message },
        { status: 500 }
      );
    }

    const enriched = await attachAuthors([(data as RawPost)], supabase);
    const createdPost = enriched[0] ?? data;

    console.log("✅ Post created successfully:", createdPost?.id);
    return NextResponse.json(createdPost, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating post:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function attachAuthors(posts: RawPost[], supabase = createSupabaseAdminClient()) {
  const authorIds = Array.from(
    new Set(posts.map((post) => post.authorId).filter((id): id is string => !!id))
  );

  let authorMap: AuthorMap = {};

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

      authorMap = authorRows.reduce<AuthorMap>((map, author) => {
        if (author.id) {
          map[author.id] = {
            id: author.id,
            name: author.name ?? null,
            email: author.email ?? null,
          };
        }
        return map;
      }, {});
    }
  }

  return posts.map((post) => ({
    ...post,
    author: authorMap[post.authorId ?? ""] ?? {
      id: post.authorId ?? "",
      name: null,
      email: "",
    },
  }));
}
