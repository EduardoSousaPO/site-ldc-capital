'use client';

import { Globe, Shield, TrendingUp } from 'lucide-react';

const benefits = [
  {
    icon: Globe,
    title: 'Diversificação Global',
  },
  {
    icon: Shield,
    title: 'Proteção Patrimonial',
  },
  {
    icon: TrendingUp,
    title: 'Estratégias Comprovadas',
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-16 lg:py-24 bg-[#0a1628]">
      <div className="max-w-5xl mx-auto px-8 sm:px-12 lg:px-16">
        {/* Header da seção - Clean */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-white text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.02em]">
            O que você vai aprender
          </h2>
        </div>
        
        {/* Benefícios em linha - Minimalista */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-[#98ab44]/15 rounded-full flex items-center justify-center">
                <benefit.icon className="w-5 h-5 text-[#98ab44]" />
              </div>
              <span className="font-sans text-white/90 text-base font-medium">
                {benefit.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
