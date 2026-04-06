import type { ReviewDocument, ComplianceContext } from "./types";

/* ------------------------------------------------------------------ */
/*  Priority 1 Document Set — Mock Data                                */
/* ------------------------------------------------------------------ */

export const MOCK_DOCUMENTS: ReviewDocument[] = [
  /* ---- 1. Incident Response Plan ---- */
  {
    id: "doc-incident-response",
    name: "Incident Response Plan",
    priority: 1,
    status: "in_review",
    approvedSections: 0,
    totalSections: 6,
    reviewFlags: 0,
    sections: [
      {
        id: "ir-purpose",
        title: "1. Purpose & Scope",
        content: `This Incident Response Plan establishes the procedures for identifying, responding to, and recovering from security incidents that may affect the confidentiality, integrity, or availability of company systems and data.

Scope: This plan applies to all employees, contractors, and third-party service providers who have access to company information systems. It covers all production environments, staging environments with customer data, and corporate infrastructure.

Objectives:
- Minimize the impact of security incidents on business operations
- Ensure timely detection and containment of threats
- Maintain compliance with SOC 2 Trust Services Criteria
- Provide a structured framework for post-incident analysis`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC7.3", "CC7.4"],
        auditorExpectation:
          "Auditors expect a clear scope statement that covers all in-scope systems and personnel. The plan should reference specific regulatory requirements.",
      },
      {
        id: "ir-classification",
        title: "2. Incident Classification",
        content: `[REVIEW] Incidents are classified by severity to ensure appropriate response allocation:

P0 — Critical: Complete service outage, confirmed data breach, or active exploitation of a critical vulnerability. Response time: 15 minutes. Requires immediate executive notification and war room activation.

P1 — High: Partial service degradation affecting >10% of customers, suspected unauthorized access, or exploitation of a high-severity vulnerability. Response time: 30 minutes.

P2 — Medium: Localized service issues, failed intrusion attempts, or policy violations with limited impact. Response time: 4 hours.

P3 — Low: Informational security events, minor policy deviations, or vulnerability disclosures with no active exploitation. Response time: 24 hours.

Classification is performed by the on-call Security Engineer using the Severity Matrix (Appendix A). Escalation to a higher severity can be initiated by any team member but must be confirmed by the Incident Commander.`,
        status: "pending",
        hasReviewTag: true,
        reviewNote:
          "Confirm these severity levels match your actual operational thresholds. Are response times realistic for your team size?",
        tscCriteria: ["CC7.2", "CC7.3"],
        auditorExpectation:
          "Auditors will ask for real examples of incidents at each severity level. They want to see that classification criteria are consistently applied.",
      },
      {
        id: "ir-response-procedures",
        title: "3. Response Procedures",
        content: `[REVIEW] Upon incident detection, the following procedures are activated:

Phase 1 — Detection & Triage (0-15 min):
1. Alert received via monitoring system (Datadog/PagerDuty)
2. On-call engineer acknowledges alert within 5 minutes
3. Initial assessment performed using Incident Triage Checklist
4. Severity classification assigned per Section 2
5. Incident ticket created in Jira with classification and initial findings

Phase 2 — Containment (15 min - 2 hours):
1. Incident Commander assumes control
2. Affected systems isolated if necessary
3. Forensic evidence preservation initiated
4. Customer communication drafted (if applicable)
5. War room established for P0/P1 incidents

Phase 3 — Eradication & Recovery (2-48 hours):
1. Root cause identified and documented
2. Remediation plan developed and reviewed
3. Systems restored from known-good state
4. Verification testing performed
5. Monitoring enhanced for recurrence detection

Phase 4 — Post-Incident Review (within 5 business days):
1. Blameless post-mortem conducted
2. Timeline of events documented
3. Lessons learned captured
4. Action items assigned with deadlines
5. Incident report filed for compliance records`,
        status: "pending",
        hasReviewTag: true,
        reviewNote:
          "Walk through these procedures with your team. Do the timelines match your actual capabilities?",
        tscCriteria: ["CC7.3", "CC7.4", "CC7.5"],
        auditorExpectation:
          "Auditors will want to see evidence that these procedures have been tested. They may ask for post-mortem reports from actual incidents.",
      },
      {
        id: "ir-roles",
        title: "4. Roles & Responsibilities",
        content: `Incident Commander (IC):
- Assumes overall authority for incident response
- Coordinates response activities across teams
- Makes decisions on containment and escalation
- Communicates status to executive leadership

Security Engineer (On-Call):
- Performs initial triage and classification
- Executes containment procedures
- Preserves forensic evidence
- Documents timeline of events

Engineering Lead:
- Provides technical expertise for affected systems
- Develops and implements remediation plan
- Performs recovery and verification testing

Communications Lead:
- Drafts customer notifications
- Manages internal communications
- Coordinates with legal and PR teams
- Maintains incident status page updates

Executive Sponsor:
- Authorizes major response decisions (e.g., full system shutdown)
- Handles regulatory notifications
- Approves external communications`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC7.3"],
        auditorExpectation:
          "Auditors expect named roles (not necessarily named people) with clear authority boundaries. They will verify that responsible parties are aware of their duties.",
      },
      {
        id: "ir-communication",
        title: "5. Communication Plan",
        content: `Internal Notifications:
- P0: Immediate Slack alert (#incident-response), PagerDuty escalation to IC, email to executive team within 30 minutes
- P1: Slack alert (#incident-response), PagerDuty to IC within 30 minutes
- P2/P3: Jira ticket creation, Slack notification to #security-events

External Notifications:
- Customer notification within 72 hours of confirmed data breach (per contractual SLAs)
- Regulatory notification within required timeframes (varies by jurisdiction)
- Status page updated for any customer-facing impact

Communication Templates:
- Initial customer notification template (Appendix B)
- Status update template (Appendix C)
- Resolution notification template (Appendix D)
- Regulatory notification template (Appendix E)`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC7.4", "CC2.2"],
        auditorExpectation:
          "Auditors will ask for evidence of actual notifications sent during incidents. They want to see that communication timelines match contractual SLAs.",
      },
      {
        id: "ir-testing",
        title: "6. Plan Testing & Maintenance",
        content: `This plan is tested and updated on the following schedule:

Tabletop Exercises: Quarterly — scenario-based walkthroughs with the incident response team simulating P0 and P1 incidents.

Live Drills: Semi-annually — simulated incidents injected into staging environments to test detection and response capabilities.

Plan Review: Annually — comprehensive review of the plan, updating procedures, contact information, and tools.

Post-Incident Updates: After every P0/P1 incident — plan updated based on lessons learned from the post-mortem.

Metrics Tracked:
- Mean time to detect (MTTD)
- Mean time to respond (MTTR)
- Mean time to resolve
- Percentage of incidents properly classified on first triage
- Post-mortem completion rate`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC7.5", "CC4.2"],
        auditorExpectation:
          "Auditors will ask for records of tabletop exercises and drill results. They want to see that the plan is actively maintained, not just a static document.",
      },
    ],
  },

  /* ---- 2. Access Control Policy ---- */
  {
    id: "doc-access-control",
    name: "Access Control Policy",
    priority: 1,
    status: "pending",
    approvedSections: 0,
    totalSections: 5,
    reviewFlags: 0,
    sections: [
      {
        id: "ac-overview",
        title: "1. Policy Overview",
        content: `This Access Control Policy establishes the requirements for granting, modifying, and revoking access to company information systems and data. It implements the principle of least privilege and ensures that access rights are commensurate with job responsibilities.

Applicability: All employees, contractors, temporary workers, and third-party service providers who require access to company systems.

Compliance: This policy supports SOC 2 Trust Services Criteria for Logical and Physical Access Controls (CC6.1-CC6.8).`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC6.1"],
        auditorExpectation:
          "Auditors expect the policy to clearly define who it applies to and reference the specific control objectives it addresses.",
      },
      {
        id: "ac-provisioning",
        title: "2. Access Provisioning",
        content: `New Access Requests:
1. Manager submits access request via IT Service Desk ticket
2. Request specifies systems, role, and business justification
3. System owner reviews and approves/denies within 2 business days
4. IT provisions access according to role-based access control (RBAC) matrix
5. User notified of access grant with acceptable use acknowledgment

Role-Based Access Control:
- Access is granted based on predefined roles mapped to job functions
- RBAC matrix maintained in the Identity Management System
- Custom access outside standard roles requires VP-level approval
- Service accounts follow the same approval process with a designated owner

Privileged Access:
- Administrative access requires separate approval from the Security team
- Privileged accounts use separate credentials from standard accounts
- All privileged sessions are logged and monitored
- Just-in-time (JIT) access preferred over standing privileges`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC6.1", "CC6.2", "CC6.3"],
        auditorExpectation:
          "Auditors will sample access provisioning tickets to verify the approval workflow is followed. They want to see evidence that RBAC is enforced consistently.",
      },
      {
        id: "ac-review",
        title: "3. Access Reviews",
        content: `[REVIEW] Periodic access reviews are conducted to ensure access rights remain appropriate:

Quarterly Reviews:
- All privileged access reviewed by Security team
- Service account access reviewed by system owners
- Third-party access reviewed by vendor management

Semi-Annual Reviews:
- All employee access reviewed by direct managers
- RBAC matrix validated against current organizational structure
- Dormant accounts (no login for 90 days) flagged for review

Annual Reviews:
- Comprehensive access certification across all systems
- RBAC matrix re-validated with HR for role changes
- Third-party access agreements reviewed and renewed

Access reviews are documented in the GRC platform with evidence of reviewer approval. Exceptions require documented justification and time-bound remediation plans.`,
        status: "pending",
        hasReviewTag: true,
        reviewNote:
          "Confirm the review frequencies are achievable with your current team. Do you have tooling to support automated access reviews?",
        tscCriteria: ["CC6.1", "CC6.2", "CC6.6"],
        auditorExpectation:
          "Auditors will request access review records for the audit period. They want to see timely completion and evidence that exceptions were remediated.",
      },
      {
        id: "ac-revocation",
        title: "4. Access Revocation",
        content: `Termination:
- Access revoked within 24 hours of employment termination
- HR notifies IT via automated feed from HRIS
- Physical access (badges, keys) collected during exit process
- Shared credentials rotated if the departing user had access

Role Changes:
- Access reviewed and adjusted within 5 business days of role change
- Previous role access removed unless explicitly re-approved
- Manager certifies new access requirements

Contractor Off-boarding:
- Access automatically expires at contract end date
- Early termination triggers same-day revocation
- Vendor management notified for third-party account removal`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC6.1", "CC6.2", "CC6.5"],
        auditorExpectation:
          "Auditors will cross-reference termination dates with access revocation dates. Any gaps beyond the stated SLA will be flagged as exceptions.",
      },
      {
        id: "ac-mfa",
        title: "5. Authentication Requirements",
        content: `Multi-Factor Authentication (MFA):
- Required for all access to production systems
- Required for VPN and remote access
- Required for all administrative/privileged accounts
- Required for access to customer data stores

Password Policy:
- Minimum 14 characters
- Must include uppercase, lowercase, number, and special character
- Password rotation every 90 days for service accounts
- No password reuse within last 12 passwords
- Account lockout after 5 failed attempts

Single Sign-On (SSO):
- All SaaS applications integrated via SAML/OIDC where supported
- SSO-enabled applications inherit MFA requirements
- Non-SSO applications require documented exception`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC6.1", "CC6.6", "CC6.7"],
        auditorExpectation:
          "Auditors will test MFA enforcement on sample systems. They expect evidence that password policies are technically enforced, not just documented.",
      },
    ],
  },

  /* ---- 3. Change Management Policy ---- */
  {
    id: "doc-change-management",
    name: "Change Management Policy",
    priority: 1,
    status: "pending",
    approvedSections: 0,
    totalSections: 5,
    reviewFlags: 0,
    sections: [
      {
        id: "cm-overview",
        title: "1. Policy Statement",
        content: `All changes to production information systems, infrastructure, and configurations must follow a structured change management process. This policy ensures that changes are planned, tested, approved, and documented to minimize risk to service availability and data integrity.

This policy applies to:
- Application code deployments
- Infrastructure changes (networking, servers, cloud resources)
- Database schema modifications
- Configuration changes to production systems
- Security-relevant changes (firewall rules, IAM policies)
- Third-party integrations and API changes`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC8.1"],
        auditorExpectation:
          "Auditors expect comprehensive scope covering all types of changes to in-scope systems. They will check that the policy doesn't have gaps.",
      },
      {
        id: "cm-process",
        title: "2. Change Request Process",
        content: `Standard Changes:
1. Developer creates pull request with description and test results
2. Peer code review by at least one engineer (two for security-sensitive changes)
3. Automated CI/CD pipeline runs tests, linting, and security scans
4. Reviewer approves the pull request
5. Change deployed through automated pipeline (staging → production)
6. Post-deployment verification performed

Emergency Changes:
1. Incident Commander authorizes emergency change
2. Change implemented with best-effort review
3. Retrospective review completed within 2 business days
4. Emergency change documented with justification

Change Advisory Board (CAB):
- Meets weekly to review upcoming high-risk changes
- Reviews emergency changes retrospectively
- Approves changes to shared infrastructure and databases`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC8.1", "CC7.1"],
        auditorExpectation:
          "Auditors will sample pull requests to verify the approval workflow. They will specifically look for changes that bypassed the standard process.",
      },
      {
        id: "cm-testing",
        title: "3. Testing Requirements",
        content: `All changes must pass the following gates before production deployment:

Automated Testing:
- Unit tests with minimum 80% code coverage for changed files
- Integration tests covering affected API endpoints
- Security scanning (SAST/DAST) with no critical or high findings
- Dependency vulnerability scanning

Staging Validation:
- Changes deployed to staging environment first
- Functional testing performed in staging
- Performance impact assessed for database changes
- Rollback procedure verified

Production Verification:
- Canary deployment for high-risk changes (10% traffic for 30 minutes)
- Health checks pass for all affected services
- Key business metrics monitored for 1 hour post-deployment
- Automated rollback triggered if error rate exceeds threshold`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC8.1", "CC7.1"],
        auditorExpectation:
          "Auditors want evidence that testing gates are enforced automatically. They will check CI/CD logs for evidence of test execution and results.",
      },
      {
        id: "cm-rollback",
        title: "4. Rollback Procedures",
        content: `Every change must have a documented rollback plan before deployment:

Automated Rollback:
- CI/CD pipeline supports one-click rollback to previous version
- Database migrations include reversible down migrations
- Feature flags used for gradual rollout with instant disable capability

Manual Rollback:
- Runbook maintained for infrastructure changes
- Database backup taken before schema changes
- Configuration snapshots stored before modifications

Rollback Criteria:
- Error rate increase >2x baseline
- P95 latency increase >50% from baseline
- Any data integrity issues detected
- Customer-reported issues affecting core functionality

Post-Rollback:
- Root cause analysis within 24 hours
- Revised change re-submitted through standard process
- Rollback event documented in change log`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC8.1"],
        auditorExpectation:
          "Auditors will ask to see evidence of actual rollbacks. They want to verify that rollback procedures are tested and functional.",
      },
      {
        id: "cm-audit-trail",
        title: "5. Audit Trail & Documentation",
        content: `All changes are logged with the following information:
- Change ID (pull request or ticket number)
- Description of the change
- Requester and approver identities
- Date and time of approval and deployment
- Test results and review evidence
- Rollback plan reference

Change logs are retained for a minimum of 7 years and stored in an immutable audit log.

Reporting:
- Monthly change volume and success rate metrics
- Emergency change frequency and root causes
- Failed deployment rate and mean time to recovery
- Compliance dashboard showing policy adherence`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC8.1", "CC4.1"],
        auditorExpectation:
          "Auditors will request the change log for the audit period. They expect to see a complete, tamper-evident record of all production changes.",
      },
    ],
  },

  /* ---- 4. Risk Assessment Procedure ---- */
  {
    id: "doc-risk-assessment",
    name: "Risk Assessment Procedure",
    priority: 1,
    status: "pending",
    approvedSections: 0,
    totalSections: 4,
    reviewFlags: 0,
    sections: [
      {
        id: "ra-framework",
        title: "1. Risk Assessment Framework",
        content: `This procedure defines the methodology for identifying, analyzing, and evaluating risks to the organization's information systems and data.

Framework: The organization uses a qualitative risk assessment methodology based on NIST SP 800-30, adapted for the company's scale and operating environment.

Risk Categories:
- Operational: Risks to service availability and business continuity
- Security: Risks to data confidentiality, integrity, and availability
- Compliance: Risks of regulatory non-compliance
- Strategic: Risks to business objectives and reputation
- Third-Party: Risks introduced by vendors and service providers`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC3.1", "CC3.2"],
        auditorExpectation:
          "Auditors expect a defined methodology for risk assessment. They will verify that the framework is applied consistently across all risk categories.",
      },
      {
        id: "ra-identification",
        title: "2. Risk Identification & Analysis",
        content: `Risk Identification Sources:
- Annual threat landscape review
- Vulnerability scan results and penetration test findings
- Incident post-mortem reports
- Vendor risk assessments
- Industry threat intelligence feeds
- Employee-reported concerns

Risk Analysis:
Each identified risk is analyzed using a 5x5 likelihood-impact matrix:

Likelihood: 1 (Rare) to 5 (Almost Certain)
Impact: 1 (Negligible) to 5 (Catastrophic)

Risk Score = Likelihood x Impact

Risk Levels:
- Critical (20-25): Immediate action required, executive oversight
- High (12-19): Treatment plan within 30 days
- Medium (6-11): Treatment plan within 90 days
- Low (1-5): Accept or monitor, review annually`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC3.2", "CC3.3"],
        auditorExpectation:
          "Auditors will ask to see the risk register with scores. They want evidence that the scoring methodology is applied consistently.",
      },
      {
        id: "ra-treatment",
        title: "3. Risk Treatment",
        content: `[REVIEW] For each identified risk, one of the following treatment strategies is selected:

Mitigate: Implement controls to reduce likelihood or impact. Document the specific controls and their expected effectiveness.

Transfer: Shift risk to a third party (e.g., cyber insurance, contractual obligations). Document the transfer mechanism and residual risk.

Accept: Acknowledge the risk without additional controls. Requires documented justification and approval by the risk owner (VP level or above for High/Critical risks).

Avoid: Eliminate the risk by discontinuing the activity. Document the business impact of avoidance.

Treatment Plans:
- Each treated risk has a documented plan with owner, timeline, and success criteria
- Plans are tracked in the GRC platform with regular status updates
- Residual risk is reassessed after treatment implementation
- Control effectiveness is tested at least annually`,
        status: "pending",
        hasReviewTag: true,
        reviewNote:
          "Review the treatment strategies and confirm your organization uses these categories. Are there risks you're currently accepting that should have formal documentation?",
        tscCriteria: ["CC3.2", "CC3.4", "CC5.1"],
        auditorExpectation:
          "Auditors will review risk treatment decisions, especially accepted risks. They expect documented justification for every accepted risk above 'Low'.",
      },
      {
        id: "ra-monitoring",
        title: "4. Ongoing Monitoring & Review",
        content: `Risk Register Maintenance:
- Risk register reviewed and updated quarterly by the Security team
- New risks added as they are identified throughout the year
- Closed risks archived with resolution documentation

Reporting:
- Quarterly risk summary presented to executive leadership
- Annual comprehensive risk assessment report
- Ad-hoc reports for newly identified critical risks

Key Risk Indicators (KRIs):
- Number of open critical/high risks
- Average age of untreated risks
- Percentage of risks with completed treatment plans
- Number of new risks identified per quarter
- Control effectiveness test results`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC3.2", "CC4.2"],
        auditorExpectation:
          "Auditors want to see evidence of ongoing risk monitoring, not just point-in-time assessments. They will ask for quarterly risk reports from the audit period.",
      },
    ],
  },

  /* ---- 5. Vendor Management Policy ---- */
  {
    id: "doc-vendor-management",
    name: "Vendor Management Policy",
    priority: 1,
    status: "pending",
    approvedSections: 0,
    totalSections: 5,
    reviewFlags: 0,
    sections: [
      {
        id: "vm-overview",
        title: "1. Policy Purpose",
        content: `This policy establishes the requirements for evaluating, selecting, and monitoring third-party vendors and service providers who have access to company data or systems.

All vendors that process, store, or transmit company or customer data must undergo security assessment and ongoing monitoring. This includes SaaS providers, infrastructure vendors, consultants with system access, and data processors.`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC9.2"],
        auditorExpectation:
          "Auditors expect a defined scope of vendors subject to this policy. They will verify that critical vendors are properly categorized and monitored.",
      },
      {
        id: "vm-assessment",
        title: "2. Vendor Assessment",
        content: `Pre-Engagement Assessment:
1. Security questionnaire distributed to vendor (SIG Lite or custom)
2. SOC 2 Type II report reviewed (or equivalent: ISO 27001, SOC 1)
3. Privacy policy and data processing agreement reviewed by Legal
4. Vendor risk rating assigned (Critical, High, Medium, Low)
5. Assessment results documented and approved by Security team

Vendor Risk Rating Criteria:
- Critical: Processes or stores customer PII, has admin access to production
- High: Has access to internal systems, processes business-sensitive data
- Medium: Has limited access, processes non-sensitive data
- Low: No data access, no system connectivity`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC9.2", "CC3.2"],
        auditorExpectation:
          "Auditors will sample vendor assessments for critical and high-risk vendors. They expect to see completed questionnaires and SOC 2 report reviews.",
      },
      {
        id: "vm-contracts",
        title: "3. Contractual Requirements",
        content: `All vendor contracts for Critical and High-risk vendors must include:

Security Requirements:
- Data encryption in transit and at rest
- Access controls and authentication requirements
- Incident notification within 72 hours
- Right to audit or request evidence of controls
- Data retention and deletion obligations

Compliance Requirements:
- Maintenance of SOC 2 Type II report (or equivalent)
- Annual security assessment or certification renewal
- Notification of material changes to security posture
- Subprocessor disclosure and approval requirements

Data Protection:
- Data Processing Agreement (DPA) with GDPR-compliant terms
- Data residency requirements specified
- Return or deletion of data upon contract termination
- Prohibition of data use beyond contracted purposes`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC9.2", "CC2.3"],
        auditorExpectation:
          "Auditors will review vendor contracts for required security clauses. They expect to see DPAs in place for all vendors handling personal data.",
      },
      {
        id: "vm-monitoring",
        title: "4. Ongoing Monitoring",
        content: `Critical Vendors — Quarterly:
- Review vendor's security posture changes
- Check for reported breaches or incidents
- Monitor SLA compliance and uptime
- Review access logs for vendor accounts

High-Risk Vendors — Semi-Annually:
- Updated security questionnaire
- SOC 2 report review upon renewal
- SLA and performance review

Medium/Low-Risk Vendors — Annually:
- Basic security posture check
- Contract compliance review
- Continued need assessment

Vendor Inventory:
- Centralized vendor register maintained in the GRC platform
- Register updated within 5 business days of vendor onboarding/offboarding
- Annual inventory reconciliation with accounts payable records`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC9.2", "CC4.2"],
        auditorExpectation:
          "Auditors will request the vendor register and evidence of ongoing monitoring. They expect to see monitoring activities completed on schedule.",
      },
      {
        id: "vm-offboarding",
        title: "5. Vendor Offboarding",
        content: `When a vendor relationship is terminated:

Access Revocation:
- All vendor access credentials revoked within 24 hours
- VPN and network access removed
- Shared credentials rotated
- API keys and tokens revoked

Data Handling:
- Written confirmation of data deletion from vendor
- Verification that backups containing company data are destroyed
- DPA termination provisions executed

Documentation:
- Offboarding checklist completed and filed
- Vendor marked as inactive in vendor register
- Lessons learned documented for future vendor selection`,
        status: "pending",
        hasReviewTag: false,
        tscCriteria: ["CC9.2", "CC6.5"],
        auditorExpectation:
          "Auditors will check that offboarded vendors had their access revoked promptly. They expect evidence of data deletion confirmation.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Compliance Context Data — keyed by TSC criteria code               */
/* ------------------------------------------------------------------ */

export const TSC_CRITERIA: Record<string, { code: string; text: string }> = {
  "CC2.2": {
    code: "CC2.2",
    text: "COSO Principle 14: The entity internally communicates information, including objectives and responsibilities for internal control.",
  },
  "CC3.1": {
    code: "CC3.1",
    text: "COSO Principle 6: The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks.",
  },
  "CC3.2": {
    code: "CC3.2",
    text: "COSO Principle 7: The entity identifies risks to the achievement of its objectives and analyzes risks as a basis for determining how the risks should be managed.",
  },
  "CC3.3": {
    code: "CC3.3",
    text: "COSO Principle 8: The entity considers the potential for fraud in assessing risks.",
  },
  "CC3.4": {
    code: "CC3.4",
    text: "COSO Principle 9: The entity identifies and assesses changes that could significantly impact internal control.",
  },
  "CC4.1": {
    code: "CC4.1",
    text: "COSO Principle 16: The entity selects, develops, and performs ongoing and/or separate evaluations.",
  },
  "CC4.2": {
    code: "CC4.2",
    text: "COSO Principle 17: The entity evaluates and communicates internal control deficiencies in a timely manner.",
  },
  "CC5.1": {
    code: "CC5.1",
    text: "COSO Principle 10: The entity selects and develops control activities that contribute to the mitigation of risks.",
  },
  "CC6.1": {
    code: "CC6.1",
    text: "The entity implements logical access security software, infrastructure, and architectures over protected information assets.",
  },
  "CC6.2": {
    code: "CC6.2",
    text: "Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.",
  },
  "CC6.3": {
    code: "CC6.3",
    text: "The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets.",
  },
  "CC6.5": {
    code: "CC6.5",
    text: "The entity discontinues logical and physical protections over physical assets only after the ability to protect is no longer needed.",
  },
  "CC6.6": {
    code: "CC6.6",
    text: "The entity implements logical access security measures to protect against threats from sources outside its system boundaries.",
  },
  "CC6.7": {
    code: "CC6.7",
    text: "The entity restricts the transmission, movement, and removal of information to authorized internal and external users.",
  },
  "CC7.1": {
    code: "CC7.1",
    text: "To meet its objectives, the entity uses detection and monitoring procedures to identify changes to configurations that result in new vulnerabilities.",
  },
  "CC7.2": {
    code: "CC7.2",
    text: "The entity monitors system components and the operation of those components for anomalies indicative of malicious acts and errors.",
  },
  "CC7.3": {
    code: "CC7.3",
    text: "The entity evaluates security events to determine whether they could or have resulted in a failure to meet objectives.",
  },
  "CC7.4": {
    code: "CC7.4",
    text: "The entity responds to identified security incidents by executing a defined incident response program.",
  },
  "CC7.5": {
    code: "CC7.5",
    text: "The entity identifies, develops, and implements activities to recover from identified security incidents.",
  },
  "CC8.1": {
    code: "CC8.1",
    text: "The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.",
  },
  "CC9.2": {
    code: "CC9.2",
    text: "The entity assesses and manages risks associated with vendors and business partners.",
  },
};

/** Build compliance context for a given section */
export function getComplianceContext(
  section: { tscCriteria?: string[]; auditorExpectation?: string } | null
): ComplianceContext | null {
  if (!section) return null;

  const criteria = (section.tscCriteria ?? [])
    .map((code) => TSC_CRITERIA[code])
    .filter(Boolean);

  const evidenceExamples = getEvidenceExamples(section.tscCriteria ?? []);

  return {
    criteria,
    auditorExpectation: section.auditorExpectation ?? "",
    evidenceExamples,
  };
}

function getEvidenceExamples(codes: string[]): string[] {
  const examples: Record<string, string[]> = {
    CC6: [
      "Screenshots of IAM role configurations",
      "Access provisioning ticket with manager approval",
      "Quarterly access review completion report",
    ],
    CC7: [
      "PagerDuty incident timeline export",
      "Post-mortem report with timeline and action items",
      "Tabletop exercise attendance log and findings",
    ],
    CC8: [
      "Pull request with code review approvals",
      "CI/CD pipeline execution logs",
      "Change Advisory Board meeting minutes",
    ],
    CC3: [
      "Risk register with scoring and treatment plans",
      "Quarterly risk report to leadership",
      "Penetration test findings mapped to risk register",
    ],
    CC9: [
      "Vendor security questionnaire responses",
      "SOC 2 report review notes",
      "Vendor risk rating documentation",
    ],
    CC2: [
      "Internal communication policy",
      "Incident notification email templates",
      "Status page update history",
    ],
    CC4: [
      "Control testing results and evidence",
      "Internal audit findings and remediation",
      "Management review meeting minutes",
    ],
    CC5: [
      "Control implementation documentation",
      "Risk-control mapping matrix",
      "Control effectiveness test results",
    ],
  };

  const result: string[] = [];
  const seen = new Set<string>();

  for (const code of codes) {
    const prefix = code.replace(/\.\d+$/, "");
    const items = examples[prefix] ?? [];
    for (const item of items) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
  }

  return result;
}
