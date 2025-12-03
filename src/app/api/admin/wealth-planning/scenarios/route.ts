import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { ScenarioData, ScenarioFormData } from "@/types/wealth-planning";

// GET - Listar cenários
export async function GET(request: Request) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("WealthPlanningScenario")
      .select(`
        id,
        title,
        clientId,
        status,
        createdAt,
        updatedAt,
        calculatedResults,
        Client:clientId (
          id,
          name
        )
      `)
      .order("createdAt", { ascending: false });

    // Filtros
    if (clientId) {
      query = query.eq("clientId", clientId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // EDITOR só vê seus próprios cenários
    if (user.role === "EDITOR") {
      query = query.eq("consultantId", user.id);
    }

    const { data: scenarios, error } = await query;

    if (error) {
      console.error("Erro ao buscar cenários:", error);
      return NextResponse.json(
        { error: "Erro ao buscar cenários", details: error.message },
        { status: 500 }
      );
    }

    // Formatar resposta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedScenarios = scenarios?.map((s: any) => ({
      id: s.id,
      title: s.title,
      clientId: s.clientId,
      clientName: s.Client?.name || "Cliente desconhecido",
      status: s.status,
      calculatedAt: s.calculatedResults?.calculatedAt
        ? new Date(s.calculatedResults.calculatedAt)
        : undefined,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));

    return NextResponse.json(formattedScenarios || []);
  } catch (error) {
    console.error("Erro ao listar cenários:", error);
    return NextResponse.json(
      {
        error: "Erro ao listar cenários",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// POST - Criar novo cenário
export async function POST(request: Request) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: ScenarioFormData = await request.json();
    const {
      title,
      clientId,
      personalData,
      financialData,
      portfolio,
      assets,
      projects,
      debts,
      otherRevenues,
      assumptions,
    } = body;

    // Validações básicas
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "Cliente é obrigatório" },
        { status: 400 }
      );
    }

    if (!personalData || !financialData || !portfolio || !assets || !projects || !debts || !otherRevenues || !assumptions) {
      return NextResponse.json(
        { error: "Todos os dados do cenário são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Verificar se cliente existe
    const { data: client } = await supabase
      .from("Client")
      .select("id")
      .eq("id", clientId)
      .single();

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Criar cenário
    const scenarioData = {
      title: title.trim(),
      clientId,
      consultantId: user.id,
      status: "draft" as const,
      personalData,
      financialData,
      portfolio,
      assets,
      projects,
      debts,
      otherRevenues,
      assumptions,
    };

    const { data: scenario, error } = await supabase
      .from("WealthPlanningScenario")
      .insert(scenarioData)
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar cenário:", error);
      return NextResponse.json(
        {
          error: "Erro ao criar cenário",
          details: error.message || "Erro desconhecido",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cenário:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar cenário",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

