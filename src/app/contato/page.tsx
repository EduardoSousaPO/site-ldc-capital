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
      
      {/* Hero Section Premium */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background com gradiente premium */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#262d3d] via-[#344645] to-[#577171]">
          {/* Padrão sutil para textura */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(152, 171, 68, 0.1) 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, rgba(190, 204, 106, 0.05) 2px, transparent 2px)`,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
          
          {/* Elementos decorativos flutuantes */}
          <div className="absolute top-20 right-10 w-32 h-32 border-2 border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-48 h-48 border border-white/5 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-5 w-24 h-24 border border-white/20 rounded-full animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge Premium */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-[#98ab44]/30 mb-8 animate-slide-up">
              <Mail className="h-5 w-5 text-[#98ab44]" />
              <span className="text-[#98ab44] font-medium">Atendimento Personalizado</span>
            </div>
            
            {/* Título com gradiente */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight animate-slide-up delay-200">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                Fale 
              </span>
              <span className="text-[#98ab44]"> Conosco</span>
            </h1>
            
            <p className="text-xl sm:text-2xl mb-12 text-gray-200 max-w-4xl mx-auto leading-relaxed font-light animate-slide-up delay-300">
              Estamos prontos para ajudar você a alcançar seus objetivos financeiros
            </p>

            {/* Contact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up delay-500 max-w-3xl mx-auto">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-[#98ab44] mb-2">24h</div>
                <div className="text-white/80">Resposta rápida</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-[#becc6a] mb-2">Todo BR</div>
                <div className="text-white/80">Atendimento online</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-[#98ab44] mb-2">Gratuita</div>
                <div className="text-white/80">Análise inicial</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden sm:flex">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="text-white/60 text-sm font-medium">Entre em contato</span>
            <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-3">
                  E-mail
                </h3>
                <p className="text-gray-600 font-medium">
                  contato@ldccapital.com.br
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#becc6a] to-[#98ab44] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-3">
                  Telefone
                </h3>
                <p className="text-gray-600 font-medium">
                  (51) 99999-9999
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-3">
                  Atendimento
                </h3>
                <p className="text-gray-600 font-medium">
                  Todo o Brasil (Online)
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#becc6a] to-[#98ab44] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-3">
                  Horário
                </h3>
                <p className="text-gray-600 font-medium">
                  Seg-Sex: 9h às 18h
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section Premium */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-16">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-6">
              Por que escolher a LDC Capital?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Modelo transparente, experiência comprovada e atendimento personalizado
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group">
              <div className="bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-3xl p-8 text-white group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <div className="text-4xl font-bold mb-3">Fee-Based</div>
                <div className="text-white/90 leading-relaxed">Modelo transparente sem conflitos de interesse</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-gradient-to-br from-[#becc6a] to-[#98ab44] rounded-3xl p-8 text-white group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <div className="text-4xl font-bold mb-3">400M+</div>
                <div className="text-white/90 leading-relaxed">Patrimônio sob consultoria</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-3xl p-8 text-white group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <div className="text-4xl font-bold mb-3">Todo BR</div>
                <div className="text-white/90 leading-relaxed">Atendimento online nacionalmente</div>
              </div>
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
