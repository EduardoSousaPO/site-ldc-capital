/**
 * F-019 — utility one-shot: trim de margens transparentes dos logos LDC.
 *
 * Os PNGs originais em public/images/ são quadrados 4500×4500 com conteúdo
 * horizontal centralizado e ~80% de padding transparente. Para uso em
 * @vercel/og (Satori), precisamos de versões com ratio horizontal real
 * — caso contrário o logo aparece minúsculo perdido em transparency.
 *
 * Uso:
 *   npx tsx scripts/F-019-prepare-logo-assets.ts
 *
 * Saída (commitada no repo):
 *   public/images/carousel/logo-dark-bg-trimmed.png
 *   public/images/carousel/logo-light-bg-trimmed.png
 *
 * Sharp é dep transitiva (next deps); usado APENAS neste script utilitário.
 * NÃO virar dep runtime do generator — F-019 lê os PNGs trimados via fs.
 */

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.join(process.cwd(), "public", "images");
const OUT_DIR = path.join(process.cwd(), "public", "images", "carousel");

interface LogoSpec {
  src: string;
  out: string;
  label: string;
}

const LOGOS: LogoSpec[] = [
  {
    src: "LDC Capital - Logo Final_Aplicação Horizontal Colorida + Branca.png",
    out: "logo-dark-bg-trimmed.png",
    label: "dark-bg (texto branco + ícone verde-oliva)",
  },
  {
    src: "LDC Capital - Logo Final_Aplicação Horizontal Colorida.png",
    out: "logo-light-bg-trimmed.png",
    label: "light-bg (texto cinza + ícone verde-oliva)",
  },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const logo of LOGOS) {
    const srcPath = path.join(SRC_DIR, logo.src);
    const outPath = path.join(OUT_DIR, logo.out);

    const trimmed = await sharp(srcPath).trim().toBuffer();
    const meta = await sharp(trimmed).metadata();
    fs.writeFileSync(outPath, trimmed);

    const stats = fs.statSync(outPath);
    console.log(
      JSON.stringify(
        {
          event: "logo_trimmed",
          label: logo.label,
          out: outPath,
          dimensions: { width: meta.width, height: meta.height },
          aspect_ratio:
            meta.width && meta.height
              ? Math.round((meta.width / meta.height) * 100) / 100
              : null,
          bytes: stats.size,
          kb: Math.round(stats.size / 1024),
        },
        null,
        2,
      ),
    );
  }
}

void main().catch((err) => {
  console.error("[F-019 logo prep] FALHOU:", err);
  process.exit(1);
});
