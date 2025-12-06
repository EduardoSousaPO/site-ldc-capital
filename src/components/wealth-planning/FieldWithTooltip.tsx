"use client";

import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FieldWithTooltipProps {
  label: string;
  tooltip?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}

export function FieldWithTooltip({
  label,
  tooltip,
  required = false,
  htmlFor,
  className,
}: FieldWithTooltipProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Label htmlFor={htmlFor} className="font-sans font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center"
                aria-label="Mais informações"
              >
                <Info className="h-4 w-4 text-[#577171] hover:text-[#262d3d] transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-sans text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
