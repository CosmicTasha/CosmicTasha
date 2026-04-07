import type { ComplianceTemplate } from '../../types';

export const accessReviewTemplatesTemplate: ComplianceTemplate = {
  id: 'access-review-templates',
  name: 'Access Review Templates',
  tsc: ['CC6.1', 'CC6.2', 'CC6.3'],
  auditRisk: 'low',
  sections: [
    {
      title: 'Review Schedule and Scope',
      type: 'interpolate',
      template:
        'Access reviews at {{companyName}} are conducted {{accessReviewCadence}} for all systems and applications. ' +
        'Reviews cover all {{employeeCount}} employees, contractors, and service accounts. ' +
        'The review is owned by {{accessReviewOwner}} with department managers certifying access for their direct reports. ' +
        'Systems in scope: {{cloudProviders}} infrastructure, identity provider ({{ssoProvider}}), and all SaaS applications.',
    },
    {
      title: 'Review Process and Templates',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the access review process and templates section for SOC 2 compliance. ' +
          'Maps to TSC CC6.1 (logical access security), CC6.2 (issuing credentials), CC6.3 (modifying access). ' +
          'Auditors care about evidence of reviews being performed, not the template itself. ' +
          'Common finding: access reviews scheduled but evidence shows they were not completed on time.',
        instruction:
          'Write the access review process and templates covering: ' +
          '(1) step-by-step review process (export user list, manager certification, remediation, sign-off), ' +
          '(2) quarterly review checklist template, ' +
          '(3) offboarding access revocation checklist, ' +
          '(4) escalation procedures for unresponsive reviewers, ' +
          '(5) documentation and evidence retention requirements.',
        requiredContext: ['accessReviewCadence', 'accessReviewOwner', 'offboardingProcess'],
      },
    },
  ],
};
