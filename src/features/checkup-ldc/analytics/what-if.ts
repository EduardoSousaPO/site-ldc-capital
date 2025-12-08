// What-if Simulator - Simulações heurísticas de ajustes

import type { Analytics, PolicyProfile, WhatIfAdjustmentType, WhatIfSimulation } from '../types';
import { calculateScore } from './score';

export function simulateAdjustment(
  analytics: Analytics,
  policyProfile: PolicyProfile,
  adjustmentType: WhatIfAdjustmentType
): WhatIfSimulation {
  const scoreBefore = calculateScore(analytics, policyProfile);
  
  // Criar cópia do analytics para simulação
  const simulatedAnalytics: Analytics = {
    ...analytics,
    br_vs_exterior: { ...analytics.br_vs_exterior },
    flags: [...analytics.flags],
  };

  let label: string;
  let note: string;

  switch (adjustmentType) {
    case 'ADD_EXTERIOR_10': {
      // Aumentar exterior em 10% (reduzir BR proporcionalmente)
      const currentExterior = simulatedAnalytics.br_vs_exterior.exterior;
      const newExterior = Math.min(100, currentExterior + 10);
      const reduction = newExterior - currentExterior;
      
      simulatedAnalytics.br_vs_exterior.exterior = newExterior;
      simulatedAnalytics.br_vs_exterior.br = Math.max(0, simulatedAnalytics.br_vs_exterior.br - reduction);
      
      // Remover flag de baixa diversificação global se atingir meta
      if (newExterior >= policyProfile.config.target_exterior_min) {
        simulatedAnalytics.flags = simulatedAnalytics.flags.filter(f => f !== 'LOW_GLOBAL_DIVERSIFICATION');
      }
      
      label = '+10% Exterior';
      note = 'Reduz risco local e melhora diversificação geográfica';
      break;
    }

    case 'REDUCE_TOP5_TO_45': {
      // Reduzir concentração top5 para 45%
      const currentTop5 = simulatedAnalytics.concentration_top5;
      if (currentTop5 > 45) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const reduction = currentTop5 - 45;
        simulatedAnalytics.concentration_top5 = 45;
        
        // Remover flag de alta concentração
        simulatedAnalytics.flags = simulatedAnalytics.flags.filter(f => f !== 'HIGH_CONCENTRATION_TOP5');
        
        label = 'Reduzir Top5 para 45%';
        note = 'Melhora diversificação e reduz risco de concentração';
      } else {
        // Já está abaixo de 45%, não há mudança
        label = 'Reduzir Top5 para 45%';
        note = 'Sua carteira já está abaixo de 45%';
      }
      break;
    }

    case 'INCREASE_LIQUIDITY_TO_60': {
      // Aumentar liquidez para score 60
      const currentLiquidity = simulatedAnalytics.liquidity_score;
      const targetLiquidity = policyProfile.config.min_liquidity_high; // Geralmente 60
      
      if (currentLiquidity < targetLiquidity) {
        const increase = targetLiquidity - currentLiquidity;
        simulatedAnalytics.liquidity_score = Math.min(100, currentLiquidity + increase);
        
        // Remover flag de baixa liquidez se atingir meta
        if (simulatedAnalytics.liquidity_score >= targetLiquidity) {
          simulatedAnalytics.flags = simulatedAnalytics.flags.filter(f => f !== 'LOW_LIQUIDITY_BUCKET');
        }
        
        label = 'Aumentar Liquidez para Score 60';
        note = 'Melhora flexibilidade e acesso ao capital';
      } else {
        // Já está acima da meta
        label = 'Aumentar Liquidez para Score 60';
        note = 'Sua carteira já possui boa liquidez';
      }
      break;
    }
  }

  // Recalcular subscores para a simulação
  // Nota: Para simplificar, vamos recalcular apenas os subscores afetados
  // Em uma implementação mais completa, recriaríamos o analytics completo
  if (simulatedAnalytics.subscores) {
    simulatedAnalytics.subscores = {
      ...simulatedAnalytics.subscores,
      // Atualizar subscores afetados
      global_diversification: adjustmentType === 'ADD_EXTERIOR_10' 
        ? Math.min(100, simulatedAnalytics.subscores.global_diversification + 15)
        : simulatedAnalytics.subscores.global_diversification,
      concentration: adjustmentType === 'REDUCE_TOP5_TO_45'
        ? Math.min(100, simulatedAnalytics.subscores.concentration + 20)
        : simulatedAnalytics.subscores.concentration,
      liquidity: adjustmentType === 'INCREASE_LIQUIDITY_TO_60'
        ? Math.min(100, simulatedAnalytics.subscores.liquidity + 15)
        : simulatedAnalytics.subscores.liquidity,
    };
  }

  const scoreAfter = calculateScore(simulatedAnalytics, policyProfile);

  return {
    label,
    score_before: scoreBefore,
    score_after: scoreAfter,
    note,
    adjustment_type: adjustmentType,
  };
}

export function generateWhatIfSimulations(
  analytics: Analytics,
  policyProfile: PolicyProfile
): WhatIfSimulation[] {
  const adjustments: WhatIfAdjustmentType[] = [
    'ADD_EXTERIOR_10',
    'REDUCE_TOP5_TO_45',
    'INCREASE_LIQUIDITY_TO_60',
  ];

  return adjustments.map(adj => simulateAdjustment(analytics, policyProfile, adj));
}

