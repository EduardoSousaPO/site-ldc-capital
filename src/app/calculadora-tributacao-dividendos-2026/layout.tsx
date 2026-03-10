import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Tributacao de Dividendos | LDC Capital",
  description:
    "Simulador educacional da Lei 15.270/2025 com estimativa de IRRF e IRPFM.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DividendTaxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#f8f9fa]">{children}</div>;
}
