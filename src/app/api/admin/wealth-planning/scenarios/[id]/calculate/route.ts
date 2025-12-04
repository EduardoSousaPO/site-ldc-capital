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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
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
      personalData: scenario.personalData as ScenarioData['personalData'],
      financialData: scenario.financialData as ScenarioData['financialData'],
      portfolio: scenario.portfolio as ScenarioData['portfolio'],
      assets: scenario.assets as ScenarioData['assets'],
      projects: scenario.projects as ScenarioData['projects'],
      debts: scenario.debts as ScenarioData['debts'],
      otherRevenues: scenario.otherRevenues as ScenarioData['otherRevenues'],
      assumptions: scenario.assumptions as ScenarioData['assumptions'],
    };

    // Executar cálculos
    const calculatedResults = calculateScenario(scenarioData);

    // Salvar resultados no banco
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from("WealthPlanningScenario") as any)
      .update({ calculatedResults })
      .eq("id", id);

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

