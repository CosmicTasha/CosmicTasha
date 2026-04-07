import type { ComplianceTemplate } from '../../types';

export const acceptableUsePolicyTemplate: ComplianceTemplate = {
  id: 'acceptable-use-policy',
  name: 'Acceptable Use Policy',
  tsc: ['CC1.4', 'CC2.1'],
  auditRisk: 'low',
  sections: [
    {
      title: 'Purpose and Scope',
      type: 'interpolate',
      template:
        'This Acceptable Use Policy defines the acceptable use of {{companyName}} information systems, networks, and data by all {{employeeCount}} employees, contractors, and authorized third parties. ' +
        'This policy covers all company-provided and personal devices used to access organizational systems. ' +
        'All personnel must acknowledge this policy upon onboarding and annually thereafter.',
    },
    {
      title: 'Acceptable and Prohibited Use',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the acceptable and prohibited use section of an Acceptable Use Policy for SOC 2. ' +
          'Maps to TSC CC1.4 (demonstrates commitment to attract, develop, and retain competent individuals) and CC2.1 (generates and uses relevant information). ' +
          'This is a low-risk audit document — auditors check it exists and is acknowledged by employees. ' +
          'Focus on clarity and practicality rather than exhaustive legalistic language.',
        instruction:
          'Write acceptable and prohibited use rules covering: ' +
          '(1) acceptable use of company systems and data, ' +
          '(2) prohibited activities (unauthorized access, data exfiltration, malicious software, circumventing controls), ' +
          '(3) personal use guidelines, ' +
          '(4) monitoring and enforcement (the company reserves the right to monitor), ' +
          '(5) consequences of policy violations.',
        requiredContext: ['workplaceModel', 'endpointManagement'],
      },
    },
  ],
};
