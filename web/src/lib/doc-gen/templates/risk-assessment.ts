import type { DocTemplate } from '../types';

export const riskAssessmentTemplate: DocTemplate = {
  id: 'risk-assessment',
  name: 'Risk Assessment',
  priority: 2,
  tscCriteria: ['CC3.1', 'CC3.2', 'CC3.3', 'CC3.4'],
  sections: [
    {
      id: 'ra-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This Risk Assessment documents the process by which {{q1.1}} identifies, analyzes, and manages risks to the achievement of its objectives. This document satisfies the requirements of SOC 2 Trust Services Criteria CC3.1 through CC3.4 and provides a structured framework for ongoing risk management.`,
    },
    {
      id: 'ra-scope',
      title: 'Scope',
      type: 'static',
      content: `# Scope

This risk assessment covers all systems, processes, and data within the SOC 2 audit boundary for {{q1.1}}.

## Systems in Scope
{{q5_2_systems}}

## Data Types
{{q2_4}}

The assessment addresses risks to the confidentiality, integrity, and availability of the data and systems described above.`,
    },
    {
      id: 'ra-methodology',
      title: 'Risk Methodology',
      type: 'ai_generate',
      content: `Write a formal Risk Assessment Methodology section for {{q1.1}}.
Describe a risk methodology appropriate for a {{q1.3}}-person company in the {{q1.5}} sector.
Include: risk identification techniques, likelihood and impact scoring criteria (use a 5x5 matrix), risk appetite statement, and roles responsible for risk oversight.
The security lead is: {{q3.1}}.
Write 3-4 paragraphs in formal compliance language.`,
    },
    {
      id: 'ra-risk-register',
      title: 'Risk Register',
      type: 'ai_generate',
      content: `Generate a Risk Register for {{q1.1}} based on the following context:
The company does: {{q1.4}}.
Risk management approach: {{q4_1}}.
Disaster recovery plan: {{q4_4_plan}}.
Backup strategy: {{q4_5_backups}}.
Data types processed: {{q2_4}}.
Cloud providers: {{q2_1}}.
Format the output as a markdown table with columns: Risk ID, Risk Description, Category (Operational/Technical/Compliance/Strategic), Likelihood (1-5), Impact (1-5), Risk Score, Mitigation Controls, Risk Owner.
Include at least 8-10 risks covering infrastructure, data, personnel, vendor, and compliance categories.`,
      reviewRequired: true,
    },
    {
      id: 'ra-treatment-plan',
      title: 'Risk Treatment Plan',
      type: 'ai_generate',
      content: `Write a Risk Treatment Plan section for {{q1.1}}.
Describe the four treatment options (Accept, Mitigate, Transfer, Avoid) and when each is appropriate.
Reference the company's existing controls: risk approach {{q4_1}}, backup strategy {{q4_5_backups}}, and DR plan {{q4_4_plan}}.
Include a treatment decision framework and escalation path.
The security lead is: {{q3.1}}.
Write 2-3 paragraphs in formal compliance language.`,
    },
    {
      id: 'ra-review-schedule',
      title: 'Review Schedule',
      type: 'static',
      content: `# Review Schedule

## Review Cadence
{{q6_3}}

## Review Activities
The following activities are performed as part of each risk assessment review cycle:

1. Re-evaluation of all risks in the risk register
2. Identification of new risks based on changes to systems, processes, or the threat landscape
3. Assessment of the effectiveness of existing mitigation controls
4. Update of risk scores based on new information or changed conditions
5. Documentation of any changes to the risk treatment plan
6. Reporting of risk assessment results to management

## Triggers for Ad-Hoc Review
In addition to the scheduled review cadence, the risk assessment shall be updated upon:
- Major system or infrastructure changes
- Security incidents or near-misses
- Significant organizational changes
- Changes in regulatory or compliance requirements
- Introduction of new vendors or third-party services`,
    },
  ],
};
