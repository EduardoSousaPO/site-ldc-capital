import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-check";
import { createSupabaseAdminClient } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Buscar cliente por ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: client, error } = await supabase
      .from("Client")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Buscar cenários do cliente
    const { data: scenarios } = await supabase
      .from("WealthPlanningScenario")
      .select("id, title, status, createdAt")
      .eq("clientId", id)
      .order("createdAt", { ascending: false });

    return NextResponse.json({
      ...client,
      scenarios: scenarios || [],
    });
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar cliente",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar cliente
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, notes } = body;

    const supabase = createSupabaseAdminClient();

    // Verificar se cliente existe
    const { data: existingClient } = await supabase
      .from("Client")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se email já existe em outro cliente (se fornecido)
    if (email && email.trim()) {
      const { data: emailClient } = await supabase
        .from("Client")
        .select("id")
        .eq("email", email.trim())
        .neq("id", id)
        .maybeSingle();

      if (emailClient) {
        return NextResponse.json(
          { error: "Email já cadastrado para outro cliente" },
          { status: 400 }
        );
      }
    }

    // Atualizar cliente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email && email.trim() ? email.trim() : null;
    if (phone !== undefined) updateData.phone = phone && phone.trim() ? phone.trim() : null;
    if (notes !== undefined) updateData.notes = notes && notes.trim() ? notes.trim() : null;

    const { data: client, error } = await supabase
      .from("Client")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar cliente:", error);
      return NextResponse.json(
        {
          error: "Erro ao atualizar cliente",
          details: error.message || "Erro desconhecido",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json(
      {
        error: "Erro ao atualizar cliente",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir cliente
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await checkAdminAuth();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    // Verificar se cliente existe
    const { data: existingClient } = await supabase
      .from("Client")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Excluir cenários vinculados primeiro (cascata)
    const { data: scenarios } = await supabase
      .from("WealthPlanningScenario")
      .select("id, title")
      .eq("clientId", id);

    if (scenarios && scenarios.length > 0) {
      // Excluir todos os cenários vinculados
      const { error: deleteScenariosError } = await supabase
        .from("WealthPlanningScenario")
        .delete()
        .eq("clientId", id);

      if (deleteScenariosError) {
        console.error("Erro ao excluir cenários:", deleteScenariosError);
        return NextResponse.json(
          {
            error: "Erro ao excluir cenários vinculados",
            details: deleteScenariosError.message || "Erro desconhecido",
          },
          { status: 500 }
        );
      }

      console.log(`Excluídos ${scenarios.length} cenário(s) vinculado(s) ao cliente`);
    }

    // Excluir cliente
    const { error: deleteError } = await supabase
      .from("Client")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Erro ao excluir cliente:", deleteError);
      return NextResponse.json(
        {
          error: "Erro ao excluir cliente",
          details: deleteError.message || "Erro desconhecido",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return NextResponse.json(
      {
        error: "Erro ao excluir cliente",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

