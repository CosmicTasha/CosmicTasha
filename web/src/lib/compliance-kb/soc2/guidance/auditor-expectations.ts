/**
 * What auditors test for each SOC 2 document type.
 * Keys correspond to ComplianceTemplate IDs.
 */
export const auditorExpectations: Record<string, string> = {
  "system-description":
    "Auditors read this first and test everything against it. The description must be accurate — aspirational language triggers findings. Common test: compare described infrastructure to actual evidence. Auditors will request architecture diagrams, cloud configuration screenshots, and subprocessor agreements to verify every claim.",

  "information-security-policy":
    "Auditors verify the ISP covers all 5 trust service categories. Most common finding: policy says 'quarterly access reviews' but no evidence of reviews happening. Auditors will ask for the policy approval date, revision history, and evidence that all employees attested to reading the policy within the audit period.",

  "incident-response-plan":
    "Auditors test IR by reviewing incident logs against the documented plan. They look for: defined roles, escalation procedures, communication templates, and post-incident review records. A plan with no incident history in a growing SaaS company raises a red flag — auditors expect tabletop exercises at minimum.",

  "access-control-policy":
    "Auditors pull a sample of terminated employees and verify their access was removed on schedule. They also check for shared accounts, dormant accounts inactive >90 days, and whether privileged access (admin, root, production) requires MFA. Expect auditors to request IDP screenshots, SSH key registries, and IAM policy exports.",

  "risk-assessment":
    "Auditors verify the risk register was reviewed within the audit period and that identified risks have documented owners and treatment decisions. Common test: trace a high-risk item from identification through remediation or acceptance. Risk registers that have not changed in 12 months suggest the process is not active.",

  "vendor-management-policy":
    "Auditors check that all subprocessors with access to customer data appear in the system description and have a current DPA. They will request a vendor inventory and verify that security assessments were performed before onboarding at least a subset of critical vendors. Missing DPAs for cloud infrastructure providers are an automatic finding.",

  "change-management-policy":
    "Auditors sample production deployments from the audit period and trace each through the documented process: ticket creation, code review approval, testing evidence, deployment authorization, and rollback capability. Emergency change procedures must also exist and show use when applicable.",

  "business-continuity-plan":
    "Auditors look for: RTO/RPO targets that match SLA commitments, documented backup procedures, and evidence of a test within the past 12 months. A BCP that has never been tested does not satisfy the availability trust service category. Auditors may request backup logs, restore test results, and failover runbooks.",

  "data-classification-policy":
    "Auditors verify that customer data is classified at the appropriate tier and that controls applied to that tier are consistent with the policy. Common test: trace how customer PII is labeled, stored, transmitted, and disposed of. Policies that classify everything as 'confidential' with no differentiation signal a paper policy.",

  "encryption-standards":
    "Auditors verify encryption is implemented, not just documented. They request: TLS certificate scans, database encryption configuration screenshots (encryption-at-rest), and key management documentation. Self-signed certificates in production or TLS 1.0/1.1 in use are automatic findings.",

  "vulnerability-management-policy":
    "Auditors request scan results from the audit period and compare them to the documented SLAs (e.g., 'critical vulns patched within 7 days'). They look for: regular scan cadence, evidence that findings were tracked, and remediation within stated timelines. Scans run but never reviewed are equivalent to no scans.",

  "audit-logging-policy":
    "Auditors verify that logs exist for the events described in the policy, that log retention meets stated requirements, and that logs are protected from tampering. Common test: attempt to trace a specific user action through available logs. Missing authentication events or gaps in log coverage are common findings.",

  "physical-security-policy":
    "For cloud-native companies, auditors primarily review the data center security attestation from the cloud provider (AWS SOC 2, etc.) and ensure it covers the relevant trust services. For any offices where laptops access production, auditors may look at visitor logs and workstation encryption policies.",

  "employee-security-training":
    "Auditors request completion records for security awareness training across all employees during the audit period. They verify that training covers phishing, data handling, and incident reporting. Training completion rates below 100% require explanation. Role-based training for engineers (secure coding, etc.) is expected but often missing.",
};
