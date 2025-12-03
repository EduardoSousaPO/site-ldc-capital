"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import type { Debts, Debt } from "@/types/wealth-planning";

interface DebtsFormProps {
  data: Debts;
  onChange: (data: Debts) => void;
}

export default function DebtsForm({ data, onChange }: DebtsFormProps) {
  const [items, setItems] = useState<Debt[]>(data.items || []);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.balance, 0);
    onChange({ items, total });
  }, [items]);

  const addDebt = () => {
    const newDebt: Debt = {
      description: "",
      balance: 0,
      term: 0,
      hasLifeInsurance: false,
    };
    setItems([...items, newDebt]);
  };

  const removeDebt = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const updateDebt = (index: number, updates: Partial<Debt>) => {
    const updated = items.map((debt, i) =>
      i === index ? { ...debt, ...updates } : debt
    );
    setItems(updated);
  };

  const total = items.reduce((sum, item) => sum + item.balance, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="font-sans font-medium">
            Financiamentos e Dívidas
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDebt}
            className="font-sans"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Dívida
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 font-sans text-center py-4">
            Nenhuma dívida adicionada
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((debt, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Descrição</Label>
                  <Input
                    value={debt.description}
                    onChange={(e) =>
                      updateDebt(index, { description: e.target.value })
                    }
                    className="font-sans text-sm"
                    placeholder="Descrição da dívida"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Saldo Devedor (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={debt.balance || ""}
                    onChange={(e) =>
                      updateDebt(index, {
                        balance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="font-sans text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Prazo (anos)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={debt.term || ""}
                    onChange={(e) =>
                      updateDebt(index, {
                        term: parseInt(e.target.value) || 0,
                      })
                    }
                    className="font-sans text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1 flex items-end">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`insurance-${index}`}
                      checked={debt.hasLifeInsurance}
                      onCheckedChange={(checked) =>
                        updateDebt(index, { hasLifeInsurance: !!checked })
                      }
                    />
                    <Label
                      htmlFor={`insurance-${index}`}
                      className="text-xs font-sans cursor-pointer"
                    >
                      Com Seguro
                    </Label>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDebt(index)}
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
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-sans font-medium">Total das Dívidas:</span>
              <span className="font-sans font-semibold">
                R${" "}
                {total.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

