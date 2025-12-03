import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { createSupabaseAdminClient } from "@/lib/supabase";

// GET - Listar todos os clientes
export async function GET() {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // Buscar clientes
    const { data: clients, error: clientsError } = await supabase
      .from("Client")
      .select("*")
      .order("createdAt", { ascending: false });

    if (clientsError) {
      console.error("Erro ao buscar clientes:", clientsError);
      return NextResponse.json(
        { error: "Erro ao buscar clientes", details: clientsError.message },
        { status: 500 }
      );
    }

    // Buscar contagem de cenários para cada cliente
    const clientIds = clients?.map((c) => c.id) || [];
    const { data: scenarios, error: scenariosError } = await supabase
      .from("WealthPlanningScenario")
      .select("clientId")
      .in("clientId", clientIds);

    if (scenariosError) {
      console.error("Erro ao buscar cenários:", scenariosError);
    }

    // Agrupar cenários por cliente
    const scenariosCount = new Map<string, number>();
    scenarios?.forEach((s) => {
      scenariosCount.set(s.clientId, (scenariosCount.get(s.clientId) || 0) + 1);
    });

    // Adicionar contagem de cenários
    const clientsWithCount = clients?.map((client) => ({
      ...client,
      scenariosCount: scenariosCount.get(client.id) || 0,
    }));

    return NextResponse.json(clientsWithCount || []);
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    return NextResponse.json(
      {
        error: "Erro ao listar clientes",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
export async function POST(request: Request) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, notes } = body;

    // Validação
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Verificar se email já existe (se fornecido)
    if (email && email.trim()) {
      const { data: existingClient } = await supabase
        .from("Client")
        .select("id")
        .eq("email", email.trim())
        .maybeSingle();

      if (existingClient) {
        return NextResponse.json(
          { error: "Email já cadastrado" },
          { status: 400 }
        );
      }
    }

    // Criar cliente
    const { data: client, error } = await supabase
      .from("Client")
      .insert({
        name: name.trim(),
        email: email && email.trim() ? email.trim() : null,
        phone: phone && phone.trim() ? phone.trim() : null,
        notes: notes && notes.trim() ? notes.trim() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar cliente:", error);
      return NextResponse.json(
        {
          error: "Erro ao criar cliente",
          details: error.message || "Erro desconhecido",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar cliente",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

