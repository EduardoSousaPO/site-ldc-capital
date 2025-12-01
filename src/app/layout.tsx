import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Analytics from "@/components/Analytics";
import WhatsAppButton from "@/components/WhatsAppButton";
import JsonLd from "@/components/JsonLd";
import { getOrganizationSchema, getLocalBusinessSchema } from "@/lib/schema";

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


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ldccapital.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LDC Capital - Mais do que finanças, direção",
    template: "%s | LDC Capital",
  },
  description:
    "Consultoria de Investimentos independente. Raízes no interior, olhos no horizonte. Transparência, alinhamento de interesses e estratégia personalizada para grandes patrimônios.",
  keywords: [
    "consultoria de investimentos",
    "planejamento financeiro",
    "gestão patrimonial",
    "investimentos",
    "LDC Capital",
    "consultoria financeira",
    "assessoria de investimentos",
    "wealth management",
  ],
  authors: [{ name: "LDC Capital" }],
  creator: "LDC Capital",
  publisher: "LDC Capital",
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
    locale: "pt_BR",
    url: siteUrl,
    siteName: "LDC Capital",
    title: "LDC Capital - Mais do que finanças, direção",
    description:
      "Consultoria de Investimentos independente com foco em transparência e alinhamento de interesses.",
    images: [
      {
        url: `${siteUrl}/images/logo-ldc-principal.png`,
        width: 1200,
        height: 630,
        alt: "LDC Capital - Mais do que finanças, direção",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LDC Capital - Mais do que finanças, direção",
    description:
      "Consultoria de Investimentos independente com foco em transparência e alinhamento de interesses.",
    images: [`${siteUrl}/images/logo-ldc-principal.png`],
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    // Adicione aqui o código de verificação do Google Search Console
    // google: "seu-codigo-de-verificacao",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="pt-BR">
      <body
        className={`${publicSans.variable} ${ivyMode.variable} antialiased`}
      >
        {/* Schema.org Structured Data */}
        <JsonLd data={getOrganizationSchema()} />
        <JsonLd data={getLocalBusinessSchema()} />
        {children}
        <WhatsAppButton />
        <Analytics gaId={gaId} metaPixelId={metaPixelId} />
      </body>
    </html>
  );
}
