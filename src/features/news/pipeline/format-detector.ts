import type { BloombergFormat } from "@/features/news/contracts/pipeline";
import { BLOOMBERG_PDF_HEADERS } from "@/features/news/constants/compliance-blacklist";

const HEADER_TO_FORMAT_ORDERED = [
  ["Bloomberg Brazilian News", "PBN"],
  ["Bloomberg First Word", "BFW"],
  ["Bloomberg News", "BN"],
  ["Associated Press", "APW"],
] as const satisfies ReadonlyArray<
  readonly [(typeof BLOOMBERG_PDF_HEADERS)[number], BloombergFormat]
>;

const AUTO_TRANSLATED_REGEX = /Traduzido por máquina/i;

const HEAD_LINES_FOR_HEADER = 5;
const HEAD_LINES_FOR_TRANSLATION_FLAG = 12;

export interface FormatDetectionResult {
  format: BloombergFormat;
  auto_translated: boolean;
}

export function detectBloombergFormat(rawText: string): FormatDetectionResult {
  const cleanedLines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let format: BloombergFormat = "UNKNOWN";
  for (const line of cleanedLines.slice(0, HEAD_LINES_FOR_HEADER)) {
    const lower = line.toLowerCase();
    for (const [header, fmt] of HEADER_TO_FORMAT_ORDERED) {
      if (lower.startsWith(header.toLowerCase())) {
        format = fmt;
        break;
      }
    }
    if (format !== "UNKNOWN") break;
  }

  const headBlock = cleanedLines.slice(0, HEAD_LINES_FOR_TRANSLATION_FLAG).join("\n");
  const auto_translated = AUTO_TRANSLATED_REGEX.test(headBlock);

  return { format, auto_translated };
}
