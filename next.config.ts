import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Não falhar o build na Vercel por causa de warnings de ESLint; corrigir aos poucos.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wsoxukpeyzmpcngjugie.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  typescript: {
    // Não falhar o build por erros de tipo (opcional; remover quando o projeto estiver limpo).
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
