'use client';

import { Award, Users, Briefcase, TrendingUp } from 'lucide-react';

const stats = [
  {
    icon: Briefcase,
    value: 'R$ 400M+',
    label: 'Sob Consultoria',
  },
  {
    icon: Users,
    value: 'Dezenas',
    label: 'de Famílias Assessoradas',
  },
  {
    icon: TrendingUp,
    value: '10+',
    label: 'Anos de Experiência',
  },
  {
    icon: Award,
    value: 'Insper',
    label: 'Extensão em Family Office',
  },
];

export default function SocialProofSection() {
  return (
    <section className="py-12 lg:py-16 bg-[#262d3d] border-y border-[#98ab44]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center"
            >
              <div className="w-12 h-12 mx-auto bg-[#98ab44]/10 rounded-full flex items-center justify-center mb-3">
                <stat.icon className="w-5 h-5 text-[#98ab44]" />
              </div>
              <div className="font-serif text-[#98ab44] text-2xl lg:text-3xl font-bold mb-1">
                {stat.value}
              </div>
              <div className="text-white/60 text-sm font-sans">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Credenciais */}
        <div className="mt-10 pt-8 border-t border-white/10 text-center">
          <p className="text-white/50 text-sm font-sans mb-3">
            Criado por
          </p>
          <h3 className="font-serif text-white text-xl lg:text-2xl font-semibold mb-2">
            Luciano Herzog
          </h3>
          <p className="text-white/60 text-sm font-sans max-w-xl mx-auto">
            Consultor de Investimentos CVM • Sócio-fundador da LDC Capital • 
            Especialista em Investimentos Internacionais • Extensão em Family Office pelo Insper
          </p>
        </div>
      </div>
    </section>
  );
}
