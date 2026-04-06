import type { DocTemplate } from '../types';
import { systemDescriptionTemplate } from './system-description';
import { informationSecurityPolicyTemplate } from './information-security-policy';
import { incidentResponsePlanTemplate } from './incident-response-plan';
import { accessControlPolicyTemplate } from './access-control-policy';
import { changeManagementPolicyTemplate } from './change-management-policy';

// ---------------------------------------------------------------------------
// All templates — ordered by priority then name
// ---------------------------------------------------------------------------

export const allTemplates: DocTemplate[] = [
  systemDescriptionTemplate,
  informationSecurityPolicyTemplate,
  incidentResponsePlanTemplate,
  accessControlPolicyTemplate,
  changeManagementPolicyTemplate,
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
