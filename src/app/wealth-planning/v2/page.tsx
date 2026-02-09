"use client";

import MeetingWizard from "@/components/wealth-planning/v2/MeetingWizard";
import { openPDFv2 } from "@/lib/wealth-planning/pdf-generator-v2";
import { runStressTests, generateActionPlan } from "@/lib/wealth-planning/calculations";
import { DEFAULT_STRESS_TESTS } from "@/types/wealth-planning-v2";
import type { QuickInputs, AutoScenariosResult } from "@/types/wealth-planning-v2";

export default function WealthPlanningV2Page() {
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
    <MeetingWizard onExportPDF={handleExportPDF} />
  );
}
