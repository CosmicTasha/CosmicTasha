import type { ComplianceTemplate } from '../../types';

import { systemDescriptionTemplate } from './system-description';
import { informationSecurityPolicyTemplate } from './information-security-policy';
import { incidentResponsePlanTemplate } from './incident-response-plan';
import { accessControlPolicyTemplate } from './access-control-policy';
import { changeManagementPolicyTemplate } from './change-management-policy';
import { riskAssessmentTemplate } from './risk-assessment';
import { dataClassificationPolicyTemplate } from './data-classification-policy';
import { bcDrPlanTemplate } from './bc-dr-plan';
import { vendorManagementPolicyTemplate } from './vendor-management-policy';
import { encryptionPolicyTemplate } from './encryption-policy';
import { acceptableUsePolicyTemplate } from './acceptable-use-policy';
import { securityAwarenessTrainingTemplate } from './security-awareness-training';
import { auditLogProceduresTemplate } from './audit-log-procedures';
import { accessReviewTemplatesTemplate } from './access-review-templates';

// ---------------------------------------------------------------------------
// All 14 SOC 2 compliance templates — ordered by audit risk priority
// ---------------------------------------------------------------------------

export const soc2Templates: ComplianceTemplate[] = [
  // Critical (Priority 1-2)
  systemDescriptionTemplate,
  informationSecurityPolicyTemplate,
  // High (Priority 3-5)
  incidentResponsePlanTemplate,
  accessControlPolicyTemplate,
  changeManagementPolicyTemplate,
  // Medium (Priority 6-9)
  riskAssessmentTemplate,
  dataClassificationPolicyTemplate,
  bcDrPlanTemplate,
  vendorManagementPolicyTemplate,
  // Low (Priority 10-14)
  encryptionPolicyTemplate,
  acceptableUsePolicyTemplate,
  securityAwarenessTrainingTemplate,
  auditLogProceduresTemplate,
  accessReviewTemplatesTemplate,
];

// ---------------------------------------------------------------------------
// Lookup by ID
// ---------------------------------------------------------------------------

const templateMap = new Map<string, ComplianceTemplate>(
  soc2Templates.map((t) => [t.id, t]),
);

export function getComplianceTemplateById(
  id: string,
): ComplianceTemplate | undefined {
  return templateMap.get(id);
}

export function getComplianceTemplatesByRisk(
  risk: ComplianceTemplate['auditRisk'],
): ComplianceTemplate[] {
  return soc2Templates.filter((t) => t.auditRisk === risk);
}
