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

// Cupons e códigos de acesso válidos (permitem avançar sem pagamento)
const VALID_COUPONS = ['TESTE', 'FREE', 'DESCONTO100', 'DEV'];
const VALID_ACCESS_CODES = ['LDC2024', 'ACESSO2024', 'PREMIUM2024', 'TESTE123', 'SENHA123', 'CODE2024'];

export function PaywallModal({ checkupId, onSuccess, onClose }: PaywallModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cupom, setCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState(false);
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [codigoAplicado, setCodigoAplicado] = useState(false);
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

  const handleApplyAccessCode = () => {
    const codigoUpper = codigoAcesso.toUpperCase().trim();
    if (VALID_ACCESS_CODES.includes(codigoUpper)) {
      setCodigoAplicado(true);
      setPrecoFinal(0);
      toast.success('Código de acesso válido! Acesso liberado.');
    } else {
      toast.error('Código de acesso inválido');
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
          codigo_acesso: codigoAcesso.trim().toUpperCase(),
          usar_codigo: codigoAplicado,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = await res.json();
      
      if (cupomAplicado || codigoAplicado) {
        toast.success('Acesso liberado com código!');
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
      <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold mb-2">Desbloquear Relatório Completo</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-6 text-sm text-muted-foreground">
              {/* Preço e benefícios */}
              <div className="space-y-3">
                <div className="text-base font-medium text-foreground">
                  {(cupomAplicado || codigoAplicado) ? (
                    <span>
                      <span className="line-through text-muted-foreground mr-2">R$ 47</span>
                      <span className="text-green-600 font-semibold">Acesso liberado!</span>
                    </span>
                  ) : (
                    <span>
                      Por apenas <strong className="text-foreground">R$ {precoFinal}</strong>, você terá acesso a:
                    </span>
                  )}
                </div>
                <ul className="list-none space-y-2.5 pl-0">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Score breakdown detalhado (5 dimensões)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Simulações &quot;antes vs depois&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Top 5 posições da carteira</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Análise de riscos e melhorias personalizadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Plano de ação copiável + WhatsApp + e-mail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>PDF premium para arquivar</span>
                  </li>
                </ul>
              </div>

              {/* Campos de captura de lead */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-foreground mb-1">Seus dados</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome" className="text-sm font-medium">Nome completo *</Label>
                    <Input
                      id="nome"
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone" className="text-sm font-medium">Telefone <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Campo de cupom */}
              <div className="space-y-2.5 pt-4 border-t border-gray-200">
                <Label htmlFor="cupom" className="text-sm font-medium">
                  Cupom de desconto <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="cupom"
                    placeholder="Ex: TESTE, FREE"
                    value={cupom}
                    onChange={(e) => {
                      setCupom(e.target.value);
                      setCupomAplicado(false);
                      if (!codigoAplicado) setPrecoFinal(47);
                    }}
                    disabled={cupomAplicado || codigoAplicado}
                    className="h-10 flex-1"
                  />
                  {!cupomAplicado && !codigoAplicado && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={!cupom.trim()}
                      className="h-10 px-4"
                    >
                      <Tag className="w-4 h-4 mr-1.5" />
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
                      className="h-10 px-4"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                {cupomAplicado && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <span>✓</span>
                    <span>Cupom aplicado! Acesso liberado.</span>
                  </div>
                )}
              </div>

              {/* Campo de código de acesso/senha */}
              <div className="space-y-2.5 pt-4 border-t border-gray-200">
                <Label htmlFor="codigo-acesso" className="text-sm font-medium">
                  Código de Acesso / Senha <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo-acesso"
                    type="password"
                    placeholder="Digite o código de acesso"
                    value={codigoAcesso}
                    onChange={(e) => {
                      setCodigoAcesso(e.target.value);
                      setCodigoAplicado(false);
                      if (!cupomAplicado) setPrecoFinal(47);
                    }}
                    disabled={codigoAplicado || cupomAplicado}
                    className="h-10 flex-1"
                  />
                  {!codigoAplicado && !cupomAplicado && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyAccessCode}
                      disabled={!codigoAcesso.trim()}
                      className="h-10 px-4"
                    >
                      <Tag className="w-4 h-4 mr-1.5" />
                      Validar
                    </Button>
                  )}
                  {codigoAplicado && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCodigoAplicado(false);
                        setPrecoFinal(47);
                        setCodigoAcesso('');
                      }}
                      className="h-10 px-4"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                {codigoAplicado && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <span>✓</span>
                    <span>Código válido! Acesso liberado.</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-1">
                  <span className="font-medium">Códigos válidos:</span>{' '}
                  <span className="font-mono">LDC2024, ACESSO2024, PREMIUM2024, TESTE123, SENHA123, CODE2024</span>
                </div>
              </div>

              {/* Nota informativa */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {(cupomAplicado || codigoAplicado)
                    ? 'Acesso liberado com código de teste.'
                    : 'Este é um pagamento simulado. Em produção, será integrado com gateway de pagamento.'}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 pt-4 border-t border-gray-200">
          <AlertDialogCancel disabled={isProcessing} className="h-11">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePayment}
            disabled={isProcessing || !nome.trim() || !email.trim()}
            className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white h-11 px-6 font-medium"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {(cupomAplicado || codigoAplicado) ? 'Continuar com Acesso Liberado' : 'Simular Pagamento'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

