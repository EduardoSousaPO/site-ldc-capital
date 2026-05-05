import { describe, expect, it } from "vitest";
import { extractPdf } from "../extractor";

const PBN_TEXT_LONG = [
  "Bloomberg Brazilian News (in Portuguese)",
  "04/27/2026 08:44:16",
  "Cinco assuntos quentes para o Brasil hoje",
  "Por Fernando Travaglini, Vanessa Dezem e Raphael Almeida",
  "(Bloomberg) -- Os mercados globais iniciam a semana próximos de máximas históricas, sustentados por...",
  "...prosa longa o suficiente para passar do threshold de 1000 caracteres pós-filtro...".repeat(20),
  "## O que estamos lendo",
  "Conteúdo para descartar — links e leituras paralelas que não vão para o briefing.",
  "Inscreva-se na nossa newsletter",
].join("\n");

const BFW_WITH_TABLE = [
  "Bloomberg First Word",
  "04/27/2026 07:33:24",
  "Bolsas rondam recordes",
  "Conteúdo principal do briefing com prosa, dados e contexto. ".repeat(40),
  "IBOVESPA -0,5%",
  "S P 500 +0,3%",
  "DOLAR +1,2%",
  "Mais conteúdo em prosa.",
].join("\n");

const SHORT_RASTER_TEXT = "Bloomberg News\n-- 1 of 3 --";

describe("extractPdf", () => {
  it("extract_pbn_text_pdfjs_no_gemini — pdfjs com texto suficiente NÃO aciona Gemini", async () => {
    const buffer = Buffer.from("dummy");
    const result = await extractPdf(buffer, {
      pdf_id: "00000000-0000-4000-8000-000000000001",
      pdfjsExtractor: async () => PBN_TEXT_LONG,
      geminiExtractor: async () => {
        throw new Error("Gemini NÃO deveria ser chamado");
      },
    });
    expect(result.format).toBe("PBN");
    expect(result.used_gemini_fallback).toBe(false);
    expect(result.text_length).toBeGreaterThanOrEqual(1000);
  });

  it("extract_aciona_gemini_se_curto — pdfjs<1000 chars chama Gemini (CA-010)", async () => {
    const buffer = Buffer.from("dummy");
    let geminiCalled = false;
    const result = await extractPdf(buffer, {
      pdf_id: "00000000-0000-4000-8000-000000000002",
      pdfjsExtractor: async () => SHORT_RASTER_TEXT,
      geminiExtractor: async () => {
        geminiCalled = true;
        return BFW_WITH_TABLE;
      },
    });
    expect(geminiCalled).toBe(true);
    expect(result.used_gemini_fallback).toBe(true);
    expect(result.format).toBe("BFW");
  });

  it("filtros_removem_metaconteudo — '## O que estamos lendo' trunca (CA-009)", async () => {
    const buffer = Buffer.from("dummy");
    const result = await extractPdf(buffer, {
      pdf_id: "00000000-0000-4000-8000-000000000003",
      pdfjsExtractor: async () => PBN_TEXT_LONG,
    });
    expect(result.filtered_sections).toContain("## O que estamos lendo");
    expect(result.text_normalized).not.toContain("Conteúdo para descartar");
    expect(result.text_normalized).not.toContain("Inscreva-se na nossa newsletter");
  });

  it("auto_translated_flagged — header de tradução marca flag (CB-016)", async () => {
    const buffer = Buffer.from("dummy");
    const longTranslatedText = [
      "Bloomberg News",
      "Traduzido por máquina de Inglês para Português",
      "Conteúdo internacional. ".repeat(80),
    ].join("\n");
    const result = await extractPdf(buffer, {
      pdf_id: "00000000-0000-4000-8000-000000000004",
      pdfjsExtractor: async () => longTranslatedText,
    });
    expect(result.format).toBe("BN");
    expect(result.auto_translated).toBe(true);
  });

  it("table_data_blocks_capturam_indices_consecutivos (CB-015)", async () => {
    const buffer = Buffer.from("dummy");
    const result = await extractPdf(buffer, {
      pdf_id: "00000000-0000-4000-8000-000000000005",
      pdfjsExtractor: async () => BFW_WITH_TABLE,
    });
    expect(result.table_data_blocks.length).toBeGreaterThan(0);
    expect(result.text_normalized).toContain("<table_data>");
  });

  it("F-015b Bug #1: pdfjs throw genérico não propaga; Gemini fallback assume", async () => {
    const buffer = Buffer.from("dummy");
    let geminiCalled = false;
    const result = await extractPdf(buffer, {
      pdf_id: "00000000-0000-4000-8000-0000000000aa",
      pdfjsExtractor: async () => {
        // Simula o erro real de runtime "Object.defineProperty called on
        // non-object" observado no smoke F-015 (pdfjs-dist 5.x em Next 15 dev).
        throw new TypeError("Object.defineProperty called on non-object");
      },
      geminiExtractor: async () => {
        geminiCalled = true;
        return BFW_WITH_TABLE;
      },
    });
    expect(geminiCalled).toBe(true);
    expect(result.used_gemini_fallback).toBe(true);
    expect(result.format).toBe("BFW");
  });
});
