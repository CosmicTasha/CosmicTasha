import type { Dimension, DimensionResult, Finding, IntakeAnswers } from "../../types";

/* ------------------------------------------------------------------ */
/*  Helpers (mirror gap-detector patterns)                             */
/* ------------------------------------------------------------------ */

function nested(answers: IntakeAnswers, key: string, field: string): unknown {
  const obj = answers[key];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return (obj as Record<string, unknown>)[field] ?? undefined;
  }
  return undefined;
}

function strEquals(val: unknown, expected: string): boolean {
  return typeof val === "string" && val === expected;
}

function strIncludes(val: unknown, needle: string): boolean {
  return typeof val === "string" && val.toLowerCase().includes(needle.toLowerCase());
}

function isNoneArray(val: unknown): boolean {
  return Array.isArray(val) && val.length === 1 && val[0] === "None";
}

/* ------------------------------------------------------------------ */
/*  Evaluator                                                          */
/* ------------------------------------------------------------------ */

function evaluate(answers: IntakeAnswers): DimensionResult {
  let score = 0;
  const findings: Finding[] = [];
  const strengths: string[] = [];
  let answeredCount = 0;
  const relevantKeys = [
    "q4_1",          // MFA, SSO, RBAC, access reviews (nested)
    "q4_2_offboarding",
    "q2_3_identity",
    "q2_3_endpoint",
  ];

  for (const key of relevantKeys) {
    if (answers[key] !== undefined) answeredCount++;
  }

  // --- MFA (25% of dimension) ---
  const mfa = nested(answers, "q4_1", "mfa");
  if (mfa !== undefined) {
    if (strEquals(mfa, "Enforced for everyone")) {
      score += 0.25;
      strengths.push("MFA enforced for all users");
    } else if (strIncludes(mfa, "some") || strIncludes(mfa, "admin")) {
      score += 0.10;
      findings.push({
        gap: "MFA only enforced for some users, not all",
        severity: "P1",
        tsc: "CC6.1",
        remediation: "Extend MFA requirement to all user accounts",
        effort: "days",
      });
    } else if (strEquals(mfa, "Not in place")) {
      findings.push({
        gap: "Multi-factor authentication not enforced",
        severity: "P0",
        tsc: "CC6.1",
        remediation: "Enable MFA for all users via SSO provider or identity platform",
        effort: "days",
      });
    }
  }

  // --- SSO (20% of dimension) ---
  const sso = nested(answers, "q4_1", "sso");
  if (sso !== undefined) {
    if (strIncludes(sso, "all")) {
      score += 0.20;
      strengths.push("SSO deployed across all applications");
    } else if (strIncludes(sso, "some")) {
      score += 0.10;
      findings.push({
        gap: "SSO only covers some applications",
        severity: "P2",
        tsc: "CC6.1",
        remediation: "Extend SSO to all business-critical applications",
        effort: "weeks",
      });
    } else if (strEquals(sso, "No")) {
      findings.push({
        gap: "No single sign-on in place",
        severity: "P2",
        tsc: "CC6.1",
        remediation: "Implement SSO via an identity provider (Okta, Azure AD, Google Workspace)",
        effort: "weeks",
      });
    }
  }

  // --- RBAC / access levels (20% of dimension) ---
  const accessLevels = nested(answers, "q4_1", "access_levels");
  if (accessLevels !== undefined) {
    if (strIncludes(accessLevels, "formal")) {
      score += 0.20;
      strengths.push("Formal role-based access controls defined");
    } else if (strIncludes(accessLevels, "informal")) {
      score += 0.10;
      findings.push({
        gap: "Access levels defined informally without documentation",
        severity: "P2",
        tsc: "CC6.3",
        remediation: "Document a formal RBAC matrix mapping roles to permissions",
        effort: "days",
      });
    } else {
      findings.push({
        gap: "No defined access levels or role-based controls",
        severity: "P1",
        tsc: "CC6.3",
        remediation: "Implement role-based access controls with documented role definitions",
        effort: "weeks",
      });
    }
  }

  // --- Access reviews (20% of dimension) ---
  const accessReviews = nested(answers, "q4_1", "access_reviews");
  if (accessReviews !== undefined) {
    if (strIncludes(accessReviews, "quarterly")) {
      score += 0.20;
      strengths.push("Quarterly access reviews performed");
    } else if (strIncludes(accessReviews, "annually") || strIncludes(accessReviews, "leaves")) {
      score += 0.10;
      findings.push({
        gap: "Access reviews not performed regularly (quarterly recommended)",
        severity: "P1",
        tsc: "CC6.2",
        remediation: "Establish quarterly access review process with documented sign-off",
        effort: "days",
      });
    } else if (strEquals(accessReviews, "Never")) {
      findings.push({
        gap: "No periodic access reviews performed",
        severity: "P1",
        tsc: "CC6.2",
        remediation: "Implement quarterly user access reviews with documented evidence",
        effort: "days",
      });
    }
  }

  // --- Offboarding (15% of dimension) ---
  const offboarding = answers["q4_2_offboarding"];
  if (offboarding !== undefined) {
    if (strIncludes(offboarding, "same day")) {
      score += 0.15;
      strengths.push("Same-day offboarding process in place");
    } else if (strIncludes(offboarding, "within a week")) {
      score += 0.08;
      findings.push({
        gap: "Offboarding takes up to a week, leaving stale access",
        severity: "P2",
        tsc: "CC6.2",
        remediation: "Tighten offboarding SLA to same-day revocation of all access",
        effort: "days",
      });
    } else if (strEquals(offboarding, "No formal process")) {
      findings.push({
        gap: "No formal offboarding process for departing employees",
        severity: "P1",
        tsc: "CC6.2",
        remediation: "Create an offboarding checklist that revokes all access within 24 hours",
        effort: "days",
      });
    }
  }

  // --- Identity provider (bonus signal from stage 2) ---
  const identity = answers["q2_3_identity"];
  if (identity !== undefined) {
    if (isNoneArray(identity)) {
      findings.push({
        gap: "No centralized identity provider",
        severity: "P1",
        tsc: "CC6.1",
        remediation: "Deploy a centralized identity provider for authentication management",
        effort: "weeks",
      });
    } else if (Array.isArray(identity) && identity.length > 0) {
      strengths.push("Centralized identity provider in use");
    }
  }

  return {
    score: Math.min(score, 1.0),
    findings,
    strengths,
    confidence: answeredCount / relevantKeys.length,
  };
}

export const accessControl: Dimension = {
  id: "access_control",
  name: "Access Control (CC6.1-6.8)",
  tsc: ["CC6.1", "CC6.2", "CC6.3", "CC6.6", "CC6.7", "CC6.8"],
  weight: 0.20,
  evaluate,
};
