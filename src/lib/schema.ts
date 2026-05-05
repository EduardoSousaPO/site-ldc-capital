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
    url?: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
  mainEntityOfPage?: {
    "@type": "WebPage";
    "@id": string;
  };
  articleSection?: string;
  inLanguage?: string;
}

export interface BlogArticleSchemaInput {
  title: string;
  summary?: string;
  cover?: string | null;
  slug: string;
  category?: string | null;
  authorDisplayName?: string | null;
  /** ISO 8601 — geralmente `post.date` (publishedAt ?? createdAt). */
  datePublished: string;
  /** ISO 8601 — geralmente `post.updatedAt`. */
  dateModified?: string;
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
      "https://www.linkedin.com/company/ldc-capital",
      "https://www.instagram.com/ldc.capital",
      "https://www.youtube.com/@luciano.herzog",
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
 * Gera o schema JSON-LD para artigo do blog (versão LEGADA — assinatura
 * posicional). Mantida para callers existentes que ainda não migraram para
 * o helper enriquecido `getBlogArticleSchema`. Para artigos do pipeline IA
 * pós-pivot, prefira o helper enriquecido (cobre `mainEntityOfPage`,
 * `articleSection`, `inLanguage`, e respeita `authorDisplayName`).
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

/**
 * Gera o schema JSON-LD enriquecido para artigos do blog (F-016 — pós-pivot
 * ADR-005). Adiciona campos que o helper legado `getArticleSchema` não cobre:
 *
 *   - `mainEntityOfPage` — canonical URL do artigo (sinal SEO/GEO)
 *   - `articleSection` — categoria ("Macro Brasil", "Macro Global", etc.) que
 *     ChatGPT/Perplexity usam para classificar conteúdo
 *   - `inLanguage: "pt-BR"` — idioma explícito (requisito para artigos macro
 *     brasileiros)
 *   - `author.name` — usa `authorDisplayName` ("Editorial LDC" para artigos
 *     do pipeline) em vez de hardcode "LDC Capital"
 *   - `author.url` — link para a organização
 *
 * O helper aceita um objeto compatível com `BlogPost` (de
 * `src/app/lib/blog.ts`) sem importar o tipo direto, evitando ciclo client/server.
 */
export function getBlogArticleSchema(input: BlogArticleSchemaInput): ArticleSchema {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ldccapital.com.br";
  const baseUrl = siteUrl.replace(/\/$/, "");
  const cover = input.cover && input.cover.length > 0 ? input.cover : undefined;
  const datePublishedIso = input.datePublished;
  const dateModifiedIso = input.dateModified ?? datePublishedIso;
  const authorName = (input.authorDisplayName ?? "").trim() || "LDC Capital";

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.summary ?? input.title,
    image: cover ? (cover.startsWith("http") ? cover : `${baseUrl}${cover}`) : undefined,
    datePublished: datePublishedIso,
    dateModified: dateModifiedIso,
    author: {
      "@type": "Organization",
      name: authorName,
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "LDC Capital",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/logo-ldc-principal.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${input.slug}`,
    },
    ...(input.category && input.category.length > 0
      ? { articleSection: input.category }
      : {}),
    inLanguage: "pt-BR",
  };
}


