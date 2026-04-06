import type { DocTemplate } from '../types';

export const bcDrPlanTemplate: DocTemplate = {
  id: 'bc-dr-plan',
  name: 'Business Continuity & Disaster Recovery Plan',
  priority: 2,
  tscCriteria: ['A1.1', 'A1.2', 'A1.3'],
  sections: [
    {
      id: 'bcdr-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This Business Continuity and Disaster Recovery (BC/DR) Plan establishes the procedures and strategies that {{q1.1}} will follow to maintain critical business operations and recover from disruptive events. This plan satisfies the requirements of SOC 2 Trust Services Criteria A1.1 through A1.3 and ensures the organization can restore services within defined recovery objectives.`,
    },
    {
      id: 'bcdr-scope-objectives',
      title: 'Scope and Objectives',
      type: 'static',
      content: `# Scope and Objectives

## Scope
This plan covers all critical systems, infrastructure, and processes necessary for the continued operation of {{q1.1}}'s services.

## Recovery Objectives

### Downtime Impact Assessment
{{q4_5_downtime_impact}}

### Recovery Time Objective (RTO)
The maximum acceptable time to restore critical business functions following a disruption.

### Recovery Point Objective (RPO)
The maximum acceptable data loss measured in time, determined by backup frequency and data criticality.

## Plan Objectives
1. Minimize downtime and data loss during disruptive events
2. Ensure the safety of personnel during crisis situations
3. Maintain communication with customers, vendors, and stakeholders
4. Restore critical business operations within defined recovery objectives
5. Document lessons learned and improve resilience over time`,
    },
    {
      id: 'bcdr-bia',
      title: 'Business Impact Analysis',
      type: 'ai_generate',
      content: `Write a Business Impact Analysis (BIA) section for {{q1.1}}.
The company does: {{q1.4}}.
Downtime impact: {{q4_5_downtime_impact}}.
Systems in scope: {{q5_2_systems}}.
Data types: {{q2_4}}.
Headcount: {{q1.3}} employees.
Identify critical business functions, their dependencies, and the impact of disruption over time (1 hour, 4 hours, 24 hours, 72 hours).
Include a markdown table of critical functions with columns: Function, Dependencies, RTO, RPO, Impact of Loss.
Write in formal compliance language.`,
    },
    {
      id: 'bcdr-recovery-strategy',
      title: 'Recovery Strategy',
      type: 'ai_generate',
      content: `Write a Recovery Strategy section for {{q1.1}}.
Cloud providers: {{q2_1}}.
Backup strategy: {{q4_5_backups}}.
Backup location: {{q4_5_backup_location}}.
DR plan status: {{q4_4_plan}}.
Describe the recovery strategies for: infrastructure recovery, data restoration, application recovery, and communication systems.
Include specific recovery procedures referencing the cloud providers and backup approaches mentioned.
Write 3-4 paragraphs in formal compliance language with numbered recovery steps.`,
      reviewRequired: true,
    },
    {
      id: 'bcdr-backup-procedures',
      title: 'Backup Procedures',
      type: 'static',
      content: `# Backup Procedures

## Backup Strategy
{{q4_5_backups}}

## Backup Location
{{q4_5_backup_location}}

## Backup Schedule
Backups are performed according to the following schedule:
- **Database backups:** Daily automated snapshots with point-in-time recovery capability
- **Application configuration:** Version-controlled and backed up with each deployment
- **Infrastructure-as-code:** Stored in source control with full change history
- **File storage:** Continuous replication to backup location

## Backup Verification
- Backup completion is monitored and alerts are configured for failures
- Backup integrity is verified through periodic restoration tests
- Restoration procedures are documented and tested at least annually

## Backup Retention
Backups are retained in accordance with the organization's data retention policy and regulatory requirements.`,
    },
    {
      id: 'bcdr-communication-plan',
      title: 'Communication Plan',
      type: 'ai_generate',
      content: `Write a Crisis Communication Plan section for {{q1.1}}.
The security lead is: {{q3.1}}.
Headcount: {{q1.3}} employees.
Communication tools: {{q2_3_communication}}.
Describe the communication procedures during a business continuity event, including:
1. Internal escalation path and notification chain
2. Customer communication templates and timing
3. Vendor and partner notification procedures
4. Regulatory notification requirements (if applicable)
5. Post-incident communication and status updates
Write in formal compliance language with clear roles and timelines.`,
    },
    {
      id: 'bcdr-testing-schedule',
      title: 'Testing Schedule',
      type: 'static',
      content: `# Testing Schedule

## Test Types and Frequency

| Test Type | Frequency | Scope | Participants |
|-----------|-----------|-------|-------------|
| Tabletop Exercise | Semi-annually | Full BC/DR scenario walkthrough | Leadership, Security, Engineering |
| Backup Restoration Test | Quarterly | Verify backup integrity and restore procedures | Engineering, Operations |
| Failover Test | Annually | Infrastructure failover to backup systems | Engineering |
| Communication Test | Semi-annually | Verify notification chains and contact lists | All personnel |
| Full DR Simulation | Annually | End-to-end recovery of critical systems | All teams |

## Test Documentation
Each test shall produce a report documenting:
- Test date, type, and participants
- Objectives and success criteria
- Results and observations
- Issues identified and corrective actions
- Updates required to this plan`,
    },
    {
      id: 'bcdr-plan-maintenance',
      title: 'Plan Maintenance',
      type: 'static',
      content: `# Plan Maintenance

## Review Cadence
{{q6_3}}

## Maintenance Triggers
This plan shall be reviewed and updated upon:
- Completion of BC/DR tests (incorporating lessons learned)
- Significant changes to infrastructure, applications, or vendors
- Organizational changes affecting key personnel or roles
- Actual invocation of the BC/DR plan
- Changes in regulatory or contractual requirements

## Version Control
All changes to this plan are tracked with version numbers, change descriptions, and approval dates. The current version is maintained in the organization's document management system and distributed to all key personnel.

## Distribution
The plan is distributed to all personnel with BC/DR responsibilities. A copy is maintained in an off-site location accessible during a disruption of primary systems.`,
    },
  ],
};
