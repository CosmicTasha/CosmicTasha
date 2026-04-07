import type {
  Dimension,
  IntakeAnswers,
  ReadinessScore,
  ReadinessBand,
  ScoredDimension,
} from "./types";

function toBand(score: number): ReadinessBand {
  if (score >= 80) return "audit-ready";
  if (score >= 60) return "almost-there";
  if (score >= 40) return "building-momentum";
  if (score >= 20) return "getting-started";
  return "not-ready";
}

export class ScoreEngine {
  private dimensions: Dimension[];

  constructor(dimensions: Dimension[]) {
    this.dimensions = dimensions;
  }

  score(answers: IntakeAnswers): ReadinessScore {
    const scored: ScoredDimension[] = this.dimensions.map((d) => ({
      dimension: d,
      result: d.evaluate(answers),
    }));

    const overall = Math.round(
      scored.reduce((sum, s) => sum + s.dimension.weight * s.result.score, 0) * 100
    );

    return {
      overall,
      band: toBand(overall),
      dimensions: scored,
      gaps: scored.flatMap((s) => s.result.findings),
      strengths: scored.flatMap((s) => s.result.strengths),
    };
  }
}
