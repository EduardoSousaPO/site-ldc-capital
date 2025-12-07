"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HOLDING_TYPES } from "@/lib/checkup-ldc/constants";
import { suggestHoldingType, applyTypeToSimilar } from "@/features/checkup-ldc/classification/heuristics";
import type { RawHolding, HoldingType } from "@/features/checkup-ldc/types";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TypeConfirmationProps {
  holdings: RawHolding[];
  onConfirmed: (holdings: Array<RawHolding & { tipo: HoldingType }>) => void;
}

export function TypeConfirmation({ holdings, onConfirmed }: TypeConfirmationProps) {
  const [typedHoldings, setTypedHoldings] = useState<Array<RawHolding & { tipo: HoldingType }>>(() => {
    return holdings.map(h => ({
      ...h,
      tipo: h.tipo ? (h.tipo as HoldingType) : suggestHoldingType(h),
    }));
  });

  const [applyPattern, setApplyPattern] = useState("");
  const [applyType, setApplyType] = useState<HoldingType | "">("");

  const handleTypeChange = (index: number, tipo: HoldingType) => {
    const updated = [...typedHoldings];
    updated[index] = { ...updated[index], tipo };
    setTypedHoldings(updated);
  };

  const handleApplySimilar = () => {
    if (!applyPattern.trim() || !applyType) {
      toast.error("Preencha o padrão e selecione o tipo");
      return;
    }

    const updated = applyTypeToSimilar(typedHoldings, applyPattern, applyType);
    setTypedHoldings(updated);
    toast.success(`Tipo aplicado a ${updated.filter(h => h.tipo === applyType).length} holdings`);
    setApplyPattern("");
    setApplyType("");
  };

  const handleContinue = () => {
    const invalid = typedHoldings.filter(h => !h.tipo);
    if (invalid.length > 0) {
      toast.error("Por favor, defina o tipo de todos os holdings");
      return;
    }

    onConfirmed(typedHoldings);
  };

  // Calcular taxa de auto-classificação
  const autoClassifiedCount = typedHoldings.filter(h => {
    const suggested = suggestHoldingType(h);
    return h.tipo === suggested;
  }).length;
  const autoClassificationRate = Math.round((autoClassifiedCount / typedHoldings.length) * 100);

  const handleQuickAction = (action: 'tesouro_rf' | 'ends_with_11_fii') => {
    let updated = [...typedHoldings];
    
    if (action === 'tesouro_rf') {
      updated = updated.map(h => {
        if (h.nome_ou_codigo.toUpperCase().includes('TESOURO')) {
          return { ...h, tipo: 'RF IPCA' as HoldingType };
        }
        return h;
      });
      toast.success('Todos os Tesouro marcados como RF');
    } else if (action === 'ends_with_11_fii') {
      updated = updated.map(h => {
        if (h.nome_ou_codigo.endsWith('11')) {
          return { ...h, tipo: 'FII' as HoldingType };
        }
        return h;
      });
      toast.success('Todos que terminam em 11 marcados como FII');
    }
    
    setTypedHoldings(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirme os tipos</CardTitle>
        <CardDescription>
          Revise e ajuste os tipos sugeridos automaticamente
        </CardDescription>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">Auto-classificação: {autoClassificationRate}%</Badge>
          <span className="text-xs text-muted-foreground">Revise só o que estiver em amarelo</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botões rápidos */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('tesouro_rf')}
          >
            Marcar todos Tesouro como RF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('ends_with_11_fii')}
          >
            Marcar todos que terminam em 11 como FII
          </Button>
        </div>
        <div className="max-h-[400px] overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="p-2 text-left font-medium">Nome/Ativo</th>
                <th className="p-2 text-left font-medium">Valor</th>
                <th className="p-2 text-left font-medium">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {typedHoldings.map((holding, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{holding.nome_ou_codigo}</td>
                  <td className="p-2">
                    {holding.valor?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </td>
                  <td className="p-2">
                    <Select
                      value={holding.tipo}
                      onValueChange={(value) => handleTypeChange(index, value as HoldingType)}
                    >
                      <SelectTrigger 
                        className={`w-full ${
                          holding.tipo !== suggestHoldingType(holding) ? 'bg-yellow-50 border-yellow-300' : ''
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOLDING_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-3">
          <Label className="text-sm font-medium">Aplicar tipo a similares</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: TESOURO, FII, ETF..."
              value={applyPattern}
              onChange={(e) => setApplyPattern(e.target.value)}
              className="flex-1"
            />
            <Select value={applyType} onValueChange={(v) => setApplyType(v as HoldingType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {HOLDING_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={handleApplySimilar}
              disabled={!applyPattern || !applyType}
            >
              Aplicar
            </Button>
          </div>
        </div>

        <Button onClick={handleContinue} className="w-full">
          Continuar ({typedHoldings.length} holdings)
        </Button>
      </CardContent>
    </Card>
  );
}

