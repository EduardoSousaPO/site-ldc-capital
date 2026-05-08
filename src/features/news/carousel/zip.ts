/**
 * F-019 v2.0 — Empacotamento ZIP do carrossel mock-tweet.
 *
 * Estrutura:
 *   {slug}-carousel-{YYYYMMDD-HHmmss}.zip
 *   ├── ldc/
 *   │   ├── slide-1-hook.png        (avatar LDC + backdrop)
 *   │   ├── slide-2-contexto.png
 *   │   ├── slide-3-dado.png
 *   │   ├── slide-4-pergunta.png
 *   │   ├── slide-5-prova.png
 *   │   └── slide-6-cta.png
 *   ├── luciano/
 *   │   └── (mesmo padrão, avatar Luciano sem backdrop)
 *   ├── caption-instagram.md
 *   ├── caption-linkedin.md
 *   └── README.md
 *
 * jszip `generateAsync({ type: 'nodebuffer' })`. Não streaming (~3-5MB).
 */

import JSZip from "jszip";
import type {
  CarouselScriptStrict,
  CarouselSlide,
} from "@/features/news/contracts/carousel";

export interface CarouselZipInput {
  script: CarouselScriptStrict;
  ldcPngs: Buffer[];
  lucianoPngs: Buffer[];
  carouselRunId: string;
  generatedAt: string;
  imageGenFailures?: Array<{ slide_index: number; reason: string }>;
}

export interface CarouselZipResult {
  filename: string;
  buffer: Buffer;
  size_bytes: number;
}

function timestampForFilename(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "-" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function slideFilename(slide: CarouselSlide): string {
  const typeLabel = slide.type.toLowerCase();
  return `slide-${slide.index}-${typeLabel}.png`;
}

function buildReadmeMarkdown(
  script: CarouselScriptStrict,
  carouselRunId: string,
  generatedAt: string,
  imageGenFailures: ReadonlyArray<{ slide_index: number; reason: string }>,
): string {
  const failureNote =
    imageGenFailures.length > 0
      ? `\n## ⚠️ Imagens AI com fallback\n\nOs slides ${imageGenFailures
          .map((f) => f.slide_index)
          .join(
            ", ",
          )} foram renderizados em **modo text-only** porque DALL-E não respondeu (${imageGenFailures
          .map((f) => f.reason)
          .join(", ")}). Carrossel continua publicável; se quiser imagens, gere novamente.\n`
      : "";

  return `# Carrossel LDC — ${script.blog_post_slug}

Gerado automaticamente pelo pipeline editorial F-019 v2.0 (formato mock-tweet do X.com) a partir do artigo \`${script.blog_post_slug}\` aprovado em \`/blog\`.

- **Run ID:** \`${carouselRunId}\`
- **Gerado em (UTC):** ${generatedAt}
- **Slides:** ${script.slides.length}
- **Prompt version:** \`${script.prompt_version}\`
${failureNote}

## Duas variações disponíveis

- **\`ldc/\`** — variação **institucional**: avatar LDC Capital (ícone do barco), handle \`@ldc.capital\`. Use para posts no perfil oficial da LDC Capital.
- **\`luciano/\`** — variação **pessoal**: avatar do Luciano Herzog, handle \`@luciano.herzog\`. Use para posts no perfil pessoal do Luciano.

**Conteúdo idêntico entre as duas** — só muda o header do mock-tweet (avatar + nome + handle). Imagens AI (slides 1, 3, 6) são compartilhadas, geradas uma vez via DALL-E 3.

## Como postar

### Instagram
1. Abra o Instagram (mobile ou web).
2. Escolha a variação adequada (\`ldc/\` ou \`luciano/\`).
3. **Drag & drop** dos arquivos na ordem \`slide-1\` → \`slide-${script.slides.length}\`.
4. Cole o conteúdo de \`caption-instagram.md\` na **legenda**.
5. **Hashtags em comentário separado** (não na legenda) — algoritmo do Instagram premia esse padrão.
6. Postar.

### LinkedIn
1. Abra o LinkedIn (web — drag & drop não funciona no mobile).
2. Escolha a variação adequada (\`ldc/\` ou \`luciano/\`).
3. **Drag & drop** dos arquivos na ordem \`slide-1\` → \`slide-${script.slides.length}\`.
4. Cole o conteúdo de \`caption-linkedin.md\` no campo de texto principal.
5. Hashtags do final da caption são adequadas — não move para comentário no LinkedIn.
6. Postar.

## Imagens AI (slides 1, 3, 6)

As imagens hero foram geradas por DALL-E 3 com prompts editoriais que NÃO incluem texto, logos, charts ou pessoas reconhecíveis. **NÃO cite as imagens como fontes** — elas são ilustrativas/conceituais, não referenciam dados reais.

## Compliance — estratégia ADR-007

Este carrossel foi gerado sob a estratégia compliance v2.2 (ADR-007): o **disclaimer literal CVM 3976-4** vive APENAS no artigo editorial completo em \`/blog\` e neste README. Os slides e captions carregam compliance via **guardrails do prompt** (zero recomendação operacional, zero promessa de retorno, zero ticker, zero menção a Bloomberg).

**Disclaimer literal CVM 3976-4** (para uso quando publicar trecho do carrossel fora do contexto carrossel — story, comentário, repost, slide individual):

> "LDC Capital · CVM 3976-4 · Conteúdo educacional. Não constitui recomendação de investimento."

**Para conteúdo completo da LDC** com disclaimer literal embutido, encaminhe o leitor para o artigo em \`/blog/${script.blog_post_slug}\`.

## Auditoria

Este carrossel foi gerado pelo pipeline IA com:
- OpenAI gpt-5-mini (Structured Outputs) para texto
- OpenAI DALL-E 3 (standard 1792×1024) para imagens hero
- Compliance check F-005 aplicado em cada slide e em ambas as captions
- Anti-SPEC §6.2b validado (regex \`/bloomberg/i\` em slides + captions + hashtags + image_prompts — zero ocorrências)
- Custo combinado (texto + imagens) logado em \`carousel_runs\` (Supabase)

Para auditoria detalhada, consulte a row de \`carousel_runs\` com \`id=${carouselRunId}\`.
`;
}

export async function packCarouselZip(
  input: CarouselZipInput,
): Promise<CarouselZipResult> {
  const {
    script,
    ldcPngs,
    lucianoPngs,
    carouselRunId,
    generatedAt,
    imageGenFailures,
  } = input;

  if (ldcPngs.length !== script.slides.length) {
    throw new Error(
      `[carousel/zip] LDC PNGs (${ldcPngs.length}) ≠ slides (${script.slides.length})`,
    );
  }
  if (lucianoPngs.length !== script.slides.length) {
    throw new Error(
      `[carousel/zip] Luciano PNGs (${lucianoPngs.length}) ≠ slides (${script.slides.length})`,
    );
  }

  const zip = new JSZip();
  const ldcFolder = zip.folder("ldc");
  const lucianoFolder = zip.folder("luciano");
  if (!ldcFolder || !lucianoFolder) {
    throw new Error("[carousel/zip] falha ao criar folders no zip");
  }

  for (let i = 0; i < script.slides.length; i++) {
    const slide = script.slides[i];
    ldcFolder.file(slideFilename(slide), ldcPngs[i]);
    lucianoFolder.file(slideFilename(slide), lucianoPngs[i]);
  }

  zip.file("caption-instagram.md", script.caption_instagram);
  zip.file("caption-linkedin.md", script.caption_linkedin);
  zip.file(
    "README.md",
    buildReadmeMarkdown(script, carouselRunId, generatedAt, imageGenFailures ?? []),
  );

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  const filename = `${script.blog_post_slug}-carousel-${timestampForFilename(generatedAt)}.zip`;

  return {
    filename,
    buffer,
    size_bytes: buffer.length,
  };
}
