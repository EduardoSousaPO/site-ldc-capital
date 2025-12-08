"use client";

import { useState } from "react";
import { PortfolioInput } from "./components/PortfolioInput";
import { TypeConfirmation } from "./components/TypeConfirmation";
import { SuitabilityForm } from "./components/SuitabilityForm";
import { PreviewReport } from "./components/PreviewReport";
import { FullReport } from "./components/FullReport";
import { CheckupHero } from "./components/CheckupHero";
import type { RawHolding, HoldingType, UserProfile, Analytics, DiagnosisReport, CheckupStatus } from "@/features/checkup-ldc/types";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { toast } from "sonner";

type Step = 'input' | 'types' | 'suitability' | 'analyzing' | 'preview' | 'report';

export default function CheckupLDCPage() {
  const [step, setStep] = useState<Step>('input');
  const [rawHoldings, setRawHoldings] = useState<RawHolding[]>([]);
  const [typedHoldings, setTypedHoldings] = useState<Array<RawHolding & { tipo: HoldingType }>>([]);
  const [, setUserProfile] = useState<UserProfile | null>(null);
  const [checkupId, setCheckupId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [checkupStatus, setCheckupStatus] = useState<CheckupStatus>('preview');

  const handleHoldingsParsed = (holdings: RawHolding[]) => {
    setRawHoldings(holdings);
    setStep('types');
  };

  const handleTypesConfirmed = (holdings: Array<RawHolding & { tipo: HoldingType }>) => {
    setTypedHoldings(holdings);
    setStep('suitability');
  };

  const handleSuitabilitySubmit = async (profile: UserProfile) => {
    setUserProfile(profile);
    setStep('analyzing');

    try {
      // Criar checkup
      const checkupRes = await fetch('/api/checkup-ldc/checkups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!checkupRes.ok) throw new Error('Erro ao criar checkup');

      const checkup = await checkupRes.json();
      setCheckupId(checkup.id);

      // Salvar holdings
      const holdingsRes = await fetch(`/api/checkup-ldc/checkups/${checkup.id}/holdings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typedHoldings),
      });

      if (!holdingsRes.ok) throw new Error('Erro ao salvar holdings');

      // Analisar
      const analyzeRes = await fetch(`/api/checkup-ldc/checkups/${checkup.id}/analyze`, {
        method: 'POST',
      });

      if (!analyzeRes.ok) throw new Error('Erro ao analisar');

      const analyzeData = await analyzeRes.json();
      setAnalytics(analyzeData.analytics);
      setScore(analyzeData.score);

      // Buscar status do checkup
      const checkupStatusRes = await fetch(`/api/checkup-ldc/checkups/${checkup.id}`);
      if (checkupStatusRes.ok) {
        const checkupData = await checkupStatusRes.json();
        setCheckupStatus(checkupData.status || 'preview');
      }

      // Sempre mostrar preview primeiro (não gerar relatório completo automaticamente)
      setStep('preview');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar. Tente novamente.');
      setStep('input');
    }
  };

  const handleUnlock = async () => {
    if (!checkupId) return;

    setStep('analyzing');
    try {
      // Verificar status do checkup após pagamento
      const statusRes = await fetch(`/api/checkup-ldc/checkups/${checkupId}`);
      if (!statusRes.ok) throw new Error('Erro ao verificar status');

      const checkupData = await statusRes.json();
      setCheckupStatus(checkupData.status || 'preview');

      // Se status for 'paid', gerar e mostrar relatório completo
      if (checkupData.status === 'paid') {
        const reportRes = await fetch(`/api/checkup-ldc/checkups/${checkupId}/report`, {
          method: 'POST',
        });

        if (!reportRes.ok) throw new Error('Erro ao gerar relatório');

        const reportData = await reportRes.json();
        setReport(reportData.diagnosis);
        setStep('report');
      } else {
        // Se ainda não estiver pago, voltar para preview
        toast.warning('Pagamento ainda não confirmado. Aguarde alguns instantes.');
        setStep('preview');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar relatório. Tente novamente.');
      setStep('preview');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="space-y-12">
          {/* Hero/Landing Section - apenas no step 'input' */}
          {step === 'input' && (
            <CheckupHero onStart={() => {
              // Scroll suave para o formulário de input
              setTimeout(() => {
                const inputSection = document.getElementById('portfolio-input-section');
                if (inputSection) {
                  inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }} />
          )}

          <div className="space-y-6" id="portfolio-input-section">
            {step === 'input' && (
              <PortfolioInput onHoldingsParsed={handleHoldingsParsed} />
            )}

          {step === 'types' && (
            <TypeConfirmation
              holdings={rawHoldings}
              onConfirmed={handleTypesConfirmed}
            />
          )}

          {step === 'suitability' && (
            <SuitabilityForm onSubmit={handleSuitabilitySubmit} />
          )}

          {step === 'analyzing' && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Analisando sua carteira...</p>
            </div>
          )}

          {step === 'preview' && checkupId && analytics && score !== null && (
            <PreviewReport
              checkupId={checkupId}
              analytics={analytics}
              score={score}
              onUnlock={handleUnlock}
            />
          )}

          {step === 'report' && checkupId && analytics && score !== null && report && (
            <FullReport
              checkupId={checkupId}
              analytics={analytics}
              score={score}
              report={report}
              status={checkupStatus}
            />
          )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

