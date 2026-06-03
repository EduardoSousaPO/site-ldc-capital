"use client";

import { ReactNode } from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  /** Texto explicativo opcional (mostrado no hover do ícone de info). */
  hint?: string;
  icon?: ReactNode;
}

/** Card de métrica com tooltip explicativo (a11y: botão focável). */
export function KpiCard({ label, value, hint, icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </span>
          <div className="flex items-center gap-1 text-gray-400">
            {icon}
            {hint && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    aria-label={`O que é ${label}`}
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#98ab44]"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px]">{hint}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="mt-1 text-2xl font-semibold text-[#262d3d]">{value}</div>
      </CardContent>
    </Card>
  );
}
