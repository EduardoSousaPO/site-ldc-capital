"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calculator, BarChart3, Table2, Download, Info } from "lucide-react";
import { calcularPGBL, formatCurrency, formatPercentage, type PGBLInputs, type PGBLResult } from "@/lib/pgbl/calculations";
import PGBLChart from "@/components/pgbl/PGBLChart";
import PGBLTable from "@/components/pgbl/PGBLTable";
import { getCurrentUser } from "@/lib/auth-supabase";

export default function PGBLSimulatorPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [inputs, setInputs] = useState<PGBLInputs>({
    rendaBrutaAnual: 200000,
    percentualAporte: 12,
    periodoAnos: 20,
    rentabilidadeAnual: 9.7,
    regimeTributacao: 'regressiva',
  });

  const [result, setResult] = useState<PGBLResult | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [nomeConsultor, setNomeConsultor] = useState("");
  const [nomeLead, setNomeLead] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      calcular();
    }
  }, [inputs, checkingAuth]);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
        router.push("/admin/login");
        return;
      }
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/admin/login");
    } finally {
      setCheckingAuth(false);
    }
  };

  const calcular = () => {
    try {
      const resultado = calcularPGBL(inputs);
      setResult(resultado);
    } catch (error) {
      console.error("Erro ao calcular:", error);
    }
  };

  const updateInput = (field: keyof PGBLInputs, value: any) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleExportPDF = async () => {
    if (!result) return;
    
    setExporting(true);
    try {
      const response = await fetch('/api/pgbl-simulator/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs,
          result,
          nomeConsultor,
          nomeLead,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simulacao-pgbl-${nomeLead || 'cliente'}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erro ao gerar PDF');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  if (checkingAuth) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin"></div>
        </main>
        <Footer />
      </>
    );
  }

  const limiteAporte = inputs.rendaBrutaAnual * 0.12;
  const aporteAtual = inputs.rendaBrutaAnual * (inputs.percentualAporte / 100);
  const aporteEfetivo = Math.min(aporteAtual, limiteAporte);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-[#262d3d] mb-2">
              Simulador PGBL
            </h1>
            <p className="text-gray-600 font-sans">
              Simule diferentes cenários de investimento em PGBL e visualize os benefícios fiscais
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda: Inputs */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border border-[#e3e3e3]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-serif text-[#262d3d] flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-[#98ab44]" />
                    Parâmetros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="nomeConsultor" className="text-sm font-sans text-[#262d3d]">
                      Nome do Consultor
                    </Label>
                    <Input
                      id="nomeConsultor"
                      type="text"
                      value={nomeConsultor}
                      onChange={(e) => setNomeConsultor(e.target.value)}
                      placeholder="Digite o nome do consultor"
                      className="mt-1 font-sans"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nomeLead" className="text-sm font-sans text-[#262d3d]">
                      Nome do Lead/Cliente
                    </Label>
                    <Input
                      id="nomeLead"
                      type="text"
                      value={nomeLead}
                      onChange={(e) => setNomeLead(e.target.value)}
                      placeholder="Digite o nome do lead"
                      className="mt-1 font-sans"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rendaBrutaAnual" className="text-sm font-sans text-[#262d3d]">
                      Renda Bruta Anual (R$)
                    </Label>
                    <Input
                      id="rendaBrutaAnual"
                      type="number"
                      value={inputs.rendaBrutaAnual}
                      onChange={(e) => updateInput('rendaBrutaAnual', parseFloat(e.target.value) || 0)}
                      className="mt-1 font-sans"
                    />
                  </div>

                  <div>
                    <Label htmlFor="percentualAporte" className="text-sm font-sans text-[#262d3d]">
                      Percentual de Aporte (%)
                    </Label>
                    <Input
                      id="percentualAporte"
                      type="number"
                      min="0"
                      max="12"
                      step="0.1"
                      value={inputs.percentualAporte}
                      onChange={(e) => {
                        const value = Math.min(12, Math.max(0, parseFloat(e.target.value) || 0));
                        updateInput('percentualAporte', value);
                      }}
                      className="mt-1 font-sans"
                    />
                    <p className="text-xs text-[#577171] mt-1 font-sans">
                      Limite: 12% da renda bruta anual
                    </p>
                    <p className="text-xs text-[#98ab44] mt-1 font-sans font-medium">
                      Aporte efetivo: {formatCurrency(aporteEfetivo)}/ano
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="periodoAnos" className="text-sm font-sans text-[#262d3d]">
                      Período de Investimento (anos)
                    </Label>
                    <Input
                      id="periodoAnos"
                      type="number"
                      min="1"
                      max="50"
                      value={inputs.periodoAnos}
                      onChange={(e) => updateInput('periodoAnos', parseInt(e.target.value) || 1)}
                      className="mt-1 font-sans"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rentabilidadeAnual" className="text-sm font-sans text-[#262d3d]">
                      Rentabilidade Anual (%)
                    </Label>
                    <Input
                      id="rentabilidadeAnual"
                      type="number"
                      min="0"
                      max="30"
                      step="0.1"
                      value={inputs.rentabilidadeAnual}
                      onChange={(e) => updateInput('rentabilidadeAnual', parseFloat(e.target.value) || 0)}
                      className="mt-1 font-sans"
                    />
                  </div>

                  <div>
                    <Label htmlFor="regimeTributacao" className="text-sm font-sans text-[#262d3d]">
                      Regime de Tributação
                    </Label>
                    <Select
                      value={inputs.regimeTributacao}
                      onValueChange={(value: 'regressiva' | 'progressiva') => 
                        updateInput('regimeTributacao', value)
                      }
                    >
                      <SelectTrigger className="mt-1 font-sans">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regressiva">Tabela Regressiva</SelectItem>
                        <SelectItem value="progressiva">Tabela Progressiva</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[#577171] mt-1 font-sans">
                      {inputs.regimeTributacao === 'regressiva' 
                        ? 'Alíquotas diminuem com o tempo (10% após 10 anos)'
                        : 'Alíquotas seguem a tabela progressiva do IR'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas Principais */}
              {result && (
                <Card className="border border-[#e3e3e3]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-serif text-[#262d3d] flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#98ab44]" />
                      Resultados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white border border-[#e3e3e3] rounded-lg p-4">
                      <div className="text-xs text-[#577171] uppercase tracking-wide mb-2 font-sans">
                        Valor Bruto Acumulado
                      </div>
                      <div className="text-2xl font-semibold text-[#262d3d] font-sans">
                        {formatCurrency(result.valorBrutoAcumulado)}
                      </div>
                    </div>

                    <div className="bg-white border border-[#e3e3e3] rounded-lg p-4">
                      <div className="text-xs text-[#577171] uppercase tracking-wide mb-2 font-sans">
                        Valor Líquido
                      </div>
                      <div className="text-2xl font-semibold text-[#262d3d] font-sans">
                        {formatCurrency(result.valorLiquido)}
                      </div>
                    </div>

                    <div className="bg-[#98ab44]/10 border border-[#98ab44]/30 rounded-lg p-4">
                      <div className="text-xs text-[#577171] uppercase tracking-wide mb-2 font-sans flex items-center gap-1">
                        Economia Fiscal Total
                        <div className="group relative">
                          <Info className="h-3 w-3 text-[#577171] cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-[#262d3d] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-sans">
                            <strong>Como funciona:</strong><br />
                            A economia fiscal acumulada é a soma de toda a economia de Imposto de Renda obtida ao longo do período. 
                            Isso ocorre porque os aportes no PGBL podem ser deduzidos da base de cálculo do IR (até 12% da renda bruta anual), 
                            reduzindo o imposto devido a cada ano. Este valor mostra o total economizado em impostos durante todo o período de investimento.
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-semibold text-[#98ab44] font-sans">
                        {formatCurrency(result.economiaFiscalTotal)}
                      </div>
                      <p className="text-xs text-[#577171] mt-2 font-sans italic">
                        Economia acumulada de IR ao longo de {inputs.periodoAnos} anos
                      </p>
                      <p className="text-xs text-[#577171] mt-1 font-sans">
                        Economia média: {formatCurrency(result.economiaFiscalTotal / inputs.periodoAnos)}/ano
                      </p>
                    </div>

                    <div className="bg-white border border-[#e3e3e3] rounded-lg p-4">
                      <div className="text-xs text-[#577171] uppercase tracking-wide mb-2 font-sans">
                        Benefício Fiscal Anual
                      </div>
                      <div className="text-xl font-semibold text-[#262d3d] font-sans">
                        {formatCurrency(result.beneficioFiscalAnual)}
                      </div>
                      <p className="text-xs text-[#577171] mt-2 font-sans italic">
                        Economia média de IR por ano
                      </p>
                    </div>

                    {result && (
                      <Button
                        onClick={handleExportPDF}
                        disabled={exporting || !nomeConsultor || !nomeLead}
                        className="w-full bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Coluna Direita: Gráficos e Tabelas */}
            <div className="lg:col-span-2 space-y-6">
              {result && (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-[#e3e3e3]">
                    <button
                      onClick={() => setActiveTab('chart')}
                      className={`px-4 py-2 font-sans text-sm font-medium transition-colors ${
                        activeTab === 'chart'
                          ? 'text-[#98ab44] border-b-2 border-[#98ab44]'
                          : 'text-[#577171] hover:text-[#262d3d]'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 inline mr-2" />
                      Gráfico
                    </button>
                    <button
                      onClick={() => setActiveTab('table')}
                      className={`px-4 py-2 font-sans text-sm font-medium transition-colors ${
                        activeTab === 'table'
                          ? 'text-[#98ab44] border-b-2 border-[#98ab44]'
                          : 'text-[#577171] hover:text-[#262d3d]'
                      }`}
                    >
                      <Table2 className="h-4 w-4 inline mr-2" />
                      Tabela Detalhada
                    </button>
                  </div>

                  {/* Conteúdo */}
                  {activeTab === 'chart' ? (
                    <Card className="border border-[#e3e3e3]">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif text-[#262d3d]">
                          Projeção de Acumulação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PGBLChart data={result.projecaoAnual} />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border border-[#e3e3e3]">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif text-[#262d3d]">
                          Projeção Anual Detalhada
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PGBLTable data={result.projecaoAnual} />
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

