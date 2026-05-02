'use client';

import { Suspense } from 'react';
import LeadForm from './LeadForm';
import { LIVE_CAMPAIGN } from '@/types/live-lead';

const topicos = [
  'Diferentes cenários políticos possíveis',
  'Como está o desenho atual da corrida presidencial',
  'Expectativas para o novo desenho do Congresso Nacional',
  'Estratégias a serem adotadas pelos partidos',
  'Como os recentes eventos econômicos podem impactar as urnas',
];

function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-14 rounded-lg bg-[#344645]/30" />
      <div className="h-14 rounded-lg bg-[#344645]/30" />
      <div className="h-14 rounded-lg bg-[#344645]/30" />
      <div className="h-14 rounded-lg bg-[#98ab44]/30" />
    </div>
  );
}

export default function InfoFormSection() {
  return (
    <section id="formulario" className="relative scroll-mt-12 bg-[#1a2233] py-16 lg:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2398ab44' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse gap-10 lg:grid lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* Editorial — mais condensado em largura */}
          <div className="max-w-xl text-white/85 lg:max-w-none lg:pt-2">
            <h2 className="mb-5 font-serif text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl">
              O futuro do Brasil já está sendo desenhado nos bastidores e os investidores{' '}
              <span className="text-[#98ab44]">não podem ficar para trás</span>.
            </h2>

            <div className="space-y-4 font-sans text-base leading-relaxed text-white/80 sm:text-lg">
              <p>
                O cenário político e econômico vive um momento decisivo. As peças do tabuleiro para a
                sucessão presidencial já se movem e suas repercussões impactam diretamente os mercados.
              </p>
              <p>
                Por isso, o time da LDC Capital se reunirá em uma live no canal de Luciano Herzog no
                YouTube com o Analista Político da XP Investimentos,{' '}
                <span className="font-semibold text-white">João Paulo Machado</span>, responsável por
                elaborar relatórios e análises de cenários macroeconômicos e políticos, incluindo o
                acompanhamento de eleições e desafios fiscais.
              </p>
            </div>

            <div className="mt-8">
              <p className="mb-4 font-sans text-sm uppercase tracking-[0.18em] text-[#98ab44]">
                Na live abordaremos
              </p>
              <ul className="space-y-3.5">
                {topicos.map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#98ab44]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-sans text-base text-white/85">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Form — card escuro premium + reforço editorial logo abaixo */}
          <div className="lg:sticky lg:top-8">
            <div className="relative rounded-2xl border border-[#98ab44]/25 bg-gradient-to-br from-[#1a2233] to-[#0a1628] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)] sm:p-8 lg:p-9">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 sm:left-8 sm:translate-x-0">
                <span className="inline-block whitespace-nowrap rounded-full bg-[#98ab44] px-3 py-1 font-sans text-xs font-bold uppercase tracking-wider text-[#262d3d] shadow-md shadow-black/20">
                  Inscrição gratuita
                </span>
              </div>

              <h3 className="mb-2 mt-4 font-serif text-2xl font-bold leading-tight text-white sm:text-3xl md:text-[1.75rem]">
                Garanta sua vaga na <span className="text-[#98ab44]">live</span>
              </h3>
              <p className="mb-6 font-sans text-sm text-white/60 sm:text-base">
                Preencha seus dados e receba os lembretes da transmissão por e-mail.
              </p>

              <Suspense fallback={<FormSkeleton />}>
                <LeadForm />
              </Suspense>

              <ul className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                {[
                  'Inscrição 100% gratuita',
                  'Lembrete por e-mail',
                  'Acesso ao replay',
                  'Sem spam',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 font-sans text-xs text-white/70 sm:text-[13px]"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-[#98ab44]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reforço editorial logo abaixo do card do formulário */}
            <div className="mt-6 rounded-r-lg border-l-4 border-[#98ab44] bg-[#0a1628]/50 p-5">
              <p className="font-sans text-base italic leading-relaxed text-white/85 sm:text-lg">
                Não é um debate partidário. É uma análise estratégica das informações disponíveis hoje
                para investidores.
              </p>
            </div>

            <p className="mt-5 font-serif text-lg text-white sm:text-xl">
              Te esperamos ao vivo no YouTube no dia{' '}
              <span className="font-semibold text-[#98ab44]">{LIVE_CAMPAIGN.date}</span>, às{' '}
              <span className="font-semibold text-[#98ab44]">{LIVE_CAMPAIGN.time}</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
