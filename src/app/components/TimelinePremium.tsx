"use client";

import { useState, useEffect } from "react";
import { Users, Search, Presentation, Settings, BarChart3 } from "lucide-react";

interface TimelineStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  color: string;
}

const timelineSteps: TimelineStep[] = [
  {
    id: 1,
    title: "Conhecendo Você",
    subtitle: "1ª reunião",
    description: "Coleta detalhada de objetivos, horizonte de investimento e tolerância ao risco para entender completamente seu perfil.",
    icon: Users,
    duration: "1h",
    color: "bg-[#98ab44]"
  },
  {
    id: 2,
    title: "Estudo e Análise",
    subtitle: "Até 7 dias",
    description: "Nossa equipe desenvolve um plano personalizado adequado às suas necessidades específicas e objetivos financeiros.",
    icon: Search,
    duration: "7 dias",
    color: "bg-[#becc6a]"
  },
  {
    id: 3,
    title: "Apresentação do Plano",
    subtitle: "2ª reunião",
    description: "Explicação detalhada da estratégia proposta, carteira sugerida e possíveis ajustes conforme seu feedback.",
    icon: Presentation,
    duration: "1h30",
    color: "bg-[#98ab44]"
  },
  {
    id: 4,
    title: "Implementação",
    subtitle: "1-2 semanas",
    description: "Execução das movimentações iniciais e estruturação completa da nova carteira de investimentos.",
    icon: Settings,
    duration: "2 semanas",
    color: "bg-[#becc6a]"
  },
  {
    id: 5,
    title: "Acompanhamento",
    subtitle: "Mensal",
    description: "Manutenção ativa da estratégia com reuniões mensais, rebalanceamentos e ajustes conforme necessário.",
    icon: BarChart3,
    duration: "Contínuo",
    color: "bg-[#98ab44]"
  }
];

export default function TimelinePremium() {
  // const [activeStep, setActiveStep] = useState(1); // Para uso futuro
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

    const section = document.getElementById('timeline-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <div id="timeline-section" className="relative">
      {/* Timeline Line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#98ab44] to-[#becc6a] rounded-full hidden lg:block"></div>

      <div className="space-y-12 lg:space-y-16">
        {timelineSteps.map((step, index) => {
          const IconComponent = step.icon;
          const isLeft = index % 2 === 0;
          const delay = `delay-${(index + 1) * 200}`;
          
          return (
            <div
              key={step.id}
              className={`relative transition-all duration-1000 ${delay} ${
                isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className={`lg:grid lg:grid-cols-2 lg:gap-12 items-center ${
                isLeft ? '' : 'lg:grid-flow-col-dense'
              }`}>
                
                {/* Content */}
                <div className={`${isLeft ? 'lg:text-right lg:pr-12' : 'lg:pl-12'}`}>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${
                    step.color === 'bg-[#98ab44]' 
                      ? 'bg-[#98ab44]/10 text-[#98ab44] border border-[#98ab44]/20' 
                      : 'bg-[#becc6a]/10 text-[#becc6a] border border-[#becc6a]/20'
                  }`}>
                    <IconComponent className="h-4 w-4" />
                    <span>{step.subtitle}</span>
                  </div>
                  
                  <h3 className="font-serif text-2xl lg:text-3xl font-bold text-[#262d3d] mb-4">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed text-lg mb-6">
                    {step.description}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {step.id}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duração estimada</p>
                      <p className="font-semibold text-[#262d3d]">{step.duration}</p>
                    </div>
                  </div>
                </div>

                {/* Visual Element */}
                <div className={`mt-8 lg:mt-0 ${isLeft ? '' : 'lg:order-first'}`}>
                  <div className="relative">
                    <div className={`w-24 h-24 lg:w-32 lg:h-32 ${step.color} rounded-3xl flex items-center justify-center mx-auto lg:mx-0 shadow-2xl ${
                      isLeft ? 'lg:ml-auto lg:mr-0' : ''
                    } transition-transform duration-300 hover:scale-105`}>
                      <IconComponent className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
                    </div>
                    
                    {/* Connection dot for timeline */}
                    <div className="hidden lg:block absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-4 border-[#98ab44] rounded-full shadow-lg" style={{
                      left: isLeft ? 'calc(100% + 1.5rem)' : '-2.25rem'
                    }}></div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className={`text-center mt-16 transition-all duration-1000 delay-1200 ${
        isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
      }`}>
        <div className="bg-gradient-to-r from-[#98ab44] to-[#becc6a] rounded-3xl p-8 lg:p-12 text-white shadow-2xl max-w-2xl mx-auto">
          <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-4">
            Pronto para começar sua jornada de investimentos conosco?
          </h3>
          <p className="text-white/90 mb-6 text-lg">
            Nossa metodologia comprovada já ajudou mais de 350 famílias a alcançarem seus objetivos financeiros.
          </p>
          <button className="bg-white text-[#98ab44] hover:bg-white/90 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl">
            Iniciar Análise Gratuita
          </button>
        </div>
      </div>
    </div>
  );
}
