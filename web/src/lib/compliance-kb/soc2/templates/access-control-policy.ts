import type { ComplianceTemplate } from '../../types';

export const accessControlPolicyTemplate: ComplianceTemplate = {
  id: 'access-control-policy',
  name: 'Access Control Policy',
  tsc: ['CC6.1', 'CC6.2', 'CC6.3', 'CC6.6', 'CC6.7', 'CC6.8'],
  auditRisk: 'high',
  sections: [
    {
      title: 'Purpose and Scope',
      type: 'interpolate',
      template:
        'This Access Control Policy defines the requirements for managing logical and physical access to {{companyName}} systems, data, and infrastructure. ' +
        'This policy applies to all {{employeeCount}} employees, contractors, and third-party users with access to organizational systems. ' +
        'Systems in scope include all production and corporate infrastructure hosted on {{cloudProviders}}.',
    },
    {
      title: 'Authentication and Authorization',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the authentication and authorization section of an Access Control Policy for SOC 2. ' +
          'Maps to TSC CC6.1 (logical access security) and CC6.2 (prior to issuing system credentials). ' +
          'This is the highest gap-frequency area in real SOC 2 audits. ' +
          'Auditors test: MFA enforcement evidence, SSO configuration, password complexity, session management. ' +
          'Common finding: MFA enabled but not enforced for all users.',
        instruction:
          'Write authentication and authorization requirements covering: ' +
          '(1) multi-factor authentication requirements and enforcement scope, ' +
          '(2) single sign-on configuration and identity provider integration, ' +
          '(3) password policy (complexity, rotation, reuse), ' +
          '(4) session management (timeout, concurrent sessions), ' +
          '(5) role-based access control model and least-privilege principle.',
        requiredContext: ['mfaStatus', 'ssoProvider', 'passwordPolicy', 'rbacModel'],
      },
      reviewTag: true,
    },
    {
      title: 'Access Lifecycle Management',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the access lifecycle section of an Access Control Policy for SOC 2. ' +
          'Maps to TSC CC6.2 (issuing credentials), CC6.3 (modifying access), CC6.6 (restricting access). ' +
          'Auditors pull a sample of joiners/leavers and verify access was provisioned/deprovisioned correctly. ' +
          'Common finding: offboarding incomplete — accounts remain active after termination.',
        instruction:
          'Write access lifecycle procedures covering: ' +
          '(1) new user provisioning process and approval workflow, ' +
          '(2) access modification and role change procedures, ' +
          '(3) offboarding and access revocation (target timeline), ' +
          '(4) contractor and temporary access management.',
        requiredContext: ['onboardingProcess', 'offboardingProcess', 'accessProvisioningWorkflow'],
      },
      reviewTag: true,
    },
    {
      title: 'Access Reviews and Monitoring',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the access review and monitoring section of an Access Control Policy for SOC 2. ' +
          'Maps to TSC CC6.7 (restricting removal of data) and CC6.8 (preventing unauthorized software). ' +
          'Auditors request evidence of periodic access reviews — quarterly is the standard expectation. ' +
          'Common finding: access reviews documented but no evidence of remediation actions taken.',
        instruction:
          'Write access review and monitoring procedures covering: ' +
          '(1) periodic access review schedule and scope, ' +
          '(2) review process and documentation requirements, ' +
          '(3) remediation of inappropriate access findings, ' +
          '(4) privileged access monitoring and alerting.',
        requiredContext: ['accessReviewCadence', 'privilegedAccessMonitoring', 'accessReviewOwner'],
      },
    },
  ],
};
