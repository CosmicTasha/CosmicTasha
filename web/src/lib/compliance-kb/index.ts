// Core engine and types
export { ScoreEngine } from "./engine";
export type {
  Dimension,
  ReadinessScore,
  Finding,
  ComplianceTemplate,
  IntakeAnswers,
} from "./types";

// Auditor guidance
export { auditorExpectations } from "./soc2/guidance/auditor-expectations";
export { commonFindings } from "./soc2/guidance/common-findings";
export { remediationPaths } from "./soc2/guidance/remediation-paths";
export type { RemediationPath } from "./soc2/guidance/remediation-paths";

// Scoring dimensions
import { allDimensions } from "./soc2/dimensions";
export { allDimensions as soc2Dimensions };

// Pre-configured SOC 2 engine instance
import { ScoreEngine } from "./engine";
export const soc2Engine = new ScoreEngine(allDimensions);

// Compliance document templates
import { soc2Templates } from "./soc2/templates";
export { soc2Templates };
