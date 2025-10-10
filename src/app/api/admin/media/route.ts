import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET as string;
    if (!bucket) {
      return NextResponse.json({ error: "Storage bucket not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "images"; // images | materials
    const folder = type === "materials" ? "materials" : "images";

    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      console.error("Media list error:", error.message);
      return NextResponse.json({ error: "Failed to list media" }, { status: 500 });
    }

    const items = (data || [])
      .filter((f) => !f.name.startsWith("."))
      .map((f) => {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(`${folder}/${f.name}`);
        return {
          name: f.name,
          size: f.metadata?.size ?? 0,
          createdAt: f.created_at,
          url: pub.publicUrl,
          path: `${folder}/${f.name}`,
        };
      });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Media route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

