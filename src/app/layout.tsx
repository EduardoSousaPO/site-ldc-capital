import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
// import localFont from "next/font/local"; // Será usado quando os arquivos IvyMode estiverem disponíveis
import "./globals.css";

// Public Sans para textos (usando Google Fonts)
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// IvyMode para títulos (configuração preparada - aguardando arquivos de fonte)
// Quando os arquivos estiverem disponíveis, descomente as linhas abaixo:
/*
const ivyMode = localFont({
  src: [
    {
      path: "../../../public/fonts/ivymode/IvyMode-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/ivymode/IvyMode-SemiBold.woff2", 
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/fonts/ivymode/IvyMode-Bold.woff2",
      weight: "700", 
      style: "normal",
    },
  ],
  variable: "--font-ivy-mode",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});
*/

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
        className={`${publicSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
