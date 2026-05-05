/**
 * Extração Gemini 2.5 Flash multimodal de PDFs Bloomberg.
 *
 * Cobre RF-005, CA-010. Acionado pelo `extractPdf` do orchestrator quando
 * `pdfjs-dist` retorna < 1000 caracteres pós-filtro — cenário NORMAL para
 * PDFs Bloomberg que chegam por email em formato raster (ADR-001
 * §"Atualização 2026-04-28").
 *
 * **Modelo**: `gemini-2.5-flash` por padrão. Decidido pragmaticamente: o
 * free tier de `gemini-2.5-pro` retornou `limit: 0` na conta atual, enquanto
 * `gemini-2.5-flash` tem free tier de 1500 RPD — suficiente para o volume
 * /news (~10 PDFs/dia × 2 turnos = 20 RPD). Override possível via env
 * `GOOGLE_GEMINI_MODEL` se Eduardo precisar voltar para Pro futuramente.
 *
 * **Custo aproximado**: cada chamada processa 3-4 páginas multimodal —
 * ordem de R$ 0,01-0,05 por PDF no Flash. Hard fail se
 * `GOOGLE_GEMINI_API_KEY` ausente: caller (orchestrator) decide entre
 * abortar a rodada ou prosseguir Perplexity-only conforme política.
 *
 * **Performance**: 5-15s por PDF (Flash é ~2x mais rápido que Pro).
 *
 * Anti-SPEC §6.2 / RNF-008: o conteúdo retornado é tratado como
 * `<bloomberg_signal>` interno, NUNCA como fonte pública citável. Logs
 * NÃO incluem o corpo do PDF nem o texto retornado pelo Gemini.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

function resolveModel(): string {
  const envModel = process.env.GOOGLE_GEMINI_MODEL;
  if (envModel && envModel.trim().length > 0) return envModel.trim();
  return DEFAULT_GEMINI_MODEL;
}
const GEMINI_PROMPT = [
  "Extraia o texto integral deste PDF Bloomberg em PT-BR.",
  "REGRAS OBRIGATÓRIAS:",
  "1) PRESERVE LITERALMENTE a primeira linha do PDF (ex.: 'Bloomberg Brazilian News',",
  "   'Bloomberg First Word', 'Bloomberg News', 'Associated Press') — ela é usada",
  "   por código downstream para detectar o formato. Não reescreva, não traduza.",
  "2) Se o PDF tiver o aviso 'Traduzido por máquina de Inglês para Português',",
  "   inclua essa frase exata nas primeiras 10 linhas do texto extraído.",
  "3) Preserve cabeçalhos de seção que começam com '## ' (ex.: '## O que estamos lendo',",
  "   '## Empresas', '## Para acompanhar') — também são consumidos por filtros.",
  "4) Tabelas de índices/cotações (ex.: 'IBOVESPA -0,5%', 'S&P 500 +0,3%') devem",
  "   aparecer como linhas separadas, uma por instrumento, sem agrupar em parágrafo.",
  "5) NÃO resuma, NÃO traduza, NÃO interprete — devolva o texto bruto extraído.",
  "6) NÃO inclua delimitadores markdown como ```text — apenas o texto puro.",
].join(" ");

export class GeminiFallbackUnavailableError extends Error {
  readonly code = "GEMINI_FALLBACK_UNAVAILABLE" as const;
  constructor(message: string) {
    super(message);
    this.name = "GeminiFallbackUnavailableError";
  }
}

const TRANSIENT_STATUS_CODES = [429, 500, 502, 503, 504];
const RETRY_BACKOFF_MS = 4000;

function isTransientGeminiError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return TRANSIENT_STATUS_CODES.some((code) => err.message.includes(`[${code} `));
}

export async function extractPdfWithGemini(pdfBuffer: Buffer): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new GeminiFallbackUnavailableError(
      "GOOGLE_GEMINI_API_KEY ausente — fallback Gemini desabilitado. Configure a env var ou ajuste o pipeline para prosseguir sem este PDF.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: resolveModel() });
  const base64Pdf = pdfBuffer.toString("base64");

  const callOnce = async (): Promise<string> => {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Pdf,
        },
      },
      { text: GEMINI_PROMPT },
    ]);
    const text = result.response.text();
    if (!text || text.trim().length === 0) {
      throw new Error("Gemini retornou texto vazio para o PDF.");
    }
    return text;
  };

  try {
    return await callOnce();
  } catch (err) {
    if (!isTransientGeminiError(err)) throw err;
    await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
    return callOnce();
  }
}

export const GEMINI_FALLBACK_DEFAULT_MODEL = DEFAULT_GEMINI_MODEL;
