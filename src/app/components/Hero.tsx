"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Mountain } from "lucide-react";
import { useEffect, useState } from "react";

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToContact = () => {
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
      contactForm.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 lg:py-0">
      {/* Background com imagem personalizada */}
      <div className="absolute inset-0">
        {/* Imagem de fundo com parallax */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/robbie-palmer-S3IH96G3D_E-unsplash.jpg')`,
            transform: `translateY(${scrollY * 0.5}px)`,
            scale: '1.1' // Pequeno zoom para evitar bordas brancas no parallax
          }}
        ></div>
        
        {/* Overlay escuro para legibilidade do texto - mais claro */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#262d3d]/60 via-[#344645]/50 to-[#577171]/60"></div>
        
        {/* Overlay adicional com gradiente LDC para melhor contraste - mais claro */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#262d3d]/70 via-transparent to-[#262d3d]/50"></div>
        
        {/* Elementos flutuantes sutis para manter o premium */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#98ab44]/8 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-[#becc6a]/12 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-[#98ab44]/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Padrão sutil para textura adicional */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(152, 171, 68, 0.1) 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, rgba(190, 204, 106, 0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>
      </div>

      {/* Content Premium com container responsivo */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 text-white">
        <div className="text-center max-w-6xl mx-auto">
          {/* Badge Premium */}
          <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-white/10 backdrop-blur-md rounded-full border border-[#98ab44]/30 mb-6 sm:mb-8 animate-slide-up">
            <Compass className="h-4 w-4 sm:h-5 sm:w-5 text-[#98ab44]" />
            <span className="text-[#98ab44] font-medium text-sm sm:text-base">Raízes no interior, olhos no horizonte</span>
          </div>
          
          {/* Título Principal com tipografia premium responsiva */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold mb-6 sm:mb-8 lg:mb-10 leading-tight animate-slide-up delay-200 max-w-5xl mx-auto">
            <span className="block mb-2 lg:mb-4">Investir é coisa séria,</span>
            <span className="bg-gradient-to-r from-[#98ab44] to-[#becc6a] bg-clip-text text-transparent">
              mas pode ser simples e acessível
            </span>
          </h1>
          
          {/* Subtítulo Premium com melhor responsividade */}
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl mb-8 sm:mb-12 lg:mb-16 text-gray-200 max-w-5xl mx-auto leading-relaxed font-light animate-slide-up delay-300 px-4 sm:px-0">
            Ajudamos você a alcançar o melhor nível de bem-estar na sua vida através do mercado financeiro com o 
            <span className="text-[#98ab44] font-medium"> melhor modelo de serviço financeiro disponível.</span>
          </p>
        </div>

        {/* Seção de Valores com Cards Premium responsivos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 mb-8 sm:mb-12 lg:mb-16 animate-slide-up delay-500 max-w-6xl mx-auto">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-8 lg:p-10 xl:p-12 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mb-4 lg:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-[#98ab44]/20 rounded-xl flex items-center justify-center group-hover:bg-[#98ab44]/30 transition-colors">
                <Mountain className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10 text-[#98ab44]" />
              </div>
              <h3 className="font-serif text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-white">Nossa Origem</h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl">
              Nascida no interior do Rio Grande do Sul, carregamos os valores de 
              <span className="text-[#98ab44] font-medium"> humildade, tranquilidade, identidade e trabalho duro</span> 
              em cada consultoria.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-8 lg:p-10 xl:p-12 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mb-4 lg:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-[#becc6a]/20 rounded-xl flex items-center justify-center group-hover:bg-[#becc6a]/30 transition-colors">
                <Compass className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10 text-[#becc6a]" />
              </div>
              <h3 className="font-serif text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-white">Nossa Missão</h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl">
              Mais do que finanças, oferecemos 
              <span className="text-[#becc6a] font-medium"> direção clara e segura</span> 
              para grandes patrimônios, sem atalhos, apenas estrutura sólida.
            </p>
          </div>
        </div>

        {/* CTAs Premium com animações responsivos */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 xl:gap-10 justify-center items-center animate-slide-up delay-700 max-w-4xl mx-auto">
          <Button
            onClick={scrollToContact}
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-[#98ab44] to-[#becc6a] hover:from-[#98ab44]/90 hover:to-[#becc6a]/90 text-white px-8 sm:px-10 lg:px-12 xl:px-16 py-4 sm:py-5 lg:py-6 xl:py-8 text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold rounded-2xl shadow-2xl hover:shadow-[#98ab44]/25 transition-all duration-300 group border-0"
          >
            Fale com um Consultor
            <ArrowRight className="ml-2 sm:ml-3 lg:ml-4 xl:ml-5 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 hover:border-[#98ab44] px-8 sm:px-10 lg:px-12 xl:px-16 py-4 sm:py-5 lg:py-6 xl:py-8 text-base sm:text-lg lg:text-xl xl:text-2xl rounded-2xl backdrop-blur-md transition-all duration-300"
            asChild
          >
            <a href="#services">Conheça nossos serviços</a>
          </Button>
        </div>
      </div>

      {/* Indicador de Scroll Premium responsivo */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 hidden sm:flex">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/60 text-xs sm:text-sm font-medium">Role para explorar</span>
          <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/40 rounded-full flex justify-center">
            <div className="w-1 h-2 sm:h-3 bg-white/60 rounded-full mt-1 sm:mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Elementos Decorativos Premium com Animações */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Partículas flutuantes */}
        <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-[#98ab44]/40 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-[#becc6a]/30 rounded-full animate-ping delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white/50 rounded-full animate-ping delay-2000"></div>
        
        {/* Linhas conectivas sutis */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#98ab44]/20 to-transparent"></div>
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#becc6a]/10 to-transparent"></div>
      </div>
    </section>
  );
}
