import { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactForm from "../components/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contato - LDC Capital",
  description: "Entre em contato conosco. Atendimento online em todo o Brasil. Análise gratuita e sem compromisso.",
};

export default function ContatoPage() {
  return (
    <main>
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-[#262d3d] to-[#344645] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Fale Conosco
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Estamos prontos para ajudar você a alcançar seus objetivos financeiros
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactForm />

      {/* Onde nos encontrar - Mapa */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-4">
              Onde nos encontrar?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nosso escritório fica em Taquara/RS, mas atendemos clientes em todo o Brasil através de consultoria online.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Mapa */}
            <div className="relative min-h-[350px]">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
                <iframe
                  src="https://www.google.com/maps?q=Rua+Rio+Branco,+1290,+Taquara,+RS+95600-074&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full rounded-2xl"
                  title="Localização LDC Capital"
                ></iframe>
              </div>
            </div>

            {/* Informações de endereço */}
            <div className="flex flex-col justify-between space-y-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#98ab44]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-[#98ab44]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-2">
                        Endereço
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Rua Rio Branco, 1290, sala 02<br />
                        Centro - Taquara/RS<br />
                        CEP: 95600-074
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#98ab44]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-[#98ab44]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-2">
                        E-mail
                      </h3>
                      <p className="text-gray-600">
                        <a href="mailto:contato@ldccapital.com.br" className="hover:text-[#98ab44] transition-colors">
                          contato@ldccapital.com.br
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#98ab44]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-[#98ab44]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-2">
                        Telefone
                      </h3>
                      <p className="text-gray-600">
                        <a href="tel:+5551989301511" className="hover:text-[#98ab44] transition-colors">
                          (51) 98930-1511
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
