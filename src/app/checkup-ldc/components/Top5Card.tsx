"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Analytics } from "@/features/checkup-ldc/types";

interface Top5CardProps {
  analytics: Analytics;
}

export function Top5Card({ analytics }: Top5CardProps) {
  const top5 = analytics.top_holdings.slice(0, 5);

  if (top5.length === 0) {
    return null;
  }

  const getTypeBadgeVariant = (tipo: string): "default" | "secondary" | "outline" => {
    const equityTypes = ['Ação BR', 'ETF BR', 'FII', 'Exterior'];
    if (equityTypes.includes(tipo)) return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Posições</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {top5.map((holding, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{holding.nome}</span>
                  <Badge variant={getTypeBadgeVariant(holding.tipo)} className="text-xs">
                    {holding.tipo}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{holding.percentual.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">da carteira</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

