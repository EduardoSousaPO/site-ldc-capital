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
      className="relative py-16 lg:py-24 overflow-hidden min-h-screen bg-gradient-to-br from-slate-100 to-slate-200"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-12 items-center min-h-screen">
          {/* Lado Esquerdo - Citação */}
          <div 
            className={`transition-all duration-1000 ${
              isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 lg:p-12 border border-white/30 shadow-2xl">
              <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#262d3d] leading-relaxed">
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
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/jonas-wurster-3LwMyv3FiUE-unsplash.jpg"
                alt="Pessoas no Preikestolen - Pulpit Rock"
                className="w-full h-[600px] lg:h-[800px] object-cover"
              />
              
              {/* Overlay sutil para profundidade */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#262d3d]/20 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Elementos Decorativos */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#98ab44]/30 to-transparent"></div>
    </section>
  );
}
