import type { Metadata } from "next";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DividendTaxCalculator from "@/components/dividend-tax/DividendTaxCalculator";

export const metadata: Metadata = {
  title: "Calculadora de Tributacao de Dividendos 2026 | LDC Capital",
  description: "Simulador privado de impacto tributario da Lei 15.270/2025.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default function DividendTaxCalculatorPage() {
  return (
    <main>
      <Header />

      <section className="pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <DividendTaxCalculator />
        </div>
      </section>

      <Footer />
    </main>
  );
}
