"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-system";

interface PDFGeneratorProps {
  scenarioId: string;
  clientName?: string;
  scenarioTitle?: string;
}

export default function PDFGenerator({ 
  scenarioId
}: PDFGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();

  const handleGeneratePDF = async () => {
    setGenerating(true);
    
    try {
      showToast("Gerando relatório...", "info");
      
      // Abrir relatório direto em nova aba (API aceita GET agora)
      const url = `/api/admin/wealth-planning/scenarios/${scenarioId}/pdf`;
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        showToast("Por favor, permita pop-ups para visualizar o relatório", "warning");
      } else {
        showToast("Relatório aberto em nova aba! Use Ctrl+P para salvar como PDF.", "success");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showToast("Erro ao gerar relatório. Tente novamente.", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGeneratePDF}
      disabled={generating}
      className="bg-[#262d3d] hover:bg-[#262d3d]/90 text-white font-sans"
    >
      {generating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}

