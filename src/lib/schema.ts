// Schema.org structured data para SEO

export interface OrganizationSchema {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    "@type": string;
    streetAddress?: string;
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    addressCountry: string;
  };
  contactPoint?: {
    "@type": string;
    telephone?: string;
    contactType: string;
    email?: string;
  };
  sameAs?: string[];
}

export interface LocalBusinessSchema extends OrganizationSchema {
  "@type": "FinancialService" | "LocalBusiness";
  priceRange?: string;
  openingHours?: string[];
}

export interface BreadcrumbSchema {
  "@context": string;
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
}

export interface ArticleSchema {
  "@context": string;
  "@type": "Article";
  headline: string;
  description: string;
  image?: string | string[];
  datePublished: string;
  dateModified?: string;
  author: {
    "@type": "Organization" | "Person";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
}

/**
 * Gera o schema JSON-LD para a organização LDC Capital
 */
export function getOrganizationSchema(): OrganizationSchema {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ldccapital.com.br";
  
  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "LDC Capital",
    url: siteUrl,
    logo: `${siteUrl}/images/logo-ldc-principal.png`,
    description:
      "Consultoria de Investimentos independente. Raízes no interior, olhos no horizonte. Transparência, alinhamento de interesses e estratégia personalizada para grandes patrimônios.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "São Paulo",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contato@ldccapital.com.br",
    },
    sameAs: [
      // Adicione links para redes sociais quando disponíveis
      // "https://www.linkedin.com/company/ldc-capital",
      // "https://www.instagram.com/ldccapital",
    ],
  };
}

/**
 * Gera o schema JSON-LD para LocalBusiness (Google Maps)
 */
export function getLocalBusinessSchema(): LocalBusinessSchema {
  const orgSchema = getOrganizationSchema();
  
  return {
    ...orgSchema,
    "@type": "FinancialService",
    priceRange: "$$$",
    openingHours: ["Mo-Fr 09:00-18:00"],
  };
}

/**
 * Gera o schema JSON-LD para breadcrumbs
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url?: string }>): BreadcrumbSchema {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ldccapital.com.br";
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ? `${siteUrl}${item.url}` : undefined,
    })),
  };
}

/**
 * Gera o schema JSON-LD para artigo do blog
 */
export function getArticleSchema(
  title: string,
  description: string,
  image?: string,
  datePublished?: string,
  dateModified?: string
): ArticleSchema {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ldccapital.com.br";
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    image: image ? (image.startsWith("http") ? image : `${siteUrl}${image}`) : undefined,
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || datePublished || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "LDC Capital",
    },
    publisher: {
      "@type": "Organization",
      name: "LDC Capital",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/logo-ldc-principal.png`,
      },
    },
  };
}


