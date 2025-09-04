"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DownloadButtonProps {
  material: { title: string };
}

export default function DownloadButton({ material }: DownloadButtonProps) {
  const handleDownload = () => {
    // In a real application, this would trigger the lead capture form
    // For now, we'll just show an alert
    alert(`Para baixar "${material.title}", preencha o formulário de contato com seus dados.`);
  };

  return (
    <Button
      onClick={handleDownload}
      className="w-full bg-[#98ab44] hover:bg-[#98ab44]/90 text-white"
    >
      <Download className="w-4 h-4 mr-2" />
      Baixar Grátis
    </Button>
  );
}
