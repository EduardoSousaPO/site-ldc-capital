"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { Portfolio, PortfolioAsset, TaxConsideration } from "@/types/wealth-planning";

interface PortfolioFormProps {
  data: Portfolio;
  onChange: (data: Portfolio) => void;
}

export default function PortfolioForm({ data, onChange }: PortfolioFormProps) {
  const [assets, setAssets] = useState<PortfolioAsset[]>(
    data.assets && data.assets.length > 0
      ? data.assets
      : [{ name: "Carteira", value: 0, percentage: 100, cdiRate: 0.097 }]
  );

  useEffect(() => {
    // Recalcular percentuais quando valores mudarem
    const total = assets.reduce((sum, asset) => sum + asset.value, 0);
    const updated = assets.map((asset) => ({
      ...asset,
      percentage: total > 0 ? (asset.value / total) * 100 : 0,
    }));
    setAssets(updated);
    onChange({
      ...data,
      assets: updated,
      total,
    });
  }, [assets.map((a) => a.value).join(",")]);

  const addAsset = () => {
    const newAsset: PortfolioAsset = {
      name: "",
      value: 0,
      percentage: 0,
      cdiRate: 0,
    };
    setAssets([...assets, newAsset]);
  };

  const removeAsset = (index: number) => {
    if (assets.length > 1) {
      const updated = assets.filter((_, i) => i !== index);
      setAssets(updated);
    }
  };

  const updateAsset = (index: number, updates: Partial<PortfolioAsset>) => {
    const updated = assets.map((asset, i) =>
      i === index ? { ...asset, ...updates } : asset
    );
    setAssets(updated);
  };

  const total = assets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="font-sans font-medium">Composição da Carteira</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAsset}
            className="font-sans"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Ativo
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-sans text-sm font-medium">
                  Ativo
                </th>
                <th className="text-right p-2 font-sans text-sm font-medium">
                  Valor (R$)
                </th>
                <th className="text-right p-2 font-sans text-sm font-medium">
                  % da Carteira
                </th>
                <th className="text-right p-2 font-sans text-sm font-medium">
                  Rentabilidade (% CDI)
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">
                    <Input
                      value={asset.name}
                      onChange={(e) =>
                        updateAsset(index, { name: e.target.value })
                      }
                      className="font-sans text-sm"
                      placeholder="Nome do ativo"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={asset.value || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        updateAsset(index, { value });
                      }}
                      className="font-sans text-sm text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">
                    <div className="text-right font-sans text-sm">
                      {asset.percentage.toFixed(2)}%
                    </div>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={asset.cdiRate || ""}
                      onChange={(e) =>
                        updateAsset(index, {
                          cdiRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="font-sans text-sm text-right"
                      placeholder="0.097"
                    />
                  </td>
                  <td className="p-2">
                    {assets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAsset(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
                <td className="p-2 text-right font-sans">100.00%</td>
                <td className="p-2"></td>
                <td className="p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taxConsideration" className="font-sans font-medium">
            I.R Considerado
          </Label>
          <Select
            value={data.taxConsideration}
            onValueChange={(value) =>
              onChange({ ...data, taxConsideration: value as TaxConsideration })
            }
          >
            <SelectTrigger className="font-sans w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sem considerar I.R">
                Sem considerar I.R
              </SelectItem>
              <SelectItem value="Considerando I.R">Considerando I.R</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="immediateLiquidityNeeds"
            className="font-sans font-medium"
          >
            Necessidade de Liquidez Imediata (%)
          </Label>
          <Input
            id="immediateLiquidityNeeds"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={data.immediateLiquidityNeeds || ""}
            onChange={(e) =>
              onChange({
                ...data,
                immediateLiquidityNeeds: parseFloat(e.target.value) || 0,
              })
            }
            className="font-sans"
            placeholder="20"
          />
        </div>
      </div>
    </div>
  );
}

