'use client';

import Image from 'next/image';
import { Suspense } from 'react';
import LeadForm from './LeadForm';

function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-14 bg-[#344645]/30 rounded-lg" />
      <div className="h-14 bg-[#344645]/30 rounded-lg" />
      <div className="h-14 bg-[#344645]/30 rounded-lg" />
      <div className="h-14 bg-[#344645]/30 rounded-lg" />
      <div className="h-14 bg-[#98ab44]/30 rounded-lg" />
    </div>
  );
}

export default function FormSection() {
  return (
    <section id="formulario" className="py-16 lg:py-24 bg-[#262d3d]">
      {/* Pattern de fundo sutil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2398ab44' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
          {/* Foto do Luciano */}
          <div className="relative flex justify-center lg:justify-end order-2 lg:order-1">
            <div className="relative w-72 h-[22rem] sm:w-80 sm:h-[26rem] md:w-[22rem] md:h-[30rem]">
              {/* Glow de fundo */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#98ab44]/20 to-[#becc6a]/10 rounded-2xl blur-3xl scale-110" />
              
              {/* Moldura decorativa offset */}
              <div className="absolute -left-3 -top-3 sm:-left-4 sm:-top-4 w-full h-full border-2 border-[#98ab44]/40 rounded-2xl" />
              
              {/* Container da foto com efeitos */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40 group">
                {/* Gradient overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#262d3d]/40 via-transparent to-transparent z-10" />
                
                {/* Borda interna luminosa */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 z-20" />
                
                {/* Imagem */}
                <Image
                  src="/images/DSC_5671.JPG"
                  alt="Luciano Herzog - Especialista em Investimentos Internacionais"
                  fill
                  className="object-cover object-[center_20%]"
                  priority
                />
              </div>
              
              {/* Badge de credibilidade */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 bg-[#262d3d]/95 backdrop-blur-sm px-4 py-2 rounded-full border border-[#98ab44]/30 shadow-lg">
                <p className="text-[#98ab44] text-xs sm:text-sm font-semibold whitespace-nowrap">
                  Luciano Herzog
                </p>
              </div>
              
              {/* Elemento decorativo canto */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 sm:w-32 sm:h-32 bg-[#98ab44]/15 rounded-full blur-2xl" />
            </div>
          </div>
          
          {/* Formulário */}
          <div className="order-1 lg:order-2">
            {/* Badge de destaque */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#98ab44]/10 border border-[#98ab44]/30 rounded-full mb-4">
              <span className="w-2 h-2 bg-[#98ab44] rounded-full animate-pulse" />
              <span className="text-[#98ab44] text-xs font-sans uppercase tracking-wider">
                E-book Gratuito
              </span>
            </div>
            
            <h3 className="font-serif text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 leading-tight">
              Baixe agora seu guia completo de{' '}
              <span className="text-[#98ab44]">Investimentos Internacionais</span>
            </h3>
            
            <p className="text-white/60 text-sm sm:text-base mb-6 font-sans">
              Preencha seus dados e receba acesso imediato ao e-book que vai transformar 
              sua visão sobre diversificação global de patrimônio.
            </p>
            
            <Suspense fallback={<FormSkeleton />}>
              <LeadForm />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
