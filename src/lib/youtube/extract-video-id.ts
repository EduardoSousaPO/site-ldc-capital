// Extrai o videoId de qualquer formato de URL do YouTube (ou de um ID cru).
// Suporta: watch?v=, youtu.be/, /shorts/, /embed/, m.youtube.com, live/,
// com querystrings extras. Retorna null se nada plausível for encontrado.
//
// Pure function — sem efeitos colaterais. Coberta por testes (CA-001).

// IDs do YouTube têm 11 chars no alfabeto base64url ([A-Za-z0-9_-]).
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const PATH_PREFIXES = ["shorts", "embed", "live", "v"] as const;

/**
 * Extrai o videoId de uma URL do YouTube ou de um ID já cru.
 * @returns videoId de 11 chars, ou `null` se inválido.
 */
export function extractVideoId(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // Caso 1: já é um ID cru.
  if (VIDEO_ID_RE.test(raw)) return raw;

  // Caso 2: tentar como URL. Tolera ausência de protocolo.
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "").toLowerCase();
  const isYouTubeHost =
    host === "youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube.com");
  if (!isYouTubeHost) return null;

  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && VIDEO_ID_RE.test(id) ? id : null;
  }

  // youtube.com/watch?v=<id>
  const vParam = url.searchParams.get("v");
  if (vParam && VIDEO_ID_RE.test(vParam)) return vParam;

  // youtube.com/{shorts,embed,live,v}/<id>
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && (PATH_PREFIXES as readonly string[]).includes(segments[0])) {
    const id = segments[1];
    if (VIDEO_ID_RE.test(id)) return id;
  }

  return null;
}

/** True se a string parece uma URL/ID de vídeo do YouTube resolvível. */
export function isValidYouTubeInput(input: string | null | undefined): boolean {
  return extractVideoId(input) !== null;
}
