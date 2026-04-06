import type { DocTemplate } from '../types';

export const auditLogProceduresTemplate: DocTemplate = {
  id: 'audit-log-procedures',
  name: 'Audit Log Procedures',
  priority: 3,
  tscCriteria: ['CC7.1', 'CC7.2'],
  sections: [
    {
      id: 'alp-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This document defines the procedures for audit logging across {{q1.1}}'s information systems. Audit logs provide a chronological record of system activities, user actions, and security-relevant events. These procedures ensure that logs are generated, protected, retained, and reviewed in a manner that supports security monitoring, incident investigation, and compliance with SOC 2 Trust Services Criteria.`,
    },
    {
      id: 'alp-scope',
      title: 'Scope',
      type: 'static',
      content: `# Scope

These procedures apply to all information systems within the SOC 2 audit boundary, including:

{{q5_2_systems}}

All production systems, supporting infrastructure, identity providers, and SaaS tools that process, store, or transmit data covered by the organization's compliance obligations are in scope for audit logging.`,
    },
    {
      id: 'alp-log-requirements',
      title: 'Log Requirements',
      type: 'ai_generate',
      content: `Write an "Audit Log Requirements" section for {{q1.1}}'s Audit Log Procedures.
Their infrastructure includes cloud providers: {{q2_1}}, architecture type: {{q2_2}}.
Their monitoring tools include: {{q2_3_monitoring}}.
Describe what events must be logged (authentication, authorization, data access, configuration changes, admin actions, errors), the required log fields (timestamp, actor, action, resource, result, source IP), and format requirements. Write 3-4 paragraphs in formal compliance language.`,
    },
    {
      id: 'alp-retention-policy',
      title: 'Retention Policy',
      type: 'static',
      content: `# Retention Policy

Audit logs are retained in accordance with {{q1.1}}'s data retention requirements and applicable regulatory obligations.

**Retention Period:** {{q4_9_retention}}

Logs must be retained in a tamper-evident, immutable storage mechanism for the duration of the retention period. Upon expiration of the retention period, logs are securely deleted in accordance with the organization's data disposal procedures.

Retention periods are reviewed annually as part of the organization's policy review cycle to ensure alignment with evolving compliance requirements and business needs.`,
      reviewRequired: true,
    },
    {
      id: 'alp-log-protection',
      title: 'Log Protection',
      type: 'ai_generate',
      content: `Write a "Log Protection" section for {{q1.1}}'s Audit Log Procedures.
Their infrastructure runs on {{q2_1}} with monitoring via {{q2_3_monitoring}}.
Describe how audit logs are protected from tampering, unauthorized access, and deletion. Cover: access controls on log storage, encryption at rest and in transit, separation of duties (log producers vs. log administrators), integrity verification, and backup procedures. Write 2-3 paragraphs in formal compliance language.`,
    },
    {
      id: 'alp-review-procedures',
      title: 'Review Procedures',
      type: 'ai_generate',
      content: `Write a "Log Review Procedures" section for {{q1.1}}'s Audit Log Procedures.
The company has {{q1.3}} employees and {{q3.2}} engineers. Security ownership: {{q3.1}}.
Describe the cadence and process for reviewing audit logs — daily automated review, weekly manual review, and ad-hoc investigation triggers. Scale the review process appropriately for the company size. Include who is responsible for reviews and how findings are escalated. Write 2-3 paragraphs in formal compliance language.`,
    },
    {
      id: 'alp-alerting',
      title: 'Alerting',
      type: 'static',
      content: `# Alerting

{{q1.1}} maintains automated alerting on audit log data to detect security-relevant events in near real-time. Alerting is configured through: {{q4_9_alerts}}.

Alert categories include:

- **Authentication Anomalies:** Multiple failed login attempts, logins from unusual locations or devices, brute-force patterns
- **Privilege Escalation:** Unauthorized role changes, elevated access grants, admin account creation
- **Data Access Anomalies:** Bulk data exports, access to sensitive resources outside normal patterns
- **Configuration Changes:** Modifications to security controls, firewall rules, IAM policies, or logging configurations
- **System Health:** Log ingestion failures, agent disconnections, or gaps in log coverage

Alerts are routed to the security owner ({{q3.1}}) and the on-call responder. All alerts are triaged, investigated, and documented per the organization's incident response procedures.`,
    },
    {
      id: 'alp-tools',
      title: 'Tools',
      type: 'static',
      content: `# Logging and Monitoring Tools

{{q1.1}} uses the following tools for log collection, aggregation, analysis, and alerting:

**Monitoring and Observability:** {{q2_3_monitoring}}

These tools are configured to:

- Collect logs from all in-scope systems and services
- Normalize log formats for consistent querying and analysis
- Provide dashboards for real-time visibility into system activity
- Support search and filtering for incident investigation
- Generate automated alerts based on predefined detection rules
- Retain logs in compliance with the organization's retention policy

Access to logging and monitoring tools is restricted to authorized personnel based on the principle of least privilege.`,
    },
  ],
};
