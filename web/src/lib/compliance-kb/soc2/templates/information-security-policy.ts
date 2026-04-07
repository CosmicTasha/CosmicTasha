import type { ComplianceTemplate } from '../../types';

export const informationSecurityPolicyTemplate: ComplianceTemplate = {
  id: 'information-security-policy',
  name: 'Information Security Policy',
  tsc: ['CC1.1', 'CC1.2', 'CC2.1', 'CC3.1', 'CC5.1', 'CC6.1'],
  auditRisk: 'critical',
  sections: [
    {
      title: 'Purpose and Scope',
      type: 'interpolate',
      template:
        'This Information Security Policy establishes the framework for protecting the confidentiality, integrity, and availability of information assets at {{companyName}}. ' +
        'This policy applies to all {{employeeCount}} employees, contractors, and third-party service providers who access, process, store, or transmit organizational data. ' +
        'The organization operates in the {{industry}} sector and processes {{dataTypes}} data.',
    },
    {
      title: 'Roles and Responsibilities',
      type: 'interpolate',
      template:
        'Security leadership is held by {{securityOwner}}, who is responsible for overseeing the information security program, approving security policies, and reporting security posture to executive leadership. ' +
        'The engineering team of {{engineeringCount}} engineers is responsible for implementing security controls in application code and infrastructure. ' +
        'Departments: {{departments}}. ' +
        'All personnel are responsible for complying with this policy, reporting security incidents, completing security awareness training, and protecting credentials.',
    },
    {
      title: 'Access Control Requirements',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the access control section of an Information Security Policy for SOC 2 compliance. ' +
          'This section maps to TSC CC6.1 (logical and physical access controls) and CC6.2 (prior to issuing credentials). ' +
          'Auditors test access controls more than any other area — be specific about MFA, SSO, RBAC, and access review cadence. ' +
          'Common audit finding: policy states controls exist but evidence shows otherwise.',
        instruction:
          'Write the access control requirements covering: (1) authentication standards (MFA, SSO, password policy), ' +
          '(2) authorization model (RBAC, least privilege), (3) access provisioning and deprovisioning, ' +
          '(4) access review frequency and process. Be prescriptive, not aspirational.',
        requiredContext: ['mfaStatus', 'ssoProvider', 'accessReviewCadence', 'onboardingProcess', 'offboardingProcess'],
      },
      reviewTag: true,
    },
    {
      title: 'Data Protection and Classification',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the data protection section of an Information Security Policy for SOC 2 compliance. ' +
          'Maps to TSC C1.1 (confidentiality commitments) and CC6.1. ' +
          'Auditors verify encryption at rest and in transit, data classification levels, and retention/disposal procedures. ' +
          'Reference the specific encryption standards and data handling practices the company uses.',
        instruction:
          'Write data protection requirements covering: (1) data classification levels and handling rules, ' +
          '(2) encryption requirements at rest and in transit, (3) data retention and disposal, ' +
          '(4) data loss prevention measures.',
        requiredContext: ['encryptionAtRest', 'encryptionInTransit', 'dataClassification', 'dataRetention', 'dataTypes'],
      },
      reviewTag: true,
    },
    {
      title: 'Policy Review and Maintenance',
      type: 'interpolate',
      template:
        'This policy shall be reviewed {{policyReviewFrequency}} by {{securityOwner}} and updated as necessary to reflect changes in the risk profile, regulatory requirements, or business operations. ' +
        'All changes are tracked with version numbers, dates, and descriptions. Previous versions are retained for audit purposes. ' +
        'This policy is approved by security leadership and reviewed by executive management.',
    },
  ],
};
