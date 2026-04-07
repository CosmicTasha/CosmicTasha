import type { Dimension, DimensionResult, Finding, IntakeAnswers } from "../../types";

function isNoneArray(val: unknown): boolean {
  return Array.isArray(val) && val.length === 1 && val[0] === "None";
}

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
  const relevantKeys = [
    "q4_7_approval",
    "q4_7_audit_trail",
    "q4_6_scanning",
    "q4_6_patch_speed",
    "q2_3_cicd",
  ];

  for (const key of relevantKeys) {
    if (answers[key] !== undefined) answeredCount++;
  }

  // --- Change approval process (25%) ---
  const approval = answers["q4_7_approval"];
  if (approval !== undefined) {
    if (strIncludes(approval, "formal")) {
      score += 0.25;
      strengths.push("Formal change approval process in place");
    } else if (strIncludes(approval, "code review")) {
      score += 0.15;
      findings.push({
        gap: "Change approval relies solely on code review without formal approval process",
        severity: "P2",
        tsc: "CC8.1",
        remediation: "Add a formal change approval step beyond code review for production deployments",
        effort: "days",
      });
    } else if (strIncludes(approval, "directly")) {
      findings.push({
        gap: "Changes deployed directly to production without approval",
        severity: "P1",
        tsc: "CC8.1",
        remediation: "Implement a change approval workflow requiring sign-off before production deployment",
        effort: "days",
      });
    }
  }

  // --- Audit trail (20%) ---
  const auditTrail = answers["q4_7_audit_trail"];
  if (auditTrail !== undefined) {
    if (strIncludes(auditTrail, "ci/cd")) {
      score += 0.20;
      strengths.push("Automated change audit trail via CI/CD");
    } else if (strIncludes(auditTrail, "manually")) {
      score += 0.10;
      findings.push({
        gap: "Change audit trail maintained manually",
        severity: "P2",
        tsc: "CC8.1",
        remediation: "Automate change tracking through CI/CD pipeline with deployment logs",
        effort: "days",
      });
    } else {
      findings.push({
        gap: "No audit trail for changes to production systems",
        severity: "P1",
        tsc: "CC8.1",
        remediation: "Implement automated deployment logging that captures who, what, when for every change",
        effort: "weeks",
      });
    }
  }

  // --- Vulnerability scanning (20%) ---
  const scanning = answers["q4_6_scanning"];
  if (scanning !== undefined) {
    if (strIncludes(scanning, "automated") || strEquals(scanning, "Yes")) {
      score += 0.20;
      strengths.push("Automated vulnerability scanning in place");
    } else if (strIncludes(scanning, "occasionally")) {
      score += 0.10;
      findings.push({
        gap: "Vulnerability scanning performed only occasionally",
        severity: "P2",
        tsc: "CC8.1",
        remediation: "Schedule automated vulnerability scans on a regular cadence (weekly minimum)",
        effort: "days",
      });
    } else if (strEquals(scanning, "No")) {
      findings.push({
        gap: "No vulnerability scanning performed",
        severity: "P1",
        tsc: "CC8.1",
        remediation: "Implement automated vulnerability scanning (Snyk, Dependabot, Trivy)",
        effort: "days",
      });
    }
  }

  // --- Patch management (20%) ---
  const patchSpeed = answers["q4_6_patch_speed"];
  if (patchSpeed !== undefined) {
    if (strIncludes(patchSpeed, "24") || strIncludes(patchSpeed, "48")) {
      score += 0.20;
      strengths.push("Critical patches applied within 24-48 hours");
    } else if (strIncludes(patchSpeed, "week")) {
      score += 0.10;
      findings.push({
        gap: "Critical patches take up to a week to apply",
        severity: "P2",
        tsc: "CC8.1",
        remediation: "Reduce critical patch SLA to 48 hours or less",
        effort: "days",
      });
    } else if (strIncludes(patchSpeed, "get to it") || strIncludes(patchSpeed, "don't track")) {
      findings.push({
        gap: "No defined patch management timeline",
        severity: "P1",
        tsc: "CC8.1",
        remediation: "Define patch SLAs: critical within 48h, high within 7 days, medium within 30 days",
        effort: "days",
      });
    }
  }

  // --- CI/CD pipeline existence (15%) ---
  const cicd = answers["q2_3_cicd"];
  if (cicd !== undefined) {
    if (isNoneArray(cicd)) {
      findings.push({
        gap: "No CI/CD pipeline in place",
        severity: "P2",
        tsc: "CC8.1",
        remediation: "Implement a CI/CD pipeline with automated build, test, and deployment stages",
        effort: "weeks",
      });
    } else if (Array.isArray(cicd) && cicd.length > 0) {
      score += 0.15;
      strengths.push("CI/CD pipeline established");
    }
  }

  return {
    score: Math.min(score, 1.0),
    findings,
    strengths,
    confidence: answeredCount / relevantKeys.length,
  };
}

export const changeManagement: Dimension = {
  id: "change_management",
  name: "Change Management (CC8.1)",
  tsc: ["CC8.1"],
  weight: 0.10,
  evaluate,
};
