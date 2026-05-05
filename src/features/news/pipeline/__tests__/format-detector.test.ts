import { describe, expect, it } from "vitest";
import { detectBloombergFormat } from "../format-detector";

describe("detectBloombergFormat", () => {
  it("detect_pbn — primeira linha 'Bloomberg Brazilian News' → PBN (CA-010b)", () => {
    const text = "Bloomberg Brazilian News (in Portuguese)\n04/27/2026 08:44:16\nResto do briefing...";
    expect(detectBloombergFormat(text).format).toBe("PBN");
  });

  it("detect_bfw — primeira linha 'Bloomberg First Word' → BFW (CA-010b)", () => {
    const text = "Bloomberg First Word\n04/27/2026 07:33:24\nMercado Hoje...";
    expect(detectBloombergFormat(text).format).toBe("BFW");
  });

  it("detect_bn — primeira linha 'Bloomberg News' (sem outros) → BN (CA-010b)", () => {
    const text = "Bloomberg News\nTraduzido por máquina...\nNotícia internacional";
    expect(detectBloombergFormat(text).format).toBe("BN");
  });

  it("detect_apw — primeira linha 'Associated Press' → APW (CA-010b)", () => {
    const text = "Associated Press\n04/27/2026\nÚltimas notícias...";
    expect(detectBloombergFormat(text).format).toBe("APW");
  });

  it("unknown_fallback — header desconhecido → UNKNOWN", () => {
    const text = "Reuters Daily Brief\nAlgum conteúdo qualquer";
    expect(detectBloombergFormat(text).format).toBe("UNKNOWN");
  });

  it("priority_match — 'Bloomberg Brazilian News' tem prioridade sobre 'Bloomberg News'", () => {
    // longest-match-first impede colisão
    const text = "Bloomberg Brazilian News\nConteúdo PBN";
    expect(detectBloombergFormat(text).format).toBe("PBN");
  });

  it("auto_translated_detection — header 'Traduzido por máquina' (CB-016)", () => {
    const text = "Bloomberg News\nTraduzido por máquina de Inglês para Português\nNotícia...";
    const result = detectBloombergFormat(text);
    expect(result.format).toBe("BN");
    expect(result.auto_translated).toBe(true);
  });

  it("auto_translated_false — sem header de tradução", () => {
    const text = "Bloomberg Brazilian News\nConteúdo em PT original";
    expect(detectBloombergFormat(text).auto_translated).toBe(false);
  });
});
