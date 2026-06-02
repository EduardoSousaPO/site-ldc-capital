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
                src="/images/luciano-guia.webp"
                alt="Luciano Herzog — Consultor de Investimentos CVM"
                fill
                className="object-cover object-[center_20%]"
                sizes="(max-width: 640px) 224px, (max-width: 1024px) 256px, 288px"
                quality={80}
                priority
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wAARCAAHAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAID/8QAGhAAAgIDAAAAAAAAAAAAAAAAAAECBBETIf/EABQBAQAAAAAAAAAAAAAAAAAAAAH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDC3Z1uMUustPKAAv/Z"
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

      {/* ── PROVA SOCIAL ──────────────────────── */}
      <section className="px-4 sm:px-8 pb-10 sm:pb-14 max-w-5xl mx-auto">
        <div className="max-w-2xl mx-auto lg:mx-0 space-y-6">
          <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#98ab44]/30 bg-[#98ab44]/10">
              <svg className="w-3.5 h-3.5 text-[#98ab44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[#98ab44] text-xs font-sans font-semibold">CVM 3976-4</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/5">
              <span className="text-white/60 text-xs font-sans">Consultoria independente</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/5">
              <span className="text-white/60 text-xs font-sans">R$400M+ sob consultoria</span>
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <blockquote className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
              <p className="font-sans text-white/75 text-sm leading-relaxed italic">
                &ldquo;Finalmente encontrei um consultor que trabalha para mim, não para o banco.&rdquo;
              </p>
              <cite className="block mt-2 font-sans text-[#98ab44] text-xs not-italic font-semibold">
                — Roberto M., São Paulo
              </cite>
            </blockquote>
            <blockquote className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
              <p className="font-sans text-white/75 text-sm leading-relaxed italic">
                &ldquo;A diversificação internacional que a LDC montou para minha família mudou completamente nossa segurança financeira.&rdquo;
              </p>
              <cite className="block mt-2 font-sans text-[#98ab44] text-xs not-italic font-semibold">
                — Fernanda L., Curitiba
              </cite>
            </blockquote>
          </div>
        </div>
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
