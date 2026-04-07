import { describe, it, expect } from "vitest";
import type { Dimension, IntakeAnswers } from "@/lib/compliance-kb/types";
import { accessControl } from "@/lib/compliance-kb/soc2/dimensions/access-control";
import { systemOperations } from "@/lib/compliance-kb/soc2/dimensions/system-operations";
import { dataProtection } from "@/lib/compliance-kb/soc2/dimensions/data-protection";
import { changeManagement } from "@/lib/compliance-kb/soc2/dimensions/change-management";
import { riskAssessment } from "@/lib/compliance-kb/soc2/dimensions/risk-assessment";
import { vendorManagement } from "@/lib/compliance-kb/soc2/dimensions/vendor-management";
import { hrTraining } from "@/lib/compliance-kb/soc2/dimensions/hr-training";
import { businessContinuity } from "@/lib/compliance-kb/soc2/dimensions/business-continuity";
import { allDimensions } from "@/lib/compliance-kb/soc2/dimensions";

/* ------------------------------------------------------------------ */
/*  Metadata: every dimension exports a valid Dimension object         */
/* ------------------------------------------------------------------ */

const dimensionSpecs: Array<{
  dim: Dimension;
  expectedId: string;
  expectedWeight: number;
  expectedTscPrefix: string;
}> = [
  { dim: accessControl, expectedId: "access_control", expectedWeight: 0.20, expectedTscPrefix: "CC6" },
  { dim: systemOperations, expectedId: "system_operations", expectedWeight: 0.15, expectedTscPrefix: "CC7" },
  { dim: dataProtection, expectedId: "data_protection", expectedWeight: 0.15, expectedTscPrefix: "CC6" },
  { dim: changeManagement, expectedId: "change_management", expectedWeight: 0.10, expectedTscPrefix: "CC8" },
  { dim: riskAssessment, expectedId: "risk_assessment", expectedWeight: 0.10, expectedTscPrefix: "CC3" },
  { dim: vendorManagement, expectedId: "vendor_management", expectedWeight: 0.10, expectedTscPrefix: "CC9" },
  { dim: hrTraining, expectedId: "hr_training", expectedWeight: 0.10, expectedTscPrefix: "CC1" },
  { dim: businessContinuity, expectedId: "business_continuity", expectedWeight: 0.10, expectedTscPrefix: "A1" },
];

describe("All dimensions: metadata", () => {
  it("exports exactly 8 dimensions from index", () => {
    expect(allDimensions).toHaveLength(8);
  });

  it("weights sum to 1.0", () => {
    const total = allDimensions.reduce((sum, d) => sum + d.weight, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  for (const { dim, expectedId, expectedWeight, expectedTscPrefix } of dimensionSpecs) {
    describe(dim.id, () => {
      it(`has id "${expectedId}"`, () => {
        expect(dim.id).toBe(expectedId);
      });
      it(`has weight ${expectedWeight}`, () => {
        expect(dim.weight).toBe(expectedWeight);
      });
      it("has a non-empty name", () => {
        expect(dim.name.length).toBeGreaterThan(0);
      });
      it(`has tsc starting with ${expectedTscPrefix}`, () => {
        expect(dim.tsc.some((t) => t.startsWith(expectedTscPrefix))).toBe(true);
      });
      it("has an evaluate function", () => {
        expect(typeof dim.evaluate).toBe("function");
      });
    });
  }
});

/* ------------------------------------------------------------------ */
/*  Low confidence: unanswered questions                               */
/* ------------------------------------------------------------------ */

describe("All dimensions: low confidence when unanswered", () => {
  const empty: IntakeAnswers = {};

  for (const dim of allDimensions) {
    it(`${dim.id} returns confidence <= 0.25 with empty answers`, () => {
      const result = dim.evaluate(empty);
      expect(result.confidence).toBeLessThanOrEqual(0.25);
      expect(result.score).toBe(0);
      expect(result.findings).toHaveLength(0);
      expect(result.strengths).toHaveLength(0);
    });
  }
});

/* ------------------------------------------------------------------ */
/*  Access Control: detailed scoring                                   */
/* ------------------------------------------------------------------ */

describe("accessControl dimension", () => {
  it("returns high score when all answers are strong", () => {
    const answers: IntakeAnswers = {
      q4_1: {
        mfa: "Enforced for everyone",
        sso: "Yes, all apps",
        access_levels: "Formal documented RBAC",
        access_reviews: "Quarterly with sign-off",
      },
      q4_2_offboarding: "Same day revocation",
      q2_3_identity: ["Okta"],
      q2_3_endpoint: ["Jamf"],
    };
    const result = accessControl.evaluate(answers);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
    expect(result.findings).toHaveLength(0);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.confidence).toBe(1.0);
  });

  it("returns P0 finding when MFA is not in place", () => {
    const answers: IntakeAnswers = {
      q4_1: { mfa: "Not in place" },
    };
    const result = accessControl.evaluate(answers);
    const p0 = result.findings.filter((f) => f.severity === "P0");
    expect(p0).toHaveLength(1);
    expect(p0[0].tsc).toBe("CC6.1");
    expect(p0[0].gap).toContain("authentication");
  });

  it("returns P1 finding when MFA only for some users", () => {
    const answers: IntakeAnswers = {
      q4_1: { mfa: "Enforced for some admin users" },
    };
    const result = accessControl.evaluate(answers);
    const p1 = result.findings.filter((f) => f.severity === "P1");
    expect(p1.length).toBeGreaterThanOrEqual(1);
    expect(p1[0].gap).toContain("MFA");
  });

  it("returns P1 finding when no offboarding process", () => {
    const answers: IntakeAnswers = {
      q4_2_offboarding: "No formal process",
    };
    const result = accessControl.evaluate(answers);
    const gap = result.findings.find((f) => f.gap.includes("offboarding"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("P1");
  });

  it("returns P1 finding when no identity provider", () => {
    const answers: IntakeAnswers = {
      q2_3_identity: ["None"],
    };
    const result = accessControl.evaluate(answers);
    const gap = result.findings.find((f) => f.gap.includes("identity provider"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("P1");
  });
});

/* ------------------------------------------------------------------ */
/*  System Operations                                                  */
/* ------------------------------------------------------------------ */

describe("systemOperations dimension", () => {
  it("scores well with monitoring and strong CI/CD", () => {
    const answers: IntakeAnswers = {
      q2_3_monitoring: ["Datadog"],
      q2_5: { "Code Review": "Yes", "Automated Tests": "Yes" },
      q4_4_plan: "Documented and tested annually",
      q4_9_logging: "Yes, centralized",
      q4_9_retention: "1 year retention",
    };
    const result = systemOperations.evaluate(answers);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
    expect(result.findings).toHaveLength(0);
  });

  it("returns P0 for no IR plan", () => {
    const answers: IntakeAnswers = { q4_4_plan: "No" };
    const result = systemOperations.evaluate(answers);
    const p0 = result.findings.filter((f) => f.severity === "P0");
    expect(p0).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/*  Data Protection                                                    */
/* ------------------------------------------------------------------ */

describe("dataProtection dimension", () => {
  it("scores well with full encryption and classification", () => {
    const answers: IntakeAnswers = {
      q4_3: {
        encryption_rest: "Yes, all data",
        encryption_transit: "Yes, TLS everywhere",
        data_classification: "Documented classification policy",
        data_deletion: "Formal data retention and deletion process",
      },
      q3_4: "No",
    };
    const result = dataProtection.evaluate(answers);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it("flags P1 when no encryption at rest", () => {
    const answers: IntakeAnswers = {
      q4_3: { encryption_rest: "No" },
    };
    const result = dataProtection.evaluate(answers);
    const gap = result.findings.find((f) => f.gap.includes("encryption at rest"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("P1");
  });

  it("flags P2 when contractors access customer data", () => {
    const answers: IntakeAnswers = {
      q3_4: "Yes",
      q3_4_access: ["Customer data", "Source code"],
    };
    const result = dataProtection.evaluate(answers);
    const gap = result.findings.find((f) => f.gap.includes("Contractors"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("P2");
  });
});

/* ------------------------------------------------------------------ */
/*  Change Management                                                  */
/* ------------------------------------------------------------------ */

describe("changeManagement dimension", () => {
  it("scores well with formal approval and automated scanning", () => {
    const answers: IntakeAnswers = {
      q4_7_approval: "Formal change advisory board",
      q4_7_audit_trail: "Automated via CI/CD logs",
      q4_6_scanning: "Automated weekly scans",
      q4_6_patch_speed: "Critical within 24 hours",
      q2_3_cicd: ["GitHub Actions"],
    };
    const result = changeManagement.evaluate(answers);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it("flags P1 when deploying directly without approval", () => {
    const answers: IntakeAnswers = {
      q4_7_approval: "Developers deploy directly to production",
    };
    const result = changeManagement.evaluate(answers);
    const gap = result.findings.find((f) => f.gap.includes("directly"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("P1");
  });
});

/* ------------------------------------------------------------------ */
/*  Risk Assessment                                                    */
/* ------------------------------------------------------------------ */

describe("riskAssessment dimension", () => {
  it("scores well with formal methodology and risk register", () => {
    const answers: IntakeAnswers = {
      q4_7_risk_methodology: "Formal NIST RMF framework",
      q4_7_risk_register: "Maintained and reviewed quarterly",
      q3_1: "VP of Engineering owns security",
    };
    const result = riskAssessment.evaluate(answers);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it("flags P1 when no security ownership", () => {
    const answers: IntakeAnswers = {
      q3_1: "Nobody has explicit security ownership",
    };
    const result = riskAssessment.evaluate(answers);
    const gap = result.findings.find((f) => f.gap.includes("security ownership"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("P1");
  });
});

/* ------------------------------------------------------------------ */
/*  Vendor Management                                                  */
/* ------------------------------------------------------------------ */

describe("vendorManagement dimension", () => {
  it("scores well with formal vendor reviews", () => {
    const answers: IntakeAnswers = {
      q4_8_vendor_reviews: "Annual formal vendor security reviews",
      q4_8_vendor_inventory: "Complete and up to date",
      q4_8_soc2_requirement: "Required for all critical vendors",
    };
    const result = vendorManagement.evaluate(answers);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it("flags P1 when no vendor review process", () => {
    const answers: IntakeAnswers = {
      q4_8_vendor_reviews: "No, we don't review vendors",
    };
    const result = vendorManagement.evaluate(answers);
    const gap = result.findings.find((f) => f.gap.includes("vendor"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("P1");
  });
});

/* ------------------------------------------------------------------ */
/*  HR & Training                                                      */
/* ------------------------------------------------------------------ */

describe("hrTraining dimension", () => {
  it("scores well with mandatory training program", () => {
    const answers: IntakeAnswers = {
      q4_9_security_training: "Mandatory annual training for all employees",
      q4_9_training_frequency: "Annual with quarterly phishing simulations",
      q4_9_onboarding_security: "Yes, included in onboarding",
    };
    const result = hrTraining.evaluate(answers);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it("flags P1 when no security training", () => {
    const answers: IntakeAnswers = {
      q4_9_security_training: "No",
    };
    const result = hrTraining.evaluate(answers);
    const gap = result.findings.find((f) => f.gap.includes("training"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("P1");
  });
});

/* ------------------------------------------------------------------ */
/*  Business Continuity                                                */
/* ------------------------------------------------------------------ */

describe("businessContinuity dimension", () => {
  it("scores well with DR plan, daily backups, and tested restores", () => {
    const answers: IntakeAnswers = {
      q4_5_dr_plan: "Yes, documented and tested",
      q4_5_backups: "Daily automated backups",
      q4_5_tested_restore: "Yes, tested quarterly",
      q6_1_bcp: "Have it",
    };
    const result = businessContinuity.evaluate(answers);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it("flags P0 when no backups", () => {
    const answers: IntakeAnswers = {
      q4_5_backups: "No",
    };
    const result = businessContinuity.evaluate(answers);
    const p0 = result.findings.filter((f) => f.severity === "P0");
    expect(p0).toHaveLength(1);
    expect(p0[0].gap).toContain("backup");
  });

  it("flags P1 when no DR plan", () => {
    const answers: IntakeAnswers = {
      q4_5_dr_plan: "No",
    };
    const result = businessContinuity.evaluate(answers);
    const gap = result.findings.find((f) => f.gap.includes("disaster recovery"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("P1");
  });
});
