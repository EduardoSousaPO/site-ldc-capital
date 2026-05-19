/**
 * Garante usuários do painel admin no Supabase Auth (role ADMIN) e na tabela public."User".
 * Uso: defina ADMIN_SYNC_PASSWORD no .env (recomendado) ou será usado o padrão abaixo.
 *   pnpm exec tsx scripts/sync-admin-users.ts
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.");
  process.exit(1);
}

const syncPassword =
  process.env.ADMIN_SYNC_PASSWORD ||
  process.env.ADMIN_PASSWORD ||
  "LdcBlog2026";

type AdminRow = {
  email: string;
  name: string;
};

const admins: AdminRow[] = [
  { email: "admin@ldccapital.com.br", name: "Administrador LDC Capital" },
  { email: "eduardo.sousa@ldccapital.com.br", name: "Eduardo Sousa" },
  { email: "marcos.meneghel@ldccapital.com.br", name: "Marcos Meneghel" },
  { email: "luciano.herzog@ldccapital.com.br", name: "Luciano Herzog" },
];

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshSession: false, persistSession: false, autoRefreshToken: false },
});

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  let page = 1;
  const perPage = 1000;
  const target = email.toLowerCase();
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found?.id) return found.id;
    if (!data.users.length || data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function ensureAdmin(row: AdminRow): Promise<void> {
  const meta = {
    name: row.name,
    role: "ADMIN" as const,
  };

  const existingId = await findAuthUserIdByEmail(row.email);

  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId, {
      password: syncPassword,
      email_confirm: true,
      user_metadata: meta,
    });
    if (error) throw error;
    const { error: upsertErr } = await admin.from("User").upsert(
      {
        id: existingId,
        email: row.email,
        name: row.name,
        role: "ADMIN",
      },
      { onConflict: "id" }
    );
    if (upsertErr) throw upsertErr;
    console.log(`OK atualizado: ${row.email}`);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: row.email,
    password: syncPassword,
    email_confirm: true,
    user_metadata: meta,
  });

  if (error) throw error;
  const id = data.user?.id;
  if (!id) throw new Error(`Sem id apos criar ${row.email}`);

  const { error: upsertErr } = await admin.from("User").upsert(
    {
      id,
      email: row.email,
      name: row.name,
      role: "ADMIN",
    },
    { onConflict: "id" }
  );
  if (upsertErr) throw upsertErr;
  console.log(`OK criado: ${row.email}`);
}

async function smokeTestSignIn(email: string): Promise<void> {
  const anon = createClient(url, anonKey, {
    auth: { autoRefreshSession: false, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password: syncPassword,
  });
  if (error || !data.user) {
    throw new Error(`Smoke test login falhou para ${email}: ${error?.message}`);
  }
  const role = data.user.user_metadata?.role;
  if (role !== "ADMIN") {
    throw new Error(`Smoke test: role esperada ADMIN, obteve ${String(role)}`);
  }
  await anon.auth.signOut();
  console.log(`Smoke test OK: ${email} (signInWithPassword + metadata ADMIN)`);
}

async function main() {
  console.log("Sincronizando usuarios admin...");
  for (const row of admins) {
    await ensureAdmin(row);
  }
  console.log("\nTestando credenciais (API Auth)...");
  for (const row of admins) {
    await smokeTestSignIn(row.email);
  }
  console.log("\nConcluido. Senha usada (defina ADMIN_SYNC_PASSWORD no .env em producao):");
  console.log(syncPassword);
  console.log("\nAltere esta senha apos o primeiro login se desejar.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
