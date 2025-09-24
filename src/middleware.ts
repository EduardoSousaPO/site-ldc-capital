import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Verificar se é rota admin
    if (req.nextUrl.pathname.startsWith("/admin")) {
      // Permitir acesso à página de login
      if (req.nextUrl.pathname === "/admin/login") {
        return NextResponse.next();
      }

      // Verificar se o usuário tem permissão
      const token = req.nextauth.token;
      if (!token || (token.role !== "ADMIN" && token.role !== "EDITOR")) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      // Verificar se apenas ADMIN pode acessar configurações
      if (req.nextUrl.pathname.startsWith("/admin/settings") && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso à página de login sem token
        if (req.nextUrl.pathname === "/admin/login") {
          return true;
        }

        // Para outras rotas admin, verificar se tem token
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token && (token.role === "ADMIN" || token.role === "EDITOR");
        }

        // Permitir acesso a todas as outras rotas
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"]
};

