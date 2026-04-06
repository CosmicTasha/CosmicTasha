import type { DocTemplate } from '../types';

export const encryptionPolicyTemplate: DocTemplate = {
  id: 'encryption-policy',
  name: 'Encryption Policy',
  priority: 2,
  tscCriteria: ['CC6.1', 'CC6.7'],
  sections: [
    {
      id: 'ep-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This Encryption Policy defines the standards and requirements for the use of cryptographic controls by {{q1.1}} to protect the confidentiality and integrity of data. This policy ensures that encryption is applied consistently across all systems and data types in accordance with SOC 2 Trust Services Criteria CC6.1 and CC6.7.`,
    },
    {
      id: 'ep-scope',
      title: 'Scope',
      type: 'static',
      content: `# Scope

This policy applies to all data processed, stored, and transmitted by {{q1.1}}, including:

## Data Types
{{q2_4}}

## Systems
All production, staging, and development systems that handle organizational data are subject to this policy. This includes cloud infrastructure, SaaS applications, endpoints, and backup systems.

## Personnel
All employees, contractors, and third parties who access {{q1.1}} systems must comply with this policy.`,
    },
    {
      id: 'ep-standards',
      title: 'Encryption Standards',
      type: 'ai_generate',
      content: `Write an Encryption Standards section for {{q1.1}}.
Current encryption practices: {{q4_3}}.
Cloud providers: {{q2_1}}.
Data types: {{q2_4}}.
Define the minimum encryption standards for the organization, including:
1. Approved symmetric encryption algorithms (AES-256 minimum)
2. Approved asymmetric encryption algorithms (RSA-2048/4096, ECDSA)
3. Approved hashing algorithms (SHA-256 minimum)
4. TLS version requirements (TLS 1.2 minimum, TLS 1.3 preferred)
5. Certificate requirements and management
6. Prohibited algorithms and protocols (DES, 3DES, MD5, SHA-1, SSL, TLS 1.0/1.1)
Write in formal compliance language with specific technical requirements.`,
    },
    {
      id: 'ep-key-management',
      title: 'Key Management',
      type: 'ai_generate',
      content: `Write a Key Management section for {{q1.1}}.
Cloud providers: {{q2_1}}.
The security lead is: {{q3.1}}.
Describe the key management lifecycle, including:
1. Key generation (secure random generation, minimum key lengths)
2. Key storage (hardware security modules, cloud KMS, secrets management)
3. Key distribution (secure channels, separation of duties)
4. Key rotation schedule (annual minimum, more frequent for high-risk keys)
5. Key revocation and destruction procedures
6. Key escrow and recovery procedures
7. Access controls for cryptographic keys
Reference the cloud provider's KMS capabilities where applicable.
Write in formal compliance language.`,
      reviewRequired: true,
    },
    {
      id: 'ep-data-at-rest',
      title: 'Data at Rest',
      type: 'static',
      content: `# Data at Rest

## Encryption at Rest
{{q4_3_encryption_rest}}

## Requirements
All data classified as Confidential or Restricted must be encrypted at rest using approved algorithms (AES-256 minimum). Specific requirements include:

- **Databases:** All database volumes and backups must be encrypted using the cloud provider's encryption service or equivalent
- **File Storage:** All file storage (object storage, block storage, NAS) containing sensitive data must be encrypted
- **Backups:** All backup data must be encrypted, including data replicated to secondary locations
- **Endpoints:** Full-disk encryption must be enabled on all company-issued devices
- **Removable Media:** Use of unencrypted removable media for sensitive data is prohibited

## Verification
Encryption-at-rest configuration is verified through automated compliance checks and periodic manual audits.`,
    },
    {
      id: 'ep-data-in-transit',
      title: 'Data in Transit',
      type: 'static',
      content: `# Data in Transit

## Encryption in Transit
{{q4_3_encryption_transit}}

## Requirements
All data transmitted over networks must be encrypted using approved protocols. Specific requirements include:

- **External Traffic:** All external-facing endpoints must use TLS 1.2 or higher. TLS 1.3 is preferred
- **Internal Traffic:** Service-to-service communication within the production environment must use TLS or mTLS
- **API Communications:** All API endpoints must enforce HTTPS. HTTP connections must be redirected to HTTPS
- **Email:** Sensitive data transmitted via email must use TLS-encrypted connections. End-to-end encryption is required for Restricted data
- **VPN:** Remote access to internal systems must use an approved VPN with strong encryption
- **File Transfers:** SFTP or SCP must be used for file transfers. FTP is prohibited

## Certificate Management
TLS certificates are managed through automated certificate provisioning and renewal. Certificate expiration is monitored and alerts are configured for upcoming expirations.`,
    },
    {
      id: 'ep-exceptions',
      title: 'Exceptions',
      type: 'static',
      content: `# Exceptions

## Exception Process
Any exception to this Encryption Policy must be:

1. Submitted in writing to the security lead with a detailed justification
2. Risk-assessed to determine the impact of the exception on data confidentiality and integrity
3. Approved by the security lead and documented in the risk register
4. Time-limited with a defined expiration date (maximum 12 months)
5. Reviewed upon expiration for renewal or remediation

## Compensating Controls
Where an exception is granted, compensating controls must be implemented to reduce residual risk. These may include:
- Enhanced monitoring and logging
- Additional access restrictions
- Network segmentation
- Data masking or tokenization

## Exception Register
All active exceptions are tracked in the organization's risk register with their justification, compensating controls, and expiration dates.`,
    },
  ],
};
