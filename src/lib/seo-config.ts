/**
 * Configurações de SEO e informações da empresa
 * Centraliza todas as informações necessárias para SEO, Structured Data e Metadata
 */

export const siteConfig = {
  // Informações básicas
  name: "LDC Capital",
  title: "LDC Capital - Mais do que finanças, direção",
  description: "Consultoria de Investimentos independente. Raízes no interior, olhos no horizonte. Transparência, alinhamento de interesses e estratégia personalizada para grandes patrimônios.",
  tagline: "Mais do que finanças, direção",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ldccapital.com.br",
  
  // Informações da empresa
  company: {
    name: "LDC Capital Consultoria de Investimentos",
    legalName: "LDC Capital Consultoria de Investimentos",
    cnpj: "58.321.323/0001-67",
    registration: "Em processo de regularização", // CVM
    address: {
      street: "Rua Rio Branco, 1290, sala 02",
      city: "Taquara",
      state: "RS",
      postalCode: "95600-074",
      country: "BR",
      region: "Centro",
    },
    contact: {
      email: "contato@ldccapital.com.br",
      phone: "+55-51-98930-1511",
      phoneFormatted: "(51) 98930-1511",
    },
    serviceType: "Consultoria de Investimentos",
    feesAndCommissionsSpecification: "Fee-based",
    areaServed: "BR",
  },

  // Redes sociais
  social: {
    youtube: "https://www.youtube.com/@luciano.herzog",
    instagram: "https://www.instagram.com/luciano.herzog",
    linkedin: "https://www.linkedin.com/company/ldc-capital",
    twitter: "@luciano.herzog", // Atualizar quando tiver handle oficial
  },

  // SEO
  keywords: [
    "consultoria de investimentos",
    "planejamento financeiro",
    "gestão patrimonial",
    "investimentos",
    "LDC Capital",
    "consultoria fee-based",
    "family office",
    "gestão de patrimônio",
    "assessoria de investimentos",
    "planejamento financeiro personalizado",
  ],

  // Open Graph
  ogImage: "/images/og-default.jpg", // Criar imagem 1200x630px
  ogImageAlt: "LDC Capital - Consultoria de Investimentos",

  // Twitter
  twitterHandle: "@luciano.herzog", // Atualizar quando tiver handle oficial
  twitterCard: "summary_large_image",

  // Analytics
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || "",
  googleTagManagerId: process.env.NEXT_PUBLIC_GTM_ID || "",

  // Google Search Console
  googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",

  // Locale
  locale: "pt_BR",
  language: "pt-BR",
};

/**
 * Helper para construir URLs completas
 */
export function getFullUrl(path: string = ""): string {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Helper para obter URL da imagem OG
 */
export function getOgImageUrl(path?: string): string {
  if (path) {
    return getFullUrl(path);
  }
  return getFullUrl(siteConfig.ogImage);
}

