import type { ComplianceTemplate } from '../../types';

export const riskAssessmentTemplate: ComplianceTemplate = {
  id: 'risk-assessment',
  name: 'Risk Assessment',
  tsc: ['CC3.1', 'CC3.2', 'CC3.3', 'CC3.4'],
  auditRisk: 'medium',
  sections: [
    {
      title: 'Purpose and Methodology',
      type: 'interpolate',
      template:
        'This Risk Assessment documents the risk identification, analysis, and treatment process for {{companyName}}. ' +
        'The assessment covers all systems and data processed by the organization, including infrastructure hosted on {{cloudProviders}}. ' +
        'Risk assessments are conducted {{riskAssessmentFrequency}} and whenever significant changes occur to the system or operating environment. ' +
        'The methodology uses a {{riskMethodology}} approach to evaluate likelihood and impact of identified risks.',
    },
    {
      title: 'Risk Identification and Analysis',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the risk identification and analysis section of a Risk Assessment for SOC 2. ' +
          'Maps to TSC CC3.1 (specifies objectives), CC3.2 (identifies risks), CC3.3 (considers potential for fraud). ' +
          'Auditors verify that risks are identified systematically, not ad hoc. The methodology matters more than the specific risks listed. ' +
          'Include risk categories appropriate to the company size and industry.',
        instruction:
          'Write risk identification and analysis procedures covering: ' +
          '(1) risk categories (operational, technical, compliance, strategic), ' +
          '(2) risk identification sources and methods, ' +
          '(3) likelihood and impact scoring criteria, ' +
          '(4) risk register structure and example entries relevant to the company profile, ' +
          '(5) fraud risk considerations per CC3.3.',
        requiredContext: ['industry', 'cloudProviders', 'dataTypes', 'employeeCount', 'riskMethodology'],
      },
      reviewTag: true,
    },
    {
      title: 'Risk Treatment and Monitoring',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the risk treatment and monitoring section of a Risk Assessment for SOC 2. ' +
          'Maps to TSC CC3.4 (identifies and assesses changes that could impact internal controls). ' +
          'Auditors verify that identified risks have documented treatment plans with owners and timelines. ' +
          'Common finding: risks identified but no treatment plan or risk owner assigned.',
        instruction:
          'Write risk treatment and monitoring procedures covering: ' +
          '(1) treatment options (mitigate, accept, transfer, avoid), ' +
          '(2) treatment plan requirements (owner, timeline, residual risk), ' +
          '(3) risk monitoring and reporting cadence, ' +
          '(4) triggers for reassessment (significant changes, incidents, new threats).',
        requiredContext: ['riskAssessmentFrequency', 'riskOwnership', 'securityOwner'],
      },
    },
  ],
};
