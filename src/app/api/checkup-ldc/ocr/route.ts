import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Formato não suportado: ${file.name}. Use JPEG, PNG ou WebP` },
          { status: 400 }
        );
      }
    }

    // Processar primeira imagem (para manter compatibilidade com código existente)
    // Se houver múltiplas, processar todas e combinar resultados
    interface OCRHolding {
      nome: string;
      quantidade?: number | null;
      preco?: number | null;
      valor?: number | null;
      tipo_sugerido?: string;
    }
    const allHoldings: OCRHolding[] = [];
    const allObservacoes: string[] = [];

    for (const file of files) {
      // Converter para base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64Image}`;

      // Chamar OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // ou gpt-4o-mini para custo menor
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Você é um especialista em análise de carteiras de investimentos brasileiras. 

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

Se não conseguir identificar algum campo numérico, use null apenas para quantidade e preco, mas SEMPRE tente calcular ou identificar o valor total.`
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
        temperature: 0.1, // Baixa temperatura para maior precisão
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.warn(`Nenhuma resposta da API para imagem ${file.name}`);
        continue;
      }

      // Tentar parsear JSON (pode vir com markdown)
      try {
        // Remover markdown code blocks se houver
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        
        if (parsed.holdings && Array.isArray(parsed.holdings)) {
          allHoldings.push(...parsed.holdings);
        }
        
        if (parsed.observacoes) {
          allObservacoes.push(parsed.observacoes);
        }
      } catch (error) {
        console.error(`Erro ao parsear JSON da imagem ${file.name}:`, error);
        // Continuar com as próximas imagens mesmo se uma falhar
      }
    }

    // Retornar resultados combinados
    return NextResponse.json({
      holdings: allHoldings,
      observacoes: allObservacoes.length > 0 ? allObservacoes.join('; ') : undefined,
      imagens_processadas: files.length,
    });
  } catch (error) {
    console.error('Erro no OCR:', error);
    return NextResponse.json(
      { error: 'Erro ao processar imagem(ns)', details: (error as Error).message },
      { status: 500 }
    );
  }
}

