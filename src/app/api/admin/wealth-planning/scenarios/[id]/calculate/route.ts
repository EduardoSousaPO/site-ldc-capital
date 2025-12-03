import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { calculateScenario } from "@/lib/wealth-planning/calculations";
import type { ScenarioData } from "@/types/wealth-planning";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Executar cálculos do cenário
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    // Verificar se cenário existe e se usuário tem permissão
    let query = supabase
      .from("WealthPlanningScenario")
      .select("*")
      .eq("id", id)
      .single();

    if (user.role === "EDITOR") {
      query = query.eq("consultantId", user.id);
    }

    const { data: scenario, error: findError } = await query;

    if (findError || !scenario) {
      return NextResponse.json(
        { error: "Cenário não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    // Preparar dados do cenário
    const scenarioData: ScenarioData = {
      personalData: scenario.personalData as any,
      financialData: scenario.financialData as any,
      portfolio: scenario.portfolio as any,
      assets: scenario.assets as any,
      projects: scenario.projects as any,
      debts: scenario.debts as any,
      otherRevenues: scenario.otherRevenues as any,
      assumptions: scenario.assumptions as any,
    };

    // Executar cálculos
    const calculatedResults = calculateScenario(scenarioData);

    // Salvar resultados no banco
    const { data: updatedScenario, error: updateError } = await supabase
      .from("WealthPlanningScenario")
      .update({ calculatedResults })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Erro ao salvar resultados:", updateError);
      return NextResponse.json(
        {
          error: "Erro ao salvar resultados",
          details: updateError.message || "Erro desconhecido",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(calculatedResults);
  } catch (error) {
    console.error("Erro ao calcular cenário:", error);
    return NextResponse.json(
      {
        error: "Erro ao calcular cenário",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

