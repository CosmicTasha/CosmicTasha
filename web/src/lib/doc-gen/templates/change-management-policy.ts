import type { DocTemplate } from '../types';

export const changeManagementPolicyTemplate: DocTemplate = {
  id: 'change-management-policy',
  name: 'Change Management Policy',
  priority: 1,
  tscCriteria: ['CC8.1', 'CC8.2', 'CC8.3'],
  sections: [
    {
      id: 'cmp-purpose',
      title: 'Purpose',
      type: 'static',
      content: `# Purpose

This Change Management Policy establishes the requirements and procedures for managing changes to {{q1.1}}'s information systems, infrastructure, and application code. The policy ensures that all changes are planned, tested, approved, and documented to minimize risk to system availability, security, and integrity.

This policy supports the Security Trust Services Criteria of the SOC 2 framework and applies to all changes affecting production systems, infrastructure, and configurations.`,
    },
    {
      id: 'cmp-classification',
      title: 'Change Classification',
      type: 'ai_generate',
      content: `Write a formal "Change Classification" section for a Change Management Policy for {{q1.1}}.
Their architecture is {{q2_2}} hosted on {{q2_1}}.
They have {{q3.2}} engineers.
Define change types: Standard (pre-approved, low-risk), Normal (requires approval), and Emergency (bypasses normal process due to urgency).
Include examples relevant to their architecture and tech stack.
Write in formal compliance language.`,
    },
    {
      id: 'cmp-process',
      title: 'Change Process',
      type: 'static',
      content: `# Change Process

## Overview
All changes to production systems follow a structured process to ensure appropriate review, testing, and approval before deployment.

**Current change approval process:** {{q4_7_approval}}

## Pipeline Steps
The organization's deployment pipeline includes the following stages:

{{q2_5}}

## Standard Change Process
1. **Request** - Developer creates a change request (pull request / merge request) in the source code management system ({{q2_3_source_code}})
2. **Review** - Change is reviewed according to the code review requirements below
3. **Test** - Automated and/or manual testing is performed
4. **Approve** - Required approvals are obtained before merge
5. **Deploy** - Change is deployed through the CI/CD pipeline ({{q2_3_cicd}})
6. **Verify** - Post-deployment verification confirms the change behaves as expected
7. **Document** - Change details are recorded in the audit trail`,
    },
    {
      id: 'cmp-code-review',
      title: 'Code Review Requirements',
      type: 'static',
      content: `# Code Review Requirements

**Current practice:** {{q2_5.Code Review / PR}}

## Requirements
All code changes must be reviewed by at least one qualified reviewer before being merged to the main branch. Code reviews evaluate:

- **Correctness** - The change achieves its intended purpose without introducing defects
- **Security** - The change does not introduce vulnerabilities (injection, authentication bypass, data exposure)
- **Performance** - The change does not degrade system performance
- **Maintainability** - The code is readable, documented, and follows established patterns
- **Test coverage** - Appropriate tests accompany the change

## Reviewer Qualifications
Code reviewers must:

- Be a member of the engineering team
- Not be the author of the change being reviewed
- Have familiarity with the affected system components

## Review Documentation
All code reviews are documented in the source code management system with reviewer identity, timestamp, and approval status.`,
    },
    {
      id: 'cmp-testing',
      title: 'Testing Requirements',
      type: 'static',
      content: `# Testing Requirements

## Automated Testing
**Current practice:** {{q2_5.Automated Tests}}

All changes must pass automated tests before deployment to production. The test suite includes:

- **Unit tests** - Individual components function correctly in isolation
- **Integration tests** - Components interact correctly with each other
- **Security scans** - Static analysis and dependency vulnerability scanning

## Environment Testing
**Environments maintained:** {{q2_6}}

Changes are tested in non-production environments before being deployed to production. The testing progression follows:

1. Development environment - Initial development and unit testing
2. Staging / QA environment - Integration testing and user acceptance testing
3. Production - Monitored deployment with rollback capability

## Test Results
Test results are recorded as part of the CI/CD pipeline output and linked to the corresponding change request for audit trail purposes.`,
    },
    {
      id: 'cmp-emergency',
      title: 'Emergency Changes',
      type: 'ai_generate',
      reviewRequired: true,
      content: `Write a formal "Emergency Changes" section for a Change Management Policy for {{q1.1}}.
Normal change approval process: {{q4_7_approval}}.
Current incident response plan status: {{q4_4_plan}}.
Engineering team size: {{q3.2}}.
CI/CD tools: {{q2_3_cicd}}.
Define what constitutes an emergency change, the expedited approval process, required documentation, and retroactive review requirements.
Include guardrails to prevent abuse of the emergency process.
Write in formal compliance language.`,
    },
    {
      id: 'cmp-audit-trail',
      title: 'Audit Trail',
      type: 'static',
      content: `# Audit Trail

**Current practice:** {{q4_7_audit_trail}}

## Requirements
All changes to production systems generate an audit trail that includes:

- **Who** - Identity of the person requesting and approving the change
- **What** - Description of the change and affected systems
- **When** - Timestamps for request, approval, and deployment
- **Why** - Business justification or linked ticket/issue
- **How** - Method of deployment (CI/CD pipeline, manual, etc.)
- **Result** - Outcome of the change (success, rollback, partial)

## Audit Trail Sources
The organization maintains audit trails from the following sources:

- **Source code management** ({{q2_3_source_code}}) - Pull request history, code review comments, merge records
- **CI/CD pipeline** ({{q2_3_cicd}}) - Build logs, deployment records, test results
- **Cloud provider** ({{q2_1}}) - Infrastructure change logs, configuration audit trails
- **Monitoring** ({{q2_3_monitoring}}) - Deployment markers, performance metrics correlation

## Retention
Audit trail records are retained for a minimum of 1 year and are available for review by internal and external auditors.`,
    },
  ],
};
