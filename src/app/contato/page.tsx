import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactForm from "../components/ContactForm";
import ContactPageClient from "../components/ContactPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato - LDC Capital",
  description: "Entre em contato conosco. Atendimento online em todo o Brasil. Análise gratuita e sem compromisso.",
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
