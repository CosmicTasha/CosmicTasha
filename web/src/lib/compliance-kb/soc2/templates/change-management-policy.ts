import type { ComplianceTemplate } from '../../types';

export const changeManagementPolicyTemplate: ComplianceTemplate = {
  id: 'change-management-policy',
  name: 'Change Management Policy',
  tsc: ['CC8.1', 'CC7.1', 'CC7.2'],
  auditRisk: 'high',
  sections: [
    {
      title: 'Purpose and Scope',
      type: 'interpolate',
      template:
        'This Change Management Policy establishes the procedures for managing changes to {{companyName}} production systems, applications, and infrastructure. ' +
        'This policy applies to all changes affecting systems hosted on {{cloudProviders}} across {{environments}} environments. ' +
        'All {{engineeringCount}} engineers and operations personnel must follow these procedures.',
    },
    {
      title: 'Change Classification and Approval Process',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the change classification and approval section of a Change Management Policy for SOC 2. ' +
          'Maps to TSC CC8.1 (changes to infrastructure and software are authorized, designed, developed, configured, documented, tested, approved, and implemented). ' +
          'Auditors test this against actual git/deploy history — mismatches between policy and practice are the most common finding. ' +
          'Be specific about change types, approval requirements, and documentation standards.',
        instruction:
          'Write change classification and approval procedures covering: ' +
          '(1) change types (standard, normal, emergency) with definitions, ' +
          '(2) approval requirements per change type (who approves, how), ' +
          '(3) documentation requirements (change request, impact assessment, rollback plan), ' +
          '(4) code review and peer review requirements.',
        requiredContext: ['changeApprovalProcess', 'codeReviewPolicy', 'deploymentPipeline'],
      },
      reviewTag: true,
    },
    {
      title: 'Testing and Deployment',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the testing and deployment section of a Change Management Policy for SOC 2. ' +
          'Maps to TSC CC8.1 and CC7.1 (monitoring of infrastructure). ' +
          'Auditors verify that changes are tested before production deployment and that rollback procedures exist. ' +
          'Common finding: no staging environment or testing is bypassed for "urgent" changes.',
        instruction:
          'Write testing and deployment procedures covering: ' +
          '(1) testing requirements per change type (unit, integration, staging), ' +
          '(2) deployment process and tooling, ' +
          '(3) rollback procedures and criteria, ' +
          '(4) post-deployment verification and monitoring.',
        requiredContext: ['testingPractices', 'deploymentPipeline', 'stagingEnvironment', 'monitoringTools'],
      },
      reviewTag: true,
    },
    {
      title: 'Emergency Changes and Audit Trail',
      type: 'ai_generate',
      prompt: {
        system:
          'You are writing the emergency change and audit trail section of a Change Management Policy for SOC 2. ' +
          'Maps to TSC CC8.1 and CC7.2 (monitoring for anomalies). ' +
          'Auditors specifically look for emergency change procedures — bypassing normal approval must still be documented. ' +
          'Common finding: emergency changes lack post-hoc documentation or approval.',
        instruction:
          'Write emergency change and audit trail procedures covering: ' +
          '(1) emergency change criteria and authorization, ' +
          '(2) post-hoc review and documentation requirements for emergency changes, ' +
          '(3) audit trail requirements (who, what, when, why for every change), ' +
          '(4) change log retention period.',
        requiredContext: ['emergencyChangeProcess', 'auditTrailTools', 'changeLogRetention'],
      },
    },
  ],
};
