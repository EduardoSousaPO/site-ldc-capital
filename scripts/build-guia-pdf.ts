/**
 * Gera o PDF estático do guia em public/guia-ldc-capital.pdf
 * a partir da página /guia-pdf renderizada via Playwright (Chromium headless).
 *
 * Uso local:  npm run pdf:build
 *  - Requer dev server em http://localhost:3000 OU usa BASE_URL do .env (ex.: https://ldccapital.com.br)
 *
 * O arquivo gerado é o anexo enviado pelo sendGuiaEmail.
 */
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_PATH = path.resolve(process.cwd(), 'public', 'guia-ldc-capital.pdf');

async function main() {
  console.log(`[pdf:build] Renderizando ${BASE_URL}/guia-pdf …`);

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/guia-pdf`, { waitUntil: 'networkidle', timeout: 30_000 });

    // Garante que web fonts (IvyMode, Public Sans) estão prontas antes de imprimir
    await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (document as any).fonts?.ready;
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, pdfBuffer);

    console.log(`[pdf:build] OK → ${OUTPUT_PATH} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[pdf:build] FAIL', err);
  process.exit(1);
});
