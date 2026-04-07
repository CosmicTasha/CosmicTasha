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
  const relevantKeys = ["q4_8_vendor_reviews", "q4_8_vendor_inventory", "q4_8_soc2_requirement"];

  for (const key of relevantKeys) {
    if (answers[key] !== undefined) answeredCount++;
  }

  // --- Vendor security reviews (40%) ---
  const vendorReviews = answers["q4_8_vendor_reviews"];
  if (vendorReviews !== undefined) {
    if (strIncludes(vendorReviews, "annual") || strIncludes(vendorReviews, "formal")) {
      score += 0.40;
      strengths.push("Formal vendor security reviews performed annually");
    } else if (strIncludes(vendorReviews, "onboarding") || strIncludes(vendorReviews, "initial")) {
      score += 0.20;
      findings.push({
        gap: "Vendor security reviews only performed at onboarding, not recurring",
        severity: "P2",
        tsc: "CC9.2",
        remediation: "Implement annual vendor security reviews for all critical vendors",
        effort: "days",
      });
    } else if (strEquals(vendorReviews, "No") || strIncludes(vendorReviews, "none") || strIncludes(vendorReviews, "don't")) {
      findings.push({
        gap: "No vendor security review process in place",
        severity: "P1",
        tsc: "CC9.2",
        remediation: "Establish a vendor risk assessment process including SOC 2 report reviews and security questionnaires",
        effort: "weeks",
      });
    }
  }

  // --- Vendor inventory (35%) ---
  const vendorInventory = answers["q4_8_vendor_inventory"];
  if (vendorInventory !== undefined) {
    if (strIncludes(vendorInventory, "complete") || strIncludes(vendorInventory, "yes")) {
      score += 0.35;
      strengths.push("Complete vendor inventory maintained");
    } else if (strIncludes(vendorInventory, "partial")) {
      score += 0.15;
      findings.push({
        gap: "Vendor inventory is incomplete",
        severity: "P2",
        tsc: "CC9.2",
        remediation: "Create a comprehensive vendor inventory including data access, criticality, and contract terms",
        effort: "days",
      });
    } else if (strEquals(vendorInventory, "No") || strIncludes(vendorInventory, "none")) {
      findings.push({
        gap: "No vendor inventory maintained",
        severity: "P1",
        tsc: "CC9.2",
        remediation: "Build a vendor inventory listing all third parties with access to systems or data",
        effort: "days",
      });
    }
  }

  // --- SOC 2 requirement for vendors (25%) ---
  const soc2Req = answers["q4_8_soc2_requirement"];
  if (soc2Req !== undefined) {
    if (strIncludes(soc2Req, "required") || strIncludes(soc2Req, "yes")) {
      score += 0.25;
      strengths.push("SOC 2 reports required from critical vendors");
    } else if (strIncludes(soc2Req, "preferred") || strIncludes(soc2Req, "some")) {
      score += 0.10;
      findings.push({
        gap: "SOC 2 reports not consistently required from vendors",
        severity: "P3",
        tsc: "CC9.2",
        remediation: "Require SOC 2 Type II reports from all vendors handling customer data",
        effort: "days",
      });
    } else if (strEquals(soc2Req, "No") || strIncludes(soc2Req, "none")) {
      findings.push({
        gap: "No SOC 2 report requirements for third-party vendors",
        severity: "P2",
        tsc: "CC9.2",
        remediation: "Add SOC 2 report requirements to vendor onboarding and contract renewal process",
        effort: "days",
      });
    }
  }

  return {
    score: Math.min(score, 1.0),
    findings,
    strengths,
    confidence: answeredCount / relevantKeys.length,
  };
}

export const vendorManagement: Dimension = {
  id: "vendor_management",
  name: "Vendor Management (CC9.2)",
  tsc: ["CC9.2"],
  weight: 0.10,
  evaluate,
};
