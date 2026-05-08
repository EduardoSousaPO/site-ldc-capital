/**
 * F-019 #15 — Renderiza preview dos templates de slide (Instagram 1080×1350).
 *
 * Uso:
 *   npx tsx scripts/F-019-render-hook-preview.ts
 *
 * Hardcoded com slides do JSON pós-cap-320 + final-punctuation-rule
 * (carousel_run_id 3ee9700a-93ce-43fe-a192-733fa5a58691, BlogPost smoke
 * 5a157c14-...).
 *
 * Saída em .preview/:
 *   F-019-preview-hook.png
 *   F-019-preview-content-dado.png   (slide 3 — type=dado)
 *   F-019-preview-content-prova.png  (slide 5 — type=prova)
 *   F-019-preview-question.png       (slide 4 — type=pergunta)
 *   F-019-preview-cta.png            (slide 6 — type=CTA, único light-bg)
 */

import fs from "node:fs";
import path from "node:path";
import { renderSlide } from "../src/features/news/carousel/render";
import type { CarouselSlide } from "../src/features/news/contracts/carousel";

const TOTAL = 6;
const OUT_DIR = path.join(process.cwd(), ".preview");

interface Job {
  outName: string;
  slide: CarouselSlide;
}

const JOBS: Job[] = [
  {
    outName: "F-019-preview-hook.png",
    slide: {
      index: 1,
      type: "hook",
      title: "Selic alta e petróleo caro reescrevem decisões patrimoniais",
      body: "A combinação de juros elevados, inflação revisada e choque do petróleo criou uma janela temporal que exige revisão societária e de governança, não apenas tática de curto prazo.",
    },
  },
  {
    outName: "F-019-preview-content-dado.png",
    slide: {
      index: 3,
      type: "dado",
      title: "Selic 14,75% · IPCA 5,3%",
      body: "A Selic reportada em 14,75% e a revisão do IPCA para 5,3% reduzem a margem real para flexibilização monetária e alongam a janela de alto carry para caixa, alterando trade-offs de liquidez vs risco ilíquido (InfoMoney).",
    },
  },
  {
    outName: "F-019-preview-content-prova.png",
    slide: {
      index: 5,
      type: "prova",
      title: "Processo decisório vale mais que timing",
      body: "Famílias UHNW que formalizam quem decide, sob quais premissas e com que quórum convertem janelas temporais em vantagem duradoura. Evitar que receitas temporárias resultem em políticas permanentes preserva sustentabilidade intergeracional.",
    },
  },
  {
    outName: "F-019-preview-question.png",
    slide: {
      index: 4,
      type: "pergunta",
      title: "Como sua estrutura responde a essa janela?",
      body: "Decisões sobre distribuição de lucros, atualização de pactos e poderes de governança devem ser ponderadas segundo horizonte multigeracional, não apenas pelo calendário fiscal do exercício corrente.",
    },
  },
  {
    outName: "F-019-preview-cta.png",
    slide: {
      index: 6,
      type: "CTA",
      title: "Diagnóstico patrimonial LDC",
      body: "Convidamos famílias com patrimônio superior a R$ 50 milhões para um diagnóstico estruturado sobre governança, pactos societários e janelas fiscais. LDC Capital · CVM 3976-4 · Conteúdo educacional. Não constitui recomendação de investimento.",
    },
  },
];

async function runJob(job: Job): Promise<void> {
  const t0 = Date.now();
  const png = await renderSlide({
    slide: job.slide,
    total: TOTAL,
    format: "instagram",
  });
  const renderMs = Date.now() - t0;

  const outPath = path.join(OUT_DIR, job.outName);
  fs.writeFileSync(outPath, png);
  const stats = fs.statSync(outPath);

  console.log(
    JSON.stringify(
      {
        event: "preview_rendered",
        type: job.slide.type,
        path: outPath,
        kb: Math.round(stats.size / 1024),
        render_ms: renderMs,
      },
      null,
      2,
    ),
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("[F-019 #15 batch] Renderizando 5 previews IG 1080×1350...");
  for (const job of JOBS) {
    await runJob(job);
  }

  // #16b — preview do LinkedIn 1080×1080 só do hook para pausa de aprovação.
  console.log("\n[F-019 #16b] Renderizando preview LinkedIn HOOK 1080×1080...");
  const t0 = Date.now();
  const png = await renderSlide({
    slide: JOBS[0].slide, // hook
    total: TOTAL,
    format: "linkedin",
  });
  const renderMs = Date.now() - t0;
  const liPath = path.join(OUT_DIR, "F-019-preview-hook-linkedin.png");
  fs.writeFileSync(liPath, png);
  const stats = fs.statSync(liPath);
  console.log(
    JSON.stringify(
      {
        event: "preview_rendered",
        format: "linkedin",
        type: "hook",
        path: liPath,
        kb: Math.round(stats.size / 1024),
        render_ms: renderMs,
      },
      null,
      2,
    ),
  );
}

void main().catch((err) => {
  console.error("[F-019 batch] FALHOU:", err);
  process.exit(1);
});
