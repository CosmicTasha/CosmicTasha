export interface QualificationResult {
  qualified: boolean;
  reason?: string;
  disqualifiers: string[];
  suggestions: string[];
}

export function checkQualification(answers: Record<string, unknown>, readinessScore: number | null): QualificationResult {
  const disqualifiers: string[] = [];
  const suggestions: string[] = [];

  // Hard disqualifiers
  // Score below 20
  if (readinessScore !== null && readinessScore < 20) {
    disqualifiers.push("Readiness score below minimum threshold");
  }

  // "Just exploring" persona with no timeline
  const persona = answers.q0_1 as string | undefined;
  const urgency = answers.q0_3 as string | undefined;
  if (persona === "Just Exploring" && urgency === "Being proactive — no immediate deadline") {
    // Soft — don't disqualify, but suggest
    suggestions.push("Consider completing the full assessment to understand your gaps before committing to SOC 2");
  }

  // No cloud infrastructure at all (very unusual)
  const cloudProviders = answers.q2_1 as string[] | undefined;
  if (cloudProviders && cloudProviders.length === 0) {
    suggestions.push("SOC 2 audits typically require documented infrastructure — ensure your tech stack is mapped");
  }

  // No identity provider
  const identity = answers.q2_3_identity as string[] | undefined;
  if (identity && identity.includes("None")) {
    suggestions.push("Set up a centralized identity provider (Okta, Google Workspace, etc.) before pursuing SOC 2");
  }

  // No source code management
  const sourceCode = answers.q2_3_source_code as string[] | undefined;
  if (sourceCode && sourceCode.length === 0) {
    suggestions.push("Implement source code management (GitHub, GitLab, etc.) for change management controls");
  }

  // No monitoring at all
  const monitoring = answers.q2_3_monitoring as string[] | undefined;
  if (monitoring && monitoring.includes("None")) {
    suggestions.push("Establish centralized monitoring before audit — this is a common auditor expectation");
  }

  // No security ownership
  const secOwner = answers.q3_1 as string | undefined;
  if (secOwner && secOwner.includes("Nobody")) {
    suggestions.push("Designate a security lead — auditors need a named contact for security decisions");
  }

  // Multiple P0 gaps from security posture
  const mfa = (answers.q4_1 as Record<string, string> | undefined)?.mfa;
  const irPlan = answers.q4_4_plan as string | undefined;
  const backups = answers.q4_5_backups as string | undefined;
  let p0Count = 0;
  if (mfa === "Not in place") p0Count++;
  if (irPlan === "No") p0Count++;
  if (backups === "No") p0Count++;
  if (p0Count >= 3) {
    disqualifiers.push("Multiple critical security controls missing (MFA, IR Plan, Backups)");
  }

  const qualified = disqualifiers.length === 0;
  const reason = disqualifiers.length > 0
    ? "Your organization may need to address some foundational items before pursuing a formal SOC 2 audit."
    : undefined;

  return { qualified, reason, disqualifiers, suggestions };
}
