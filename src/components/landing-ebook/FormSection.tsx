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
          {/* Placeholder para Foto do Luciano */}
          <div className="relative flex justify-center lg:justify-end order-2 lg:order-1">
            <div className="relative w-64 h-80 sm:w-72 sm:h-96 md:w-80 md:h-[28rem]">
              {/* Moldura decorativa */}
              <div className="absolute -left-3 -top-3 sm:-left-4 sm:-top-4 w-full h-full border-2 border-[#98ab44]/30 rounded-2xl" />
              
              {/* Círculo decorativo atrás */}
              <div className="absolute -left-8 top-1/4 w-32 h-32 sm:w-40 sm:h-40 bg-[#becc6a]/10 rounded-full blur-xl" />
              
              {/* Placeholder para imagem - substitua o src pela foto real */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-[#344645]/50 border-2 border-dashed border-[#98ab44]/40 flex items-center justify-center">
                {/* 
                  INSTRUÇÕES PARA ADICIONAR A FOTO:
                  1. Coloque a foto na pasta: public/images/
                  2. Substitua este div pelo componente Image abaixo:
                  
                  <Image
                    src="/images/NOME_DA_FOTO.jpg"
                    alt="Luciano Herzog - Especialista em Investimentos Internacionais"
                    fill
                    className="object-cover object-top"
                  />
                */}
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#98ab44]/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#98ab44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-[#98ab44]/70 text-sm font-sans">
                    Foto do Luciano Herzog
                  </p>
                  <p className="text-white/40 text-xs mt-1 font-sans">
                    (adicionar posteriormente)
                  </p>
                </div>
              </div>
              
              {/* Elemento decorativo */}
              <div className="absolute -right-4 -bottom-4 w-20 h-20 sm:w-24 sm:h-24 bg-[#98ab44]/20 rounded-full blur-2xl" />
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
