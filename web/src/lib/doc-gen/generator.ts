import type {
  DocTemplate,
  TemplateSection,
  GeneratedDocument,
  GeneratedSection,
} from './types';

// ---------------------------------------------------------------------------
// Answer interpolation — replaces {{key}} and {{key.subkey}} with values
// ---------------------------------------------------------------------------

function resolveValue(
  answers: Record<string, unknown>,
  key: string,
): string {
  // Handle dot-notation for nested objects: e.g., "q4_1.mfa"
  const parts = key.split('.');
  let value: unknown = answers;

  for (const part of parts) {
    if (value === null || value === undefined) break;
    if (typeof value === 'object' && !Array.isArray(value)) {
      value = (value as Record<string, unknown>)[part];
    } else {
      value = undefined;
      break;
    }
  }

  if (value === null || value === undefined) return 'Not specified';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None specified';
    // Handle array of objects (e.g., environments, document entries)
    if (typeof value[0] === 'object') {
      return value
        .map((item) => {
          if ('name' in item && 'status' in item) {
            return `- ${item.name}: ${item.status || 'Not specified'}`;
          }
          if ('name' in item && 'isolated' in item) {
            return `- ${item.name}${item.isolated ? ` (Isolated: ${item.isolated})` : ''}`;
          }
          return `- ${JSON.stringify(item)}`;
        })
        .join('\n');
    }
    return value.join(', ');
  }
  if (typeof value === 'object') {
    // Handle pipeline-style objects: { "Code Review / PR": { status: "Yes" }, ... }
    const entries = Object.entries(value as Record<string, unknown>);
    return entries
      .map(([k, v]) => {
        if (typeof v === 'object' && v !== null && 'status' in (v as Record<string, unknown>)) {
          const status = (v as Record<string, string>).status || 'Not specified';
          return `- ${k}: ${status}`;
        }
        return `- ${k}: ${v}`;
      })
      .join('\n');
  }
  return String(value);
}

function interpolate(
  template: string,
  answers: Record<string, unknown>,
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const trimmedKey = key.trim();
    return resolveValue(answers, trimmedKey);
  });
}

// ---------------------------------------------------------------------------
// Mock prose generator — produces realistic compliance language from answers
// ---------------------------------------------------------------------------

function mockProse(
  section: TemplateSection,
  answers: Record<string, unknown>,
  companyName: string,
): string {
  // Interpolate the prompt content with answer data to extract context
  const context = interpolate(section.content || '', answers);

  // Generate section-specific mock prose based on section ID patterns
  const sectionId = section.id;

  if (sectionId.includes('system-description')) {
    return generateSystemDescriptionProse(answers, companyName);
  }
  if (sectionId.includes('classification') && sectionId.includes('irp')) {
    return generateIncidentClassificationProse(answers, companyName);
  }
  if (sectionId.includes('detection')) {
    return generateDetectionProse(answers, companyName);
  }
  if (sectionId.includes('response') && sectionId.includes('irp')) {
    return generateResponseProceduresProse(answers, companyName);
  }
  if (sectionId.includes('communication')) {
    return generateCommunicationProse(answers, companyName);
  }
  if (sectionId.includes('access-control') || sectionId.includes('isp-access')) {
    return generateAccessControlProse(answers, companyName);
  }
  if (sectionId.includes('data-protection')) {
    return generateDataProtectionProse(answers, companyName);
  }
  if (sectionId.includes('incident-response') || sectionId.includes('isp-incident')) {
    return generateIncidentResponseProse(answers, companyName);
  }
  if (sectionId.includes('change-management') || sectionId.includes('isp-change')) {
    return generateChangeManagementProse(answers, companyName);
  }
  if (sectionId.includes('authorization')) {
    return generateAuthorizationProse(answers, companyName);
  }
  if (sectionId.includes('cmp-classification')) {
    return generateChangeClassificationProse(answers, companyName);
  }
  if (sectionId.includes('emergency')) {
    return generateEmergencyChangesProse(answers, companyName);
  }
  if (sectionId.includes('boundaries')) {
    return generateBoundariesProse(answers, companyName);
  }

  // Generic fallback: return interpolated prompt as structured prose
  return `# ${section.title}\n\n${context}`;
}

// ---------------------------------------------------------------------------
// Section-specific prose generators
// ---------------------------------------------------------------------------

function generateSystemDescriptionProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const description = resolveValue(answers, 'q1.4');
  const providers = resolveValue(answers, 'q2_1');
  const architecture = resolveValue(answers, 'q2_2');
  const dataTypes = resolveValue(answers, 'q2_4');
  const identity = resolveValue(answers, 'q2_3_identity');
  const monitoring = resolveValue(answers, 'q2_3_monitoring');

  return `# System Description

${companyName} operates a cloud-based system that ${description.toLowerCase().startsWith('we ') ? description.slice(3) : description}. The System is designed to securely process, store, and transmit data on behalf of its customers while maintaining the confidentiality, integrity, and availability of that data.

The System is hosted on ${providers} and follows a ${architecture} architecture pattern. ${companyName} leverages managed cloud services to reduce operational complexity and benefit from the security controls implemented by its cloud service providers. The infrastructure is provisioned and managed using infrastructure-as-code practices to ensure consistency and auditability.

Authentication and identity management are handled through ${identity}, providing centralized access control across the organization's systems and applications. System health and security are monitored through ${monitoring}, which provides real-time visibility into system performance, availability, and potential security events.

The System processes the following categories of data: ${dataTypes}. All data is classified according to ${companyName}'s data classification policy, and appropriate controls are applied based on the sensitivity level of each data type.`;
}

function generateIncidentClassificationProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const dataTypes = resolveValue(answers, 'q2_4');
  const industries = resolveValue(answers, 'q1.5');

  return `# Incident Classification

${companyName} classifies security incidents into four severity levels based on their impact to business operations, data integrity, and customer trust.

## P0 — Critical
Incidents that involve confirmed data breach of customer data, complete system outage affecting all customers, or active exploitation of a vulnerability allowing unauthorized access to production systems. **Response target: Immediate response within 15 minutes.** All hands on deck. Executive leadership and legal counsel are notified immediately.

## P1 — High
Incidents involving partial system degradation affecting multiple customers, unauthorized access attempts with evidence of lateral movement, compromise of employee credentials with access to production systems, or exposure of sensitive data types (${dataTypes}). **Response target: Response within 1 hour.** Security lead and on-call engineer are paged immediately.

## P2 — Medium
Incidents involving isolated system issues affecting a single customer or non-critical component, successful phishing attempts without evidence of system compromise, policy violations detected through monitoring, or vulnerability disclosures requiring assessment. **Response target: Response within 4 hours during business hours.**

## P3 — Low
Incidents involving informational security events, failed attack attempts blocked by existing controls, minor policy deviations, or routine security alerts requiring investigation. **Response target: Response within 1 business day.**

[REVIEW] Review these severity levels and response targets to ensure they align with your organization's risk tolerance, customer SLAs, and regulatory requirements for the ${industries} industry.`;
}

function generateDetectionProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const logging = resolveValue(answers, 'q4_9_logging');
  const alerts = resolveValue(answers, 'q4_9_alerts');
  const retention = resolveValue(answers, 'q4_9_retention');
  const monitoringTools = resolveValue(answers, 'q2_3_monitoring');
  const scanning = resolveValue(answers, 'q4_6_scanning');

  return `# Detection and Reporting

## Detection Mechanisms
${companyName} employs multiple layers of detection to identify security incidents and anomalous activity. Centralized logging (currently: ${logging}) aggregates events from production systems, applications, and infrastructure components. Monitoring is provided through ${monitoringTools}, which provides real-time alerting and dashboards for security and operational events.

Alerting is configured (currently: ${alerts}) to notify the security team of potential incidents based on predefined thresholds and anomaly detection rules. Vulnerability scanning (currently: ${scanning}) is performed to identify potential weaknesses before they can be exploited.

## Reporting Channels
Any employee or contractor who suspects a security incident must report it immediately through one of the following channels:

1. **Direct notification** to the security lead via the organization's communication platform
2. **Security incident email** to the designated security response address
3. **On-call escalation** through the alerting system for after-hours incidents

All reports are treated confidentially. Employees are encouraged to report potential incidents without fear of reprisal, even if the report turns out to be a false positive.

## Initial Triage
Upon receiving an incident report, the on-call responder performs initial triage within 15 minutes to determine the severity classification and appropriate response level. Triage includes verifying the report, assessing the scope, and initiating the response procedure for the assigned severity level.

## Log Retention
Security logs are retained for ${retention} to support incident investigation, forensic analysis, and audit requirements.`;
}

function generateResponseProceduresProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const securityOwner = resolveValue(answers, 'q3.1');
  const engineerCount = resolveValue(answers, 'q3.2');
  const workLocation = resolveValue(answers, 'q3.3');

  return `# Response Procedures

## Incident Response Team
${companyName}'s incident response team consists of the security lead (${securityOwner}), on-call engineers, and relevant stakeholders. The team operates in a ${workLocation} environment with ${engineerCount} engineers available for incident response.

## Phase 1: Containment
Upon classification, the response team takes immediate action to contain the incident and prevent further damage:

1. **Isolate affected systems** — Remove compromised systems from the network or restrict access
2. **Preserve evidence** — Capture logs, memory dumps, and system state for forensic analysis
3. **Block threat vectors** — Disable compromised accounts, block malicious IPs, revoke leaked credentials
4. **Notify stakeholders** — Inform relevant internal teams based on the severity classification

## Phase 2: Eradication
Once containment is confirmed, the team eliminates the root cause:

1. **Identify root cause** — Analyze evidence to determine how the incident occurred
2. **Remove threat** — Eliminate malware, close vulnerabilities, patch affected systems
3. **Verify eradication** — Confirm that the threat has been fully removed from all affected systems
4. **Update indicators** — Add indicators of compromise (IOCs) to monitoring and detection systems

## Phase 3: Recovery
The team restores affected systems to normal operation:

1. **Restore from backups** — If necessary, restore systems from verified clean backups
2. **Validate integrity** — Confirm that restored systems are functioning correctly and data integrity is maintained
3. **Monitor closely** — Implement enhanced monitoring for the affected systems for a minimum of 72 hours
4. **Resume normal operations** — Gradually restore full access and confirm normal system behavior

[REVIEW] Verify that these response procedures are appropriate for your organization's size, technical capabilities, and regulatory requirements. Assign specific team members to each role.`;
}

function generateCommunicationProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const industries = resolveValue(answers, 'q1.5');
  const communicationTools = resolveValue(answers, 'q2_3_communication');
  const teamSize = resolveValue(answers, 'q1.3');
  const dataTypes = resolveValue(answers, 'q2_4');

  return `# Communication Plan

## Internal Communication
During an active incident, ${companyName} uses ${communicationTools} for internal coordination. A dedicated incident channel is created for each P0 or P1 incident to centralize communication and decision-making.

### Notification Chain
1. **Immediate (within 15 min):** Security lead, on-call engineer, CTO/engineering leadership
2. **Within 1 hour:** CEO, affected department heads, legal counsel (for P0 incidents)
3. **Within 4 hours:** Full engineering team (${teamSize} employees), customer success team

## External Communication — Customers
${companyName} is committed to transparent communication with its customers during security incidents:

- **P0 incidents:** Customers are notified within 24 hours of confirmed impact via email and status page
- **P1 incidents:** Affected customers are notified within 48 hours if their data or service was impacted
- **P2/P3 incidents:** No customer notification required unless specific customer data was affected

All customer communications are reviewed by the security lead and legal counsel before distribution.

## Regulatory Notification
Depending on the nature and scope of the incident, ${companyName} may be required to notify regulatory authorities. The organization handles the following data types: ${dataTypes}.

Regulatory notification timelines are determined by applicable regulations and customer contractual requirements. Legal counsel is consulted for all P0 incidents to determine notification obligations.

## Public Communication
Public statements regarding security incidents are issued only with approval from executive leadership and legal counsel. The security lead prepares technical details, and communications are coordinated through the designated spokesperson.

[REVIEW] Review notification timelines and ensure they meet your contractual obligations with customers in the ${industries} sector. Some industries require shorter notification windows.`;
}

function generateAccessControlProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const q41 = (answers['q4_1'] as Record<string, string>) || {};
  const onboarding = resolveValue(answers, 'q4_2_onboarding');
  const offboarding = resolveValue(answers, 'q4_2_offboarding');

  return `# Access Control

${companyName} implements access controls based on the principle of least privilege, ensuring that users are granted only the minimum access required to perform their job functions.

## Authentication
Multi-factor authentication is ${q41.mfa || 'not specified'} across the organization. Single sign-on (SSO) is ${q41.sso || 'not specified'}, providing centralized authentication and reducing credential management overhead. All user accounts are unique and individually assigned (${q41.unique_accounts || 'not specified'}).

## Authorization
Access levels are ${q41.access_levels || 'not specified'}. Role-based access control (RBAC) is used to manage permissions across systems, ensuring that access is aligned with job responsibilities and reviewed on a regular basis. Access reviews are conducted ${q41.access_reviews || 'not specified'}.

## User Lifecycle Management
The organization maintains formal procedures for onboarding and offboarding:

- **Onboarding:** ${onboarding}
- **Offboarding:** ${offboarding}

These procedures ensure that access is provisioned promptly for new employees and revoked within 24 hours of separation.`;
}

function generateDataProtectionProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const q43 = (answers['q4_3'] as Record<string, string>) || {};
  const dataTypes = resolveValue(answers, 'q2_4');

  return `# Data Protection

${companyName} implements comprehensive data protection controls to safeguard the confidentiality and integrity of data throughout its lifecycle. The organization handles the following data types: ${dataTypes}.

## Encryption
Data at rest is encrypted (${q43.encrypted_at_rest || 'not specified'}). All data in transit is protected using TLS 1.2 or higher (${q43.encrypted_in_transit || 'not specified'}). Encryption keys are managed through the cloud provider's key management service with appropriate access controls and rotation policies.

## Data Classification
${companyName} maintains a data classification framework (${q43.classification || 'not specified'}) that categorizes data based on sensitivity and regulatory requirements. Classification levels determine the appropriate handling, storage, access, and disposal requirements for each data category.

## Data Disposal
When data is no longer required, it is disposed of securely (${q43.deletion || 'not specified'}). Disposal methods include cryptographic erasure for encrypted storage volumes and secure deletion for unencrypted data. Disposal actions are logged and retained for audit purposes.`;
}

function generateIncidentResponseProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const plan = resolveValue(answers, 'q4_4_plan');
  const lastUpdated = resolveValue(answers, 'q4_4_last_updated');
  const hadIncident = resolveValue(answers, 'q4_4_had_incident');
  const postReview = resolveValue(answers, 'q4_4_post_review');

  return `# Incident Response

${companyName} maintains an incident response capability to detect, respond to, and recover from security incidents. The current incident response plan status is: ${plan}.

The plan was last updated: ${lastUpdated}. The organization ${hadIncident === 'Yes' ? 'has experienced previous security incidents and has applied lessons learned to improve its response capabilities' : 'has not experienced a significant security incident to date, but maintains readiness through regular testing and tabletop exercises'}.

Post-incident reviews are conducted following the resolution of significant incidents (${postReview}). These reviews identify root causes, evaluate the effectiveness of the response, and generate action items to strengthen the organization's security posture. Detailed procedures are documented in the Incident Response Plan.`;
}

function generateChangeManagementProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const approval = resolveValue(answers, 'q4_7_approval');
  const auditTrail = resolveValue(answers, 'q4_7_audit_trail');

  return `# Change Management

${companyName} follows a structured change management process to ensure that all modifications to production systems are reviewed, tested, and approved before deployment. The current change approval process is: ${approval}.

All changes generate an audit trail (${auditTrail}) that records who made the change, what was changed, when it occurred, and why. This audit trail is retained for compliance and forensic purposes. Detailed change management procedures are documented in the Change Management Policy.`;
}

function generateAuthorizationProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const q41 = (answers['q4_1'] as Record<string, string>) || {};
  const engineerCount = resolveValue(answers, 'q3.2');
  const architecture = resolveValue(answers, 'q2_2');
  const providers = resolveValue(answers, 'q2_1');
  const dataTypes = resolveValue(answers, 'q2_4');

  return `# Authorization and Access Levels

## Role-Based Access Control
${companyName} implements role-based access control (RBAC) to manage authorization across all systems. Access levels are ${q41.access_levels || 'not specified'}. The following standard roles are defined:

### Administrator
Full administrative access to production infrastructure, cloud consoles (${providers}), and system configuration. Limited to senior engineering and security leadership. All administrative actions are logged.

### Developer
Access to source code repositories, CI/CD pipelines, and development/staging environments. Production access is limited to read-only monitoring and debugging tools unless elevated access is approved through the change management process.

### Read-Only / Support
Access to monitoring dashboards, customer support tools, and non-production environments. No access to source code, production infrastructure, or customer data unless specifically authorized.

### External / Contractor
Time-limited access scoped to specific projects or systems. All contractor access requires explicit approval from the security lead and is reviewed monthly.

## Access Request Process
Access requests follow a formal approval workflow:

1. **Request** — User submits an access request specifying the system, access level, and business justification
2. **Manager approval** — The user's direct manager reviews and approves the request
3. **Security review** — For privileged or sensitive access, the security lead reviews the request
4. **Provisioning** — Access is granted through the identity provider or system-specific access controls
5. **Confirmation** — The user confirms access and acknowledges the Acceptable Use Policy

## Principle of Least Privilege
All access is granted on a least-privilege basis. Users receive only the minimum permissions required to perform their job functions. The engineering team of ${engineerCount} engineers follows this principle across the ${architecture} architecture, with production access restricted to essential personnel.

## Separation of Duties
Critical operations require separation of duties to prevent any single individual from having unchecked access. This includes:

- Code authors cannot approve their own changes
- Infrastructure changes require review by a second engineer
- Database access to production data types (${dataTypes}) requires documented justification`;
}

function generateChangeClassificationProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const architecture = resolveValue(answers, 'q2_2');
  const providers = resolveValue(answers, 'q2_1');
  const engineerCount = resolveValue(answers, 'q3.2');

  return `# Change Classification

${companyName} classifies all changes to production systems into three categories based on their risk level and impact. This classification determines the review, testing, and approval requirements for each change.

## Standard Changes
Pre-approved, low-risk changes that follow an established and tested process. Examples include:

- Dependency version updates (patch/minor versions) with passing automated tests
- Configuration changes within pre-approved parameters
- UI/UX updates that do not affect data processing or security controls
- Documentation updates

Standard changes may be deployed without additional approval beyond code review, provided all automated tests pass.

## Normal Changes
Changes that modify system behavior, introduce new features, or alter infrastructure. These require the full change management process. Examples for a ${architecture} architecture on ${providers}:

- New API endpoints or modifications to existing endpoints
- Database schema changes
- Infrastructure changes (new services, scaling configuration, network rules)
- Changes to authentication or authorization logic
- Third-party integration additions or modifications

Normal changes require code review, automated testing, staging validation, and approval before production deployment.

## Emergency Changes
Changes required to resolve a critical production incident (P0 or P1) or patch an actively exploited vulnerability. Emergency changes follow an expedited process:

- Verbal or chat-based approval from the security lead or engineering manager
- May bypass staging environment testing if the incident severity warrants it
- Must be documented retroactively within 24 hours
- Subject to post-incident review

The team of ${engineerCount} engineers has defined clear criteria for what qualifies as an emergency to prevent misuse of the expedited process.`;
}

function generateEmergencyChangesProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const approval = resolveValue(answers, 'q4_7_approval');
  const plan = resolveValue(answers, 'q4_4_plan');
  const engineerCount = resolveValue(answers, 'q3.2');
  const cicd = resolveValue(answers, 'q2_3_cicd');

  return `# Emergency Changes

## Definition
An emergency change is a change that must be implemented immediately to resolve a critical production incident (P0 or P1), patch an actively exploited security vulnerability, or restore service availability. Emergency changes are the exception, not the norm.

## Expedited Approval Process
When the normal change management process (${approval}) cannot be followed due to time constraints:

1. **Verbal authorization** — The on-call engineer obtains verbal or chat-based approval from the security lead or engineering manager
2. **Minimal review** — At least one other engineer reviews the change before deployment, even if the review is conducted in real-time
3. **Direct deployment** — The change may be deployed directly to production through ${cicd}, bypassing staging environment validation if necessary
4. **Monitoring** — Enhanced monitoring is applied to the affected systems for a minimum of 4 hours following the change

## Documentation Requirements
All emergency changes must be retroactively documented within 24 hours of deployment, including:

- Description of the incident that triggered the emergency change
- The change that was implemented and its rationale
- Who approved the change and who deployed it
- Testing that was performed (or not performed) and justification
- Post-deployment verification results

## Guardrails
To prevent abuse of the emergency change process:

- Only P0 or P1 incidents qualify for emergency changes
- Emergency changes are tracked separately and reviewed in the weekly engineering meeting
- Any pattern of excessive emergency changes triggers a root cause review
- The security lead reviews all emergency changes within 48 hours

## Retroactive Review
Within 5 business days of an emergency change, the full change management process is completed retroactively. This includes code review, test verification, and formal documentation. If the emergency change does not pass retroactive review, a follow-up change is scheduled to address any issues.

[REVIEW] Verify that the emergency change criteria and approval chain are appropriate for your team of ${engineerCount} engineers. Ensure at least two people can authorize emergency changes to avoid single points of failure.`;
}

function generateBoundariesProse(
  answers: Record<string, unknown>,
  companyName: string,
): string {
  const criteria = resolveValue(answers, 'q5_1');
  const systems = resolveValue(answers, 'q5_2_systems');
  const carveOuts = resolveValue(answers, 'q5_3');
  const otherSystems = resolveValue(answers, 'q5_2_other');
  const frameworks = resolveValue(answers, 'q5_4');

  return `# Boundaries and Scope

## Audit Scope
The scope of ${companyName}'s SOC 2 examination encompasses the systems, infrastructure, and processes that support the delivery of its services to customers. The following Trust Services Criteria are in scope: ${criteria}.

The systems included in the audit scope are:

${systems}

${otherSystems !== 'Not specified' ? `Additional systems in scope: ${otherSystems}` : ''}

## Carve-Outs and Exclusions
${carveOuts !== 'Not specified' ? `The following systems or business units are explicitly excluded from the audit scope: ${carveOuts}. These exclusions are documented and communicated to the auditor, with justification for each exclusion.` : `${companyName} has not identified any carve-outs or exclusions at this time. All systems that process, store, or transmit customer data are included in the audit scope.`}

## Additional Compliance Frameworks
${frameworks !== 'Not specified' ? `In addition to SOC 2, ${companyName} is targeting compliance with: ${frameworks}. Controls are mapped across frameworks to ensure efficient compliance management and avoid duplication of effort.` : `${companyName} is currently focused on SOC 2 compliance. Additional frameworks may be added in future audit cycles based on customer and regulatory requirements.`}

[REVIEW] Review the systems in scope and carve-outs with your auditor to ensure alignment. Any changes to scope after the audit period begins may require re-scoping.`;
}

// ---------------------------------------------------------------------------
// AI prose generation
// ---------------------------------------------------------------------------
// NOTE: The generator runs server-side in an API route, so we can't use
// relative fetch to /api/intake/ai-preview. For now we always use the mock
// prose generator, which produces realistic compliance language from answers.
// When biged-rs integration is wired up, this will call the inference API
// directly instead of going through the Next.js API route.

async function tryAiGenerate(
  _prompt: string,
  _companyName: string,
): Promise<string | null> {
  // TODO: Wire up direct biged-rs inference call here
  return null;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateDocument(
  template: DocTemplate,
  answers: Record<string, unknown>,
  companyProfile: { name: string; size: string; description: string },
): Promise<GeneratedDocument> {
  const docId = `doc_${template.id}_${Date.now()}`;
  const sections: GeneratedSection[] = [];

  for (const section of template.sections) {
    // Handle conditional sections
    if (section.type === 'conditional') {
      if (section.condition && !section.condition(answers)) {
        continue; // Skip this section
      }
    }

    let content: string;

    if (section.type === 'ai_generate') {
      // Try AI generation first, fall back to mock
      const interpolatedPrompt = interpolate(section.content || '', answers);
      const aiResult = await tryAiGenerate(interpolatedPrompt, companyProfile.name);

      if (aiResult) {
        content = `# ${section.title}\n\n${aiResult}`;
      } else {
        content = mockProse(section, answers, companyProfile.name);
      }
    } else {
      // Static or conditional (that passed its condition check)
      content = interpolate(section.content || '', answers);
    }

    sections.push({
      id: `${docId}_${section.id}`,
      title: section.title,
      content,
      hasReviewTag: section.reviewRequired || content.includes('[REVIEW]'),
      reviewNote: section.reviewRequired
        ? 'This section requires human review before approval.'
        : undefined,
      status: 'pending',
    });
  }

  return {
    id: docId,
    templateId: template.id,
    name: template.name,
    sections,
    status: 'generated',
    generatedAt: new Date().toISOString(),
  };
}
