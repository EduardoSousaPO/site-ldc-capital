/**
 * F-019 v2.2 — Template ÚNICO mock-tweet do X.com (1080×1350).
 *
 * Substitui os 4 templates editoriais v1.0 (SlideHook/Content/Question/CTA).
 * Renderiza qualquer tipo de slide parametrizado por `variation` + `imageDataUrl`.
 *
 * Calibração visual (refs Andrey Nousi / Renato Breia):
 *   - Background: #0F1419 (X.com dark theme nativo)
 *   - Padding 80px lados, 60px topo/base
 *   - Header X.com: badge "X.com" top-right, avatar 56px circular top-left
 *     (LDC com backdrop #1A2332 atrás; Luciano sem backdrop)
 *   - Nome: PublicSans Bold 28px #FFFFFF + ✓ verificado azul (#1D9BF0) inline 22px
 *   - Handle: PublicSans Regular 22px #71767B
 *   - Body: PublicSans 34px line-height 1.55 #FFFFFF, suporte a **bold**
 *     via parser inline simples (split em **xxx**)
 *   - Imagem hero (opcional): 920×520 (16:9) com border-radius 16px,
 *     margin-top 32px após body
 *
 * SEM numeração X/N (decisão briefing — Andrey/Breia não usam).
 */

import * as React from "react";
import type { CarouselVariation } from "@/features/news/contracts/carousel";

interface SlideTweetProps {
  body: string; // suporta **bold** inline
  variation: CarouselVariation;
  avatarDataUrl: string;
  imageDataUrl?: string | null;
}

const VARIATION_HEADERS: Record<
  CarouselVariation,
  {
    displayName: string;
    handle: string;
    avatarBackdropColor: string | null;
  }
> = {
  ldc: {
    displayName: "LDC Capital",
    handle: "@ldc.capital",
    avatarBackdropColor: "#1A2332", // ~15% mais claro que bg #0F1419
  },
  luciano: {
    displayName: "Luciano Herzog",
    handle: "@luciano.herzog",
    avatarBackdropColor: null, // foto tem bg próprio
  },
};

/** Parser para **bold** inline.
 *
 *  Estratégia: tokeniza por palavra preservando espaços (Satori com
 *  flex-wrap colapsa whitespace de borda entre spans, criando "deSelic"
 *  e "vantagemoucusto"). Cada token vira um span com fontWeight próprio,
 *  com espaços dentro do span ou como tokens próprios.
 *
 *  Para palavras dentro de **...**: emite spans com fontWeight 700.
 *  Para palavras fora: emite spans fontWeight 400.
 *  Whitespace entre tokens vai num span próprio (preserva o spacing).
 */
function parseBodyWithBold(body: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let key = 0;

  // Primeiro: identifica os ranges em bold (entre **...**)
  const boldRanges: Array<{ start: number; end: number }> = [];
  const re = /\*\*([^*]+)\*\*/g;
  let match;
  while ((match = re.exec(body)) !== null) {
    boldRanges.push({ start: match.index, end: match.index + match[0].length });
  }

  // Constrói uma string "limpa" sem os marcadores ** e mapeia bold por offset
  let cleanText = "";
  const cleanBoldRanges: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  for (const r of boldRanges) {
    cleanText += body.slice(cursor, r.start);
    const start = cleanText.length;
    cleanText += body.slice(r.start + 2, r.end - 2);
    cleanBoldRanges.push({ start, end: cleanText.length });
    cursor = r.end;
  }
  cleanText += body.slice(cursor);

  function isBoldAt(idx: number): boolean {
    return cleanBoldRanges.some((r) => idx >= r.start && idx < r.end);
  }

  // Split em tokens: sequências de não-whitespace + sequências de whitespace.
  // Cada token sai num span próprio com fontWeight do seu primeiro char.
  const tokenRe = /(\s+|\S+)/g;
  let tIdx = 0;
  while ((match = tokenRe.exec(cleanText)) !== null) {
    const tok = match[0];
    const tokStart = match.index;
    const isBold = isBoldAt(tokStart);
    out.push(
      <span
        key={key++}
        style={{ fontWeight: isBold ? 700 : 400, whiteSpace: "pre" }}
      >
        {tok}
      </span>,
    );
    tIdx++;
  }
  void tIdx;

  return out;
}

/** Quebra body em parágrafos por linha em branco (\\n\\n). */
function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** SVG inline do checkmark verificado X.com (cor #1D9BF0). 22×22. */
function VerifiedBadge() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      style={{ display: "block" }}
    >
      <path
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
        fill="#1D9BF0"
      />
    </svg>
  );
}

export function SlideTweet({
  body,
  variation,
  avatarDataUrl,
  imageDataUrl,
}: SlideTweetProps) {
  const header = VARIATION_HEADERS[variation];
  const paragraphs = splitParagraphs(body);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0F1419",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        padding: "60px 80px",
        fontFamily: "PublicSans",
      }}
    >
      {/* Topo: avatar + nome+handle à esquerda; badge "X.com" à direita */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          {/* Avatar com backdrop opcional (apenas LDC) */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: header.avatarBackdropColor ?? "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              marginRight: 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarDataUrl}
              alt={header.displayName}
              width={56}
              height={56}
              style={{ width: 56, height: 56, objectFit: "cover" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "PublicSans",
                  fontWeight: 700,
                  fontSize: 28,
                  color: "#FFFFFF",
                  marginRight: 8,
                }}
              >
                {header.displayName}
              </span>
              <VerifiedBadge />
            </div>
            <span
              style={{
                fontFamily: "PublicSans",
                fontWeight: 400,
                fontSize: 22,
                color: "#71767B",
                marginTop: 4,
              }}
            >
              {header.handle}
            </span>
          </div>
        </div>

        <span
          style={{
            fontFamily: "PublicSans",
            fontWeight: 700,
            fontSize: 26,
            color: "#FFFFFF",
          }}
        >
          X.com
        </span>
      </div>

      {/* Body do tweet */}
      <div
        style={{
          marginTop: 32,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {paragraphs.map((p, i) => (
          <div
            key={i}
            style={{
              fontFamily: "PublicSans",
              fontWeight: 400,
              fontSize: 34,
              lineHeight: 1.55,
              color: "#FFFFFF",
              marginTop: i === 0 ? 0 : 24,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {parseBodyWithBold(p)}
          </div>
        ))}
      </div>

      {/* Imagem hero opcional (slides 1, 3, 6) */}
      {imageDataUrl ? (
        <div
          style={{
            marginTop: 32,
            width: 920,
            height: 520,
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageDataUrl}
            alt=""
            width={920}
            height={520}
            style={{ width: 920, height: 520, objectFit: "cover" }}
          />
        </div>
      ) : null}

      {/* Espaço inferior — não usamos numeração; deixa respiro */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
