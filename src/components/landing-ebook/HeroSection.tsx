'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Fundo base azul escuro */}
      <div className="absolute inset-0 bg-[#0a1628]" />
      
      {/* Imagem de fundo que ocupa toda a tela mas com fade à esquerda */}
      <div className="absolute inset-0">
        <Image
          src="/images/vitaly-gariev-RbYg6fKSfcY-unsplash.jpg"
          alt="Investimentos Internacionais"
          fill
          className="object-cover object-right"
          priority
        />
        {/* Overlay azul para dar o tom da marca */}
        <div className="absolute inset-0 bg-[#0a1628]/50" />
        
        {/* Gradiente principal - fade da esquerda para a direita */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, 
              #0a1628 0%, 
              #0a1628 35%, 
              rgba(10, 22, 40, 0.98) 45%, 
              rgba(10, 22, 40, 0.9) 55%, 
              rgba(10, 22, 40, 0.7) 65%, 
              rgba(10, 22, 40, 0.4) 75%, 
              rgba(10, 22, 40, 0.2) 85%, 
              transparent 100%)`
          }}
        />
      </div>

      {/* Layout com conteúdo */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        
        {/* Lado Esquerdo - Conteúdo */}
        <div className="relative w-full lg:w-[60%] flex items-center justify-center">
          {/* Fundo sólido para mobile */}
          <div className="absolute inset-0 bg-[#0a1628] lg:bg-transparent" />
          
          <div className="relative w-full px-8 sm:px-12 lg:px-20 xl:px-28 py-16 lg:py-20">
            <div className="max-w-2xl mx-auto">
              {/* Logo LDC grande acima do texto */}
              <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '0s', animationFillMode: 'forwards' }}>
                <Link href="/" className="inline-block">
                  <div className="relative w-[220px] sm:w-[280px] lg:w-[340px] h-[100px] sm:h-[130px] lg:h-[160px]">
                    <Image
                      src="/images/LDC Capital - Logo Final_Aplicação Branca + Colorida.png"
                      alt="LDC Capital"
                      fill
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                </Link>
              </div>

              {/* Headlines - Tipografia Premium IvyMode */}
              <div className="mb-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                <h1 
                  className="font-serif text-[#98ab44] text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.15] tracking-[-0.02em]"
                  style={{ fontStyle: 'italic' }}
                >
                  CONSTRUINDO RIQUEZA
                </h1>
                <h1 
                  className="font-serif text-white text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.15] tracking-[-0.02em]"
                  style={{ fontStyle: 'italic' }}
                >
                  ALÉM DAS FRONTEIRAS
                </h1>
              </div>
              
              {/* Subtítulo - IvyMode com cor de destaque */}
              <h2 
                className="font-serif text-[#becc6a] text-lg sm:text-xl md:text-2xl mb-8 opacity-0 animate-fade-in font-normal tracking-[-0.01em]" 
                style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
              >
                Seu guia em Investimentos Internacionais!
              </h2>
              
              {/* Parágrafos - Public Sans para legibilidade */}
              <div className="space-y-5 opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                <p className="font-sans text-white/80 text-base sm:text-lg leading-[1.8] font-light">
                  Você já imaginou ter acesso a insights valiosos sobre investimentos 
                  internacionais de alguém que já assessorou dezenas de famílias na 
                  internacionalização do patrimônio? Prazer sou Luciano Herzog, 
                  especialista em investimentos internacionais, pronto para compartilhar 
                  segredos e estratégias exclusivas para distribuição de seu patrimônio.
                </p>
                <p className="font-sans text-white/80 text-base sm:text-lg leading-[1.8] font-light">
                  Com anos de experiência no mundo de investimentos internacionais, 
                  ajudando as famílias a escolher a corretora adequada, a fazer 
                  negociações de taxas e spreads, questões tributárias, montagem de 
                  portfólio, e auxiliando na evolução de estratégia, fiz um e-book 
                  explicando sobre o meu conhecimento e o cenário global de investimentos 
                  e os tipos de Investimentos Internacionais para te ajudar nessa jornada.
                </p>
              </div>
              
              {/* CTA - Botão Premium */}
              <div className="mt-10 opacity-0 animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
                <Link
                  href="#formulario"
                  className="group inline-flex items-center gap-3 px-10 py-4 
                             bg-[#98ab44] text-[#0a1628] 
                             font-sans font-semibold text-base sm:text-lg
                             rounded-md shadow-lg shadow-[#98ab44]/20
                             hover:bg-[#becc6a] hover:shadow-xl hover:shadow-[#98ab44]/30
                             transition-all duration-300 ease-out"
                >
                  <span>Baixar e-book</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lado Direito - Espaço para imagem (já está no background) */}
        <div className="hidden lg:block lg:w-[40%]" />
      </div>
    </section>
  );
}
