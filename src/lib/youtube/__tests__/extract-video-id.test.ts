import { describe, expect, it } from "vitest";
import { extractVideoId, isValidYouTubeInput } from "../extract-video-id";

const ID = "dTT71qfy5qQ"; // 11 chars, formato real

describe("extractVideoId — CA-001", () => {
  it("watch?v=ID com querystring extra", () => {
    expect(extractVideoId(`https://www.youtube.com/watch?v=${ID}&t=42s&list=PL`)).toBe(ID);
  });

  it("youtu.be/ID", () => {
    expect(extractVideoId(`https://youtu.be/${ID}`)).toBe(ID);
    expect(extractVideoId(`https://youtu.be/${ID}?si=abc`)).toBe(ID);
  });

  it("/shorts/ID", () => {
    expect(extractVideoId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
  });

  it("/embed/ID e /live/ID", () => {
    expect(extractVideoId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
    expect(extractVideoId(`https://www.youtube.com/live/${ID}`)).toBe(ID);
  });

  it("m.youtube.com (mobile)", () => {
    expect(extractVideoId(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it("youtube-nocookie.com/embed", () => {
    expect(extractVideoId(`https://www.youtube-nocookie.com/embed/${ID}`)).toBe(ID);
  });

  it("URL sem protocolo", () => {
    expect(extractVideoId(`youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it("ID cru de 11 chars", () => {
    expect(extractVideoId(ID)).toBe(ID);
    expect(extractVideoId(`  ${ID}  `)).toBe(ID);
  });

  it("retorna null para entradas inválidas", () => {
    expect(extractVideoId("")).toBeNull();
    expect(extractVideoId(null)).toBeNull();
    expect(extractVideoId(undefined)).toBeNull();
    expect(extractVideoId("https://vimeo.com/123456")).toBeNull();
    expect(extractVideoId("https://www.youtube.com/")).toBeNull();
    expect(extractVideoId("https://www.youtube.com/watch?v=tooshort")).toBeNull();
    expect(extractVideoId("not a url at all !!")).toBeNull();
  });

  it("isValidYouTubeInput reflete extractVideoId", () => {
    expect(isValidYouTubeInput(`https://youtu.be/${ID}`)).toBe(true);
    expect(isValidYouTubeInput("https://vimeo.com/1")).toBe(false);
  });
});
