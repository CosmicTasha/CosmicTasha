import type { ComplianceTemplate } from '../../types';

export const bcDrPlanTemplate: ComplianceTemplate = {
  id: 'bc-dr-plan',
  name: 'Business Continuity & Disaster Recovery Plan',
  tsc: ['A1.2', 'A1.3', 'CC7.5'],
  auditRisk: 'medium',
  sections: [
    {
      title: 'Purpose and Recovery Objectives',
      type: 'interpolate',
      template:
        'This Business Continuity and Disaster Recovery Plan establishes procedures for {{companyName}} to maintain operations and recover from disruptive events. ' +
        'Recovery Time Objective (RTO): {{rtoTarget}}. Recovery Point Objective (RPO): {{rpoTarget}}. ' +
        'Primary infrastructure is hosted on {{cloudProviders}}. ' +
        'Backup strategy: {{backupStrategy}}. ' +
        'This plan is tested {{bcdrTestingSchedule}} and updated following each test or significant infrastructure change.',
    },
    {
      title: 'Recovery Strategies and Procedures',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the recovery strategies section of a BC/DR Plan for SOC 2. ' +
          'Maps to TSC A1.2 (recovery of infrastructure, software, and data) and CC7.5 (recovery from incidents). ' +
          'Auditors check backup evidence and verify that recovery procedures can meet stated RTO/RPO. ' +
          'Common finding: RTO/RPO stated but no evidence of testing whether they are achievable.',
        instruction:
          'Write recovery strategies and procedures covering: ' +
          '(1) infrastructure recovery procedures per cloud provider, ' +
          '(2) data restoration from backups, ' +
          '(3) application recovery sequence and dependencies, ' +
          '(4) communication plan during a disaster event, ' +
          '(5) roles and responsibilities during recovery.',
        requiredContext: ['cloudProviders', 'backupStrategy', 'rtoTarget', 'rpoTarget', 'environments'],
      },
      reviewTag: true,
    },
    {
      title: 'Testing and Plan Maintenance',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the testing and maintenance section of a BC/DR Plan for SOC 2. ' +
          'Maps to TSC A1.3 (tests recovery plan procedures). ' +
          'Auditors request evidence of BC/DR testing — an untested plan provides no assurance. ' +
          'Common finding: plan exists but has never been tested, or test results are not documented.',
        instruction:
          'Write testing and maintenance procedures covering: ' +
          '(1) testing types (tabletop, simulation, full failover) and schedule, ' +
          '(2) test documentation and success criteria, ' +
          '(3) plan update triggers and review cadence, ' +
          '(4) lessons learned integration from tests and actual incidents.',
        requiredContext: ['bcdrTestingSchedule', 'recoveryObjectives'],
      },
    },
  ],
};
