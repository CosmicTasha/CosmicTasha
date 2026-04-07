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
  const relevantKeys = ["q2_3_monitoring", "q2_5", "q4_4_plan", "q4_9_logging", "q4_9_retention"];

  for (const key of relevantKeys) {
    if (answers[key] !== undefined) answeredCount++;
  }

  // --- Monitoring (25%) ---
  const monitoring = answers["q2_3_monitoring"];
  if (monitoring !== undefined) {
    if (isNoneArray(monitoring)) {
      findings.push({
        gap: "No centralized monitoring in place",
        severity: "P1",
        tsc: "CC7.2",
        remediation: "Deploy centralized monitoring (Datadog, Grafana, CloudWatch) for infrastructure and applications",
        effort: "weeks",
      });
    } else if (Array.isArray(monitoring) && monitoring.length > 0) {
      score += 0.25;
      strengths.push("Centralized monitoring deployed");
    }
  }

  // --- CI/CD pipeline (25%) ---
  const q2_5 = answers["q2_5"];
  if (q2_5 !== undefined) {
    if (q2_5 && typeof q2_5 === "object" && !Array.isArray(q2_5)) {
      const obj = q2_5 as Record<string, unknown>;
      const codeReview = strEquals(obj["Code Review"], "Yes");
      const autoTests = strEquals(obj["Automated Tests"], "Yes");

      if (codeReview && autoTests) {
        score += 0.25;
        strengths.push("Code review and automated tests in CI/CD pipeline");
      } else if (codeReview || autoTests) {
        score += 0.12;
        findings.push({
          gap: "CI/CD pipeline missing either code review or automated tests",
          severity: "P2",
          tsc: "CC7.1",
          remediation: "Add both code review requirements and automated test gates to deployment pipeline",
          effort: "days",
        });
      } else {
        findings.push({
          gap: "CI/CD pipeline lacks code review and automated testing",
          severity: "P1",
          tsc: "CC7.1",
          remediation: "Implement mandatory code reviews and automated test suites in the deployment pipeline",
          effort: "weeks",
        });
      }
    }
  }

  // --- Incident response plan (20%) ---
  const irPlan = answers["q4_4_plan"];
  if (irPlan !== undefined) {
    if (strIncludes(irPlan, "tested")) {
      score += 0.20;
      strengths.push("Incident response plan documented and tested");
    } else if (strIncludes(irPlan, "documented")) {
      score += 0.12;
      findings.push({
        gap: "Incident response plan exists but has not been tested",
        severity: "P2",
        tsc: "CC7.3",
        remediation: "Conduct a tabletop exercise or simulation to test the IR plan",
        effort: "days",
      });
    } else if (strEquals(irPlan, "No")) {
      findings.push({
        gap: "No incident response plan in place",
        severity: "P0",
        tsc: "CC7.3",
        remediation: "Create and document an incident response plan with roles, escalation paths, and communication templates",
        effort: "weeks",
      });
    }
  }

  // --- Centralized logging (15%) ---
  const logging = answers["q4_9_logging"];
  if (logging !== undefined) {
    if (strIncludes(logging, "yes")) {
      score += 0.15;
      strengths.push("Centralized logging in place");
    } else if (strIncludes(logging, "partial")) {
      score += 0.08;
      findings.push({
        gap: "Logging is only partially centralized",
        severity: "P2",
        tsc: "CC7.2",
        remediation: "Consolidate all application and infrastructure logs into a centralized platform",
        effort: "days",
      });
    } else if (strEquals(logging, "No")) {
      findings.push({
        gap: "No centralized logging system",
        severity: "P1",
        tsc: "CC7.2",
        remediation: "Implement centralized log aggregation (ELK, Splunk, Datadog Logs)",
        effort: "weeks",
      });
    }
  }

  // --- Log retention (15%) ---
  const retention = answers["q4_9_retention"];
  if (retention !== undefined) {
    if (strIncludes(retention, "1 year") || strIncludes(retention, "12 month")) {
      score += 0.15;
      strengths.push("Log retention meets 1-year compliance requirement");
    } else if (strIncludes(retention, "90 day") || strIncludes(retention, "6 month")) {
      score += 0.08;
      findings.push({
        gap: "Log retention period may not meet audit requirements (1 year recommended)",
        severity: "P2",
        tsc: "CC7.2",
        remediation: "Extend log retention to at least 1 year for audit trail completeness",
        effort: "days",
      });
    } else if (strIncludes(retention, "don't") || strIncludes(retention, "no retention")) {
      findings.push({
        gap: "No log retention policy or insufficient retention",
        severity: "P1",
        tsc: "CC7.2",
        remediation: "Define a log retention policy with minimum 1-year retention for security-relevant logs",
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

export const systemOperations: Dimension = {
  id: "system_operations",
  name: "System Operations (CC7.1-7.4)",
  tsc: ["CC7.1", "CC7.2", "CC7.3", "CC7.4"],
  weight: 0.15,
  evaluate,
};
