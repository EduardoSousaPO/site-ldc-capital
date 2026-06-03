import { describe, expect, it } from "vitest";
import {
  aggregateLeadsByCampaign,
  aggregateLeadsByDay,
  aggregateLeadsBySource,
  countLeadsInWindow,
  ensureUtcIso,
  leadsForVideo,
  summarizeLeads,
  type LeadRow,
} from "../aggregate-leads";

const REF = new Date("2026-06-02T12:00:00.000Z");

function lead(partial: Partial<LeadRow>): LeadRow {
  return {
    createdAt: "2026-06-02T10:00:00.000Z",
    utm_campaign: null,
    utm_source: null,
    utm_content: null,
    ...partial,
  };
}

const rows: LeadRow[] = [
  lead({ createdAt: "2026-06-02T09:00:00Z", utm_campaign: "etfs-portfolio", utm_source: "youtube", utm_content: "AAAAAAAAAAA" }),
  lead({ createdAt: "2026-06-01T09:00:00Z", utm_campaign: "etfs-portfolio", utm_source: "youtube", utm_content: "AAAAAAAAAAA" }),
  lead({ createdAt: "2026-05-20T09:00:00Z", utm_campaign: "renda-fixa-credito", utm_source: "google", utm_content: "BBBBBBBBBBB" }),
  lead({ createdAt: "2026-04-01T09:00:00Z", utm_campaign: null, utm_source: null, utm_content: null }),
];

describe("aggregateLeadsByCampaign — CA-004", () => {
  it("agrupa e ordena desc, null vira rótulo", () => {
    expect(aggregateLeadsByCampaign(rows)).toEqual([
      { key: "etfs-portfolio", count: 2 },
      { key: "(sem campanha)", count: 1 },
      { key: "renda-fixa-credito", count: 1 },
    ]);
  });
});

describe("aggregateLeadsBySource — CA-004", () => {
  it("agrupa por source com fallback (direto)", () => {
    expect(aggregateLeadsBySource(rows)).toEqual([
      { key: "youtube", count: 2 },
      { key: "(direto)", count: 1 },
      { key: "google", count: 1 },
    ]);
  });
});

describe("aggregateLeadsByDay — CA-004", () => {
  it("preenche o range com zeros e conta o dia certo", () => {
    const series = aggregateLeadsByDay(rows, 7, REF);
    expect(series).toHaveLength(7);
    expect(series[series.length - 1]).toEqual({ date: "2026-06-02", count: 1 });
    expect(series.find((d) => d.date === "2026-06-01")).toEqual({ date: "2026-06-01", count: 1 });
    expect(series.find((d) => d.date === "2026-05-30")).toEqual({ date: "2026-05-30", count: 0 });
    // 2026-05-20 está fora da janela de 7 dias (não aparece na série)
    expect(series.find((d) => d.date === "2026-05-20")).toBeUndefined();
  });
});

describe("countLeadsInWindow — CA-004", () => {
  it("7d conta 2; 30d conta 3; all (365) conta 4", () => {
    expect(countLeadsInWindow(rows, 7, REF)).toBe(2);
    expect(countLeadsInWindow(rows, 30, REF)).toBe(3);
    expect(countLeadsInWindow(rows, 365, REF)).toBe(4);
  });
});

describe("summarizeLeads — CA-004", () => {
  it("total, withUtm, share% e topCampaigns", () => {
    const summary = summarizeLeads(rows, 3);
    expect(summary.total).toBe(4);
    expect(summary.withUtm).toBe(3);
    expect(summary.sharePct).toBe(75);
    expect(summary.topCampaigns[0]).toEqual({ key: "etfs-portfolio", count: 2 });
  });

  it("não divide por zero em lista vazia", () => {
    expect(summarizeLeads([])).toEqual({ total: 0, withUtm: 0, sharePct: 0, topCampaigns: [] });
  });
});

describe("ensureUtcIso — fuso de timestamp naive (Client.createdAt)", () => {
  it("anexa Z a timestamp sem timezone", () => {
    expect(ensureUtcIso("2026-06-03T00:18:00")).toBe("2026-06-03T00:18:00Z");
    expect(ensureUtcIso("2026-06-03 00:18:00")).toBe("2026-06-03T00:18:00Z");
  });
  it("preserva timestamp que já tem timezone", () => {
    expect(ensureUtcIso("2026-06-03T00:18:00Z")).toBe("2026-06-03T00:18:00Z");
    expect(ensureUtcIso("2026-06-03T00:18:00+00:00")).toBe("2026-06-03T00:18:00+00:00");
  });
  it("timestamp UTC naive próximo do ref conta na janela (não vira futuro)", () => {
    // lead naive UTC 2026-06-02T10:00:00 vs ref UTC 2026-06-02T12:00 → diff 0
    const rowsNaive: LeadRow[] = [
      { createdAt: "2026-06-02T10:00:00", utm_campaign: "x", utm_source: "y", utm_content: "z" },
    ];
    expect(countLeadsInWindow(rowsNaive, 7, REF)).toBe(1);
  });
});

describe("leadsForVideo — CA-004", () => {
  it("filtra por utm_content = videoId", () => {
    expect(leadsForVideo(rows, "AAAAAAAAAAA")).toHaveLength(2);
    expect(leadsForVideo(rows, "ZZZZZZZZZZZ")).toHaveLength(0);
  });
});
