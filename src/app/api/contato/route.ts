import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema para formulário de contato
const contatoFormSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  titulo: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  mensagem: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the data
    const validatedData = contatoFormSchema.parse(body);
    
    // Preparar dados para Google Sheets e email
    const sheetsData = {
      nome: validatedData.nome,
      email: validatedData.email,
      telefone: '', // Não disponível no formulário de contato
      patrimonio: 'Não informado',
      origem: 'Formulário de Contato',
      mensagem: validatedData.mensagem,
      titulo: validatedData.titulo,
      origemFormulario: 'Fale Conosco' as const,
    };
    
    // Integração com Google Sheets (opcional - só executa se configurado)
    let sheetsResult: { success: boolean; error?: string } = { success: false };
    let emailResult: { success: boolean; error?: string } = { success: false };
    let confirmationResult: { success: boolean; error?: string } = { success: false };
    
    if (process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      try {
        const { addToGoogleSheets } = await import("@/lib/google-sheets");
        sheetsResult = await addToGoogleSheets(sheetsData);
        if (!sheetsResult.success && sheetsResult.error) {
          console.error('Erro ao salvar no Google Sheets:', sheetsResult.error);
        }
      } catch (error) {
        console.error('Erro ao salvar no Google Sheets (opcional):', error);
      }
    }

    // Envio de e-mail (independente do Google Sheets)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const { sendNewLeadEmail, sendConfirmationEmail } = await import("@/lib/email");
        emailResult = await sendNewLeadEmail(sheetsData);
        if (!emailResult.success && emailResult.error) {
          console.error('Erro ao enviar email:', emailResult.error);
        }
        confirmationResult = await sendConfirmationEmail({
          nome: validatedData.nome,
          email: validatedData.email,
          origemFormulario: 'Fale Conosco',
        });
        if (!confirmationResult.success && confirmationResult.error) {
          console.error('Erro ao enviar email de confirmação:', confirmationResult.error);
        }
      } catch (error) {
        console.error('Erro ao enviar e-mails:', error);
      }
    }
    
    console.log("New contact received:", {
      nome: validatedData.nome,
      email: validatedData.email,
      titulo: validatedData.titulo,
      sheetsIntegration: sheetsResult.success,
      emailSent: emailResult.success,
      confirmationSent: confirmationResult.success,
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Mensagem enviada com sucesso! Responderemos em até 24 horas úteis.",
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error processing contact:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Dados inválidos",
          errors: error.issues
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Erro interno do servidor" 
      },
      { status: 500 }
    );
  }
}
