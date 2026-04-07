/**
 * Per-gap remediation paths with effort estimates and priority.
 * Keys correspond to Dimension IDs from the 8 scoring dimensions.
 */
export interface RemediationPath {
  gap: string;
  fix: string;
  effort: "hours" | "days" | "weeks";
  priority: "P0" | "P1" | "P2" | "P3";
}

export const remediationPaths: Record<string, RemediationPath[]> = {
  access_control: [
    {
      gap: "No MFA enforced",
      fix: "Enable MFA for all users via SSO provider (Okta, Google Workspace, or AWS IAM Identity Center). Enforce at the IdP level so it cannot be bypassed per-app.",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "No access reviews",
      fix: "Establish quarterly access review using an IDP-generated user report. Document reviewer, date, and action taken (retained / removed) for each account. Store evidence in a shared drive or ticketing system.",
      effort: "days",
      priority: "P1",
    },
    {
      gap: "Terminated employee access not removed on schedule",
      fix: "Integrate IDP deprovisioning with HR system (BambooHR, Rippling, etc.) for same-day termination. Add a checklist item to offboarding tickets requiring IDP screenshot confirmation.",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "Shared or generic production accounts",
      fix: "Create individual named accounts for each person with production access. Delete or disable shared accounts. Implement just-in-time access for break-glass scenarios.",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "Dormant accounts not remediated",
      fix: "Run IDP report filtered by last-login date. Disable any account inactive for 90+ days. Automate this with a monthly cron or IDP lifecycle rule.",
      effort: "hours",
      priority: "P1",
    },
  ],

  system_operations: [
    {
      gap: "No vulnerability scanning",
      fix: "Deploy a continuous scanner (Snyk, Wiz, Tenable.io, or AWS Inspector). Start with container images and IaC, then expand to runtime. Configure alerts for critical/high findings.",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "Critical vulnerabilities open beyond SLA",
      fix: "Triage open findings, patch or apply mitigating controls within 7 days for criticals. Document any accepted risks with a formal exception approval.",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "No audit logging",
      fix: "Enable CloudTrail (AWS), Cloud Audit Logs (GCP), or equivalent. Ensure authentication events, admin actions, and data access are captured. Ship logs to an immutable store (S3 with object lock, Splunk, Datadog).",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "Log retention below audit period",
      fix: "Set log retention to minimum 12 months in your SIEM or cloud storage. Archive to low-cost storage (S3 Glacier) for months 7–12. Document the retention policy in the audit logging policy.",
      effort: "hours",
      priority: "P1",
    },
    {
      gap: "No alerting on security events",
      fix: "Configure detection rules for: failed login spikes, privilege escalation, unusual data exports, and production access outside business hours. Route alerts to PagerDuty or Slack #security-alerts.",
      effort: "days",
      priority: "P1",
    },
  ],

  data_protection: [
    {
      gap: "No encryption at rest for customer data",
      fix: "Enable database encryption at rest (RDS encryption, MongoDB Atlas encryption, etc.) and document the key management provider. Take a screenshot of the configuration for audit evidence.",
      effort: "hours",
      priority: "P0",
    },
    {
      gap: "Weak TLS configuration",
      fix: "Disable TLS 1.0 and 1.1 on all load balancers and CDN. Enforce TLS 1.2+ and modern cipher suites. Run SSLLabs scan and attach the A/A+ report as audit evidence.",
      effort: "hours",
      priority: "P0",
    },
    {
      gap: "Secrets in source code",
      fix: "Rotate all exposed secrets immediately. Add pre-commit git-secrets hooks and enable GitHub Secret Scanning. Migrate secrets to a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler).",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "No encryption key rotation",
      fix: "Configure automatic key rotation (AWS KMS auto-rotation is annual). Document the rotation policy and the key management owner. Record rotation dates as audit evidence.",
      effort: "hours",
      priority: "P1",
    },
    {
      gap: "No data retention enforcement",
      fix: "Implement automated deletion jobs or S3/GCS lifecycle policies that enforce documented retention limits. Add a quarterly review task to verify data disposal occurred.",
      effort: "weeks",
      priority: "P2",
    },
  ],

  change_management: [
    {
      gap: "No change tickets for production deployments",
      fix: "Enforce a rule that all deployments must reference a ticket (GitHub issue, Jira, Linear). Add a CI check that fails pipelines without a linked issue. Capture deployment logs as evidence.",
      effort: "days",
      priority: "P1",
    },
    {
      gap: "No code review requirement",
      fix: "Enable branch protection on main/production branches requiring at least one approved review before merge. Configure GitHub/GitLab to prevent force-pushes and self-approvals.",
      effort: "hours",
      priority: "P0",
    },
    {
      gap: "No separation of duties — single person codes, reviews, and deploys",
      fix: "Require a second person to approve code reviews. For small teams, document a compensating control (e.g., asynchronous review within 24 hours for emergency deploys with incident ticket).",
      effort: "days",
      priority: "P1",
    },
    {
      gap: "No rollback procedure",
      fix: "Document rollback steps for each deployment type (Kubernetes rollout undo, Lambda alias swap, DB migration reversal). Test rollback during a scheduled maintenance window and record results.",
      effort: "days",
      priority: "P1",
    },
    {
      gap: "No staging environment",
      fix: "Create a non-production environment that mirrors production infrastructure. Update the deployment pipeline to require staging sign-off before production promotion. This is medium-effort but blocks many other controls.",
      effort: "weeks",
      priority: "P0",
    },
  ],

  risk_assessment: [
    {
      gap: "No formal risk register",
      fix: "Create a risk register in a shared doc or GRC tool. Include at minimum: risk description, likelihood, impact, owner, treatment (mitigate/accept/transfer/avoid), and target resolution date. Populate with known risks from the team.",
      effort: "days",
      priority: "P1",
    },
    {
      gap: "Risk register not reviewed within audit period",
      fix: "Schedule a quarterly risk review meeting. Document attendees, date, and changes made. Even if no changes, document that the register was reviewed and deemed current.",
      effort: "hours",
      priority: "P1",
    },
    {
      gap: "Risks have no documented owners",
      fix: "Assign a named owner to each risk item. The owner is responsible for tracking treatment and updating status quarterly. Add this to the risk register template.",
      effort: "hours",
      priority: "P2",
    },
    {
      gap: "No vendor/supply chain risk coverage",
      fix: "Add a vendor risk section to the risk register. List all vendors with access to customer data. Rate each by criticality. Document mitigating controls (DPAs, vendor SOC 2 reviews, contractual SLAs).",
      effort: "days",
      priority: "P2",
    },
  ],

  vendor_management: [
    {
      gap: "Missing DPAs for vendors with customer data access",
      fix: "Audit all vendors in the stack that touch customer data (infrastructure, analytics, support, monitoring). Request a DPA from each. Major providers (AWS, Stripe, Twilio) have standard DPAs available on their trust portals.",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "No vendor security assessment process",
      fix: "Create a lightweight vendor security questionnaire (VSQ) covering: SOC 2 certification, encryption practices, incident notification SLAs, and subprocessor disclosure. Require completion before contract signature for new vendors.",
      effort: "days",
      priority: "P1",
    },
    {
      gap: "Vendor SOC 2 reports not reviewed",
      fix: "Request SOC 2 Type II reports from all critical vendors annually. Log the review date and reviewer. Flag any critical findings in the report that affect your environment.",
      effort: "hours",
      priority: "P1",
    },
    {
      gap: "No vendor offboarding process",
      fix: "Add vendor offboarding to the vendor policy: revoke API keys, delete shared accounts, confirm data deletion or return, and terminate the contract. Track with a checklist in your ticketing system.",
      effort: "days",
      priority: "P2",
    },
  ],

  hr_training: [
    {
      gap: "Security awareness training completion below 100%",
      fix: "Assign training in your LMS (KnowBe4, Proofpoint, or Google Classroom) with a hard deadline. Escalate incomplete assignments to managers 1 week before close. Export completion report as audit evidence.",
      effort: "days",
      priority: "P1",
    },
    {
      gap: "Training content outdated (>12 months)",
      fix: "Refresh training content to cover current threat landscape (phishing, social engineering, data handling). Update at least annually. Document the review date and approver.",
      effort: "days",
      priority: "P2",
    },
    {
      gap: "No phishing simulation program",
      fix: "Launch quarterly phishing simulations via KnowBe4 or GoPhish. Track click rates and remediate with targeted training for employees who fail. Document simulation results as evidence.",
      effort: "weeks",
      priority: "P2",
    },
    {
      gap: "No role-based security training for engineers",
      fix: "Assign OWASP Top 10 or equivalent secure coding training to all engineers. Free options: OWASP WebGoat, Secure Code Warrior trial, or internal lunch-and-learn sessions with documented attendance.",
      effort: "weeks",
      priority: "P2",
    },
    {
      gap: "New hire security training not tracked",
      fix: "Add security training as a required onboarding task with a completion deadline (e.g., within 5 business days of start). Tie completion to system access provisioning where feasible.",
      effort: "hours",
      priority: "P1",
    },
  ],

  business_continuity: [
    {
      gap: "BCP never tested",
      fix: "Run a tabletop exercise with engineering and leadership. Simulate a primary region outage. Document the scenario, participants, decisions made, and recovery time achieved. Store the report as audit evidence.",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "RTO/RPO not defined",
      fix: "Define RTO and RPO targets based on customer SLAs and business impact. Document them in the BCP and system description. Verify that backup frequency and failover capability support the stated targets.",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "Backup restore never validated",
      fix: "Run a restore test from backup. Document the backup source, restore target, data verified, and time taken. Schedule this test at least annually and before each SOC 2 audit period.",
      effort: "days",
      priority: "P0",
    },
    {
      gap: "Key person dependencies in the BCP",
      fix: "Document backup contacts for all critical roles. Ensure at least two people can perform each recovery action. Cross-train team members on critical runbooks.",
      effort: "days",
      priority: "P1",
    },
    {
      gap: "No customer communication plan for outages",
      fix: "Create a communication template for outage notifications (initial alert, status updates, and all-clear). Define who is authorized to send customer communications and within what timeframe (e.g., 30 minutes for Severity 1).",
      effort: "hours",
      priority: "P1",
    },
  ],
};
