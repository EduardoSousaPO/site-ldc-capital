"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OtherRevenues, OtherRevenue } from "@/types/wealth-planning";

interface OtherRevenuesFormProps {
  data: OtherRevenues;
  onChange: (data: OtherRevenues) => void;
}

export default function OtherRevenuesForm({
  data,
  onChange,
}: OtherRevenuesFormProps) {
  const [items, setItems] = useState<OtherRevenue[]>(data.items || []);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    onChange({ items, total });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const addRevenue = () => {
    const newRevenue: OtherRevenue = { source: "", value: 0 };
    setItems([...items, newRevenue]);
  };

  const removeRevenue = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const updateRevenue = (index: number, updates: Partial<OtherRevenue>) => {
    const updated = items.map((revenue, i) =>
      i === index ? { ...revenue, ...updates } : revenue
    );
    setItems(updated);
  };

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Contexto e Explicação */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-[#262d3d] mb-2 font-sans flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Receitas Adicionais e Benefícios
          </h3>
          <p className="text-sm text-gray-700 font-sans mb-3">
            Fontes de renda futuras como pensões, benefícios governamentais (INSS), 
            seguros de vida, planos de aposentadoria (PGBL/VGBL, 401(k)), renda de aluguéis, 
            dividendos e outras receitas complementam o planejamento.
          </p>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-2 font-sans">
              💡 Exemplos de fontes:
            </p>
            <ul className="text-xs text-gray-600 font-sans space-y-1">
              <li>• Benefícios do empregador (matching em planos de aposentadoria)</li>
              <li>• Seguros de vida ou saúde</li>
              <li>• Pensões e benefícios governamentais (INSS, Social Security)</li>
              <li>• Renda de aluguéis</li>
              <li>• Dividendos e outras receitas passivas</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Label className="font-sans font-medium">Outras Receitas</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-sans text-sm">
                    Adicione todas as fontes de receita adicionais que não foram incluídas 
                    nas seções anteriores. Isso ajuda a calcular o patrimônio total e a renda futura.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRevenue}
              className="font-sans"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Receita
            </Button>
          </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 font-sans text-center py-4">
            Nenhuma receita adicionada
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((revenue, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Fonte</Label>
                  <Input
                    value={revenue.source}
                    onChange={(e) =>
                      updateRevenue(index, { source: e.target.value })
                    }
                    className="font-sans text-sm"
                    placeholder="FGTS, aluguel, INSS, etc."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Valor (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={revenue.value || ""}
                    onChange={(e) =>
                      updateRevenue(index, {
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="font-sans text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Observações</Label>
                  <Input
                    value={revenue.observations || ""}
                    onChange={(e) =>
                      updateRevenue(index, { observations: e.target.value })
                    }
                    className="font-sans text-sm"
                    placeholder="Observações"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRevenue(index)}
                    className="font-sans text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-sans font-medium text-green-800">Total das Receitas Adicionais:</span>
              <span className="font-sans font-semibold text-green-700 text-lg">
                R${" "}
                {total.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <p className="text-xs text-green-600 font-sans mt-2">
              Este valor será considerado no cálculo do patrimônio total e na projeção de renda futura.
            </p>
          </div>
        )}
        </div>
      </div>
    </TooltipProvider>
  );
}

