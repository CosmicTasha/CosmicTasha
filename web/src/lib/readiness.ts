/**
 * Readiness Score Calculator
 *
 * Calculates a 0-100 compliance readiness score across 5 dimensions
 * based on intake answers. Updates in real-time as the user progresses.
 *
 * Dimensions and weights:
 *   Access Control Maturity   25%
 *   Data Protection            20%
 *   Operational Readiness      20%
 *   Change Management          15%
 *   Documentation Completeness 20%
 */

export interface DimensionScore {
  dimension: string;
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
  signals: string[]; // what contributed
}

export interface ReadinessResult {
  overall: number; // 0-100 weighted
  dimensions: DimensionScore[];
  tier: "audit-ready" | "almost-there" | "building-momentum" | "getting-started" | "not-ready";
  message: string;
}

type Answers = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function str(answers: Answers, key: string): string {
  const v = answers[key];
  return typeof v === "string" ? v : "";
}

function obj(answers: Answers, key: string): Record<string, string> {
  const v = answers[key];
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, string>)
    : {};
}

/** Score a single checklist answer (best=100, worst=0) */
function scoreOption(value: string, best: string[], good: string[], fair: string[]): number {
  if (best.some((b) => value.toLowerCase().includes(b.toLowerCase()))) return 100;
  if (good.some((g) => value.toLowerCase().includes(g.toLowerCase()))) return 66;
  if (fair.some((f) => value.toLowerCase().includes(f.toLowerCase()))) return 33;
  return 0;
}

// ---------------------------------------------------------------------------
// Dimension scorers
// ---------------------------------------------------------------------------

function scoreAccessControl(a: Answers): DimensionScore {
  const signals: string[] = [];
  const scores: number[] = [];

  // Q4.1 checklist
  const q41 = obj(a, "q4_1");
  if (q41.mfa) {
    const s = scoreOption(q41.mfa, ["everyone"], ["some"], ["optional"]);
    scores.push(s);
    if (s >= 66) signals.push("MFA enforced");
    else if (s === 0) signals.push("No MFA");
  }
  if (q41.sso) {
    const s = scoreOption(q41.sso, ["all apps"], ["some apps"], []);
    scores.push(s);
    if (s >= 66) signals.push("SSO in place");
  }
  if (q41.unique_accounts) {
    const s = scoreOption(q41.unique_accounts, ["yes"], ["mostly"], []);
    scores.push(s);
  }
  if (q41.access_levels) {
    const s = scoreOption(q41.access_levels, ["formal"], ["informal"], []);
    scores.push(s);
  }
  if (q41.access_reviews) {
    const s = scoreOption(q41.access_reviews, ["quarterly"], ["annually"], ["leaves"]);
    scores.push(s);
    if (s === 0) signals.push("No access reviews");
  }

  // Q4.2 employee lifecycle
  const offboarding = str(a, "q4_2_offboarding");
  if (offboarding) {
    const s = scoreOption(offboarding, ["same day"], ["within a week"], ["depends"]);
    scores.push(s);
    if (s >= 66) signals.push("Quick offboarding");
    else if (s === 0) signals.push("No offboarding process");
  }

  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { dimension: "access_control", label: "Access Control", score: Math.round(avg), weight: 0.25, signals };
}

function scoreDataProtection(a: Answers): DimensionScore {
  const signals: string[] = [];
  const scores: number[] = [];

  const q43 = obj(a, "q4_3");
  if (q43.encryption_rest) {
    const s = scoreOption(q43.encryption_rest, ["all"], ["some"], []);
    scores.push(s);
    if (s >= 66) signals.push("Encryption at rest");
  }
  if (q43.encryption_transit) {
    const s = scoreOption(q43.encryption_transit, ["yes"], ["mostly"], []);
    scores.push(s);
  }
  if (q43.data_classification) {
    const s = scoreOption(q43.data_classification, ["documented"], ["informal"], []);
    scores.push(s);
  }
  if (q43.data_deletion) {
    const s = scoreOption(q43.data_deletion, ["formal"], ["case by case"], []);
    scores.push(s);
  }

  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { dimension: "data_protection", label: "Data Protection", score: Math.round(avg), weight: 0.20, signals };
}

function scoreOperationalReadiness(a: Answers): DimensionScore {
  const signals: string[] = [];
  const scores: number[] = [];

  // Incident response Q4.4
  const plan = str(a, "q4_4_plan");
  if (plan) {
    const s = scoreOption(plan, ["tested"], ["documented"], ["informal"]);
    scores.push(s);
    if (s >= 66) signals.push("IR plan documented");
    else if (s === 0) signals.push("No IR plan");
  }

  // BC/DR Q4.5
  const backups = str(a, "q4_5_backups");
  if (backups) {
    const s = scoreOption(backups, ["daily"], ["weekly"], ["ad hoc"]);
    scores.push(s);
    if (s >= 66) signals.push("Regular backups");
  }
  const testedRestore = str(a, "q4_5_tested_restore");
  if (testedRestore) {
    scores.push(testedRestore.toLowerCase().includes("yes") ? 100 : 0);
  }
  const drPlan = str(a, "q4_5_dr_plan");
  if (drPlan) {
    const s = scoreOption(drPlan, ["yes"], ["informal"], []);
    scores.push(s);
  }

  // Logging Q4.9
  const logging = str(a, "q4_9_logging");
  if (logging) {
    const s = scoreOption(logging, ["yes"], ["partial"], []);
    scores.push(s);
  }
  const alerts = str(a, "q4_9_alerts");
  if (alerts) {
    const s = scoreOption(alerts, ["automated"], ["manual"], []);
    scores.push(s);
  }
  const retention = str(a, "q4_9_retention");
  if (retention) {
    const s = scoreOption(retention, ["1 year"], ["90 days"], ["30 days"]);
    scores.push(s);
    if (s === 0) signals.push("Insufficient log retention");
  }

  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { dimension: "operational_readiness", label: "Operational Readiness", score: Math.round(avg), weight: 0.20, signals };
}

function scoreChangeManagement(a: Answers): DimensionScore {
  const signals: string[] = [];
  const scores: number[] = [];

  // Q2.5 pipeline
  const pipeline = a["q2_5"] as Record<string, { status: string }> | undefined;
  if (pipeline) {
    const steps = Object.values(pipeline);
    const yesCount = steps.filter((s) => s.status === "Yes").length;
    const total = steps.length || 1;
    const pipelineScore = Math.round((yesCount / total) * 100);
    scores.push(pipelineScore);
    if (pipelineScore >= 80) signals.push("Strong CI/CD pipeline");
    else if (pipelineScore < 40) signals.push("Weak deployment controls");
  }

  // Q4.7
  const approval = str(a, "q4_7_approval");
  if (approval) {
    const s = scoreOption(approval, ["formal"], ["code review"], ["informal"]);
    scores.push(s);
  }
  const auditTrail = str(a, "q4_7_audit_trail");
  if (auditTrail) {
    const s = scoreOption(auditTrail, ["ci/cd"], ["manually"], []);
    scores.push(s);
  }

  // Q4.6 vuln management
  const scanning = str(a, "q4_6_scanning");
  if (scanning) {
    const s = scoreOption(scanning, ["automated"], ["occasionally"], []);
    scores.push(s);
  }
  const patchSpeed = str(a, "q4_6_patch_speed");
  if (patchSpeed) {
    const s = scoreOption(patchSpeed, ["24"], ["week"], ["30 days"]);
    scores.push(s);
  }

  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { dimension: "change_management", label: "Change Management", score: Math.round(avg), weight: 0.15, signals };
}

function scoreDocumentation(a: Answers): DimensionScore {
  const signals: string[] = [];
  const scores: number[] = [];

  // Q6.1 document inventory
  const docs = a["q6_1"] as Array<{ document: string; status: string }> | undefined;
  if (docs && docs.length > 0) {
    let haveCount = 0;
    let sortOfCount = 0;
    for (const doc of docs) {
      if (doc.status === "Have it") haveCount++;
      else if (doc.status === "Sort of") sortOfCount++;
    }
    const docScore = Math.round(((haveCount * 100 + sortOfCount * 50) / (docs.length * 100)) * 100);
    scores.push(docScore);
    if (haveCount >= 8) signals.push("Strong documentation");
    else if (haveCount <= 2) signals.push("Documentation gaps");
  }

  // Supplement with Stage 4 signals about formality
  const accessLevels = obj(a, "q4_1").access_levels;
  if (accessLevels) {
    scores.push(scoreOption(accessLevels, ["formal"], ["informal"], []));
  }
  const dataClass = obj(a, "q4_3").data_classification;
  if (dataClass) {
    scores.push(scoreOption(dataClass, ["documented"], ["informal"], []));
  }

  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { dimension: "documentation", label: "Documentation", score: Math.round(avg), weight: 0.20, signals };
}

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

function getTier(score: number): ReadinessResult["tier"] {
  if (score >= 80) return "audit-ready";
  if (score >= 60) return "almost-there";
  if (score >= 40) return "building-momentum";
  if (score >= 20) return "getting-started";
  return "not-ready";
}

const TIER_MESSAGES: Record<ReadinessResult["tier"], string> = {
  "audit-ready":
    "You're in great shape. We'll formalize what you already do and fill in any documentation gaps.",
  "almost-there":
    "You have strong foundations. We'll identify the specific gaps to close and generate policies that match your current practices.",
  "building-momentum":
    "You're earlier in the journey, but that's exactly why tooling helps. We'll generate docs that reflect where you are AND where you're headed.",
  "getting-started":
    "Let's be real — you have some work ahead. But having accurate documentation of your current state is Step 1, and that's exactly what we're building.",
  "not-ready":
    "You may want to address some foundational items before pursuing a formal audit. We'll give you a clear checklist.",
};

export function calculateReadiness(answers: Answers): ReadinessResult {
  const dimensions = [
    scoreAccessControl(answers),
    scoreDataProtection(answers),
    scoreOperationalReadiness(answers),
    scoreChangeManagement(answers),
    scoreDocumentation(answers),
  ];

  // Check if we have any signal at all
  const hasAnyData = dimensions.some((d) => d.signals.length > 0 || d.score > 0);
  if (!hasAnyData) {
    return {
      overall: 0,
      dimensions,
      tier: "not-ready",
      message: "Complete more of the assessment to see your readiness score.",
    };
  }

  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  );
  const tier = getTier(overall);

  return { overall, dimensions, tier, message: TIER_MESSAGES[tier] };
}
