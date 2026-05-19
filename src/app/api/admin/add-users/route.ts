import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

// Cria usuários administrativos adicionais no Supabase Auth
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    const defaultPassword = process.env.ADMIN_SYNC_PASSWORD || "LdcBlog2026";

    const usersToCreate = [
      { email: "eduardo.sousa@ldccapital.com.br", name: "Eduardo Sousa" },
      { email: "marcos.meneghel@ldccapital.com.br", name: "Marcos Meneghel" },
      { email: "luciano.herzog@ldccapital.com.br", name: "Luciano Herzog" },
    ];

    const results: Array<{ email: string; status: "created" | "exists" | "error"; message?: string }> = [];

    for (const u of usersToCreate) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          name: u.name,
          role: "ADMIN",
        },
      });

      if (error) {
        // Se o usuário já existir, retornamos status amigável
        const alreadyExists = error.message?.toLowerCase().includes("already registered");
        results.push({ email: u.email, status: alreadyExists ? "exists" : "error", message: error.message });
      } else {
        results.push({ email: data.user?.email || u.email, status: "created" });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}









