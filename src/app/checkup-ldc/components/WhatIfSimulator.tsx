"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Analytics, PolicyProfile, WhatIfAdjustmentType } from "@/features/checkup-ldc/types";
import { simulateAdjustment } from "@/features/checkup-ldc/analytics/what-if";
import { ArrowRight, TrendingUp } from "lucide-react";

interface WhatIfSimulatorProps {
  analytics: Analytics;
  policyProfile: PolicyProfile;
  currentScore: number;
}

export function WhatIfSimulator({ analytics, policyProfile, currentScore }: WhatIfSimulatorProps) {
  const [selectedAdjustment, setSelectedAdjustment] = useState<WhatIfAdjustmentType | null>(null);
  const [simulation, setSimulation] = useState<ReturnType<typeof simulateAdjustment> | null>(null);

  const adjustments: Array<{
    type: WhatIfAdjustmentType;
    label: string;
    description: string;
  }> = [
    {
      type: 'ADD_EXTERIOR_10',
      label: '+10% Exterior',
      description: 'Aumentar exposição internacional em 10%',
    },
    {
      type: 'REDUCE_TOP5_TO_45',
      label: 'Reduzir Top5 para 45%',
      description: 'Reduzir concentração nos 5 maiores ativos',
    },
    {
      type: 'INCREASE_LIQUIDITY_TO_60',
      label: 'Aumentar Liquidez para Score 60',
      description: 'Melhorar liquidez da carteira',
    },
  ];

  const handleSimulate = (adjustmentType: WhatIfAdjustmentType) => {
    setSelectedAdjustment(adjustmentType);
    const result = simulateAdjustment(analytics, policyProfile, adjustmentType);
    setSimulation(result);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Se você ajustar...</CardTitle>
        <CardDescription>
          Simule o impacto de ajustes na sua carteira
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {adjustments.map((adj) => {
            const isSelected = selectedAdjustment === adj.type;
            const thisSimulation = isSelected ? simulation : null;
            
            return (
              <div key={adj.type} className="space-y-2">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleSimulate(adj.type)}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {adj.label}
                </Button>
                {thisSimulation && (
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Nota estimada:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{thisSimulation.score_before}</span>
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-sm font-semibold text-primary">
                          {thisSimulation.score_after}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {thisSimulation.note}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

