import type { Dimension, DimensionResult, Finding, IntakeAnswers } from "../../types";

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

function arrIncludes(val: unknown, needle: string): boolean {
  return Array.isArray(val) && val.includes(needle);
}

function evaluate(answers: IntakeAnswers): DimensionResult {
  let score = 0;
  const findings: Finding[] = [];
  const strengths: string[] = [];
  let answeredCount = 0;
  const relevantKeys = ["q4_3", "q3_4", "q3_4_access"];

  for (const key of relevantKeys) {
    if (answers[key] !== undefined) answeredCount++;
  }

  // --- Encryption at rest (30%) ---
  const encRest = nested(answers, "q4_3", "encryption_rest");
  if (encRest !== undefined) {
    if (strIncludes(encRest, "all")) {
      score += 0.30;
      strengths.push("All data encrypted at rest");
    } else if (strIncludes(encRest, "some")) {
      score += 0.15;
      findings.push({
        gap: "Only some data is encrypted at rest",
        severity: "P1",
        tsc: "CC6.1",
        remediation: "Extend encryption at rest to all data stores containing sensitive or customer data",
        effort: "weeks",
      });
    } else if (strEquals(encRest, "No")) {
      findings.push({
        gap: "No encryption at rest for stored data",
        severity: "P1",
        tsc: "CC6.1",
        remediation: "Enable encryption at rest on all databases and storage volumes",
        effort: "weeks",
      });
    }
  }

  // --- Encryption in transit (20%) ---
  const encTransit = nested(answers, "q4_3", "encryption_transit");
  if (encTransit !== undefined) {
    if (strIncludes(encTransit, "yes") || strIncludes(encTransit, "all")) {
      score += 0.20;
      strengths.push("All data encrypted in transit (TLS)");
    } else if (strIncludes(encTransit, "mostly")) {
      score += 0.12;
      findings.push({
        gap: "Not all data in transit is encrypted",
        severity: "P1",
        tsc: "CC6.1",
        remediation: "Enforce TLS for all internal and external communications",
        effort: "days",
      });
    } else {
      findings.push({
        gap: "Data in transit is not encrypted",
        severity: "P0",
        tsc: "CC6.1",
        remediation: "Implement TLS 1.2+ for all network communications",
        effort: "days",
      });
    }
  }

  // --- Data classification (25%) ---
  const dataClass = nested(answers, "q4_3", "data_classification");
  if (dataClass !== undefined) {
    if (strIncludes(dataClass, "documented")) {
      score += 0.25;
      strengths.push("Documented data classification policy in place");
    } else if (strIncludes(dataClass, "informal")) {
      score += 0.10;
      findings.push({
        gap: "Data classification is informal and not documented",
        severity: "P2",
        tsc: "C1.1",
        remediation: "Create a formal data classification policy (Public, Internal, Confidential, Restricted)",
        effort: "days",
      });
    } else if (strEquals(dataClass, "No")) {
      findings.push({
        gap: "No data classification policy exists",
        severity: "P2",
        tsc: "C1.1",
        remediation: "Develop and publish a data classification scheme with handling requirements per level",
        effort: "days",
      });
    }
  }

  // --- Data deletion (10%) ---
  const dataDeletion = nested(answers, "q4_3", "data_deletion");
  if (dataDeletion !== undefined) {
    if (strIncludes(dataDeletion, "formal")) {
      score += 0.10;
      strengths.push("Formal data deletion process defined");
    } else if (strIncludes(dataDeletion, "case by case")) {
      score += 0.05;
      findings.push({
        gap: "Data deletion handled ad-hoc without formal process",
        severity: "P2",
        tsc: "C1.2",
        remediation: "Establish a formal data retention and deletion policy with defined timelines",
        effort: "days",
      });
    }
  }

  // --- Contractor access to customer data (15%) ---
  const hasContractors = strEquals(answers["q3_4"] as string, "Yes");
  if (answers["q3_4"] !== undefined) {
    if (hasContractors && arrIncludes(answers["q3_4_access"], "Customer data")) {
      findings.push({
        gap: "Contractors have access to customer data without documented controls",
        severity: "P2",
        tsc: "C1.1",
        remediation: "Implement contractor access agreements, background checks, and monitoring for customer data access",
        effort: "weeks",
      });
    } else if (hasContractors && !arrIncludes(answers["q3_4_access"], "Customer data")) {
      score += 0.15;
      strengths.push("Contractor access does not include customer data");
    } else if (!hasContractors) {
      score += 0.15;
      strengths.push("No contractor access to manage");
    }
  }

  return {
    score: Math.min(score, 1.0),
    findings,
    strengths,
    confidence: answeredCount / relevantKeys.length,
  };
}

export const dataProtection: Dimension = {
  id: "data_protection",
  name: "Data Protection (CC6.1, C1.1-1.2)",
  tsc: ["CC6.1", "C1.1", "C1.2"],
  weight: 0.15,
  evaluate,
};
