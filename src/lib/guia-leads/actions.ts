'use server';

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { z } from 'zod';
import { GuiaFormState } from '@/types/guia-lead';

const guiaLeadSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato inválido. Use: (00) 00000-0000'),
  email: z.string().email('E-mail inválido'),
  patrimonio_range: z.enum(['menos_100k', '100k_300k', '300k_500k', 'acima_500k'], {
    message: 'Selecione uma opção',
  }),
});

// Untyped admin client — guia_leads não está nos Database types gerados ainda
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function submitGuiaLead(
  prevState: GuiaFormState,
  formData: FormData
): Promise<GuiaFormState> {
  const headersList = await headers();

  const rawData = {
    nome: formData.get('nome') as string,
    whatsapp: formData.get('whatsapp') as string,
    email: formData.get('email') as string,
    patrimonio_range: formData.get('patrimonio_range') as string,
  };

  const validatedFields = guiaLeadSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Por favor, corrija os erros no formulário.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const ipAddress =
    headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  const qualificado = validatedFields.data.patrimonio_range === 'acima_500k';

  try {
    const supabase = getAdminClient();

    const { error } = await supabase.from('guia_leads').insert({
      nome: validatedFields.data.nome,
      whatsapp: validatedFields.data.whatsapp,
      email: validatedFields.data.email,
      patrimonio_range: validatedFields.data.patrimonio_range,
      qualificado,
      origem: 'landing-guia',
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      // Duplicidade — ainda retorna sucesso para não frustrar o lead
      if (error.code === '23505') {
        return {
          success: true,
          message: `Perfeito, ${validatedFields.data.nome}. O guia foi enviado para ${validatedFields.data.email}. Fique atento também ao seu WhatsApp.`,
          nomeConfirmado: validatedFields.data.nome,
          emailConfirmado: validatedFields.data.email,
        };
      }
      console.error('Erro ao salvar guia lead:', error);
      throw error;
    }

    return {
      success: true,
      message: `Perfeito, ${validatedFields.data.nome}. O guia foi enviado para ${validatedFields.data.email}. Fique atento também ao seu WhatsApp.`,
      nomeConfirmado: validatedFields.data.nome,
      emailConfirmado: validatedFields.data.email,
    };
  } catch (err) {
    console.error('Erro ao salvar guia lead:', err);
    return {
      success: false,
      message: 'Erro ao processar o cadastro. Por favor, tente novamente.',
    };
  }
}
