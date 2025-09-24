import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Verificar se é rota admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Permitir acesso à página de login
    if (request.nextUrl.pathname === "/admin/login") {
      return response;
    }

    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
              })
            },
          },
        }
      );

      const { data: { user }, error } = await supabase.auth.getUser();

      // Se não há usuário ou erro, redirecionar para login
      if (error || !user) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      // Verificar se o usuário tem permissão
      const userRole = user.user_metadata?.role;
      if (userRole !== "ADMIN" && userRole !== "EDITOR") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      // Verificar se apenas ADMIN pode acessar configurações
      if (request.nextUrl.pathname.startsWith("/admin/settings") && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};

