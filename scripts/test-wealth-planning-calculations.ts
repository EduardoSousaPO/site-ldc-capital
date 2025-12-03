/**
 * Script de teste para validar cálculos do Wealth Planning
 * Baseado nos exemplos de report_detailed.md
 */

import {
  calculateFV,
  calculatePV,
  calculatePMT,
  calculateRealRate,
  calculateMaintenanceCapital,
  calculateConsumptionCapital,
} from "../src/lib/wealth-planning/calculations";
import { simulateNotRetired } from "../src/lib/wealth-planning/simulators";
import type { ScenarioData } from "../src/types/wealth-planning";

// Exemplo do report_detailed.md seção 2.3
// Renda anual desejada: 40.000 R$ × 12 = 480.000 R$
// Taxa real: 5,99%
// Capital necessário: 8.012.903,23 R$

function testMaintenanceCapital() {
  console.log("\n=== Teste: Capital de Manutenção ===");
  const desiredAnnualIncome = 480000; // 40.000 × 12
  const realRate = 0.0599; // 5,99%
  const capital = calculateMaintenanceCapital(desiredAnnualIncome, realRate);
  const expected = 8012903.23;
  const diff = Math.abs(capital - expected);
  const percentError = (diff / expected) * 100;

  console.log(`Capital calculado: R$ ${capital.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`Capital esperado: R$ ${expected.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`Diferença: R$ ${diff.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentError.toFixed(2)}%)`);

  if (percentError < 1) {
    console.log("✅ Teste PASSOU");
  } else {
    console.log("❌ Teste FALHOU");
  }
}

// Exemplo do report_detailed.md seção 2.4
// Capital necessário consumo: 6.613.955,25 R$
function testConsumptionCapital() {
  console.log("\n=== Teste: Capital de Consumo ===");
  const desiredAnnualIncome = 480000;
  const yearsInRetirement = 30; // 80 - 50
  const realRate = 0.0599;
  const capital = calculateConsumptionCapital(desiredAnnualIncome, yearsInRetirement, realRate);
  const expected = 6613955.25;
  const diff = Math.abs(capital - expected);
  const percentError = (diff / expected) * 100;

  console.log(`Capital calculado: R$ ${capital.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`Capital esperado: R$ ${expected.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`Diferença: R$ ${diff.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentError.toFixed(2)}%)`);

  if (percentError < 1) {
    console.log("✅ Teste PASSOU");
  } else {
    console.log("❌ Teste FALHOU");
  }
}

// Exemplo do report_detailed.md seção 1.7
// Taxa real = (1 + 0.097) / (1 + 0.035) - 1 = 0.0599 (5,99%)
function testRealRate() {
  console.log("\n=== Teste: Taxa Real ===");
  const nominalRate = 0.097; // 9,7%
  const inflation = 0.035; // 3,5%
  const realRate = calculateRealRate(nominalRate, inflation);
  const expected = 0.0599;
  const diff = Math.abs(realRate - expected);
  const percentError = (diff / expected) * 100;

  console.log(`Taxa real calculada: ${(realRate * 100).toFixed(4)}%`);
  console.log(`Taxa real esperada: ${(expected * 100).toFixed(4)}%`);
  console.log(`Diferença: ${(diff * 100).toFixed(4)}% (${percentError.toFixed(2)}%)`);

  if (percentError < 1) {
    console.log("✅ Teste PASSOU");
  } else {
    console.log("❌ Teste FALHOU");
  }
}

// Teste completo com dados do exemplo
function testFullSimulation() {
  console.log("\n=== Teste: Simulação Completa (Não Aposentado) ===");

  const scenarioData: ScenarioData = {
    personalData: {
      name: "Marcos",
      age: 24,
      dependents: [],
      retirementAge: 50,
      lifeExpectancy: 80,
      maritalStatus: "Solteiro",
      suitability: "Agressivo",
    },
    financialData: {
      monthlyFamilyExpense: 10000,
      desiredMonthlyRetirementIncome: 40000,
      monthlySavings: 0, // No exemplo está 0, mas pode ser 5000 para poupança anual de 60.000
      expectedMonthlyRetirementRevenues: 0,
      investmentObjective: "Acumular Recursos",
    },
    portfolio: {
      assets: [
        {
          asset: "Carteira",
          value: 1000000,
          percentage: 1.0,
          cdiReturn: 0.097, // 9,7%
        },
      ],
      total: 1000000,
      taxConsideration: "Sem considerar I.R",
      immediateLiquidityNeeds: 0.2,
    },
    assets: [],
    projects: [],
    debts: [],
    otherRevenues: [],
    assumptions: {
      annualInflation: 0.035, // 3,5%
      annualCDI: 0.097, // 9,7%
      retirementReturnNominal: 0.097, // 9,7%
      realRetirementReturn: 0.0599, // 5,99%
    },
  };

  const results = simulateNotRetired(scenarioData);

  console.log("\n--- Cenário Atual ---");
  console.log(`Capital na Aposentadoria: R$ ${results.currentScenario?.capitalAtRetirement.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`Rentabilidade Necessária (Real): ${((results.currentScenario?.requiredRate.real || 0) * 100).toFixed(2)}%`);

  console.log("\n--- Cenário Manutenção ---");
  console.log(`Capital Necessário: R$ ${results.maintenanceScenario?.requiredCapital?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`Poupança Anual Necessária: R$ ${results.maintenanceScenario?.annualSavings.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  console.log("\n--- Cenário Consumo ---");
  console.log(`Capital Necessário: R$ ${results.consumptionScenario?.requiredCapital?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  console.log("\n--- Termômetro Financeiro ---");
  console.log(`Pontuação: ${results.financialThermometer?.toFixed(1)}/10`);

  // Validar valores esperados
  const maintenanceCapital = results.maintenanceScenario?.requiredCapital || 0;
  const expectedMaintenance = 8012903.23;
  const maintenanceError = Math.abs(maintenanceCapital - expectedMaintenance) / expectedMaintenance * 100;

  const consumptionCapital = results.consumptionScenario?.requiredCapital || 0;
  const expectedConsumption = 6613955.25;
  const consumptionError = Math.abs(consumptionCapital - expectedConsumption) / expectedConsumption * 100;

  console.log("\n--- Validação ---");
  if (maintenanceError < 5) {
    console.log(`✅ Capital de Manutenção: OK (erro ${maintenanceError.toFixed(2)}%)`);
  } else {
    console.log(`❌ Capital de Manutenção: ERRO (erro ${maintenanceError.toFixed(2)}%)`);
  }

  if (consumptionError < 5) {
    console.log(`✅ Capital de Consumo: OK (erro ${consumptionError.toFixed(2)}%)`);
  } else {
    console.log(`❌ Capital de Consumo: ERRO (erro ${consumptionError.toFixed(2)}%)`);
  }
}

// Executar todos os testes
async function runTests() {
  console.log("🧪 Iniciando testes de cálculos Wealth Planning\n");
  console.log("=".repeat(60));

  try {
    testRealRate();
    testMaintenanceCapital();
    testConsumptionCapital();
    testFullSimulation();

    console.log("\n" + "=".repeat(60));
    console.log("✅ Todos os testes concluídos");
  } catch (error) {
    console.error("\n❌ Erro ao executar testes:", error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests();
}

export { runTests };

