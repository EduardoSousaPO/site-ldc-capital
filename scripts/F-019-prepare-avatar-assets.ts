/**
 * F-019 v2 — utility one-shot: gera avatares 256×256 do mock-tweet.
 *
 * Uso:
 *   npx tsx scripts/F-019-prepare-avatar-assets.ts
 *
 * Saídas (committadas no repo):
 *   public/images/avatars/ldc-capital.png   (ícone barco isolado, 256×256)
 *   public/images/avatars/luciano-herzog.png (retrato Luciano cropped square, 256×256)
 *
 * Sharp é dep transitiva (next deps); usado APENAS neste script.
 */

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.join(process.cwd(), "public", "images");
const OUT_DIR = path.join(process.cwd(), "public", "images", "avatars");

const AVATAR_SIZE = 256;

async function ldcAvatar() {
  const src = path.join(SRC_DIR, "LDC Capital - Logo Final_Aplicação Principal.png");
  // 4500×4500 com texto "LDC capital" à direita; ícone do barco ocupa ~25-30%
  // da largura, levemente acima do meio. Estratégia: trim primeiro (remove
  // padding transparente do PNG), depois crop esquerdo aproximado para isolar
  // só o barco, depois resize 256×256.
  const trimmedBuf = await sharp(src).trim().toBuffer();
  const trimMeta = await sharp(trimmedBuf).metadata();
  const W = trimMeta.width ?? 4000;
  const H = trimMeta.height ?? 1500;
  // Após trim, conteúdo é ~ratio 3:1 (barco à esquerda + texto à direita).
  // Pego os primeiros ~32% horizontais (barco isolado, com leves margens).
  const cropW = Math.floor(W * 0.32);
  const cropH = H;

  const out = path.join(OUT_DIR, "ldc-capital.png");
  await sharp(trimmedBuf)
    .extract({ left: 0, top: 0, width: cropW, height: cropH })
    .resize(AVATAR_SIZE, AVATAR_SIZE, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(out);

  return out;
}

async function lucianoAvatar() {
  const src = path.join(SRC_DIR, "equipe", "Luciano1.jpg.jpeg");
  // Foto retrato 1067×1600 com rosto centralizado horizontal, cabeça no
  // top 1/3 da imagem. Crop quadrado focando rosto.
  const meta = await sharp(src).metadata();
  const W = meta.width ?? 1067;
  const H = meta.height ?? 1600;
  // Rosto está aproximadamente em center-x, ~25% top vertical
  const cropSize = Math.min(W, Math.floor(H * 0.55));
  const cropL = Math.floor((W - cropSize) / 2);
  const cropT = Math.floor(H * 0.05); // 5% do topo

  const out = path.join(OUT_DIR, "luciano-herzog.png");
  await sharp(src)
    .extract({ left: cropL, top: cropT, width: cropSize, height: cropSize })
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
    .png()
    .toFile(out);

  return out;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const ldc = await ldcAvatar();
  const lh = await lucianoAvatar();
  for (const p of [ldc, lh]) {
    const stats = fs.statSync(p);
    console.log(
      JSON.stringify(
        {
          event: "avatar_prepared",
          path: p,
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
  console.error("[F-019 avatar prep] FALHOU:", err);
  process.exit(1);
});
