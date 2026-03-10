import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { dividendTaxLeadSchema } from "@/lib/dividend-tax/validators";
import { createSupabaseAdminClient } from "@/lib/supabase";

function mapAnnualDividendsToSheetRange(totalAnnualDividends: number): string {
  if (totalAnnualDividends < 300_000) return "0-300k";
  if (totalAnnualDividends < 1_000_000) return "300k-1m";
  if (totalAnnualDividends < 5_000_000) return "1m-5m";
  if (totalAnnualDividends < 10_000_000) return "5m-10m";
  if (totalAnnualDividends < 30_000_000) return "10m-30m";
  return "acima-30m";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = dividendTaxLeadSchema.parse(body);

    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const summary = validated.simulationSummary;
    const notes =
      `Origem: Calculadora IR Dividendos 2026 | ` +
      `Dividendos anuais: R$ ${summary.totalAnnualDividends.toFixed(2)} | ` +
      `Imposto total: R$ ${summary.totalTaxDue.toFixed(2)} | ` +
      `Impacto: ${summary.impactPercentage.toFixed(2)}% | ` +
      `IP: ${ip}`;

    const supabase = createSupabaseAdminClient();
    let persistedId: string | null = null;
    let clientSaved = false;

    try {
      const { data: persistedClient, error: persistError } = await supabase
        .from("Client")
        .insert({
          name: validated.nome,
          email: validated.email,
          phone: validated.telefone,
          notes,
        })
        .select("id")
        .single();

      if (persistError) {
        throw new Error(persistError.message);
      }

      persistedId = persistedClient?.id || null;
      clientSaved = true;
    } catch (error) {
      console.error("[dividend-tax/lead] client persistence error", error);
    }

    const hasSheetsConfig =
      !!process.env.GOOGLE_SHEETS_ID &&
      !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let sheetsSaved = false;
    if (hasSheetsConfig) {
      try {
        const { addToGoogleSheets } = await import("@/lib/google-sheets");
        const sheetsResult = await addToGoogleSheets({
          nome: validated.nome,
          email: validated.email,
          telefone: validated.telefone,
          patrimonio: mapAnnualDividendsToSheetRange(summary.totalAnnualDividends),
          origem: "Calculadora IR Dividendos 2026",
          origemFormulario: "Calculadora IR Dividendos 2026",
          mensagem: notes,
        });

        sheetsSaved = sheetsResult.success;
      } catch (error) {
        console.error("[dividend-tax/lead] google sheets error", error);
      }
    }

    let emailSent = false;
    const hasEmailProvider =
      !!process.env.RESEND_API_KEY ||
      (!!process.env.SMTP_USER && !!process.env.SMTP_PASS);

    if (hasEmailProvider) {
      try {
        const { sendNewLeadEmail, sendConfirmationEmail } = await import("@/lib/email");

        const newLeadResult = await sendNewLeadEmail({
          nome: validated.nome,
          email: validated.email,
          telefone: validated.telefone,
          patrimonio: mapAnnualDividendsToSheetRange(summary.totalAnnualDividends),
          origem: "Calculadora IR Dividendos 2026",
          mensagem: notes,
          origemFormulario: "Calculadora IR Dividendos 2026",
        });

        await sendConfirmationEmail({
          nome: validated.nome,
          email: validated.email,
          origemFormulario: "Calculadora IR Dividendos 2026",
        });

        emailSent = newLeadResult.success;
      } catch (error) {
        console.error("[dividend-tax/lead] email error", error);
      }
    }

    if (hasSheetsConfig && !sheetsSaved) {
      return NextResponse.json(
        {
          success: false,
          message: "Nao foi possivel registrar o lead na planilha Google Sheets.",
        },
        { status: 500 },
      );
    }

    if (!sheetsSaved && !clientSaved) {
      return NextResponse.json(
        {
          success: false,
          message: "Nao foi possivel salvar o lead.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        leadId: persistedId,
        integrations: {
          sheetsSaved,
          emailSent,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados de lead invalidos.",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("[dividend-tax/lead] error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno ao salvar lead.",
      },
      { status: 500 },
    );
  }
}
