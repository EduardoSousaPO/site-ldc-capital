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
    };
    
    // Salvar no Supabase (sempre tenta, é o método principal)
    let supabaseResult: { success: boolean; error?: string; leadId?: string } = { success: false };
    const supabase = createSupabaseAdminClient();
    
    try {
      // Type casting necessário porque a tabela Lead ainda não está nos tipos gerados do Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lead, error: supabaseError } = await (supabase.from("Lead") as any)
        .insert({
          nome: leadData.nome,
          email: leadData.email,
          telefone: leadData.telefone || null,
          patrimonio: leadData.patrimonio || null,
          origem: leadData.origem || null,
          origemFormulario: leadData.origemFormulario,
          ip: leadData.ip,
          userAgent: leadData.userAgent,
        })
        .select("id")
        .single();
      
      if (supabaseError) {
        console.error('Erro ao salvar no Supabase:', supabaseError);
        supabaseResult = { success: false, error: supabaseError.message };
      } else {
        supabaseResult = { success: true, leadId: lead?.id };
        console.log('✅ Lead salvo no Supabase:', lead?.id);
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
    
    // Verificar se pelo menos o Supabase funcionou (método principal)
    if (!supabaseResult.success) {
      console.error("❌ Erro ao salvar lead no Supabase. Lead não foi salvo.");
      return NextResponse.json(
        { 
          success: false, 
          message: "Erro ao processar seu cadastro. Por favor, tente novamente mais tarde ou entre em contato diretamente." 
        },
        { status: 500 }
      );
    }
    
    // Se Supabase funcionou, retornamos sucesso mesmo se Google Sheets falhar
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
