import { Metadata } from "next";
import { siteConfig, getFullUrl, getOgImageUrl } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Trabalhe Conosco",
  description: "Junte-se à equipe da LDC Capital. Oportunidades de carreira em consultoria de investimentos. Venha fazer parte do nosso time.",
  keywords: [
    "trabalhe conosco",
    "vagas",
    "carreira",
    "oportunidades",
    "consultoria de investimentos",
    ...siteConfig.keywords,
  ],
  openGraph: {
    title: "Trabalhe Conosco - LDC Capital",
    description: "Junte-se à equipe da LDC Capital. Oportunidades de carreira em consultoria de investimentos.",
    url: getFullUrl("/trabalhe-conosco"),
    siteName: siteConfig.name,
    images: [
      {
        url: getOgImageUrl(),
        width: 1200,
        height: 630,
        alt: "LDC Capital - Trabalhe Conosco",
      },
    ],
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: siteConfig.twitterCard as "summary_large_image",
    title: "Trabalhe Conosco - LDC Capital",
    description: "Junte-se à equipe da LDC Capital.",
    images: [getOgImageUrl()],
  },
  alternates: {
    canonical: getFullUrl("/trabalhe-conosco"),
  },
};

export default function TrabalheConoscoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
