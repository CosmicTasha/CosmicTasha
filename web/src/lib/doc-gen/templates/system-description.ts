import type { DocTemplate } from '../types';

export const systemDescriptionTemplate: DocTemplate = {
  id: 'system-description',
  name: 'System Description',
  priority: 1,
  tscCriteria: ['CC1.1', 'CC1.2', 'CC1.3', 'CC1.4'],
  sections: [
    {
      id: 'sd-company-overview',
      title: 'Company Overview',
      type: 'static',
      content: `# Company Overview

**Company Name:** {{q1.1}}
**Website:** {{q1.2}}
**Founded:** {{q1.6}}
**Headcount:** {{q1.3}} employees
**Industry Focus:** {{q1.5}}

{{q1.1}} {{q1.4}}. The organization serves customers across the {{q1.5}} sector(s) and maintains a workforce of {{q1.3}} employees. {{q1.1}} was founded in {{q1.6}} and is headquartered at the address listed in its corporate filings.`,
    },
    {
      id: 'sd-system-description',
      title: 'System Description',
      type: 'ai_generate',
      content: `Write a formal SOC 2 Type II System Description for {{q1.1}}.
The company does the following: {{q1.4}}.
Their tech stack includes: cloud providers {{q2_1}}, architecture type {{q2_2}}, and SaaS tools for identity ({{q2_3_identity}}), source code ({{q2_3_source_code}}), CI/CD ({{q2_3_cicd}}), and monitoring ({{q2_3_monitoring}}).
The system processes data types: {{q2_4}}.
Write 3-4 paragraphs in formal compliance language describing the system, its components, and how data flows through it.`,
    },
    {
      id: 'sd-infrastructure',
      title: 'Infrastructure',
      type: 'static',
      content: `# Infrastructure

## Cloud Providers
{{q1.1}} hosts its production infrastructure on {{q2_1}}.

## Architecture
The system follows a {{q2_2}} architecture pattern.

## Environments
The organization maintains the following environments:

{{q2_6}}

Each environment is configured with appropriate access controls and network segmentation to prevent unauthorized access between environments.

## Key Services
The organization utilizes the following cloud services and managed platforms to deliver its system:

- **Identity & Access Management:** {{q2_3_identity}}
- **Source Code Management:** {{q2_3_source_code}}
- **CI/CD Pipeline:** {{q2_3_cicd}}
- **Monitoring & Observability:** {{q2_3_monitoring}}
- **Communication:** {{q2_3_communication}}
- **Endpoint Management:** {{q2_3_endpoint}}`,
    },
    {
      id: 'sd-people',
      title: 'People',
      type: 'static',
      content: `# People

## Organizational Structure
{{q1.1}} employs {{q1.3}} people with {{q3.2}} engineers on the team. The organization operates as a {{q3.3}} workplace.

## Security Ownership
{{q3.1}}

## Departments
The following functional areas support the system:

{{q3.5}}

## Contractors and Third Parties
{{q3.4}}`,
    },
    {
      id: 'sd-data',
      title: 'Data',
      type: 'static',
      content: `# Data

## Data Types Processed
The system processes the following categories of data:

{{q2_4}}

## Data Classification
Data is classified according to the organization's data classification policy. The classification levels determine the appropriate handling, storage, encryption, and access control requirements for each data type.

## Data Retention and Disposal
The organization maintains data retention policies that govern the lifecycle of data within the system, including secure disposal procedures when data is no longer required.`,
    },
    {
      id: 'sd-boundaries',
      title: 'Boundaries and Scope',
      type: 'ai_generate',
      content: `Write a formal SOC 2 "Boundaries and Scope" section for {{q1.1}}.
Trust Services Criteria in scope: {{q5_1}}.
Systems in scope: {{q5_2_systems}}.
Any carve-outs or exclusions: {{q5_3}}.
Additional systems mentioned: {{q5_2_other}}.
Additional frameworks being targeted: {{q5_4}}.
Write 2-3 paragraphs in formal compliance language describing the audit boundaries, what is in scope, and any carve-outs.`,
      reviewRequired: true,
    },
  ],
};
