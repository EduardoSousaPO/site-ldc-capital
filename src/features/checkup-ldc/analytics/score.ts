// Score Calculator

import type { Analytics, PolicyProfile } from '../types';

export function calculateScore(analytics: Analytics, policyProfile: PolicyProfile): number {
  let score = 100;

  const penalidades = policyProfile.config.penalidades;

  // Aplicar penalidades por flags
  analytics.flags.forEach(flag => {
    const penalty = penalidades[flag as keyof typeof penalidades];
    if (penalty) {
      score -= penalty;
    }
  });

  // Penalidades adicionais baseadas em severidade
  if (analytics.concentration_top5 > 60) {
    score -= 10; // Penalidade extra por concentração muito alta
  }

  if (analytics.complexity_score > 50) {
    score -= 15; // Penalidade extra por complexidade muito alta
  }

  // Garantir que score está entre 0 e 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

