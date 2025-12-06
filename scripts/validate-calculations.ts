/**
 * Script para validar cálculos matemáticos financeiros
 * Compara com fórmulas padrão de matemática financeira
 */

// Fórmula correta de Valor Futuro com aportes mensais (POSTECIPADOS - aporte no final do mês)
// FV = PV × (1 + i)^n + PMT × [((1 + i)^n - 1) / i]

// Fórmula correta de Valor Futuro com aportes mensais (ANTECIPADOS - aporte no início do mês)
// FV = PV × (1 + i)^n + PMT × [((1 + i)^n - 1) / i] × (1 + i)

function calculateFVPostecipado(
  PV: number,
  PMT: number,
  i: number, // taxa mensal
  n: number  // número de meses
): number {
  if (i === 0) return PV + PMT * n;
  const factor = Math.pow(1 + i, n);
  return PV * factor + PMT * ((factor - 1) / i);
}

function calculateFVAntecipado(
  PV: number,
  PMT: number,
  i: number, // taxa mensal
  n: number  // número de meses
): number {
  if (i === 0) return PV + PMT * n;
  const factor = Math.pow(1 + i, n);
  return PV * factor + PMT * ((factor - 1) / i) * (1 + i);
}

// Teste: R$ 400k inicial, R$ 2k/mês, 9,7% a.a., 25 anos
const PV = 400000;
const PMT = 2000;
const annualRate = 0.097;
const years = 25;

// Converter taxa anual para mensal
const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
const months = years * 12;

console.log("=".repeat(70));
console.log("VALIDAÇÃO DE CÁLCULOS FINANCEIROS");
console.log("=".repeat(70));
console.log();
console.log("Parâmetros:");
console.log(`  Capital Inicial (PV): R$ ${PV.toLocaleString("pt-BR")}`);
console.log(`  Aporte Mensal (PMT): R$ ${PMT.toLocaleString("pt-BR")}`);
console.log(`  Taxa Anual: ${(annualRate * 100).toFixed(2)}%`);
console.log(`  Taxa Mensal: ${(monthlyRate * 100).toFixed(4)}%`);
console.log(`  Período: ${years} anos (${months} meses)`);
console.log();

// Calcular com aportes POSTECIPADOS (final do mês)
const fvPostecipado = calculateFVPostecipado(PV, PMT, monthlyRate, months);
console.log("Cálculo com aportes POSTECIPADOS (final do mês):");
console.log(`  FV = R$ ${fvPostecipado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log();

// Calcular com aportes ANTECIPADOS (início do mês)
const fvAntecipado = calculateFVAntecipado(PV, PMT, monthlyRate, months);
console.log("Cálculo com aportes ANTECIPADOS (início do mês):");
console.log(`  FV = R$ ${fvAntecipado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log();

// Verificar qual é o padrão em wealth planning
console.log("Em wealth planning, normalmente os aportes são ANTECIPADOS");
console.log("(feitos no início do mês, recebendo juros durante todo o mês)");
console.log();

// Comparar com cálculo manual mês a mês (antecipado)
console.log("Validação mês a mês (primeiros 3 meses):");
let capital = PV;
for (let month = 1; month <= 3; month++) {
  // Aporte ANTECIPADO: primeiro adiciona o aporte, depois capitaliza
  capital = (capital + PMT) * (1 + monthlyRate);
  console.log(`  Mês ${month}: R$ ${capital.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
}
console.log();

// Calcular valor futuro sem aportes (apenas capital inicial)
const fvSemAportes = PV * Math.pow(1 + monthlyRate, months);
console.log("Valor Futuro SEM aportes (apenas capital inicial):");
console.log(`  FV = R$ ${fvSemAportes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log();

// Verificar diferença
const diferencaAportes = fvAntecipado - fvSemAportes;
console.log("Contribuição dos aportes (antecipados):");
console.log(`  Diferença: R$ ${diferencaAportes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`  Total aportado: R$ ${(PMT * months).toLocaleString("pt-BR")}`);
console.log(`  Juros sobre aportes: R$ ${(diferencaAportes - PMT * months).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log();

console.log("=".repeat(70));
console.log("CONCLUSÃO:");
console.log("=".repeat(70));
console.log(`Valor esperado (aproximado): ~R$ 7.000.000,00`);
console.log(`Valor calculado (POSTECIPADO): R$ ${fvPostecipado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`Valor calculado (ANTECIPADO): R$ ${fvAntecipado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log();
console.log("A diferença entre postecipado e antecipado é significativa!");
console.log("Para wealth planning, devemos usar aportes ANTECIPADOS.");

