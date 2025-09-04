import { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LeadForm from "../components/LeadForm";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

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

      {/* Contact Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-0 shadow-md">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#98ab44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-[#98ab44]" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#262d3d] mb-2">
                  E-mail
                </h3>
                <p className="text-gray-600 text-sm">
                  contato@ldccapital.com.br
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#98ab44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-[#98ab44]" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#262d3d] mb-2">
                  Telefone
                </h3>
                <p className="text-gray-600 text-sm">
                  (51) 99999-9999
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#98ab44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-[#98ab44]" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#262d3d] mb-2">
                  Atendimento
                </h3>
                <p className="text-gray-600 text-sm">
                  Todo o Brasil (Online)
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-[#98ab44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-[#98ab44]" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#262d3d] mb-2">
                  Horário
                </h3>
                <p className="text-gray-600 text-sm">
                  Seg-Sex: 9h às 18h
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-6">
            Por que escolher a LDC Capital?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <div className="text-3xl font-bold text-[#98ab44] mb-2">Fee-Based</div>
              <div className="text-gray-600">Modelo transparente sem conflitos de interesse</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#98ab44] mb-2">400M+</div>
              <div className="text-gray-600">Patrimônio sob consultoria</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#98ab44] mb-2">Todo BR</div>
              <div className="text-gray-600">Atendimento online nacionalmente</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <LeadForm />

      <Footer />
    </main>
  );
}
