import { NextRequest, NextResponse } from "next/server";
import { leadFormSchema } from "@/app/lib/schema";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
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
    
    // In a real application, you would integrate with:
    // - Email service (Mailchimp, SendGrid, etc.)
    // - CRM (HubSpot, Salesforce, etc.)
    // - Database (PostgreSQL, MongoDB, etc.)
    // - Notification service (Slack, Discord, etc.)
    
    console.log("New lead received:", {
      id: lead.id,
      nome: lead.nome,
      email: lead.email,
      patrimonio: lead.patrimonio,
      origem: lead.origem,
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
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { 
          success: false, 
          message: "Dados inválidos",
          errors: error.message 
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
