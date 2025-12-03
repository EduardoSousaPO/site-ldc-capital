"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Shield, Globe, Calendar, Users, CheckCircle } from "lucide-react";
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

export default function ServicesGrid() {
  const [isVisible, setIsVisible] = useState(false);

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
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(152, 171, 68, 0.1) 2px, transparent 2px)`,
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service) => {
            const IconComponent = iconMap[service.icon as keyof typeof iconMap];
            
            return (
              <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-[#98ab44]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#98ab44]/20 transition-colors">
                    <IconComponent className="h-6 w-6 text-[#98ab44]" />
                  </div>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-[#98ab44] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={scrollToContact}
            size="lg"
            className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white px-8 py-4"
          >
            Fale com um Consultor
          </Button>
        </div>
      </div>
    </section>
  );
}
