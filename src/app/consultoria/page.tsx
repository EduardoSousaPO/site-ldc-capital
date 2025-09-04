import Header from "../components/Header";
import Footer from "../components/Footer";
import TimelinePremium from "../components/TimelinePremium";
import Differentials from "../components/Differentials";
import PillarGrid from "../components/PillarGrid";
import LeadForm from "../components/LeadForm";
import CTAButton from "../components/CTAButton";
import { Button } from "@/components/ui/button";
import { Shield, Target, ArrowRight, CheckCircle, Users, TrendingUp, Award, Globe } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Consultoria de Investimentos - LDC Capital",
  description: "Raízes no interior, olhos no horizonte. Consultoria independente com modelo fee-based, sem conflitos de interesse. Metodologia estruturada em 5 passos.",
};

export default function ConsultoriaPage() {
  return (
    <main>
      <Header />
      
      {/* Hero Section Premium - Inspirado na Musa */}
      <section className="relative min-h-screen bg-gradient-to-br from-[#98ab44] to-[#becc6a] overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
                             radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 2px, transparent 2px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Elementos decorativos */}
        <div className="absolute top-20 right-10 w-32 h-32 border-2 border-white/20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-5 w-24 h-24 border border-white/30 rounded-full animate-pulse delay-2000"></div>

        <div className="relative z-10 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Conteúdo Textual */}
              <div className="text-white order-2 lg:order-1">
                <div className="inline-block px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-full border border-white/30 mb-6">
                  CONSULTORIA DE INVESTIMENTOS
                </div>
                
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Consultoria de investimentos personalizada para{" "}
                  <span className="text-[#262d3d]">maximizar seus resultados.</span>
                </h1>
                
                <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-2xl">
                  Com estratégias feitas sob medida e uma equipe de profissionais certificados, 
                  garantimos que seus investimentos estejam sempre alinhados aos 
                  seus sonhos e objetivos, com total transparência e segurança.
                </p>

                <Button 
                  size="lg"
                  className="bg-white text-[#98ab44] hover:bg-white/90 px-8 py-4 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group mr-4"
                  asChild
                >
                  <a href="#contact-form">
                    FALE COM NOSSA EQUIPE
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>

                {/* Estatística de Famílias */}
                <div className="flex items-center mt-8">
                  <div className="flex -space-x-2 mr-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">+ 350</p>
                    <p className="text-white/80 text-sm">Famílias atendidas</p>
                  </div>
                </div>
              </div>

              {/* Imagem Premium */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-2 border border-white/20">
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden flex items-center justify-center">
                      {/* Placeholder para imagem corporativa */}
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-[#98ab44]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 text-[#98ab44]" />
                        </div>
                        <p className="text-gray-600 text-sm">Consultor Profissional</p>
                        <p className="text-gray-500 text-xs mt-1">Imagem corporativa aqui</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cards flutuantes */}
                  <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#98ab44]/20 rounded-xl flex items-center justify-center">
                        <Shield className="h-5 w-5 text-[#98ab44]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#262d3d]">Transparência e sem</p>
                        <p className="text-xs text-gray-600">conflitos de interesse</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#becc6a]/20 rounded-xl flex items-center justify-center">
                        <Target className="h-5 w-5 text-[#becc6a]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#262d3d]">Consultoria personalizada</p>
                        <p className="text-xs text-gray-600">para a sua realidade</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Cards de Diferenciais na parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex items-center justify-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Transparência e sem</p>
                  <p className="text-xs text-white/80">conflitos de interesse</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Consultoria personalizada</p>
                  <p className="text-xs text-white/80">para a sua realidade</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Equipe certificada pelos</p>
                  <p className="text-xs text-white/80">principais órgãos do mercado.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Modelo de Consultoria */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-[#98ab44]/10 text-[#98ab44] text-sm font-medium rounded-full border border-[#98ab44]/20 mb-6">
              MODELO DE CONSULTORIA
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-4">
              Nosso modelo de Consultoria
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Transparência total e alinhamento de interesses em cada recomendação
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Primeira seção com imagem */}
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#98ab44]/20 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-[#98ab44]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#262d3d]">NOSSO MODELO</h3>
                    <p className="text-[#98ab44] font-medium">Independência Total</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Trabalhamos de forma totalmente independente, sem vínculos com bancos, 
                  corretoras ou instituições financeiras. Isso significa que nossas recomendações 
                  são sempre baseadas no que é melhor para você, sem influência de comissões 
                  ou produtos pré-determinados.
                </p>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#98ab44]" />
                    <span className="text-gray-700">Modelo fee-based transparente</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#98ab44]" />
                    <span className="text-gray-700">Cashback de comissões para você</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#98ab44]" />
                    <span className="text-gray-700">Recomendações imparciais</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#98ab44]/5 to-[#becc6a]/10 rounded-3xl overflow-hidden shadow-xl flex items-center justify-center border border-[#98ab44]/20">
                {/* Placeholder para imagem de independência */}
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-[#98ab44]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-10 w-10 text-[#98ab44]" />
                  </div>
                  <p className="text-[#262d3d] font-semibold">Independência Total</p>
                  <p className="text-gray-600 text-sm mt-2">Equipe de consultores independentes</p>
                  <p className="text-gray-500 text-xs mt-1">📸 Imagem ideal: Profissionais em reunião</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Segunda seção com imagem */}
            <div>
              <div className="aspect-[4/3] bg-gradient-to-br from-[#becc6a]/5 to-[#98ab44]/10 rounded-3xl overflow-hidden shadow-xl flex items-center justify-center border border-[#becc6a]/20">
                {/* Placeholder para imagem de consultoria */}
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-[#becc6a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-10 w-10 text-[#becc6a]" />
                  </div>
                  <p className="text-[#262d3d] font-semibold">Taxa Fixa Transparente</p>
                  <p className="text-gray-600 text-sm mt-2">Consultor apresentando para cliente</p>
                  <p className="text-gray-500 text-xs mt-1">📸 Imagem ideal: Reunião one-on-one</p>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#becc6a]/20 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-[#becc6a]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#262d3d]">NOSSO MODELO</h3>
                    <p className="text-[#becc6a] font-medium">Taxa Fixa, Sem Comissões Ocultas</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Ao contrário do modelo tradicional de assessoria que lucram sobre as comissões 
                  dos produtos recomendados, na LDC Capital você paga uma taxa fixa e transparente. 
                  Assim você sabe exatamente quanto paga e o que está incluído no nosso serviço.
                </p>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#becc6a]" />
                    <span className="text-gray-700">Análise detalhada do perfil</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#becc6a]" />
                    <span className="text-gray-700">Diversificação inteligente</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#becc6a]" />
                    <span className="text-gray-700">Acompanhamento contínuo</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção dos 6 Pilares */}
      <PillarGrid />

      {/* Timeline Metodologia */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-4">
              Nossa Metodologia em 5 Passos
            </h2>
            <p className="text-lg text-gray-600">
              Um processo estruturado e transparente para construir sua estratégia de investimentos
            </p>
          </div>
          
          <TimelinePremium />
        </div>
      </section>

      {/* Diferenciais */}
      <Differentials />


      {/* Seção CTA Final */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-[#98ab44] to-[#becc6a] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-6">
            Pronto para dar o próximo passo?
          </h2>
          
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Nossa equipe está preparada para analisar seu perfil e desenvolver uma 
            estratégia personalizada para seus investimentos.
          </p>

          <CTAButton
            size="lg"
            className="bg-white text-[#98ab44] hover:bg-white/90 px-10 py-5 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group mr-4"
          >
            Fale com nossa equipe
          </CTAButton>

          <p className="text-sm text-white/80 mt-6">
            Análise gratuita • Sem compromisso • Atendimento em todo o Brasil
          </p>
        </div>
      </section>

      {/* Formulário de Contato */}
      <LeadForm />
      
      <Footer />
    </main>
  );
}