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

      <section className="pt-28 pb-14 lg:pt-36 lg:pb-20 bg-gradient-to-br from-[#262d3d] to-[#344645] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-5 leading-tight">
            Calculadora de Tributacao de Dividendos
          </h1>
          <p className="text-lg lg:text-xl text-white/90 max-w-4xl">
            Simule o impacto da Lei 15.270/2025 com resultado rapido e opcao de
            relatorio detalhado.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <DividendTaxCalculator />
        </div>
      </section>

      <Footer />
    </main>
  );
}
