import { Metadata } from "next";
import { siteConfig, getFullUrl, getOgImageUrl } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Blog",
  description: "Artigos e conteúdos sobre consultoria de investimentos, planejamento financeiro, gestão patrimonial e investimentos no Brasil e exterior.",
  keywords: [
    "blog",
    "artigos",
    "educação financeira",
    "consultoria de investimentos",
    "planejamento financeiro",
    ...siteConfig.keywords,
  ],
  openGraph: {
    title: "Blog - LDC Capital",
    description: "Artigos e conteúdos sobre consultoria de investimentos, planejamento financeiro e gestão patrimonial.",
    url: getFullUrl("/blog"),
    siteName: siteConfig.name,
    images: [
      {
        url: getOgImageUrl(),
        width: 1200,
        height: 630,
        alt: "LDC Capital - Blog",
      },
    ],
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: siteConfig.twitterCard as "summary_large_image",
    title: "Blog - LDC Capital",
    description: "Artigos e conteúdos sobre consultoria de investimentos e planejamento financeiro.",
    images: [getOgImageUrl()],
  },
  alternates: {
    canonical: getFullUrl("/blog"),
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

