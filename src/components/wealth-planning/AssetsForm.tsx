"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import type { Assets, Asset } from "@/types/wealth-planning";

interface AssetsFormProps {
  data: Assets;
  onChange: (data: Assets) => void;
}

export default function AssetsForm({ data, onChange }: AssetsFormProps) {
  const [items, setItems] = useState<Asset[]>(
    data.items && data.items.length > 0
      ? data.items
      : [{ name: "Casa Própria", value: 0, sellable: false }]
  );

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    onChange({ items, total });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const addAsset = () => {
    const newAsset: Asset = { name: "", value: 0, sellable: false };
    setItems([...items, newAsset]);
  };

  const removeAsset = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const updateAsset = (index: number, updates: Partial<Asset>) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    setItems(updated);
  };

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="font-sans font-medium">Bens Móveis e Imóveis</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAsset}
            className="font-sans"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Bem
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-sans text-sm font-medium">
                  Bem
                </th>
                <th className="text-right p-2 font-sans text-sm font-medium">
                  Valor (R$)
                </th>
                <th className="text-center p-2 font-sans text-sm font-medium">
                  Vendável
                </th>
                <th className="text-right p-2 font-sans text-sm font-medium">
                  Renda de Aluguel (R$/mês)
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        updateAsset(index, { name: e.target.value })
                      }
                      className="font-sans text-sm"
                      placeholder="Nome do bem"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.value || ""}
                      onChange={(e) =>
                        updateAsset(index, {
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="font-sans text-sm text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Checkbox
                      checked={item.sellable}
                      onCheckedChange={(checked) =>
                        updateAsset(index, { sellable: !!checked })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rentalIncome || ""}
                      onChange={(e) =>
                        updateAsset(index, {
                          rentalIncome: parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="font-sans text-sm text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAsset(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="p-2 font-sans">Total</td>
                <td className="p-2 text-right font-sans">
                  R${" "}
                  {total.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

