"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Copy, Image as ImageIcon } from "lucide-react";
import { parseText, parseCSV, parseExcel, type ParseResult } from "@/features/checkup-ldc/ingestion/parser";
import type { RawHolding } from "@/features/checkup-ldc/types";
import { toast } from "sonner";

interface PortfolioInputProps {
  onHoldingsParsed: (holdings: RawHolding[]) => void;
}

const EXAMPLE_TEXT = `PETR4	50000
VALE3	30000
ITUB4	20000
BOVA11	100000`;

export function PortfolioInput({ onHoldingsParsed }: PortfolioInputProps) {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleParse = async (result: ParseResult) => {
    if (result.errors.length > 0) {
      toast.warning(`Alguns erros encontrados: ${result.errors.slice(0, 3).join(", ")}`);
    }

    if (result.holdings.length === 0) {
      toast.error("Nenhum holding válido encontrado");
      return;
    }

    toast.success(`${result.holdings.length} holdings encontrados`);
    onHoldingsParsed(result.holdings);
  };

  const handleTextParse = () => {
    if (!text.trim()) {
      toast.error("Cole ou digite os dados da carteira");
      return;
    }

    setIsProcessing(true);
    try {
      const result = parseText(text);
      handleParse(result);
    } catch (error) {
      toast.error("Erro ao processar texto");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      let result: ParseResult;
      
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        result = await parseCSV(file);
      } else if (
        file.name.endsWith('.xlsx') || 
        file.name.endsWith('.xls') ||
        file.type.includes('spreadsheet')
      ) {
        result = await parseExcel(file);
      } else {
        toast.error("Formato não suportado. Use CSV ou Excel");
        return;
      }

      handleParse(result);
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      console.error(error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setIsProcessing(true);
    const allHoldings: RawHolding[] = [];
    const fileArray = Array.from(files);
    
    try {
      toast.info(`Processando ${fileArray.length} imagem(ns) com IA...`);

      // Processar cada imagem sequencialmente
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        toast.info(`Processando imagem ${i + 1} de ${fileArray.length}...`);

        const formData = new FormData();
        formData.append('images', file);

        const res = await fetch('/api/checkup-ldc/ocr', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          toast.warning(`Erro ao processar imagem ${i + 1}: ${error.error || 'Erro desconhecido'}`);
          continue; // Continuar com as próximas imagens
        }

        const data = await res.json();

        if (!data.holdings || data.holdings.length === 0) {
          toast.warning(`Nenhum holding encontrado na imagem ${i + 1}`);
          continue;
        }

        // Converter para formato RawHolding
        const holdings: RawHolding[] = data.holdings.map((h: any) => {
          // Calcular valor se não estiver presente mas tiver quantidade e preço
          let valor = h.valor;
          if (!valor && h.quantidade && h.preco) {
            valor = h.quantidade * h.preco;
          }
          
          return {
            nome_ou_codigo: h.nome || '',
            valor: valor || undefined,
            quantidade: h.quantidade || undefined,
            preco: h.preco || undefined,
            tipo: h.tipo_sugerido || undefined,
          };
        }).filter((h: RawHolding) => h.nome_ou_codigo && (h.valor || h.quantidade));

        if (holdings.length > 0) {
          allHoldings.push(...holdings);
          toast.success(`${holdings.length} holdings extraídos da imagem ${i + 1}`);
        }
      }

      if (allHoldings.length === 0) {
        toast.error('Nenhum holding válido extraído das imagens');
        return;
      }

      // Remover duplicatas (mesmo nome/ticker) e somar valores
      const uniqueHoldings = allHoldings.reduce((acc, holding) => {
        const existing = acc.find(h => 
          h.nome_ou_codigo.toLowerCase() === holding.nome_ou_codigo.toLowerCase()
        );
        if (existing) {
          // Se já existe, somar valores se possível
          if (holding.valor) {
            existing.valor = (existing.valor || 0) + (holding.valor || 0);
          }
          if (holding.quantidade) {
            existing.quantidade = (existing.quantidade || 0) + (holding.quantidade || 0);
          }
        } else {
          acc.push({ ...holding });
        }
        return acc;
      }, [] as RawHolding[]);

      toast.success(`Total: ${uniqueHoldings.length} holdings únicos extraídos de ${fileArray.length} imagem(ns)`);
      onHoldingsParsed(uniqueHoldings);
    } catch (error) {
      toast.error((error as Error).message || 'Erro ao processar imagens');
      console.error(error);
    } finally {
      setIsProcessing(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
  };

  const copyExample = () => {
    setText(EXAMPLE_TEXT);
    toast.success("Exemplo copiado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cole sua carteira</CardTitle>
        <CardDescription>
          Cole os dados da sua carteira, faça upload de um arquivo CSV/Excel ou envie uma ou mais imagens da sua carteira
        </CardDescription>
        {/* Stepper */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
          <span className="font-medium">3 passos</span>
          <span>•</span>
          <span>5 minutos</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selo de segurança */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-center text-muted-foreground">
          <span className="font-medium">Sem senha</span>
          <span> • </span>
          <span className="font-medium">Sem acesso à corretora</span>
          <span> • </span>
          <span className="font-medium">Dados usados só para gerar seu relatório</span>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Dados da carteira</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole aqui os dados da sua carteira (nome/ativo e valor)..."
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Formato: Nome/Ticker separado por tab, vírgula ou ponto-e-vírgula + Valor</span>
            <button
              type="button"
              onClick={copyExample}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Copy className="w-3 h-3" />
              Ver exemplo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 border-t"></div>
          <span className="text-sm text-muted-foreground">ou</span>
          <div className="flex-1 border-t"></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              CSV/Excel
            </Button>
          </div>
          <div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload Imagem(ns)
            </Button>
          </div>
        </div>

        <Button
          onClick={handleTextParse}
          disabled={isProcessing || !text.trim()}
          className="w-full"
          size="lg"
        >
          {isProcessing ? "Processando..." : "Gerar meu Checkup"}
        </Button>

        {text === EXAMPLE_TEXT && (
          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Exemplo de formato:</p>
            <pre className="text-xs font-mono whitespace-pre-wrap">{EXAMPLE_TEXT}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

