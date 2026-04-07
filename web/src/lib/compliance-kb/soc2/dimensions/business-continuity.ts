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
  const relevantKeys = ["q4_5_dr_plan", "q4_5_backups", "q4_5_tested_restore", "q6_1_bcp"];

  for (const key of relevantKeys) {
    if (answers[key] !== undefined) answeredCount++;
  }

  // --- Disaster recovery plan (30%) ---
  const drPlan = answers["q4_5_dr_plan"];
  if (drPlan !== undefined) {
    if (strIncludes(drPlan, "yes") || strIncludes(drPlan, "documented")) {
      score += 0.30;
      strengths.push("Documented disaster recovery plan in place");
    } else if (strIncludes(drPlan, "informal")) {
      score += 0.12;
      findings.push({
        gap: "Disaster recovery plan is informal and not documented",
        severity: "P2",
        tsc: "A1.2",
        remediation: "Document the DR plan with RTOs, RPOs, roles, and recovery procedures",
        effort: "weeks",
      });
    } else if (strEquals(drPlan, "No")) {
      findings.push({
        gap: "No disaster recovery plan exists",
        severity: "P1",
        tsc: "A1.2",
        remediation: "Create a disaster recovery plan defining recovery objectives, procedures, and responsible parties",
        effort: "weeks",
      });
    }
  }

  // --- Regular backups (30%) ---
  const backups = answers["q4_5_backups"];
  if (backups !== undefined) {
    if (strIncludes(backups, "daily")) {
      score += 0.30;
      strengths.push("Daily backups configured");
    } else if (strIncludes(backups, "weekly")) {
      score += 0.18;
      findings.push({
        gap: "Backups only performed weekly (daily recommended for critical data)",
        severity: "P2",
        tsc: "A1.2",
        remediation: "Increase backup frequency to daily for databases and critical data stores",
        effort: "days",
      });
    } else if (strIncludes(backups, "ad hoc")) {
      score += 0.08;
      findings.push({
        gap: "Backups performed ad-hoc without schedule",
        severity: "P1",
        tsc: "A1.2",
        remediation: "Implement automated daily backups with monitoring for completion and integrity",
        effort: "days",
      });
    } else if (strEquals(backups, "No")) {
      findings.push({
        gap: "No regular backup process in place",
        severity: "P0",
        tsc: "A1.2",
        remediation: "Implement automated backups immediately for all production data",
        effort: "days",
      });
    }
  }

  // --- Tested restore (25%) ---
  const testedRestore = answers["q4_5_tested_restore"];
  if (testedRestore !== undefined) {
    if (strIncludes(testedRestore, "yes") || strIncludes(testedRestore, "regularly")) {
      score += 0.25;
      strengths.push("Backup restore process tested and verified");
    } else if (strIncludes(testedRestore, "once") || strIncludes(testedRestore, "long ago")) {
      score += 0.10;
      findings.push({
        gap: "Backup restore not tested recently",
        severity: "P2",
        tsc: "A1.3",
        remediation: "Perform a backup restore test at least annually and document results",
        effort: "hours",
      });
    } else if (strEquals(testedRestore, "No")) {
      findings.push({
        gap: "Backup restore process has never been tested",
        severity: "P1",
        tsc: "A1.3",
        remediation: "Conduct a full backup restore test to verify data integrity and recovery time",
        effort: "hours",
      });
    }
  }

  // --- BCP documentation (15%, from q6_1 subset) ---
  const bcp = answers["q6_1_bcp"];
  if (bcp !== undefined) {
    if (strIncludes(bcp, "have it") || strIncludes(bcp, "yes")) {
      score += 0.15;
      strengths.push("Business continuity plan documented");
    } else if (strIncludes(bcp, "sort of") || strIncludes(bcp, "draft")) {
      score += 0.06;
      findings.push({
        gap: "Business continuity plan is incomplete or in draft",
        severity: "P2",
        tsc: "A1.2",
        remediation: "Finalize and approve the business continuity plan",
        effort: "days",
      });
    } else if (strEquals(bcp, "Don't have it") || strIncludes(bcp, "no")) {
      findings.push({
        gap: "No business continuity plan exists",
        severity: "P1",
        tsc: "A1.2",
        remediation: "Create a business continuity plan covering critical services, communication, and failover",
        effort: "weeks",
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

export const businessContinuity: Dimension = {
  id: "business_continuity",
  name: "Business Continuity (A1.2-A1.3)",
  tsc: ["A1.2", "A1.3"],
  weight: 0.10,
  evaluate,
};
