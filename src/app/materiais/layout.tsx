import { Metadata } from "next";
import { siteConfig, getFullUrl, getOgImageUrl } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Materiais",
  description: "Baixe materiais exclusivos sobre investimentos, planejamento financeiro e gestão patrimonial. Guias práticos, e-books e cartilhas gratuitas.",
  keywords: [
    "materiais",
    "download",
    "e-book",
    "guia",
    "cartilha",
    "planejamento financeiro",
    ...siteConfig.keywords,
  ],
  openGraph: {
    title: "Materiais - LDC Capital",
    description: "Baixe materiais exclusivos sobre investimentos e planejamento financeiro.",
    url: getFullUrl("/materiais"),
    siteName: siteConfig.name,
    images: [
      {
        url: getOgImageUrl(),
        width: 1200,
        height: 630,
        alt: "LDC Capital - Materiais",
      },
    ],
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: siteConfig.twitterCard as "summary_large_image",
    title: "Materiais - LDC Capital",
    description: "Baixe materiais exclusivos sobre investimentos e planejamento financeiro.",
    images: [getOgImageUrl()],
  },
  alternates: {
    canonical: getFullUrl("/materiais"),
  },
};

export default function MateriaisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

