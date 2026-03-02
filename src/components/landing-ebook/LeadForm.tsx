'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { submitEbookLead } from '@/lib/ebook-leads/actions';
import { VALORES_INVESTIMENTO, LeadFormState } from '@/types/ebook-lead';
import { trackLead } from '@/lib/analytics';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="group w-full py-4 bg-gradient-to-r from-[#98ab44] to-[#becc6a] 
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
          <span>Processando...</span>
        </>
      ) : (
        <>
          <span>🚀 QUERO MEU E-BOOK GRÁTIS</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </>
      )}
    </button>
  );
}

const initialState: LeadFormState = {
  success: false,
  message: '',
};

export default function LeadForm() {
  const searchParams = useSearchParams();
  const [showFallback, setShowFallback] = useState(false);
  const [state, formAction] = useActionState(submitEbookLead, initialState);
  
  // Redirecionar para WhatsApp após sucesso
  const leadTracked = useRef(false);
  useEffect(() => {
    if (state.success && state.whatsappUrl) {
      // Disparar evento Lead do Meta Pixel (e GA) para rastrear conversão da campanha
      if (!leadTracked.current) {
        trackLead('ebook-investimentos-internacionais');
        leadTracked.current = true;
      }
      // Pequeno delay para UX
      const redirectTimer = setTimeout(() => {
        window.location.href = state.whatsappUrl!;
      }, 500);
      
      // Fallback se WhatsApp não abrir após 3 segundos
      const fallbackTimer = setTimeout(() => {
        setShowFallback(true);
      }, 3000);
      
      return () => {
        clearTimeout(redirectTimer);
        clearTimeout(fallbackTimer);
      };
    }
  }, [state.success, state.whatsappUrl]);
  
  // Extrair UTM params
  const utmSource = searchParams.get('utm_source') || '';
  const utmMedium = searchParams.get('utm_medium') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';
  const utmContent = searchParams.get('utm_content') || '';
  const utmTerm = searchParams.get('utm_term') || '';
  
  // Tela de sucesso com redirecionamento
  if (state.success && state.whatsappUrl) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto bg-[#98ab44]/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#98ab44]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
          </div>
        </div>
        
        <h3 className="font-serif text-[#98ab44] text-xl">
          ✅ Redirecionando para WhatsApp...
        </h3>
        
        <p className="text-white/70 text-sm font-sans">
          Envie a mensagem para receber seu e-book!
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
              📱 Abrir WhatsApp Manualmente
            </a>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <form action={formAction} className="space-y-4">
      {/* Campos ocultos para UTM */}
      <input type="hidden" name="utm_source" value={utmSource} />
      <input type="hidden" name="utm_medium" value={utmMedium} />
      <input type="hidden" name="utm_campaign" value={utmCampaign} />
      <input type="hidden" name="utm_content" value={utmContent} />
      <input type="hidden" name="utm_term" value={utmTerm} />
      
      {/* Nome */}
      <div>
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          required
          className="w-full px-4 py-4 bg-[#344645]/50 border border-[#577171]/30 
                     rounded-lg text-white placeholder-[#577171] font-sans
                     focus:border-[#98ab44] focus:ring-2 focus:ring-[#98ab44]/20 
                     focus:outline-none transition-all"
        />
        {state.errors?.nome && (
          <p className="mt-1 text-red-400 text-sm font-sans">{state.errors.nome[0]}</p>
        )}
      </div>
      
      {/* E-mail */}
      <div>
        <input
          type="email"
          name="email"
          placeholder="Seu e-mail"
          required
          className="w-full px-4 py-4 bg-[#344645]/50 border border-[#577171]/30 
                     rounded-lg text-white placeholder-[#577171] font-sans
                     focus:border-[#98ab44] focus:ring-2 focus:ring-[#98ab44]/20 
                     focus:outline-none transition-all"
        />
        {state.errors?.email && (
          <p className="mt-1 text-red-400 text-sm font-sans">{state.errors.email[0]}</p>
        )}
      </div>
      
      {/* Telefone */}
      <div>
        <input
          type="tel"
          name="telefone"
          placeholder="Telefone"
          required
          className="w-full px-4 py-4 bg-[#344645]/50 border border-[#577171]/30 
                     rounded-lg text-white placeholder-[#577171] font-sans
                     focus:border-[#98ab44] focus:ring-2 focus:ring-[#98ab44]/20 
                     focus:outline-none transition-all"
        />
        {state.errors?.telefone && (
          <p className="mt-1 text-red-400 text-sm font-sans">{state.errors.telefone[0]}</p>
        )}
      </div>
      
      {/* Valor de Investimento */}
      <div>
        <select
          name="valor_investimento"
          required
          defaultValue=""
          className="w-full px-4 py-4 bg-[#344645]/50 border border-[#577171]/30 
                     rounded-lg text-white font-sans appearance-none cursor-pointer
                     focus:border-[#98ab44] focus:ring-2 focus:ring-[#98ab44]/20 
                     focus:outline-none transition-all"
        >
          <option value="" disabled className="text-[#577171]">
            Quanto deseja investir?
          </option>
          {VALORES_INVESTIMENTO.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#262d3d]">
              {option.label}
            </option>
          ))}
        </select>
        {state.errors?.valor_investimento && (
          <p className="mt-1 text-red-400 text-sm font-sans">{state.errors.valor_investimento[0]}</p>
        )}
      </div>
      
      {/* Mensagem de erro geral */}
      {!state.success && state.message && (
        <p className="text-red-400 text-sm text-center font-sans">{state.message}</p>
      )}
      
      {/* Botão de envio */}
      <SubmitButton />
      
      {/* Garantias */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-white/50 text-xs font-sans">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-[#98ab44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          100% Gratuito
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-[#98ab44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Dados Seguros
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-[#98ab44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Acesso Imediato
        </span>
      </div>
    </form>
  );
}
