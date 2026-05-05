import {
  TICKER_BR_REGEX,
  TICKER_US_REGEX,
  PHRASE_PRESCRIPTIVE_REGEX,
  PROMISE_RETURN_REGEX,
  BLOOMBERG_DOMAIN_REGEX,
  BLOOMBERG_BODY_REGEX,
} from "../constants/compliance-blacklist";
import {
  ComplianceCheckResult,
  type ComplianceViolation,
  type ComplianceViolationField,
  type ComplianceViolationType,
} from "../contracts/compliance";

export interface ComplianceCheckInput {
  title: string;
  por_que_importa: string;
  entre_as_linhas: string;
  o_que_fica_de_olho: string;
  body: string;
  numeros: ReadonlyArray<{
    texto: string;
    fonte_url: string;
    fonte_nome: string;
  }>;
  fontes: ReadonlyArray<{
    url: string;
    title: string;
    dominio: string;
  }>;
}

export interface RunComplianceCheckOptions {
  now?: Date;
}

type FieldScan = {
  text: string;
  field: ComplianceViolationField;
  label: string;
  isBody: boolean;
  bloombergRegex: RegExp;
  bloombergType: ComplianceViolationType;
};

function ensureGlobal(re: RegExp): RegExp {
  return re.global ? re : new RegExp(re.source, `${re.flags}g`);
}

const UNICODE_WORD_CHAR = /[\p{L}\p{N}_]/u;

function isUnicodeWordChar(char: string): boolean {
  return char.length > 0 && UNICODE_WORD_CHAR.test(char);
}

function hasUnicodeWordBoundaries(
  text: string,
  start: number,
  end: number,
): boolean {
  const before = start > 0 ? text[start - 1] ?? "" : "";
  const after = end < text.length ? text[end] ?? "" : "";
  return !isUnicodeWordChar(before) && !isUnicodeWordChar(after);
}

function getLineNumber(text: string, charIndex: number): number {
  if (charIndex <= 0) return 1;
  const upTo = text.slice(0, charIndex);
  let count = 1;
  for (let i = 0; i < upTo.length; i++) {
    if (upTo.charCodeAt(i) === 10) count++;
  }
  return count;
}

function scanField(scan: FieldScan): ComplianceViolation[] {
  const out: ComplianceViolation[] = [];
  if (typeof scan.text !== "string" || scan.text.length === 0) return out;

  const detectors: Array<{
    regex: RegExp;
    type: ComplianceViolationType;
    buildMessage: (match: string) => string;
  }> = [
    {
      regex: ensureGlobal(TICKER_BR_REGEX),
      type: "ticker_br",
      buildMessage: (m) =>
        `Ticker brasileiro detectado em ${scan.label}: "${m}". Anti-SPEC §6.2 — não nominar ativo individual (CVM 19/2021).`,
    },
    {
      regex: ensureGlobal(TICKER_US_REGEX),
      type: "ticker_us",
      buildMessage: (m) =>
        `Ticker norte-americano detectado em ${scan.label}: "${m}". Anti-SPEC §6.2 — não nominar ADR ou ação individual.`,
    },
    {
      regex: ensureGlobal(PHRASE_PRESCRIPTIVE_REGEX),
      type: "phrase_prescriptive",
      buildMessage: (m) =>
        `Frase prescritiva detectada em ${scan.label}: "${m}". Anti-SPEC §6.2 — proibida recomendação operacional.`,
    },
    {
      regex: ensureGlobal(PROMISE_RETURN_REGEX),
      type: "promise_return",
      buildMessage: (m) =>
        `Promessa de retorno detectada em ${scan.label}: "${m}". Anti-SPEC §6.2 — proibido prometer retorno financeiro.`,
    },
    {
      regex: ensureGlobal(scan.bloombergRegex),
      type: scan.bloombergType,
      buildMessage: (m) =>
        scan.bloombergType === "bloomberg_as_source"
          ? `Bloomberg detectado em ${scan.label}: "${m}". Anti-SPEC §6.2b / RNF-008 — Bloomberg não pode ser fonte pública.`
          : `Bloomberg mencionado em ${scan.label}: "${m}". Anti-SPEC §6.2b — não citar Bloomberg no corpo do briefing.`,
    },
  ];

  for (const detector of detectors) {
    const matches = scan.text.matchAll(detector.regex);
    for (const match of matches) {
      const matched = match[0];
      if (!matched) continue;
      const start = match.index ?? 0;
      const end = start + matched.length;
      if (!hasUnicodeWordBoundaries(scan.text, start, end)) continue;
      out.push({
        type: detector.type,
        match: matched,
        field: scan.field,
        line_number: scan.isBody ? getLineNumber(scan.text, start) : 0,
        severity: "hard_block",
        message: detector.buildMessage(matched),
      });
    }
  }

  return out;
}

export function runComplianceCheck(
  briefing: ComplianceCheckInput,
  options: RunComplianceCheckOptions = {},
): ComplianceCheckResult {
  const violations: ComplianceViolation[] = [];

  const textFields: FieldScan[] = [
    {
      text: briefing.title,
      field: "title",
      label: "title",
      isBody: false,
      bloombergRegex: BLOOMBERG_BODY_REGEX,
      bloombergType: "bloomberg_in_body",
    },
    {
      text: briefing.por_que_importa,
      field: "por_que_importa",
      label: "por_que_importa",
      isBody: false,
      bloombergRegex: BLOOMBERG_BODY_REGEX,
      bloombergType: "bloomberg_in_body",
    },
    {
      text: briefing.entre_as_linhas,
      field: "entre_as_linhas",
      label: "entre_as_linhas",
      isBody: false,
      bloombergRegex: BLOOMBERG_BODY_REGEX,
      bloombergType: "bloomberg_in_body",
    },
    {
      text: briefing.o_que_fica_de_olho,
      field: "o_que_fica_de_olho",
      label: "o_que_fica_de_olho",
      isBody: false,
      bloombergRegex: BLOOMBERG_BODY_REGEX,
      bloombergType: "bloomberg_in_body",
    },
    {
      text: briefing.body,
      field: "body",
      label: "body",
      isBody: true,
      bloombergRegex: BLOOMBERG_BODY_REGEX,
      bloombergType: "bloomberg_in_body",
    },
  ];

  for (const scan of textFields) {
    violations.push(...scanField(scan));
  }

  for (let i = 0; i < briefing.numeros.length; i++) {
    const numero = briefing.numeros[i];
    if (!numero) continue;
    violations.push(
      ...scanField({
        text: numero.texto,
        field: "numeros",
        label: `numeros[${i}].texto`,
        isBody: false,
        bloombergRegex: BLOOMBERG_BODY_REGEX,
        bloombergType: "bloomberg_in_body",
      }),
    );
  }

  for (let i = 0; i < briefing.fontes.length; i++) {
    const fonte = briefing.fontes[i];
    if (!fonte) continue;
    violations.push(
      ...scanField({
        text: fonte.url,
        field: "fontes_url",
        label: `fontes[${i}].url`,
        isBody: false,
        bloombergRegex: BLOOMBERG_DOMAIN_REGEX,
        bloombergType: "bloomberg_as_source",
      }),
    );
    violations.push(
      ...scanField({
        text: fonte.dominio,
        field: "fontes_dominio",
        label: `fontes[${i}].dominio`,
        isBody: false,
        bloombergRegex: BLOOMBERG_DOMAIN_REGEX,
        bloombergType: "bloomberg_as_source",
      }),
    );
    violations.push(
      ...scanField({
        text: fonte.title,
        field: "fontes_url",
        label: `fontes[${i}].title`,
        isBody: false,
        bloombergRegex: BLOOMBERG_BODY_REGEX,
        bloombergType: "bloomberg_as_source",
      }),
    );
  }

  const checkedAt = (options.now ?? new Date()).toISOString();

  return ComplianceCheckResult.parse({
    passed: violations.length === 0,
    violations,
    checked_at: checkedAt,
  });
}
