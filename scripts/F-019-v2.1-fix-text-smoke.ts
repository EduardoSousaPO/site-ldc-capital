/**
 * F-019 v2.1 — smoke text-only (sem DALL-E).
 *
 * Roda generator com prompt v2.1 calibrado e gera:
 *   - .preview/F-019-v2.1-fix-json.json
 *   - .preview/F-019-v2.1-fix-comparison.md
 *
 * Baseline v2.0 hardcoded a partir do smoke run 6a450299 (que carregava
 * o tom denso editorial). Não re-rodamos v2.0 (custaria outro R$0,04 e
 * o conteúdo já foi capturado nas conversations).
 *
 * Custo esperado: ~R$0,04 (apenas OpenAI text gen).
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { generateCarouselScript } from "../src/features/news/carousel/generator";
import type {
  CarouselScriptStrict,
  CarouselSlide,
} from "../src/features/news/contracts/carousel";

const BLOG_POST_ID = "5a157c14-b06b-4e85-8312-13942b88b914";
const ADMIN_USER_ID = "5258d21b-9dfa-4eea-8ef8-7fd3eed8748a";

// Baseline v2.0 — bodies do smoke 6a450299 (carrosselou tom editorial denso).
const BASELINE_V20: Array<{
  index: number;
  type: string;
  body: string;
}> = [
  {
    index: 1,
    type: "hook",
    body: "Juros altos não são o principal risco para famílias UHNW. Com Selic elevada e petróleo caro, a variável decisiva é a janela de decisões patrimoniais — não apenas a taxa nominal. Estruturas societárias e governança determinam se essa janela vira vantagem ou custo.",
  },
  {
    index: 2,
    type: "contexto",
    body: "O regime macro combina uma taxa de juros ainda elevada com revisão de inflação para cima e choque prolongado no petróleo. Essa convergência cria uma janela temporal com efeitos fiscais, de pass-through e de liquidez que exigem decisões coordenadas.",
  },
  {
    index: 3,
    type: "dado",
    body: "Nível corrente de Selic em 14,75% e IPCA projetado em 5,3% comprimem margem real para cortes rápidos, segundo relatórios de mercado. Para famílias, isso alonga a remuneração do caixa e reduz o espaço para ajustes rápidos de risco ilíquido. (InfoMoney)",
  },
  {
    index: 4,
    type: "pergunta",
    body: "A pergunta relevante é estrutural: quem decide distribuir, reestruturar ou atualizar pactos societários dentro do prazo disponível? Decisões isoladas podem transferir risco conjuntural para o horizonte multigeracional.",
  },
  {
    index: 5,
    type: "prova",
    body: "Famílias com horizonte multigeracional tendem a preservar valor quando privilegiam governança, regras de quórum e premissas de avaliação atualizadas. A combinação de receita temporária por commodities e risco inflacionário torna essencial um protocolo que disciplina timing e critérios.",
  },
  {
    index: 6,
    type: "CTA",
    body: "Convidamos famílias com patrimônio superior a R$ 50 milhões para um diagnóstico estruturado sobre janelas fiscais e governança. LDC Capital · CVM 3976-4 · Conteúdo educacional. Não constitui recomendação de investimento.",
  },
];

const BANNED_JARGON = [
  "compressão de prêmio",
  "horizonte multigeracional",
  "termos de troca",
  "pass-through",
  "carry",
  "alocação estratégica",
  "estrutura patrimonial",
  "regime fiscal",
  "regime macro",
  "trade-off",
  "valuation",
  "duration",
  "mark-to-market",
  "intergeracional",
  "sustentabilidade intergeracional",
  "compressão",
];

const APPROVED_HOOKS_RE = [
  /olhando\s+pro\s+lugar\s+errado/i,
  /aposto\s+que\s+você/i,
  /quero\s+te\s+mostrar/i,
  /não\s+é\s+o\s+que\s+importa/i,
  /perdem\s+patrimônio/i,
  /vou\s+te\s+(mostrar|explicar)/i,
];

interface SlideStats {
  index: number;
  type: string;
  paragraph_count: number;
  sentence_count: number;
  word_count: number;
  longest_sentence_words: number;
  avg_words_per_sentence: number;
  bold_count: number;
  jargon_hits: string[];
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function stripBoldMarkers(text: string): string {
  return text.replace(/\*\*/g, "");
}

function analyzeSlide(slide: { index: number; type: string; body: string }): SlideStats {
  const stripped = stripBoldMarkers(slide.body);
  const paragraphs = splitParagraphs(stripped);
  const sentences = paragraphs.flatMap(splitSentences);
  const sentenceLengths = sentences.map((s) => countWords(s));
  const longestSentenceWords =
    sentenceLengths.length > 0 ? Math.max(...sentenceLengths) : 0;
  const totalWords = sentenceLengths.reduce((a, b) => a + b, 0);
  const avgWords =
    sentenceLengths.length > 0 ? totalWords / sentenceLengths.length : 0;
  const boldCount = (slide.body.match(/\*\*[^*]+\*\*/g) ?? []).length;
  const jargonHits: string[] = [];
  for (const term of BANNED_JARGON) {
    if (new RegExp(`\\b${term.replace(/[-]/g, "[- ]")}\\b`, "i").test(stripped)) {
      jargonHits.push(term);
    }
  }
  return {
    index: slide.index,
    type: slide.type,
    paragraph_count: paragraphs.length,
    sentence_count: sentences.length,
    word_count: totalWords,
    longest_sentence_words: longestSentenceWords,
    avg_words_per_sentence: Number(avgWords.toFixed(1)),
    bold_count: boldCount,
    jargon_hits: jargonHits,
  };
}

function aggregateStats(slides: SlideStats[]) {
  const totalSentences = slides.reduce((a, s) => a + s.sentence_count, 0);
  const totalWords = slides.reduce((a, s) => a + s.word_count, 0);
  const totalBold = slides.reduce((a, s) => a + s.bold_count, 0);
  const allJargon = new Set<string>();
  for (const s of slides) for (const j of s.jargon_hits) allJargon.add(j);
  const longestEverywhere = Math.max(
    ...slides.map((s) => s.longest_sentence_words),
  );
  return {
    total_sentences: totalSentences,
    total_words: totalWords,
    avg_words_per_sentence:
      totalSentences > 0 ? Number((totalWords / totalSentences).toFixed(1)) : 0,
    total_bold_trechos: totalBold,
    longest_sentence_words: longestEverywhere,
    jargon_hits: Array.from(allJargon),
  };
}

function checkApprovedHook(body: string): string[] {
  return APPROVED_HOOKS_RE
    .filter((re) => re.test(body))
    .map((re) => re.source);
}

function buildComparisonMd(
  v21Slides: ReadonlyArray<CarouselSlide>,
  v21Caption: string,
): string {
  const v20Stats = BASELINE_V20.map(analyzeSlide);
  const v21Stats = v21Slides.map((s) =>
    analyzeSlide({ index: s.index, type: s.type, body: s.body }),
  );
  const v20Agg = aggregateStats(v20Stats);
  const v21Agg = aggregateStats(v21Stats);
  const slide1Hook = v21Slides[0]?.body ?? "";
  const approvedHooks = checkApprovedHook(slide1Hook);

  const lines: string[] = [];
  lines.push("# F-019 v2.1 vs v2.0 — comparison de tom\n");
  lines.push("Métricas agregadas (todos os slides):\n");
  lines.push("| Métrica | v2.0 (denso editorial) | v2.1 (consultivo) |");
  lines.push("|---|---|---|");
  lines.push(
    `| Total de frases | ${v20Agg.total_sentences} | ${v21Agg.total_sentences} |`,
  );
  lines.push(
    `| Total de palavras | ${v20Agg.total_words} | ${v21Agg.total_words} |`,
  );
  lines.push(
    `| Frase média (palavras) | ${v20Agg.avg_words_per_sentence} | ${v21Agg.avg_words_per_sentence} |`,
  );
  lines.push(
    `| Frase MAIS LONGA (palavras) | ${v20Agg.longest_sentence_words} | ${v21Agg.longest_sentence_words} |`,
  );
  lines.push(
    `| Trechos **bold** total | ${v20Agg.total_bold_trechos} | ${v21Agg.total_bold_trechos} |`,
  );
  lines.push(
    `| Jargão técnico (banned) ocorrências | ${v20Agg.jargon_hits.length} (${v20Agg.jargon_hits.join(", ") || "—"}) | ${v21Agg.jargon_hits.length} (${v21Agg.jargon_hits.join(", ") || "—"}) |`,
  );
  lines.push(
    `| Hooks aprovados (slide 1) | — | ${approvedHooks.length > 0 ? approvedHooks.join(", ") : "nenhum padrão pré-aprovado detectado"} |`,
  );
  lines.push("");

  // Por slide
  for (let i = 0; i < BASELINE_V20.length; i++) {
    const v20 = BASELINE_V20[i];
    const v21 = v21Slides[i];
    if (!v21) continue;
    const v20s = v20Stats[i];
    const v21s = v21Stats[i];
    lines.push(`## SLIDE ${v20.index} (${v20.type})\n`);
    lines.push(`### v2.0 (baseline — dense editorial)`);
    lines.push("```");
    lines.push(v20.body);
    lines.push("```");
    lines.push(
      `[${v20s.sentence_count} frases, ${v20s.word_count} palavras, ` +
        `frase média ${v20s.avg_words_per_sentence} palavras, ` +
        `mais longa ${v20s.longest_sentence_words} palavras, ` +
        `${v20s.bold_count} bold, jargão: ${v20s.jargon_hits.join(", ") || "—"}]\n`,
    );
    lines.push(`### v2.1 (consultive social)`);
    lines.push("```");
    lines.push(v21.body);
    lines.push("```");
    lines.push(
      `[${v21s.sentence_count} frases, ${v21s.word_count} palavras, ` +
        `frase média ${v21s.avg_words_per_sentence} palavras, ` +
        `mais longa ${v21s.longest_sentence_words} palavras, ` +
        `${v21s.bold_count} bold, jargão: ${v21s.jargon_hits.join(", ") || "—"}]\n`,
    );
    lines.push(`### Diff de tom`);
    lines.push(
      `- Frase média: ${v20s.avg_words_per_sentence} → ${v21s.avg_words_per_sentence} palavras`,
    );
    lines.push(
      `- Frase mais longa: ${v20s.longest_sentence_words} → ${v21s.longest_sentence_words} palavras`,
    );
    const jargonRemoved = v20s.jargon_hits.filter(
      (j) => !v21s.jargon_hits.includes(j),
    );
    const jargonAdded = v21s.jargon_hits.filter(
      (j) => !v20s.jargon_hits.includes(j),
    );
    lines.push(
      `- Jargão removido: ${jargonRemoved.join(", ") || "—"}${jargonAdded.length > 0 ? ` (⚠️ adicionado: ${jargonAdded.join(", ")})` : ""}`,
    );
    lines.push("");
  }

  lines.push("\n## Caption Instagram (apenas v2.1)\n");
  lines.push("```");
  lines.push(v21Caption);
  lines.push("```\n");

  return lines.join("\n");
}

async function main() {
  const t0 = Date.now();
  console.log("[smoke v2.1 text-only] generateCarouselScript...");

  const result = await generateCarouselScript(
    { blogPostId: BLOG_POST_ID, generatedByUserId: ADMIN_USER_ID },
    { skipRateLimit: true },
  );

  const outDir = path.join(process.cwd(), ".preview");
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "F-019-v2.1-fix-json.json");
  const cmpPath = path.join(outDir, "F-019-v2.1-fix-comparison.md");

  fs.writeFileSync(jsonPath, JSON.stringify(result.script, null, 2));

  const comparison = buildComparisonMd(
    result.script.slides,
    result.script.caption_instagram,
  );
  fs.writeFileSync(cmpPath, comparison);

  // Anti-SPEC §6.2b sanity check
  const allText = [
    result.script.slides
      .map((s) => `${s.title} ${s.body} ${s.image_prompt ?? ""}`)
      .join(" "),
    result.script.caption_instagram,
    result.script.caption_linkedin,
    result.script.hashtags.join(" "),
  ].join(" ");
  const bloombergMatches = allText.match(/bloomberg/gi) ?? [];

  const summary = {
    event: "smoke_v2.1_text_only_complete",
    carousel_run_id: result.carousel_run_id,
    blog_post_slug: result.script.blog_post_slug,
    slides_count: result.script.slides.length,
    cost_brl_text: result.cost_brl,
    cost_exceeded: result.cost_exceeded,
    total_tokens: result.total_tokens,
    cached_tokens: result.cached_tokens,
    model: result.model,
    json_path: jsonPath,
    comparison_path: cmpPath,
    duration_ms: Date.now() - t0,
    anti_spec_6_2b: {
      regex: "/bloomberg/i",
      matches: bloombergMatches.length,
      passed: bloombergMatches.length === 0,
    },
  };

  console.log("\n=== SMOKE v2.1 TEXT-ONLY — SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((err) => {
  console.error("[smoke v2.1] FALHOU:", err);
  process.exit(1);
});
