"use client";

/**
 * F-019 — Botão "Gerar carrossel" no header de /admin/posts/edit/[id].
 *
 * Disabled quando post.published=false (CA-031). Tooltip explicativo.
 * Click → POST /api/admin/posts/[id]/carousel → modal preview com signed URL.
 *
 * Padrão visual verde-oliva #98ab44 (mesma cor do "Publicar"), ícone Layers.
 */

import { useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CarouselPreviewModal, type CarouselGenerationData } from "./CarouselPreviewModal";

interface CarouselButtonProps {
  postId: string;
  isPublished: boolean;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
  used?: number;
  limit?: number;
  carousel_run_id?: string;
  violations?: Array<{
    type: string;
    match: string;
    source?: { kind: string; index?: number };
  }>;
}

export function CarouselButton({ postId, isPublished }: CarouselButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CarouselGenerationData | null>(null);

  const handleClick = async () => {
    if (!isPublished) return;
    setGenerating(true);
    toast.info(
      "Gerando carrossel (até 3min — inclui geração de imagens AI). Não feche a aba.",
      { duration: 8000 },
    );
    try {
      const res = await fetch(`/api/admin/posts/${postId}/carousel`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
        if (res.status === 429) {
          toast.error(body.message ?? "Limite diário atingido (10/dia).");
          return;
        }
        if (res.status === 422 && body.violations) {
          const summary = body.violations
            .slice(0, 3)
            .map(
              (v) =>
                `${v.type}: "${v.match}" em ${v.source?.kind ?? "?"}${
                  v.source?.index ? ` #${v.source.index}` : ""
                }`,
            )
            .join("; ");
          toast.error(
            `Compliance bloqueou (${body.violations.length} violações): ${summary}`,
            { duration: 12000 },
          );
          return;
        }
        toast.error(body.message ?? `Falha (${res.status}).`);
        return;
      }
      const data = (await res.json()) as CarouselGenerationData;
      setResult(data);
      toast.success(
        `Carrossel gerado: ${data.slides.length} slides · custo R$${data.cost_brl.toFixed(4)}`,
        { duration: 8000 },
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao gerar carrossel.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={!isPublished || generating}
        title={
          !isPublished
            ? "Aprove o artigo antes de gerar carrossel"
            : "Gerar carrossel Instagram + LinkedIn"
        }
        className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white"
      >
        {generating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Layers className="w-4 h-4 mr-2" />
        )}
        Gerar carrossel
      </Button>

      {result && (
        <CarouselPreviewModal
          data={result}
          onClose={() => setResult(null)}
          onRegenerate={() => {
            setResult(null);
            void handleClick();
          }}
        />
      )}
    </>
  );
}
