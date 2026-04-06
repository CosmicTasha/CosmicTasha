import type { DocTemplate } from '../types';

export const acceptableUsePolicyTemplate: DocTemplate = {
  id: 'acceptable-use-policy',
  name: 'Acceptable Use Policy',
  priority: 3,
  tscCriteria: ['CC1.1', 'CC1.4'],
  sections: [
    {
      id: 'aup-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This Acceptable Use Policy (AUP) defines the acceptable and prohibited uses of {{q1.1}}'s information systems, networks, devices, and data. The purpose of this policy is to protect {{q1.1}}, its employees, customers, and partners from harm caused by the misuse of IT resources and data, and to ensure compliance with applicable laws, regulations, and contractual obligations.`,
    },
    {
      id: 'aup-scope',
      title: 'Scope',
      type: 'static',
      content: `# Scope

This policy applies to all employees of {{q1.1}}. Where contractors or third-party personnel have been granted access to company systems ({{q3.4}}), this policy extends to those individuals as well.

This policy covers all information systems, applications, networks, endpoints, cloud services, and data owned or managed by {{q1.1}}.`,
    },
    {
      id: 'aup-acceptable-use',
      title: 'Acceptable Use',
      type: 'ai_generate',
      content: `Write an "Acceptable Use" section for {{q1.1}}'s Acceptable Use Policy.
The company operates as a {{q3.3}} workplace.
Their tech stack includes cloud providers {{q2_1}} and SaaS tools for identity ({{q2_3_identity}}), source code ({{q2_3_source_code}}), CI/CD ({{q2_3_cicd}}), communication ({{q2_3_communication}}), and endpoint management ({{q2_3_endpoint}}).
Write 3-5 bullet points describing acceptable uses of company IT resources, tailored to the work location model (remote, hybrid, or on-site). Use formal compliance language.`,
    },
    {
      id: 'aup-prohibited-activities',
      title: 'Prohibited Activities',
      type: 'static',
      content: `# Prohibited Activities

The following activities are strictly prohibited when using {{q1.1}}'s information systems and resources:

- Unauthorized access to systems, networks, or data not required for job responsibilities
- Sharing credentials, passwords, or multi-factor authentication tokens with others
- Installing unauthorized software, tools, or browser extensions on company-managed devices
- Circumventing or disabling security controls, firewalls, endpoint protection, or monitoring tools
- Transmitting, storing, or processing data in violation of the organization's data classification policy
- Using company systems to harass, threaten, or discriminate against any individual
- Downloading, distributing, or storing illegal, pirated, or unlicensed content
- Connecting unauthorized devices to the corporate network or cloud environments
- Exfiltrating company data to personal accounts, devices, or unauthorized cloud services
- Using company systems for cryptocurrency mining or other resource-intensive personal activities`,
    },
    {
      id: 'aup-personal-use',
      title: 'Personal Use',
      type: 'static',
      content: `# Personal Use

Limited personal use of company IT resources is permitted provided that such use:

- Does not interfere with job responsibilities or productivity
- Does not consume excessive network bandwidth or system resources
- Does not violate any provision of this policy or any applicable law
- Does not expose the organization to security risks or reputational harm

Personal use of company-managed devices and systems is a privilege, not a right, and may be revoked at any time at management's discretion.`,
    },
    {
      id: 'aup-monitoring',
      title: 'Monitoring',
      type: 'static',
      content: `# Monitoring

{{q1.1}} reserves the right to monitor, log, and audit all use of its information systems, networks, and devices. Monitoring tools and capabilities include: {{q2_3_monitoring}}.

Logging and monitoring configurations are maintained per the organization's audit log procedures ({{q4_9_logging}}). Users should have no expectation of privacy when using company-owned or company-managed systems.

Monitoring activities are conducted in compliance with applicable laws and regulations and are designed to protect the organization's assets, detect security incidents, and ensure policy compliance.`,
    },
    {
      id: 'aup-enforcement',
      title: 'Enforcement',
      type: 'static',
      content: `# Enforcement

Violations of this Acceptable Use Policy may result in disciplinary action, up to and including termination of employment or contract. Depending on the severity of the violation, {{q1.1}} may also pursue civil or criminal remedies.

All suspected violations should be reported immediately to the security owner ({{q3.1}}) or through the organization's incident reporting process. Reports will be investigated promptly, and appropriate corrective action will be taken.`,
    },
    {
      id: 'aup-acknowledgment',
      title: 'Acknowledgment',
      type: 'static',
      content: `# Acknowledgment

By signing below, I acknowledge that I have read, understand, and agree to comply with the {{q1.1}} Acceptable Use Policy. I understand that violation of this policy may result in disciplinary action, up to and including termination.

| Field | Value |
|---|---|
| **Employee Name** | _________________________ |
| **Title / Role** | _________________________ |
| **Signature** | _________________________ |
| **Date** | _________________________ |`,
    },
  ],
};
