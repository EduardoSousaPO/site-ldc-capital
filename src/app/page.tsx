import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import DirectionSection from "./components/DirectionSection";
import QuoteSection from "./components/QuoteSection";
import ServicesGridPremium from "./components/ServicesGridPremium";
import TestimonialsCarousel from "./components/TestimonialsCarousel";
import FAQ from "./components/FAQ";
import LeadForm from "./components/LeadForm";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <DirectionSection />
      <ServicesGridPremium />
      <QuoteSection />
      <TestimonialsCarousel />
      <FAQ />
      <LeadForm />
      <Footer />
    </main>
  );
}