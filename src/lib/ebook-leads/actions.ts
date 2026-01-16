'use server';

import { createSupabaseAdminClient } from '@/lib/supabase';
import { headers } from 'next/headers';
import { z } from 'zod';
import { LeadFormState, LeadFormData } from '@/types/ebook-lead';

const leadSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  valor_investimento: z.string().min(1, 'Selecione uma opção'),
});

/**
 * Gera URL do WhatsApp com mensagem pré-preenchida
 */
function generateWhatsAppURL(data: LeadFormData): string {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_LDC || '5551926340242';
  
  // Mensagem sem emojis para evitar problemas de encoding
  const message = `Oi, quero o meu ebook!

Meus dados:
Nome: ${data.nome}
E-mail: ${data.email}
Interesse: ${data.valor_investimento}`;

  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
}

export async function submitEbookLead(
  prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const headersList = await headers();
  
  // Extrair dados do formulário
  const rawData = {
    nome: formData.get('nome') as string,
    email: formData.get('email') as string,
    telefone: formData.get('telefone') as string,
    valor_investimento: formData.get('valor_investimento') as string,
  };
  
  // Validar dados
  const validatedFields = leadSchema.safeParse(rawData);
  
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Por favor, corrija os erros no formulário.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  // Extrair UTM params
  const utmSource = formData.get('utm_source') as string;
  const utmMedium = formData.get('utm_medium') as string;
  const utmCampaign = formData.get('utm_campaign') as string;
  const utmContent = formData.get('utm_content') as string;
  const utmTerm = formData.get('utm_term') as string;
  
  // Dados adicionais
  const ipAddress = headersList.get('x-forwarded-for') || 
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
        valor_investimento: validatedFields.data.valor_investimento,
        status: 'pending_whatsapp',
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        utm_content: utmContent || null,
        utm_term: utmTerm || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        landing_page: 'ebook-investimentos-internacionais',
      });
    
    // Salvar também no Google Sheets (se configurado) - ANTES de verificar erros
    // Isso garante que mesmo em caso de duplicidade, o lead será salvo no Google Sheets
    const hasGoogleSheetsConfig = !!(process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('🔍 Google Sheets configurado?', hasGoogleSheetsConfig);
    
    if (hasGoogleSheetsConfig) {
      try {
        const { addToGoogleSheets } = await import('@/lib/google-sheets');
        
        // Mapear valor_investimento para formato de patrimonio usado na planilha
        let patrimonio = validatedFields.data.valor_investimento;
        console.log('📊 Valor original:', patrimonio);
        
        // Mapear para formato compatível com a planilha (baseado nos valores existentes)
        // Os valores vêm do array VALORES_INVESTIMENTO como 'R$0 a R$300 mil', 'R$1 milhão a R$5 milhões', etc.
        if (patrimonio === 'R$0 a R$300 mil' || patrimonio.includes('0 a R$300 mil')) {
          patrimonio = '0-300k';
        } else if (patrimonio === 'R$300 mil a R$1 milhão' || patrimonio.includes('300 mil a R$1 milhão')) {
          patrimonio = '300k-1m';
        } else if (patrimonio === 'R$1 milhão a R$5 milhões' || patrimonio.includes('1 milhão a R$5 milhões')) {
          patrimonio = '1m-5m';
        } else if (patrimonio === 'R$5 milhões a R$10 milhões' || patrimonio.includes('5 milhões a R$10 milhões')) {
          patrimonio = '5m-10m';
        } else if (patrimonio === 'R$10 milhões a R$30 milhões' || patrimonio.includes('10 milhões a R$30 milhões')) {
          patrimonio = '10m-30m';
        } else if (patrimonio === 'Acima de R$30 milhões' || patrimonio.includes('Acima de R$30 milhões')) {
          patrimonio = 'acima-30m';
        } else {
          // Se não mapear, usar o valor original
          patrimonio = validatedFields.data.valor_investimento;
        }
        
        console.log('📊 Patrimônio mapeado:', patrimonio);
        
        const sheetsData = {
          nome: validatedFields.data.nome,
          email: validatedFields.data.email,
          telefone: validatedFields.data.telefone,
          patrimonio: patrimonio,
          origem: utmSource || 'ebook landing page',
          origemFormulario: 'Page - ebook invest internacionais' as 'Page - ebook invest internacionais',
        };
        
        console.log('📝 Dados para Google Sheets:', sheetsData);
        
        const sheetsResult = await addToGoogleSheets(sheetsData);
        
        if (sheetsResult.success) {
          console.log('✅ Lead salvo no Google Sheets com sucesso');
        } else {
          console.error('❌ Erro ao salvar no Google Sheets:', sheetsResult.error);
        }
      } catch (sheetsError) {
        console.error('❌ Erro ao salvar no Google Sheets (não crítico):', sheetsError);
        if (sheetsError instanceof Error) {
          console.error('❌ Stack trace:', sheetsError.stack);
        }
        // Não falha o processo se o Google Sheets der erro
      }
    } else {
      console.warn('⚠️ Google Sheets não configurado - variáveis de ambiente faltando');
    }
    
    // Verificar erros do Supabase APÓS salvar no Google Sheets
    if (error) {
      // Verificar se é erro de duplicidade
      if (error.code === '23505') {
        // Mesmo com duplicidade, gerar URL do WhatsApp
        const whatsappUrl = generateWhatsAppURL(validatedFields.data);
        return {
          success: true,
          whatsappUrl,
          message: 'Redirecionando para WhatsApp...',
        };
      }
      console.error('Erro ao salvar lead:', error);
      throw error;
    }
    
    // Gerar URL do WhatsApp com dados do lead
    const whatsappUrl = generateWhatsAppURL(validatedFields.data);
    
    return {
      success: true,
      whatsappUrl,
      message: 'Redirecionando para WhatsApp...',
    };
    
  } catch (error) {
    console.error('Erro ao salvar lead:', error);
    return {
      success: false,
      message: 'Erro ao processar cadastro. Tente novamente.',
    };
  }
}
