'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, Youtube } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { LIVE_CAMPAIGN } from '@/types/live-lead';

type Participant = {
  name: string;
  role: string;
  image: string;
  featured?: boolean;
};

// Ordem visual conforme banner de divulgação: Luciano | João Paulo Machado (destaque) | Germano
const participants: Participant[] = [
  {
    name: 'Luciano Herzog',
    role: 'CEO da LDC Capital',
    image: '/images/live/luciano.webp',
  },
  {
    name: 'João Paulo Machado',
    role: 'Analista Político na XP Investimentos',
    image: '/images/live/joao-paulo-machado.jpeg',
    featured: true,
  },
  {
    name: 'Germano Laube',
    role: 'Sócio da LDC Capital',
    image: '/images/live/germano.png',
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#f5f6f8]">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#98ab44]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#98ab44]/8 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28 lg:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Coluna esquerda */}
          <div>
            <Link href="/" className="mb-8 inline-block">
              <div className="relative h-[64px] w-[180px] sm:h-[80px] sm:w-[220px] lg:h-[96px] lg:w-[260px]">
                <Image
                  src="/images/LDC Capital - Logo Final_Aplicação Horizontal Colorida.png"
                  alt="LDC Capital"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#98ab44]/40 bg-[#98ab44]/15 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#98ab44]" aria-hidden />
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[#5d6b1f]">
                LIVE · {LIVE_CAMPAIGN.date} · {LIVE_CAMPAIGN.time}
              </span>
            </div>

            <h1 className="mb-3 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[#262d3d] sm:text-5xl md:text-6xl lg:text-[4rem]">
              Eleições <span className="text-[#98ab44]">2026</span>
            </h1>

            <h2 className="mb-6 font-serif text-xl font-normal italic leading-tight tracking-[-0.01em] text-[#577171] sm:text-2xl md:text-3xl">
              O fator que pode mudar o Brasil e seus investimentos
            </h2>

            <p className="mb-8 max-w-xl font-sans text-base leading-relaxed text-[#262d3d]/80 sm:text-lg">
              Veja como está o desenho atual e as estratégias dos candidatos à eleição em 2026 e como
              esse cenário pode impactar seus investimentos no curto e longo prazo.
            </p>

            <Link
              href="#formulario"
              onClick={() => trackEvent('cta_click', 'live', 'hero_inscreva-se')}
              className="group inline-flex min-h-12 items-center gap-3 rounded-md bg-[#98ab44] px-8 py-4 font-sans text-sm font-bold uppercase tracking-wider text-[#262d3d] shadow-lg shadow-[#98ab44]/30 transition-all duration-300 hover:bg-[#becc6a] hover:shadow-xl hover:shadow-[#98ab44]/40 sm:px-10 sm:text-base"
            >
              <span>Inscreva-se para a live</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>

            <p className="mt-4 max-w-xl font-sans text-xs text-[#577171] sm:text-sm">
              Transmissão ao vivo no canal de Luciano Herzog no YouTube.
            </p>
          </div>

          {/* Card do evento */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#262d3d] to-[#1a2233] p-6 shadow-2xl shadow-black/40 sm:p-8 lg:p-9">
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />

              <div className="mb-6 text-center sm:mb-7">
                <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.22em] text-[#98ab44] sm:text-xs">
                  LIVE · Canal Luciano Herzog
                </p>
                <p className="font-serif text-base italic leading-snug text-white/90 sm:text-lg">
                  Eleições 2026 e os impactos nos investimentos
                </p>
              </div>

              {/* Painel unificado dos participantes — convidado em destaque no centro */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-[#11203a] via-[#0a1628] to-[#0a1628]/70 px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5">
                {/* Nomes acima das fotos — mesmo grid template das fotos para alinhamento */}
                <div className="mb-3 grid grid-cols-[1fr_1.3fr_1fr] gap-1.5 sm:mb-4 sm:gap-3">
                  {participants.map((p) => (
                    <div key={`name-${p.name}`} className="px-0.5 text-center sm:px-1">
                      <p className="font-serif text-[11px] font-semibold leading-tight text-white text-balance sm:text-sm md:text-[15px]">
                        {p.name}
                      </p>
                      <p
                        className={`mt-1 font-sans text-[9px] leading-tight text-balance sm:text-[11px] md:text-xs ${
                          p.featured ? 'font-medium text-[#98ab44]' : 'text-white/65'
                        }`}
                      >
                        {p.role}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Fotos — coluna do convidado 30% maior, alinhadas pela base */}
                <div className="grid grid-cols-[1fr_1.3fr_1fr] items-end gap-1 sm:gap-1.5">
                  {participants.map((p) => (
                    <div
                      key={`photo-${p.name}`}
                      className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-[#0a1628]/40 ${
                        p.featured ? 'shadow-lg shadow-[#98ab44]/15 ring-1 ring-[#98ab44]/45' : ''
                      }`}
                    >
                      {p.featured && (
                        <span className="absolute left-1/2 top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#98ab44] px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider text-[#0a1628] shadow-md shadow-black/40 sm:text-[10px]">
                          Convidado
                        </span>
                      )}
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover object-[center_15%]"
                        sizes={
                          p.featured
                            ? '(max-width: 640px) 38vw, (max-width: 1024px) 28vw, 240px'
                            : '(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 180px'
                        }
                        priority={p.featured}
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a1628]/85 to-transparent" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer com ícones — estilo banner */}
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 sm:mt-6 sm:gap-4">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <Calendar className="h-4 w-4 shrink-0 text-[#98ab44] sm:h-5 sm:w-5" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-sans text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Data</p>
                    <p className="font-serif text-sm font-semibold leading-tight text-white sm:text-base md:text-lg">
                      {LIVE_CAMPAIGN.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-[#98ab44] sm:h-5 sm:w-5" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-sans text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Horário</p>
                    <p className="font-serif text-sm font-semibold leading-tight text-white sm:text-base md:text-lg">
                      {LIVE_CAMPAIGN.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 sm:justify-end">
                  <Youtube className="h-4 w-4 shrink-0 text-[#98ab44] sm:h-5 sm:w-5" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-sans text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Canal</p>
                    <p className="font-serif text-sm font-semibold leading-tight text-white sm:text-base md:text-lg">
                      Luciano Herzog
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
