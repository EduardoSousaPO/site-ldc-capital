import { describe, expect, it } from "vitest";
import { parseClientNotes } from "../parse-client-notes";

describe("parseClientNotes — CA-009", () => {
  it("formato padrão completo", () => {
    const notes = "Patrimônio: R$ 1-5 milhões | Origem: YouTube | IP: 200.1.2.3";
    expect(parseClientNotes(notes)).toEqual({
      patrimonio: "R$ 1-5 milhões",
      origem: "YouTube",
      ip: "200.1.2.3",
    });
  });

  it("tolera subset e ordem diferente", () => {
    expect(parseClientNotes("Origem: Instagram")).toEqual({ origem: "Instagram" });
    expect(parseClientNotes("IP: 1.1.1.1 | Patrimônio: N/I")).toEqual({
      ip: "1.1.1.1",
      patrimonio: "N/I",
    });
  });

  it("ignora acento e caixa no rótulo", () => {
    expect(parseClientNotes("patrimonio: 300k | origem: Google")).toEqual({
      patrimonio: "300k",
      origem: "Google",
    });
  });

  it("entradas vazias/nulas → objeto vazio", () => {
    expect(parseClientNotes(null)).toEqual({});
    expect(parseClientNotes("")).toEqual({});
    expect(parseClientNotes("texto sem rótulos")).toEqual({});
  });

  it("ignora segmentos com valor vazio", () => {
    expect(parseClientNotes("Patrimônio:  | Origem: YouTube")).toEqual({ origem: "YouTube" });
  });
});
