/**
 * /api/guia/pdf — entrega o lead magnet em application/pdf.
 *
 * Estratégia (Opção A + B):
 *  - Fast path (produção): faz stream do PDF estático em `public/guia-ldc-capital.pdf`
 *    gerado por `npm run pdf:build` antes do deploy.
 *  - Fallback dev (NODE_ENV !== 'production'): se o arquivo estático não existir
 *    OU se `?refresh=1` for passado, regenera on-the-fly via Playwright Chromium.
 *
 * Por que não regenerar em produção: Playwright/Chromium não roda em runtime
 * serverless da Vercel sem um build de chromium específico (@sparticuz/chromium).
 * Para manter o deploy simples, o PDF é build artifact, não runtime artifact.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PDF_FILENAME = 'guia-ldc-capital.pdf';
const PDF_PATH = path.join(process.cwd(), 'public', PDF_FILENAME);

async function readStaticPdf(): Promise<Buffer | null> {
  try {
    return await readFile(PDF_PATH);
  } catch {
    return null;
  }
}

async function renderViaPlaywright(): Promise<Buffer> {
  const { chromium } = await import('playwright');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/guia-pdf`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (document as any).fonts?.ready;
    });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
  } finally {
    await browser.close();
  }
}

export async function GET(request: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const refresh = request.nextUrl.searchParams.get('refresh') === '1';
  const inline = request.nextUrl.searchParams.get('inline') === '1';

  let pdfBuffer: Buffer | null = null;

  if (!refresh || isProd) {
    pdfBuffer = await readStaticPdf();
  }

  if (!pdfBuffer && !isProd) {
    try {
      pdfBuffer = await renderViaPlaywright();
    } catch (err) {
      console.error('[/api/guia/pdf] Falha ao renderizar via Playwright:', err);
    }
  }

  if (!pdfBuffer) {
    return NextResponse.json(
      {
        error: 'PDF não disponível',
        hint: 'Rode `npm run pdf:build` antes do deploy para gerar public/guia-ldc-capital.pdf.',
      },
      { status: 503 }
    );
  }

  const disposition = inline ? 'inline' : `attachment; filename="LDC-Capital-Guia.pdf"`;
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'Cache-Control': isProd ? 'public, max-age=3600, s-maxage=86400' : 'no-store',
    },
  });
}
