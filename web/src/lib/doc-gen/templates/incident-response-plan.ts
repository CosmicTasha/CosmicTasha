import type { DocTemplate } from '../types';

export const incidentResponsePlanTemplate: DocTemplate = {
  id: 'incident-response-plan',
  name: 'Incident Response Plan',
  priority: 1,
  tscCriteria: ['CC7.1', 'CC7.2', 'CC7.3', 'CC7.4', 'CC7.5'],
  sections: [
    {
      id: 'irp-purpose',
      title: 'Purpose and Scope',
      type: 'static',
      content: `# Purpose and Scope

## Purpose
This Incident Response Plan establishes procedures for detecting, responding to, and recovering from security incidents that affect {{q1.1}} and its information systems. The plan ensures a coordinated and effective response to minimize the impact of security incidents on business operations, data integrity, and customer trust.

## Scope
This plan covers all security incidents affecting:

- Production systems hosted on {{q2_1}}
- Data types including {{q2_4}}
- All SaaS tools and third-party services used by the organization
- Employee workstations and mobile devices

## Applicability
This plan applies to all {{q1.3}} employees, contractors, and third-party service providers. The security lead ({{q3.1}}) is the primary owner of this plan and is responsible for its execution and maintenance.`,
    },
    {
      id: 'irp-classification',
      title: 'Incident Classification',
      type: 'ai_generate',
      reviewRequired: true,
      content: `Write a formal "Incident Classification" section for an Incident Response Plan for {{q1.1}}.
The company handles these data types: {{q2_4}}.
Current incident response plan status: {{q4_4_plan}}.
They have {{q1.3}} employees and serve {{q1.5}} customers.
Define P0 (Critical), P1 (High), P2 (Medium), and P3 (Low) severity levels with specific examples relevant to their data types and industry.
Include response time targets for each severity level.
Write in formal compliance language.`,
    },
    {
      id: 'irp-detection',
      title: 'Detection and Reporting',
      type: 'ai_generate',
      content: `Write a formal "Detection and Reporting" section for an Incident Response Plan for {{q1.1}}.
Current monitoring and detection capabilities:
- Centralized logging: {{q4_9_logging}}
- Alerting configured: {{q4_9_alerts}}
- Log retention: {{q4_9_retention}}
- Monitoring tools: {{q2_3_monitoring}}
- Vulnerability scanning: {{q4_6_scanning}}
Write 3-4 paragraphs covering detection mechanisms, reporting channels, initial triage procedures, and escalation criteria.`,
    },
    {
      id: 'irp-response',
      title: 'Response Procedures',
      type: 'ai_generate',
      reviewRequired: true,
      content: `Write a formal "Response Procedures" section for an Incident Response Plan for {{q1.1}}.
Security ownership: {{q3.1}}.
Engineering team size: {{q3.2}}.
Work model: {{q3.3}}.
Has contractors: {{q3.4}}.
Current incident plan status: {{q4_4_plan}}.
Define step-by-step response procedures including containment, eradication, and recovery phases.
Include role assignments and communication protocols.
Write in formal compliance language with actionable steps.`,
    },
    {
      id: 'irp-communication',
      title: 'Communication Plan',
      type: 'ai_generate',
      reviewRequired: true,
      content: `Write a formal "Communication Plan" section for an Incident Response Plan for {{q1.1}}.
The company serves {{q1.5}} customers.
Communication tools: {{q2_3_communication}}.
Team size: {{q1.3}} employees.
Data types handled: {{q2_4}}.
Define internal and external communication procedures during an incident, including:
- Internal notification chains
- Customer notification requirements and timelines
- Regulatory notification requirements (if applicable)
- Public communication guidelines
Write in formal compliance language.`,
    },
    {
      id: 'irp-post-incident',
      title: 'Post-Incident Review',
      type: 'static',
      content: `# Post-Incident Review

## Post-Incident Review Process
Following the resolution of any P0 or P1 incident, {{q1.1}} conducts a post-incident review (PIR) within 5 business days.

**Current practice:** {{q4_4_post_review}}

## Review Components
Each post-incident review includes:

1. **Timeline reconstruction** - Detailed chronology of the incident from detection to resolution
2. **Root cause analysis** - Identification of the underlying cause(s) of the incident
3. **Impact assessment** - Quantification of the business and data impact
4. **Response evaluation** - Assessment of the effectiveness of the response
5. **Remediation actions** - Specific actions to prevent recurrence, with assigned owners and deadlines
6. **Lessons learned** - Documentation of key takeaways for the team

## Documentation
All post-incident reviews are documented and retained for a minimum of 3 years. Reports are shared with the security lead, engineering leadership, and relevant stakeholders.

## Trend Analysis
The security lead conducts quarterly reviews of incident data to identify trends, recurring issues, and areas requiring additional investment in controls or training.`,
    },
    {
      id: 'irp-testing',
      title: 'Testing and Maintenance',
      type: 'static',
      content: `# Testing and Maintenance

## Plan Testing
This Incident Response Plan is tested at least annually through:

- **Tabletop exercises** - Simulated incident scenarios with the response team
- **Technical drills** - Hands-on exercises testing specific response procedures
- **Communication tests** - Verification of notification chains and contact information

## Plan Maintenance
This plan is reviewed and updated:

- {{q6_3}} as part of the regular policy review cycle
- After any significant security incident
- When significant changes are made to the system architecture or infrastructure
- When there are changes in personnel with incident response responsibilities

## Training
All personnel with incident response roles receive training on their responsibilities under this plan. New team members receive incident response training within 30 days of joining the organization.

## Version History
All changes to this plan are tracked with version numbers, dates, and descriptions of modifications.`,
    },
  ],
};
