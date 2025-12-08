import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Importar pdfjs-dist dinamicamente apenas em runtime (não durante build)
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    
    // Configurar worker e polyfill para Node.js
    if (typeof window === 'undefined') {
      // Polyfill DOMMatrix necessário para pdfjs-dist no Node.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).DOMMatrix = class DOMMatrix {
        constructor() {
          // Implementação mínima
        }
        multiply() { return this; }
        scale() { return this; }
        translate() { return this; }
      };
    }
  }
  return pdfjsLib;
}

// Lazy initialization - só cria o cliente quando necessário (em runtime, não durante build)
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({
    apiKey,
  });
}

// Função para processar uma imagem com OCR (reutilizando lógica)
async function processImageWithOCR(
  imageBuffer: Buffer,
  imageType: string,
  sourceType: 'image' | 'pdf' = 'image'
): Promise<{
  holdings: Array<{
    nome: string;
    quantidade?: number | null;
    preco?: number | null;
    valor?: number | null;
    tipo_sugerido?: string;
  }>;
  observacoes?: string;
}> {
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:${imageType};base64,${base64Image}`;

  // Prompt específico para PDF/extratos de corretora
  const pdfPrompt = `Você é um especialista em análise de extratos de corretoras brasileiras. 

Esta imagem foi extraída de um PDF de extrato de corretora e contém uma tabela ou lista de posições de investimento.

IMPORTANTE: Extraia APENAS as posições individuais de investimento (ações, FIIs, ETFs, títulos de renda fixa, etc.) e retorne em formato JSON estruturado.

FOCO EM:
- Tabelas de posições com colunas como: Ticker/Código, Quantidade, Preço Unitário, Valor Total, Tipo
- Ignore cabeçalhos, rodapés, totais gerais, resumos e qualquer informação que não seja uma posição individual
- Se a tabela continuar em outra página, extraia apenas as linhas de posições desta página
- Identifique corretamente tickers brasileiros (ex: PETR4, VALE3, BOVA11, XPLG11, Tesouro Selic 2028, etc.)

Para cada posição, identifique:
- Nome do ativo ou ticker (ex: PETR4, VALE3, BOVA11, Tesouro Selic 2028, XPLG11, etc.)
- Quantidade (se disponível na tabela)
- Valor total (se disponível - pode estar como "Saldo", "Valor", "Total", "Valor Atual")
- Preço unitário (se disponível - pode estar como "Preço Atual", "Preço Médio", "Cotação")
- Tipo de investimento (se possível identificar: Ação BR, ETF BR, FII, RF Pós, RF IPCA, etc.)

REGRAS:
1. Se tiver quantidade E preço, calcule valor = quantidade * preço
2. Se tiver apenas valor total, use esse valor
3. Se tiver apenas quantidade, deixe quantidade e preço como null
4. NUNCA deixe valor como null se tiver qualquer informação numérica
5. IGNORE linhas de totais, subtotais, cabeçalhos e rodapés
6. Extraia APENAS posições individuais de ativos

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem texto adicional):
{
  "holdings": [
    {
      "nome": "PETR4",
      "quantidade": 100,
      "preco": 25.50,
      "valor": 2550.00,
      "tipo_sugerido": "Ação BR"
    }
  ],
  "observacoes": "qualquer observação relevante sobre a extração"
}

Se não conseguir identificar algum campo numérico, use null apenas para quantidade e preco, mas SEMPRE tente calcular ou identificar o valor total.`;

  // Prompt genérico para imagens normais
  const imagePrompt = `Você é um especialista em análise de carteiras de investimentos brasileiras. 

Analise esta imagem que contém uma tabela ou lista de posições de investimento (ações, FIIs, ETFs, Tesouro Direto, etc.).

IMPORTANTE: Extraia TODAS as informações de cada ativo/posição e retorne em formato JSON estruturado.

Para cada posição, identifique:
- Nome do ativo ou ticker (ex: PETR4, VALE3, BOVA11, Tesouro Selic 2028, XPLG11, etc.)
- Quantidade (se disponível na tabela)
- Valor total (se disponível - pode estar como "Saldo", "Valor", "Total")
- Preço unitário (se disponível - pode estar como "Preço Atual", "Preço Médio")
- Tipo de investimento (se possível identificar: Ação BR, ETF BR, FII, RF Pós, RF IPCA, etc.)

REGRAS:
1. Se tiver quantidade E preço, calcule valor = quantidade * preço
2. Se tiver apenas valor total, use esse valor
3. Se tiver apenas quantidade, deixe quantidade e preço como null
4. NUNCA deixe valor como null se tiver qualquer informação numérica

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem texto adicional):
{
  "holdings": [
    {
      "nome": "PETR4",
      "quantidade": 100,
      "preco": 25.50,
      "valor": 2550.00,
      "tipo_sugerido": "Ação BR"
    }
  ],
  "observacoes": "qualquer observação relevante sobre a extração"
}

Se não conseguir identificar algum campo numérico, use null apenas para quantidade e preco, mas SEMPRE tente calcular ou identificar o valor total.`;

  const prompt = sourceType === 'pdf' ? pdfPrompt : imagePrompt;

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nenhuma resposta da API');
  }

  // Tentar parsear JSON (pode vir com markdown)
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    holdings: parsed.holdings || [],
    observacoes: parsed.observacoes,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;

    if (!pdfFile) {
      return NextResponse.json({ error: 'Nenhum PDF fornecido' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (pdfFile.type !== 'application/pdf' && !pdfFile.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Formato não suportado. Use PDF' },
        { status: 400 }
      );
    }

    // Limitar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (pdfFile.size > maxSize) {
      return NextResponse.json(
        { error: 'PDF muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      );
    }

    // Ler PDF
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Carregar PDF usando pdfjs-dist
    const pdfjs = await getPdfJs();
    const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Limitar número de páginas (máximo 20)
    const maxPages = 20;
    const pagesToProcess = Math.min(numPages, maxPages);

    if (numPages > maxPages) {
      console.warn(`PDF tem ${numPages} páginas, processando apenas as primeiras ${maxPages}`);
    }

    interface OCRHolding {
      nome: string;
      quantidade?: number | null;
      preco?: number | null;
      valor?: number | null;
      tipo_sugerido?: string;
    }

    const allHoldings: OCRHolding[] = [];
    const allObservacoes: string[] = [];

    // Processar cada página sequencialmente
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);

        // Renderizar página em canvas
        const { createCanvas } = await import('canvas');
        const viewport = page.getViewport({ scale: 2.0 }); // Escala 2.0 para melhor qualidade
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // pdfjs-dist espera um CanvasRenderingContext2D compatível
        // O canvas do Node.js é compatível, mas precisa de type assertion
        const renderContext = {
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport: viewport,
        };
        // @ts-expect-error - tipos do pdfjs-dist não são totalmente compatíveis com canvas do Node.js
        await page.render(renderContext).promise;

        // Converter canvas para buffer PNG
        const imageBuffer = canvas.toBuffer('image/png');

        // Processar imagem com OCR
        const result = await processImageWithOCR(imageBuffer, 'image/png', 'pdf');

        if (result.holdings && result.holdings.length > 0) {
          allHoldings.push(...result.holdings);
        }

        if (result.observacoes) {
          allObservacoes.push(result.observacoes);
        }
      } catch (error) {
        console.error(`Erro ao processar página ${pageNum}:`, error);
        // Continuar com as próximas páginas mesmo se uma falhar
      }
    }

    if (allHoldings.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum holding encontrado no PDF' },
        { status: 400 }
      );
    }

    // Retornar resultados combinados
    return NextResponse.json({
      holdings: allHoldings,
      observacoes: allObservacoes.length > 0 ? allObservacoes.join('; ') : undefined,
      paginas_processadas: pagesToProcess,
      total_paginas: numPages,
    });
  } catch (error) {
    console.error('Erro no processamento de PDF:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar PDF',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

