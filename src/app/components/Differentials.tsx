"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Shield, DollarSign, Award, Headphones, Calculator } from "lucide-react";

const differentials = [
  {
    id: "transparency",
    title: "Transparência Total",
    description: "Todas as nossas recomendações são baseadas exclusivamente no seu interesse, sem influência de comissões ou produtos específicos.",
    icon: CheckCircle,
  },
  {
    id: "no-conflict",
    title: "Sem Conflito de Interesses",
    description: "Modelo fee-based elimina conflitos: nossa remuneração vem de você, não de produtos financeiros.",
    icon: Shield,
  },
  {
    id: "cashback",
    title: "Cashback de Comissões",
    description: "Devolvemos as comissões que receberíamos de produtos, reduzindo seu custo total de investimento.",
    icon: DollarSign,
  },
  {
    id: "certified",
    title: "Profissionais Certificados",
    description: "Equipe com certificações CPA, CFP e extensão em Family Office, garantindo expertise técnica.",
    icon: Award,
  },
  {
    id: "online-service",
    title: "Atendimento Online",
    description: "Consultoria completa disponível para todo o Brasil, incluindo brasileiros no exterior.",
    icon: Headphones,
  },
  {
    id: "tax-planning",
    title: "Planejamento Tributário",
    description: "Otimização fiscal inteligente para maximizar a eficiência dos seus investimentos.",
    icon: Calculator,
  },
];

export default function Differentials() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-4">
            Nossos Diferenciais
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            O que nos torna únicos no mercado de consultoria de investimentos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {differentials.map((differential) => {
            const IconComponent = differential.icon;
            
            return (
              <Card key={differential.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-12 h-12 bg-[#98ab44]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#98ab44]/20 transition-colors">
                    <IconComponent className="h-6 w-6 text-[#98ab44]" />
                  </div>
                  
                  <h3 className="font-serif text-lg font-semibold text-[#262d3d] mb-3">
                    {differential.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed flex-1">
                    {differential.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-[#262d3d] to-[#344645] rounded-2xl p-8 lg:p-12 text-white text-center">
          <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-4">
            Raízes no interior, olhos no horizonte
          </h3>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Nossa origem no interior do RS nos ensinou os valores de humildade, trabalho duro e confiança. 
            Hoje aplicamos esses princípios na consultoria de grandes patrimônios.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#98ab44] mb-2">400M+</div>
              <div className="text-gray-300">Sob consultoria</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#98ab44] mb-2">100%</div>
              <div className="text-gray-300">Fee-based</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#98ab44] mb-2">Todo BR</div>
              <div className="text-gray-300">Atendimento online</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
