import { NextRequest, NextResponse } from "next/server";
import { leadFormSchema } from "@/app/lib/schema";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          message: "Formato de dados inválido. Por favor, recarregue a página e tente novamente." 
        },
        { status: 400 }
      );
    }
    
    // Validate the data
    const validatedData = leadFormSchema.parse(body);
    
    // Preparar dados do lead
    const leadData = {
      nome: validatedData.nome,
      email: validatedData.email,
      telefone: validatedData.telefone,
      patrimonio: validatedData.patrimonio,
      origem: validatedData.origem,
      origemFormulario: 'Home' as const,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      utm_source: validatedData.utm_source ?? null,
      utm_medium: validatedData.utm_medium ?? null,
      utm_campaign: validatedData.utm_campaign ?? null,
      utm_content: validatedData.utm_content ?? null,
      utm_term: validatedData.utm_term ?? null,
      landing_page: validatedData.landing_page ?? null,
      referrer: validatedData.referrer ?? null,
    };

    // utm_captured_at = momento do submit (createdAt já cobre, mas mantemos
    // explícito para auditoria caso o cookie/storage tenha sido populado antes).
    const hasAnyUtm = Boolean(
      leadData.utm_source ||
      leadData.utm_medium ||
      leadData.utm_campaign ||
      leadData.utm_content ||
      leadData.utm_term ||
      leadData.landing_page ||
      leadData.referrer
    );
    const utmCapturedAt = hasAnyUtm ? new Date().toISOString() : null;
    
    // Salvar no Supabase usando a tabela Client (Lead não existe)
    let supabaseResult: { success: boolean; error?: string; leadId?: string } = { success: false };
    const supabase = createSupabaseAdminClient();
    
    try {
      // Usando tabela Client como alternativa (tabela Lead não existe)
      const { data: client, error: supabaseError } = await supabase
        .from("Client")
        .insert({
          name: leadData.nome,
          email: leadData.email,
          phone: leadData.telefone || null,
          notes: `Patrimônio: ${leadData.patrimonio || 'N/I'} | Origem: ${leadData.origem || 'Home'} | IP: ${leadData.ip}`,
          utm_source: leadData.utm_source,
          utm_medium: leadData.utm_medium,
          utm_campaign: leadData.utm_campaign,
          utm_content: leadData.utm_content,
          utm_term: leadData.utm_term,
          landing_page: leadData.landing_page,
          referrer: leadData.referrer,
          utm_captured_at: utmCapturedAt,
        })
        .select("id")
        .single();
      
      if (supabaseError) {
        console.error('Erro ao salvar no Supabase:', supabaseError);
        supabaseResult = { success: false, error: supabaseError.message };
      } else {
        supabaseResult = { success: true, leadId: client?.id };
        console.log('✅ Lead salvo no Supabase (Client):', client?.id);
      }
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
      supabaseResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
    
    // Integração com Google Sheets (opcional - só executa se configurado)
    let sheetsResult: { success: boolean; error?: string } = { success: false };
    let emailResult: { success: boolean; error?: string } = { success: false };
    let confirmationResult: { success: boolean; error?: string } = { success: false };
    
    if (process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      try {
        const { addToGoogleSheets } = await import("@/lib/google-sheets");
        
        sheetsResult = await addToGoogleSheets(leadData);
        if (!sheetsResult.success && sheetsResult.error) {
          console.error('Erro ao salvar no Google Sheets:', sheetsResult.error);
        }
        
        // Enviar email para a equipe
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          const { sendNewLeadEmail, sendConfirmationEmail } = await import("@/lib/email");
          
          emailResult = await sendNewLeadEmail(leadData);
          if (!emailResult.success && emailResult.error) {
            console.error('Erro ao enviar email:', emailResult.error);
          }
          
          // Enviar email de confirmação para o lead
          confirmationResult = await sendConfirmationEmail({
            nome: validatedData.nome,
            email: validatedData.email,
            origemFormulario: 'Home',
          });
          if (!confirmationResult.success && confirmationResult.error) {
            console.error('Erro ao enviar email de confirmação:', confirmationResult.error);
          }
        }
      } catch (error) {
        console.error('Erro nas integrações externas:', error);
        // Não falha a API se as integrações não funcionarem
      }
    }
    
    console.log("New lead received:", {
      nome: leadData.nome,
      email: leadData.email,
      patrimonio: leadData.patrimonio,
      origem: leadData.origem,
      supabaseSaved: supabaseResult.success,
      sheetsIntegration: sheetsResult.success,
      emailSent: emailResult.success,
      confirmationSent: confirmationResult.success,
    });
    
    // Verificar se pelo menos um dos métodos de armazenamento funcionou
    // Prioridade: Google Sheets (principal para acompanhamento) ou Supabase (backup)
    const leadSaved = sheetsResult.success || supabaseResult.success;
    
    if (!leadSaved) {
      console.error("❌ Erro ao salvar lead. Nenhum método de armazenamento funcionou.");
      return NextResponse.json(
        { 
          success: false, 
          message: "Erro ao processar seu cadastro. Por favor, tente novamente mais tarde ou entre em contato diretamente." 
        },
        { status: 500 }
      );
    }
    
    // Se pelo menos um método funcionou, retornamos sucesso
    console.log("✅ Lead salvo com sucesso:", {
      sheets: sheetsResult.success,
      supabase: supabaseResult.success
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Lead cadastrado com sucesso",
        leadId: supabaseResult.leadId 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error processing lead:", error);
    
    // Verificar se é erro de validação Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Dados inválidos",
          errors: error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    
    // Outros erros
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage || "Erro interno do servidor"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Endpoint desabilitado - leads são gerenciados via Google Sheets ou Supabase
  return NextResponse.json(
    { 
      success: false, 
      message: "Este endpoint não está mais disponível. Leads são gerenciados via Google Sheets." 
    },
    { status: 410 }
  );
}
