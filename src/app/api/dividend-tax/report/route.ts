import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { calculateDividendTax } from "@/lib/dividend-tax/calculator";
import { dividendTaxSimulationInputSchema } from "@/lib/dividend-tax/validators";
import { generateDividendTaxReportHtml } from "@/lib/dividend-tax/report-template";
import { generatePdfFromHtml } from "@/lib/dividend-tax/pdf-generator";
import { join } from "path";
import { readFileSync } from "fs";

const reportPayloadSchema = z.object({
  input: dividendTaxSimulationInputSchema,
  leadName: z.string().optional(),
});

function getLogoBase64(): string {
  try {
    const logoPath = join(
      process.cwd(),
      "public",
      "images",
      "LDC Capital - Logo Final_Aplicação Principal.png",
    );

    const logoBuffer = readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = reportPayloadSchema.parse(body);

    const result = calculateDividendTax(validated.input);
    const html = generateDividendTaxReportHtml(validated.input, result, {
      leadName: validated.leadName,
      generatedAt: new Date(),
      logoBase64: getLogoBase64(),
    });

    try {
      const pdfBuffer = await generatePdfFromHtml(html);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'attachment; filename="relatorio-tributacao-dividendos-ldc.pdf"',
          "Cache-Control": "no-store",
        },
      });
    } catch (pdfError) {
      console.error("[dividend-tax/report] pdf generation failed, fallback html", pdfError);

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="relatorio-tributacao-dividendos-ldc.html"',
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Payload invalido para gerar relatorio.",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("[dividend-tax/report] error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno ao gerar relatorio.",
      },
      { status: 500 },
    );
  }
}
