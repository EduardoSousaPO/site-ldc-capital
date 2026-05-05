import { randomUUID } from "node:crypto";
import {
  PdfExtractionResult,
  type BloombergFormat,
} from "@/features/news/contracts/pipeline";
import { BLOOMBERG_METADATA_SECTIONS } from "@/features/news/constants/compliance-blacklist";
import { detectBloombergFormat } from "./format-detector";
import {
  extractPdfWithGemini,
  GeminiFallbackUnavailableError,
} from "./gemini-fallback";

const MIN_TEXT_LENGTH_THRESHOLD = 1000;

const TABLE_LINE_REGEX = /^[A-Z][A-Z0-9 ]+\s[+-]?\d+,\d+%?$/;

interface PdfJsLike {
  getDocument(options: { data: Uint8Array }): {
    promise: Promise<PdfDocumentLike>;
  };
}

interface PdfDocumentLike {
  numPages: number;
  getPage(n: number): Promise<PdfPageLike>;
}

interface PdfPageLike {
  getTextContent(): Promise<{ items: ReadonlyArray<{ str?: string; hasEOL?: boolean }> }>;
}

let cachedPdfJs: PdfJsLike | null = null;

async function loadPdfJs(): Promise<PdfJsLike> {
  if (cachedPdfJs) return cachedPdfJs;

  const globalAny = globalThis as Record<string, unknown>;
  if (typeof globalAny.DOMMatrix === "undefined") {
    globalAny.DOMMatrix = class DOMMatrix {
      multiply() {
        return this;
      }
      scale() {
        return this;
      }
      translate() {
        return this;
      }
    };
  }

  const mod = (await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  )) as unknown as PdfJsLike;
  cachedPdfJs = mod;
  return mod;
}

async function extractRawText(pdfBuffer: Buffer): Promise<string> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;

  let full = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    let pageText = "";
    for (const item of content.items) {
      const str = typeof item.str === "string" ? item.str : "";
      pageText += str;
      if (item.hasEOL) pageText += "\n";
      else pageText += " ";
    }
    full += pageText.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n");
    full += "\n";
  }
  return full;
}

interface FilterResult {
  cleaned: string;
  filtered_sections: string[];
}

function applyMetadataFilters(text: string): FilterResult {
  const filtered: string[] = [];
  let working = text;

  const TRUNCATING_HEADERS = new Set([
    "## O que estamos lendo",
    "## Mais conteúdo local",
    "## Empresas",
    "## Para acompanhar",
  ]);

  for (const marker of BLOOMBERG_METADATA_SECTIONS) {
    if (TRUNCATING_HEADERS.has(marker)) {
      const idx = working.indexOf(marker);
      if (idx !== -1) {
        working = working.slice(0, idx);
        filtered.push(marker);
      }
    } else {
      const before = working;
      const lineRegex = new RegExp(
        `^.*${escapeRegex(marker)}.*$`,
        "gmi",
      );
      working = working.replace(lineRegex, "");
      if (working.length !== before.length) filtered.push(marker);
    }
  }

  working = working
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "");

  return { cleaned: working, filtered_sections: filtered };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTableBlocks(text: string): {
  text_with_tables_marked: string;
  table_blocks: string[];
} {
  const lines = text.split(/\r?\n/);
  const blocks: string[] = [];
  const out: string[] = [];

  let buffer: string[] = [];
  const flushBuffer = () => {
    if (buffer.length >= 2) {
      const blockText = buffer.join("\n");
      blocks.push(blockText);
      out.push(`<table_data>\n${blockText}\n</table_data>`);
    } else {
      out.push(...buffer);
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (TABLE_LINE_REGEX.test(trimmed)) {
      buffer.push(trimmed);
    } else {
      if (buffer.length > 0) flushBuffer();
      out.push(line);
    }
  }
  if (buffer.length > 0) flushBuffer();

  return {
    text_with_tables_marked: out.join("\n"),
    table_blocks: blocks,
  };
}

export interface ExtractPdfOptions {
  /**
   * Force a specific pdf_id (idempotência em testes / reentries).
   * Default: randomUUID().
   */
  pdf_id?: string;
  /**
   * Override do extrator pdfjs (testes mockam para evitar I/O).
   * Quando ausente, usa `extractRawText` real.
   */
  pdfjsExtractor?: (buffer: Buffer) => Promise<string>;
  /**
   * Override do extrator Gemini (testes mockam para evitar custo).
   * Quando ausente, usa `extractPdfWithGemini` real.
   */
  geminiExtractor?: (buffer: Buffer) => Promise<string>;
}

/**
 * Extrai texto de PDF Bloomberg.
 *
 * Cobre RF-005, CA-009, CA-010, CA-010b, CB-015, CB-016.
 *
 * Fluxo (ADR-001 §"Atualização 2026-04-28" — Gemini virou caminho normal,
 * não fallback ocasional, porque PDFs Bloomberg do Eduardo chegam por email
 * em formato raster):
 *   1. Tenta extração via `pdfjs-dist` (rápida e zero custo quando o PDF tem
 *      texto pesquisável).
 *   2. Se o resultado for < 1000 caracteres, aciona Gemini 2.5 Pro multimodal
 *      passando o PDF inteiro. O system prompt do Gemini pede para preservar
 *      o cabeçalho exato ("Bloomberg Brazilian News", "Bloomberg First Word",
 *      etc.) para que `detectBloombergFormat` funcione no resultado FINAL.
 *   3. `detectBloombergFormat` roda no texto final (Gemini OU pdfjs).
 *   4. Filtros de metaconteúdo (`BLOOMBERG_METADATA_SECTIONS`) são aplicados.
 *   5. Tabelas de índices viram blocos `<table_data>` (CB-015).
 *
 * Anti-SPEC §6.2 / RNF-008: o texto retornado é tratado como
 * `<bloomberg_signal>` interno em todo o pipeline. NUNCA é citado como fonte
 * pública nem aparece em logs de erro (Anti-SPEC §6.3).
 *
 * Performance: pdfjs ~50-200ms; Gemini 5-15s/PDF. Pipeline-alvo <90s
 * suporta 5 PDFs Gemini em paralelo via `Promise.all` no orchestrator.
 *
 * Caller (orchestrator) trata `GeminiFallbackUnavailableError` decidindo
 * entre abortar a rodada ou prosseguir Perplexity-only conforme política.
 */
export async function extractPdf(
  pdfBuffer: Buffer,
  options: ExtractPdfOptions = {},
): Promise<PdfExtractionResult> {
  const pdf_id = options.pdf_id ?? randomUUID();
  const pdfjsExtractor = options.pdfjsExtractor ?? extractRawText;
  const geminiExtractor = options.geminiExtractor ?? extractPdfWithGemini;

  // pdfjs-dist é tentativa defensiva. PDFs Bloomberg via email são raster por
  // design (ADR-001 §"Atualização 2026-04-28") — Gemini é o caminho normal.
  // Em runtime Next 15.5+ dev, pdfjs-dist 5.x lança "Object.defineProperty
  // called on non-object" porque shims globais (DOMMatrix, Path2D, etc.) são
  // insuficientes. Try/catch evita derrubar o pipeline; threshold abaixo
  // dispara Gemini de qualquer forma quando o texto vier vazio ou curto.
  let workingText = "";
  try {
    workingText = await pdfjsExtractor(pdfBuffer);
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: "pdfjs_skipped",
        pdf_id,
        error_class:
          err instanceof Error ? err.constructor.name : typeof err,
        error_message: (err instanceof Error
          ? err.message
          : String(err)
        ).slice(0, 200),
      }),
    );
    workingText = "";
  }
  let used_gemini_fallback = false;

  if (workingText.length < MIN_TEXT_LENGTH_THRESHOLD) {
    workingText = await geminiExtractor(pdfBuffer);
    used_gemini_fallback = true;
  }

  const { format, auto_translated } = detectBloombergFormat(workingText);
  const { cleaned, filtered_sections } = applyMetadataFilters(workingText);
  const { text_with_tables_marked, table_blocks } = extractTableBlocks(cleaned);

  return PdfExtractionResult.parse({
    pdf_id,
    format,
    text_normalized: text_with_tables_marked,
    text_length: text_with_tables_marked.length,
    used_gemini_fallback,
    auto_translated,
    table_data_blocks: table_blocks,
    filtered_sections,
  });
}

/**
 * Sentinela exposto para os testes — confirma o threshold que dispara Gemini.
 * Não use em runtime; o threshold é interno ao `extractPdf`.
 */
export const PDF_TEXT_THRESHOLD_CHARS = MIN_TEXT_LENGTH_THRESHOLD;

export { GeminiFallbackUnavailableError };
export type { BloombergFormat };
