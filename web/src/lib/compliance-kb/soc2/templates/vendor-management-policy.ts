import type { ComplianceTemplate } from '../../types';

export const vendorManagementPolicyTemplate: ComplianceTemplate = {
  id: 'vendor-management-policy',
  name: 'Vendor Management Policy',
  tsc: ['CC9.2', 'CC3.4'],
  auditRisk: 'medium',
  sections: [
    {
      title: 'Purpose and Scope',
      type: 'interpolate',
      template:
        'This Vendor Management Policy establishes the requirements for evaluating, onboarding, monitoring, and offboarding third-party vendors at {{companyName}}. ' +
        'This policy applies to all vendors, subprocessors, and service providers who access, process, or store organizational data. ' +
        'Key vendors include: {{cloudProviders}} and SaaS tools used for {{saasCategories}}. ' +
        'Vendor reviews are conducted {{vendorReviewCadence}}.',
    },
    {
      title: 'Vendor Assessment and Due Diligence',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the vendor assessment section of a Vendor Management Policy for SOC 2. ' +
          'Maps to TSC CC9.2 (manages and assesses risk associated with vendors and business partners). ' +
          'Auditors verify that vendor risk assessments are performed and documented. ' +
          'Common finding: policy exists but no evidence of vendor security reviews being conducted.',
        instruction:
          'Write vendor assessment and due diligence procedures covering: ' +
          '(1) vendor risk classification criteria (critical, high, medium, low), ' +
          '(2) security assessment requirements per risk tier (SOC 2 report, security questionnaire, penetration test results), ' +
          '(3) contractual requirements (data processing agreements, BAAs, SLAs), ' +
          '(4) vendor onboarding approval workflow.',
        requiredContext: ['vendorReviewCadence', 'criticalVendors', 'dataProcessingAgreements'],
      },
      reviewTag: true,
    },
    {
      title: 'Ongoing Monitoring and Termination',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the ongoing monitoring and termination section of a Vendor Management Policy for SOC 2. ' +
          'Maps to TSC CC9.2 and CC3.4 (identifies changes that could impact controls). ' +
          'Auditors look for evidence of periodic vendor reviews, not just initial assessment. ' +
          'Common finding: vendors assessed at onboarding but never re-evaluated.',
        instruction:
          'Write ongoing monitoring and termination procedures covering: ' +
          '(1) periodic review schedule and scope per vendor risk tier, ' +
          '(2) monitoring for vendor security incidents and SOC 2 report updates, ' +
          '(3) vendor performance evaluation criteria, ' +
          '(4) vendor termination and data return/destruction procedures.',
        requiredContext: ['vendorReviewCadence', 'vendorTerminationProcess'],
      },
    },
  ],
};
