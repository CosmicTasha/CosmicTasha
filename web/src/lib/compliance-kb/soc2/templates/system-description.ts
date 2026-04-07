import type { ComplianceTemplate } from '../../types';

export const systemDescriptionTemplate: ComplianceTemplate = {
  id: 'system-description',
  name: 'System Description',
  tsc: ['CC1.1', 'CC1.2', 'CC1.3', 'CC1.4', 'CC2.1'],
  auditRisk: 'critical',
  sections: [
    {
      title: 'Company Overview',
      type: 'interpolate',
      template:
        '{{companyName}} is a {{industry}} company founded in {{foundedYear}} with approximately {{employeeCount}} employees. ' +
        'The organization provides {{productDescription}} and is headquartered in {{headquarters}}. ' +
        '{{companyName}} serves customers in the {{targetMarkets}} market segment(s).',
    },
    {
      title: 'Services and Principal Service Commitments',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing a SOC 2 system description per AICPA Description Criteria (DC 200). ' +
          'Auditors read this section first and test every subsequent control against it. ' +
          'Use precise, formal compliance language. Only describe services the company actually provides. ' +
          'Reference TSC CC1.1 (control environment) and CC1.2 (board oversight).',
        instruction:
          'Describe the principal service commitments and system requirements. ' +
          'Include the services provided to user entities, the commitments made in service-level agreements, ' +
          'and the system requirements that support those commitments. ' +
          'Organize into: (1) principal services offered, (2) service-level commitments, (3) system requirements.',
        requiredContext: ['productDescription', 'serviceCommitments', 'slaTerms', 'targetMarkets'],
      },
      reviewTag: true,
    },
    {
      title: 'System Boundaries and Infrastructure',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the system boundaries section of a SOC 2 system description per DC 200. ' +
          'Auditors use this to determine what is in scope for testing. ' +
          'Be specific about infrastructure components — vague descriptions trigger auditor inquiries. ' +
          'Reference TSC CC1.3 (management establishes structures and reporting lines).',
        instruction:
          'Describe the system boundaries, infrastructure components, and data flows. ' +
          'Include: (1) cloud providers and regions, (2) key infrastructure services, ' +
          '(3) network architecture and segmentation, (4) data flow diagrams in prose form, ' +
          '(5) what is explicitly out of scope.',
        requiredContext: ['cloudProviders', 'deploymentPipeline', 'networkArchitecture', 'environments'],
      },
      reviewTag: true,
    },
    {
      title: 'People and Organizational Structure',
      type: 'interpolate',
      template:
        '{{companyName}} employs {{employeeCount}} personnel, including {{engineeringCount}} engineers. ' +
        'Security leadership is held by {{securityOwner}}. ' +
        'The organization operates as a {{workplaceModel}} workplace. ' +
        'Key functional areas supporting the system include: {{departments}}. ' +
        'Third-party contractors: {{contractorPolicy}}.',
    },
    {
      title: 'Relevant Aspects of the Control Environment',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the control environment section of a SOC 2 system description per DC 200. ' +
          'This section must address CC1.4 (commitment to competence) and CC2.1 (information and communication). ' +
          'Auditors evaluate whether the organization demonstrates a commitment to integrity, ethical values, ' +
          'and competence. Reference specific organizational controls, not aspirational statements.',
        instruction:
          'Describe the relevant aspects of the control environment including: ' +
          '(1) management philosophy and operating style, (2) organizational structure and assignment of authority, ' +
          '(3) human resource policies and practices, (4) integrity and ethical values, ' +
          '(5) commitment to competence (hiring, training, evaluation).',
        requiredContext: ['securityOwner', 'hrPolicies', 'trainingProgram', 'codeOfConduct'],
      },
      reviewTag: true,
    },
  ],
};
