import { Metadata } from "next";
import { siteConfig, getFullUrl, getOgImageUrl } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Informações Regulatórias",
  description: "Documentos regulatórios, políticas de compliance e informações sobre registro CVM da LDC Capital Consultoria de Investimentos.",
  keywords: [
    "regulatório",
    "compliance",
    "CVM",
    "documentos",
    "regulamentação",
    ...siteConfig.keywords,
  ],
  openGraph: {
    title: "Informações Regulatórias - LDC Capital",
    description: "Documentos regulatórios e políticas de compliance da LDC Capital.",
    url: getFullUrl("/informacoes-regulatorias"),
    siteName: siteConfig.name,
    images: [
      {
        url: getOgImageUrl(),
        width: 1200,
        height: 630,
        alt: "LDC Capital - Informações Regulatórias",
      },
    ],
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: siteConfig.twitterCard as "summary_large_image",
    title: "Informações Regulatórias - LDC Capital",
    images: [getOgImageUrl()],
  },
  alternates: {
    canonical: getFullUrl("/informacoes-regulatorias"),
  },
};

export default function InformacoesRegulatoriasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
