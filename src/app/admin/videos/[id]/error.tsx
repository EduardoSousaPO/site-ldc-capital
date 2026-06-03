"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VideoDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na página de detalhe do vídeo:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <div>
        <h2 className="text-lg font-semibold text-[#262d3d]">Algo deu errado</h2>
        <p className="text-sm text-gray-500">
          Não foi possível carregar este vídeo. Tente novamente.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} className="bg-[#262d3d] hover:bg-[#344645]">
          Tentar novamente
        </Button>
        <Link href="/admin/videos">
          <Button variant="outline">Voltar à lista</Button>
        </Link>
      </div>
    </div>
  );
}
