// Parse do campo Client.notes, que serializa patrimônio/origem/IP em texto livre.
// Formato gravado por api/lead/route.ts:
//   "Patrimônio: <valor> | Origem: <valor> | IP: <valor>"
//
// Client NÃO tem colunas dedicadas para patrimônio/origem/status (ver SPEC D-3),
// então a UI deriva esses campos daqui. Tolerante a subsets e ordem variável.
//
// Pure function — coberta por testes (CA-009).

export interface ParsedClientNotes {
  patrimonio?: string;
  origem?: string;
  ip?: string;
}

/**
 * Extrai os campos rotulados de Client.notes. Campos ausentes ficam undefined.
 * A comparação de rótulo ignora acento/caixa (Patrimônio vs patrimonio).
 */
export function parseClientNotes(notes: string | null | undefined): ParsedClientNotes {
  const out: ParsedClientNotes = {};
  if (!notes) return out;

  for (const part of notes.split("|")) {
    const sepIndex = part.indexOf(":");
    if (sepIndex === -1) continue;

    const label = part
      .slice(0, sepIndex)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase();
    const value = part.slice(sepIndex + 1).trim();
    if (!value) continue;

    if (label.startsWith("patrim")) out.patrimonio = value;
    else if (label.startsWith("origem")) out.origem = value;
    else if (label === "ip") out.ip = value;
  }

  return out;
}
