"use client";

import { TrendingUp, Target, Shield, Compass } from "lucide-react";
import { useEffect, useState } from "react";

export default function DirectionSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('direction-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="direction-section"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Premium inspirado na paisagem */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#98ab44] via-[#becc6a] to-[#98ab44]"></div>
        
        {/* Overlay com textura orgânica */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(45deg, rgba(38, 45, 61, 0.1) 25%, transparent 25%),
                             linear-gradient(-45deg, rgba(38, 45, 61, 0.1) 25%, transparent 25%)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Elementos flutuantes */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/6 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/6 w-24 h-24 bg-white/15 rounded-full blur-xl animate-float delay-1000"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header da Seção */}
        <div className="text-center mb-20">
          <div 
            className={`transition-all duration-1000 ${
              isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 mb-8">
              <Compass className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Nossa Filosofia</span>
            </div>
            
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Mais do que{" "}
              <span className="relative">
                <span className="text-[#262d3d]">números</span>
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-white/50 rounded-full"></div>
              </span>
              ,{" "}
              <span className="block mt-2 text-[#262d3d] drop-shadow-lg">direção.</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light">
              Na LDC Capital, acreditamos que grandes patrimônios não se constroem à deriva. 
              Assim como um barco precisa de leme para alcançar seu destino, 
              <span className="font-semibold text-[#262d3d]"> seus investimentos precisam de direção clara, segura e experiente.</span>
              <br /><br />
              Nascida no interior do Rio Grande do Sul, carregamos os valores de humildade, tranquilidade, identidade e trabalho duro em cada consultoria. 
              Ser o parceiro de confiança de famílias, oferecendo-lhes soluções de investimentos de forma transparente e personalizada para ajudá-las na melhora do bem-estar, realização de sonhos, construção e gestão de seus patrimônios.
            </p>
          </div>
        </div>

        {/* Grid de Valores Premium */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Target,
              title: "Direção Clara",
              description: "Não prometemos atalhos, oferecemos estrutura sólida e caminhos bem definidos.",
              delay: "delay-200"
            },
            {
              icon: TrendingUp,
              title: "Crescimento Sustentável",
              description: "Estratégias que respeitam seu perfil e objetivos de longo prazo.",
              delay: "delay-300"
            },
            {
              icon: Shield,
              title: "Proteção Patrimonial",
              description: "Mais importante que ganhar muito é não perder nada. Priorizamos a segurança.",
              delay: "delay-500"
            },
            {
              icon: Compass,
              title: "Navegação Experiente",
              description: "Com mais de 400M sob consultoria, conhecemos as melhores rotas.",
              delay: "delay-700"
            }
          ].map((item, index) => {
            const IconComponent = item.icon;
            
            return (
              <div
                key={index}
                className={`transition-all duration-1000 ${item.delay} ${
                  isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
                }`}
              >
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group card-premium h-full">
                  <div className="w-16 h-16 bg-[#262d3d]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#262d3d]/30 transition-colors">
                    <IconComponent className="h-8 w-8 text-[#262d3d]" />
                  </div>
                  
                  <h3 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
                    {item.title}
                  </h3>
                  
                  <p className="text-white/90 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Elementos Decorativos */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#262d3d]/30 to-transparent"></div>
    </section>
  );
}
