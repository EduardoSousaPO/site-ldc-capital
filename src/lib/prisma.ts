import { PrismaClient, LogLevel } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    throw new Error("DATABASE_URL is not defined");
  }

  try {
    const url = new URL(rawUrl);

    // Supabase (e a maioria dos provedores gerenciados) exige TLS em produção.
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }

    // Otimizações para ambientes serverless (ex.: Vercel).
    if (process.env.NODE_ENV === "production") {
      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "1");
      }
      // Timeout mais agressivo para serverless
      if (!url.searchParams.has("connect_timeout")) {
        url.searchParams.set("connect_timeout", "10");
      }
      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "10");
      }
    }

    return url.toString();
  } catch (error) {
    console.error("Invalid DATABASE_URL:", rawUrl);
    throw error;
  }
}

const datasourceUrl = buildDatabaseUrl();

// Configuração otimizada para serverless
const prismaConfig = {
  datasources: {
    db: {
      url: datasourceUrl,
    },
  },
  log: process.env.NODE_ENV === "development" 
    ? (["query", "error", "warn"] as LogLevel[])
    : (["error"] as LogLevel[]),
  errorFormat: "minimal" as const,
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Função utilitária para executar operações com retry
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Log do erro para debugging
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      // Se é o último attempt, não espera
      if (attempt === maxRetries) {
        break;
      }
      
      // Espera antes de tentar novamente (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}

// Função para garantir conexão antes de operações críticas
export async function ensurePrismaConnection(): Promise<void> {
  try {
    await prisma.$connect();
    // Teste simples de conectividade
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Failed to ensure Prisma connection:", error);
    throw error;
  }
}












