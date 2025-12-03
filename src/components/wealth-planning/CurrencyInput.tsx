"use client";

import { NumericFormat } from "react-number-format";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  disabled?: boolean;
  tooltip?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  tooltip,
  error,
  placeholder = "R$ 0,00",
  className = "",
}: CurrencyInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label className="font-sans font-medium text-[#262d3d]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger type="button">
                <Info className="h-4 w-4 text-[#577171] hover:text-[#262d3d] transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-sans text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <NumericFormat
        value={value}
        onValueChange={(values) => {
          onChange(values.floatValue || 0);
        }}
        thousandSeparator="."
        decimalSeparator=","
        prefix="R$ "
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
        disabled={disabled}
        className={`
          flex h-10 w-full rounded-md border bg-white px-3 py-2 
          text-sm font-sans text-[#262d3d] font-medium
          transition-all duration-200
          placeholder:text-[#577171]/50
          focus-visible:outline-none focus-visible:ring-2 
          disabled:cursor-not-allowed disabled:opacity-50
          ${error 
            ? 'border-red-300 focus-visible:ring-red-500 focus-visible:border-red-500' 
            : 'border-[#e3e3e3] focus-visible:ring-[#98ab44] focus-visible:border-[#98ab44]'
          }
        `}
        placeholder={placeholder}
      />

      {error && (
        <p className="text-xs text-red-600 font-sans">{error}</p>
      )}
    </div>
  );
}

// Variante para inputs inline (estilo planilha)
export function InlineCurrencyInput({
  value,
  onChange,
  disabled = false,
  className = "",
}: Pick<CurrencyInputProps, "value" | "onChange" | "disabled" | "className">) {
  return (
    <NumericFormat
      value={value}
      onValueChange={(values) => onChange(values.floatValue || 0)}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      disabled={disabled}
      className={`
        text-right border-0 bg-transparent p-0 h-auto
        text-sm font-medium font-sans text-[#262d3d]
        focus:ring-0 focus:outline-none
        hover:bg-[#e3e3e3]/30 rounded px-2 py-1
        transition-colors
        ${className}
      `}
    />
  );
}

