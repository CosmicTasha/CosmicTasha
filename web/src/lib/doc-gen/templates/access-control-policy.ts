import type { DocTemplate } from '../types';

export const accessControlPolicyTemplate: DocTemplate = {
  id: 'access-control-policy',
  name: 'Access Control Policy',
  priority: 1,
  tscCriteria: ['CC6.1', 'CC6.2', 'CC6.3', 'CC6.4', 'CC6.5'],
  sections: [
    {
      id: 'acp-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This Access Control Policy establishes requirements for managing user access to {{q1.1}}'s information systems, applications, and data. The policy ensures that access is granted on a least-privilege basis, regularly reviewed, and promptly revoked when no longer required.

This policy supports the Security Trust Services Criteria of the SOC 2 framework and is designed to protect the confidentiality, integrity, and availability of the organization's information assets.`,
    },
    {
      id: 'acp-authentication',
      title: 'Authentication Requirements',
      type: 'static',
      content: `# Authentication Requirements

## Multi-Factor Authentication (MFA)
**Current status:** {{q4_1.mfa}}

All users accessing {{q1.1}} production systems and critical SaaS applications must authenticate using multi-factor authentication (MFA). MFA is required for:

- Access to production cloud environments ({{q2_1}})
- Source code repositories ({{q2_3_source_code}})
- Identity provider and SSO portals ({{q2_3_identity}})
- Administrative access to any system component
- VPN and remote access connections

## Single Sign-On (SSO)
**Current status:** {{q4_1.sso}}

The organization utilizes single sign-on (SSO) to centralize authentication and enforce consistent access policies across applications. SSO reduces credential sprawl and simplifies access revocation during offboarding.

## Password Requirements
Where SSO or MFA is not available, the following password requirements apply:

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, and special characters
- No password reuse for the last 12 passwords
- Account lockout after 5 failed attempts

## Unique Accounts
**Current status:** {{q4_1.unique_accounts}}

All users must authenticate with unique, individually assigned accounts. Shared accounts are prohibited for production systems and any system containing customer data.`,
    },
    {
      id: 'acp-authorization',
      title: 'Authorization and Access Levels',
      type: 'ai_generate',
      content: `Write a formal "Authorization and Access Levels" section for an Access Control Policy for {{q1.1}}.
Current access level management: {{q4_1.access_levels}}.
Engineering team size: {{q3.2}}.
Architecture type: {{q2_2}}.
Cloud providers: {{q2_1}}.
Data types: {{q2_4}}.
Define role-based access control (RBAC) principles, standard access levels (Admin, Developer, Read-only, etc.), and the approval process for access requests.
Write in formal compliance language.`,
    },
    {
      id: 'acp-access-reviews',
      title: 'Access Reviews',
      type: 'static',
      reviewRequired: true,
      content: `# Access Reviews

## Review Frequency
**Current practice:** {{q4_1.access_reviews}}

Access reviews are conducted to ensure that user access rights remain appropriate and aligned with job responsibilities. Reviews include:

- Verification that access levels match current job roles
- Identification and removal of dormant or unused accounts
- Confirmation that terminated employees and contractors have been deprovisioned
- Review of privileged access accounts

## Review Process
1. The security lead generates a list of all active user accounts and their access levels
2. Department managers review and confirm access for their team members
3. Discrepancies are flagged and resolved within 5 business days
4. Review results are documented and retained for audit purposes

## Privileged Access Reviews
Privileged accounts (administrative access to production systems, cloud consoles, and databases) are reviewed quarterly regardless of the general review schedule.

[REVIEW] Verify that the access review frequency matches your organization's risk tolerance and auditor expectations. If access reviews are currently not conducted, establish a schedule before audit.`,
    },
    {
      id: 'acp-lifecycle',
      title: 'Employee Lifecycle',
      type: 'static',
      content: `# Employee Lifecycle

## Onboarding
**Current process:** {{q4_2_onboarding}}

New employees and contractors receive access based on their role and department. The onboarding process includes:

1. Identity verification and background check completion (where applicable)
2. Creation of unique user accounts in the identity provider
3. Assignment of role-based access permissions
4. Provisioning of hardware and endpoint management enrollment
5. Completion of security awareness training
6. Acknowledgment of the Acceptable Use Policy

Access is granted only after the employee's manager submits an approved access request and the security lead confirms the appropriate access level.

## Offboarding
**Current process:** {{q4_2_offboarding}}

Upon employee or contractor separation, the following actions are completed within 24 hours:

1. Deactivation of the user's identity provider account (disabling SSO access)
2. Revocation of access to all production systems and databases
3. Removal from code repositories and CI/CD pipelines
4. Retrieval and remote wipe of company-issued devices
5. Revocation of VPN and remote access credentials
6. Transfer of ownership for shared resources and documents
7. Confirmation of deprovisioning by the security lead`,
    },
    {
      id: 'acp-contractors',
      title: 'Contractor Access',
      type: 'conditional',
      condition: (answers) => {
        return (answers['q3.4'] as string) === 'Yes';
      },
      content: `# Contractor Access

## Contractor Access Controls
{{q1.1}} works with contractors and outsourced teams. Contractor access is subject to additional controls beyond those applied to full-time employees.

**Current contractor access scope:** {{q3.4_access}}

### Requirements
- All contractors must sign a confidentiality agreement and acceptable use policy before receiving access
- Contractor accounts are time-limited and expire automatically at the end of the engagement
- Contractor access is limited to the minimum systems and data required for their role
- Contractors are prohibited from accessing systems or data outside their approved scope
- All contractor access is logged and reviewed monthly

### Monitoring
Contractor activity in production systems and source code repositories is monitored for anomalous behavior. The security lead reviews contractor access logs on a monthly basis.

### Termination
Contractor access is revoked within 4 hours of engagement termination. The process mirrors the employee offboarding checklist with additional verification steps.`,
    },
    {
      id: 'acp-remote-access',
      title: 'Remote Access',
      type: 'conditional',
      condition: (answers) => {
        const location = answers['q3.3'] as string;
        return location === 'Fully remote' || location === 'Hybrid (mix of remote and office)';
      },
      content: `# Remote Access

## Remote Work Policy
{{q1.1}} operates as a {{q3.3}} organization. Remote access to company systems is governed by the following requirements:

### Device Requirements
- All devices used to access company systems must be enrolled in the organization's endpoint management solution ({{q2_3_endpoint}})
- Devices must have full-disk encryption enabled
- Operating systems and applications must be kept up to date with the latest security patches
- Antivirus / endpoint detection and response (EDR) software must be installed and active

### Network Requirements
- Access to production systems from remote locations requires VPN or zero-trust network access (ZTNA)
- Public Wi-Fi usage requires VPN connection before accessing any company systems
- Split tunneling is prohibited when connected to the corporate VPN

### Session Management
- Remote sessions to production systems automatically time out after 30 minutes of inactivity
- Concurrent sessions from multiple locations trigger an alert for review
- All remote access sessions are logged with source IP, timestamp, and duration`,
    },
  ],
};
