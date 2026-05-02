'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { Youtube } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { LIVE_CAMPAIGN } from '@/types/live-lead';

export default function ConfirmationContent() {
  useEffect(() => {
    trackEvent('live_confirmation_view', 'live', LIVE_CAMPAIGN.source);
  }, []);

  const handleReminderClick = () => {
    trackEvent('cta_click', 'live', 'confirmacao_ativar-lembrete');
  };

  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#f5f6f8] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#98ab44]/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#98ab44]/8 blur-3xl" />
      </div>

      {/* Ornamento "wave" desktop — equilibra espaço vertical */}
      <div
        className="pointer-events-none absolute left-1/2 top-[12%] hidden w-[min(92vw,56rem)] -translate-x-1/2 text-[#98ab44] opacity-[0.18] lg:block"
        aria-hidden
      >
        <svg viewBox="0 0 900 32" className="h-8 w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 20c75-18 150-18 225 0s150 18 225 0 150-18 225 0 150 18 225 0"
            stroke="currentColor"
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M0 26c90-10 180-10 270 0s180 10 270 0 180-10 270 0 180 10 270 0"
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.65"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center lg:max-w-4xl">
        <div className="mx-auto mb-10 inline-block lg:mb-12">
          <Link href="/">
            <div className="relative mx-auto h-[144px] w-[400px] sm:h-[176px] sm:w-[480px]">
              <Image
                src="/images/LDC Capital - Logo Final_Aplicação Horizontal Colorida.png"
                alt="LDC Capital"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#98ab44]/55 bg-[#98ab44]/20 shadow-[0_0_40px_rgba(152,171,68,0.25)] sm:h-28 sm:w-28">
          <svg
            className="h-11 w-11 text-[#5d6b1f] sm:h-12 sm:w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight text-[#262d3d] sm:text-4xl md:text-5xl">
          Inscrição <span className="text-[#98ab44]">confirmada</span>
        </h1>

        <p className="mb-3 font-sans text-lg text-[#262d3d]/85 sm:text-xl">
          Você receberá os lembretes da live por <span className="whitespace-nowrap">e-mail</span>.
        </p>

        <p className="mx-auto mb-10 max-w-xl font-sans text-base text-[#577171] sm:text-lg">
          Se quiser garantir agora, ative o lembrete no YouTube clicando abaixo.
        </p>

        <div className="mb-10 inline-flex w-full max-w-md flex-col rounded-xl border border-[#262d3d]/15 bg-gradient-to-br from-[#1a2233] to-[#0a1628] p-6 text-left shadow-xl shadow-[#262d3d]/15 sm:max-w-lg sm:p-8 lg:mx-auto lg:max-w-xl">
          <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#98ab44]">Live Eleições 2026</p>
          <p className="font-serif text-lg font-semibold leading-snug text-white sm:text-xl">
            {LIVE_CAMPAIGN.date} · {LIVE_CAMPAIGN.time} · Canal {LIVE_CAMPAIGN.channelName}
          </p>
        </div>

        <div>
          <a
            href={LIVE_CAMPAIGN.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleReminderClick}
            className="group inline-flex min-h-12 items-center gap-3 rounded-md bg-[#98ab44] px-8 py-4 font-sans text-sm font-bold uppercase tracking-wider text-[#262d3d] shadow-lg shadow-[#98ab44]/20 transition-all duration-300 hover:bg-[#becc6a] hover:shadow-xl hover:shadow-[#98ab44]/30 sm:px-10 sm:text-base"
          >
            <Youtube className="h-5 w-5 shrink-0" aria-hidden />
            <span>ATIVAR LEMBRETE</span>
          </a>
          <p className="mt-4 font-sans text-xs text-[#577171] sm:text-sm">Abre o YouTube em uma nova aba.</p>
        </div>

        <div className="mt-12 lg:mt-16">
          <Link
            href="/"
            className="font-sans text-sm text-[#577171] transition-colors hover:text-[#98ab44]"
          >
            ← Voltar ao site da LDC Capital
          </Link>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-[8%] left-1/2 hidden w-[min(92vw,56rem)] -translate-x-1/2 text-[#98ab44] opacity-[0.15] lg:block"
        aria-hidden
      >
        <svg viewBox="0 0 900 32" className="h-8 w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 12c90 14 180 14 270 0s180-14 270 0 180 14 270 0 180-14 270 0"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </section>
  );
}
