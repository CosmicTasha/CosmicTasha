/**
 * Gap Generator
 *
 * Generates gap objects from the readiness result when the intake context
 * doesn't already contain gaps. Maps low-scoring dimensions and their
 * signals to actionable gap items with severity and remediation hints.
 */

import type { ReadinessResult } from "./readiness";

export interface GeneratedGap {
  id: string;
  title: string;
  dimension: string;
  dimensionLabel: string;
  severity: "P0" | "P1" | "P2" | "P3";
  description: string;
  remediation: string;
}

// ---------------------------------------------------------------------------
// Signal-to-gap mappings
// ---------------------------------------------------------------------------

interface SignalMapping {
  pattern: string;
  title: string;
  description: string;
  remediation: string;
  baseSeverity: "P0" | "P1";
}

const SIGNAL_MAPPINGS: SignalMapping[] = [
  {
    pattern: "No MFA",
    title: "Multi-Factor Authentication Not Enforced",
    description:
      "Multi-factor authentication is not enforced across your organization. SOC 2 CC6.1 requires strong authentication controls for all system access.",
    remediation:
      "Enable MFA for all users across your identity provider. Start with privileged accounts and roll out org-wide within 30 days.",
    baseSeverity: "P0",
  },
  {
    pattern: "No access reviews",
    title: "No Regular Access Reviews",
    description:
      "Access rights are not periodically reviewed. SOC 2 CC6.2 requires regular access certification to ensure least privilege.",
    remediation:
      "Implement quarterly access reviews starting with admin and privileged accounts. Use your IdP's reporting to audit active accounts.",
    baseSeverity: "P1",
  },
  {
    pattern: "No offboarding process",
    title: "No Formal Offboarding Process",
    description:
      "There is no defined process for revoking access when employees leave. This creates risk of unauthorized access to production systems.",
    remediation:
      "Create an offboarding checklist tied to HR termination. Ensure access is revoked within 24 hours of departure.",
    baseSeverity: "P0",
  },
  {
    pattern: "No IR plan",
    title: "No Incident Response Plan",
    description:
      "No documented incident response plan exists. SOC 2 CC7.3-CC7.5 require a formal process for detecting, responding to, and recovering from security incidents.",
    remediation:
      "Draft an incident response plan covering roles, communication protocols, containment procedures, and post-incident review. Test with a tabletop exercise.",
    baseSeverity: "P0",
  },
  {
    pattern: "Insufficient log retention",
    title: "Log Retention Below SOC 2 Requirements",
    description:
      "Current log retention period does not meet the recommended minimum for SOC 2 compliance. Auditors typically expect at least 90 days, with 1 year preferred.",
    remediation:
      "Configure log retention to at least 90 days (1 year recommended). Ensure logs cover authentication events, admin actions, and data access.",
    baseSeverity: "P1",
  },
  {
    pattern: "Weak deployment controls",
    title: "Insufficient Change Management Controls",
    description:
      "The deployment pipeline lacks key controls such as code review, testing, or approval gates. SOC 2 CC8.1 requires controlled change management.",
    remediation:
      "Implement branch protection with required reviews, automated testing in CI, and deployment approval gates for production releases.",
    baseSeverity: "P1",
  },
  {
    pattern: "Documentation gaps",
    title: "Significant Documentation Gaps",
    description:
      "Core compliance policies and procedures are missing or informal. SOC 2 requires documented, board-approved policies across all trust service criteria.",
    remediation:
      "Prioritize creating your Information Security Policy, Access Control Policy, and Incident Response Plan. CosmicTasha will generate these for you.",
    baseSeverity: "P1",
  },
];

// ---------------------------------------------------------------------------
// Dimension-level fallback gaps (when no specific signals match)
// ---------------------------------------------------------------------------

interface DimensionFallback {
  dimension: string;
  title: string;
  description: string;
  remediation: string;
}

const DIMENSION_FALLBACKS: Record<string, DimensionFallback> = {
  access_control: {
    dimension: "access_control",
    title: "Access Control Maturity Needs Improvement",
    description:
      "Your access control practices score below the threshold for SOC 2 readiness. This includes authentication, authorization, and access lifecycle management.",
    remediation:
      "Review and strengthen MFA enforcement, implement role-based access controls, and establish regular access review cadences.",
  },
  data_protection: {
    dimension: "data_protection",
    title: "Data Protection Controls Insufficient",
    description:
      "Data protection measures including encryption, classification, and deletion procedures need strengthening to meet SOC 2 requirements.",
    remediation:
      "Ensure encryption at rest and in transit, establish a data classification framework, and document data retention and deletion procedures.",
  },
  operational_readiness: {
    dimension: "operational_readiness",
    title: "Operational Readiness Gaps Identified",
    description:
      "Incident response, business continuity, and monitoring capabilities are below the required threshold for audit readiness.",
    remediation:
      "Develop an incident response plan, implement centralized logging with alerts, and create a business continuity / disaster recovery plan.",
  },
  change_management: {
    dimension: "change_management",
    title: "Change Management Process Immature",
    description:
      "The software development and deployment lifecycle lacks formal controls for change approval, testing, and audit trails.",
    remediation:
      "Formalize your change management process with approval workflows, automated testing, and deployment audit trails via CI/CD.",
  },
  documentation: {
    dimension: "documentation",
    title: "Policy Documentation Incomplete",
    description:
      "Many required compliance policies are missing or exist only informally. SOC 2 auditors require formally documented and approved policies.",
    remediation:
      "Use CosmicTasha to generate the core policy set, then have leadership review and approve each document.",
  },
};

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateGapsFromResult(
  result: ReadinessResult,
  _answers: Record<string, unknown>
): GeneratedGap[] {
  const gaps: GeneratedGap[] = [];
  let idCounter = 0;

  for (const dim of result.dimensions) {
    if (dim.score >= 60) continue;

    const isCritical = dim.score < 30;
    let matchedSignal = false;

    // Check each signal against known mappings
    for (const signal of dim.signals) {
      const mapping = SIGNAL_MAPPINGS.find((m) =>
        signal.toLowerCase().includes(m.pattern.toLowerCase())
      );

      if (mapping) {
        matchedSignal = true;
        // Escalate severity if dimension is critically low
        const severity: GeneratedGap["severity"] =
          isCritical && mapping.baseSeverity === "P1"
            ? "P0"
            : mapping.baseSeverity;

        gaps.push({
          id: `gap-${idCounter++}`,
          title: mapping.title,
          dimension: dim.dimension,
          dimensionLabel: dim.label,
          severity,
          description: mapping.description,
          remediation: mapping.remediation,
        });
      }
    }

    // If no signals matched, use the dimension-level fallback
    if (!matchedSignal) {
      const fallback = DIMENSION_FALLBACKS[dim.dimension];
      if (fallback) {
        gaps.push({
          id: `gap-${idCounter++}`,
          title: fallback.title,
          dimension: dim.dimension,
          dimensionLabel: dim.label,
          severity: isCritical ? "P0" : dim.score < 45 ? "P1" : "P2",
          description: fallback.description,
          remediation: fallback.remediation,
        });
      }
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = {
    P0: 0,
    P1: 1,
    P2: 2,
    P3: 3,
  };
  gaps.sort(
    (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );

  return gaps;
}
