"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickInputs, AutoScenariosResult } from "@/types/wealth-planning-v2";

interface ScenarioExportImportProps {
  inputs: QuickInputs;
  scenarios: AutoScenariosResult;
  onImport: (inputs: QuickInputs) => void;
  className?: string;
}

export function ScenarioExportImport({
  inputs,
  scenarios,
  onImport,
  className,
}: ScenarioExportImportProps) {
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export como JSON
  const handleExportJSON = () => {
    const exportData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      tool: "LDC Capital — Wealth Planning v2",
      inputs,
      scenariosSummary: {
        conservative: {
          targetCapital: scenarios.conservative.targetCapital,
          projectedCapital: scenarios.conservative.projectedCapital,
          reachesGoal: scenarios.conservative.reachesGoal,
        },
        base: {
          targetCapital: scenarios.base.targetCapital,
          projectedCapital: scenarios.base.projectedCapital,
          reachesGoal: scenarios.base.reachesGoal,
        },
        optimistic: {
          targetCapital: scenarios.optimistic.targetCapital,
          projectedCapital: scenarios.optimistic.projectedCapital,
          reachesGoal: scenarios.optimistic.reachesGoal,
        },
      },
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wp-${inputs.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copiar JSON para clipboard
  const handleCopyJSON = async () => {
    const exportData = { version: "2.0", inputs };
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = JSON.stringify(exportData, null, 2);
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Import de arquivo JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.inputs && data.inputs.name && data.inputs.age) {
          onImport(data.inputs);
          setImportError(null);
        } else {
          setImportError("Formato inválido: o arquivo não contém inputs válidos.");
        }
      } catch {
        setImportError("Erro ao ler o arquivo. Verifique se é um JSON válido.");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExportJSON}
        className="font-sans text-xs"
      >
        <Download className="mr-1 h-3 w-3" />
        Exportar JSON
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopyJSON}
        className="font-sans text-xs"
      >
        {copied ? <Check className="mr-1 h-3 w-3 text-green-500" /> : <Copy className="mr-1 h-3 w-3" />}
        {copied ? "Copiado!" : "Copiar"}
      </Button>

      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="font-sans text-xs"
        >
          <Upload className="mr-1 h-3 w-3" />
          Importar JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {importError && (
        <span className="text-xs text-red-500 font-sans">{importError}</span>
      )}
    </div>
  );
}
