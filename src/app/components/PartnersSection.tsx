"use client";

import { Shield, Award, Globe, CheckCircle } from "lucide-react";

const partners = [
  { name: "CVM", description: "Registrado na Comissão de Valores Mobiliários" },
  { name: "APIMEC", description: "Associação dos Profissionais de Investimento" },
  { name: "IBCPF", description: "Instituto Brasileiro de Certificação" },
  { name: "ANBIMA", description: "Associação Brasileira das Entidades" },
];

const credentials = [
  {
    icon: Shield,
    title: "400M+",
    subtitle: "Sob consultoria",
    description: "Patrimônio sob nossa gestão e consultoria"
  },
  {
    icon: CheckCircle,
    title: "100%",
    subtitle: "Fee-based",
    description: "Modelo transparente sem conflitos"
  },
  {
    icon: Globe,
    title: "Todo BR",
    subtitle: "Atendimento online",
    description: "Consultoria disponível em todo o país"
  }
];

export default function PartnersSection() {
  return (
    <section className="py-16 lg:py-24 bg-[#262d3d] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(45deg, rgba(152, 171, 68, 0.1) 25%, transparent 25%),
                           linear-gradient(-45deg, rgba(152, 171, 68, 0.1) 25%, transparent 25%)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-4">
            Raízes no interior, olhos no horizonte
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Nossa origem no interior do RS nos ensinou os valores da humildade, trabalho duro 
            e confiança. Hoje aplicamos esses princípios na consultoria de grandes patrimônios.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {credentials.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#98ab44]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="h-8 w-8 text-[#98ab44]" />
                </div>
                <h3 className="text-3xl font-bold text-[#98ab44] mb-2">{item.title}</h3>
                <p className="text-white font-semibold mb-2">{item.subtitle}</p>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Certificações */}
        <div className="text-center">
          <h3 className="font-serif text-2xl font-bold mb-8 text-white">
            Certificações e Registros
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {partners.map((partner, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-[#98ab44]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-[#98ab44]" />
                </div>
                <h4 className="font-bold text-white mb-2">{partner.name}</h4>
                <p className="text-gray-400 text-xs leading-relaxed">{partner.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-[#98ab44]/20 to-[#becc6a]/20 rounded-3xl p-8 border border-[#98ab44]/20">
            <p className="text-lg text-gray-300 italic max-w-2xl mx-auto">
              &ldquo;Mais do que números e gráficos, oferecemos direção clara e segura para seu patrimônio, 
              baseada em valores sólidos e experiência comprovada.&rdquo;
            </p>
            <div className="mt-4">
              <p className="text-[#98ab44] font-semibold">— Filosofia LDC Capital</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
