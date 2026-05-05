/**
 * Camada de leitura de PDFs Bloomberg para o pipeline.
 *
 * Em PRODUÇÃO (Vercel): lê de Vercel Blob via `BLOB_READ_WRITE_TOKEN`
 * (provisionado automaticamente). PDFs ficam em `bloomberg-pdfs/` com TTL
 * de 30 dias (RNF-008 + ADR-003 — auto-cleanup via cron separado em F-008).
 *
 * Em DEV LOCAL (sem `BLOB_READ_WRITE_TOKEN`): cai para o filesystem,
 * lendo da pasta de fixtures
 * `src/features/news/pipeline/__tests__/__fixtures__/bloomberg-pdfs/`.
 * Decisão técnica aprovada pelo Eduardo: smoke test em dev usa fixtures
 * reais já versionadas (gitignored por padrão; ver `.gitignore` da pasta).
 *
 * Anti-SPEC §6.2: NÃO logar conteúdo de PDF Bloomberg. Apenas IDs/filenames.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface BloombergPdfRef {
  id: string;
  filename: string;
  buffer: Buffer;
  source: "vercel_blob" | "filesystem";
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
const BLOB_PREFIX = "bloomberg-pdfs/";

function blobConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return typeof token === "string" && token.trim().length > 0;
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

async function listFromVercelBlob(limit: number): Promise<BloombergPdfRef[]> {
  const blob = await import("@vercel/blob");
  const { blobs } = await blob.list({ prefix: BLOB_PREFIX });
  const ordered = [...blobs].sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
  const out: BloombergPdfRef[] = [];
  for (const item of ordered.slice(0, limit)) {
    const res = await fetch(item.url);
    if (!res.ok) continue;
    const arrayBuffer = await res.arrayBuffer();
    out.push({
      id: randomUUID(),
      filename: item.pathname.replace(BLOB_PREFIX, ""),
      buffer: Buffer.from(arrayBuffer),
      source: "vercel_blob",
    });
  }
  return out;
}

/**
 * Retorna os N PDFs Bloomberg mais recentes disponíveis. Em produção lê de
 * Vercel Blob; em dev local lê do filesystem (fixtures). Se nenhum PDF estiver
 * disponível em qualquer fonte, retorna lista vazia — caller decide se aborta
 * ou prossegue Perplexity-only (Anti-SPEC §6.3 / RNF-008 não tornam PDFs
 * obrigatórios).
 */
export async function listLatestBloombergPdfs(
  options: ListOptions = {},
): Promise<BloombergPdfRef[]> {
  const limit = options.limit ?? 5;
  if (blobConfigured()) {
    try {
      return await listFromVercelBlob(limit);
    } catch (err) {
      console.error(
        "[news/pipeline/pdf-storage] falha ao listar Vercel Blob, caindo no filesystem:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return listFromFilesystem(limit);
}

/**
 * Carrega um PDF específico por ID. Em produção, ID é o pathname no Blob
 * (sem o prefixo); em dev local, ID é o filename na pasta de fixtures.
 */
export async function loadBloombergPdfById(
  id: string,
): Promise<BloombergPdfRef | null> {
  if (blobConfigured()) {
    try {
      const blob = await import("@vercel/blob");
      const url = `${BLOB_PREFIX}${id}`;
      const head = await blob.head(url).catch(() => null);
      if (head) {
        const res = await fetch(head.url);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          return {
            id,
            filename: id,
            buffer: Buffer.from(arrayBuffer),
            source: "vercel_blob",
          };
        }
      }
    } catch (err) {
      console.error(
        "[news/pipeline/pdf-storage] falha ao carregar do Vercel Blob:",
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
