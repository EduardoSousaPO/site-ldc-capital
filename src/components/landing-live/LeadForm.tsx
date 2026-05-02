'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { submitLiveLead } from '@/lib/live-leads/actions';
import { LiveLeadFormState, LIVE_CAMPAIGN } from '@/types/live-lead';
import { trackLead } from '@/lib/analytics';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#98ab44] to-[#becc6a] py-4 font-sans text-sm font-bold uppercase tracking-wider text-[#262d3d] transition-all duration-300 hover:shadow-xl hover:shadow-[#98ab44]/40 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
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
        <>
          <span>QUERO PARTICIPAR DA LIVE</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </>
      )}
    </button>
  );
}

const initialState: LiveLeadFormState = {
  success: false,
  message: '',
};

export default function LeadForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, formAction] = useActionState(submitLiveLead, initialState);
  const leadTracked = useRef(false);

  useEffect(() => {
    if (state.success && state.redirectUrl) {
      if (!leadTracked.current) {
        trackLead(LIVE_CAMPAIGN.source);
        leadTracked.current = true;
      }
      const t = setTimeout(() => {
        router.push(state.redirectUrl!);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [state.success, state.redirectUrl, router]);

  const utmSource = searchParams.get('utm_source') || '';
  const utmMedium = searchParams.get('utm_medium') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';
  const utmContent = searchParams.get('utm_content') || '';
  const utmTerm = searchParams.get('utm_term') || '';

  if (state.success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-14 h-14 mx-auto bg-[#98ab44]/20 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-[#98ab44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-serif text-[#98ab44] text-xl">Inscrição confirmada</h3>
        <p className="text-white/70 text-sm font-sans">Redirecionando...</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="utm_source" value={utmSource} />
      <input type="hidden" name="utm_medium" value={utmMedium} />
      <input type="hidden" name="utm_campaign" value={utmCampaign} />
      <input type="hidden" name="utm_content" value={utmContent} />
      <input type="hidden" name="utm_term" value={utmTerm} />

      <div>
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          required
          autoComplete="name"
          className="min-h-12 w-full rounded-lg border border-[#577171]/30 bg-[#344645]/50 px-4 py-3.5 font-sans text-white placeholder-[#577171] transition-all focus:border-[#98ab44] focus:outline-none focus:ring-2 focus:ring-[#98ab44]/20"
        />
        {state.errors?.nome && (
          <p className="mt-1 text-red-400 text-sm font-sans">{state.errors.nome[0]}</p>
        )}
      </div>

      <div>
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          required
          autoComplete="email"
          className="min-h-12 w-full rounded-lg border border-[#577171]/30 bg-[#344645]/50 px-4 py-3.5 font-sans text-white placeholder-[#577171] transition-all focus:border-[#98ab44] focus:outline-none focus:ring-2 focus:ring-[#98ab44]/20"
        />
        {state.errors?.email && (
          <p className="mt-1 text-red-400 text-sm font-sans">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <input
          type="tel"
          name="telefone"
          placeholder="Telefone (com DDD)"
          required
          autoComplete="tel"
          className="min-h-12 w-full rounded-lg border border-[#577171]/30 bg-[#344645]/50 px-4 py-3.5 font-sans text-white placeholder-[#577171] transition-all focus:border-[#98ab44] focus:outline-none focus:ring-2 focus:ring-[#98ab44]/20"
        />
        {state.errors?.telefone && (
          <p className="mt-1 text-red-400 text-sm font-sans">{state.errors.telefone[0]}</p>
        )}
      </div>

      {!state.success && state.message && (
        <p className="text-red-400 text-sm text-center font-sans">{state.message}</p>
      )}

      <SubmitButton />

      <p className="text-white/50 text-[11px] sm:text-xs text-center font-sans mt-2">
        Ao se inscrever, você concorda em receber comunicações da LDC Capital.
      </p>
    </form>
  );
}
