"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

interface PaywallModalProps {
  checkupId: string;
  onSuccess: () => void;
  onClose: () => void;
}

// Cupons válidos para teste (permitem avançar sem pagamento)
const VALID_COUPONS = ['TESTE', 'FREE', 'DESCONTO100', 'DEV'];

export function PaywallModal({ checkupId, onSuccess, onClose }: PaywallModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cupom, setCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState(false);
  const [precoFinal, setPrecoFinal] = useState(47);

  const handleApplyCoupon = () => {
    const cupomUpper = cupom.toUpperCase().trim();
    if (VALID_COUPONS.includes(cupomUpper)) {
      setCupomAplicado(true);
      setPrecoFinal(0);
      toast.success('Cupom aplicado com sucesso!');
    } else {
      toast.error('Cupom inválido');
    }
  };

  const handlePayment = async () => {
    // Validação básica
    if (!nome.trim()) {
      toast.error('Por favor, preencha seu nome');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Por favor, preencha um e-mail válido');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/checkup-ldc/checkups/${checkupId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
          cupom: cupom.trim().toUpperCase(),
          usar_cupom: cupomAplicado,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }

      const data = await res.json();
      
      if (cupomAplicado) {
        toast.success('Acesso liberado com cupom!');
      } else {
        toast.success('Pagamento processado com sucesso!');
      }
      
      // Aguardar um pouco para garantir que o status foi atualizado no banco
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess();
    } catch (error) {
      toast.error((error as Error).message || 'Erro ao processar pagamento. Tente novamente.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Desbloquear Relatório Completo</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <p className="mb-2">
                {cupomAplicado ? (
                  <>
                    <span className="line-through text-muted-foreground">R$ 47</span>{' '}
                    <strong className="text-green-600">Grátis com cupom!</strong>
                  </>
                ) : (
                  <>
                    Por apenas <strong>R$ {precoFinal}</strong>, você terá acesso a:
                  </>
                )}
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Score breakdown detalhado (5 dimensões)</li>
                <li>Simulações "antes vs depois"</li>
                <li>Top 5 posições da carteira</li>
                <li>Análise de riscos e melhorias personalizadas</li>
                <li>Plano de ação copiável + WhatsApp + e-mail</li>
                <li>PDF premium para arquivar</li>
              </ul>
            </div>

            {/* Campos de captura de lead */}
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone (opcional)</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>
            </div>

            {/* Campo de cupom */}
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="cupom">Cupom de desconto (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="cupom"
                  placeholder="Digite o cupom"
                  value={cupom}
                  onChange={(e) => {
                    setCupom(e.target.value);
                    setCupomAplicado(false);
                    setPrecoFinal(47);
                  }}
                  disabled={cupomAplicado}
                />
                {!cupomAplicado && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={!cupom.trim()}
                  >
                    <Tag className="w-4 h-4 mr-1" />
                    Aplicar
                  </Button>
                )}
                {cupomAplicado && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCupomAplicado(false);
                      setPrecoFinal(47);
                      setCupom('');
                    }}
                  >
                    Remover
                  </Button>
                )}
              </div>
              {cupomAplicado && (
                <p className="text-xs text-green-600">
                  ✓ Cupom aplicado! Acesso liberado.
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              {cupomAplicado 
                ? 'Acesso liberado com cupom de teste.'
                : 'Este é um pagamento simulado. Em produção, será integrado com gateway de pagamento.'}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePayment}
            disabled={isProcessing || !nome.trim() || !email.trim()}
            className="bg-primary"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {cupomAplicado ? 'Continuar Grátis' : 'Simular Pagamento'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

