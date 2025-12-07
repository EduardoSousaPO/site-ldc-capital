"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Shield, FileText, TrendingUp, Zap } from "lucide-react";

interface CheckupHeroProps {
  onStart: () => void;
}

export function CheckupHero({ onStart }: CheckupHeroProps) {
  return (
    <div className="space-y-12 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/30 mb-4">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-primary font-medium text-sm">Diagnóstico em 5 minutos</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
          <span className="block mb-2">Descubra em 10 segundos</span>
          <span className="bg-gradient-to-r from-primary to-[#becc6a] bg-clip-text text-transparent">
            se sua carteira está saudável
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Cole sua carteira e receba um diagnóstico completo com nota, riscos, melhorias e plano de ação. 
          <span className="font-semibold text-foreground"> Sem senha. Sem acesso à corretora.</span>
        </p>

        {/* CTA Principal */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            onClick={onStart}
            size="lg"
            className="text-lg px-8 py-6 h-auto"
          >
            Começar meu Checkup Grátis
            <TrendingUp className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Preview gratuito • Relatório completo por R$ 47
          </p>
        </div>
      </div>

      {/* Benefícios em Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Análise em 5 minutos</h3>
                <p className="text-sm text-muted-foreground">
                  Cole sua carteira e receba diagnóstico completo. Sem formulários longos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">100% Privado e Seguro</h3>
                <p className="text-sm text-muted-foreground">
                  Dados usados apenas para gerar seu relatório. Sem acesso à corretora.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Relatório + PDF Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Score breakdown, simulações, top 5 posições e plano de ação copiável.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* O que você recebe */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-muted/50 border-2">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-6 text-center">
              O que você recebe no relatório completo
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Score Breakdown (5 dimensões)</p>
                  <p className="text-sm text-muted-foreground">
                    Diversificação Global, Concentração, Liquidez, Complexidade e Custos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Simulações "Antes vs Depois"</p>
                  <p className="text-sm text-muted-foreground">
                    Veja como ajustes simples podem melhorar sua nota
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Top 5 Posições da Carteira</p>
                  <p className="text-sm text-muted-foreground">
                    Identifique rapidamente seus maiores ativos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Plano de Ação Executável</p>
                  <p className="text-sm text-muted-foreground">
                    Checklist de 7 dias + copiar/WhatsApp/e-mail
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Análise de Riscos e Melhorias</p>
                  <p className="text-sm text-muted-foreground">
                    3 principais riscos e 3 oportunidades de melhoria
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">PDF Premium para Arquivar</p>
                  <p className="text-muted-foreground">
                    Relatório completo em PDF para consulta futura
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Proof / Garantia */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Metodologia LDC Capital:</strong> Baseada em princípios de 
          diversificação global, portfólio descomplicado e baixo custo. 
          O mesmo rigor que aplicamos na consultoria premium.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Dados privados</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>5 minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>PDF incluso</span>
          </div>
        </div>
      </div>
    </div>
  );
}

