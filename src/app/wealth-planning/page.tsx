"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import MeetingWizard from "@/components/wealth-planning/v2/MeetingWizard";
import { openPDFv2 } from "@/lib/wealth-planning/pdf-generator-v2";
import { runStressTests, generateActionPlan } from "@/lib/wealth-planning/calculations";
import { DEFAULT_STRESS_TESTS } from "@/types/wealth-planning-v2";
import type { QuickInputs, AutoScenariosResult } from "@/types/wealth-planning-v2";

export default function WealthPlanningPage() {
  const handleExportPDF = (inputs: QuickInputs, scenarios: AutoScenariosResult) => {
    const stressTests = runStressTests(inputs, scenarios.base, DEFAULT_STRESS_TESTS);
    const actionPlan = generateActionPlan(inputs, scenarios.base, stressTests);

    openPDFv2({
      inputs,
      scenarios,
      stressTests,
      actionPlan,
      consultantName: "Consultor LDC Capital",
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <MeetingWizard onExportPDF={handleExportPDF} />
        </div>
      </main>
      <Footer />
    </>
  );
}
