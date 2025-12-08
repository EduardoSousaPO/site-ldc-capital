// Portfolio Parser - Parse CSV/Excel/Text

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { RawHolding } from '../types';

export interface ParseResult {
  holdings: RawHolding[];
  errors: string[];
}

/**
 * Parse texto colado (detecta separadores: tab, vírgula, ponto-e-vírgula)
 */
export function parseText(text: string): ParseResult {
  const lines = text.trim().split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return { holdings: [], errors: ['Nenhum dado encontrado'] };
  }

  const holdings: RawHolding[] = [];
  const errors: string[] = [];

  // Detectar separador (tab, vírgula, ponto-e-vírgula)
  const firstLine = lines[0];
  let separator = '\t';
  if (firstLine.includes(',')) separator = ',';
  else if (firstLine.includes(';')) separator = ';';
  else if (firstLine.includes('\t')) separator = '\t';

  // Tentar detectar header
  const hasHeader = firstLine.toLowerCase().includes('nome') || 
                    firstLine.toLowerCase().includes('ativo') ||
                    firstLine.toLowerCase().includes('ticker');

  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(separator).map(p => p.trim());
    
    if (parts.length < 2) {
      errors.push(`Linha ${i + 1}: formato inválido`);
      continue;
    }

    // Tentar detectar colunas
    // Assumir: primeira coluna = nome, última coluna numérica = valor
    const nome = parts[0];
    let valor: number | undefined;
    let quantidade: number | undefined;
    let preco: number | undefined;

    // Procurar valores numéricos
    for (let j = 1; j < parts.length; j++) {
      const num = parseNumber(parts[j]);
      if (num !== null) {
        if (!valor) {
          valor = num;
        } else if (!quantidade) {
          quantidade = num;
          preco = valor;
          valor = quantidade * preco;
        }
      }
    }

    if (!nome || (!valor && !quantidade)) {
      errors.push(`Linha ${i + 1}: dados incompletos`);
      continue;
    }

    holdings.push({
      nome_ou_codigo: nome,
      valor,
      quantidade,
      preco,
    });
  }

  return { holdings, errors };
}

/**
 * Parse CSV file
 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const holdings: RawHolding[] = [];
        const errors: string[] = [];

        interface CSVRow {
          [key: string]: string | number | undefined;
        }
        for (const row of results.data as CSVRow[]) {
          const nome = row.nome || row.ativo || row.ticker || row['Nome'] || row['Ativo'] || row['Ticker'];
          const valor = parseNumber(row.valor || row['Valor'] || row.value || row['Value']);
          const quantidade = parseNumber(row.quantidade || row['Quantidade'] || row.qty || row['Qty']);
          const preco = parseNumber(row.preco || row['Preço'] || row.price || row['Price']);

          if (!nome) {
            errors.push(`Linha sem nome/ativo`);
            continue;
          }

          if (!valor && !quantidade) {
            errors.push(`Linha ${nome}: sem valor ou quantidade`);
            continue;
          }

          holdings.push({
            nome_ou_codigo: String(nome),
            valor: valor || (quantidade && preco ? quantidade * preco : undefined),
            quantidade: quantidade ?? undefined,
            preco: preco ?? undefined,
          });
        }

        resolve({ holdings, errors });
      },
      error: (error) => {
        resolve({ holdings: [], errors: [error.message] });
      },
    });
  });
}

/**
 * Parse Excel file
 */
export function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const holdings: RawHolding[] = [];
        const errors: string[] = [];

        interface ExcelRow {
          [key: string]: string | number | undefined;
        }
        for (const row of jsonData as ExcelRow[]) {
          const nome = row.nome || row.ativo || row.ticker || row['Nome'] || row['Ativo'] || row['Ticker'];
          const valor = parseNumber(row.valor || row['Valor'] || row.value || row['Value']);
          const quantidade = parseNumber(row.quantidade || row['Quantidade'] || row.qty || row['Qty']);
          const preco = parseNumber(row.preco || row['Preço'] || row.price || row['Price']);

          if (!nome) {
            errors.push(`Linha sem nome/ativo`);
            continue;
          }

          if (!valor && !quantidade) {
            errors.push(`Linha ${nome}: sem valor ou quantidade`);
            continue;
          }

          holdings.push({
            nome_ou_codigo: String(nome),
            valor: valor || (quantidade && preco ? quantidade * preco : undefined),
            quantidade: quantidade ?? undefined,
            preco: preco ?? undefined,
          });
        }

        resolve({ holdings, errors });
      } catch (error) {
        resolve({ holdings: [], errors: [(error as Error).message] });
      }
    };

    reader.onerror = () => {
      resolve({ holdings: [], errors: ['Erro ao ler arquivo'] });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Helper: parse number from string
 */
function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  
  // Remove currency symbols, spaces, and convert comma to dot
  const cleaned = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

