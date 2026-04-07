export interface IntakeAnswers {
  [questionId: string]: unknown;
}

export interface Finding {
  gap: string;
  severity: "P0" | "P1" | "P2" | "P3";
  tsc: string;
  remediation: string;
  effort: "hours" | "days" | "weeks";
}

export interface DimensionResult {
  score: number;
  findings: Finding[];
  strengths: string[];
  confidence: number;
}

export interface Dimension {
  id: string;
  name: string;
  tsc: string[];
  weight: number;
  evaluate(answers: IntakeAnswers): DimensionResult;
}

export type ReadinessBand =
  | "not-ready"
  | "getting-started"
  | "building-momentum"
  | "almost-there"
  | "audit-ready";

export interface ScoredDimension {
  dimension: Dimension;
  result: DimensionResult;
}

export interface ReadinessScore {
  overall: number;
  band: ReadinessBand;
  dimensions: ScoredDimension[];
  gaps: Finding[];
  strengths: string[];
}

export interface TemplateSection {
  title: string;
  type: "interpolate" | "ai_generate";
  template?: string;
  prompt?: {
    system: string;
    instruction: string;
    requiredContext: string[];
  };
  reviewTag?: boolean;
}

export interface ComplianceTemplate {
  id: string;
  name: string;
  tsc: string[];
  auditRisk: "critical" | "high" | "medium" | "low";
  sections: TemplateSection[];
}
