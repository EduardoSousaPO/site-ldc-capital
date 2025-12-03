# Detalhamento minucioso das abas “Resumo das informações”, “Investimentos – Não Aposentado” e “Investimentos – Aposentado”

Este documento aprofunda a descrição das principais abas da planilha de planejamento de vida para que você possa reproduzir a lógica de cálculo em um aplicativo web.  Ele mostra como cada seção funciona, detalha as fórmulas e oferece exemplos numéricos.

## 1. Resumo das informações

A aba **“Resumo das informações”** é o ponto central de entrada de dados.  Ela organiza informações em blocos bem definidos.  A maioria das células desta aba contém apenas texto ou valores fixos; as fórmulas estão concentradas nas abas de cálculo.  A seguir está uma descrição seção por seção.

### 1.1 Dados pessoais e familiares

| Campo | Descrição | Exemplo |
| --- | --- | --- |
| **Nome** (`F6`) | Nome do cliente. | “Marcos”【121565495234456†screenshot】 |
| **Idade** (`I6`) | Idade atual em anos. | 24【121565495234456†screenshot】 |
| **Dependentes** (`D7`–`G7`) | Tabela para listar dependentes (Nome, Idade, Observações).  Cada linha corresponde a um dependente. | Não preenchido no exemplo, mas o app deve permitir adicionar linhas dinamicamente. |
| **Idade de aposentadoria** (`I7`) | Idade em que o cliente pretende se aposentar. | 50【121565495234456†screenshot】 |
| **Linha de vida** (`I8`) | Expectativa de vida (quantos anos o cliente espera viver).  É usada para determinar o número de anos na aposentadoria. | 80【121565495234456†screenshot】 |
| **Estado civil** (`H9`) | Estado civil (solteiro, casado, divorciado, etc.). | “Solteiro”, “Casado”, “União Estável” etc. |
| **Profissão** (`H10`) | Profissão atual, útil para relatórios personalizados. | — |
| **Suitability** (`I10`) | Perfil de risco.  Opções: Conservador, Moderado, Moderado‑Agressivo, Agressivo. | “Agressivo” no exemplo【121565495234456†screenshot】. |

### 1.2 Informações financeiras básicas

| Campo | Descrição | Exemplo |
| --- | --- | --- |
| **Despesa familiar mensal** (`F13`) | Soma de despesas mensais da família.  Será usada para estimar necessidades de proteção e aposentadoria. | 10 000 R$【121565495234456†screenshot】 |
| **Renda mensal desejada na aposentadoria** (`I13`) | Valor que o cliente deseja receber todo mês após se aposentar. | 40 000 R$【121565495234456†screenshot】 |
| **Poupança mensal** (`F14`) | Valor que o cliente consegue poupar por mês atualmente.  Pode ser zero. | 0【121565495234456†screenshot】 |
| **Receitas mensais previstas na aposentadoria** (`I14`) | Outras receitas esperadas durante a aposentadoria (aluguel, pensão, etc.). | 0 no exemplo. |
| **Objetivo dos Investimentos** (`H15`) | Objetivo principal do investidor.  A planilha oferece três opções: “Preservar capital”, “Acumular Recursos” e “Especular”.  Escolher uma dessas define a estratégia. | “Acumular Recursos” no exemplo. |

### 1.3 Carteira atual e ativos

Há uma tabela que lista a composição da carteira.  Para cada ativo há quatro colunas: **Ativo**, **R$** (valor atual), **% da carteira** e **rentabilidade (% CDI)**【121565495234456†screenshot】.  No exemplo:

- **Carteira**: valor 1 000 000 R$, participação 100 % da carteira e rentabilidade 0,097 (9,7 % ao ano).  Essa taxa é usada como base para cálculo de capital futuro.
- **Previdência**: valor 0, participação 0 %, rentabilidade 0.
- **Total**: soma das linhas anteriores (1 000 000 R$).  O aplicativo deve atualizar a participação (%) automaticamente à medida que o usuário insere valores.

### 1.4 Imposto e liquidez

Campos adicionais nesta aba servem para configurar o cálculo:

| Campo | Descrição | Exemplo |
| --- | --- | --- |
| **I.R considerado** (`I23`) | Determina se a rentabilidade será calculada com ou sem imposto de renda.  Duas opções: “Sem considerar I.R” ou “Considerando I.R”.  No exemplo está “Sem considerar I.R”【121565495234456†screenshot】. |
| **Necessidade de liquidez imediata (%)** (`I23`) | Percentual da carteira que precisa estar líquido para emergências. | 0,2 (20 %)【121565495234456†screenshot】 |

### 1.5 Bens móveis e imóveis

Esta seção permite registrar patrimônios físicos, com colunas para **Bens**, **Valor**, **Vendável** (Sim/Não) e **Renda de Aluguel**.  No exemplo:

- “Casa Própria”: valor 0, “Não” vendável.
- “Veículo”: valor não preenchido (célula vazia) e “Sim” vendável【121565495234456†screenshot】.
- Linha “Total”: soma dos valores.

O aplicativo pode permitir que o usuário adicione imóveis e veículos, indicando se podem ser vendidos e se geram renda.

### 1.6 Projetos e dívidas

Seções adicionais incluem:

- **Projetos pessoais/familiares**: tabela com colunas P/F (pessoal/familiar), Montante e Prazo.  Esses projetos são repassados para a aba **Investimentos – Projetos**.
- **Financiamentos/Dívidas**: para cada dívida, informar **Saldo Devedor**, **Prazo para saldar** e **Com Seguro de Vida?** (Sim/Não).  Esses dados são usados na aba **Proteção Familiar** para calcular a necessidade de seguro.
- **Outras receitas**: tabela para FGTS, aluguel, seguros de vida, INSS e outras fontes.  O valor é somado na projeção de receitas futuras.

### 1.7 Premissas macroeconômicas

As células `E41:I41` contêm as premissas de inflação, CDI, rentabilidade na aposentadoria e taxa real.  Por exemplo, **Inflação anual** é 3,5 %, **CDI anual** 9,7 % e **Juro real na aposentadoria** cerca de 5,99 %【121565495234456†screenshot】.  O app deve permitir atualizar essas taxas para que as projeções fiquem realistas.

## 2. Investimentos – Não Aposentado (cálculo)

Esta aba é a alma do simulador para quem ainda vai se aposentar.  Ela pega os dados do “Resumo das informações” e calcula quanto capital você terá e quanto precisará.  Os resultados são apresentados em três cenários:

### 2.1 Estrutura geral

- As colunas **AV** a **AZ** representam a linha do tempo em anos.  A coluna AV contém a idade corrente (inicia com a idade atual e incrementa 1 a cada linha).  As colunas **AW**, **AX**, **AY** e **AZ** armazenam os saldos acumulados para diferentes hipóteses【121565495234456†screenshot】.
- A linha inicial (linha 35, por exemplo) coloca valores base: idade corrente, saldo inicial da carteira e define as fórmulas para os anos seguintes.

### 2.2 Cenário 1 – Projeção atual (linha preta)

- **Poupança anual**: valor informado pelo usuário (no exemplo, 60 000 R$) é usado até a idade de aposentadoria.
- **Rentabilidade real**: utiliza `i_real_atual` (5,99 % no exemplo).  A fórmula na célula `AW35` segue o padrão:

    Abaixo, `t` representa o índice da linha (ano) e `AW_t` é o saldo no ano `t`.

        AW_{t+1} =
        \begin{cases}
          AW_t \times (1 + i_{real\_atual}) + PMT_{atual}, & \text{se idade} \le \text{idade de aposentadoria} \\
          AW_t \times (1 + i_{real\_aposentadoria}) - (L6 \times 12), & \text{depois da aposentadoria}
        \end{cases}

    – `PMT_atual` é a contribuição anual (60000 R$).  
    – `L6` é o valor da poupança mensal (no exemplo, zero, mas a fórmula subtrai `L6*12` após a aposentadoria).  O resultado é a projeção de capital acumulado ano a ano até a expectativa de vida.

### 2.3 Cenário 2 – Manutenção do patrimônio (linha verde)

- Este cenário responde à pergunta “Quanto capital eu preciso para viver apenas dos rendimentos, sem tocar no principal?”.
- **Capital necessário (FV mínimo)**: calculado por `Renda anual desejada / i_realaposentadoria`.  Com renda anual de 480 000 R$ (40 000 R$ × 12) e taxa real de 5,99 %, o capital necessário é cerca de 8 012 903,23 R$【121565495234456†screenshot】.
- **Poupança anual** e **idade de aposentadoria** podem ser diferentes do cenário atual.  No exemplo, a planilha testa uma poupança anual de 500 000 R$ e aposentadoria aos 75 anos.  Isso aparece nas células `AX36` e `AX39` (as tabelas listam 75 ou 80 anos como cenários alternativos).  
- A fórmula da coluna AX (caso 1) é semelhante à de AW, mas usa `PMT_necessario` (contribuição que permite atingir o FV mínimo) antes da aposentadoria e retira `renda_extra_necessaria*12` depois da aposentadoria:

        AX_{t+1} =
        \begin{cases}
          AX_t \times (1 + i_{real\_atual}) + PMT_{necessario}, & \text{antes da aposentadoria} \\
          AX_t \times (1 + i_{real\_aposentadoria}) - (\text{renda\_extra\_necessaria} \times 12), & \text{depois}
        \end{cases}

    Aqui `renda_extra_necessaria` é a diferença entre a renda desejada e as receitas mensais previstas, ajustada para inflação.

### 2.4 Cenário 3 – Consumo do patrimônio (linha vermelha)

- Nesta hipótese, o investidor está disposto a consumir parte do patrimônio durante a aposentadoria.  O capital necessário é menor, pois o principal é esgotado até a expectativa de vida.
- **Cálculo do capital necessário (FV projetado)**: utiliza a fórmula de valor presente de uma anuidade.  Em Python o cálculo seria:

        import numpy_financial as npf
        n_anos = linha_de_vida - idade_aposentadoria  # ex.: 30 anos
        capital_consumo = npf.pv(taxa_real, n_anos, -renda_anual_desejada, 0)
        # Resultado ≈ 6.613.955,25 R$

- **Contribuição anual** e **idade de aposentadoria** podem ser ajustadas para atingir esse capital.  Na planilha, `PMT_atual` (60 000 R$) pode não ser suficiente, então ela calcula `PMT_necessario` e apresenta alternativas (por exemplo, aumentar a poupança para 500 000 R$ ou adiar a aposentadoria).
- A fórmula na coluna AY (caso 2) é:

        AY_{t+1} =
        \begin{cases}
          AY_t \times (1 + i_{real\_atual}) + PMT_{atual}, & \text{antes da aposentadoria} \\
          AY_t \times (1 + i_{real\_aposentadoria}) - (\text{Renda\_aposentadoria} \times 12), & \text{depois}
        \end{cases}

    Repare que, após a aposentadoria, subtrai‑se `Renda_aposentadoria*12` (a renda desejada) enquanto o capital rende.

### 2.5 Comparação de cenários

Na planilha, as linhas 47 a 49 exibem “Rentabilidade necessária – Nominal bruta / Real líquida” para cada cenário.  Estes valores correspondem à taxa anual que iguala o capital projetado ao capital necessário.  Por exemplo, no cenário 2 a taxa nominal necessária é aproximadamente 9,66 % (real ≈ 5,95 %)【121565495234456†screenshot】.  O aplicativo pode calcular essas taxas usando `numpy_financial.rate` ou via método de Newton.

### 2.6 Visualizações sugeridas

Para tornar o simulador didático:

- **Tabela comparativa:** mostrar os três cenários lado a lado, incluindo poupança anual, idade de aposentadoria, capital acumulado, capital necessário, rentabilidade necessária e se está dentro do perfil de risco.
- **Gráfico de evolução:** plotar o valor acumulado ano a ano (idades no eixo X).  Use três curvas coloridas: projeção atual (preta), manutenção do patrimônio (verde) e consumo do patrimônio (vermelha).  Essas curvas ajudam o usuário a visualizar como o patrimônio cresce e diminui ao longo do tempo.
- **Indicadores de alerta:** se o capital futuro não alcança o capital necessário, mostrar mensagens sugerindo aumentar a contribuição, adiar a aposentadoria ou aceitar um risco maior.

## 3. Investimentos – Aposentado (cálculo)

Esta aba lida com usuários já aposentados ou prestes a se aposentar.  O foco aqui é garantir que o patrimônio dure durante a aposentadoria.  A lógica é parecida com a aba anterior, mas não há período de acumulação – apenas decumulação (retirada de renda).

### 3.1 Entradas principais

| Campo | Descrição | Exemplo |
| --- | --- | --- |
| **Idade** (`F6`) | Idade atual (ex.: 42 anos)【121565495234456†screenshot】 |
| **Linha de vida** (`H6`) | Expectativa de vida (80 anos)【121565495234456†screenshot】 |
| **Patrimônio financeiro acumulado** (`L5`) | Total investido disponível para gerar renda (13 850 000 R$ no exemplo)【121565495234456†screenshot】 |
| **Patrimônio não financeiro acumulado** (`L6`) | Bens que podem ser convertidos em recursos (0 no exemplo)【121565495234456†screenshot】 |
| **Receitas previstas** (`P6`) | Outras fontes de renda (INSS, aluguéis).  Na planilha, soma `dados_receitaaposentadoria` com valores do resumo. |
| **Renda mensal desejada** (`N5`) | Valor mensal que o aposentado quer receber. |
| **Perfil de investidor** (`T5`) | Determina a taxa de retorno aplicada em cada carteira. |

### 3.2 Modelagem de carteiras

A planilha simula quatro carteiras, refletidas nas colunas **AX**, **AY**, **AZ** e **BA**.  A lógica de recursão de cada coluna (a partir da linha 4) é:

- **Coluna AX (Carteira atual)**: usa o **i_real_atual** como taxa de retorno (mesma taxa real usada na acumulação).  A fórmula em `AX4` é:

        AX_{t+1} = AX_t * (1 + i_{real\_atual}) - (renda_extra_necessaria * 12)

  Onde `renda_extra_necessaria` = renda desejada mensal – receitas previstas mensais.  O valor é multiplicado por 12 para convertê‑lo em anual.

- **Coluna AY (Carteira renda vitalícia)**: aplica uma taxa `M43` (por exemplo, renda vitalícia de debêntures ou previdência) em vez do i_real_atual.  A fórmula é:

        AY_{t+1} = AY_t * (1 + M43) - (renda_extra_necessaria * 12)

- **Coluna AZ (Carteira consumo patrimônio financeiro)**: usa a taxa `P43`, que pode ser inferior (por exemplo, um portfólio mais conservador).  Fórmula semelhante:

        AZ_{t+1} = AZ_t * (1 + P43) - (renda_extra_necessaria * 12)

- **Coluna BA (Carteira consumo patrimônio total)**: inclui também o patrimônio não financeiro.  A fórmula em `BA4` é:

        BA_{t+1} = BA_t * (1 + T43) - (AP1 * 12)

  Onde `AP1` corresponde à renda desejada (renda_extra_necessaria).  Se houver imóveis, parte do capital sai dessa carteira.

### 3.3 Exemplo numérico

Suponha um investidor de 42 anos com patrimônio financeiro de 13,85 milhões de R$ e renda desejada de 40 000 R$ mensais (480 000 R$/ano).  A diferença entre renda desejada e receitas previstas é a **renda extra necessária** que será retirada do patrimônio.

Se a taxa real (i_real_atual) for 5,99 % ao ano, o saldo evoluirá conforme a fórmula acima.  Para ilustrar:

    saldo_inicial = 13_850_000
    taxa = 0.05990338164251208
    renda_extra_ano = 480_000  # diferença entre renda desejada e receitas previstas

    for ano in range(1, 10):
        saldo_inicial = saldo_inicial * (1 + taxa) - renda_extra_ano
        print(f"Ano {ano}: saldo = {saldo_inicial:,.2f} R$")

Esse código mostrará o saldo da carteira ano a ano.  O investidor pode acompanhar até que idade seu patrimônio se mantém positivo.  O aplicativo deve executar essa simulação até a expectativa de vida e exibir um gráfico.

### 3.4 Saídas

Os principais resultados da aba “Investimentos – Aposentado” que o app deve mostrar são:

- **Renda média gerada pelo patrimônio financeiro** (`AN3`): calcula quanto a carteira rende anualmente em média, considerando a taxa escolhida e o valor da carteira【121565495234456†screenshot】.
- **Idade de sobrevivência do patrimônio**: a última linha antes de o saldo da carteira ficar negativo.  Pode ser lida percorrendo a coluna correspondente até encontrar um valor ≤ 0.
- **Comparativo de carteiras**: tabela com saldo final ou anos de duração para cada carteira.  Um gráfico de linhas pode ilustrar essas diferenças, permitindo ao usuário escolher a estratégia que melhor se adequa às suas necessidades de renda e de risco.

## 4. Recomendações para implementação

1. **Modelar os dados:** criar classes ou estruturas para armazenar dados do cliente (idade, despesas, objetivos), carteira (ativos, valores, taxas), projetos e premissas macroeconômicas.
2. **Implementar funções financeiras:** escrever funções em Python para FV, PV, PMT, taxa real, rentabilidade necessária e para simular os saldos ano a ano.  Podem ser encapsuladas em classes (por exemplo, `SimuladorNaoAposentado` e `SimuladorAposentado`).
3. **Interface amigável:** dividir a interface em etapas, refletindo as seções descritas aqui.  Para as tabelas dinâmicas (dependentes, bens, projetos), permita adicionar/remover linhas.  Forneça campos pré-preenchidos com valores padrão para facilitar.
4. **Apresentação dos resultados:** use gráficos interativos (Plotly) e tabelas resumidas para mostrar claramente as diferenças entre cenários.  Ofereça explicações em tooltips ou caixas de texto para cada indicador (por exemplo, explicar de onde vem o capital necessário de 8 012 903 R$).  Inclua exemplos numéricos como os mostrados acima para tornar a ferramenta didática.
5. **Exportação em PDF:** compile todas as informações (entradas, resultados, gráficos e explicações) em um relatório PDF.  Utilize bibliotecas como ReportLab ou WeasyPrint.  O relatório deve ser autoexplicativo, permitindo que consultores apresentem os resultados a seus clientes de forma profissional.

## 5. Conclusão

Com este detalhamento, você dispõe de uma visão granular das abas “Resumo das informações”, “Investimentos – Não Aposentado” e “Investimentos – Aposentado”.  Foram descritos os campos de entrada, a lógica das fórmulas e exemplos numéricos para cada cenário de simulação【121565495234456†screenshot】.  Seguindo as recomendações, é possível construir um simulador web completo, didático e profissional, que reproduza fielmente a lógica da planilha e ainda ofereça uma experiência amigável e clara aos usuários.