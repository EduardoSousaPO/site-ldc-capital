"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OBJETIVOS, TOLERANCIAS_RISCO, IDADE_FAIXAS } from "@/lib/checkup-ldc/constants";
import type { UserProfile } from "@/features/checkup-ldc/types";
import { toast } from "sonner";

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
    e.stopPropagation();
    
    if (!objetivo || !prazo || !tolerancia) {
      // Mostrar mensagem de erro se campos obrigatórios não estiverem preenchidos
      if (!objetivo) {
        toast.error("Por favor, selecione um objetivo principal");
      }
      if (!prazo) {
        toast.error("Por favor, informe o prazo de investimento");
      }
      if (!tolerancia) {
        toast.error("Por favor, selecione a tolerância a risco");
      }
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
        <div 
          className="space-y-4"
          onKeyDown={(e) => {
            // Permitir submit apenas quando Enter é pressionado no botão ou em inputs
            if (e.key === 'Enter') {
              const target = e.target as HTMLElement;
              // Se não for um Select, permitir submit
              if (!target.closest('[data-slot="select-trigger"]') &&
                  !target.closest('[data-slot="select-content"]') &&
                  !target.closest('[data-slot="select-item"]') &&
                  !target.closest('[role="option"]')) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }
          }}
        >
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <Label htmlFor="objetivo">Qual seu objetivo principal? *</Label>
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Select 
                value={objetivo} 
                onValueChange={(value) => {
                  setObjetivo(value);
                }}
                onOpenChange={() => {
                  // Prevenir submit quando Select é aberto/fechado
                }}
                required
              >
                <SelectTrigger 
                  id="objetivo" 
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <SelectValue placeholder="Selecione o objetivo" />
                </SelectTrigger>
                <SelectContent
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {OBJETIVOS.map(obj => (
                    <SelectItem 
                      key={obj.value} 
                      value={obj.value}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      {obj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!objetivo && (
              <p className="text-xs text-destructive">Este campo é obrigatório</p>
            )}
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
              className="w-full"
            />
            {!prazo && (
              <p className="text-xs text-destructive">Este campo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <Label htmlFor="tolerancia">Tolerância a risco *</Label>
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Select 
                value={tolerancia} 
                onValueChange={(value) => {
                  setTolerancia(value);
                }}
                onOpenChange={() => {
                  // Prevenir submit quando Select é aberto/fechado
                }}
                required
              >
                <SelectTrigger 
                  id="tolerancia" 
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <SelectValue placeholder="Selecione a tolerância" />
                </SelectTrigger>
                <SelectContent
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {TOLERANCIAS_RISCO.map(tol => (
                    <SelectItem 
                      key={tol.value} 
                      value={tol.value}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      {tol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!tolerancia && (
              <p className="text-xs text-destructive">Este campo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <Label htmlFor="idade">Faixa etária (opcional)</Label>
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Select 
                value={idadeFaixa} 
                onValueChange={(value) => {
                  setIdadeFaixa(value);
                }}
                onOpenChange={() => {
                  // Prevenir submit quando Select é aberto/fechado
                }}
              >
                <SelectTrigger 
                  id="idade" 
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <SelectValue placeholder="Selecione a faixa" />
                </SelectTrigger>
                <SelectContent
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {IDADE_FAIXAS.map(faixa => (
                    <SelectItem 
                      key={faixa.value} 
                      value={faixa.value}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      {faixa.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="button"
            onClick={handleSubmit}
            className="w-full" 
            disabled={!objetivo || !prazo || !tolerancia}
          >
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

