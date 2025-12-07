"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Loader2 } from "lucide-react";
import type { Analytics, DiagnosisReport, CheckupStatus, PolicyProfile } from "@/features/checkup-ldc/types";
import { toast } from "sonner";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { Top5Card } from "./Top5Card";
import { UpsellBlock } from "./UpsellBlock";

interface FullReportProps {
  checkupId: string;
  analytics: Analytics;
  score: number;
  report: DiagnosisReport;
  status?: CheckupStatus;
  policyProfile?: PolicyProfile;
}

const COLORS = ['#98ab44', '#becc6a', '#344645', '#577171', '#e3e3e3', '#262d3d'];

export function FullReport({ checkupId, analytics, score, report, status = 'paid', policyProfile }: FullReportProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [checkupStatus, setCheckupStatus] = useState<CheckupStatus>(status);
  const [policy, setPolicy] = useState<PolicyProfile | undefined>(policyProfile);

  // Buscar status e policy profile se não foram fornecidos
  useEffect(() => {
    // Sempre buscar status atualizado do checkup
    fetch(`/api/checkup-ldc/checkups/${checkupId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setCheckupStatus(data.status);
        }
        if (data.policy_profile && !policyProfile) {
          setPolicy(data.policy_profile);
        }
      })
      .catch(console.error);
  }, [checkupId, policyProfile]);

  const isPaid = checkupStatus === 'paid' || checkupStatus === 'done';

  const pieData = Object.entries(analytics.allocation_by_class).map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10,
  }));

  const brVsExteriorData = [
    { name: 'Brasil', value: analytics.br_vs_exterior.br },
    { name: 'Exterior', value: analytics.br_vs_exterior.exterior },
  ];

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'high') return 'destructive';
    if (severity === 'med') return 'default';
    return 'secondary';
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const res = await fetch(`/api/checkup-ldc/checkups/${checkupId}/pdf`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      const data = await res.json();
      if (data.pdf_url) {
        window.open(data.pdf_url, '_blank');
        toast.success('PDF gerado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório Completo</CardTitle>
              <CardDescription>{report.headline}</CardDescription>
            </div>
            {isPaid && (
              <Button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                variant="outline"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Score */}
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(score)}`}>
              {score}
            </div>
            <p className="text-lg font-medium">Nota de Saúde da Carteira</p>
          </div>

          {/* Resumo Executivo - 3 métricas-chave */}
          {isPaid && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{analytics.concentration_top5.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Top 5</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{analytics.br_vs_exterior.exterior.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Exterior</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{analytics.liquidity_score.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Liquidez</div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="prose max-w-none">
            <p className="text-muted-foreground whitespace-pre-line">{report.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown - apenas se pago */}
      {isPaid && analytics.subscores && (
        <ScoreBreakdown analytics={analytics} />
      )}

      {/* What-if Simulator - apenas se pago */}
      {isPaid && policy && (
        <WhatIfSimulator
          analytics={analytics}
          policyProfile={policy}
          currentScore={score}
        />
      )}

      {/* Top 5 Posições - apenas se pago */}
      {isPaid && (
        <Top5Card analytics={analytics} />
      )}

      {/* Gráficos - apenas se pago */}
      {isPaid && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Alocação por Classe</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brasil vs Exterior</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brVsExteriorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#98ab44" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Riscos - apenas se pago */}
      {isPaid && (
        <Card>
          <CardHeader>
            <CardTitle>Principais Riscos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.risks.map((risk, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{risk.title}</h4>
                  <Badge variant={getSeverityColor(risk.severity)}>
                    {risk.severity === 'high' ? 'Alto' : risk.severity === 'med' ? 'Médio' : 'Baixo'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{risk.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Melhorias - apenas se pago */}
      {isPaid && (
        <Card>
          <CardHeader>
            <CardTitle>Oportunidades de Melhoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.improvements.map((improvement, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{improvement.title}</h4>
                  <Badge>
                    {improvement.impact === 'high' ? 'Alto Impacto' : improvement.impact === 'med' ? 'Médio Impacto' : 'Baixo Impacto'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{improvement.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Plano de Ação - apenas se pago */}
      {isPaid && (
        <Card>
          <CardHeader>
            <CardTitle>Plano de Ação - Próximos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Passo 0 */}
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <input type="checkbox" className="mt-1" />
              <label className="text-sm">
                Defina um % alvo de exterior (ex.: 15%) e um limite de concentração (top5 ≤ 45%).
              </label>
            </div>
            
            {/* Checklist dos passos */}
            {report.action_plan_7_days.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <label className="text-sm text-muted-foreground flex-1">
                  {step}
                </label>
              </div>
            ))}

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const planText = [
                    'Defina um % alvo de exterior (ex.: 15%) e um limite de concentração (top5 ≤ 45%).',
                    ...report.action_plan_7_days,
                  ].join('\n');
                  try {
                    await navigator.clipboard.writeText(planText);
                    toast.success('Plano copiado para a área de transferência!');
                  } catch (error) {
                    toast.error('Erro ao copiar plano');
                  }
                }}
              >
                Copiar plano
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const planText = [
                    'Defina um % alvo de exterior (ex.: 15%) e um limite de concentração (top5 ≤ 45%).',
                    ...report.action_plan_7_days,
                  ].join('%0A');
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Plano de Ação - Checkup LDC:\n\n')}${planText}`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                Compartilhar no WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const email = prompt('Digite seu e-mail:');
                  if (!email) return;
                  
                  try {
                    const res = await fetch(`/api/checkup-ldc/checkups/${checkupId}/email-plan`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email }),
                    });
                    
                    if (res.ok) {
                      toast.success('Plano enviado por e-mail!');
                    } else {
                      throw new Error('Erro ao enviar e-mail');
                    }
                  } catch (error) {
                    toast.error('Erro ao enviar e-mail');
                  }
                }}
              >
                Enviar por e-mail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transparência - apenas se pago */}
      {isPaid && report.transparency_notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notas de Transparência</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {report.transparency_notes.map((note, i) => (
                <li key={i}>• {note}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Upsells - apenas se pago */}
      {isPaid && (
        <UpsellBlock
          checkupId={checkupId}
          analytics={analytics}
          showGuidedReview={true}
        />
      )}
    </div>
  );
}

