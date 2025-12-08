"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Shield, FileText, TrendingUp, Zap, BarChart3 } from "lucide-react";

interface CheckupHeroProps {
  onStart: () => void;
}

export function CheckupHero({ onStart }: CheckupHeroProps) {
  return (
    <div className="space-y-16 py-16 md:py-20">
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-5xl mx-auto">
        {/* Badge Premium */}
        <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-[#98ab44]/10 backdrop-blur-sm rounded-full border border-[#98ab44]/30 mb-6 animate-slide-up">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#98ab44]" />
          <span className="text-[#98ab44] font-medium text-sm sm:text-base">Diagnóstico em 5 minutos</span>
        </div>

        {/* Headline com tipografia serif premium */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight max-w-5xl mx-auto">
          <span className="block mb-2 lg:mb-4">Descubra em 10 segundos</span>
          <span className="bg-gradient-to-r from-[#98ab44] to-[#becc6a] bg-clip-text text-transparent">
            se sua carteira está saudável
          </span>
        </h1>

        {/* Subheadline Premium */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light px-4 sm:px-0">
          Cole sua carteira e receba um diagnóstico completo com nota, riscos, melhorias e plano de ação. 
          <span className="text-[#98ab44] font-medium"> Sem senha. Sem acesso à corretora.</span>
        </p>

        {/* CTA Principal Premium */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-6">
          <Button
            onClick={onStart}
            size="lg"
            className="bg-gradient-to-r from-[#98ab44] to-[#becc6a] hover:from-[#98ab44]/90 hover:to-[#becc6a]/90 text-white px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 text-base sm:text-lg lg:text-xl font-semibold rounded-xl shadow-lg hover:shadow-[#98ab44]/25 transition-all duration-300 border-0 w-full sm:w-auto"
          >
            Começar meu Checkup Grátis
            <TrendingUp className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <p className="text-sm sm:text-base text-muted-foreground">
            Preview gratuito • Relatório completo por <strong className="text-foreground">R$ 47</strong>
          </p>
        </div>
      </div>

      {/* Benefícios em Grid Premium */}
      <div className="grid md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto">
        <Card className="bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-[#98ab44]/20 hover:border-[#98ab44]/40 hover:bg-white/70 transition-all duration-300 group">
          <CardContent className="pt-6 sm:pt-8 p-6 sm:p-8">
            <div className="flex flex-col items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#98ab44]/20 rounded-xl flex items-center justify-center group-hover:bg-[#98ab44]/30 transition-colors">
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-[#98ab44]" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg sm:text-xl mb-2">Análise em 5 minutos</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Cole sua carteira e receba diagnóstico completo. Sem formulários longos ou burocracia.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-[#98ab44]/20 hover:border-[#98ab44]/40 hover:bg-white/70 transition-all duration-300 group">
          <CardContent className="pt-6 sm:pt-8 p-6 sm:p-8">
            <div className="flex flex-col items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#becc6a]/20 rounded-xl flex items-center justify-center group-hover:bg-[#becc6a]/30 transition-colors">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-[#becc6a]" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg sm:text-xl mb-2">100% Privado e Seguro</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Dados usados apenas para gerar seu relatório. Sem acesso à corretora ou compartilhamento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-[#98ab44]/20 hover:border-[#98ab44]/40 hover:bg-white/70 transition-all duration-300 group">
          <CardContent className="pt-6 sm:pt-8 p-6 sm:p-8">
            <div className="flex flex-col items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#98ab44]/30 rounded-xl flex items-center justify-center group-hover:bg-[#98ab44]/40 transition-colors">
                <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-[#98ab44]" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg sm:text-xl mb-2">Relatório + PDF Premium</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Score breakdown, simulações, top 5 posições e plano de ação copiável para arquivar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* O que você recebe - Card Premium */}
      <div className="max-w-5xl mx-auto">
        <Card className="bg-white/30 backdrop-blur-sm rounded-2xl border-2 border-[#98ab44]/20 shadow-lg">
          <CardContent className="pt-8 sm:pt-10 pb-8 sm:pb-10 px-6 sm:px-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[#98ab44]" />
                <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                  O que você recebe no relatório completo
                </h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Metodologia LDC Capital aplicada ao seu diagnóstico
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-white/30 transition-colors">
                <div className="p-1.5 bg-[#98ab44]/20 rounded-lg flex-shrink-0">
                  <Check className="h-5 w-5 text-[#98ab44]" />
                </div>
                <div>
                  <p className="font-semibold text-base sm:text-lg mb-1">Score Breakdown (5 dimensões)</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Diversificação Global, Concentração, Liquidez, Complexidade e Custos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-white/30 transition-colors">
                <div className="p-1.5 bg-[#98ab44]/20 rounded-lg flex-shrink-0">
                  <Check className="h-5 w-5 text-[#98ab44]" />
                </div>
                <div>
                  <p className="font-semibold text-base sm:text-lg mb-1">Simulações &quot;Antes vs Depois&quot;</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Veja como ajustes simples podem melhorar sua nota
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-white/30 transition-colors">
                <div className="p-1.5 bg-[#98ab44]/20 rounded-lg flex-shrink-0">
                  <Check className="h-5 w-5 text-[#98ab44]" />
                </div>
                <div>
                  <p className="font-semibold text-base sm:text-lg mb-1">Top 5 Posições da Carteira</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Identifique rapidamente seus maiores ativos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-white/30 transition-colors">
                <div className="p-1.5 bg-[#98ab44]/20 rounded-lg flex-shrink-0">
                  <Check className="h-5 w-5 text-[#98ab44]" />
                </div>
                <div>
                  <p className="font-semibold text-base sm:text-lg mb-1">Plano de Ação Executável</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Checklist de 7 dias + copiar/WhatsApp/e-mail
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-white/30 transition-colors">
                <div className="p-1.5 bg-[#98ab44]/20 rounded-lg flex-shrink-0">
                  <Check className="h-5 w-5 text-[#98ab44]" />
                </div>
                <div>
                  <p className="font-semibold text-base sm:text-lg mb-1">Análise de Riscos e Melhorias</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    3 principais riscos e 3 oportunidades de melhoria
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-white/30 transition-colors">
                <div className="p-1.5 bg-[#98ab44]/20 rounded-lg flex-shrink-0">
                  <Check className="h-5 w-5 text-[#98ab44]" />
                </div>
                <div>
                  <p className="font-semibold text-base sm:text-lg mb-1">PDF Premium para Arquivar</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Relatório completo em PDF para consulta futura
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Proof / Garantia Premium */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="bg-[#98ab44]/5 rounded-xl p-6 sm:p-8 border border-[#98ab44]/20">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-semibold">Metodologia LDC Capital:</strong> Baseada em princípios de 
            diversificação global, portfólio descomplicado e baixo custo. 
            <span className="text-[#98ab44] font-medium"> O mesmo rigor que aplicamos na consultoria premium.</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm sm:text-base text-muted-foreground">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#98ab44]" />
            <span className="font-medium">Dados privados</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#98ab44]" />
            <span className="font-medium">5 minutos</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#98ab44]" />
            <span className="font-medium">PDF incluso</span>
          </div>
        </div>
      </div>
    </div>
  );
}

