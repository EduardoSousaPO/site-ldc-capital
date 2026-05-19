import Image from 'next/image';
import { Suspense } from 'react';
import GuiaLeadForm from '@/components/guia/GuiaLeadForm';

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-[#98ab44] shrink-0 mt-0.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

const benefits = [
  'Por que gestores independentes diversificam fora do Brasil — e por que seu banco não vai te contar isso',
  'A diferença real entre planejamento financeiro e venda de produto — e como identificar qual você está recebendo agora',
  'Sucessão patrimonial: o que precisa ser estruturado antes de você precisar — não depois',
];

function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-[#344645]/30 rounded-lg" />
      ))}
      <div className="h-12 bg-[#98ab44]/30 rounded-lg" />
    </div>
  );
}

export default function GuiaPage() {
  return (
    <main className="min-h-screen">
      {/* ── HEADER ──────────────────────────────── */}
      <header className="py-5 px-4 flex justify-center sm:justify-start sm:px-8 border-b border-white/10">
        <div className="relative w-[140px] h-[52px] sm:w-[160px] sm:h-[60px]">
          <Image
            src="/images/logo-ldc-branca.png"
            alt="LDC Capital"
            fill
            className="object-contain object-left sm:object-left"
            priority
          />
        </div>
      </header>

      {/* ── HERO ────────────────────────────────── */}
      <section className="px-4 py-10 sm:py-14 sm:px-8 max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Texto */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="font-serif text-white text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.2] tracking-[-0.02em] mb-5">
              O que os bankers de São Paulo compram com o próprio dinheiro{' '}
              <span className="text-[#98ab44]">— e nunca vão te oferecer</span>
            </h1>
            <p className="font-sans text-white/70 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Guia gratuito para quem tem patrimônio acima de R$500k e quer parar de ser o produto
              do sistema financeiro.
            </p>
          </div>

          {/* Foto Luciano */}
          <div className="relative w-56 h-72 sm:w-64 sm:h-80 lg:w-72 lg:h-[22rem] shrink-0">
            <div className="absolute -left-3 -top-3 w-full h-full border-2 border-[#98ab44]/40 rounded-2xl" />
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <div className="absolute inset-0 bg-gradient-to-t from-[#262d3d]/40 via-transparent to-transparent z-10" />
              <Image
                src="/images/DSC_5671.JPG"
                alt="Luciano Herzog — CEO LDC Capital"
                fill
                className="object-cover object-[center_20%]"
                priority
              />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-[#262d3d]/95 px-4 py-1.5 rounded-full border border-[#98ab44]/30 shadow-lg whitespace-nowrap">
              <p className="text-[#98ab44] text-xs font-sans font-semibold">Luciano Herzog · CEO</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFÍCIOS ─────────────────────────── */}
      <section className="px-4 sm:px-8 pb-10 sm:pb-14 max-w-5xl mx-auto">
        <ul className="space-y-4 max-w-2xl mx-auto lg:mx-0">
          {benefits.map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckIcon />
              <span className="font-sans text-white/80 text-sm sm:text-base leading-relaxed">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── FORMULÁRIO ─────────────────────────── */}
      <section id="formulario" className="px-4 sm:px-8 py-12 sm:py-16 bg-[#344645]/30">
        <div className="max-w-md mx-auto">
          <h2 className="font-serif text-white text-xl sm:text-2xl font-semibold text-center mb-6 tracking-[-0.02em]">
            Receba o guia gratuitamente
          </h2>
          <Suspense fallback={<FormSkeleton />}>
            <GuiaLeadForm />
          </Suspense>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="py-6 px-4 border-t border-white/10 text-center">
        <p className="text-white/40 text-xs font-sans">
          © LDC Capital | CVM 3976-4
        </p>
      </footer>
    </main>
  );
}
