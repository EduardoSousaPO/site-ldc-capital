"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MacroeconomicAssumptions } from "@/types/wealth-planning";

interface AssumptionsFormProps {
  data: MacroeconomicAssumptions;
  onChange: (data: MacroeconomicAssumptions) => void;
}

export default function AssumptionsForm({
  data,
  onChange,
}: AssumptionsFormProps) {
  const updateData = (updates: Partial<MacroeconomicAssumptions>) => {
    onChange({ ...data, ...updates });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="annualInflation" className="font-sans font-medium">
          Inflação Anual (%)
        </Label>
        <Input
          id="annualInflation"
          type="number"
          min="0"
          step="0.1"
          value={data.annualInflation || ""}
          onChange={(e) =>
            updateData({ annualInflation: parseFloat(e.target.value) || 0 })
          }
          className="font-sans"
          placeholder="3.5"
        />
        <p className="text-xs text-gray-500 font-sans">
          Taxa de inflação esperada anualmente
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="annualCDI" className="font-sans font-medium">
          CDI Anual (%)
        </Label>
        <Input
          id="annualCDI"
          type="number"
          min="0"
          step="0.1"
          value={data.annualCDI || ""}
          onChange={(e) =>
            updateData({ annualCDI: parseFloat(e.target.value) || 0 })
          }
          className="font-sans"
          placeholder="9.7"
        />
        <p className="text-xs text-gray-500 font-sans">
          Taxa base de referência (CDI)
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="retirementReturnNominal"
          className="font-sans font-medium"
        >
          Rentabilidade Aposentadoria sem I.R (%)
        </Label>
        <Input
          id="retirementReturnNominal"
          type="number"
          min="0"
          step="0.1"
          value={data.retirementReturnNominal || ""}
          onChange={(e) =>
            updateData({
              retirementReturnNominal: parseFloat(e.target.value) || 0,
            })
          }
          className="font-sans"
          placeholder="9.7"
        />
        <p className="text-xs text-gray-500 font-sans">
          Taxa nominal de retorno considerada para aposentadoria
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="retirementRealRate" className="font-sans font-medium">
          Juro Real na Aposentadoria (%)
        </Label>
        <Input
          id="retirementRealRate"
          type="number"
          min="0"
          step="0.01"
          value={data.retirementRealRate || ""}
          onChange={(e) =>
            updateData({
              retirementRealRate: parseFloat(e.target.value) || 0,
            })
          }
          className="font-sans"
          placeholder="5.99"
        />
        <p className="text-xs text-gray-500 font-sans">
          Taxa real obtida após descontar inflação
        </p>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-sans">
          <strong>Nota:</strong> Estes valores são premissas macroeconômicas
          que serão usadas nos cálculos de projeção. Ajuste conforme suas
          expectativas de mercado.
        </p>
      </div>
    </div>
  );
}

