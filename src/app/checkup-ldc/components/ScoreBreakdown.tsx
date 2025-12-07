"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Analytics } from "@/features/checkup-ldc/types";
import { Info } from "lucide-react";

interface ScoreBreakdownProps {
  analytics: Analytics;
}

export function ScoreBreakdown({ analytics }: ScoreBreakdownProps) {
  if (!analytics.subscores) {
    return null;
  }

  const { subscores } = analytics;

  const dimensions = [
    {
      key: 'global_diversification' as const,
      label: 'Diversificação Global',
      meta: 'Meta: 10-25%',
      tooltip: 'Percentual de ativos no exterior. Diversificação geográfica reduz risco local.',
    },
    {
      key: 'concentration' as const,
      label: 'Concentração',
      meta: 'Meta: Top5 < 45%',
      tooltip: 'Concentração nos 5 maiores ativos. Alta concentração aumenta risco específico.',
    },
    {
      key: 'liquidity' as const,
      label: 'Liquidez',
      meta: 'Meta: Score ≥ 60',
      tooltip: 'Facilidade de converter ativos em dinheiro. Alta liquidez oferece flexibilidade.',
    },
    {
      key: 'complexity' as const,
      label: 'Complexidade',
      meta: 'Meta: Fundos < 30%',
      tooltip: 'Percentual em fundos e previdência (caixa preta). Menor complexidade facilita gestão.',
    },
    {
      key: 'cost_efficiency' as const,
      label: 'Eficiência de Custos',
      meta: 'Meta: Baixo custo',
      tooltip: 'Custos totais da carteira. Menores custos aumentam retorno líquido.',
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Alto';
    if (score >= 60) return 'Médio';
    return 'Baixo';
  };

  const getScoreVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>O que puxou sua nota para baixo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dimensions.map((dim) => {
          const score = subscores[dim.key];
          return (
            <div key={dim.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{dim.label}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{dim.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{dim.meta}</span>
                  <Badge variant={getScoreVariant(score)}>
                    {score} - {getScoreLabel(score)}
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${getScoreColor(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

