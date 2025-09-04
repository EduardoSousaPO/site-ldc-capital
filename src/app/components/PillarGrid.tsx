"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Building, Scale, Target, Brain, Calculator, Receipt } from "lucide-react";
import { fundamentalPillars } from "@/app/lib/pillars";

const iconMap = {
  Building,
  Scale,
  Target,
  Brain,
  Calculator,
  Receipt,
};

export default function PillarGrid() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-4">
            Os 6 Pilares Fundamentais
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nossa metodologia se baseia em pilares sólidos que garantem o sucesso da sua estratégia de investimentos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fundamentalPillars.map((pillar) => {
            const IconComponent = iconMap[pillar.icon as keyof typeof iconMap];
            
            return (
              <Card key={pillar.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-[#262d3d] text-white h-full">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="w-16 h-16 bg-[#98ab44]/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#98ab44]/30 transition-colors">
                    <IconComponent className="h-8 w-8 text-[#98ab44]" />
                  </div>
                  
                  <h3 className="font-serif text-xl font-semibold text-white mb-4 leading-tight">
                    {pillar.title}
                  </h3>
                  
                  <p className="text-gray-300 leading-relaxed flex-1">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#98ab44] to-[#becc6a] rounded-2xl p-8 lg:p-12 text-white">
            <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-4">
              Metodologia Comprovada
            </h3>
            <p className="text-xl max-w-3xl mx-auto">
              Estes pilares foram desenvolvidos ao longo de anos de experiência no mercado financeiro e são aplicados com sucesso em mais de 400M sob nossa consultoria.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
