export const TICKER_BR_REGEX = /\b[A-Z]{4}\d{1,2}\b/g;

export const TICKER_US_LIST = [
  "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "META", "TSLA", "NVDA",
  "NFLX", "AMD", "INTC", "ORCL", "CRM", "ADBE", "PYPL", "AVGO",
  "QCOM", "CSCO", "IBM", "TSM", "TXN", "MU", "INTU", "NOW",
  "JPM", "BAC", "WFC", "GS", "MS", "C", "BLK", "SCHW",
  "V", "MA", "AXP", "PYPL",
  "UNH", "JNJ", "PFE", "MRK", "ABBV", "LLY", "TMO", "ABT", "CVS",
  "KO", "PEP", "WMT", "MCD", "NKE", "DIS", "HD", "PG", "COST",
  "XOM", "CVX", "COP", "OXY",
  "BA", "LMT", "RTX", "GE",
  "F", "GM",
  "PBR", "VALE", "ITUB", "BBD", "ABEV", "NU", "MELI", "STNE",
] as const;

const TICKER_US_REGEX_PATTERN = `\\b(${TICKER_US_LIST.join("|")})\\b`;
export const TICKER_US_REGEX = new RegExp(TICKER_US_REGEX_PATTERN, "g");

export const PHRASE_PRESCRIPTIVE_REGEX =
  /\b(compre|comprar|venda|vender|vai\s+(subir|cair|disparar|despencar)|rentabilidade\s+garantida|lucro\s+garantido|investimento\s+certo|oportunidade\s+única|n[aã]o\s+pode\s+perder|aposte\s+em|garantido\s+\d+)\b/gi;

export const PROMISE_RETURN_REGEX =
  /\d+\s*%\s+[a-zà-úA-ZÀ-Ú\s]{0,30}?(de\s+retorno|de\s+lucro|garantid[oa]|cert[oa]|de\s+ganho)/gi;

export const BLOOMBERG_DOMAIN_REGEX =
  /bloomberg\.(com|net|com\.br)|bloomberglinea/i;

export const BLOOMBERG_BODY_REGEX = /\bbloomberg\b/i;

export const BLOOMBERG_FORBIDDEN_DOMAINS = [
  "bloomberg.com",
  "bloomberg.net",
  "bloomberg.com.br",
  "bloomberglinea.com.br",
] as const;

export const BLOOMBERG_PDF_HEADERS = [
  "Bloomberg Brazilian News",
  "Bloomberg First Word",
  "Bloomberg News",
  "Associated Press",
] as const;

export const BLOOMBERG_METADATA_SECTIONS = [
  "## O que estamos lendo",
  "## Mais conteúdo local",
  "## Empresas",
  "## Para acompanhar",
  "Para entrar em contato com os repórteres",
  "Para entrar em contato com os editores",
  "Inscreva-se na nossa newsletter",
  "Inscreva-se na newsletter",
  "©2026 Bloomberg L.P.",
  "©2025 Bloomberg L.P.",
] as const;

export const COMPLIANCE_REGEX_VERSION = "1.0" as const;
