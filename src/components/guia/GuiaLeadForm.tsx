'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import { submitGuiaLead } from '@/lib/guia-leads/actions';
import { PATRIMONIO_OPTIONS, GuiaFormState } from '@/types/guia-lead';

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

  if (state.success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-14 h-14 mx-auto bg-[#98ab44]/20 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-[#98ab44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-serif text-white text-lg sm:text-xl font-semibold leading-snug">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Nome */}
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

      {/* WhatsApp */}
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

      {/* E-mail */}
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

      {/* Patrimônio */}
      <div>
        <select
          name="patrimonio_range"
          required
          defaultValue=""
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

      {/* Erro geral */}
      {!state.success && state.message && (
        <p className="text-red-400 text-sm text-center font-sans">{state.message}</p>
      )}

      <SubmitButton />

      {/* Texto de confiança */}
      <div className="pt-1 text-center space-y-1">
        <p className="text-white/70 text-xs font-sans font-medium">
          Luciano Herzog | CEO LDC Capital | CVM 3976-4
        </p>
        <p className="text-white/50 text-xs font-sans">
          R$400M sob gestão | Gestão independente, sem conflito de interesses
        </p>
      </div>
    </form>
  );
}
