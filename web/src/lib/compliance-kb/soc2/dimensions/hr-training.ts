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
  const relevantKeys = ["q4_9_security_training", "q4_9_training_frequency", "q4_9_onboarding_security"];

  for (const key of relevantKeys) {
    if (answers[key] !== undefined) answeredCount++;
  }

  // --- Security awareness training (45%) ---
  const training = answers["q4_9_security_training"];
  if (training !== undefined) {
    if (strIncludes(training, "annual") || strIncludes(training, "mandatory") || strIncludes(training, "yes")) {
      score += 0.45;
      strengths.push("Mandatory security awareness training in place");
    } else if (strIncludes(training, "optional") || strIncludes(training, "voluntary")) {
      score += 0.15;
      findings.push({
        gap: "Security training is optional, not mandatory",
        severity: "P2",
        tsc: "CC1.4",
        remediation: "Make security awareness training mandatory for all employees with annual completion requirement",
        effort: "days",
      });
    } else if (strEquals(training, "No") || strIncludes(training, "none")) {
      findings.push({
        gap: "No security awareness training program",
        severity: "P1",
        tsc: "CC1.4",
        remediation: "Implement an annual security awareness training program covering phishing, data handling, and incident reporting",
        effort: "weeks",
      });
    }
  }

  // --- Training frequency (30%) ---
  const frequency = answers["q4_9_training_frequency"];
  if (frequency !== undefined) {
    if (strIncludes(frequency, "annual") || strIncludes(frequency, "quarterly")) {
      score += 0.30;
      strengths.push("Regular training cadence established");
    } else if (strIncludes(frequency, "onboarding only") || strIncludes(frequency, "once")) {
      score += 0.10;
      findings.push({
        gap: "Security training only occurs at onboarding, not on a recurring basis",
        severity: "P2",
        tsc: "CC1.4",
        remediation: "Establish at minimum annual recurring security training for all personnel",
        effort: "days",
      });
    } else if (strIncludes(frequency, "never") || strIncludes(frequency, "none")) {
      findings.push({
        gap: "No defined security training schedule",
        severity: "P1",
        tsc: "CC1.4",
        remediation: "Define and enforce a recurring security training calendar",
        effort: "days",
      });
    }
  }

  // --- Onboarding security component (25%) ---
  const onboarding = answers["q4_9_onboarding_security"];
  if (onboarding !== undefined) {
    if (strIncludes(onboarding, "yes") || strIncludes(onboarding, "included")) {
      score += 0.25;
      strengths.push("Security training included in employee onboarding");
    } else if (strIncludes(onboarding, "informal") || strIncludes(onboarding, "sometimes")) {
      score += 0.10;
      findings.push({
        gap: "Security training not consistently part of onboarding",
        severity: "P3",
        tsc: "CC1.4",
        remediation: "Add formal security training module to employee onboarding checklist",
        effort: "hours",
      });
    } else if (strEquals(onboarding, "No") || strIncludes(onboarding, "none")) {
      findings.push({
        gap: "No security component in employee onboarding",
        severity: "P2",
        tsc: "CC1.4",
        remediation: "Include security policy acknowledgment and training in new hire onboarding process",
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

export const hrTraining: Dimension = {
  id: "hr_training",
  name: "HR & Training (CC1.4)",
  tsc: ["CC1.4"],
  weight: 0.10,
  evaluate,
};
