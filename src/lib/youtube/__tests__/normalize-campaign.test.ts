import { describe, expect, it } from "vitest";
import {
  OFFICIAL_CAMPAIGN_SLUGS,
  isOfficialSlug,
  normalizeCampaignSlug,
} from "../normalize-campaign";

describe("normalizeCampaignSlug — CA-002", () => {
  it("lowercase + espaço → hífen", () => {
    expect(normalizeCampaignSlug("Renda Fixa Credito")).toBe("renda-fixa-credito");
  });

  it("remove acentos", () => {
    expect(normalizeCampaignSlug("Política Macro BR")).toBe("politica-macro-br");
    expect(normalizeCampaignSlug("Geopolítica Global")).toBe("geopolitica-global");
  });

  it("underscore → hífen e colapsa repetidos", () => {
    expect(normalizeCampaignSlug("etfs__portfolio")).toBe("etfs-portfolio");
    expect(normalizeCampaignSlug("holding   patrimonial")).toBe("holding-patrimonial");
  });

  it("apara hífens nas pontas e remove chars inválidos", () => {
    expect(normalizeCampaignSlug("  -Commodities & Ativos!- ")).toBe("commodities-ativos");
  });

  it("entradas vazias/nulas → string vazia", () => {
    expect(normalizeCampaignSlug("")).toBe("");
    expect(normalizeCampaignSlug(null)).toBe("");
    expect(normalizeCampaignSlug(undefined)).toBe("");
  });

  it("idempotente sobre slug já normalizado", () => {
    for (const slug of OFFICIAL_CAMPAIGN_SLUGS) {
      expect(normalizeCampaignSlug(slug)).toBe(slug);
    }
  });
});

describe("isOfficialSlug", () => {
  it("reconhece os 6 oficiais (inclusive a partir de texto livre)", () => {
    expect(isOfficialSlug("renda-fixa-credito")).toBe(true);
    expect(isOfficialSlug("Política Macro BR")).toBe(true);
  });

  it("rejeita slugs fora da lista", () => {
    expect(isOfficialSlug("campanha-aleatoria")).toBe(false);
    expect(isOfficialSlug("")).toBe(false);
  });
});
