import type { Dimension, DimensionResult, Finding, IntakeAnswers } from "../../types";

function strEquals(val: unknown, expected: string): boolean {
  return typeof val === "string" && val === expected;
}

function strIncludes(val: unknown, needle: string): boolean {
  return typeof val === "string" && val.toLowerCase().includes(needle.toLowerCase());
}

function evaluate(answers: IntakeAnswers): DimensionResult {
  let score = 0;
  const findings: Finding[] = [];
  const strengths: string[] = [];
  let answeredCount = 0;
  const relevantKeys = ["q4_7_risk_methodology", "q4_7_risk_register", "q3_1"];

  for (const key of relevantKeys) {
    if (answers[key] !== undefined) answeredCount++;
  }

  // --- Risk methodology (40%) ---
  const methodology = answers["q4_7_risk_methodology"];
  if (methodology !== undefined) {
    if (strIncludes(methodology, "formal") || strIncludes(methodology, "framework")) {
      score += 0.40;
      strengths.push("Formal risk assessment methodology in place");
    } else if (strIncludes(methodology, "informal") || strIncludes(methodology, "ad hoc")) {
      score += 0.15;
      findings.push({
        gap: "Risk assessments performed ad-hoc without formal methodology",
        severity: "P2",
        tsc: "CC3.2",
        remediation: "Adopt a formal risk assessment framework (NIST RMF, ISO 27005, or FAIR)",
        effort: "weeks",
      });
    } else if (strEquals(methodology, "No") || strIncludes(methodology, "none")) {
      findings.push({
        gap: "No risk assessment methodology in place",
        severity: "P1",
        tsc: "CC3.2",
        remediation: "Implement a risk assessment process that identifies, analyzes, and prioritizes risks annually",
        effort: "weeks",
      });
    }
  }

  // --- Risk register (35%) ---
  const riskRegister = answers["q4_7_risk_register"];
  if (riskRegister !== undefined) {
    if (strIncludes(riskRegister, "maintained") || strIncludes(riskRegister, "yes")) {
      score += 0.35;
      strengths.push("Risk register actively maintained");
    } else if (strIncludes(riskRegister, "outdated") || strIncludes(riskRegister, "stale")) {
      score += 0.12;
      findings.push({
        gap: "Risk register exists but is not regularly updated",
        severity: "P2",
        tsc: "CC3.3",
        remediation: "Review and update the risk register at least quarterly",
        effort: "days",
      });
    } else if (strEquals(riskRegister, "No") || strIncludes(riskRegister, "none")) {
      findings.push({
        gap: "No risk register maintained",
        severity: "P1",
        tsc: "CC3.3",
        remediation: "Create a risk register documenting identified risks, owners, mitigations, and review dates",
        effort: "days",
      });
    }
  }

  // --- Security ownership (25%, from q3_1) ---
  const secOwner = answers["q3_1"];
  if (secOwner !== undefined) {
    if (strEquals(secOwner, "Nobody has explicit security ownership")) {
      findings.push({
        gap: "No explicit security ownership or risk management accountability",
        severity: "P1",
        tsc: "CC3.1",
        remediation: "Assign a security owner or risk committee responsible for risk management",
        effort: "days",
      });
    } else if (typeof secOwner === "string" && secOwner.length > 0) {
      score += 0.25;
      strengths.push("Security ownership assigned");
    }
  }

  return {
    score: Math.min(score, 1.0),
    findings,
    strengths,
    confidence: answeredCount / relevantKeys.length,
  };
}

export const riskAssessment: Dimension = {
  id: "risk_assessment",
  name: "Risk Assessment (CC3.1-3.4)",
  tsc: ["CC3.1", "CC3.2", "CC3.3", "CC3.4"],
  weight: 0.10,
  evaluate,
};
