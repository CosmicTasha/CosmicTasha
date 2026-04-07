import type { ComplianceTemplate } from '../../types';

export const securityAwarenessTrainingTemplate: ComplianceTemplate = {
  id: 'security-awareness-training',
  name: 'Security Awareness Training Program',
  tsc: ['CC1.4', 'CC2.2'],
  auditRisk: 'low',
  sections: [
    {
      title: 'Program Overview',
      type: 'interpolate',
      template:
        '{{companyName}} maintains a security awareness training program for all {{employeeCount}} employees and contractors. ' +
        'Training is required upon onboarding and {{trainingFrequency}} thereafter. ' +
        'The program is managed by {{securityOwner}} and covers topics relevant to the organization\'s security posture and SOC 2 compliance obligations.',
    },
    {
      title: 'Training Content and Delivery',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the training content and delivery section of a Security Awareness Training program for SOC 2. ' +
          'Maps to TSC CC1.4 (commitment to competence) and CC2.2 (internal communication). ' +
          'Auditors verify training is completed — they check completion records, not the curriculum itself. ' +
          'Common finding: training program exists but no evidence of completion tracking.',
        instruction:
          'Write training content and delivery procedures covering: ' +
          '(1) required training topics (phishing, social engineering, password hygiene, data handling, incident reporting), ' +
          '(2) delivery methods (online modules, live sessions, simulated phishing), ' +
          '(3) completion tracking and compliance monitoring, ' +
          '(4) consequences for non-completion, ' +
          '(5) specialized training for engineers and administrators.',
        requiredContext: ['trainingFrequency', 'trainingTopics', 'employeeCount'],
      },
    },
  ],
};
