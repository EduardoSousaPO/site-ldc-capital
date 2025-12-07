"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { Analytics } from "@/features/checkup-ldc/types";
import { toast } from "sonner";

interface UpsellBlockProps {
  checkupId: string;
  analytics: Analytics;
  showGuidedReview?: boolean;
}

export function UpsellBlock({ checkupId, analytics, showGuidedReview = false }: UpsellBlockProps) {
  const handleUpsellClick = async (upsellType: 'guided_review' | 'consultancy', metadata?: Record<string, any>) => {
    try {
      const res = await fetch(`/api/checkup-ldc/checkups/${checkupId}/upsell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upsell_type: upsellType,
          metadata: {
            ...metadata,
            main_flags: analytics.flags.slice(0, 3),
            concentration_top5: analytics.concentration_top5,
            exterior_pct: analytics.br_vs_exterior.exterior,
          },
        }),
      });

      if (res.ok) {
        // Em produção, aqui redirecionaria para formulário de agendamento ou abriria modal
        toast.success('Redirecionando para agendamento...');
        // window.open('https://calendly.com/ldc-capital/...', '_blank');
      } else {
        throw new Error('Erro ao processar');
      }
    } catch (error) {
      toast.error('Erro ao processar. Tente novamente.');
      console.error(error);
    }
  };

  // Personalização baseada nos flags principais
  const getPersonalizedMessage = () => {
    const mainFlags = analytics.flags.slice(0, 2);
    if (mainFlags.includes('HIGH_CONCENTRATION_TOP5') && mainFlags.includes('LOW_GLOBAL_DIVERSIFICATION')) {
      return 'Sua carteira hoje tem concentração alta e baixa diversificação global. Nosso trabalho mensal é justamente manter isso sob controle.';
    }
    if (mainFlags.includes('LOW_GLOBAL_DIVERSIFICATION')) {
      return 'Sua carteira tem baixa diversificação global. Nosso trabalho mensal ajuda a construir uma alocação internacional adequada.';
    }
    if (mainFlags.includes('HIGH_CONCENTRATION_TOP5')) {
      return 'Sua carteira tem alta concentração. Nosso trabalho mensal ajuda a diversificar e reduzir riscos.';
    }
    return 'Nosso trabalho mensal ajuda a manter sua carteira alinhada com seus objetivos e reduzir riscos.';
  };

  return (
    <div className="space-y-6">
      {/* Upsell 1: Revisão Guiada (apenas se showGuidedReview = true) */}
      {showGuidedReview && (
        <Card className="bg-primary/5 border-primary">
          <CardHeader>
            <CardTitle>Transforme este relatório em um plano prático</CardTitle>
            <CardDescription>
              Quer que um consultor da LDC revise este relatório com você e transforme em um plano prático?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">20 min</span>
              <span className="text-muted-foreground">|</span>
              <span className="font-semibold">R$197</span>
              <span className="text-muted-foreground">(com crédito de R$47 abatido)</span>
            </div>
            <Button
              onClick={() => handleUpsellClick('guided_review')}
              className="w-full"
            >
              Agendar Revisão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upsell 2: Consultoria LDC */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Consultoria LDC + Wealth Planning</CardTitle>
          <CardDescription>
            A LDC acompanha, reequilibra e consolida — com Wealth Planning completo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {getPersonalizedMessage()}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span className="text-sm">Reunião mensal de acompanhamento</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span className="text-sm">Rebalanceamento da carteira</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-primary" />
              <span className="text-sm">Wealth Planning completo</span>
            </div>
          </div>

          <Button
            onClick={() => handleUpsellClick('consultancy')}
            variant="outline"
            className="w-full"
          >
            Quero conversar sobre a Consultoria LDC
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

