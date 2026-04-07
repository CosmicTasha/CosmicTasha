import type { ComplianceTemplate } from '../../types';

export const auditLogProceduresTemplate: ComplianceTemplate = {
  id: 'audit-log-procedures',
  name: 'Audit Log Review Procedures',
  tsc: ['CC7.1', 'CC7.2'],
  auditRisk: 'low',
  sections: [
    {
      title: 'Purpose and Scope',
      type: 'interpolate',
      template:
        'These Audit Log Review Procedures establish the requirements for logging, monitoring, and reviewing security events at {{companyName}}. ' +
        'This policy applies to all systems hosted on {{cloudProviders}} and all SaaS applications processing organizational data. ' +
        'Log review is performed {{logReviewFrequency}} by {{securityOwner}} or designated personnel. ' +
        'Monitoring tools: {{monitoringTools}}.',
    },
    {
      title: 'Logging Requirements and Review Procedures',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the logging and review procedures section for SOC 2 compliance. ' +
          'Maps to TSC CC7.1 (detects and monitors for anomalies) and CC7.2 (evaluates anomalies for security events). ' +
          'Auditors verify this via log evidence, not the document itself — but the procedures must define what is logged and how it is reviewed. ' +
          'Common finding: logs collected but no evidence of periodic review.',
        instruction:
          'Write logging and review procedures covering: ' +
          '(1) required log sources (authentication, authorization, system changes, data access), ' +
          '(2) log retention period and protection requirements, ' +
          '(3) review procedures and frequency, ' +
          '(4) alerting rules for critical events (failed logins, privilege escalation, data export), ' +
          '(5) log integrity protection (tamper-evident storage).',
        requiredContext: ['monitoringTools', 'logRetentionPeriod', 'logReviewFrequency'],
      },
    },
  ],
};
