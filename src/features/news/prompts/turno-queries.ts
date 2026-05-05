/**
 * Queries Perplexity por turno do dia. Cobre RF-006, ADR-003.
 *
 * Estrutura: cada turno gera 3-4 queries cobrindo categorias distintas. As
 * queries são frases curtas e instigantes focadas em UHNW (R$1M+),
 * intencionalmente abertas para que o Perplexity puxe múltiplas fontes
 * relevantes do dia em vez de respostas pontuais.
 *
 * As queries são entregues ao Perplexity com `search_recency_filter: "day"`
 * e `search_domain_filter: PERPLEXITY_DOMAIN_FILTER` (Reuters, FT, Valor,
 * neofeed, WSJ, Economist, InfoMoney, Axios) — Bloomberg JAMAIS aparece no
 * filtro (Anti-SPEC §6.2b / RNF-008).
 *
 * Total: ≤6 queries/rodada, dentro de PERPLEXITY_MAX_QUERIES_PER_RUN.
 */

import type { PerplexityQuery } from "@/features/news/contracts/perplexity";
import {
  PERPLEXITY_DOMAIN_FILTER,
  PERPLEXITY_MAX_QUERIES_PER_RUN,
} from "@/features/news/constants/perplexity-domains";

type Turno = "manha" | "tarde";

interface QuerySpec {
  query: string;
  tema_categoria: string;
}

// **Tom factual obrigatório**. Queries instigantes ou abertas ("o que mudou...?")
// fazem o Perplexity gerar análise educacional SEM buscar fontes. Tom "Quais
// foram..." força recência + retorno de search_results, populando citations.
// Aprendizado validado em 2026-04-28 (script descartado _inspect-perplexity-raw).
const MORNING_QUERIES: ReadonlyArray<QuerySpec> = [
  {
    query:
      "Quais foram os principais movimentos de Selic, IPCA, Copom e fiscal no Brasil hoje?",
    tema_categoria: "macro_brasil",
  },
  {
    query:
      "Quais foram os principais movimentos macro globais hoje: Fed, dados EUA, big tech e mercado de trabalho?",
    tema_categoria: "macro_global",
  },
  {
    query:
      "Quais foram os principais movimentos geopolíticos hoje impactando mercados emergentes: Oriente Médio, petróleo e China-EUA?",
    tema_categoria: "geopolitica",
  },
] as const;

const AFTERNOON_QUERIES: ReadonlyArray<QuerySpec> = [
  {
    query:
      "Quais foram os principais movimentos de renda fixa no Brasil hoje: Tesouro IPCA+, NTN-B, debêntures incentivadas e spread?",
    tema_categoria: "renda_fixa",
  },
  {
    query:
      "Quais foram os principais movimentos setoriais do Ibovespa hoje: bancos, varejo, commodities exportadoras e infraestrutura?",
    tema_categoria: "setorial",
  },
  {
    query:
      "Quais foram os principais drivers de commodities globais hoje: petróleo, minério de ferro, ouro, soja e café?",
    tema_categoria: "commodities",
  },
] as const;

function specsToQueries(specs: ReadonlyArray<QuerySpec>): PerplexityQuery[] {
  return specs.map((s) => ({
    query: s.query,
    tema_categoria: s.tema_categoria,
    search_recency_filter: "day" as const,
    search_domain_filter: [...PERPLEXITY_DOMAIN_FILTER],
    return_citations: true as const,
  }));
}

/**
 * Retorna as queries Perplexity para o turno solicitado. Sempre ≤
 * PERPLEXITY_MAX_QUERIES_PER_RUN (segurança contra orçamento).
 *
 * - Manhã (07h BRT cron): macro Brasil + macro global + geopolítica
 * - Tarde (14h BRT cron): renda fixa + setorial + commodities
 */
export function getQueriesForTurno(turno: Turno): PerplexityQuery[] {
  const specs = turno === "manha" ? MORNING_QUERIES : AFTERNOON_QUERIES;
  const limited = specs.slice(0, PERPLEXITY_MAX_QUERIES_PER_RUN);
  return specsToQueries(limited);
}

export const QUERY_CATEGORIES_BY_TURNO = {
  manha: MORNING_QUERIES.map((q) => q.tema_categoria),
  tarde: AFTERNOON_QUERIES.map((q) => q.tema_categoria),
} as const;
