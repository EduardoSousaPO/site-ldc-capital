import { describe, expect, it } from "vitest";
import { parseDurationToSeconds } from "../youtube-api";

describe("parseDurationToSeconds (ISO-8601)", () => {
  it("PT5M30S → 330", () => {
    expect(parseDurationToSeconds("PT5M30S")).toBe(330);
  });

  it("PT1H2M3S → 3723", () => {
    expect(parseDurationToSeconds("PT1H2M3S")).toBe(3723);
  });

  it("PT45S → 45 (shorts)", () => {
    expect(parseDurationToSeconds("PT45S")).toBe(45);
  });

  it("P1DT2H → 93600", () => {
    expect(parseDurationToSeconds("P1DT2H")).toBe(93600);
  });

  it("inválido/ausente → null", () => {
    expect(parseDurationToSeconds(null)).toBeNull();
    expect(parseDurationToSeconds(undefined)).toBeNull();
    expect(parseDurationToSeconds("5 minutos")).toBeNull();
  });
});
