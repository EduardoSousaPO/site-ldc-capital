"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, AlertCircle, X } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date;
  error?: string;
  onDismiss?: () => void;
}

export function SaveIndicator({ 
  status, 
  lastSaved, 
  error,
  onDismiss 
}: SaveIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status !== "idle") {
      setIsVisible(true);
    }

    if (status === "saved") {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!isVisible) return null;

  const formatTimeAgo = (date?: Date) => {
    if (!date) return "";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `há ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `há ${hours}h`;
  };

  return (
    <div className={`
      fixed top-20 right-6 z-50 
      transition-all duration-300 transform
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      {status === "saving" && (
        <div className="bg-white shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 border border-[#98ab44]/20 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-[#98ab44]" />
          <span className="text-sm font-sans text-[#262d3d] font-medium">
            Salvando alterações...
          </span>
        </div>
      )}

      {status === "saved" && (
        <div className="bg-[#98ab44]/10 shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 border border-[#98ab44]">
          <Check className="h-4 w-4 text-[#98ab44]" />
          <div>
            <span className="text-sm font-sans text-[#262d3d] font-medium block">
              Alterações salvas
            </span>
            {lastSaved && (
              <span className="text-xs font-sans text-[#577171]">
                {formatTimeAgo(lastSaved)}
              </span>
            )}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 border border-red-300">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div className="flex-1">
            <span className="text-sm font-sans text-red-600 font-medium block">
              Erro ao salvar
            </span>
            {error && (
              <span className="text-xs font-sans text-red-500">
                {error}
              </span>
            )}
          </div>
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="ml-2 hover:bg-red-100 rounded p-1 transition-colors"
            >
              <X className="h-3 w-3 text-red-600" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Hook para gerenciar o estado de salvamento
export function useSaveIndicator() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date>();
  const [error, setError] = useState<string>();

  const startSaving = () => {
    setStatus("saving");
    setError(undefined);
  };

  const markSaved = () => {
    setStatus("saved");
    setLastSaved(new Date());
  };

  const markError = (errorMessage: string) => {
    setStatus("error");
    setError(errorMessage);
  };

  const reset = () => {
    setStatus("idle");
    setError(undefined);
  };

  return {
    status,
    lastSaved,
    error,
    startSaving,
    markSaved,
    markError,
    reset,
  };
}

