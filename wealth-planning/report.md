# Plano de desenvolvimento para transformar a planilha de planejamento de vida em um app/web

## Introdução

Para transformar a planilha **“Planejamento Contexto de vida”** num site ou aplicativo simples de usar, é importante mapear cada seção da planilha, entender quais campos são entradas do usuário e quais são calculados por fórmulas financeiras.  A seguir está um plano completo dividido pelas abas da planilha.  Esse plano pode servir como base para criar um aplicativo em Dash, Streamlit ou outro framework e, ao final, gerar um PDF com gráficos, valores e explicações.

### Visão geral das abas

| Aba | Função principal |
| --- | --- |
| **Introdução** | Contém apenas uma célula com o texto “Cliente Atual”, servindo como introdução visual da planilha【121565495234456†screenshot】. |
| **Resumo das informações** | Reúne todas as entradas básicas do usuário: dados pessoais (nome, idade, dependentes), informações financeiras atuais, objetivo de investimento e premissas macroeconômicas.  Também agrupa bens móveis/imóveis, projetos pessoais e dívidas【121565495234456†screenshot】. |
| **Investimentos – Não Aposentado** | Calcula projeções de patrimônio e necessidade de capital para quem ainda não se aposentou.  Simula três cenários de aposentadoria (cenário atual, manutenção do patrimônio e consumo do patrimônio) e estimativas de rentabilidade necessária【121565495234456†screenshot】. |
| **Investimentos – Aposentado** | Projeta o fluxo de caixa para quem já se aposentou.  Usa as entradas de patrimônio acumulado, renda desejada e perfil de risco para determinar a durabilidade do capital em diferentes carteiras (atual, renda vitalícia, consumo do patrimônio)【121565495234456†screenshot】. |
| **Proteção Familiar** | Calcula necessidades de proteção imediata, planejamento sucessório e seguro de vida.  Considera despesas mensais, despesas póstumas, projetos de vida/financiamentos e liquidez necessária para inventário【121565495234456†screenshot】. |
| **Investimentos – Projetos** | Simula projetos específicos (ex.: compra de um bem, viagem ou educação) utilizando fórmulas de fluxo de caixa (PMT, PV, FV) e compara o cenário atual com um novo cenário de aportes【121565495234456†screenshot】. |
| **Erro** | Aba em branco usada para capturar mensagens de erro. |

## 1. Abas de entrada de dados

### 1.1 Resumo das informações

Esta aba funciona como um formulário.  Os campos estão organizados em seções.  Os títulos apresentados na primeira coluna (coluna 4 e seguintes da planilha) podem ser replicados como labels em formulários do site.

#### Dados básicos

- **Nome** (`Resumo das informações!E6`): nome do cliente, ex.: “Marcos”【121565495234456†screenshot】.  Entrada obrigatória.
- **Idade** (`I6`): idade atual (24 no exemplo)【121565495234456†screenshot】.
- **Dependentes**: tabela com colunas *Nome*, *Idade* e *Observações*.  Cada linha da tabela deve permitir adicionar/remover dependentes.
- **Idade de aposentadoria** (`I7`): idade desejada para aposentadoria (50 no exemplo).  Será usada no cálculo de projeções.
- **Linha de vida** (`I8`): expectativa de vida (80 no exemplo)【121565495234456†screenshot】.
- **Estado civil** (`H9`): estado civil (solteiro, casado, etc.).
- **Profissão** (`H10`): profissão do cliente.
- **Suitability** (`I10`): perfil de risco (Conservador, Moderado, Moderado‑Agressivo, Agressivo).  É usada para checar se a rentabilidade necessária está dentro do perfil.

#### Planejamento de aposentadoria

- **Despesa familiar mensal** (`F13`): despesas correntes da família (ex.: 10 000 R$)【121565495234456†screenshot】.
- **Renda mensal desejada na aposentadoria** (`I13`): renda mensal que o cliente deseja receber quando se aposentar (ex.: 40 000 R$)【121565495234456†screenshot】.
- **Poupança mensal** (`F14`): valor poupado mensalmente atualmente (0 no exemplo)【121565495234456†screenshot】.  O programa pode converter para poupança anual (multiplicando por 12).
- **Receitas mensais previstas na aposentadoria** (`I14`): outras receitas na aposentadoria, como aluguel ou pensão (0 no exemplo).
- **Objetivo dos investimentos** (`H15`): lista de opções (“Preservar capital”, “Acumular Recursos”, “Especular”).  Deve ser um seletor, pois influencia o cenário de investimentos.

#### Composição da carteira atual

Uma tabela lista o **Ativo**, o **Valor** investido, a **% da carteira** e a **rentabilidade (%CDI)** para cada tipo de investimento【121565495234456†screenshot】.

- Linha “Carteira”: representa a carteira de investimentos, com valor total e rentabilidade associada ao CDI (0,097 ou 9,7% ao ano no exemplo).  O site deve permitir ao usuário informar o valor investido e a rentabilidade bruta estimada.
- Linha “Previdência”: valor investido em previdência privada.  No exemplo está 0, mas o campo deve existir.
- A soma dos ativos forma o **Total** (1 000 000 R$ no exemplo) e a soma das proporções deve ser 100 %.  O site pode recalcular essas proporções automaticamente.

#### Imposto de renda e liquidez

- **I.R considerado** (`I23`): opção “Sem considerar I.R” ou “Considerando I.R”.  Afeta o cálculo de rentabilidade líquida.
- **Necessidade de liquidez imediata (%)** (`I23`): porcentagem do patrimônio que deve estar líquido para emergências (0,2 → 20 % no exemplo).

#### Bens móveis/imóveis

Uma tabela permite listar cada bem (casa, veículo, etc.), com campos:

- **Valor** (`Resumo das informações!F26`): valor estimado do bem (0 para a casa própria no exemplo)【121565495234456†screenshot】.
- **Vendável?** (`H26`): indica se o bem pode ser vendido rapidamente (Sim/Não).
- **Renda de aluguel** (`I26`): renda mensal obtida com o bem (caso haja).

#### Projetos pessoais e familiares

Seção “Pessoais e familiares” contém uma tabela com colunas **P/F** (indica se o projeto é pessoal ou familiar), **Montante** e **Prazo**.  É usada para financiar objetivos específicos, como um casamento, viagem ou troca de carro.  Os valores dessas células são utilizados na aba **Investimentos – Projetos**.

#### Premissas macroeconômicas

- **Inflação anual** (`E41`): taxa de inflação esperada (3,5 % no exemplo)【121565495234456†screenshot】.
- **CDI anual** (`F41`): taxa base de referência (9,7 % no exemplo).  Pode ser usada para estimar rentabilidades futuras.
- **Rentabilidade aposentadoria sem considerar I.R** (`H41`): taxa nominal de retorno considerada para aposentadoria (9,7 % no exemplo)【121565495234456†screenshot】.
- **Juro real na aposentadoria** (`I41`): taxa real obtida após descontar inflação (5,99 % no exemplo)【121565495234456†screenshot】.

#### Planejamento educacional

Uma subseção lista ciclos de ensino (“Pré Escola”, “Ensino Fundamental”, “Ensino Médio”, “Ensino Superior”, “Pós Graduação”) com custos estimados.  Esses valores podem ser entradas no app, permitindo ao usuário planejar educação de filhos.

#### Despesa familiar e contribuições

- **Despesa familiar mensal** (`F57`) é repetida para determinar a contribuição do cônjuge ou de outras fontes (campo “% de Contribuição”, valor 1 no exemplo)【121565495234456†screenshot】.

#### Dívidas/Financiamentos

Há uma tabela “Financiamentos/Dívidas” com colunas **Saldo Devedor**, **Prazo para saldar** e **Com Seguro de Vida?**.  O usuário insere cada dívida, o prazo e informa se existe seguro de vida associado.  Essa informação é usada na aba **Proteção Familiar** para determinar a necessidade de cobertura.

#### Outras receitas

Entradas de outras receitas como **FGTS** (Fundo de Garantia por Tempo de Serviço) ou aluguel são preenchidas com valor e observação【121565495234456†screenshot】.  Estas receitas são consideradas na projeção de fluxo de caixa.

### 1.2 Investimentos – Projetos (entradas)

Os projetos pessoais informados em **Resumo das informações** (nomes, montantes e prazos) são usados aqui.

- Para cada projeto, o app deve perguntar **quantos anos** até a realização (prazo) e **valor total** desejado (montante).  Exemplo: “Projeto 1: viagem de 50 000 R$ em 10 anos; Projeto 2: compra de carro por 80 000 R$ em 5 anos”, etc.
- Os campos do Excel usam fórmulas condicionais para exibir ou ocultar projetos quando o valor é zero.  No app, isso se traduz em adicionar/remover linhas dinamicamente.

## 2. Abas de cálculos de investimentos

### 2.1 Investimentos – Não Aposentado

Esta aba calcula o patrimônio futuro e a renda de aposentadoria para quem ainda não se aposentou.  O app deve replicar três cenários principais:

1. **Cenário 1 (Cenário atual):** Mantém a idade de aposentadoria e a poupança anual conforme entrada do usuário.  O objetivo é projetar o capital acumulado com a rentabilidade esperada e verificar se será suficiente para a renda desejada.
2. **Cenário 2 (Manutenção do patrimônio – linha verde):** Normalmente considera um valor de poupança anual maior e uma idade de aposentadoria posterior (ex.: 75 anos).  A ideia é que o patrimônio seja preservado e a renda seja gerada apenas com seus rendimentos (viver de renda).  Na planilha, essa estratégia gera um valor projetado (“Caso 1: Viver de renda” – R$ 8.012.903,23 no exemplo)【121565495234456†screenshot】.
3. **Cenário 3 (Consumo do patrimônio – linha vermelha):** Considera retirar parte do capital principal durante a aposentadoria, permitindo antecipar a aposentadoria ou reduzir o esforço de poupança.  Na planilha, esse caso fornece outro valor mínimo de capital (“Caso 2: Consumo do patrimônio” – R$ 6.613.955,25 no exemplo)【121565495234456†screenshot】.

#### Fórmulas utilizadas

Para replicar os cálculos, algumas fórmulas clássicas devem ser implementadas em Python (usando `numpy` ou `numpy_financial`):

- **Valor Futuro (FV):** `FV(rate, nper, pmt, pv, when)`.  A planilha utiliza `=FV` para estimar quanto o patrimônio crescerá até a aposentadoria.  O `rate` é a rentabilidade real anual (ex.: 5,99 %), `nper` é o número de períodos (anos até a aposentadoria), `pmt` é a poupança anual (negativa porque é um aporte) e `pv` é o valor atual da carteira.
- **Valor Presente (PV):** `PV(rate, nper, pmt, fv, when)`.  Usado para descontar valores futuros na projeção de renda e determinar quanto capital é necessário hoje para garantir determinada renda na aposentadoria.
- **Pagamento (PMT):** `PMT(rate, nper, pv, fv, when)`.  Utilizado na aba **Investimentos – Projetos** para calcular o fluxo de caixa necessário para atingir determinado montante no futuro.
- **Taxa Real:** calculada pela fórmula `(1 + taxa_nominal)/(1 + inflação) – 1` para transformar uma taxa nominal em real.  A planilha guarda o valor em `i_real_atual` (por exemplo, 5,99 % ao ano)【121565495234456†screenshot】.

#### Passos de cálculo

1. **Converter entradas mensais em anuais:** multiplicar `Despesa familiar mensal`, `Renda mensal desejada` e `Poupança mensal` por 12 para trabalhar com valores anuais.
2. **Determinar o número de anos até a aposentadoria:** `n_anos = idade_aposentadoria – idade_atual`.
3. **Simular contribuição anual (pmt) e rentabilidade:** usar a função `npf.fv` (ou fórmula manual) para projetar o valor futuro da carteira:
   
   ```python
   import numpy_financial as npf
   capital_futuro = npf.fv(taxa_real, n_anos, -poupanca_anual, -carteira_atual)
   ```
   O sinal negativo reflete que aportes e valores presentes são saídas de caixa.

4. **Calcular o capital necessário para a aposentadoria:**
   - **Cenário de manutenção do patrimônio (viver de renda):** o capital deve ser suficiente para gerar uma renda anual igual à renda desejada dividida pela taxa real esperada na aposentadoria.  Por exemplo, se a renda desejada anual é `R_desejada` e a taxa real é `i_realaposentadoria`, então `capital_necessario = R_desejada / i_realaposentadoria`.  A planilha calcula um valor semelhante (`8012903,23 R$` no exemplo)【121565495234456†screenshot】.
   - **Cenário de consumo do patrimônio:** o capital necessário é menor porque o investidor consome parte do principal.  Usa `npf.pv` para obter o valor presente de uma anuidade com término (prazo = expectativa de vida – idade de aposentadoria).  Exemplo:

   ```python
   anos_aposentado = linha_de_vida - idade_aposentadoria
   capital_necessario_consumo = npf.pv(taxa_real, anos_aposentado, -renda_anual_desejada, 0)
   ```

5. **Calcular a rentabilidade necessária:** comparar o capital futuro projetado (da carteira atual + poupança) com o capital necessário.  Se o capital futuro for menor que o necessário, calcular a taxa que equilibra.  No Excel, linhas de “Rentabilidade necessária – Nominal bruta / Real líquida” mostram as taxas requeridas para atingir o objetivo nos diferentes cenários (por exemplo, 9,66 % nominal e 5,95 % real no cenário 2)【121565495234456†screenshot】.  Em Python, pode-se resolver a taxa com a função `numpy_financial.rate` ou por iteração numérica.

6. **Checar perfil de risco:** o perfil de risco escolhido (suitability) limita a rentabilidade recomendada.  Se a rentabilidade necessária for muito alta para um perfil conservador, o app deve sinalizar.

#### Saídas e gráficos para o app

O app deve apresentar:

- **Gráfico de evolução do patrimônio:** idade no eixo x e valor projetado da carteira no eixo y.  Traçar três curvas: projeção atual (linha preta), manutenção do patrimônio (linha verde) e consumo do patrimônio (linha vermelha).  Esses valores são calculados nas colunas **AV**, **AW**, **AX**, **AY** na planilha para cada idade【121565495234456†screenshot】.
- **Tabela resumida:** mostrar para cada cenário: poupança anual, idade de aposentadoria, capital acumulado, capital necessário, rentabilidade necessária e se está dentro do perfil.
- **Alertas:** se o capital projetado não atingir o necessário, sugerir aumentar poupança, postergar aposentadoria ou aceitar rentabilidade maior.

### 2.2 Investimentos – Aposentado

Esta aba adapta o modelo para alguém já aposentado.  Os principais campos de entrada são:

- **Nome** (`F5`), **Idade** (`F6`), **Linha de vida** (`H6`)【121565495234456†screenshot】.
- **Patrimônio financeiro acumulado** (`L5`): valor atual do capital financeiro (13.850.000 R$ no exemplo).  O app deve permitir ao usuário informar esse valor.
- **Patrimônio não financeiro acumulado** (`L6`): soma de imóveis e outros bens.  Pode ser zero se o objetivo for focar em aplicações financeiras.
- **Receitas previstas** (`P6`): outras fontes de renda na aposentadoria, como INSS ou aluguéis.  A fórmula na planilha soma `dados_receitaaposentadoria` e alguns valores do resumo【121565495234456†screenshot】.
- **Renda mensal desejada** (`N5`): valor desejado de renda na aposentadoria, definido no “Resumo das informações”【121565495234456†screenshot】.
- **Perfil de investidor** (`R5`/`T5`): adequado para verificar o risco.

Assim como na aba anterior, a planilha simula carteiras:

1. **Carteira atual (PV)** – projeção se o investidor mantiver a carteira e sacar da rentabilidade apenas.
2. **Carteira renda vitalícia** – assume uma carteira específica de títulos que pagam renda vitalícia (rentabilidade na célula `M43`).
3. **Carteira consumo patrimônio financeiro** – aceita que o investidor consuma parte do principal (rentabilidade na célula `P43`).
4. **Carteira consumo patrimônio total** – inclui consumo do patrimônio financeiro e não financeiro (rentabilidade na célula `T43`).

As fórmulas principais repetem as de PV/FV/PMT, mas agora os fluxos de caixa são de saques.  Por exemplo, a célula `AX4` calcula a carteira atual no ano seguinte:

```
AX4 = (AX3 * (1 + i_real_atual)) – (renda_extra_necessaria * 12)
```

onde **renda_extra_necessaria** é a diferença entre a renda desejada e a renda prevista, ajustada para inflação【121565495234456†screenshot】.  O app deve calcular ano a ano até o final da vida e verificar quando o patrimônio se esgota.

O resultado final inclui:

- **Renda média gerada pelo patrimônio financeiro** (`AR3`)【121565495234456†screenshot】.
- **Idade de sobrevivência do patrimônio** (última idade em que o patrimônio permanece positivo).
- **Projeção dos saldos** para cada carteira, que podem ser exibidas em um gráfico semelhante ao da aba anterior.

### 2.3 Investimentos – Projetos (cálculo)

Esta aba trabalha com projetos específicos.  Para cada projeto:

1. **Fluxo de investimento atual (cenário 1):** usa a função `PMT_atual` (pagamento atual) para calcular o valor que deve ser poupado a cada ano para alcançar o montante desejado em determinado prazo.  A fórmula condicional do Excel testa se a soma dos projetos é zero; se for, retorna zero; caso contrário, usa `PMT_atual`.
2. **Fluxo de investimento novo (cenário 2):** permite alterar o cronograma dos projetos (prazos diferentes, montantes maiores ou menores).  A função `PMT_novo` calcula a nova contribuição anual para cada projeto.  Há colunas para cada projeto (Projeto 1, Projeto 2, Projeto 3), a soma dos projetos e o fluxo de caixa líquido.
3. **Fluxo de empréstimos** (`AK2`) pode ser incluído se o usuário optar por financiar parte do projeto.  A planilha calcula se algum empréstimo é necessário (por exemplo, quando o valor investido é insuficiente).

O app deve exibir para cada projeto:

- Montante desejado.
- Prazo.
- Contribuição anual necessária no cenário atual versus cenário novo.
- Impacto no fluxo de caixa (quanto o usuário precisa investir ou tomar emprestado).

## 3. Proteção Familiar

Esta aba é destinada a calcular a necessidade de cobertura de seguro de vida e planejamento sucessório.  As principais entradas vêm da aba **Resumo das informações**:

- **Despesa mensal atual** (`J4`)【121565495234456†screenshot】.
- **Renda mensal desejada na aposentadoria** (`J5`)【121565495234456†screenshot】.
- **Capacidade de poupança anual** (`J6` – nesta aba normalmente é 0)【121565495234456†screenshot】.
- **Dados de idade e aposentadoria** para o titular.

#### Necessidade de proteção imediata

É calculada com base em:

- **Gastos anuais (Total_Despesa_familiar_mensal × 12)** – estimativa do valor que a família precisa para manter o padrão de vida anual【121565495234456†screenshot】.
- **Receitas futuras** – valor presente das receitas futuras (salários, aluguéis) calculado em `Total_Projeção_Receitas_Futuras`【121565495234456†screenshot】.
- **Capacidade de poupança anual** – afeta a necessidade de capital para substituir a renda do falecido.

Com esses dados, a planilha estima o **capital para aposentadoria** e a **necessidade de proteção familiar** (quanto de seguro de vida é necessário).  O campo `Proteção Familiar` mostra um valor (ex.: 3.704.000 R$) que cobre as necessidades de manutenção do padrão de vida da família em caso de falecimento do provedor【121565495234456†screenshot】.

#### Planejamento sucessório

Além da proteção imediata, a aba calcula:

- **Necessidade de liquidez para sucessão** – recursos necessários para custear impostos (ITCMD) e inventário.  A planilha considera uma alíquota de **encargos sucessórios** de 12 % (`Encargos Sucessórios`) sobre o patrimônio【121565495234456†screenshot】.
- **Planejamento de sucessão** – valor para cobrir herdeiros e despesas póstumas.  A tabela na aba lista itens como: educação, manutenção do padrão de vida, projetos/financiamentos, liquidez para inventário, despesas póstumas e reestabelecimento de vida, cada um com sua necessidade de capital e período (vitalício ou número de anos)【121565495234456†screenshot】.

#### Patrimônio e inventário

Outra tabela na mesma aba lista todos os **bens** (carteira de investimentos, casa própria, veículo, FGTS, seguros de vida, alugueis, INSS, etc.).  Para cada item, o usuário deve indicar:

- **Valor do bem**.
- **Se o valor será utilizado para manter padrão de vida** (Sim/Não).
- **Inventário?** – se o valor entra no inventário e está sujeito a custos sucessórios.

Com essas informações, o app calcula o patrimônio total, o patrimônio sujeito a inventário e o valor líquido que ficará disponível.  Esses cálculos suportam a seção de planejamento sucessório.

#### Saídas esperadas

O app deve gerar:

- **Valor de proteção familiar** necessário para cobrir gastos e projetos em caso de falecimento.
- **Valor de liquidez para sucessão** para custear impostos e inventário.
- **Projeção de receitas futuras**.
- **Gráficos** comparando o patrimônio atual vs. necessidade de proteção.
- **Explicações** sobre como cada valor foi calculado (por exemplo, capital para manutenção do padrão de vida = despesas anuais divididas pela taxa real de retorno, descontado das receitas futuras).

## 4. Construção do site/app

1. **Coleta de dados:** criar formulários para cada seção descrita na aba **Resumo das informações** e **Investimentos – Projetos**.  Use campos de texto, números, listas suspensas e tabelas dinâmicas para dependentes, bens e projetos.
2. **Validação:** verificar se todos os campos obrigatórios foram preenchidos (nome, idade, despesas, renda desejada).  Validar que porcentagens somam 100 % na alocação da carteira.
3. **Cálculos:** implementar as fórmulas de FV, PV, PMT e taxa real em funções Python.  Usar bibliotecas como `numpy` ou `numpy_financial`.  Mapear cada cenário (atual, manutenção do patrimônio, consumo do patrimônio) e simular ano a ano a evolução do capital.
4. **Visualização:** usar bibliotecas de gráficos como **Plotly** ou **Matplotlib** para gerar os gráficos de projeção de patrimônio e barras comparando capital necessário vs. capital projetado.
5. **Geração de PDF:** após preencher o formulário e rodar as simulações, o usuário deve ter a opção de gerar um relatório em PDF.  Utilize ferramentas como **ReportLab**, **WeasyPrint** ou **wkhtmltopdf** para converter um template HTML com os resultados e gráficos em PDF.  O relatório deve incluir:
   - Resumo das informações do cliente.
   - Tabelas e gráficos de projeções de investimento para cada cenário.
   - Tabelas de projetos e financiamentos.
   - Cálculos de proteção familiar e planejamento sucessório, com explicações.
6. **Usabilidade:** a interface deve ser intuitiva, com passos claros (“Dados pessoais”, “Planejamento de aposentadoria”, “Projetos”, “Proteção familiar”).  Permita salvar a sessão ou exportar os dados para continuar posteriormente.  Inclua descrições e tooltips para cada campo (por exemplo, explicar o que significa “Linha de vida” ou “Rentabilidade real”).

## 5. Conclusão

Transformar a planilha de planejamento em um aplicativo web é viável e agrega valor para consultores independentes que desejam apresentar projeções financeiras de forma profissional e sem fricção.  O plano acima descreve cada campo importante, os valores de exemplo e as fórmulas utilizadas【121565495234456†screenshot】.  Replicar essas fórmulas em Python e organizar as seções em um fluxo lógico permitirá construir um app interativo que coleta dados, executa cálculos complexos, exibe gráficos claros e gera relatórios em PDF para clientes e prospects.