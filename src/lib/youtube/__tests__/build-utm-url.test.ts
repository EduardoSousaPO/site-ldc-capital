import { describe, expect, it } from "vitest";
import { DEFAULT_UTM_BASE, buildUtmUrl } from "../build-utm-url";

const ID = "dTT71qfy5qQ";

describe("buildUtmUrl — CA-003", () => {
  it("monta URL canônica com defaults youtube/video", () => {
    const url = buildUtmUrl({ videoId: ID, campaign: "renda-fixa-credito" });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(DEFAULT_UTM_BASE);
    expect(parsed.searchParams.get("utm_source")).toBe("youtube");
    expect(parsed.searchParams.get("utm_medium")).toBe("video");
    expect(parsed.searchParams.get("utm_campaign")).toBe("renda-fixa-credito");
    expect(parsed.searchParams.get("utm_content")).toBe(ID);
    expect(parsed.searchParams.has("utm_term")).toBe(false);
  });

  it("normaliza a campanha ao montar a URL", () => {
    const url = buildUtmUrl({ videoId: ID, campaign: "Política Macro BR" });
    expect(new URL(url).searchParams.get("utm_campaign")).toBe("politica-macro-br");
  });

  it("inclui utm_term quando fornecido (e ignora vazio)", () => {
    const withTerm = buildUtmUrl({ videoId: ID, campaign: "etfs-portfolio", term: "abertura mercado" });
    expect(new URL(withTerm).searchParams.get("utm_term")).toBe("abertura mercado");

    const blankTerm = buildUtmUrl({ videoId: ID, campaign: "etfs-portfolio", term: "   " });
    expect(new URL(blankTerm).searchParams.has("utm_term")).toBe(false);
  });

  it("respeita base/source/medium customizados", () => {
    const url = buildUtmUrl({
      videoId: ID,
      campaign: "etfs-portfolio",
      base: "https://www.ldccapital.com.br/",
      source: "youtube",
      medium: "cpc",
    });
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/");
    expect(parsed.searchParams.get("utm_medium")).toBe("cpc");
  });

  it("ordem estável dos parâmetros (source, medium, campaign, content)", () => {
    const url = buildUtmUrl({ videoId: ID, campaign: "etfs-portfolio" });
    const query = url.split("?")[1];
    expect(query.startsWith("utm_source=youtube&utm_medium=video&utm_campaign=etfs-portfolio&utm_content=")).toBe(true);
  });
});
