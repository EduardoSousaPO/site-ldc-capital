"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Shield, Globe, Calendar, Users, ArrowRight, CheckCircle } from "lucide-react";
import { services } from "@/app/lib/services";
import { useEffect, useState } from "react";

const iconMap = {
  Target,
  TrendingUp,
  Shield,
  Globe,
  Calendar,
  Users,
};

export default function ServicesGridPremium() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const section = document.getElementById('services-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const scrollToContact = () => {
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
      contactForm.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="services-section" className="py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(152, 171, 68, 0.1) 2px, transparent 2px),
                           radial-gradient(circle at 80% 80%, rgba(190, 204, 106, 0.1) 2px, transparent 2px)`,
          backgroundSize: '80px 80px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div 
            className={`transition-all duration-1000 ${
              isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#98ab44]/10 text-[#98ab44] rounded-full border border-[#98ab44]/20 mb-8">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Nossos Serviços</span>
            </div>
            
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[#262d3d] mb-6 leading-tight">
              Abordagem{" "}
              <span className="text-gradient-ldc">360°</span>{" "}
              para seus investimentos
            </h2>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Oferecemos transparência total e alinhamento de interesses em cada etapa da sua jornada financeira
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => {
            const IconComponent = iconMap[service.icon as keyof typeof iconMap];
            const delay = `delay-${(index + 1) * 200}`;
            
            return (
              <div
                key={service.id}
                className={`transition-all duration-1000 ${delay} ${
                  isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
                }`}
                onMouseEnter={() => setHoveredCard(service.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Card className="group card-premium border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-500 h-full relative overflow-hidden">
                  {/* Gradient Overlay on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-[#98ab44]/5 to-[#becc6a]/5 transition-opacity duration-300 ${
                    hoveredCard === service.id ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                  
                  <CardHeader className="pb-6 relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                      hoveredCard === service.id 
                        ? 'bg-gradient-to-br from-[#98ab44] to-[#becc6a] animate-glow' 
                        : 'bg-[#98ab44]/10'
                    }`}>
                      <IconComponent className={`h-8 w-8 transition-colors duration-300 ${
                        hoveredCard === service.id ? 'text-white' : 'text-[#98ab44]'
                      }`} />
                    </div>
                    
                    <CardTitle className="font-serif text-2xl text-[#262d3d] mb-3 group-hover:text-[#98ab44] transition-colors">
                      {service.title}
                    </CardTitle>
                    
                    <CardDescription className="text-gray-600 leading-relaxed text-base">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="relative z-10">
                    <div className="space-y-3">
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-colors duration-300 ${
                            hoveredCard === service.id ? 'bg-[#98ab44]' : 'bg-[#98ab44]/60'
                          }`}></div>
                          <span className="text-gray-700 leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Hover CTA */}
                    <div className={`mt-6 transition-all duration-300 ${
                      hoveredCard === service.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}>
                      <div className="flex items-center gap-2 text-[#98ab44] font-medium cursor-pointer group/cta">
                        <span>Saiba mais</span>
                        <ArrowRight className="h-4 w-4 group-hover/cta:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* Decorative Border */}
                  <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#98ab44] to-[#becc6a] transition-all duration-300 ${
                    hoveredCard === service.id ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* CTA Premium */}
        <div 
          className={`text-center transition-all duration-1000 delay-1000 ${
            isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="bg-gradient-to-r from-[#98ab44] to-[#becc6a] rounded-3xl p-12 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                backgroundSize: '30px 30px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-4">
                Pronto para dar o próximo passo?
              </h3>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Converse com nossa equipe e descubra como podemos ajudar você a alcançar seus objetivos financeiros
              </p>
              
              <Button
                onClick={scrollToContact}
                size="lg"
                className="bg-white text-[#98ab44] hover:bg-white/90 px-10 py-5 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group border-0"
              >
                Fale com um Consultor
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
