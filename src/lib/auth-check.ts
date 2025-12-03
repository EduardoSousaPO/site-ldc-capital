import { cookies } from "next/headers";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";
import type { User } from "./auth-supabase";
import { createClient } from '@supabase/supabase-js';

/**
 * Verifica autenticacao e retorna o usuario atual (para uso em API routes)
 * Retorna null se nao autenticado ou sem permissao de admin/editor
 */
export async function checkAdminAuth(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    
    // Criar cliente Supabase SSR
    const supabase = createSupabaseServerClient(cookieStore);
    const admin = createSupabaseAdminClient();

    // Tentar obter usuário
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      // Só logar erros em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error("Erro ao obter usuário:", error);
      }
      return null;
    }

    // Role vem do metadata (Supabase) e sincronizamos com a tabela User
    const metadataRole = (authUser.user_metadata?.role as string | undefined) || undefined;
    const normalizedRole = metadataRole?.toUpperCase() as User["role"] | undefined;

    const { data: dbUser, error: upsertError } = await admin
      .from("User")
      .upsert(
        {
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name || authUser.email || "Usuario",
          role: normalizedRole || "USER",
        },
        { onConflict: "id" }
      )
      .select("id, email, name, role")
      .single();

    if (upsertError || !dbUser) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erro ao sincronizar usuario no Supabase:", upsertError);
      }
      return null;
    }

    const resolvedRole = normalizedRole || (dbUser.role as User["role"]) || "USER";

    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || undefined,
      role: resolvedRole,
    };

    if (user.role !== "ADMIN" && user.role !== "EDITOR") {
      return null;
    }

    return user;
  } catch (error) {
    // Só logar erros em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error("Error checking admin auth:", error);
    }
    return null;
  }
}
