import type { DocTemplate } from '../types';

export const dataClassificationPolicyTemplate: DocTemplate = {
  id: 'data-classification-policy',
  name: 'Data Classification Policy',
  priority: 2,
  tscCriteria: ['CC6.1', 'CC6.5', 'CC6.7'],
  sections: [
    {
      id: 'dcp-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This Data Classification Policy establishes a framework for categorizing data processed, stored, and transmitted by {{q1.1}} based on its sensitivity, regulatory requirements, and business value. This policy ensures that appropriate safeguards are applied to data throughout its lifecycle in accordance with SOC 2 Trust Services Criteria CC6.1, CC6.5, and CC6.7.`,
    },
    {
      id: 'dcp-classification-levels',
      title: 'Classification Levels',
      type: 'static',
      content: `# Classification Levels

The following classification levels apply to all data processed by {{q1.1}}:

## Public
Data intended for public consumption that poses no risk if disclosed.
- **Examples:** Marketing materials, public website content, published documentation, press releases.
- **Handling:** No special controls required. May be stored on any approved system.

## Internal
Data intended for use within the organization that is not meant for public disclosure.
- **Examples:** Internal policies, meeting notes, project plans, non-sensitive business communications.
- **Handling:** Access restricted to authorized employees. Must be stored on approved company systems.

## Confidential
Sensitive business data that could cause harm to the organization or its customers if disclosed.
- **Examples:** Customer data ({{q2_4}}), financial records, employee records, proprietary source code, vendor contracts.
- **Handling:** Access restricted on a need-to-know basis. Must be encrypted at rest and in transit. Access must be logged.

## Restricted
Highly sensitive data subject to regulatory requirements or contractual obligations with the most stringent protections.
- **Examples:** Authentication credentials, encryption keys, payment card data, health records, government-issued identifiers.
- **Handling:** Access restricted to named individuals with explicit approval. Must be encrypted with strong cryptographic standards. All access logged and reviewed. Data masking required in non-production environments.`,
    },
    {
      id: 'dcp-handling-requirements',
      title: 'Handling Requirements',
      type: 'ai_generate',
      content: `Write a Data Handling Requirements section for {{q1.1}}.
The company processes the following data types: {{q2_4}}.
Cloud providers: {{q2_1}}.
Architecture type: {{q2_2}}.
For each classification level (Public, Internal, Confidential, Restricted), describe specific handling requirements across these dimensions: Storage, Transmission, Access Control, Retention, Disposal, and Incident Response.
Format as a structured section with clear requirements for each level.
Write in formal compliance language.`,
    },
    {
      id: 'dcp-data-inventory',
      title: 'Data Inventory',
      type: 'ai_generate',
      content: `Generate a Data Inventory table for {{q1.1}}.
The company processes the following data types: {{q2_4}}.
The company does: {{q1.4}}.
Cloud providers: {{q2_1}}.
Create a markdown table with columns: Data Type, Classification Level, Storage Location, Retention Period, Owner, Access Groups.
Map each data type to its appropriate classification level and identify where it is stored and who has access.
Include all data types mentioned and add common supporting data types (logs, backups, configurations).`,
      reviewRequired: true,
    },
    {
      id: 'dcp-roles',
      title: 'Roles and Responsibilities',
      type: 'static',
      content: `# Roles and Responsibilities

## Data Owner
The security lead ({{q3.1}}) serves as the primary data owner and is responsible for:
- Approving data classification levels
- Authorizing access to Confidential and Restricted data
- Reviewing data access logs on a periodic basis
- Ensuring compliance with this policy

## Data Custodians
Engineering and IT personnel who manage systems that store or process classified data. Responsibilities include:
- Implementing technical controls consistent with classification requirements
- Monitoring systems for unauthorized access
- Reporting data handling anomalies to the Data Owner

## Data Users
All employees and contractors who access organizational data. Responsibilities include:
- Handling data in accordance with its classification level
- Reporting suspected data breaches or policy violations
- Completing data classification training upon onboarding and annually thereafter`,
    },
    {
      id: 'dcp-review',
      title: 'Review',
      type: 'static',
      content: `# Policy Review

## Review Cadence
{{q6_3}}

## Review Process
This policy shall be reviewed and updated according to the cadence above, or more frequently if triggered by:
- Changes to data types processed by the organization
- Changes in applicable regulatory or contractual requirements
- Findings from security assessments or audits
- Significant changes to the organization's systems or infrastructure

The Data Owner is responsible for initiating and approving policy updates. All changes must be documented and communicated to affected personnel.`,
    },
  ],
};
