import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "LDC Capital - Mais do que finanças, direção",
  description: "Consultoria de Investimentos independente. Raízes no interior, olhos no horizonte. Transparência, alinhamento de interesses e estratégia personalizada para grandes patrimônios.",
  keywords: ["consultoria de investimentos", "planejamento financeiro", "gestão patrimonial", "investimentos", "LDC Capital"],
  authors: [{ name: "LDC Capital" }],
  openGraph: {
    title: "LDC Capital - Mais do que finanças, direção",
    description: "Consultoria de Investimentos independente com foco em transparência e alinhamento de interesses.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${publicSans.variable} ${ivyMode.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
