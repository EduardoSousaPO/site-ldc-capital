import { NextRequest, NextResponse } from "next/server";
import { leadFormSchema } from "@/app/lib/schema";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

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
    
    // Add timestamp and ID
    const lead = {
      id: Date.now().toString(),
      ...validatedData,
      createdAt: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    };
    
    // Ensure .data directory exists
    const dataDir = path.join(process.cwd(), ".data");
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    // Read existing leads
    const leadsFile = path.join(dataDir, "leads.json");
    let leads = [];
    
    try {
      const existingData = await fs.readFile(leadsFile, "utf-8");
      leads = JSON.parse(existingData);
    } catch {
      // File doesn't exist or is invalid, start with empty array
      leads = [];
    }
    
    // Add new lead
    leads.push(lead);
    
    // Save back to file
    await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2));
    
    // Integração com Google Sheets (opcional - só executa se configurado)
    let sheetsResult: { success: boolean; error?: string } = { success: false };
    let emailResult: { success: boolean; error?: string } = { success: false };
    let confirmationResult: { success: boolean; error?: string } = { success: false };
    
    if (process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      try {
        const { addToGoogleSheets } = await import("@/lib/google-sheets");
        
        const sheetsData = {
          nome: validatedData.nome,
          email: validatedData.email,
          telefone: validatedData.telefone,
          patrimonio: validatedData.patrimonio,
          origem: validatedData.origem,
          origemFormulario: 'Home' as const,
        };
        
        sheetsResult = await addToGoogleSheets(sheetsData);
        if (!sheetsResult.success && sheetsResult.error) {
          console.error('Erro ao salvar no Google Sheets:', sheetsResult.error);
        }
        
        // Enviar email para a equipe
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          const { sendNewLeadEmail, sendConfirmationEmail } = await import("@/lib/email");
          
          emailResult = await sendNewLeadEmail(sheetsData);
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
      id: lead.id,
      nome: lead.nome,
      email: lead.email,
      patrimonio: lead.patrimonio,
      origem: lead.origem,
      sheetsIntegration: sheetsResult.success,
      emailSent: emailResult.success,
      confirmationSent: confirmationResult.success,
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Lead cadastrado com sucesso",
        leadId: lead.id 
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
  try {
    // Simple endpoint to check leads (for development only)
    const leadsFile = path.join(process.cwd(), ".data", "leads.json");
    
    try {
      const data = await fs.readFile(leadsFile, "utf-8");
      const leads = JSON.parse(data);
      
      return NextResponse.json({
        success: true,
        count: leads.length,
        leads: leads.map((lead: { id: string; nome: string; email: string; patrimonio: string; origem: string; createdAt: string }) => ({
          id: lead.id,
          nome: lead.nome,
          email: lead.email,
          patrimonio: lead.patrimonio,
          origem: lead.origem,
          createdAt: lead.createdAt,
        })),
      });
    } catch {
      return NextResponse.json({
        success: true,
        count: 0,
        leads: [],
      });
    }
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao buscar leads" },
      { status: 500 }
    );
  }
}
