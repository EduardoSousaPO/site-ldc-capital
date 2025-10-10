import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/auth-check";

const normalizeSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export async function GET() {
  try {
    const user = await checkAdminAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createSupabaseAdminClient();
    // cast to keep DX without Database types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const catBuilder = supabase.from("Category") as any;
    const { data, error } = await catBuilder.select("id,name,slug").order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await checkAdminAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await request.json();
    if (!name || String(name).trim().length < 2) {
      return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    }
    const slug = normalizeSlug(name);

    const supabase = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const catBuilder = supabase.from("Category") as any;
    const { data, error } = await catBuilder.insert({ name, slug }).select("id,name,slug").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
