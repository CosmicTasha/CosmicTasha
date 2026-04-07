export { accessControl } from "./access-control";
export { systemOperations } from "./system-operations";
export { dataProtection } from "./data-protection";
export { changeManagement } from "./change-management";
export { riskAssessment } from "./risk-assessment";
export { vendorManagement } from "./vendor-management";
export { hrTraining } from "./hr-training";
export { businessContinuity } from "./business-continuity";

import type { Dimension } from "../../types";
import { accessControl } from "./access-control";
import { systemOperations } from "./system-operations";
import { dataProtection } from "./data-protection";
import { changeManagement } from "./change-management";
import { riskAssessment } from "./risk-assessment";
import { vendorManagement } from "./vendor-management";
import { hrTraining } from "./hr-training";
import { businessContinuity } from "./business-continuity";

/** All 8 SOC 2 scoring dimensions, ordered by weight descending. */
export const allDimensions: Dimension[] = [
  accessControl,
  systemOperations,
  dataProtection,
  changeManagement,
  riskAssessment,
  vendorManagement,
  hrTraining,
  businessContinuity,
];
