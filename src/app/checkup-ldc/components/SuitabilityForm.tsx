"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OBJETIVOS, TOLERANCIAS_RISCO, IDADE_FAIXAS } from "@/lib/checkup-ldc/constants";
import type { UserProfile } from "@/features/checkup-ldc/types";

interface SuitabilityFormProps {
  onSubmit: (profile: UserProfile) => void;
}

export function SuitabilityForm({ onSubmit }: SuitabilityFormProps) {
  const [objetivo, setObjetivo] = useState<string>("");
  const [prazo, setPrazo] = useState<string>("");
  const [tolerancia, setTolerancia] = useState<string>("");
  const [idadeFaixa, setIdadeFaixa] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!objetivo || !prazo || !tolerancia) {
      return;
    }

    onSubmit({
      objetivo_principal: objetivo as UserProfile['objetivo_principal'],
      prazo_anos: parseInt(prazo),
      tolerancia_risco: tolerancia as UserProfile['tolerancia_risco'],
      idade_faixa: idadeFaixa || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Investimento</CardTitle>
        <CardDescription>
          Responda algumas perguntas para personalizar a análise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="objetivo">Qual seu objetivo principal? *</Label>
            <Select value={objetivo} onValueChange={setObjetivo} required>
              <SelectTrigger id="objetivo">
                <SelectValue placeholder="Selecione o objetivo" />
              </SelectTrigger>
              <SelectContent>
                {OBJETIVOS.map(obj => (
                  <SelectItem key={obj.value} value={obj.value}>
                    {obj.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prazo">Prazo de investimento (anos) *</Label>
            <Input
              id="prazo"
              type="number"
              min="1"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              placeholder="Ex: 10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tolerancia">Tolerância a risco *</Label>
            <Select value={tolerancia} onValueChange={setTolerancia} required>
              <SelectTrigger id="tolerancia">
                <SelectValue placeholder="Selecione a tolerância" />
              </SelectTrigger>
              <SelectContent>
                {TOLERANCIAS_RISCO.map(tol => (
                  <SelectItem key={tol.value} value={tol.value}>
                    {tol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idade">Faixa etária (opcional)</Label>
            <Select value={idadeFaixa} onValueChange={setIdadeFaixa}>
              <SelectTrigger id="idade">
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                {IDADE_FAIXAS.map(faixa => (
                  <SelectItem key={faixa.value} value={faixa.value}>
                    {faixa.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={!objetivo || !prazo || !tolerancia}>
            Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

