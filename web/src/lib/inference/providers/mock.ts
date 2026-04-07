import type { InferenceProvider, InferenceResult, InferenceOpts } from "../types";

/**
 * Generates contextual SOC 2 compliance prose based on prompt keywords.
 * Mirrors the mockProse patterns in src/lib/doc-gen/generator.ts but operates
 * on free-form prompts rather than structured TemplateSection objects.
 */
function generateMockProse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("incident response") || lower.includes("incident plan")) {
    return (
      "The organization maintains a documented Incident Response Plan (IRP) that is reviewed and tested at least annually. " +
      "The plan defines severity classifications (P0–P3), escalation paths, and post-incident review requirements. " +
      "All personnel with incident-response responsibilities receive role-specific training and participate in tabletop exercises."
    );
  }

  if (
    lower.includes("access control") ||
    lower.includes("access policy") ||
    lower.includes("least privilege")
  ) {
    return (
      "Access to production systems and sensitive data is governed by the principle of least privilege, with role-based access control (RBAC) enforced across all environments. " +
      "Multi-factor authentication (MFA) is required for all privileged accounts and remote access. " +
      "Access rights are reviewed quarterly, and all provisioning and de-provisioning actions are logged for audit purposes."
    );
  }

  if (
    lower.includes("system description") ||
    lower.includes("system overview") ||
    lower.includes("system boundary")
  ) {
    return (
      "The organization operates a cloud-hosted platform that processes, stores, and transmits customer data in accordance with its Trust Services Criteria commitments. " +
      "The system infrastructure is provisioned via infrastructure-as-code and hosted on managed cloud services with high-availability configurations. " +
      "System boundaries are documented and reviewed annually to reflect changes to the production environment."
    );
  }

  if (
    lower.includes("data protection") ||
    lower.includes("encryption") ||
    lower.includes("data security")
  ) {
    return (
      "All customer data is encrypted at rest using AES-256 and in transit using TLS 1.2 or higher. " +
      "Encryption key management is handled through the cloud provider's key management service, with automatic rotation policies in place. " +
      "A formal data classification policy defines handling, retention, and disposal requirements for each data sensitivity level."
    );
  }

  if (
    lower.includes("change management") ||
    lower.includes("change control") ||
    lower.includes("deployment")
  ) {
    return (
      "All changes to production systems follow a structured change management process requiring peer code review, automated testing, and manager approval prior to deployment. " +
      "An immutable audit trail records the author, reviewer, timestamp, and business justification for every change. " +
      "Emergency changes are subject to expedited approval and must be retroactively documented within 24 hours."
    );
  }

  if (
    lower.includes("risk assessment") ||
    lower.includes("risk management") ||
    lower.includes("risk register")
  ) {
    return (
      "The organization conducts a formal risk assessment at least annually and whenever significant changes occur to the environment, business model, or threat landscape. " +
      "Identified risks are documented in the risk register with assigned owners, likelihood and impact ratings, and mitigation plans. " +
      "Risk treatment decisions are reviewed by senior management and tracked to closure."
    );
  }

  if (
    lower.includes("vendor") ||
    lower.includes("third-party") ||
    lower.includes("subprocessor") ||
    lower.includes("supplier")
  ) {
    return (
      "Third-party vendors with access to customer data or critical systems undergo a formal security review prior to onboarding, including review of SOC 2 reports, penetration test results, and contractual data processing agreements. " +
      "Vendor relationships are reviewed annually to assess continued compliance with the organization's security requirements. " +
      "Critical subprocessors are listed in the organization's data processing addendum and customer-facing privacy documentation."
    );
  }

  // Default fallback — generic SOC 2 policy language
  return (
    "The organization maintains documented policies and procedures that are reviewed and approved by senior management on an annual basis. " +
    "Controls are implemented to support the applicable Trust Services Criteria and are monitored continuously for effectiveness. " +
    "Deviations from policy are tracked in the risk register and remediated according to the organization's risk tolerance thresholds."
  );
}

export class MockProvider implements InferenceProvider {
  name = "mock";

  async available(): Promise<boolean> {
    return true;
  }

  async generate(
    prompt: string,
    _system: string,
    _opts?: InferenceOpts
  ): Promise<InferenceResult> {
    const start = Date.now();
    const text = generateMockProse(prompt);
    return {
      text,
      model: "mockProse",
      provider: "mock",
      duration_ms: Date.now() - start,
    };
  }
}
