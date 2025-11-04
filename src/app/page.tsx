import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import DirectionSection from "./components/DirectionSection";
import QuoteSection from "./components/QuoteSection";
import ServicesGridPremium from "./components/ServicesGridPremium";
import TestimonialsCarousel from "./components/TestimonialsCarousel";
import FAQ from "./components/FAQ";
import LeadForm from "./components/LeadForm";
import { faqItems } from "./lib/faq";
import Script from "next/script";

export default function Home() {
  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqItems.map((item) => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer,
              },
            })),
          }),
        }}
      />
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
    </>
  );
}