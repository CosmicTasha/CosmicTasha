/**
 * Frequent audit failures per SOC 2 document type.
 * Keys correspond to ComplianceTemplate IDs.
 */
export const commonFindings: Record<string, string[]> = {
  "system-description": [
    "Description mentions services or tools no longer in use",
    "System boundaries do not match actual infrastructure evidence",
    "Missing subprocessor documentation for one or more third-party services",
    "Aspirational language used for controls not yet implemented",
    "No version history or last-reviewed date on the document",
  ],

  "information-security-policy": [
    "Policy references access review cadence but no review evidence exists",
    "Policy not reviewed or updated within the audit period",
    "Employee attestation records incomplete — not all staff can be traced",
    "Policy does not address all five trust service categories",
    "No documented approval chain (owner, approver, board/exec sign-off)",
  ],

  "incident-response-plan": [
    "Roles and escalation chain are not named — generics like 'security team lead' with no backup",
    "No documented communication templates or customer notification SLAs",
    "No evidence of plan testing (tabletop exercise or live incident walkthrough)",
    "Incident log does not reference the IR plan — responders are winging it",
    "Post-incident review process described but no completed reviews on file",
  ],

  "access-control-policy": [
    "Terminated employee access not removed within the stated timeframe",
    "Shared or generic accounts in production (e.g., 'deploy-user', 'admin')",
    "MFA not enforced for privileged access or remote access",
    "Access review records missing or incomplete for the audit period",
    "Dormant accounts (inactive >90 days) not identified or remediated",
  ],

  "risk-assessment": [
    "Risk register has not been updated within the audit period",
    "High-risk items have no documented owner or treatment decision",
    "No evidence that the risk assessment process was formally triggered (no meeting notes, no approval)",
    "Residual risk not documented after controls are applied",
    "Risk register does not cover vendor/supply chain risks",
  ],

  "vendor-management-policy": [
    "No DPA on file for one or more vendors with access to customer data",
    "Vendor inventory is incomplete — shadow IT tools not captured",
    "No evidence of security assessment before vendor onboarding",
    "Vendor offboarding procedure not documented or not followed",
    "Critical vendor SOC 2 reports not reviewed within the audit period",
  ],

  "change-management-policy": [
    "Production deployments with no linked ticket or change record",
    "Code review bypassed on emergency changes with no compensating control",
    "No documented rollback procedure for any deployment sampled",
    "Staging/testing environment absent — changes go directly to production",
    "Separation of duties missing — same person codes, reviews, and deploys",
  ],

  "business-continuity-plan": [
    "BCP has never been tested — no test results or exercise records",
    "RTO/RPO targets not defined or not consistent with customer SLAs",
    "Backup configuration documented but restore procedure never validated",
    "Key personnel dependencies — plan fails if one person is unavailable",
    "No communication plan for customer notification during an outage",
  ],

  "data-classification-policy": [
    "Customer PII not classified separately from internal operational data",
    "Disposal procedures documented but no evidence of secure disposal",
    "Data inventory does not cover all systems that store or process customer data",
    "Retention periods defined but not enforced — data kept past stated limits",
    "Policy not communicated to employees handling data",
  ],

  "encryption-standards": [
    "TLS 1.0 or 1.1 still enabled on public-facing endpoints",
    "Database encryption-at-rest not enabled or not verifiable",
    "Encryption key rotation not documented or not occurring on schedule",
    "Self-signed certificates found in production",
    "Secrets (API keys, DB passwords) found in source code or version control history",
  ],

  "vulnerability-management-policy": [
    "Scan results exist but remediation tracking is absent",
    "Critical or high vulnerabilities open beyond the policy-defined SLA",
    "No authenticated scanning — missing credential-based findings",
    "Scan scope excludes production systems or cloud infrastructure",
    "No process for handling false positives — everything is dismissed",
  ],

  "audit-logging-policy": [
    "Authentication events (login, logout, failed login) not captured",
    "Log retention shorter than the audit period — evidence destroyed",
    "Logs stored in the same system they are auditing (tamper risk)",
    "No alerting on suspicious patterns — logs collected but never reviewed",
    "Privileged user actions (admin changes, data exports) not logged",
  ],

  "physical-security-policy": [
    "Cloud provider attestation (AWS/GCP/Azure SOC 2) not on file or expired",
    "Laptop encryption (FileVault, BitLocker) not enforced or verified",
    "No screen lock policy or documented enforcement mechanism",
    "Visitor access logs for offices not maintained",
    "Hardware disposal policy not followed — drives not wiped before disposal",
  ],

  "employee-security-training": [
    "Training completion rate below 100% with no documented exceptions",
    "Training content more than 12 months old — not refreshed within audit period",
    "No phishing simulation or awareness testing program",
    "Role-based training for engineers (secure coding, OWASP) absent",
    "New hire training completion not tracked or delayed past onboarding window",
  ],
};
