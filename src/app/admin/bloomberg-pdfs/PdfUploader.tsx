"use client";

/**
 * F-016b — UI de upload + auto-trigger do pipeline IA.
 *
 * Fluxo:
 *   1. Eduardo arrasta 1..N PDFs (HTML5 dragdrop, sem dep externa).
 *   2. Validação client-side: MIME `application/pdf`, ≤10MB cada, ≤10 arquivos.
 *   3. POST multipart `/api/admin/bloomberg-pdfs/upload`.
 *   4. Toast sucesso + countdown 30s. Cada novo upload reseta o timer (debounce
 *      verdadeiro: cancela trigger pendente e recomeça).
 *   5. Ao zerar o countdown, POST `/api/admin/bloomberg-pdfs/trigger-pipeline`.
 *   6. Mostra resumo do GenerationResult com link para `/admin/posts`.
 *
 * Drag&drop nativo escolhido para evitar dep nova (`react-dropzone`) — o uso é
 * simples e não justifica o bundle extra.
 */

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  CloudUpload,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import AdminLayout from "../components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PdfEntry {
  url: string;
  pathname: string;
  size_bytes: number;
  uploaded_at: string;
}

interface GenerationResultClient {
  run_id: string;
  status: "running" | "success" | "failed";
  briefings_pending_review: number;
  briefings_blocked: number;
  themes_discarded: number;
  duration_ms: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;
const DEBOUNCE_SECONDS = 30;
const BLOB_PREFIX = "bloomberg-pdfs/";

function slugifyFilename(raw: string): string {
  const withoutExt = raw.replace(/\.pdf$/i, "");
  const slug = withoutExt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug.length > 0 ? slug : "bloomberg-pdf";
}

function timestampUtc(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "-" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k)),
  );
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return iso;
  const diffMs = Date.now() - ts;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "há instantes";
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function pathnameTail(pathname: string): string {
  const ix = pathname.lastIndexOf("/");
  return ix >= 0 ? pathname.slice(ix + 1) : pathname;
}

export default function PdfUploader() {
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [lastResult, setLastResult] = useState<GenerationResultClient | null>(
    null,
  );

  const triggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPdfs = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/admin/bloomberg-pdfs", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { pdfs: PdfEntry[] };
        setPdfs(data.pdfs ?? []);
      } else {
        toast.error("Falha ao carregar lista de PDFs");
      }
    } catch {
      toast.error("Falha ao carregar lista de PDFs");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPdfs();
  }, [fetchPdfs]);

  useEffect(() => {
    return () => {
      if (triggerTimerRef.current) clearTimeout(triggerTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, []);

  const triggerPipelineNow = useCallback(async () => {
    setTriggering(true);
    setCountdown(null);
    try {
      const res = await fetch(
        "/api/admin/bloomberg-pdfs/trigger-pipeline",
        { method: "POST" },
      );
      if (res.status === 503) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        toast.error(
          body.message ??
            "Pipeline desligado em produção. Liga em Vercel envs antes de disparar.",
          { duration: 8000 },
        );
        return;
      }
      if (!res.ok) {
        toast.error(`Falha ao disparar pipeline (${res.status})`);
        return;
      }
      const result = (await res.json()) as GenerationResultClient;
      setLastResult(result);
      const okMsg =
        result.status === "success"
          ? `Pipeline OK: ${result.briefings_pending_review} draft(s) gerado(s).`
          : `Pipeline falhou (status=${result.status}).`;
      toast.success(okMsg, { duration: 8000 });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Erro ao disparar pipeline: ${err.message}`
          : "Erro ao disparar pipeline",
      );
    } finally {
      setTriggering(false);
    }
  }, []);

  const scheduleAutoTrigger = useCallback(() => {
    if (triggerTimerRef.current) clearTimeout(triggerTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    setCountdown(DEBOUNCE_SECONDS);
    tickTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    triggerTimerRef.current = setTimeout(() => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
      triggerTimerRef.current = null;
      void triggerPipelineNow();
    }, DEBOUNCE_SECONDS * 1000);
  }, [triggerPipelineNow]);

  const cancelAutoTrigger = useCallback(() => {
    if (triggerTimerRef.current) {
      clearTimeout(triggerTimerRef.current);
      triggerTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    setCountdown(null);
  }, []);

  const validateFiles = (files: File[]): { valid: File[]; error?: string } => {
    if (files.length === 0) return { valid: [], error: "Nenhum arquivo." };
    if (files.length > MAX_FILES) {
      return { valid: [], error: `Máximo ${MAX_FILES} arquivos por upload.` };
    }
    for (const f of files) {
      if (f.type !== "application/pdf") {
        return { valid: [], error: `"${f.name}" não é PDF.` };
      }
      if (f.size <= 0) {
        return { valid: [], error: `"${f.name}" está vazio.` };
      }
      if (f.size > MAX_FILE_SIZE) {
        return {
          valid: [],
          error: `"${f.name}" passa de 10MB (${formatBytes(f.size)}).`,
        };
      }
    }
    return { valid: files };
  };

  const performUpload = useCallback(
    async (files: File[]) => {
      const { valid, error } = validateFiles(files);
      if (error) {
        toast.error(error);
        return;
      }
      setUploading(true);
      const ts = timestampUtc();
      let succeeded = 0;
      try {
        for (let i = 0; i < valid.length; i++) {
          const file = valid[i];
          const slug = slugifyFilename(file.name);
          const pathname = `${BLOB_PREFIX}${ts}-${i}-${slug}.pdf`;
          try {
            await upload(pathname, file, {
              access: "public",
              contentType: "application/pdf",
              handleUploadUrl: "/api/admin/bloomberg-pdfs/upload",
            });
            succeeded++;
          } catch (err) {
            console.error("Upload failed", { name: file.name, err });
            toast.error(
              err instanceof Error
                ? `"${file.name}": ${err.message}`
                : `"${file.name}": erro de upload`,
              { duration: 8000 },
            );
          }
        }
        if (succeeded > 0) {
          toast.success(
            `${succeeded} PDF(s) enviado(s) — pipeline em ${DEBOUNCE_SECONDS}s`,
            { duration: 5000 },
          );
          await fetchPdfs();
          scheduleAutoTrigger();
        }
      } finally {
        setUploading(false);
      }
    },
    [fetchPdfs, scheduleAutoTrigger],
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploading) return;
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) void performUpload(files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) void performUpload(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (pathname: string) => {
    if (
      !window.confirm(
        `Deletar PDF "${pathnameTail(pathname)}"? A operação é irreversível.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/bloomberg-pdfs/${encodeURIComponent(pathname)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        toast.error(`Falha ao deletar (${res.status})`);
        return;
      }
      toast.success("PDF deletado.");
      setPdfs((prev) => prev.filter((p) => p.pathname !== pathname));
    } catch {
      toast.error("Erro ao deletar PDF.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">
            PDFs Bloomberg
          </h1>
          <p className="text-gray-600 font-sans">
            Arraste PDFs do Bloomberg Terminal aqui. Após o upload, o pipeline
            IA será disparado automaticamente em {DEBOUNCE_SECONDS} segundos —
            cada novo arquivo durante esse intervalo reseta o contador.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!uploading) fileInputRef.current?.click();
              }}
              role="button"
              tabIndex={0}
              aria-label="Área de upload"
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-[#98ab44] bg-[#98ab44]/5"
                  : "border-gray-300 hover:border-[#98ab44]/50 hover:bg-gray-50"
              } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                onChange={handleFileInput}
                disabled={uploading}
              />
              <div className="flex flex-col items-center">
                <CloudUpload
                  className={`h-12 w-12 mb-4 ${
                    isDragging ? "text-[#98ab44]" : "text-gray-400"
                  }`}
                />
                <h3 className="font-serif text-xl font-semibold text-[#262d3d] mb-2">
                  {isDragging
                    ? "Solte os PDFs aqui"
                    : "Arraste PDFs Bloomberg aqui"}
                </h3>
                <p className="text-gray-500 font-sans mb-4">
                  ou clique para escolher arquivos (até {MAX_FILES} PDFs, 10MB
                  cada)
                </p>
                <Button
                  type="button"
                  className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
                  disabled={uploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!uploading) fileInputRef.current?.click();
                  }}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CloudUpload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? "Enviando..." : "Selecionar PDFs"}
                </Button>
              </div>
            </div>

            {countdown !== null && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <div className="font-sans">
                    <p className="font-medium text-amber-900">
                      Pipeline em {countdown}s
                    </p>
                    <p className="text-sm text-amber-700">
                      Cada novo upload reseta o contador. Você pode disparar
                      agora ou cancelar.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-sans"
                    onClick={() => {
                      cancelAutoTrigger();
                      void triggerPipelineNow();
                    }}
                  >
                    <Zap className="mr-1 h-4 w-4" />
                    Disparar agora
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-sans"
                    onClick={cancelAutoTrigger}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {triggering && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="font-sans">
                  <p className="font-medium text-blue-900">
                    Disparando pipeline...
                  </p>
                  <p className="text-sm text-blue-700">
                    Pode levar até 2 minutos. Não feche a aba.
                  </p>
                </div>
              </div>
            )}

            {lastResult && !triggering && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 font-sans">
                <p className="font-medium text-emerald-900 mb-1">
                  Última execução: {lastResult.status}
                </p>
                <ul className="text-sm text-emerald-800 space-y-0.5">
                  <li>
                    Drafts gerados:{" "}
                    <strong>{lastResult.briefings_pending_review}</strong>
                  </li>
                  <li>
                    Bloqueados (compliance):{" "}
                    <strong>{lastResult.briefings_blocked}</strong>
                  </li>
                  <li>
                    Descartados (sem fonte pública):{" "}
                    <strong>{lastResult.themes_discarded}</strong>
                  </li>
                  <li>Duração: {(lastResult.duration_ms / 1000).toFixed(1)}s</li>
                </ul>
                <Link
                  href="/admin/posts"
                  className="inline-block mt-3 text-sm text-emerald-700 underline"
                >
                  Ver drafts em /admin/posts →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-[#262d3d]">
                PDFs recentes
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="font-sans"
                onClick={fetchPdfs}
                disabled={listLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    listLoading ? "animate-spin" : ""
                  }`}
                />
                Atualizar
              </Button>
            </div>

            {listLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : pdfs.length === 0 ? (
              <p className="text-center text-gray-500 font-sans py-10">
                Nenhum PDF nos últimos 30 dias. Arraste arquivos acima para
                começar.
              </p>
            ) : (
              <ul className="space-y-2">
                {pdfs.map((pdf) => (
                  <li
                    key={pdf.pathname}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-medium text-[#262d3d] truncate">
                          {pathnameTail(pdf.pathname)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-sans">
                            {formatBytes(pdf.size_bytes)}
                          </Badge>
                          <span className="text-xs text-gray-500 font-sans">
                            {formatRelative(pdf.uploaded_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 font-sans"
                      onClick={() => handleDelete(pdf.pathname)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
