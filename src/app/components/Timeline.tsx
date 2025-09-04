"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Search, Presentation, Play, BarChart3 } from "lucide-react";
import { consultingTimeline } from "@/app/lib/timeline";

const iconMap = {
  Users,
  Search,
  Presentation,
  Play,
  BarChart3,
};

export default function Timeline() {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-4">
            Nossa Metodologia em 5 Passos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Um processo estruturado e transparente para construir sua estratégia de investimentos
          </p>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#98ab44] to-[#becc6a] rounded-full"></div>

          <div className="space-y-12 lg:space-y-16">
            {consultingTimeline.map((step, index) => {
              const IconComponent = iconMap[step.icon as keyof typeof iconMap];
              const isEven = index % 2 === 0;
              
              return (
                <div
                  key={step.id}
                  className={`relative flex items-center ${
                    isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#98ab44] rounded-full border-4 border-white shadow-lg z-10"></div>
                  
                  {/* Content */}
                  <div className={`w-full lg:w-5/12 ${isEven ? "lg:pr-12" : "lg:pl-12"}`}>
                    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                      <CardContent className="p-8">
                        <div className="flex items-start space-x-4">
                          {/* Step Number & Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-[#98ab44]/10 rounded-full flex items-center justify-center group-hover:bg-[#98ab44]/20 transition-colors">
                              <IconComponent className="h-8 w-8 text-[#98ab44]" />
                            </div>
                            <div className="text-center mt-2">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-[#98ab44] text-white rounded-full text-sm font-bold">
                                {step.id}
                              </span>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-serif text-xl font-semibold text-[#262d3d]">
                                {step.title}
                              </h3>
                              {step.duration && (
                                <span className="text-sm text-[#98ab44] bg-[#98ab44]/10 px-3 py-1 rounded-full font-medium">
                                  {step.duration}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Mobile Timeline Connector */}
                  <div className="lg:hidden absolute left-8 top-20 w-px h-12 bg-[#98ab44] opacity-50"></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600 mb-6">
            Pronto para começar sua jornada de investimentos conosco?
          </p>
          <button
            onClick={() => {
              const contactForm = document.getElementById("contact-form");
              if (contactForm) {
                contactForm.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Iniciar Análise Gratuita
          </button>
        </div>
      </div>
    </section>
  );
}
