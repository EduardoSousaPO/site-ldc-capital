'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { submitGuiaLead } from '@/lib/guia-leads/actions';
import { PATRIMONIO_OPTIONS, GuiaFormState } from '@/types/guia-lead';
import { trackLead, trackMetaEvent } from '@/lib/analytics';

function maskWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  const len = digits.length;
  if (len === 0) return '';
  if (len <= 2) return `(${digits}`;
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (len <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-4 bg-gradient-to-r from-[#98ab44] to-[#becc6a]
                 text-[#262d3d] font-sans font-bold uppercase tracking-wider rounded-lg
                 hover:shadow-xl hover:shadow-[#98ab44]/40 transition-all duration-300
                 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base
                 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Enviando...</span>
        </>
      ) : (
        <span>Quero o guia gratuito</span>
      )}
    </button>
  );
}

const initialState: GuiaFormState = {
  success: false,
  message: '',
};

export default function GuiaLeadForm() {
  const [state, formAction] = useActionState(submitGuiaLead, initialState);
  const [whatsapp, setWhatsapp] = useState('');
  const [patrimonio, setPatrimonio] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const redirected = useRef(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      trackMetaEvent('ViewContent', {
        content_name: 'guia-bankers-page',
        content_type: 'landing_page',
      });
    }
  }, []);

  useEffect(() => {
    if (state.success && state.whatsappUrl) {
      if (!redirected.current) {
        redirected.current = true;
        const valueMap: Record<string, number> = {
          menos_100k: 10, '100k_300k': 25, '300k_500k': 50, acima_500k: 100,
        };
        trackLead('guia-bankers', valueMap[patrimonio] || 25, {
          patrimonio_faixa: patrimonio,
        });
        const redirectTimer = setTimeout(() => {
          window.location.href = state.whatsappUrl!;
        }, 1500);
        const fallbackTimer = setTimeout(() => {
          setShowFallback(true);
        }, 3000);
        return () => {
          clearTimeout(redirectTimer);
          clearTimeout(fallbackTimer);
        };
      }
    }
  }, [state.success, state.whatsappUrl]);

  if (state.success && state.whatsappUrl) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto bg-[#98ab44]/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#98ab44]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            </svg>
          </div>
        </div>

        <h3 className="font-serif text-[#98ab44] text-xl">
          Redirecionando para WhatsApp...
        </h3>

        <p className="text-white/70 text-sm font-sans">
          Envie a mensagem para receber seu guia!
        </p>

        {showFallback && (
          <div className="mt-6 space-y-3">
            <p className="text-white/60 text-sm font-sans">
              Não abriu automaticamente?
            </p>
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg
                         hover:bg-green-700 transition-colors font-sans"
            >
              Abrir WhatsApp Manualmente
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <input
          type="text"
          name="nome"
          placeholder="Nome completo"
          required
          autoComplete="name"
          className="w-full px-4 py-3.5 bg-[#344645]/50 border border-[#577171]/40
                     rounded-lg text-white placeholder-[#577171] font-sans text-sm
                     focus:border-[#98ab44] focus:ring-2 focus:ring-[#98ab44]/20
                     focus:outline-none transition-all"
        />
        {state.errors?.nome && (
          <p className="mt-1 text-red-400 text-xs font-sans">{state.errors.nome[0]}</p>
        )}
      </div>

      <div>
        <input
          type="tel"
          name="whatsapp"
          placeholder="WhatsApp (00) 00000-0000"
          required
          autoComplete="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
          className="w-full px-4 py-3.5 bg-[#344645]/50 border border-[#577171]/40
                     rounded-lg text-white placeholder-[#577171] font-sans text-sm
                     focus:border-[#98ab44] focus:ring-2 focus:ring-[#98ab44]/20
                     focus:outline-none transition-all"
        />
        {state.errors?.whatsapp && (
          <p className="mt-1 text-red-400 text-xs font-sans">{state.errors.whatsapp[0]}</p>
        )}
      </div>

      <div>
        <input
          type="email"
          name="email"
          placeholder="Seu melhor e-mail"
          required
          autoComplete="email"
          className="w-full px-4 py-3.5 bg-[#344645]/50 border border-[#577171]/40
                     rounded-lg text-white placeholder-[#577171] font-sans text-sm
                     focus:border-[#98ab44] focus:ring-2 focus:ring-[#98ab44]/20
                     focus:outline-none transition-all"
        />
        {state.errors?.email && (
          <p className="mt-1 text-red-400 text-xs font-sans">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <select
          name="patrimonio_range"
          required
          value={patrimonio}
          onChange={(e) => setPatrimonio(e.target.value)}
          className="w-full px-4 py-3.5 bg-[#344645]/50 border border-[#577171]/40
                     rounded-lg text-white font-sans text-sm appearance-none cursor-pointer
                     focus:border-[#98ab44] focus:ring-2 focus:ring-[#98ab44]/20
                     focus:outline-none transition-all"
        >
          <option value="" disabled className="text-[#577171] bg-[#262d3d]">
            Qual é o valor aproximado do seu patrimônio investido hoje?
          </option>
          {PATRIMONIO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#262d3d]">
              {opt.label}
            </option>
          ))}
        </select>
        {state.errors?.patrimonio_range && (
          <p className="mt-1 text-red-400 text-xs font-sans">{state.errors.patrimonio_range[0]}</p>
        )}
      </div>

      {!state.success && state.message && (
        <p className="text-red-400 text-sm text-center font-sans">{state.message}</p>
      )}

      <SubmitButton />

      <div className="pt-1 text-center space-y-1">
        <p className="text-white/70 text-xs font-sans font-medium">
          Luciano Herzog | CEO LDC Capital | CVM 3976-4
        </p>
        <p className="text-white/50 text-xs font-sans">
          R$400M+ sob consultoria | Consultoria independente, sem conflito de interesses
        </p>
      </div>
    </form>
  );
}
