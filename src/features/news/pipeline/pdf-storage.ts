/**
 * Camada de leitura de PDFs Bloomberg para o pipeline.
 *
 * Em PRODUÇÃO (Vercel): lê de Supabase Storage (bucket privado `bloomberg-pdfs`)
 * via service role. Migrado de Vercel Blob na 2026-05-08 — Vercel Blob client
 * SDK tem bug de CORS no endpoint `vercel.com/api/blob/` para domínios custom
 * (vide migração `create_bloomberg_pdfs_storage_bucket` + commits da época).
 *
 * Em DEV LOCAL (sem `SUPABASE_SERVICE_ROLE_KEY`): cai para o filesystem,
 * lendo da pasta de fixtures
 * `src/features/news/pipeline/__tests__/__fixtures__/bloomberg-pdfs/`.
 * Decisão técnica aprovada pelo Eduardo: smoke test em dev usa fixtures
 * reais já versionadas (gitignored por padrão; ver `.gitignore` da pasta).
 *
 * Anti-SPEC §6.2b (sagrada): NÃO logar conteúdo de PDF Bloomberg. Apenas
 * IDs/filenames. Bucket `bloomberg-pdfs` é privado — só service role lê.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  getSupabaseStorageAdmin,
  BLOOMBERG_PDFS_BUCKET,
} from "@/lib/supabase-storage-admin";

export interface BloombergPdfRef {
  id: string;
  filename: string;
  buffer: Buffer;
  source: "supabase_storage" | "filesystem";
}

interface ListOptions {
  /** Limite de PDFs retornados (mais recentes primeiro). Default 5. */
  limit?: number;
}

const FIXTURES_DIR_REL = path.join(
  "src",
  "features",
  "news",
  "pipeline",
  "__tests__",
  "__fixtures__",
  "bloomberg-pdfs",
);

function storageConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

async function listFromFilesystem(limit: number): Promise<BloombergPdfRef[]> {
  const dir = path.join(process.cwd(), FIXTURES_DIR_REL);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const pdfFiles = entries.filter((e) => e.toLowerCase().endsWith(".pdf"));
  const stats = await Promise.all(
    pdfFiles.map(async (filename) => {
      const fp = path.join(dir, filename);
      const stat = await fs.stat(fp);
      return { filename, fp, mtimeMs: stat.mtimeMs };
    }),
  );
  stats.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const results: BloombergPdfRef[] = [];
  for (const { filename, fp } of stats.slice(0, limit)) {
    const buffer = await fs.readFile(fp);
    results.push({
      id: randomUUID(),
      filename,
      buffer,
      source: "filesystem",
    });
  }
  return results;
}

async function listFromSupabaseStorage(
  limit: number,
): Promise<BloombergPdfRef[]> {
  const supabase = getSupabaseStorageAdmin();
  const { data: files, error: listError } = await supabase.storage
    .from(BLOOMBERG_PDFS_BUCKET)
    .list("", {
      limit: Math.max(limit * 4, 20),
      sortBy: { column: "created_at", order: "desc" },
    });
  if (listError) throw listError;
  if (!files) return [];

  const pdfs = files.filter(
    (f) => f.name.toLowerCase().endsWith(".pdf") && !f.name.startsWith("."),
  );

  const out: BloombergPdfRef[] = [];
  for (const file of pdfs.slice(0, limit)) {
    const { data: blob, error: dlError } = await supabase.storage
      .from(BLOOMBERG_PDFS_BUCKET)
      .download(file.name);
    if (dlError || !blob) continue;
    const arrayBuffer = await blob.arrayBuffer();
    out.push({
      id: file.name,
      filename: file.name,
      buffer: Buffer.from(arrayBuffer),
      source: "supabase_storage",
    });
  }
  return out;
}

/**
 * Retorna os N PDFs Bloomberg mais recentes disponíveis. Em produção lê de
 * Supabase Storage; em dev local lê do filesystem (fixtures). Se nenhum PDF
 * estiver disponível em qualquer fonte, retorna lista vazia — caller decide
 * se aborta ou prossegue Perplexity-only (Anti-SPEC §6.3 / RNF-008 não tornam
 * PDFs obrigatórios).
 */
export async function listLatestBloombergPdfs(
  options: ListOptions = {},
): Promise<BloombergPdfRef[]> {
  const limit = options.limit ?? 5;
  if (storageConfigured()) {
    try {
      return await listFromSupabaseStorage(limit);
    } catch (err) {
      console.error(
        "[news/pipeline/pdf-storage] falha ao listar Supabase Storage, caindo no filesystem:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return listFromFilesystem(limit);
}

/**
 * Carrega um PDF específico por ID. Em produção, ID é o nome do arquivo no
 * bucket Supabase Storage; em dev local, ID é o filename na pasta de fixtures.
 */
export async function loadBloombergPdfById(
  id: string,
): Promise<BloombergPdfRef | null> {
  if (storageConfigured()) {
    try {
      const supabase = getSupabaseStorageAdmin();
      const { data: blob, error } = await supabase.storage
        .from(BLOOMBERG_PDFS_BUCKET)
        .download(id);
      if (!error && blob) {
        const arrayBuffer = await blob.arrayBuffer();
        return {
          id,
          filename: id,
          buffer: Buffer.from(arrayBuffer),
          source: "supabase_storage",
        };
      }
    } catch (err) {
      console.error(
        "[news/pipeline/pdf-storage] falha ao carregar do Supabase Storage:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  const dir = path.join(process.cwd(), FIXTURES_DIR_REL);
  const fp = path.join(dir, id);
  try {
    const buffer = await fs.readFile(fp);
    return { id, filename: id, buffer, source: "filesystem" };
  } catch {
    return null;
  }
}
