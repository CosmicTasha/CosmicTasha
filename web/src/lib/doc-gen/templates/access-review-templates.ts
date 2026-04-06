import type { DocTemplate } from '../types';

export const accessReviewTemplatesTemplate: DocTemplate = {
  id: 'access-review-templates',
  name: 'Access Review Templates',
  priority: 3,
  tscCriteria: ['CC6.1', 'CC6.2', 'CC6.3'],
  sections: [
    {
      id: 'art-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This document provides the templates and procedures for conducting periodic access reviews at {{q1.1}}. Access reviews ensure that user access rights remain appropriate, that the principle of least privilege is maintained, and that access is promptly revoked when no longer required. These reviews are a key control for SOC 2 Trust Services Criteria CC6.1, CC6.2, and CC6.3.`,
    },
    {
      id: 'art-review-schedule',
      title: 'Review Schedule',
      type: 'static',
      content: `# Review Schedule

Access reviews are conducted on the following schedule: {{q4_1}}.

| Review Type | Frequency | Scope | Owner |
|---|---|---|---|
| User Access Review | Quarterly | All systems in SOC 2 scope | {{q3.1}} |
| Privileged Access Review | Quarterly | Admin and elevated accounts | {{q3.1}} |
| Service Account Review | Semi-annually | Automated and service accounts | {{q3.1}} |
| Third-Party Access Review | Quarterly | Vendor and contractor accounts | {{q3.1}} |

Reviews must be completed within 10 business days of the scheduled start date. Completion evidence is retained for SOC 2 audit purposes.`,
    },
    {
      id: 'art-review-scope',
      title: 'Review Scope',
      type: 'ai_generate',
      content: `Write a "Review Scope" section for {{q1.1}}'s Access Review procedures.
Access review configuration: {{q4_1}}.
Their SaaS tools include identity ({{q2_3_identity}}), source code ({{q2_3_source_code}}), CI/CD ({{q2_3_cicd}}), communication ({{q2_3_communication}}), and endpoint management ({{q2_3_endpoint}}).
Cloud providers: {{q2_1}}.
Describe what systems, accounts, and access types are in scope for review. Cover: production infrastructure, identity provider, SaaS applications, code repositories, CI/CD pipelines, and any admin consoles. Write 2-3 paragraphs in formal compliance language.`,
    },
    {
      id: 'art-review-process',
      title: 'Review Process',
      type: 'static',
      content: `# Review Process

Each access review follows this standardized process:

1. **Preparation:** The security owner exports a current list of users and their roles/permissions from each in-scope system.
2. **Distribution:** User access lists are distributed to the appropriate reviewers (system owners or department managers).
3. **Review:** Each reviewer evaluates whether each user's access is:
   - **Appropriate** — access aligns with current job responsibilities
   - **Excessive** — user has more access than required; access should be reduced
   - **Stale** — user no longer requires access (e.g., role change, departure); access should be revoked
4. **Action:** Identified issues are remediated within 5 business days:
   - Excessive access is reduced to the minimum required level
   - Stale accounts are disabled or removed
   - Findings are documented with remediation evidence
5. **Sign-Off:** The reviewer and security owner sign off on the completed review.
6. **Retention:** Completed review records, including evidence of any remediation actions, are retained for audit purposes.`,
    },
    {
      id: 'art-reviewer-assignment',
      title: 'Reviewer Assignment',
      type: 'static',
      content: `# Reviewer Assignment

Access reviews are assigned to reviewers based on system ownership and organizational responsibility:

- **Security Owner ({{q3.1}}):** Oversees the access review program, conducts privileged access reviews, and ensures all reviews are completed on schedule.
- **System Owners:** Review access for systems under their responsibility. System owners verify that each user's access level is appropriate for their role.
- **Department Managers:** Review access for personnel in their department, confirming that access aligns with current job functions and that departed or transferred employees have been removed.

Reviewers must not review their own access. A separation of duties control ensures that access reviews are conducted by an individual with appropriate authority who is independent of the access being reviewed.`,
    },
    {
      id: 'art-quarterly-review-template',
      title: 'Quarterly Review Template',
      type: 'static',
      content: `# Quarterly Access Review Template

Use the following template to document each quarterly access review:

**Review Period:** Q__ 20__
**System/Application:** _______________
**Reviewer:** _______________
**Review Date:** _______________

| # | User | Email | Role/Permission | Department | Status | Action Required | Notes |
|---|---|---|---|---|---|---|---|
| 1 | | | | | Active / Inactive | None / Reduce / Revoke | |
| 2 | | | | | Active / Inactive | None / Reduce / Revoke | |
| 3 | | | | | Active / Inactive | None / Reduce / Revoke | |
| 4 | | | | | Active / Inactive | None / Reduce / Revoke | |
| 5 | | | | | Active / Inactive | None / Reduce / Revoke | |

**Summary:**
- Total users reviewed: ___
- Access confirmed appropriate: ___
- Access reduced: ___
- Access revoked: ___

**Reviewer Signature:** _________________________ **Date:** _____________
**Security Owner Sign-Off:** _________________________ **Date:** _____________`,
    },
    {
      id: 'art-offboarding-checklist',
      title: 'Offboarding Checklist',
      type: 'static',
      content: `# Offboarding Access Revocation Checklist

When an employee or contractor departs {{q1.1}}, the following access revocation steps must be completed per the offboarding procedure ({{q4_2_offboarding}}):

| # | System / Account | Action | Completed | Completed By | Date |
|---|---|---|---|---|---|
| 1 | Identity Provider ({{q2_3_identity}}) | Disable/delete user account | [ ] | | |
| 2 | Email and Communication ({{q2_3_communication}}) | Suspend account, set auto-reply | [ ] | | |
| 3 | Source Code ({{q2_3_source_code}}) | Remove from org/repos | [ ] | | |
| 4 | CI/CD ({{q2_3_cicd}}) | Revoke access and tokens | [ ] | | |
| 5 | Cloud Console ({{q2_1}}) | Remove IAM user/role | [ ] | | |
| 6 | Endpoint Management ({{q2_3_endpoint}}) | Remote wipe / reclaim device | [ ] | | |
| 7 | VPN / Network Access | Revoke certificates and credentials | [ ] | | |
| 8 | Physical Access | Collect badge, revoke building access | [ ] | | |

All access revocation must be completed within 24 hours of the employee's last working day. The security owner ({{q3.1}}) verifies completion and retains evidence for audit purposes.`,
    },
    {
      id: 'art-escalation',
      title: 'Escalation',
      type: 'static',
      content: `# Escalation

The following escalation procedures apply to access review findings:

- **Overdue Reviews:** If an access review is not completed within the 10-business-day window, the security owner ({{q3.1}}) escalates to the reviewer's manager and, if necessary, to executive leadership.
- **Unresolved Findings:** If identified access issues are not remediated within 5 business days, the finding is escalated to the security owner for immediate action, which may include forced access revocation.
- **High-Risk Findings:** Discovery of unauthorized privileged access, dormant admin accounts, or access by departed personnel is treated as a security incident and escalated immediately per the incident response plan.
- **Reviewer Non-Compliance:** Repeated failure to complete assigned reviews may result in reassignment of review responsibilities and disciplinary action per organizational policy.

All escalations are documented and tracked to resolution. Escalation records are retained as part of the access review evidence package.`,
    },
  ],
};
