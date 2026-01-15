"use client";

import { useEffect, useState } from "react";

export default function QuoteSection() {
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

    const section = document.getElementById('quote-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="quote-section"
      className="relative py-16 lg:py-24 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200"
    >
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Lado Esquerdo - Citação */}
          <div 
            className={`transition-all duration-1000 ${
              isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 lg:p-10 xl:p-12 border border-white/50 shadow-2xl">
              <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-[#262d3d] leading-relaxed">
                &ldquo;Porque quando você chega em um certo patamar, já não é sobre quanto você tem.{" "}
                <span className="font-serif font-semibold text-[#98ab44]">É sobre com quem você conta.</span>&rdquo;
              </blockquote>
            </div>
          </div>

          {/* Lado Direito - Imagem */}
          <div 
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/WhatsApp Image 2026-01-06 at 11.40.36.jpeg"
                alt="Equipe LDC Capital"
                className="w-full h-auto object-contain brightness-95 contrast-105"
              />
              
              {/* Overlay fosco para deixar a foto levemente opaca */}
              <div className="absolute inset-0 bg-white/10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Elementos Decorativos */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#98ab44]/30 to-transparent"></div>
    </section>
  );
}
