import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

/**
 * Verifica autenticação de administradores usando apenas Supabase (Auth + PostgREST).
 * Remove a dependência direta do Prisma neste fluxo para evitar erros de conexão em produção.
 */
export async function checkAdminAuth(): Promise<AuthUser | null> {
  try {
    console.log("🔐 Checking admin authentication...");
    console.log("Environment check:", {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
    });

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.log("ℹ️ No authenticated user found via Supabase server client");
      return null;
    }

    console.log("✅ User found in Supabase via server client:", {
      id: user.id,
      email: user.email,
      metadata_role: user.user_metadata?.role,
    });

    const metadataRole = user.user_metadata?.role;

    if (metadataRole === "ADMIN" || metadataRole === "EDITOR") {
      return {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name,
        role: metadataRole,
      };
    }

    return await resolveUserRoleFromDatabase(user.id, user.email || "");
  } catch (error) {
    console.error("❌ Error in checkAdminAuth:", error);
    return null;
  }
}

// Tipo para o retorno da consulta Supabase
interface UserFromDB {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
}

async function resolveUserRoleFromDatabase(
  userId: string,
  email: string
): Promise<AuthUser | null> {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: userById, error: idError } = await supabaseAdmin
    .from("User")
    .select("id,email,name,role")
    .eq("id", userId)
    .maybeSingle() as { data: UserFromDB | null; error: Error | null };

  if (!idError && userById) {
    if (userById.role === "ADMIN" || userById.role === "EDITOR") {
      return {
        id: userById.id,
        email: userById.email || "",
        name: userById.name,
        role: userById.role,
      };
    }

    console.error("❌ Insufficient permissions via DB lookup:", userById.role);
    return null;
  }

  if (idError) {
    console.warn("⚠️ DB lookup by ID failed:", idError.message);
  }

  if (email) {
    const { data: userByEmail, error: emailError } = await supabaseAdmin
      .from("User")
      .select("id,email,name,role")
      .eq("email", email)
      .maybeSingle() as { data: UserFromDB | null; error: Error | null };

    if (emailError) {
      console.warn("⚠️ DB lookup by email failed:", emailError.message);
    }

    if (
      userByEmail &&
      (userByEmail.role === "ADMIN" || userByEmail.role === "EDITOR")
    ) {
      return {
        id: userByEmail.id,
        email: userByEmail.email || "",
        name: userByEmail.name,
        role: userByEmail.role,
      };
    }
  }

  console.error("❌ No authorized user found via Supabase admin lookup");
  return null;
}
