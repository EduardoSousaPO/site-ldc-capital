/**
 * Mapeia `CarouselScript` → `ComplianceCheckInput[]` para reuso da engine
 * F-005 (`runComplianceCheck`) sem modificá-la (frozen).
 *
 * Estratégia: para cada slide e para cada caption, criamos um
 * `ComplianceCheckInput` minimal onde o campo natural (slide.body, caption)
 * vai em `body` e o título do slide vai em `title`. Demais campos ficam
 * vazios — não interferem na detecção (regex só dispara em texto não-vazio).
 *
 * Cobertura:
 *   - slide.title + slide.body (tickers BR/US, prescrição, promessa, Bloomberg)
 *   - caption_instagram, caption_linkedin (mesma cobertura)
 *   - hashtag (validação extra para Bloomberg via regex direta — engine
 *     F-005 não foi calibrada para hashtags isoladas, então aplicamos check
 *     adicional acima do mapper)
 */

import type {
  CarouselScript,
  CarouselSlide,
} from "@/features/news/contracts/carousel";
import { runComplianceCheck } from "@/features/news/compliance/checker";
import type {
  ComplianceCheckResult,
  ComplianceViolation,
} from "@/features/news/contracts/compliance";

export interface CarouselViolation extends ComplianceViolation {
  /** Onde o problema apareceu no carrossel — para a UI mostrar contexto. */
  source:
    | { kind: "slide"; index: number; type: CarouselSlide["type"] }
    | { kind: "caption"; channel: "instagram" | "linkedin" }
    | { kind: "hashtag"; index: number };
}

export interface CarouselComplianceResult {
  passed: boolean;
  violations: CarouselViolation[];
}

const EMPTY_SCAN_FIELDS = {
  por_que_importa: "",
  entre_as_linhas: "",
  o_que_fica_de_olho: "",
  numeros: [] as ReadonlyArray<{
    texto: string;
    fonte_url: string;
    fonte_nome: string;
  }>,
  fontes: [] as ReadonlyArray<{
    url: string;
    title: string;
    dominio: string;
  }>,
};

const HASHTAG_BLOOMBERG_REGEX = /bloomberg/i;

function checkSlide(slide: CarouselSlide): ComplianceCheckResult {
  return runComplianceCheck({
    title: slide.title,
    body: slide.body,
    ...EMPTY_SCAN_FIELDS,
  });
}

function checkCaption(caption: string): ComplianceCheckResult {
  return runComplianceCheck({
    title: "",
    body: caption,
    ...EMPTY_SCAN_FIELDS,
  });
}

/**
 * Aplica `runComplianceCheck` a cada slide + ambas captions; concatena
 * violações com `source` localizando o ponto exato no carrossel para a UI.
 *
 * Hashtags recebem um check adicional só para Bloomberg (engine F-005 cobre
 * texto livre e ignora hashtag isolada como "#PoolBloomberg").
 */
export function checkCarouselCompliance(
  script: CarouselScript,
): CarouselComplianceResult {
  const violations: CarouselViolation[] = [];

  for (const slide of script.slides) {
    const result = checkSlide(slide);
    for (const v of result.violations) {
      violations.push({
        ...v,
        source: { kind: "slide", index: slide.index, type: slide.type },
      });
    }
  }

  const captionInstagram = checkCaption(script.caption_instagram);
  for (const v of captionInstagram.violations) {
    violations.push({
      ...v,
      source: { kind: "caption", channel: "instagram" },
    });
  }

  const captionLinkedin = checkCaption(script.caption_linkedin);
  for (const v of captionLinkedin.violations) {
    violations.push({
      ...v,
      source: { kind: "caption", channel: "linkedin" },
    });
  }

  // Hashtag Bloomberg-only check (defense in depth Anti-SPEC §6.2b)
  for (let i = 0; i < script.hashtags.length; i++) {
    const tag = script.hashtags[i];
    if (HASHTAG_BLOOMBERG_REGEX.test(tag)) {
      violations.push({
        type: "bloomberg_in_body",
        match: tag,
        field: "body",
        line_number: 0,
        severity: "hard_block",
        message: `Anti-SPEC §6.2b: hashtag "${tag}" menciona Bloomberg`,
        source: { kind: "hashtag", index: i },
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
