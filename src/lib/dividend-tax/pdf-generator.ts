import { chromium } from "playwright";

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "14mm",
        left: "12mm",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
