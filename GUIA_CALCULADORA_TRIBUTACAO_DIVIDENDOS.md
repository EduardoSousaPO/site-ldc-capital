# Guia da Calculadora de Tributacao de Dividendos (LDC Capital)

## 1) Visao geral

Esta ferramenta foi criada para simular o impacto da Lei 15.270/2025 sobre distribuicao de dividendos no Brasil, com foco em:

- calculo do IRRF mensal por fonte pagadora;
- calculo completo do IRPFM anual com transparencia;
- comparativo estrategico entre cenarios de remuneracao;
- simulador de regime tributario (Simples, Lucro Presumido, Lucro Real);
- geracao de relatorio PDF para lead magnet.

Pagina da ferramenta:

- `/calculadora-tributacao-dividendos-2026`

Observacao:

- a pagina esta marcada como `noindex/nofollow` para nao indexacao em buscadores.

---

## 2) O que a ferramenta entrega

### 2.1 Resultado tributario principal

- Dividendos anuais totais;
- IRRF mensal e anual;
- Base anual do IRPFM;
- Aliquota IRPFM aplicada;
- IRPFM bruto;
- Deducoes detalhadas;
- Redutor por empresa (quando ativado);
- IRPFM adicional devido;
- Imposto total estimado (IRRF + IRPFM);
- Valor liquido anual e impacto percentual.

Regra de preenchimento para evitar dupla contagem:

- se o usuario preencher o bloco de **fontes detalhadas**, a calculadora usa essas fontes como base dos dividendos;
- nesse caso, o campo inicial de retirada mensal passa a ser apenas referencia visual e nao e somado novamente.

### 2.2 Camadas de analise

- Composicao da renda global (grafico);
- Passo a passo do IRPFM;
- Comparativo de cenarios A/B/C/D (cards + grafico);
- Dashboard de diferimento do clube vs compra direta na PF;
- Tabela anual de eficiencia tributaria em 5 e 10 anos;
- Simulador de regime (Simples vs LP vs LR);
- Alertas contextuais inteligentes.

### 2.3 Conversao de lead

- Captura de `nome`, `email`, `telefone` e consentimento;
- Persistencia no Supabase;
- Envio para Google Sheets (configurado no projeto);
- Geracao de relatorio PDF/HTML para download.

---

## 3) Logica tributaria implementada

## 3.1 IRRF sobre dividendos

- Aliquota: `10%`;
- Limiar: `R$ 50.000/mes`, por fonte pagadora;
- Efeito degrau: ao ultrapassar `R$ 50.000`, o IRRF incide sobre o valor total da fonte no mes;
- Nao residente: IRRF de 10% em qualquer valor (sem limiar);
- Fontes isentas/excluidas (ex.: FII/Fiagro e titulos isentos) nao sofrem IRRF na simulacao.

### 3.1.1 Ativos que entram na tributacao de 10% (IRRF e IRPFM)

- **Empresas brasileiras** (S/A, LTDA) — dividendos de acoes;
- **Dividendos de acoes brasileiras** recebidos via corretora;
- **Fonte no exterior** — dividendos de empresas estrangeiras;
- **Outras fontes tributaveis** — dividendos de outras origens sujeitas à lei.

### 3.1.2 Ativos que entram na base anual do IRPFM (sem regra mensal de R$ 50 mil)

- **CDB/RDB/Tesouro Direto e titulos de renda fixa tributaveis**;
- **Debentures comuns (nao incentivadas)**;
- **Fundos e ETFs tributaveis** (quando nao enquadrados em isencao legal).

### 3.1.3 Ativos que NAO entram (isentos/excluidos)

- **FIIs** — desde que cotas negociadas em bolsa e fundo com pelo menos 100 cotistas;
- **Fiagros**;
- **Debentures incentivadas e FI-Infra**;
- **LCI, LCA, CRI, CRA**;
- **Caderneta de poupanca**.

Na calculadora, cada fonte mostra dois indicadores em tempo real:
- **Regra R$ 50 mil (IRRF mensal)**: SIM/NAO;
- **Base IRPFM anual**: ENTRA/NAO ENTRA.

Isso reduz erro de classificacao e deixa nitido o efeito de cada ativo no calculo.

## 3.2 IRPFM anual

Gatilho:

- base anual acima de `R$ 600.000`.

Aliquota:

- ate `R$ 600.000`: `0%`;
- de `R$ 600.001` ate `R$ 1.200.000`: progressiva linear;
- acima de `R$ 1.200.000`: `10%` (teto).

Formula usada na faixa progressiva:

- `((base - 600000) / 600000) * 0.10`

Deducoes consideradas:

- IRPF progressivo (informado ou estimado automaticamente);
- IRRF de dividendos calculado (se checkbox ativo);
- outros creditos de IRRF;
- tributacao offshore;
- tributacao definitiva;
- outras deducoes manuais;
- redutor por empresa.

Tratamento de outras rendas no fluxo simplificado:

- salario CLT e alugueis entram como **rendimentos tributaveis anuais**;
- FIIs seguem como fonte separada e, quando isentos/requisitos atendidos, ficam fora da base do IRPFM.

Resultado final:

- `IRPFM devido = max(0, IRPFM bruto - deducoes totais)`

## 3.3 Redutor por empresa

Para cada empresa informada no bloco de redutor:

- `aliquota efetiva PJ = (IRPJ + CSLL pagos) / lucro contabil`
- soma com aliquota efetiva do IRPFM;
- compara com teto do tipo de empresa (`34%`, `40%`, `45%`);
- aplica credito quando houver excedente;
- limita o credito ao saldo de IRPFM devido.

---

## 4) Comparativo de cenarios (consultivo)

## 4.1 Cenario A - Status Quo

- Remuneracao integral via dividendos;
- calcula carga total no modelo atual.

## 4.2 Cenario B - Mix Otimizado

- pro-labore alvo de `R$ 5.000/mes`;
- dividendos limitados ao limiar mensal;
- restante estimado como JCP;
- considera INSS patronal/socio, IRRF de JCP e beneficio fiscal estimado.
- se o regime informado for **Simples**, o cenario B nao forca JCP;
- se marcado **"empresa ja paga JCP"**, o cenario B nao assume JCP incremental.

## 4.3 Cenario C - Via Holding

- distribuicao controlada via holding com diferimento;
- adiciona custo anual estimado da holding;
- apresenta diferimento estimado e break-even mensal.
- se marcado **"ja existe holding no grupo"**, o custo incremental da estrutura e zerado no cenario C.

## 4.4 Cenario D - Clube de Investimento

- uso voltado para carteira de bolsa que pode permanecer investida, nao para caixa pessoal imediato;
- patrimonio minimo considerado: `R$ 1.000.000`;
- taxa anual parametrizada entre `0,75%` e `1,5%` sobre o patrimonio do clube;
- compara o custo da estrutura com o diferimento fiscal da compra direta na PF;
- exige premissas explicitas de:
  - patrimonio alocado ao clube;
  - proventos anuais que seriam tributados na PF sem diferimento;
  - numero de cotistas;
  - percentual da carteira em acoes brasileiras;
  - taxa anual da corretora;
  - crescimento anual da carteira;
- gera painel comparativo com:
  - imposto acumulado sem diferimento;
  - custo acumulado do clube;
  - beneficio liquido acumulado (pre-resgate);
  - eficiencia tributaria media em 5 e 10 anos.

Observacao de modelagem:

- no painel do clube, o beneficio representa **diferimento (adiamento) de imposto**;
- tributacao de resgate/saida futura nao e modelada nesse comparativo.

Saidas por cenario:

- carga tributaria total em R$ e %;
- liquido ao socio;
- economia anual vs cenario A;
- breakdown de tributos por linha.

---

## 5) Simulador de regime tributario (PJ + PF)

Com os dados da empresa, a ferramenta estima:

- Simples Nacional;
- Lucro Presumido;
- Lucro Real.

Para cada regime:

- tributo corporativo estimado;
- tributo na pessoa fisica (IRRF + IRPFM);
- carga total consolidada;
- regime de menor carga destacado.

---

## 6) Engine de alertas contextuais

A ferramenta gera alertas com severidade:

- `warning` (atencao),
- `opportunity` (oportunidade),
- `success` (situacao favoravel).

Regras principais cobertas:

- efeito degrau;
- FII/Fiagro excluido da base;
- proximidade do limiar do IRPFM;
- redutor zerando IRPFM;
- oportunidade de mix pro-labore/JCP;
- impacto no Lucro Presumido;
- diluicao por multiplas fontes;
- nao residente;
- incerteza juridica no Simples;
- oportunidade de holding;
- oportunidade de avaliar clube de investimento em contexto patrimonial.

---

## 7) Relatorio PDF

Fluxo:

1. usuario conclui simulacao;
2. preenche lead;
3. lead salvo;
4. PDF gerado e baixado.

Conteudo do relatorio:

- resumo executivo;
- detalhamento por fonte;
- calculo do IRPFM passo a passo;
- composicao da renda global;
- comparativo de cenarios;
- premissas do cenario de clube de investimento (quando ativado);
- dashboard de diferimento do clube (5 e 10 anos);
- tabela anual de eficiencia tributaria no cenario de clube;
- alertas e premissas;
- disclaimer juridico-contabil.

Se o PDF falhar, o endpoint devolve HTML de fallback para nao quebrar o fluxo.

---

## 8) Integracao com lead e Google Sheets

Endpoint:

- `POST /api/dividend-tax/lead`

Acoes:

- grava cliente no Supabase (`Client`);
- envia lead para Google Sheets se variaveis estiverem configuradas;
- dispara email quando provider de email estiver configurado.

Campos enviados para planilha:

- nome, email, telefone, faixa de patrimonio (mapeada), origem e observacoes.

Documento de referencia de setup:

- `docs/GOOGLE_SHEETS_SETUP.md`

---

## 9) Estrutura tecnica principal

Arquivos de dominio/calculo:

- `src/lib/dividend-tax/tax-constants.ts`
- `src/lib/dividend-tax/types.ts`
- `src/lib/dividend-tax/validators.ts`
- `src/lib/dividend-tax/alerts-engine.ts`
- `src/lib/dividend-tax/calculator.ts`
- `src/lib/dividend-tax/report-template.ts`
- `src/lib/dividend-tax/pdf-generator.ts`

UI:

- `src/components/dividend-tax/DividendTaxCalculator.tsx`
- `src/components/dividend-tax/IncomeCompositionChart.tsx`
- `src/components/dividend-tax/ScenarioComparisonChart.tsx`
- `src/components/dividend-tax/RegimeComparisonChart.tsx`

Pagina e APIs:

- `src/app/calculadora-tributacao-dividendos-2026/page.tsx`
- `src/app/api/dividend-tax/calculate/route.ts`
- `src/app/api/dividend-tax/lead/route.ts`
- `src/app/api/dividend-tax/report/route.ts`

---

## 10) Exemplos de uso (teste manual)

## Exemplo A - Residente com efeito degrau

Preencher:

- Residencia: `Pessoa fisica residente`;
- Fonte 1: `Empresa A`, `R$ 80.000/mes`, `12 meses`, tipo `empresa_brasil`;
- Outras rendas tributaveis anuais: `R$ 120.000`;
- Fluxo unico (dados essenciais).

Comportamento esperado:

- IRRF mensal da fonte: `R$ 8.000`;
- IRRF anual: `R$ 96.000`;
- Base IRPFM acima de R$ 600 mil;
- IRPFM bruto calculado;
- com creditos, IRPFM adicional pode zerar;
- alerta de efeito degrau ativo.

## Exemplo B - Multiplas fontes abaixo do limiar

Preencher:

- Fonte 1: `R$ 45.000/mes`;
- Fonte 2: `R$ 45.000/mes`;
- ambas `empresa_brasil`, 12 meses.

Comportamento esperado:

- IRRF mensal por fonte = `R$ 0` (limiar por fonte pagadora);
- possivel alerta de diluicao eficiente.

## Exemplo C - Nao residente

Preencher:

- Residencia: `PF nao residente`;
- Fonte: `R$ 10.000/mes`, 12 meses, `empresa_brasil`.

Comportamento esperado:

- IRRF mensal = `R$ 1.000` (sem limiar);
- alerta especifico de nao residente.

## Exemplo D - Redutor ativo

Preencher (secao \"Refinar dados da empresa\"):

- ativar `Ativar redutor por empresa`;
- adicionar empresa com lucro contabil, IRPJ+CSLL e dividendos ao socio;
- usar base anual alta (ex.: renda global > `R$ 1.200.000`).

Comportamento esperado:

- bloco de redutor preenchido no passo a passo;
- quando aplicavel, IRPFM adicional reduzido ou zerado;
- alerta de redutor ativo quando zera o imposto adicional.

---

## 11) Exemplos de payload API

## 11.1 Calculo

Endpoint:

- `POST /api/dividend-tax/calculate`

Payload minimo (resumo):

```json
{
  "residency": "residente",
  "sources": [
    {
      "id": "src-1",
      "name": "Empresa A",
      "monthlyAmount": 80000,
      "monthsReceived": 12,
      "sourceType": "empresa_brasil"
    }
  ],
  "annualIncomes": {
    "otherTaxableAnnualIncome": 120000,
    "otherExclusiveAnnualIncome": 0,
    "otherExemptAnnualIncome": 0,
    "excludedFromIrpfmAnnual": 0
  },
  "deductions": {
    "includeCalculatedIrrfCredit": true,
    "additionalIrrfCredits": 0,
    "irpfProgressivePaid": 0,
    "offshorePaid": 0,
    "definitivePaid": 0,
    "manualOtherDeductions": 0
  },
  "enableRedutor": false,
  "redutorCompanies": [],
  "business": {
    "regimeTributario": "lucro_presumido",
    "atividadePrincipal": "servicos_geral",
    "faturamentoAnual": 2400000,
    "margemLucroPercentual": 35,
    "folhaAnual": 300000,
    "numeroSocios": 1,
    "participacaoSocioPercentual": 100,
    "percentualDistribuicaoLucro": 100,
    "jaPagaJcp": false,
    "temHolding": false
  }
}
```

## 11.2 Lead + relatorio

1. `POST /api/dividend-tax/lead`
2. `POST /api/dividend-tax/report` (com `input` e `leadName`)

---

## 12) Comandos uteis

Subir local:

```bash
npm run dev
```

Build de validacao:

```bash
npm run build
```

Testes da calculadora:

```bash
npm run test:dividend-tax
```

---

## 13) Disclaimer obrigatorio

Esta ferramenta gera simulacoes estimativas com base em parametros informados e premissas de modelo. Nao substitui consultoria tributaria, contabil ou juridica individualizada.
