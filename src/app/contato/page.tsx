import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactForm from "../components/ContactForm";
import ContactPageClient from "../components/ContactPageClient";
import { Metadata } from "next";
import { siteConfig, getFullUrl, getOgImageUrl } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato conosco. Atendimento online em todo o Brasil. Análise gratuita e sem compromisso. Rua Rio Branco, 1290, sala 02, Centro - Taquara/RS.",
  keywords: [
    "contato",
    "atendimento",
    "consultoria",
    "análise gratuita",
    ...siteConfig.keywords,
  ],
  openGraph: {
    title: "Contato - LDC Capital",
    description: "Entre em contato conosco. Atendimento online em todo o Brasil. Análise gratuita e sem compromisso.",
    url: getFullUrl("/contato"),
    siteName: siteConfig.name,
    images: [
      {
        url: getOgImageUrl(),
        width: 1200,
        height: 630,
        alt: "LDC Capital - Contato",
      },
    ],
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: siteConfig.twitterCard as "summary_large_image",
    title: "Contato - LDC Capital",
    description: "Entre em contato conosco. Atendimento online em todo o Brasil.",
    images: [getOgImageUrl()],
  },
  alternates: {
    canonical: getFullUrl("/contato"),
  },
};

export default function ContatoPage() {
  return (
    <main>
      <Header />
      <ContactPageClient />
      
      {/* Contact Form */}
      <div id="contact-form">
        <ContactForm />
      </div>

      <Footer />
    </main>
  );
}
