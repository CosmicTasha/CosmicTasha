import type { DocTemplate } from '../types';

export const vendorManagementPolicyTemplate: DocTemplate = {
  id: 'vendor-management-policy',
  name: 'Vendor Management Policy',
  priority: 2,
  tscCriteria: ['CC9.1', 'CC9.2'],
  sections: [
    {
      id: 'vmp-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This Vendor Management Policy establishes the framework for evaluating, selecting, monitoring, and managing third-party vendors and service providers engaged by {{q1.1}}. This policy ensures that vendor relationships do not introduce unacceptable risk to the organization's systems, data, or operations, in accordance with SOC 2 Trust Services Criteria CC9.1 and CC9.2.`,
    },
    {
      id: 'vmp-scope',
      title: 'Scope',
      type: 'static',
      content: `# Scope

This policy applies to all third-party vendors, service providers, and SaaS platforms that:

- Process, store, or transmit {{q1.1}} data
- Have access to {{q1.1}} systems or infrastructure
- Provide services that support critical business operations
- Are integrated into {{q1.1}}'s technology stack

All employees and contractors involved in vendor selection, contracting, or oversight are required to comply with this policy.`,
    },
    {
      id: 'vmp-assessment-criteria',
      title: 'Vendor Assessment Criteria',
      type: 'ai_generate',
      content: `Write a Vendor Assessment Criteria section for {{q1.1}}.
The company is in the {{q1.5}} sector with {{q1.3}} employees.
Data types processed: {{q2_4}}.
Describe the criteria for evaluating vendors across the following dimensions:
1. Security posture (SOC 2 reports, ISO 27001, penetration testing)
2. Data handling and privacy practices
3. Business continuity and disaster recovery capabilities
4. Financial stability and viability
5. Contractual requirements (SLAs, data processing agreements, liability)
6. Compliance with applicable regulations
Include a risk-tiering framework (Critical, High, Medium, Low) based on data access and business criticality.
Write in formal compliance language.`,
    },
    {
      id: 'vmp-vendor-inventory',
      title: 'Current Vendor Inventory',
      type: 'static',
      content: `# Current Vendor Inventory

[REVIEW] The following vendor inventory should be verified for completeness and accuracy.

| Category | Vendor/Platform | Purpose | Risk Tier |
|----------|----------------|---------|-----------|
| Identity & Access Management | {{q2_3_identity}} | Authentication and user management | Critical |
| Source Code Management | {{q2_3_source_code}} | Code repository and version control | Critical |
| CI/CD Pipeline | {{q2_3_cicd}} | Build, test, and deployment automation | High |
| Cloud Infrastructure | {{q2_1}} | Production hosting and compute | Critical |
| Monitoring & Observability | {{q2_3_monitoring}} | System monitoring and alerting | High |
| Communication | {{q2_3_communication}} | Internal team communication | Medium |
| Endpoint Management | {{q2_3_endpoint}} | Device management and security | High |

## Vendor Review Status
Each vendor listed above is subject to periodic review in accordance with its assigned risk tier:
- **Critical:** Annual SOC 2 report review, quarterly access review
- **High:** Annual security review, semi-annual access review
- **Medium:** Annual review of service terms and security posture
- **Low:** Review upon contract renewal`,
      reviewRequired: true,
    },
    {
      id: 'vmp-contractor-management',
      title: 'Contractor Management',
      type: 'conditional',
      condition: (answers) => {
        return (answers['q3.4'] as string) === 'Yes';
      },
      content: `# Contractor Management

## Contractor Onboarding
{{q1.1}} engages contractors and outsourced teams to supplement internal capabilities. All contractors are subject to the following vendor management requirements:

1. **Due Diligence:** Background checks and reference verification before engagement
2. **Contractual Controls:** Non-disclosure agreements, data processing agreements, and defined scope of access
3. **Access Provisioning:** Least-privilege access granted only to systems required for the engagement
4. **Security Training:** Completion of security awareness training before access is granted

## Contractor Monitoring
- Contractor access is reviewed monthly by the security lead
- Activity logs for contractor accounts are monitored for anomalous behavior
- Contractors are required to use approved devices and secure connections

## Contractor Offboarding
- Access is revoked within 4 hours of engagement termination
- All company data and assets must be returned or certified as destroyed
- Access revocation is verified by the security lead`,
    },
    {
      id: 'vmp-ongoing-monitoring',
      title: 'Ongoing Monitoring',
      type: 'ai_generate',
      content: `Write an Ongoing Vendor Monitoring section for {{q1.1}}.
The security lead is: {{q3.1}}.
Cloud providers: {{q2_1}}.
Describe the ongoing monitoring activities for vendors, including:
1. Periodic security review cadence by risk tier
2. SOC 2 report collection and review procedures
3. Incident notification requirements from vendors
4. Performance monitoring against SLAs
5. Annual vendor risk reassessment process
6. Procedures for handling vendor security incidents
Write in formal compliance language with clear responsibilities and timelines.`,
    },
    {
      id: 'vmp-termination',
      title: 'Termination Procedures',
      type: 'static',
      content: `# Vendor Termination Procedures

## Planned Termination
When a vendor relationship is terminated, the following steps shall be completed:

1. **Data Retrieval:** Export and verify all organizational data held by the vendor
2. **Data Deletion:** Request written confirmation of data destruction from the vendor
3. **Access Revocation:** Disable all API keys, integrations, and access credentials
4. **Contract Closure:** Fulfill all remaining contractual obligations
5. **Documentation:** Update the vendor inventory and risk register
6. **Transition:** Ensure replacement services are operational before final cutoff

## Emergency Termination
In the event of a vendor security incident or breach of contract:

1. Immediately revoke all access credentials and API keys
2. Disable integrations with the vendor's systems
3. Assess the impact on organizational data and operations
4. Invoke the Incident Response Plan if data breach is suspected
5. Engage legal counsel as appropriate
6. Document the termination and lessons learned`,
    },
  ],
};
