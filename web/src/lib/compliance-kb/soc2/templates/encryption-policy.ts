import type { ComplianceTemplate } from '../../types';

export const encryptionPolicyTemplate: ComplianceTemplate = {
  id: 'encryption-policy',
  name: 'Encryption Policy',
  tsc: ['CC6.1', 'CC6.7', 'C1.1'],
  auditRisk: 'low',
  sections: [
    {
      title: 'Purpose and Standards',
      type: 'interpolate',
      template:
        'This Encryption Policy defines the encryption requirements for protecting data at rest and in transit at {{companyName}}. ' +
        'All systems hosted on {{cloudProviders}} must comply with these requirements. ' +
        'Minimum encryption standards: AES-256 for data at rest, TLS 1.2+ for data in transit. ' +
        'Current encryption at rest: {{encryptionAtRest}}. Current encryption in transit: {{encryptionInTransit}}.',
    },
    {
      title: 'Encryption Requirements and Key Management',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the encryption requirements and key management section of an Encryption Policy for SOC 2. ' +
          'Maps to TSC CC6.1 (logical access security), CC6.7 (restricting data modification), and C1.1 (confidentiality). ' +
          'Auditors verify encryption is actually applied — they check cloud provider configurations, not just the policy. ' +
          'Usually straightforward if the tech stack uses cloud-managed encryption (AWS KMS, GCP KMS, Azure Key Vault).',
        instruction:
          'Write encryption requirements and key management procedures covering: ' +
          '(1) data at rest encryption requirements per data classification level, ' +
          '(2) data in transit encryption requirements (TLS versions, certificate management), ' +
          '(3) key management procedures (generation, rotation, storage, destruction), ' +
          '(4) approved cryptographic algorithms and prohibited algorithms, ' +
          '(5) exceptions process for systems that cannot meet encryption requirements.',
        requiredContext: ['encryptionAtRest', 'encryptionInTransit', 'cloudProviders', 'keyManagement'],
      },
      reviewTag: true,
    },
  ],
};
