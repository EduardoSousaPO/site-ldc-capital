"use client";

/**
 * F-019 v2.0 — Modal pós-geração: download + preview metadata.
 *
 * Pivot 2026-05-09 (ADR-006): suporta dual variation. Mostra grid simples
 * dos slides (com ícone se imagem AI presente) + link para baixar ZIP que
 * contém ldc/ + luciano/. Não baixa thumbnails do bucket (privado).
 */

import { Download, RefreshCw, X, ImageIcon, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface CarouselGenerationData {
  carousel_run_id: string;
  signed_url: string;
  expires_at: string;
  zip_pathname: string;
  zip_size_bytes: number;
  slides: Array<{
    index: number;
    type: string;
    title: string;
    has_image: boolean;
  }>;
  cost_brl: number;
  text_cost_brl?: number;
  image_cost_brl?: number;
  total_tokens: number;
  cost_exceeded: boolean;
  image_gen_failures?: Array<{
    slide_index: number;
    reason: string;
    error_message: string;
  }>;
}

interface CarouselPreviewModalProps {
  data: CarouselGenerationData;
  onClose: () => void;
  onRegenerate: () => void;
}

function formatKB(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatRelativeExpiry(iso: string): string {
  const ts = new Date(iso).getTime();
  const diffMs = ts - Date.now();
  if (diffMs <= 0) return "expirado";
  const hours = Math.round(diffMs / (60 * 60 * 1000));
  return `expira em ~${hours}h`;
}

export function CarouselPreviewModal({
  data,
  onClose,
  onRegenerate,
}: CarouselPreviewModalProps) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.signed_url);
      toast.success("Link copiado.");
    } catch {
      toast.error("Falha ao copiar link.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#262d3d]">
              Carrossel gerado
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-sans">
              Formato X-mock screenshot · 2 variações: <code>ldc/</code> + <code>luciano/</code>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 font-sans">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Run ID: <code className="text-xs">{data.carousel_run_id}</code>
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{data.slides.length} slides</Badge>
              <Badge variant="outline">{formatKB(data.zip_size_bytes)}</Badge>
              <Badge variant="outline">R$ {data.cost_brl.toFixed(4)}</Badge>
              <Badge variant="outline">
                {data.total_tokens.toLocaleString("pt-BR")} tokens
              </Badge>
              {data.cost_exceeded && (
                <Badge variant="destructive">cost &gt; guard</Badge>
              )}
              {data.image_gen_failures && data.image_gen_failures.length > 0 && (
                <Badge variant="secondary">
                  {data.image_gen_failures.length} imagem(ns) com fallback
                </Badge>
              )}
            </div>
            {(data.text_cost_brl !== undefined ||
              data.image_cost_brl !== undefined) && (
              <p className="text-xs text-gray-500">
                Texto: R$ {(data.text_cost_brl ?? 0).toFixed(4)} · Imagens (DALL-E):
                R$ {(data.image_cost_brl ?? 0).toFixed(4)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-lg font-semibold text-[#262d3d]">
              Slides (mesmos em ldc/ e luciano/, só muda o header)
            </h3>
            <ul className="space-y-1">
              {data.slides.map((s) => (
                <li
                  key={s.index}
                  className="flex items-center gap-3 text-sm border border-gray-200 rounded-md p-2"
                >
                  <span className="font-mono text-xs text-gray-500 w-8">
                    {s.index}/{data.slides.length}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {s.type}
                  </Badge>
                  {s.has_image ? (
                    <ImageIcon className="w-4 h-4 text-emerald-600" aria-label="com imagem AI" />
                  ) : (
                    <Type className="w-4 h-4 text-gray-400" aria-label="text-only" />
                  )}
                  <span className="text-[#262d3d] truncate flex-1">
                    {s.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-3">
            <p className="text-gray-700">
              ZIP contém <strong>ldc/</strong> (institucional) +{" "}
              <strong>luciano/</strong> (pessoal) com 6 PNGs cada (1080×1350) +
              captions IG/LinkedIn + README. Link assinado{" "}
              <strong>{formatRelativeExpiry(data.expires_at)}</strong>.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={data.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar ZIP
                </Button>
              </a>
              <Button variant="outline" onClick={handleCopyLink}>
                Copiar link
              </Button>
              <Button variant="outline" onClick={onRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
