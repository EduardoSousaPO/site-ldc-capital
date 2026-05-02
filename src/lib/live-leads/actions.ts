'use server';

import { createSupabaseAdminClient } from '@/lib/supabase';
import { headers } from 'next/headers';
import { z } from 'zod';
import { LiveLeadFormState, LIVE_CAMPAIGN } from '@/types/live-lead';

const liveLeadSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
});

export async function submitLiveLead(
  prevState: LiveLeadFormState,
  formData: FormData
): Promise<LiveLeadFormState> {
  const headersList = await headers();

  const rawData = {
    nome: (formData.get('nome') as string)?.trim() ?? '',
    email: (formData.get('email') as string)?.trim() ?? '',
    telefone: (formData.get('telefone') as string)?.trim() ?? '',
  };

  const validatedFields = liveLeadSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Por favor, corrija os erros no formulário.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const utmSource = (formData.get('utm_source') as string) || LIVE_CAMPAIGN.source;
  const utmMedium = (formData.get('utm_medium') as string) || null;
  const utmCampaign = (formData.get('utm_campaign') as string) || LIVE_CAMPAIGN.campaign;
  const utmContent = (formData.get('utm_content') as string) || null;
  const utmTerm = (formData.get('utm_term') as string) || null;

  const ipAddress =
    headersList.get('x-forwarded-for') ||
    headersList.get('x-real-ip') ||
    'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from('ebook_leads')
      .insert({
        nome: validatedFields.data.nome,
        email: validatedFields.data.email,
        telefone: validatedFields.data.telefone,
        valor_investimento: 'N/A - Live',
        status: 'pending_whatsapp',
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
        ip_address: ipAddress,
        user_agent: userAgent,
        landing_page: LIVE_CAMPAIGN.landingPageId,
      });

    const hasGoogleSheetsConfig = !!(
      process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    );

    if (hasGoogleSheetsConfig) {
      try {
        const { addToGoogleSheets } = await import('@/lib/google-sheets');

        const sheetsResult = await addToGoogleSheets({
          nome: validatedFields.data.nome,
          email: validatedFields.data.email,
          telefone: validatedFields.data.telefone,
          patrimonio: 'N/A - Live',
          origem: utmSource,
          titulo: 'Live Eleições 2026 - 06/05 19h',
          origemFormulario: 'Page - Live Eleições 2026',
        });

        if (!sheetsResult.success) {
          console.error('❌ Erro ao salvar Live lead no Google Sheets:', sheetsResult.error);
        }
      } catch (sheetsError) {
        console.error('❌ Erro ao salvar Live lead no Google Sheets (não crítico):', sheetsError);
      }
    }

    if (error) {
      // Erro de duplicidade: e-mail já cadastrado — segue para confirmação mesmo assim
      if (error.code === '23505') {
        return {
          success: true,
          redirectUrl: '/live-confirmacao',
          message: 'Inscrição confirmada.',
        };
      }
      console.error('Erro ao salvar live lead:', error);
      throw error;
    }

    return {
      success: true,
      redirectUrl: '/live-confirmacao',
      message: 'Inscrição confirmada.',
    };
  } catch (error) {
    console.error('Erro ao salvar live lead:', error);
    return {
      success: false,
      message: 'Erro ao processar inscrição. Tente novamente.',
    };
  }
}
