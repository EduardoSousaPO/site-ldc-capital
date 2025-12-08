"use client";

import { useState, useEffect, useRef } from "react";
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
  const cardRef = useRef<HTMLDivElement>(null);

  // Interceptar navegação acidental quando clicar em elementos do Select
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Verificar se há um Link sendo acionado dentro de um elemento do Select
      const linkElement = target.closest('a[href]');
      if (linkElement) {
        // Verificar se o Link está dentro de um elemento do Select
        const isInsideSelect = 
          linkElement.closest('[data-slot="select-content"]') ||
          linkElement.closest('[data-slot="select-item"]') ||
          linkElement.closest('[data-slot="select-trigger"]') ||
          linkElement.closest('[role="option"]') ||
          linkElement.closest('[data-radix-select-content]') ||
          linkElement.closest('[data-radix-select-item]') ||
          linkElement.closest('[data-radix-select-trigger]') ||
          linkElement.closest('[role="listbox"]') ||
          (cardRef.current && cardRef.current.contains(linkElement));

        if (isInsideSelect) {
          const href = linkElement.getAttribute('href');
          // Prevenir navegação apenas se for um link válido (não vazio ou âncora)
          if (href && href !== '#' && !href.startsWith('#')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }
        }
      }
    };

    // Adicionar listener com capture: true para interceptar antes de qualquer outro handler
    // Mas apenas para prevenir navegação de Links, não para bloquear o Select
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

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


  // Handler para prevenir navegação em qualquer clique dentro do Card
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Se for um elemento do Select, prevenir qualquer ação
    if (
      target.closest('[data-slot="select-trigger"]') ||
      target.closest('[data-slot="select-content"]') ||
      target.closest('[data-slot="select-item"]') ||
      target.closest('[role="option"]')
    ) {
      e.preventDefault();
      e.stopPropagation();
      // Usar evento nativo para stopImmediatePropagation
      const nativeEvent = e.nativeEvent as MouseEvent;
      if (nativeEvent && typeof nativeEvent.stopImmediatePropagation === 'function') {
        nativeEvent.stopImmediatePropagation();
      }
    }
  };

  const handleCardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    if (
      target.closest('[data-slot="select-trigger"]') ||
      target.closest('[data-slot="select-content"]') ||
      target.closest('[data-slot="select-item"]') ||
      target.closest('[role="option"]')
    ) {
      e.preventDefault();
      e.stopPropagation();
      const nativeEvent = e.nativeEvent as PointerEvent;
      if (nativeEvent && typeof nativeEvent.stopImmediatePropagation === 'function') {
        nativeEvent.stopImmediatePropagation();
      }
    }
  };

  return (
    <Card
      ref={cardRef}
      onClick={handleCardClick}
      onMouseDown={handleCardClick}
      onPointerDown={handleCardPointerDown}
    >
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
          <div className="space-y-2">
            <Label htmlFor="objetivo">Qual seu objetivo principal? *</Label>
            <Select 
              value={objetivo} 
              onValueChange={(value) => {
                setObjetivo(value);
              }}
              required
            >
              <SelectTrigger 
                id="objetivo" 
                className="w-full"
              >
                <SelectValue placeholder="Selecione o objetivo" />
              </SelectTrigger>
              <SelectContent>
                {OBJETIVOS.map(obj => (
                  <SelectItem 
                    key={obj.value} 
                    value={obj.value}
                  >
                    {obj.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="space-y-2">
            <Label htmlFor="tolerancia">Tolerância a risco *</Label>
            <Select 
              value={tolerancia} 
              onValueChange={(value) => {
                setTolerancia(value);
              }}
              required
            >
              <SelectTrigger 
                id="tolerancia" 
                className="w-full"
              >
                <SelectValue placeholder="Selecione a tolerância" />
              </SelectTrigger>
              <SelectContent>
                {TOLERANCIAS_RISCO.map(tol => (
                  <SelectItem 
                    key={tol.value} 
                    value={tol.value}
                  >
                    {tol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!tolerancia && (
              <p className="text-xs text-destructive">Este campo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="idade">Faixa etária (opcional)</Label>
            <Select 
              value={idadeFaixa} 
              onValueChange={(value) => {
                setIdadeFaixa(value);
              }}
            >
              <SelectTrigger 
                id="idade" 
                className="w-full"
              >
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                {IDADE_FAIXAS.map(faixa => (
                  <SelectItem 
                    key={faixa.value} 
                    value={faixa.value}
                  >
                    {faixa.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

