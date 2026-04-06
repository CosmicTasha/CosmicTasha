import type { DocTemplate } from '../types';
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
import { accessReviewTemplatesTemplate } from './access-review-templates';
import { auditLogProceduresTemplate } from './audit-log-procedures';
import { securityAwarenessTrainingTemplate } from './security-awareness-training';

// ---------------------------------------------------------------------------
// All templates — ordered by priority then name
// ---------------------------------------------------------------------------

export const allTemplates: DocTemplate[] = [
  // Priority 1
  systemDescriptionTemplate,
  informationSecurityPolicyTemplate,
  incidentResponsePlanTemplate,
  accessControlPolicyTemplate,
  changeManagementPolicyTemplate,
  // Priority 2
  bcDrPlanTemplate,
  dataClassificationPolicyTemplate,
  encryptionPolicyTemplate,
  riskAssessmentTemplate,
  vendorManagementPolicyTemplate,
  // Priority 3
  acceptableUsePolicyTemplate,
  accessReviewTemplatesTemplate,
  auditLogProceduresTemplate,
  securityAwarenessTrainingTemplate,
];

// ---------------------------------------------------------------------------
// Lookup by ID
// ---------------------------------------------------------------------------

const templateMap = new Map<string, DocTemplate>(
  allTemplates.map((t) => [t.id, t]),
);

export function getTemplateById(id: string): DocTemplate | undefined {
  return templateMap.get(id);
}

export function getTemplatesByPriority(
  priority: 1 | 2 | 3,
): DocTemplate[] {
  return allTemplates.filter((t) => t.priority === priority);
}
