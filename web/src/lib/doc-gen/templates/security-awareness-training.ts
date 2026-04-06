import type { DocTemplate } from '../types';

export const securityAwarenessTrainingTemplate: DocTemplate = {
  id: 'security-awareness-training',
  name: 'Security Awareness Training Program',
  priority: 3,
  tscCriteria: ['CC1.4'],
  sections: [
    {
      id: 'sat-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This document defines the Security Awareness Training Program for {{q1.1}}. The program ensures that all personnel understand their security responsibilities, recognize common threats, and follow established policies and procedures to protect the organization's information systems and data.`,
    },
    {
      id: 'sat-training-requirements',
      title: 'Training Requirements',
      type: 'ai_generate',
      content: `Write a "Training Requirements" section for {{q1.1}}'s Security Awareness Training Program.
The company has {{q1.3}} employees.
Describe the training cadence (onboarding, annual refresher, ad-hoc), completion expectations, and how the program scales for an organization of this size. Use formal compliance language. Write 2-3 paragraphs.`,
    },
    {
      id: 'sat-training-topics',
      title: 'Training Topics',
      type: 'static',
      content: `# Training Topics

The Security Awareness Training Program covers the following core topics:

- **Phishing and Social Engineering:** Recognizing phishing emails, vishing, smishing, pretexting, and other social engineering tactics
- **Password and Authentication Security:** Strong password creation, password manager usage, multi-factor authentication (MFA) requirements
- **Data Handling and Classification:** Proper handling, storage, transmission, and disposal of data according to classification levels
- **Incident Reporting:** How and when to report suspected security incidents, phishing attempts, or policy violations
- **Acceptable Use:** Overview of the Acceptable Use Policy and expectations for use of company systems
- **Physical Security:** Badge access, visitor policies, clean desk practices, and secure work areas
- **Remote Work Security:** Secure home office practices, VPN usage, and public Wi-Fi risks
- **Malware Prevention:** Recognizing and avoiding malware, ransomware, and other malicious software
- **Regulatory and Compliance Awareness:** Overview of applicable frameworks (SOC 2, etc.) and employee obligations`,
    },
    {
      id: 'sat-delivery-methods',
      title: 'Delivery Methods',
      type: 'ai_generate',
      content: `Write a "Delivery Methods" section for {{q1.1}}'s Security Awareness Training Program.
The company has {{q1.3}} employees and operates as a {{q3.3}} workplace.
Describe the training delivery methods (e.g., online modules, live sessions, simulated phishing campaigns, newsletters). Tailor recommendations to the company's size and work model. Write 2-3 paragraphs in formal compliance language.`,
    },
    {
      id: 'sat-tracking-compliance',
      title: 'Tracking and Compliance',
      type: 'static',
      content: `# Tracking and Compliance

{{q1.1}} maintains records of all security awareness training activities, including:

- Employee name and role
- Training module(s) completed
- Completion date
- Assessment score (where applicable)
- Acknowledgment of training completion

Training completion records are retained as evidence for SOC 2 audit purposes. Employees who fail to complete required training within the designated timeframe will be escalated to their manager and, if necessary, to the security owner ({{q3.1}}).

A minimum completion rate of 100% is expected for all mandatory training. Completion metrics are reviewed quarterly and reported to management.`,
    },
    {
      id: 'sat-specialized-training',
      title: 'Specialized Training',
      type: 'conditional',
      condition: (answers: Record<string, unknown>) => {
        const engineerCount = answers['q3.2'];
        return Number(engineerCount) > 0;
      },
      content: `# Specialized Training — Developer Security

In addition to general security awareness training, engineering personnel receive specialized training covering:

- **Secure Coding Practices:** OWASP Top 10, input validation, output encoding, and injection prevention
- **Dependency Management:** Identifying and remediating vulnerable dependencies, software composition analysis
- **Code Review Security:** Security-focused code review checklists and practices
- **Secrets Management:** Proper handling of API keys, tokens, and credentials; use of secrets management tools
- **CI/CD Pipeline Security:** Secure build configurations, artifact integrity, and deployment safeguards
- **Infrastructure as Code:** Security considerations for IaC templates and cloud resource provisioning

This specialized training is delivered annually and supplemented with hands-on exercises and security-focused engineering brown bags.`,
    },
    {
      id: 'sat-program-review',
      title: 'Program Review',
      type: 'static',
      content: `# Program Review

The Security Awareness Training Program is reviewed and updated on a regular basis to reflect emerging threats, changes in the regulatory landscape, and lessons learned from security incidents.

Program review activities include:

- Annual review of training content and delivery effectiveness
- Analysis of phishing simulation results and trends
- Incorporation of feedback from employees and management
- Updates based on changes to organizational policies, systems, or compliance requirements ({{q6_3}})

The security owner ({{q3.1}}) is responsible for overseeing the program review process and ensuring that training materials remain current and relevant.`,
    },
  ],
};
