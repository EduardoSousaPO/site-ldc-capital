/**
 * Componente para renderizar Structured Data (Schema.org) em JSON-LD
 * Suporta múltiplos tipos de schema: Organization, Service, Article, FAQPage, BreadcrumbList
 */

import { siteConfig } from "@/lib/seo-config";
import { getFullUrl } from "@/lib/seo-config";

interface OrganizationSchemaProps {
  logo?: string;
}

export function OrganizationSchema({ logo }: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": siteConfig.company.name,
    "alternateName": siteConfig.name,
    "description": siteConfig.description,
    "url": siteConfig.url,
    "logo": logo || getFullUrl("/images/logo-ldc-principal.png"),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": siteConfig.company.address.street,
      "addressLocality": siteConfig.company.address.city,
      "addressRegion": siteConfig.company.address.state,
      "postalCode": siteConfig.company.address.postalCode,
      "addressCountry": siteConfig.company.address.country,
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": siteConfig.company.contact.phone,
      "contactType": "customer service",
      "email": siteConfig.company.contact.email,
      "areaServed": siteConfig.company.areaServed,
      "availableLanguage": ["pt-BR"],
    },
    "sameAs": [
      siteConfig.social.youtube,
      siteConfig.social.instagram,
      siteConfig.social.linkedin,
    ],
    "areaServed": {
      "@type": "Country",
      "name": "Brasil",
    },
    "serviceType": siteConfig.company.serviceType,
    "feesAndCommissionsSpecification": siteConfig.company.feesAndCommissionsSpecification,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ServiceSchemaProps {
  name?: string;
  description?: string;
}

export function ServiceSchema({ 
  name = "Consultoria de Investimentos",
  description = "Metodologia estruturada em 5 passos para gestão de patrimônio e planejamento financeiro personalizado"
}: ServiceSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": name,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": siteConfig.company.name,
      "url": siteConfig.url,
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "BRL",
      "price": "Fee-based",
      "availability": "https://schema.org/InStock",
      "url": getFullUrl("/consultoria"),
    },
    "category": "Financial Services",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ArticleSchemaProps {
  title: string;
  description: string;
  author: {
    name: string;
    email?: string;
  };
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}

export function ArticleSchema({
  title,
  description,
  author,
  datePublished,
  dateModified,
  image,
  url,
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Person",
      "name": author.name,
      ...(author.email && { "email": author.email }),
    },
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.company.name,
      "logo": {
        "@type": "ImageObject",
        "url": getFullUrl("/images/logo-ldc-principal.png"),
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url,
    },
    ...(image && {
      "image": {
        "@type": "ImageObject",
        "url": image.startsWith("http") ? image : getFullUrl(image),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQSchemaProps {
  items: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : getFullUrl(item.url),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

