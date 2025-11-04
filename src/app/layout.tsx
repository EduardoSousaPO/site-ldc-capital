import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SupabaseListener from "@/components/SupabaseListener";
import { AdminToaster } from "@/components/ui/toaster";
import { Analytics } from "@/components/Analytics";
import { OrganizationSchema } from "@/components/StructuredData";
import { siteConfig, getOgImageUrl } from "@/lib/seo-config";
import Script from "next/script";
// Removido NextAuth - usando Supabase Auth

// IvyMode - Fonte oficial para títulos (conforme Manual da Marca LDC Capital)
const ivyMode = localFont({
  src: [
    {
      path: "../fonts/IvyMode-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/IvyMode-SemiBold.otf", 
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/IvyMode-Bold.otf",
      weight: "700", 
      style: "normal",
    },
  ],
  variable: "--font-ivy-mode",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

// Public Sans - Fonte oficial para textos (conforme Manual da Marca LDC Capital)
const publicSans = localFont({
  src: [
    {
      path: "../fonts/PublicSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/PublicSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/PublicSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/PublicSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-public-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});


export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.company.name }],
  creator: siteConfig.company.name,
  publisher: siteConfig.company.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: getOgImageUrl(),
        width: 1200,
        height: 630,
        alt: siteConfig.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: siteConfig.twitterCard as "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [getOgImageUrl()],
    creator: siteConfig.twitterHandle,
  },
  alternates: {
    canonical: siteConfig.url,
  },
  verification: {
    ...(siteConfig.googleSiteVerification && {
      google: siteConfig.googleSiteVerification,
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.language} data-scroll-behavior="smooth">
      <body
        className={`${publicSans.variable} ${ivyMode.variable} antialiased`}
      >
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FinancialService",
              "name": siteConfig.company.name,
              "alternateName": siteConfig.name,
              "description": siteConfig.description,
              "url": siteConfig.url,
              "logo": getFullUrl("/images/logo-ldc-principal.png"),
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
            }),
          }}
        />
        <SupabaseListener />
        <AdminToaster />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
