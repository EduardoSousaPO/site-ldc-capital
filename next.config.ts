import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Não falhar o build na Vercel por causa de warnings de ESLint; corrigir aos poucos.
    ignoreDuringBuilds: true,
  },
  images: {
    // Permite usar URL externa direto no campo "URL da capa" do CMS.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  typescript: {
    // Não falhar o build por erros de tipo (opcional; remover quando o projeto estiver limpo).
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
