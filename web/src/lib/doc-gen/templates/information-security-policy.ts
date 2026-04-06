import type { DocTemplate } from '../types';

export const informationSecurityPolicyTemplate: DocTemplate = {
  id: 'information-security-policy',
  name: 'Information Security Policy',
  priority: 1,
  tscCriteria: ['CC1.1', 'CC1.2', 'CC2.1', 'CC3.1', 'CC5.1', 'CC6.1'],
  sections: [
    {
      id: 'isp-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This Information Security Policy establishes the framework for protecting the confidentiality, integrity, and availability of information assets at {{q1.1}}. This policy applies to all employees, contractors, and third-party service providers who access, process, store, or transmit organizational data.

The objectives of this policy are to:

- Protect information assets from unauthorized access, disclosure, modification, or destruction
- Ensure compliance with applicable legal, regulatory, and contractual requirements
- Establish a culture of security awareness across the organization
- Define roles and responsibilities for information security management
- Provide a framework for continuous improvement of security controls`,
    },
    {
      id: 'isp-scope',
      title: 'Scope',
      type: 'static',
      content: `# Scope

This policy applies to all information systems, data, and infrastructure operated by {{q1.1}}, including but not limited to:

- Production systems hosted on {{q2_1}}
- All SaaS applications used for business operations
- Employee workstations and mobile devices
- Network infrastructure and communications systems
- Data stored, processed, or transmitted by the organization

This policy applies to all {{q1.3}} employees, contractors, and authorized third parties with access to {{q1.1}} systems and data.

## Compliance Framework
This policy is designed to satisfy the Security Trust Services Criteria of the SOC 2 framework and supports the organization's compliance objectives.`,
    },
    {
      id: 'isp-roles',
      title: 'Roles and Responsibilities',
      type: 'static',
      content: `# Roles and Responsibilities

## Security Leadership
{{q3.1}}. The security lead is responsible for:

- Overseeing the information security program
- Approving security policies and standards
- Ensuring adequate resources for security initiatives
- Reporting security posture to executive leadership

## Engineering Team
The engineering team of {{q3.2}} engineers is responsible for:

- Implementing security controls in application code and infrastructure
- Following secure development practices
- Participating in security reviews and incident response

## Departmental Responsibilities
The following departments share responsibility for information security within their domains:

{{q3.5}}

Each department head is responsible for ensuring compliance with this policy within their area of operations.

## All Personnel
All employees and contractors are responsible for:

- Complying with this policy and related security procedures
- Reporting security incidents and suspected vulnerabilities
- Completing required security awareness training
- Protecting credentials and access tokens`,
    },
    {
      id: 'isp-access-control',
      title: 'Access Control',
      type: 'ai_generate',
      content: `Write a formal "Access Control" section for an Information Security Policy for {{q1.1}}.
Current access control practices:
- MFA status: {{q4_1.mfa}}
- SSO status: {{q4_1.sso}}
- Unique accounts: {{q4_1.unique_accounts}}
- Access levels: {{q4_1.access_levels}}
- Access reviews: {{q4_1.access_reviews}}
- Onboarding process: {{q4_2_onboarding}}
- Offboarding process: {{q4_2_offboarding}}
Write 3-4 paragraphs in formal compliance language describing the access control requirements and procedures.`,
    },
    {
      id: 'isp-data-protection',
      title: 'Data Protection',
      type: 'ai_generate',
      content: `Write a formal "Data Protection" section for an Information Security Policy for {{q1.1}}.
Current data protection practices:
- Encryption at rest: {{q4_3.encrypted_at_rest}}
- Encryption in transit: {{q4_3.encrypted_in_transit}}
- Data classification: {{q4_3.classification}}
- Data deletion procedures: {{q4_3.deletion}}
- Data types handled: {{q2_4}}
Write 3-4 paragraphs in formal compliance language describing data protection requirements.`,
    },
    {
      id: 'isp-incident-response',
      title: 'Incident Response',
      type: 'ai_generate',
      content: `Write a formal "Incident Response" section for an Information Security Policy for {{q1.1}}.
Current incident response posture:
- Incident response plan: {{q4_4_plan}}
- Plan last updated: {{q4_4_last_updated}}
- Previous incidents: {{q4_4_had_incident}}
- Post-incident review: {{q4_4_post_review}}
Write 2-3 paragraphs in formal compliance language summarizing the incident response requirements.`,
    },
    {
      id: 'isp-change-management',
      title: 'Change Management',
      type: 'ai_generate',
      content: `Write a formal "Change Management" section for an Information Security Policy for {{q1.1}}.
Current change management practices:
- Change approval process: {{q4_7_approval}}
- Audit trail: {{q4_7_audit_trail}}
- Code review: {{q2_5.Code Review / PR}}
- Automated tests: {{q2_5.Automated Tests}}
- Staging environment: {{q2_5.Staging Environment}}
Write 2-3 paragraphs in formal compliance language describing change management requirements.`,
    },
    {
      id: 'isp-review',
      title: 'Review and Updates',
      type: 'static',
      content: `# Review and Updates

## Policy Review Frequency
This policy shall be reviewed {{q6_3}} by the security lead and updated as necessary to reflect changes in the organization's risk profile, regulatory requirements, or business operations.

## Review Process
The policy review process includes:

1. Assessment of current threats and vulnerabilities
2. Evaluation of the effectiveness of existing controls
3. Identification of necessary updates or additions
4. Approval by security leadership
5. Communication of changes to all affected personnel

## Version Control
All changes to this policy are tracked with version numbers, dates, and descriptions of modifications. Previous versions are retained for audit purposes.

## Document Approval
This policy is approved by the security lead and reviewed by executive leadership. Approval dates and signatures are maintained in the organization's compliance management system.`,
    },
  ],
};
