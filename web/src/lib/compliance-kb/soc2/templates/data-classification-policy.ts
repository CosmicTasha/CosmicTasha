import type { ComplianceTemplate } from '../../types';

export const dataClassificationPolicyTemplate: ComplianceTemplate = {
  id: 'data-classification-policy',
  name: 'Data Classification & Handling Policy',
  tsc: ['C1.1', 'C1.2', 'CC6.1', 'CC6.7'],
  auditRisk: 'medium',
  sections: [
    {
      title: 'Purpose and Classification Levels',
      type: 'interpolate',
      template:
        'This Data Classification & Handling Policy establishes the framework for classifying and protecting data at {{companyName}}. ' +
        'The organization processes the following data types: {{dataTypes}}. ' +
        'Data is classified into four levels: Public (freely shareable), Internal (business use only), Confidential (restricted access), and Restricted (highest sensitivity — PII, financial, health data). ' +
        'All {{employeeCount}} employees and contractors must handle data according to its classification level.',
    },
    {
      title: 'Handling Requirements by Classification',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the data handling requirements section of a Data Classification Policy for SOC 2. ' +
          'Maps to TSC C1.1 (confidential information is identified) and C1.2 (confidential information is disposed of). ' +
          'Auditors verify that handling requirements are specific and enforceable per classification level. ' +
          'Common finding: classification levels defined but no practical handling rules for each level.',
        instruction:
          'Write handling requirements for each classification level covering: ' +
          '(1) storage requirements (encryption, access controls), ' +
          '(2) transmission requirements (encryption, approved channels), ' +
          '(3) sharing and access rules (who can access, approval needed), ' +
          '(4) retention periods and disposal methods per level, ' +
          '(5) labeling and marking requirements.',
        requiredContext: ['dataTypes', 'encryptionAtRest', 'encryptionInTransit', 'dataRetention'],
      },
      reviewTag: true,
    },
    {
      title: 'Data Inventory and Ownership',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the data inventory and ownership section of a Data Classification Policy for SOC 2. ' +
          'Maps to TSC CC6.1 and CC6.7 (restricting removal, modification, and disposal of data). ' +
          'Auditors expect a maintained data inventory with assigned owners. ' +
          'Common finding: no formal data inventory or data owners not assigned.',
        instruction:
          'Write data inventory and ownership procedures covering: ' +
          '(1) data inventory requirements and maintenance cadence, ' +
          '(2) data owner responsibilities (classification decisions, access approval), ' +
          '(3) data custodian responsibilities (technical controls implementation), ' +
          '(4) process for classifying new data types.',
        requiredContext: ['dataTypes', 'securityOwner', 'departments'],
      },
    },
  ],
};
