/**
 * Seed script without Prisma. It uses Supabase Admin API to create:
 * - Admin auth user + entry in public."User"
 * - Default blog categories
 * - One sample blog post
 * - Two sample materials
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

if (!existsSync(envPath)) {
  console.error("Erro: arquivo .env nao encontrado em", envPath);
  process.exit(1);
}

config({ path: envPath });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env antes de rodar o seed.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@ldccapital.com.br";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Administrador LDC";

  // Try to create the auth user
  const createResult = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { name: adminName, role: "ADMIN" },
  });

  let authUserId = createResult.data?.user?.id ?? null;

  if (createResult.error) {
    const alreadyExists = 
      createResult.error.message?.toLowerCase().includes("already registered") ||
      createResult.error.code === 'email_exists' ||
      createResult.error.status === 422;
    if (!alreadyExists) {
      throw createResult.error;
    }

    // Fetch existing user id
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) throw listError;
    authUserId = users?.users?.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase())?.id ?? null;
  }

  if (!authUserId) {
    throw new Error("Nao foi possivel obter o ID do usuario admin");
  }

  const { error: upsertError } = await supabase
    .from("User")
    .upsert(
      {
        id: authUserId,
        email: adminEmail,
        name: adminName,
        role: "ADMIN",
      },
      { onConflict: "id" }
    );

  if (upsertError) {
    throw upsertError;
  }

  return authUserId;
}

async function seedCategories() {
  const categories = [
    { name: "Consultoria Financeira", slug: "consultoria-financeira" },
    { name: "Investimentos", slug: "investimentos" },
    { name: "Planejamento Financeiro", slug: "planejamento-financeiro" },
    { name: "Mercado Financeiro", slug: "mercado-financeiro" },
    { name: "Educacao Financeira", slug: "educacao-financeira" },
  ];

  const { error } = await supabase.from("Category").upsert(categories, { onConflict: "slug" });
  if (error) {
    throw error;
  }
}

async function seedBlogPost(authorId: string) {
  const { error } = await supabase.from("BlogPost").upsert(
    {
      title: "Bem-vindo ao Blog LDC Capital",
      slug: "bem-vindo-ao-blog-ldc-capital",
      content: `# Bem-vindo ao Blog LDC Capital

Estamos felizes em dar as boas-vindas ao nosso blog! Aqui voce encontra conteudo sobre investimentos, planejamento financeiro, mercado e educacao financeira.

**Acompanhe nossos conteudos e transforme sua relacao com o dinheiro!**

Equipe LDC Capital`,
      summary:
        "Conheca o novo blog da LDC Capital e descubra o conteudo especializado que preparamos para voce.",
      category: "Educacao Financeira",
      published: true,
      readingTime: "2 min",
      publishedAt: new Date().toISOString(),
      authorId,
      authorDisplayName: "LDC Capital",
    },
    { onConflict: "slug" }
  );

  if (error) throw error;
}

async function seedMaterials(authorId: string) {
  const materials = [
    {
      title: "Cartilha do Investidor Iniciante",
      slug: "cartilha-investidor-iniciante",
      description: "Primeiros passos para investir com seguranca e metodo.",
      content:
        "Cartilha completa para quem esta comecando: conceitos basicos, primeiros passos, tipos de investimento e estrategias.",
      category: "GUIAS",
      type: "Cartilha",
      pages: 28,
      published: true,
      featured: true,
      publishedAt: new Date().toISOString(),
      authorId,
    },
    {
      title: "Guia de Planejamento Financeiro Pessoal",
      slug: "guia-planejamento-financeiro-pessoal",
      description: "Aprenda a organizar suas financas e criar um plano solido para o futuro.",
      content:
        "Guia pratico cobrindo diagnostico financeiro, orcamento, reserva de emergencia e metas.",
      category: "Planejamento Financeiro",
      type: "Guia",
      pages: 35,
      published: true,
      featured: true,
      publishedAt: new Date().toISOString(),
      authorId,
    },
  ];

  const { error } = await supabase.from("Material").upsert(materials, { onConflict: "slug" });
  if (error) throw error;
}

async function main() {
  try {
    const adminId = await ensureAdminUser();
    console.log("✔ Usuario admin garantido.");

    await seedCategories();
    console.log("✔ Categorias criadas/atualizadas.");

    await seedBlogPost(adminId);
    console.log("✔ Post de exemplo criado/atualizado.");

    await seedMaterials(adminId);
    console.log("✔ Materiais de exemplo criados/atualizados.");

    console.log("\nSeed concluido com sucesso!");
    console.log(`Credenciais: ${process.env.ADMIN_EMAIL || "admin@ldccapital.com.br"} / ${
      process.env.ADMIN_PASSWORD || "admin123"
    }`);
  } catch (error) {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  }
}

main();
