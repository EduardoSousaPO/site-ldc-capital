"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock, MessageCircle, UserCheck } from "lucide-react";
import Link from "next/link";

export default function ContactPageClient() {
  return (
    <>
      {/* Hero Section Premium */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background com gradiente premium */}
        <div className="absolute inset-0 bg-[#262d3d]">
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
            
            {/* Título com gradiente */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight animate-slide-up delay-200">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                Fale 
              </span>
              <span className="text-white"> Conosco</span>
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

      </section>

      {/* Contact Options */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Fale Conosco */}
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-3">
                  Fale Conosco
                </h3>
                <p className="text-gray-600 mb-4">
                  Tire suas dúvidas
                </p>
                <Button 
                  className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white text-sm"
                  onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Enviar mensagem
                </Button>
              </CardContent>
            </Card>

            {/* Seja Cliente */}
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#becc6a] to-[#98ab44] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-3">
                  Seja Cliente
                </h3>
                <p className="text-gray-600 mb-4">
                  Solicite sua análise de carteira gratuita
                </p>
                <Button 
                  className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white text-sm"
                  asChild
                >
                  <Link href="/#contact-form">Análise gratuita</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Telefone */}
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-3">
                  Telefone
                </h3>
                <p className="text-gray-600 font-medium">
                  (51) 98930-1511
                </p>
              </CardContent>
            </Card>

            {/* Horário */}
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

      {/* Onde nos encontrar */}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Mapa */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.123456789!2d-50.7789!3d-29.6489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDM4JzU2LjAiUyA1MMKwNDYnNDQuMCJX!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-96 rounded-2xl"
                  title="Localização LDC Capital"
                ></iframe>
              </div>
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-gray-800">
                  Use Ctrl + Scroll para dar zoom
                </p>
              </div>
            </div>

            {/* Informações de endereço */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
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
                    <div className="w-12 h-12 bg-gradient-to-br from-[#becc6a] to-[#98ab44] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
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
                    <div className="w-12 h-12 bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
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
    </>
  );
}







