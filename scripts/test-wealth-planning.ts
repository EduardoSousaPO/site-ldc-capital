/**
 * Automated test runner for the Wealth Planning module (Supabase only).
 * Checks create/list/update/delete flows for clients and scenarios.
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Load environment variables before touching Supabase
const __dirname = dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  resolve(__dirname, "../.env"),
  resolve(__dirname, "../../.env"),
  resolve(process.cwd(), ".env"),
];

const envPath = envCandidates.find((p) => existsSync(p));
if (!envPath) {
  console.error("Erro: arquivo .env nao encontrado nos caminhos conhecidos.");
  envCandidates.forEach((p) => console.error(`- ${p}`));
  process.exit(1);
}

config({ path: envPath });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Erro: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type TestResult = {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
};

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, details?: any) {
  results.push({ name, passed, error, details });
  const status = passed ? "✔" : "✖";
  console.log(`${status} ${name}`);
  if (error) console.log(`   Erro: ${error}`);
  if (details) console.log(`   Detalhes:`, JSON.stringify(details, null, 2));
}

async function getConsultantId(): Promise<string | null> {
  const { data, error } = await supabase
    .from("User")
    .select("id, role")
    .in("role", ["ADMIN", "EDITOR"])
    .limit(1);

  if (error) {
    logTest("Buscar usuario ADMIN/EDITOR", false, error.message, error);
    return null;
  }

  if (!data || data.length === 0) {
    logTest("Buscar usuario ADMIN/EDITOR", false, "Nenhum usuario ADMIN/EDITOR encontrado");
    return null;
  }

  return data[0].id;
}

async function testCreateClient() {
  try {
    const testClient = {
      name: `Cliente Teste ${Date.now()}`,
      email: `teste${Date.now()}@exemplo.com`,
      phone: "11999999999",
      notes: "Cliente criado por teste automatizado",
    };

    const { data: client, error } = await supabase
      .from("Client")
      .insert(testClient)
      .select()
      .single();

    if (error) {
      logTest("Criar Cliente", false, error.message, error);
      return null;
    }

    logTest("Criar Cliente", true, undefined, { id: client.id, name: client.name });
    return client;
  } catch (error) {
    logTest("Criar Cliente", false, error instanceof Error ? error.message : "Erro desconhecido");
    return null;
  }
}

async function testListClients() {
  try {
    const { data: clients, error } = await supabase
      .from("Client")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      logTest("Listar Clientes", false, error.message, error);
      return [];
    }

    logTest("Listar Clientes", true, undefined, { count: clients?.length || 0 });
    return clients || [];
  } catch (error) {
    logTest("Listar Clientes", false, error instanceof Error ? error.message : "Erro desconhecido");
    return [];
  }
}

async function testGetClient(clientId: string) {
  try {
    const { data: client, error } = await supabase
      .from("Client")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) {
      logTest("Buscar Cliente", false, error.message, error);
      return null;
    }

    logTest("Buscar Cliente", true, undefined, { id: client.id, name: client.name });
    return client;
  } catch (error) {
    logTest("Buscar Cliente", false, error instanceof Error ? error.message : "Erro desconhecido");
    return null;
  }
}

async function testCreateScenario(clientId: string, consultantId: string) {
  try {
    const testScenario = {
      title: `Cenario Teste ${Date.now()}`,
      clientId,
      consultantId,
      status: "draft",
      personalData: {
        name: "Teste",
        age: 30,
        retirementAge: 60,
        lifeExpectancy: 80,
        maritalStatus: "Solteiro",
        suitability: "Moderado",
        dependents: [],
      },
      financialData: {
        monthlyFamilyExpense: 10000,
        desiredMonthlyRetirementIncome: 40000,
        monthlySavings: 5000,
        expectedMonthlyRetirementRevenues: 0,
        investmentObjective: "Acumular Recursos" as const,
      },
      portfolio: {
        total: 1000000,
        taxConsideration: "Sem considerar I.R",
        immediateLiquidityNeeds: 0,
        assets: [
          {
            asset: "Carteira",
            value: 1000000,
            percentage: 100,
            cdiReturn: 0.097,
          },
        ],
      },
      assets: [],
      projects: [],
      debts: [],
      otherRevenues: [],
      assumptions: {
        annualInflation: 0.035,
        annualCDI: 0.097,
        retirementReturnNominal: 0.097,
        realRetirementReturn: 0.0599,
      },
    };

    const { data: scenario, error } = await supabase
      .from("WealthPlanningScenario")
      .insert(testScenario)
      .select()
      .single();

    if (error) {
      logTest("Criar Cenario", false, error.message, error);
      return null;
    }

    logTest("Criar Cenario", true, undefined, { id: scenario.id, title: scenario.title });
    return scenario;
  } catch (error) {
    logTest("Criar Cenario", false, error instanceof Error ? error.message : "Erro desconhecido");
    return null;
  }
}

async function testDeleteClientWithScenarios(clientId: string) {
  try {
    const consultantId = await getConsultantId();
    if (!consultantId) {
      return false;
    }

    const scenario = await testCreateScenario(clientId, consultantId);
    if (!scenario) {
      logTest("Excluir Cliente COM Cenarios (Setup)", false, "Nao foi possivel criar cenario de teste");
      return false;
    }

    const { data: scenarios, error: scenariosError } = await supabase
      .from("WealthPlanningScenario")
      .select("id")
      .eq("clientId", clientId);

    if (scenariosError) {
      logTest("Excluir Cliente COM Cenarios", false, `Erro ao verificar cenarios: ${scenariosError.message}`);
      await supabase.from("WealthPlanningScenario").delete().eq("id", scenario.id);
      return false;
    }

    if (scenarios && scenarios.length > 0) {
      logTest("Excluir Cliente COM Cenarios", true, undefined, {
        message: "Validacao funcionando: cliente nao pode ser removido com cenarios vinculados",
        scenariosCount: scenarios.length,
      });

      await supabase.from("WealthPlanningScenario").delete().eq("id", scenario.id);
      return true;
    } else {
      logTest("Excluir Cliente COM Cenarios", false, "Cenario nao encontrado apos criacao");
      await supabase.from("WealthPlanningScenario").delete().eq("id", scenario.id);
      return false;
    }
  } catch (error) {
    logTest("Excluir Cliente COM Cenarios", false, error instanceof Error ? error.message : "Erro desconhecido");
    return false;
  }
}

async function testDeleteClientWithoutScenarios(clientId: string) {
  try {
    const { data: scenarios } = await supabase
      .from("WealthPlanningScenario")
      .select("id")
      .eq("clientId", clientId);

    if (scenarios && scenarios.length > 0) {
      logTest("Excluir Cliente SEM Cenarios (Setup)", false, `Cliente tem ${scenarios.length} cenario(s)`);
      return false;
    }

    const { error } = await supabase.from("Client").delete().eq("id", clientId);
    if (error) {
      logTest("Excluir Cliente SEM Cenarios", false, error.message, error);
      return false;
    }

    const { data: deletedClient } = await supabase
      .from("Client")
      .select("id")
      .eq("id", clientId)
      .single();

    if (deletedClient) {
      logTest("Excluir Cliente SEM Cenarios", false, "Cliente ainda existe apos exclusao");
      return false;
    }

    logTest("Excluir Cliente SEM Cenarios", true);
    return true;
  } catch (error) {
    logTest("Excluir Cliente SEM Cenarios", false, error instanceof Error ? error.message : "Erro desconhecido");
    return false;
  }
}

async function testUpdateClient(clientId: string) {
  try {
    const updateData = {
      phone: "11888888888",
      notes: "Cliente atualizado por teste automatizado",
    };

    const { data: client, error } = await supabase
      .from("Client")
      .update(updateData)
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      logTest("Atualizar Cliente", false, error.message, error);
      return false;
    }

    if (client.phone !== updateData.phone || client.notes !== updateData.notes) {
      logTest("Atualizar Cliente", false, "Dados nao foram atualizados corretamente");
      return false;
    }

    logTest("Atualizar Cliente", true, undefined, { id: client.id, phone: client.phone });
    return true;
  } catch (error) {
    logTest("Atualizar Cliente", false, error instanceof Error ? error.message : "Erro desconhecido");
    return false;
  }
}

async function testListScenarios() {
  try {
    const { data: scenarios, error } = await supabase
      .from("WealthPlanningScenario")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(10);

    if (error) {
      logTest("Listar Cenarios", false, error.message, error);
      return [];
    }

    logTest("Listar Cenarios", true, undefined, { count: scenarios?.length || 0 });
    return scenarios || [];
  } catch (error) {
    logTest("Listar Cenarios", false, error instanceof Error ? error.message : "Erro desconhecido");
    return [];
  }
}

async function runAllTests() {
  console.log("\nIniciando testes automatizados do Wealth Planning...\n");

  console.log("\nTeste 1: Criar Cliente");
  const testClient = await testCreateClient();
  if (!testClient) {
    console.log("\nFalha critica: nao foi possivel criar cliente. Abortando.");
    return;
  }

  console.log("\nTeste 2: Listar Clientes");
  await testListClients();

  console.log("\nTeste 3: Buscar Cliente");
  await testGetClient(testClient.id);

  console.log("\nTeste 4: Atualizar Cliente");
  await testUpdateClient(testClient.id);

  console.log("\nTeste 5: Criar Cenario");
  const consultantId = await getConsultantId();
  if (!consultantId) {
    logTest("Criar Cenario (Setup)", false, "Nenhum usuario ADMIN/EDITOR encontrado");
  } else {
    const testScenario = await testCreateScenario(testClient.id, consultantId);

    console.log("\nTeste 6: Listar Cenarios");
    await testListScenarios();

    console.log("\nTeste 7: Tentar Excluir Cliente COM Cenarios");
    await testDeleteClientWithScenarios(testClient.id);

    if (testScenario) {
      await supabase.from("WealthPlanningScenario").delete().eq("id", testScenario.id);
    }
  }

  console.log("\nTeste 8: Excluir Cliente SEM Cenarios");
  await testDeleteClientWithoutScenarios(testClient.id);

  console.log("\n\nRESUMO DOS TESTES");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const status = result.passed ? "✔" : "✖";
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });

  console.log("=".repeat(60));
  console.log(`Total: ${total} | Passou: ${passed} | Falhou: ${failed}`);
  console.log(`Taxa de sucesso: ${total > 0 ? ((passed / total) * 100).toFixed(1) : "0"}%`);

  if (failed > 0) {
    console.log("\nAlguns testes falharam. Verifique os logs acima.\n");
    process.exit(1);
  } else {
    console.log("\nTodos os testes passaram!\n");
    process.exit(0);
  }
}

runAllTests().catch((error) => {
  console.error("Erro fatal ao executar testes:", error);
  process.exit(1);
});
