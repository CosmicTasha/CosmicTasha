import type { ComplianceTemplate } from '../../types';

export const incidentResponsePlanTemplate: ComplianceTemplate = {
  id: 'incident-response-plan',
  name: 'Incident Response Plan',
  tsc: ['CC7.3', 'CC7.4', 'CC7.5', 'CC2.2'],
  auditRisk: 'high',
  sections: [
    {
      title: 'Purpose and Incident Classification',
      type: 'interpolate',
      template:
        'This Incident Response Plan establishes procedures for {{companyName}} to detect, respond to, and recover from security incidents. ' +
        'The plan applies to all systems hosted on {{cloudProviders}} and all {{employeeCount}} personnel. ' +
        'Security leadership: {{securityOwner}}. ' +
        'Incidents are classified as: Severity 1 (Critical) — active data breach or system compromise; ' +
        'Severity 2 (High) — confirmed unauthorized access, service outage; ' +
        'Severity 3 (Medium) — suspicious activity, policy violation; ' +
        'Severity 4 (Low) — failed attacks, minor anomalies.',
    },
    {
      title: 'Detection, Response, and Escalation',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the detection and response procedures for an Incident Response Plan under SOC 2. ' +
          'Maps to TSC CC7.3 (evaluates security events) and CC7.4 (responds to identified incidents). ' +
          'Auditors actively test IR procedures — the most common finding is "plan exists but does not match actual practice." ' +
          'Be specific about monitoring tools, escalation paths, and response timelines.',
        instruction:
          'Write detection, response, and escalation procedures covering: ' +
          '(1) detection sources and monitoring tools, (2) initial triage and classification steps, ' +
          '(3) escalation matrix with response time targets per severity, ' +
          '(4) containment and eradication procedures, (5) communication requirements during an incident.',
        requiredContext: ['monitoringTools', 'incidentResponseTeam', 'communicationChannels', 'responseTimeSLAs'],
      },
      reviewTag: true,
    },
    {
      title: 'Recovery and Post-Incident Review',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the recovery and post-incident review section of an Incident Response Plan for SOC 2. ' +
          'Maps to TSC CC7.5 (recovery from identified incidents) and CC2.2 (internal communication). ' +
          'Auditors look for evidence of post-incident reviews and documented lessons learned. ' +
          'Common finding: no evidence of post-incident reviews being conducted.',
        instruction:
          'Write recovery and post-incident procedures covering: ' +
          '(1) system recovery and restoration steps, (2) post-incident review process and timeline, ' +
          '(3) root cause analysis methodology, (4) lessons learned documentation and distribution, ' +
          '(5) plan update triggers based on incident findings.',
        requiredContext: ['backupStrategy', 'recoveryObjectives', 'postIncidentReviewProcess'],
      },
      reviewTag: true,
    },
    {
      title: 'Testing and Plan Maintenance',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the testing and maintenance section of an Incident Response Plan for SOC 2. ' +
          'Auditors verify the plan is tested regularly — an untested plan is treated as no plan. ' +
          'Reference CC7.4 and A1.3 (testing of recovery procedures).',
        instruction:
          'Write testing and maintenance procedures covering: ' +
          '(1) tabletop exercise schedule and format, (2) simulation/drill requirements, ' +
          '(3) plan review and update cadence, (4) training requirements for the incident response team.',
        requiredContext: ['irTestingSchedule', 'irTrainingRequirements'],
      },
    },
  ],
};
