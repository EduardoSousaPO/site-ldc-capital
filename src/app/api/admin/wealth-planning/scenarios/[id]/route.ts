import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { ScenarioFormData } from "@/types/wealth-planning";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Buscar cenário por ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("WealthPlanningScenario")
      .select(`
        *,
        Client:clientId (
          id,
          name,
          email
        )
      `)
      .eq("id", id)
      .single();

    // EDITOR só pode ver seus próprios cenários
    if (user.role === "EDITOR") {
      query = query.eq("consultantId", user.id);
    }

    const { data: scenario, error } = await query;

    if (error || !scenario) {
      return NextResponse.json(
        { error: "Cenário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error("Erro ao buscar cenário:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar cenário",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar cenário
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body: Partial<ScenarioFormData> & { status?: string } = await request.json();
    const supabase = createSupabaseAdminClient();

    // Verificar se cenário existe e se usuário tem permissão
    let query = supabase
      .from("WealthPlanningScenario")
      .select("id, consultantId")
      .eq("id", id)
      .single();

    if (user.role === "EDITOR") {
      query = query.eq("consultantId", user.id);
    }

    const { data: existingScenario, error: findError } = await query;

    if (findError || !existingScenario) {
      return NextResponse.json(
        { error: "Cenário não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    // Preparar dados de atualização
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.personalData !== undefined) updateData.personalData = body.personalData;
    if (body.financialData !== undefined) updateData.financialData = body.financialData;
    if (body.portfolio !== undefined) updateData.portfolio = body.portfolio;
    if (body.assets !== undefined) updateData.assets = body.assets;
    if (body.projects !== undefined) updateData.projects = body.projects;
    if (body.debts !== undefined) updateData.debts = body.debts;
    if (body.otherRevenues !== undefined) updateData.otherRevenues = body.otherRevenues;
    if (body.assumptions !== undefined) updateData.assumptions = body.assumptions;

    // Se dados mudaram, limpar resultados calculados
    if (
      body.personalData ||
      body.financialData ||
      body.portfolio ||
      body.assets ||
      body.projects ||
      body.debts ||
      body.otherRevenues ||
      body.assumptions
    ) {
      updateData.calculatedResults = null;
    }

    const { data: scenario, error } = await supabase
      .from("WealthPlanningScenario")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar cenário:", error);
      return NextResponse.json(
        {
          error: "Erro ao atualizar cenário",
          details: error.message || "Erro desconhecido",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error("Erro ao atualizar cenário:", error);
    return NextResponse.json(
      {
        error: "Erro ao atualizar cenário",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir cenário
export async function DELETE(request: Request, { params }: RouteParams) {
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
      .select("id, consultantId")
      .eq("id", id)
      .single();

    if (user.role === "EDITOR") {
      query = query.eq("consultantId", user.id);
    }

    const { data: existingScenario, error: findError } = await query;

    if (findError || !existingScenario) {
      return NextResponse.json(
        { error: "Cenário não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    // Excluir cenário
    const { error: deleteError } = await supabase
      .from("WealthPlanningScenario")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Erro ao excluir cenário:", deleteError);
      return NextResponse.json(
        {
          error: "Erro ao excluir cenário",
          details: deleteError.message || "Erro desconhecido",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir cenário:", error);
    return NextResponse.json(
      {
        error: "Erro ao excluir cenário",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

