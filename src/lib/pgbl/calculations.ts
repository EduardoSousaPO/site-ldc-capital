/**
 * Cálculos para Simulador PGBL
 * 
 * Regras principais:
 * - Limite de dedução: 12% da renda bruta anual tributável
 * - Diferimento do IR: as contribuições são deduzidas da base de cálculo
 * - Tributação no resgate: IR incide sobre o total acumulado (contribuições + rendimentos)
 * - Tabela regressiva: alíquotas diminuem com o tempo (10% após 10 anos)
 * - Tabela progressiva: segue alíquotas do IR vigentes
 */

export interface PGBLInputs {
  rendaBrutaAnual: number;
  percentualAporte: number; // 0-12%
  periodoAnos: number;
  rentabilidadeAnual: number; // em percentual (ex: 9.7 = 9.7%)
  regimeTributacao: 'regressiva' | 'progressiva';
}

export interface PGBLResult {
  aporteAnual: number;
  beneficioFiscalAnual: number;
  valorBrutoAcumulado: number;
  valorLiquido: number;
  economiaFiscalTotal: number;
  projecaoAnual: ProjecaoAnual[];
}

export interface ProjecaoAnual {
  ano: number;
  aporte: number;
  saldoAnterior: number;
  rentabilidade: number;
  saldoBruto: number;
  irResgate: number;
  saldoLiquido: number;
  beneficioFiscal: number;
  economiaFiscalAcumulada: number;
}

// Tabela regressiva de IR (PGBL)
const TABELA_REGRESSIVA: Record<number, number> = {
  0: 35,   // até 2 anos
  2: 30,   // de 2 a 4 anos
  4: 25,   // de 4 a 6 anos
  6: 20,   // de 6 a 8 anos
  8: 15,   // de 8 a 10 anos
  10: 10,  // acima de 10 anos
};

// Tabela progressiva de IR (2024)
const TABELA_PROGRESSIVA = [
  { min: 0, max: 22847.76, aliquota: 0 },
  { min: 22847.77, max: 33919.80, aliquota: 7.5 },
  { min: 33919.81, max: 45012.60, aliquota: 15 },
  { min: 45012.61, max: 55976.16, aliquota: 22.5 },
  { min: 55976.17, max: Infinity, aliquota: 27.5 },
];

/**
 * Calcula a alíquota de IR na tabela regressiva baseada no tempo
 */
function getAliquotaRegressiva(anos: number): number {
  if (anos >= 10) return TABELA_REGRESSIVA[10];
  if (anos >= 8) return TABELA_REGRESSIVA[8];
  if (anos >= 6) return TABELA_REGRESSIVA[6];
  if (anos >= 4) return TABELA_REGRESSIVA[4];
  if (anos >= 2) return TABELA_REGRESSIVA[2];
  return TABELA_REGRESSIVA[0];
}

/**
 * Calcula a alíquota de IR na tabela progressiva baseada no valor
 */
function getAliquotaProgressiva(valor: number): number {
  for (const faixa of TABELA_PROGRESSIVA) {
    if (valor >= faixa.min && valor <= faixa.max) {
      return faixa.aliquota;
    }
  }
  return TABELA_PROGRESSIVA[TABELA_PROGRESSIVA.length - 1].aliquota;
}

/**
 * Calcula o IR devido na tabela progressiva
 */
function calcularIRProgressivo(valor: number): number {
  let ir = 0;
  let valorRestante = valor;

  // Ordena as faixas do maior para o menor
  for (let i = TABELA_PROGRESSIVA.length - 1; i >= 0; i--) {
    const faixa = TABELA_PROGRESSIVA[i];
    if (valorRestante > faixa.min) {
      const baseCalculo = Math.min(valorRestante, faixa.max) - faixa.min;
      if (baseCalculo > 0) {
        ir += (baseCalculo * faixa.aliquota) / 100;
        valorRestante = faixa.min;
      }
    }
  }

  return Math.max(0, ir);
}

/**
 * Calcula o benefício fiscal anual (economia de IR)
 */
export function calcularBeneficioFiscal(
  rendaBrutaAnual: number,
  aporteAnual: number
): number {
  // Limite de 12% da renda bruta
  const limiteDeducao = rendaBrutaAnual * 0.12;
  const aporteDedutivel = Math.min(aporteAnual, limiteDeducao);
  
  if (aporteDedutivel <= 0) return 0;
  
  // Calcula o IR que seria pago sem a dedução
  const irSemDeducao = calcularIRProgressivo(rendaBrutaAnual);
  
  // Calcula o IR com a dedução
  const rendaAposDeducao = rendaBrutaAnual - aporteDedutivel;
  const irComDeducao = calcularIRProgressivo(rendaAposDeducao);
  
  // Benefício fiscal = economia de IR
  return Math.max(0, irSemDeducao - irComDeducao);
}

/**
 * Calcula a projeção completa do PGBL
 */
export function calcularPGBL(inputs: PGBLInputs): PGBLResult {
  const {
    rendaBrutaAnual,
    percentualAporte,
    periodoAnos,
    rentabilidadeAnual,
    regimeTributacao,
  } = inputs;

  // Limite de 12% da renda bruta
  const limiteDeducao = rendaBrutaAnual * 0.12;
  const aporteAnual = Math.min(
    rendaBrutaAnual * (percentualAporte / 100),
    limiteDeducao
  );

  const taxaRentabilidade = rentabilidadeAnual / 100;
  const projecaoAnual: ProjecaoAnual[] = [];
  
  let saldoBruto = 0;
  let economiaFiscalAcumulada = 0;

  for (let ano = 1; ano <= periodoAnos; ano++) {
    const saldoAnterior = saldoBruto;
    const aporte = aporteAnual;
    
    // Calcula rentabilidade sobre o saldo anterior + aporte do ano
    const baseCalculo = saldoAnterior + aporte;
    const rentabilidade = baseCalculo * taxaRentabilidade;
    
    // Novo saldo bruto
    saldoBruto = baseCalculo + rentabilidade;
    
    // Calcula IR no resgate
    let irResgate = 0;
    if (regimeTributacao === 'regressiva') {
      const aliquota = getAliquotaRegressiva(ano);
      irResgate = saldoBruto * (aliquota / 100);
    } else {
      // Progressiva: considera o valor como renda adicional
      // Para PGBL, o IR incide sobre o total acumulado
      irResgate = calcularIRProgressivo(saldoBruto);
    }
    
    const saldoLiquido = saldoBruto - irResgate;
    
    // Benefício fiscal do ano
    const beneficioFiscal = calcularBeneficioFiscal(rendaBrutaAnual, aporte);
    economiaFiscalAcumulada += beneficioFiscal;
    
    projecaoAnual.push({
      ano,
      aporte,
      saldoAnterior,
      rentabilidade,
      saldoBruto,
      irResgate,
      saldoLiquido,
      beneficioFiscal,
      economiaFiscalAcumulada,
    });
  }

  // Benefício fiscal anual médio
  const beneficioFiscalAnual = economiaFiscalAcumulada / periodoAnos;
  
  // Resultado final
  const ultimaProjecao = projecaoAnual[projecaoAnual.length - 1];
  const valorBrutoAcumulado = ultimaProjecao.saldoBruto;
  const valorLiquido = ultimaProjecao.saldoLiquido;

  return {
    aporteAnual,
    beneficioFiscalAnual,
    valorBrutoAcumulado,
    valorLiquido,
    economiaFiscalTotal: economiaFiscalAcumulada,
    projecaoAnual,
  };
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata percentual
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

