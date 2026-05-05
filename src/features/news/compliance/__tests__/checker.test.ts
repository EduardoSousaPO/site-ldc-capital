import { describe, expect, it } from "vitest";
import { runComplianceCheck, type ComplianceCheckInput } from "../checker";
import {
  cleanBriefings,
  cleanBriefing01,
  cleanBriefing09,
} from "../__fixtures__/clean-briefings";
import {
  violatingBloombergInBody,
  violatingBloombergInFonteDominio,
  violatingBloombergInFonteUrl,
  violatingMultipleAtOnce,
  violatingPhraseCapitalizedInTitle,
  violatingPhraseLowercase,
  violatingPromiseReturn,
  violatingTickerBrInBody,
  violatingTickerBrInTitle,
  violatingTickerUsInBody,
} from "../__fixtures__/violating-briefings";

const FIXED_NOW = new Date("2026-04-27T12:00:00.000Z");

function check(input: ComplianceCheckInput) {
  return runComplianceCheck(input, { now: FIXED_NOW });
}

describe("runComplianceCheck — F-005 / CA-015 (tickers BR)", () => {
  it("CA-015 — ticker_br_petr4: bloqueia PETR4 no body com line_number ≥ 1", () => {
    const result = check(violatingTickerBrInBody);

    expect(result.passed).toBe(false);
    const tickerViolations = result.violations.filter(
      (v) => v.type === "ticker_br",
    );
    expect(tickerViolations.length).toBeGreaterThanOrEqual(1);
    expect(tickerViolations[0]).toMatchObject({
      type: "ticker_br",
      match: "PETR4",
      field: "body",
      severity: "hard_block",
    });
    expect(tickerViolations[0]?.line_number).toBeGreaterThanOrEqual(1);
    expect(tickerViolations[0]?.message).toContain("§6.2");
  });

  it("CA-015 — ticker_br_em_titulo: bloqueia VALE3 no campo title", () => {
    const result = check(violatingTickerBrInTitle);

    expect(result.passed).toBe(false);
    const tickerViolations = result.violations.filter(
      (v) => v.type === "ticker_br" && v.field === "title",
    );
    expect(tickerViolations.length).toBeGreaterThanOrEqual(1);
    expect(tickerViolations[0]).toMatchObject({
      type: "ticker_br",
      match: "VALE3",
      field: "title",
      line_number: 0,
      severity: "hard_block",
    });
  });

  it("CA-015 (edge negativo) — vale_substantivo_nao_bate: 'Vale a pena observar' NÃO dispara ticker_br nem ticker_us (Anti-SPEC §6.2 não pode produzir falso-positivo)", () => {
    const result = check(cleanBriefing09);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);

    const briefingWithVale: ComplianceCheckInput = {
      ...cleanBriefing01,
      por_que_importa:
        "Vale a pena observar o setor de proteína animal com cautela neste trimestre.",
      body: `## Setor

Vale a pena observar como o ciclo de commodities responde ao cenário externo.`,
    };
    const result2 = check(briefingWithVale);
    expect(result2.passed).toBe(true);
    expect(result2.violations).toHaveLength(0);
  });
});

describe("runComplianceCheck — F-005 / CA-015 (tickers US)", () => {
  it("CA-015 — ticker_us_aapl: bloqueia AAPL no body", () => {
    const result = check(violatingTickerUsInBody);

    expect(result.passed).toBe(false);
    const usViolations = result.violations.filter((v) => v.type === "ticker_us");
    expect(usViolations.length).toBeGreaterThanOrEqual(1);
    expect(usViolations[0]).toMatchObject({
      type: "ticker_us",
      match: "AAPL",
      field: "body",
      severity: "hard_block",
    });
    expect(usViolations[0]?.line_number).toBeGreaterThanOrEqual(1);
  });
});

describe("runComplianceCheck — F-005 / CA-016 (frases prescritivas e promessas)", () => {
  it("CA-016 — frase_compre: bloqueia 'compre' lowercase no body", () => {
    const result = check(violatingPhraseLowercase);

    expect(result.passed).toBe(false);
    const phraseViolations = result.violations.filter(
      (v) => v.type === "phrase_prescriptive",
    );
    expect(phraseViolations.length).toBeGreaterThanOrEqual(1);
    expect(phraseViolations[0]).toMatchObject({
      type: "phrase_prescriptive",
      field: "body",
      severity: "hard_block",
    });
    expect(phraseViolations[0]?.match.toLowerCase()).toBe("compre");
  });

  it("CA-016 — frase_compre_capitalizada: regex é case-insensitive e bloqueia 'Compre' no title", () => {
    const result = check(violatingPhraseCapitalizedInTitle);

    expect(result.passed).toBe(false);
    const phraseViolations = result.violations.filter(
      (v) => v.type === "phrase_prescriptive" && v.field === "title",
    );
    expect(phraseViolations.length).toBeGreaterThanOrEqual(1);
    expect(phraseViolations[0]?.match).toMatch(/^Compre$/i);
    expect(phraseViolations[0]?.severity).toBe("hard_block");
  });

  it("CA-016 — promessa_15_porcento_garantido: bloqueia '15% garantido' como promise_return", () => {
    const result = check(violatingPromiseReturn);

    expect(result.passed).toBe(false);
    const promises = result.violations.filter((v) => v.type === "promise_return");
    expect(promises.length).toBeGreaterThanOrEqual(1);
    expect(promises[0]?.field).toBe("por_que_importa");
    expect(promises[0]?.match.toLowerCase()).toContain("15");
    expect(promises[0]?.match.toLowerCase()).toContain("garantido");
  });
});

describe("runComplianceCheck — F-005 / CA-014b (Bloomberg Anti-SPEC §6.2b)", () => {
  it("CA-014b — bloomberg_em_fontes_url: bloqueia URL bloomberg.com em fontes[].url com type=bloomberg_as_source", () => {
    const result = check(violatingBloombergInFonteUrl);

    expect(result.passed).toBe(false);
    const bbViolations = result.violations.filter(
      (v) => v.type === "bloomberg_as_source" && v.field === "fontes_url",
    );
    expect(bbViolations.length).toBeGreaterThanOrEqual(1);
    expect(bbViolations[0]?.match.toLowerCase()).toContain("bloomberg");
    expect(bbViolations[0]?.severity).toBe("hard_block");
    expect(bbViolations[0]?.message).toContain("§6.2b");
  });

  it("CA-014b — bloomberg_em_dominio: bloqueia 'bloomberg.com' em fontes[].dominio (Anti-SPEC §6.2b)", () => {
    const result = check(violatingBloombergInFonteDominio);

    expect(result.passed).toBe(false);
    const bbViolations = result.violations.filter(
      (v) => v.type === "bloomberg_as_source" && v.field === "fontes_dominio",
    );
    expect(bbViolations.length).toBeGreaterThanOrEqual(1);
    expect(bbViolations[0]?.match.toLowerCase()).toContain("bloomberg");
  });

  it("CA-014b — bloomberg_in_body: menção a 'Bloomberg' no body sem URL é bloqueada como bloomberg_in_body", () => {
    const result = check(violatingBloombergInBody);

    expect(result.passed).toBe(false);
    const bbViolations = result.violations.filter(
      (v) => v.type === "bloomberg_in_body" && v.field === "body",
    );
    expect(bbViolations.length).toBeGreaterThanOrEqual(1);
    expect(bbViolations[0]?.match.toLowerCase()).toBe("bloomberg");
    expect(bbViolations[0]?.line_number).toBeGreaterThanOrEqual(1);
  });
});

describe("runComplianceCheck — F-005 / qualidade global (clean batch + integration)", () => {
  it("edge — todos os 10 briefings limpos passam (passed=true, violations vazio)", () => {
    for (const briefing of cleanBriefings) {
      const result = check(briefing);
      if (!result.passed) {
        // Mensagem detalhada quando falha para facilitar debug
        throw new Error(
          `Briefing limpo "${briefing.title}" falhou: ${JSON.stringify(
            result.violations,
            null,
            2,
          )}`,
        );
      }
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    }
  });

  it("integration — briefing 100% violador acumula múltiplas violações sem parar na primeira (Anti-SPEC §6.2 + §6.2b)", () => {
    const result = check(violatingMultipleAtOnce);

    expect(result.passed).toBe(false);

    const types = new Set(result.violations.map((v) => v.type));
    expect(types.has("ticker_br")).toBe(true);
    expect(types.has("phrase_prescriptive")).toBe(true);
    expect(types.has("promise_return")).toBe(true);
    expect(types.has("bloomberg_as_source")).toBe(true);
    expect(types.has("bloomberg_in_body")).toBe(true);

    expect(result.violations.length).toBeGreaterThanOrEqual(5);
  });
});

describe("runComplianceCheck — F-005 / Anti-SPEC §6.3 (server-side puro, idempotente)", () => {
  it("§6.3 — função é idempotente: mesma entrada produz mesmo array de violações (CA-017)", () => {
    const a = check(violatingMultipleAtOnce);
    const b = check(violatingMultipleAtOnce);

    expect(a).toEqual(b);
    expect(a.violations).toEqual(b.violations);
    expect(a.checked_at).toEqual(b.checked_at);
  });

  it("§6.3 — line_number reflete a linha real do match no body markdown", () => {
    const input: ComplianceCheckInput = {
      ...violatingTickerBrInBody,
      body: `linha 1 sem violação\nlinha 2 sem violação\nlinha 3 com PETR4 aqui`,
    };

    const result = check(input);
    const tickerInBody = result.violations.find(
      (v) => v.type === "ticker_br" && v.field === "body",
    );

    expect(tickerInBody).toBeDefined();
    expect(tickerInBody?.line_number).toBe(3);
  });
});
