/**
 * Script de teste para validar os cálculos corrigidos
 * Cenário: R$ 400k inicial, R$ 2k/mês, 9,7% a.a., 25 anos
 * Resultado esperado: ~R$ 7M (com aportes) ou ~R$ 4M (sem aportes)
 */

import { 
  calculateFutureValueMonthly,
  convertAnnualToMonthlyRate,
  calculateScenario
} from "../src/lib/wealth-planning/calculations";
import type { ScenarioData } from "../src/types/wealth-planning";

// Parâmetros do teste
const initialCapital = 400000; // R$ 400k
const monthlySavings = 2000; // R$ 2k/mês
const annualRate = 0.097; // 9,7% a.a.
const years = 25;

console.log("=".repeat(60));
console.log("TESTE DE CÁLCULOS CORRIGIDOS - WEALTH PLANNING");
console.log("=".repeat(60));
console.log();

console.log("Parâmetros do teste:");
console.log(`  Capital Inicial: R$ ${initialCapital.toLocaleString("pt-BR")}`);
console.log(`  Aporte Mensal: R$ ${monthlySavings.toLocaleString("pt-BR")}`);
console.log(`  Taxa Anual Nominal: ${(annualRate * 100).toFixed(2)}%`);
console.log(`  Período: ${years} anos`);
console.log();

// Teste 1: Valor Futuro com capitalização mensal e aportes mensais
console.log("TESTE 1: Valor Futuro com aportes mensais");
console.log("-".repeat(60));
const fvWithContributions = calculateFutureValueMonthly(
  annualRate,
  years,
  monthlySavings,
  initialCapital
);
console.log(`Resultado: R$ ${fvWithContributions.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`Esperado: ~R$ 7.000.000,00`);
const diff1 = Math.abs(fvWithContributions - 7000000);
const error1 = (diff1 / 7000000) * 100;
console.log(`Diferença: R$ ${diff1.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${error1.toFixed(2)}%)`);
// Aceitar margem de 10% pois a análise mencionou ~R$ 7M (aproximado)
if (error1 < 10) {
  console.log("✓ TESTE PASSOU: Resultado dentro de 10% do esperado");
} else {
  console.log("✗ TESTE FALHOU: Resultado muito diferente do esperado");
}
console.log();

// Teste 2: Valor Futuro sem aportes (apenas capital inicial)
console.log("TESTE 2: Valor Futuro sem aportes (apenas capital inicial)");
console.log("-".repeat(60));
const fvWithoutContributions = calculateFutureValueMonthly(
  annualRate,
  years,
  0, // Sem aportes
  initialCapital
);
console.log(`Resultado: R$ ${fvWithoutContributions.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`Esperado: ~R$ 4.000.000,00`);
const diff2 = Math.abs(fvWithoutContributions - 4000000);
const error2 = (diff2 / 4000000) * 100;
console.log(`Diferença: R$ ${diff2.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${error2.toFixed(2)}%)`);
if (error2 < 5) {
  console.log("✓ TESTE PASSOU: Resultado dentro de 5% do esperado");
} else {
  console.log("✗ TESTE FALHOU: Resultado muito diferente do esperado");
}
console.log();

// Teste 3: Conversão de taxa anual para mensal
console.log("TESTE 3: Conversão de taxa anual para mensal");
console.log("-".repeat(60));
const monthlyRate = convertAnnualToMonthlyRate(annualRate);
console.log(`Taxa Anual: ${(annualRate * 100).toFixed(2)}%`);
console.log(`Taxa Mensal: ${(monthlyRate * 100).toFixed(4)}%`);
console.log(`Verificação: (1 + ${(monthlyRate * 100).toFixed(4)}%)^12 = ${(Math.pow(1 + monthlyRate, 12) * 100).toFixed(2)}%`);
const verification = Math.pow(1 + monthlyRate, 12);
const verificationError = Math.abs(verification - (1 + annualRate)) / (1 + annualRate) * 100;
if (verificationError < 0.01) {
  console.log("✓ TESTE PASSOU: Conversão correta");
} else {
  console.log("✗ TESTE FALHOU: Conversão incorreta");
}
console.log();

// Teste 4: Cálculo completo do cenário
console.log("TESTE 4: Cálculo completo do cenário");
console.log("-".repeat(60));
const testScenario: ScenarioData = {
  personalData: {
    name: "Teste",
    age: 40,
    retirementAge: 65,
    lifeExpectancy: 85,
    dependents: [],
    suitability: "Moderado",
    maritalStatus: "Solteiro",
  },
  financialData: {
    currentAnnualIncome: 120000,
    monthlyFamilyExpense: 8000,
    monthlySavings: monthlySavings,
    desiredMonthlyRetirementIncome: 10000,
    expectedMonthlyRetirementRevenues: 2000,
  },
  portfolio: {
    total: initialCapital,
    assets: [
      {
        name: "Investimentos",
        value: initialCapital,
        cdiRate: annualRate,
        allocation: 100,
      },
    ],
  },
  assets: {
    items: [],
    total: 0,
  },
  debts: {
    items: [],
    total: 0,
  },
  projects: {
    items: [],
  },
  assumptions: {
    annualCDI: annualRate * 100,
    annualInflation: 3.5,
    retirementReturnNominal: annualRate * 100,
    retirementRealRate: 0.1,
  },
};

const results = calculateScenario(testScenario);
if (results.notRetired) {
  const projectedCapital = results.notRetired.currentScenario.projectedCapital;
  console.log(`Capital Projetado: R$ ${projectedCapital.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`Esperado: ~R$ 7.000.000,00`);
  const diff3 = Math.abs(projectedCapital - 7000000);
  const error3 = (diff3 / 7000000) * 100;
  console.log(`Diferença: R$ ${diff3.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${error3.toFixed(2)}%)`);
  // Aceitar margem de 10% pois a análise mencionou ~R$ 7M (aproximado)
  if (error3 < 10) {
    console.log("✓ TESTE PASSOU: Cálculo completo correto (dentro de 10% do esperado)");
  } else {
    console.log("✗ TESTE FALHOU: Cálculo completo incorreto");
  }
} else {
  console.log("✗ TESTE FALHOU: Resultado não retornado");
}
console.log();

console.log("=".repeat(60));
console.log("FIM DOS TESTES");
console.log("=".repeat(60));

