"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaywallModal } from "./PaywallModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { Analytics } from "@/features/checkup-ldc/types";

interface PreviewReportProps {
  checkupId: string;
  analytics: Analytics;
  score: number;
  onUnlock: () => void;
}

const COLORS = ['#98ab44', '#becc6a', '#344645', '#577171', '#e3e3e3'];

export function PreviewReport({ checkupId, analytics, score, onUnlock }: PreviewReportProps) {
  const [showPaywall, setShowPaywall] = useState(false);

  const pieData = Object.entries(analytics.allocation_by_class).map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10,
  }));

  const topFlags = analytics.flags.slice(0, 2);

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excelente';
    if (s >= 60) return 'Bom';
    if (s >= 40) return 'Regular';
    return 'Precisa atenção';
  };

  const getScorePhrase = (s: number) => {
    if (s >= 80) return 'Sua carteira está em excelente estado';
    if (s >= 60) return 'Sua carteira está boa, mas há espaço para melhorias';
    if (s >= 40) return 'Sua carteira precisa de atenção';
    return 'Sua carteira requer ajustes urgentes';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Prévia da Análise</CardTitle>
          <CardDescription>
            Seu checkup está pronto. Destrave o relatório completo para ver exatamente o que está puxando sua nota para baixo e o plano de ação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score */}
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(score)}`}>
              {score}
            </div>
            <p className="text-lg font-medium mb-1">{getScoreLabel(score)}</p>
            <p className="text-sm text-muted-foreground">
              {getScorePhrase(score)}
            </p>
          </div>

          {/* Alertas principais - apenas títulos */}
          {topFlags.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Principais alertas:</h3>
              <ul className="space-y-1">
                {topFlags.map((flag, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {getFlagMessage(flag)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gráfico simples - apenas um gráfico */}
          <div>
            <h3 className="font-semibold mb-4">Alocação por Classe</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Card com benefícios do relatório completo */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">O relatório completo inclui:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Breakdown detalhado (5 dimensões)</li>
                <li>✓ Simulações "antes vs depois"</li>
                <li>✓ Top 5 posições da carteira</li>
                <li>✓ Plano de ação copiável + WhatsApp + e-mail</li>
                <li>✓ PDF premium para arquivar</li>
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <Button
            onClick={() => setShowPaywall(true)}
            className="w-full"
            size="lg"
          >
            Desbloquear relatório completo + PDF + plano copiável (R$47)
          </Button>
        </CardContent>
      </Card>

      {showPaywall && (
        <PaywallModal
          checkupId={checkupId}
          onSuccess={onUnlock}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </>
  );
}

function getFlagMessage(flag: string): string {
  const messages: Record<string, string> = {
    HIGH_CONCENTRATION_TOP5: 'Alta concentração nos 5 maiores ativos',
    LOW_GLOBAL_DIVERSIFICATION: 'Baixa diversificação global',
    HIGH_COMPLEXITY_FUNDS: 'Alto percentual em fundos e previdência',
    LOW_LIQUIDITY_BUCKET: 'Baixa liquidez na carteira',
    RISK_MISMATCH_OBJECTIVE: 'Risco não alinhado com objetivo e prazo',
  };
  return messages[flag] || flag;
}

