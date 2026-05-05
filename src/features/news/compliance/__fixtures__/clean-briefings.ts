import type { ComplianceCheckInput } from "../checker";

const baseFontes: ComplianceCheckInput["fontes"] = [
  {
    url: "https://www.reuters.com/markets/currencies/dolar-cai-2025-08-12",
    title: "Dólar cede ante real em pregão volátil",
    dominio: "reuters.com",
  },
  {
    url: "https://valor.globo.com/financas/noticia/2025/08/12/cdi.ghtml",
    title: "CDI mantém ritmo após decisão do Copom",
    dominio: "valor.com.br",
  },
];

const baseNumeros: ComplianceCheckInput["numeros"] = [
  {
    texto: "Selic terminal projetada em 9,75% para o ciclo de 2026.",
    fonte_url: "https://www.reuters.com/markets/rates/selic",
    fonte_nome: "Reuters",
  },
  {
    texto: "Inflação de serviços roda a 5,2% no acumulado em 12 meses.",
    fonte_url: "https://valor.globo.com/financas/inflacao",
    fonte_nome: "Valor Econômico",
  },
  {
    texto: "Curva longa precifica corte de 75 bps até o segundo trimestre.",
    fonte_url: "https://www.ft.com/markets/brazil-rates",
    fonte_nome: "Financial Times",
  },
];

export const cleanBriefing01: ComplianceCheckInput = {
  title: "Copom mantém Selic e abre janela",
  por_que_importa:
    "A pausa do Copom altera o cálculo de duration para alocações em renda fixa pré-fixada nos próximos meses.",
  entre_as_linhas:
    "O comunicado privilegia ancoragem das expectativas e indica que o ciclo de cortes só começa após desinflação consolidada de serviços.",
  o_que_fica_de_olho: "Ata do Copom na próxima terça definirá o tom do trimestre.",
  body: `## Contexto macro

O Copom optou por manter a taxa estável após reunião extraordinária de avaliação de cenário.

A leitura do mercado é que a autoridade monetária prefere conservadorismo no curto prazo.

## Implicações para alocação

Investidores institucionais devem revisar duration em portfólios de renda fixa.`,
  numeros: baseNumeros,
  fontes: baseFontes,
};

export const cleanBriefing02: ComplianceCheckInput = {
  title: "China revisa meta fiscal e abre brecha",
  por_que_importa:
    "A reabertura do espaço fiscal chinês muda o equilíbrio de demanda por commodities estruturais que o Brasil exporta.",
  entre_as_linhas:
    "Pequim sinaliza tolerância maior com déficit primário para sustentar a indústria pesada e a construção doméstica.",
  o_que_fica_de_olho: "Reunião do Politburo na primeira semana de maio.",
  body: `## Movimentação fiscal chinesa

A revisão da meta fiscal chinesa amplia o estímulo doméstico para a construção e a indústria.

## Impacto sobre a balança comercial

Exportadores brasileiros de minério e proteína animal capturam efeito direto via preço internacional.`,
  numeros: [
    {
      texto: "Meta de déficit revisada para 4,0% do PIB chinês em 2026.",
      fonte_url: "https://www.reuters.com/world/china/fiscal-target",
      fonte_nome: "Reuters",
    },
    {
      texto: "Exportações brasileiras para a China cresceram 8,3% no trimestre.",
      fonte_url: "https://valor.globo.com/internacional/china",
      fonte_nome: "Valor Econômico",
    },
    {
      texto: "Estímulo adicional estimado em USD 230 bilhões.",
      fonte_url: "https://www.ft.com/content/china-stimulus",
      fonte_nome: "Financial Times",
    },
  ],
  fontes: baseFontes,
};

export const cleanBriefing03: ComplianceCheckInput = {
  title: "Fed sinaliza paciência sobre cortes",
  por_que_importa:
    "Powell ancora a curva longa norte-americana e empurra o trade de duration global para o quarto trimestre.",
  entre_as_linhas:
    "A leitura do FOMC reforça que a meta de inflação ainda não está garantida e que o nível restritivo segue por mais reuniões.",
  o_que_fica_de_olho: "Núcleo do PCE divulgado na sexta da próxima semana.",
  body: `## Comunicação do Fed

Powell reforçou postura cautelosa e indicou que a barra para o início do ciclo de afrouxamento ainda não foi atingida.

## Reflexo nas curvas

A treasury de 10 anos abriu três pontos-base após o discurso, sustentando o pregão local.`,
  numeros: baseNumeros,
  fontes: [
    {
      url: "https://www.reuters.com/markets/us/fed-decision",
      title: "Fed mantém juros e adia início do ciclo de cortes",
      dominio: "reuters.com",
    },
    {
      url: "https://www.wsj.com/articles/fomc-statement",
      title: "Statement detalha postura cautelosa do FOMC",
      dominio: "wsj.com",
    },
  ],
};

export const cleanBriefing04: ComplianceCheckInput = {
  title: "Energia: Opep+ surpreende em ajuste",
  por_que_importa:
    "O ajuste de produção da Opep+ recoloca prêmio de risco no Brent e afeta projeções de inflação ao produtor no Brasil.",
  entre_as_linhas:
    "Riad acomoda o pleito russo de cortes adicionais sem comprometer a meta saudita de elevar receita fiscal anual.",
  o_que_fica_de_olho: "Reunião monitor JMMC no fim do mês.",
  body: `## Decisão da Opep+

O grupo anunciou corte adicional voluntário com efeito a partir do trimestre seguinte.

## Reação dos preços

O Brent saltou para a casa de USD 84 e mexeu com refinarias asiáticas.`,
  numeros: [
    {
      texto: "Corte adicional voluntário de 1,2 milhão de barris por dia.",
      fonte_url: "https://www.reuters.com/energy/opec-cut",
      fonte_nome: "Reuters",
    },
    {
      texto: "Brent fechou em USD 84,30, alta de 2,1% na semana.",
      fonte_url: "https://www.ft.com/content/brent-rally",
      fonte_nome: "Financial Times",
    },
    {
      texto: "Estoques americanos caíram em 4,2 milhões de barris.",
      fonte_url: "https://www.reuters.com/energy/eia-inventories",
      fonte_nome: "Reuters",
    },
  ],
  fontes: baseFontes,
};

export const cleanBriefing05: ComplianceCheckInput = {
  title: "Tesouro recompõe colchão de liquidez",
  por_que_importa:
    "A operação reduz necessidade de rolagens curtas e abre espaço para alongamento da dívida em condições mais favoráveis.",
  entre_as_linhas:
    "A gestão técnica privilegia leilões de prazo intermediário enquanto a curva mantém prêmio elevado em vértices longos.",
  o_que_fica_de_olho: "Relatório mensal da dívida pública na próxima quarta.",
  body: `## Liquidez do Tesouro

O Tesouro Nacional reforçou a posição de caixa após arrecadação extraordinária do trimestre.

## Estratégia de leilão

A pasta sinaliza preferência por NTN-B com vencimento em 2030 nos próximos pregões.`,
  numeros: baseNumeros,
  fontes: baseFontes,
};

export const cleanBriefing06: ComplianceCheckInput = {
  title: "Geopolítica: corredor do Indo-Pacífico",
  por_que_importa:
    "O alinhamento entre Índia e Estados Unidos no corredor logístico desloca rotas de carga e impacta exportação brasileira.",
  entre_as_linhas:
    "O acordo cria pressão competitiva sobre rotas tradicionais que servem o comércio entre América Latina e Ásia.",
  o_que_fica_de_olho: "Cúpula do G20 indiana na primeira semana de junho.",
  body: `## Movimentação no Indo-Pacífico

Estados Unidos e Índia formalizaram corredor logístico com escala em portos do Sudeste Asiático.

## Reflexo no comércio brasileiro

A reorganização logística pode encarecer exportações de proteína bovina ao mercado asiático.`,
  numeros: [
    {
      texto: "Investimento conjunto previsto de USD 18 bilhões em infraestrutura.",
      fonte_url: "https://www.reuters.com/world/india/corridor",
      fonte_nome: "Reuters",
    },
    {
      texto: "Volume de carga deslocada estimado em 12% do fluxo regional.",
      fonte_url: "https://www.ft.com/content/indo-pacific",
      fonte_nome: "Financial Times",
    },
    {
      texto: "Exportação brasileira de proteína cresceu 6,4% no semestre.",
      fonte_url: "https://valor.globo.com/agronegocio/proteina",
      fonte_nome: "Valor Econômico",
    },
  ],
  fontes: baseFontes,
};

export const cleanBriefing07: ComplianceCheckInput = {
  title: "Setor bancário e ciclo de provisões",
  por_que_importa:
    "A normalização de provisões libera capacidade de balanço para crédito corporativo no segundo semestre.",
  entre_as_linhas:
    "Os grandes incumbentes acomodaram a inadimplência do varejo enquanto rotacionam exposição para empresas de médio porte.",
  o_que_fica_de_olho: "Resultados trimestrais que abrem na próxima semana.",
  body: `## Ciclo de provisões

Os bancos brasileiros encerraram o trimestre com provisões mais baixas e cobertura confortável.

## Reflexo no crédito

A folga de balanço viabiliza expansão controlada para empresas de médio porte.`,
  numeros: [
    {
      texto: "Inadimplência da pessoa física recuou para 3,8%, melhor patamar desde 2022.",
      fonte_url: "https://valor.globo.com/financas/bancos",
      fonte_nome: "Valor Econômico",
    },
    {
      texto: "Carteira de crédito do segmento corporate cresceu 9,1% em 12 meses.",
      fonte_url: "https://www.reuters.com/markets/brazil-banks",
      fonte_nome: "Reuters",
    },
    {
      texto: "Cobertura média de provisões se manteve em 220% nos cinco maiores.",
      fonte_url: "https://www.ft.com/content/brazil-banks",
      fonte_nome: "Financial Times",
    },
  ],
  fontes: baseFontes,
};

export const cleanBriefing08: ComplianceCheckInput = {
  title: "Sucessão UHNW: nova jurisprudência STJ",
  por_que_importa:
    "A decisão muda a leitura sobre estruturas familiares offshore e exige revisão dos planejamentos sucessórios em curso.",
  entre_as_linhas:
    "O acórdão reforça transparência sobre beneficiários finais e cria janela para reorganização preventiva ainda em 2026.",
  o_que_fica_de_olho: "Publicação do voto do relator no DJ da próxima semana.",
  body: `## Decisão do STJ

A corte consolidou entendimento sobre transparência de beneficiários em estruturas internacionais.

## Implicação prática

Famílias UHNW que mantêm holding offshore precisam revisar trust e fundos exclusivos.`,
  numeros: [
    {
      texto: "Decisão envolve estimativa de R$ 38 bilhões em ativos sob revisão.",
      fonte_url: "https://valor.globo.com/legislacao/stj",
      fonte_nome: "Valor Econômico",
    },
    {
      texto: "Mais de 4.200 estruturas familiares foram registradas na CVM em 2025.",
      fonte_url: "https://www.reuters.com/world/americas/brazil-trust",
      fonte_nome: "Reuters",
    },
    {
      texto: "Movimento de adequação cresceu 27% após a decisão.",
      fonte_url: "https://www.ft.com/content/brazil-wealth",
      fonte_nome: "Financial Times",
    },
  ],
  fontes: baseFontes,
};

export const cleanBriefing09: ComplianceCheckInput = {
  title: "Câmbio: efeito tarifa nas exportadoras",
  por_que_importa:
    "Vale a pena observar o impacto cambial sobre exportadoras com receita em dólar e dívida em real após a nova tabela tarifária.",
  entre_as_linhas:
    "Empresas de proteína animal capturam efeito imediato; setor de mineração mantém hedge estrutural ativo até dezembro.",
  o_que_fica_de_olho: "Nota técnica do BCB sobre fluxo cambial estrangeiro.",
  body: `## Cenário cambial

O real operou em banda estreita após a divulgação da nova tabela tarifária americana.

## Impacto setorial

Exportadoras com receita em moeda forte mantêm vantagem competitiva no curto prazo.

Vale a pena observar o setor de proteína animal que capturou efeito mais rápido.`,
  numeros: [
    {
      texto: "Câmbio fechou em R$ 5,12, variação de 0,8% na semana.",
      fonte_url: "https://valor.globo.com/financas/cambio",
      fonte_nome: "Valor Econômico",
    },
    {
      texto: "Receita de exportação de proteína bovina avançou 4,7% no trimestre.",
      fonte_url: "https://www.reuters.com/markets/commodities/protein",
      fonte_nome: "Reuters",
    },
    {
      texto: "Hedge cambial estrutural cobre 58% das obrigações em dólar.",
      fonte_url: "https://www.ft.com/content/brazil-fx",
      fonte_nome: "Financial Times",
    },
  ],
  fontes: baseFontes,
};

export const cleanBriefing10: ComplianceCheckInput = {
  title: "Internacional UHNW: oferta de fundos UCITS",
  por_que_importa:
    "A nova leva de fundos UCITS distribuídos no Brasil amplia a paleta de produtos disponíveis para portfólios offshore.",
  entre_as_linhas:
    "A regulação local permite distribuição direta a investidor profissional, encurtando o tempo de alocação após decisão familiar.",
  o_que_fica_de_olho: "Audiência pública da CVM sobre distribuição transfronteiriça.",
  body: `## Oferta de fundos UCITS

A nova safra de fundos europeus distribuídos por private banks brasileiros amplia a oferta para portfólio internacional.

## Implicação para alocação

Famílias com mandato global passam a contar com soluções listadas e reguladas em ambiente europeu.`,
  numeros: [
    {
      texto: "Fluxo bruto para UCITS cresceu 22% no semestre.",
      fonte_url: "https://www.ft.com/content/ucits-brazil",
      fonte_nome: "Financial Times",
    },
    {
      texto: "Mais de 18 gestoras passaram a distribuir os produtos no Brasil.",
      fonte_url: "https://valor.globo.com/financas/internacional",
      fonte_nome: "Valor Econômico",
    },
    {
      texto: "Patrimônio total dos fundos europeus disponíveis ultrapassa USD 2,1 trilhões.",
      fonte_url: "https://www.reuters.com/markets/europe/ucits",
      fonte_nome: "Reuters",
    },
  ],
  fontes: baseFontes,
};

export const cleanBriefings: ReadonlyArray<ComplianceCheckInput> = [
  cleanBriefing01,
  cleanBriefing02,
  cleanBriefing03,
  cleanBriefing04,
  cleanBriefing05,
  cleanBriefing06,
  cleanBriefing07,
  cleanBriefing08,
  cleanBriefing09,
  cleanBriefing10,
];
