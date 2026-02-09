"use client";

import { useState } from "react";
import { FieldWithTooltip } from "@/components/wealth-planning/FieldWithTooltip";
import { cn } from "@/lib/utils";
import type { RangeOption } from "@/types/wealth-planning-v2";

interface RangeInputProps {
  label: string;
  tooltip: string;
  ranges: RangeOption[];
  value: number;
  isRange: boolean;
  onChange: (value: number, isRange: boolean) => void;
  required?: boolean;
  className?: string;
}

export function RangeInput({
  label,
  tooltip,
  ranges,
  value,
  isRange,
  onChange,
  required = false,
  className,
}: RangeInputProps) {
  const [editingExact, setEditingExact] = useState(!isRange);
  const [exactValue, setExactValue] = useState(value.toString());

  // Encontrar range selecionado
  const selectedRange = ranges.find(
    (r) => value >= r.min && value <= r.max
  );

  const handleRangeSelect = (range: RangeOption) => {
    setEditingExact(false);
    onChange(range.midpoint, true);
  };

  const handleSwitchToExact = () => {
    setEditingExact(true);
    setExactValue(value.toString());
  };

  const handleExactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setExactValue(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      onChange(num, false);
    }
  };

  const handleSwitchToRange = () => {
    setEditingExact(false);
    // Encontrar o range mais próximo do valor atual
    let closest = ranges[0];
    let minDist = Infinity;
    for (const r of ranges) {
      const dist = Math.abs(value - r.midpoint);
      if (dist < minDist) {
        minDist = dist;
        closest = r;
      }
    }
    onChange(closest.midpoint, true);
  };

  const formatBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <FieldWithTooltip
          label={label}
          tooltip={tooltip}
          required={required}
        />
        <button
          type="button"
          onClick={editingExact ? handleSwitchToRange : handleSwitchToExact}
          className="text-xs text-[#98ab44] hover:text-[#98ab44]/80 font-sans font-medium transition-colors"
        >
          {editingExact ? "← Usar faixas" : "Valor exato →"}
        </button>
      </div>

      {editingExact ? (
        /* Modo exato */
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#577171] font-sans">
            R$
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={exactValue ? Number(exactValue).toLocaleString("pt-BR") : ""}
            onChange={handleExactChange}
            className="w-full pl-10 pr-4 py-3 border-2 border-[#e3e3e3] rounded-lg focus:border-[#98ab44] focus:ring-1 focus:ring-[#98ab44]/30 outline-none font-sans text-[#262d3d] text-lg transition-colors"
            placeholder="0"
            autoFocus
          />
        </div>
      ) : (
        /* Modo faixas */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ranges.map((range) => {
            const isSelected =
              selectedRange?.label === range.label ||
              (value === range.midpoint);
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => handleRangeSelect(range)}
                className={cn(
                  "px-3 py-3 rounded-lg border-2 text-sm font-sans font-medium transition-all duration-200",
                  isSelected
                    ? "border-[#98ab44] bg-[#98ab44]/10 text-[#262d3d] shadow-sm"
                    : "border-[#e3e3e3] bg-white text-[#577171] hover:border-[#98ab44]/50 hover:bg-[#98ab44]/5"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Valor atual exibido abaixo */}
      {!editingExact && value > 0 && (
        <p className="text-xs text-[#577171] font-sans">
          Valor usado para cálculo: <span className="font-medium text-[#262d3d]">{formatBRL(value)}</span>
        </p>
      )}
    </div>
  );
}
