import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { calculateDividendTax } from "@/lib/dividend-tax/calculator";
import { dividendTaxSimulationInputSchema } from "@/lib/dividend-tax/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedInput = dividendTaxSimulationInputSchema.parse(body);

    const result = calculateDividendTax(validatedInput);

    return NextResponse.json(
      {
        success: true,
        input: validatedInput,
        result,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados invalidos para simulacao.",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("[dividend-tax/calculate] error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno ao calcular a simulacao.",
      },
      { status: 500 },
    );
  }
}
