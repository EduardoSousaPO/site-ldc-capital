import type { ComplianceCheckInput } from "../checker";

const baseClean: Pick<
  ComplianceCheckInput,
  "title" | "por_que_importa" | "entre_as_linhas" | "o_que_fica_de_olho" | "body" | "numeros" | "fontes"
> = {
  title: "Mercado encerra a semana em alta moderada",
  por_que_importa:
    "A leitura institucional reforça a leitura macro do trimestre e baliza o reposicionamento de carteira no mês.",
  entre_as_linhas:
    "Os fluxos estrangeiros sustentam o pregão local enquanto a curva longa preserva prêmio elevado.",
  o_que_fica_de_olho: "Ata do Copom na próxima quarta-feira.",
  body: `## Resumo do pregão

O ibovespa fechou em alta moderada com volume dentro da média semanal.

A curva de juros teve fechamento marginal em vértices intermediários.`,
  numeros: [
    {
      texto: "Volume médio diário de R$ 22 bilhões.",
      fonte_url: "https://valor.globo.com/financas/volume",
      fonte_nome: "Valor Econômico",
    },
    {
      texto: "Estrangeiros aportaram R$ 1,8 bilhão na semana.",
      fonte_url: "https://www.reuters.com/markets/brazil",
      fonte_nome: "Reuters",
    },
    {
      texto: "Curva longa fechou em 11,40% no DI Jan-31.",
      fonte_url: "https://www.ft.com/content/brazil-curve",
      fonte_nome: "Financial Times",
    },
  ],
  fontes: [
    {
      url: "https://www.reuters.com/markets/brazil/closing",
      title: "Bovespa fecha semana em leve alta",
      dominio: "reuters.com",
    },
    {
      url: "https://valor.globo.com/financas/fechamento",
      title: "Mercado encerra com volume estável",
      dominio: "valor.com.br",
    },
  ],
};

export const violatingTickerBrInBody: ComplianceCheckInput = {
  ...baseClean,
  body: `## Movimentação do dia

PETR4 lidera as altas após divulgação do resultado trimestral.

O setor de óleo e gás fechou com volume acima da média.`,
};

export const violatingTickerBrInTitle: ComplianceCheckInput = {
  ...baseClean,
  title: "VALE3 puxa alta do Ibovespa hoje",
};

export const violatingTickerUsInBody: ComplianceCheckInput = {
  ...baseClean,
  body: `## Tecnologia americana

AAPL fechou em alta de 1,4% após o lançamento do novo produto.

O setor de tecnologia segue em foco no pregão internacional.`,
};

export const violatingPhraseLowercase: ComplianceCheckInput = {
  ...baseClean,
  body: `## Recomendação implícita

A análise indica que o investidor deve compre ações do setor financeiro.

A liquidez do mercado favorece a estratégia.`,
};

export const violatingPhraseCapitalizedInTitle: ComplianceCheckInput = {
  ...baseClean,
  title: "Compre antes da virada do trimestre",
};

export const violatingPromiseReturn: ComplianceCheckInput = {
  ...baseClean,
  por_que_importa:
    "Análise aponta retorno de 15% garantido para a estratégia de renda fixa nos próximos 12 meses.",
};

export const violatingBloombergInFonteUrl: ComplianceCheckInput = {
  ...baseClean,
  fontes: [
    {
      url: "https://www.bloomberg.com/news/articles/2026-04-26/markets-close",
      title: "Mercado encerra em leve alta",
      dominio: "reuters.com",
    },
    {
      url: "https://valor.globo.com/financas/fechamento",
      title: "Mercado encerra com volume estável",
      dominio: "valor.com.br",
    },
  ],
};

export const violatingBloombergInFonteDominio: ComplianceCheckInput = {
  ...baseClean,
  fontes: [
    {
      url: "https://www.reuters.com/markets/brazil/closing",
      title: "Bovespa fecha semana em leve alta",
      dominio: "bloomberg.com",
    },
  ],
};

export const violatingBloombergInBody: ComplianceCheckInput = {
  ...baseClean,
  body: `## Leitura do dia

Segundo a Bloomberg, o pregão refletiu o cenário externo positivo.

A leitura cruzada com Reuters confirma o movimento técnico.`,
};

export const violatingMultipleAtOnce: ComplianceCheckInput = {
  ...baseClean,
  title: "Compre PETR4 antes da alta",
  body: `## Tese

PETR4 vai subir após o resultado trimestral, com VALE3 acompanhando.

Análise indica que o investidor deve aproveitar a janela com lucro garantido.

Segundo a Bloomberg, o setor encerra a semana em forte recuperação.`,
  por_que_importa:
    "A janela de entrada oferece retorno de 20% de retorno garantido nos próximos seis meses para investidores.",
  fontes: [
    {
      url: "https://www.bloomberg.com/news/articles/2026-04-26/markets-close",
      title: "Mercado encerra em leve alta",
      dominio: "bloomberg.com",
    },
  ],
};

export const violatingBriefings: ReadonlyArray<{
  name: string;
  briefing: ComplianceCheckInput;
}> = [
  { name: "ticker_br_in_body", briefing: violatingTickerBrInBody },
  { name: "ticker_br_in_title", briefing: violatingTickerBrInTitle },
  { name: "ticker_us_in_body", briefing: violatingTickerUsInBody },
  { name: "phrase_lowercase_compre", briefing: violatingPhraseLowercase },
  { name: "phrase_capitalized_in_title", briefing: violatingPhraseCapitalizedInTitle },
  { name: "promise_return_15_percent", briefing: violatingPromiseReturn },
  { name: "bloomberg_in_fonte_url", briefing: violatingBloombergInFonteUrl },
  { name: "bloomberg_in_fonte_dominio", briefing: violatingBloombergInFonteDominio },
  { name: "bloomberg_in_body", briefing: violatingBloombergInBody },
  { name: "multiple_violations_at_once", briefing: violatingMultipleAtOnce },
];
