/* ------------------------------------------------------------------ */
/*  Gap / Strength Detector                                            */
/*  Runs on every answer change — keep it fast, no regex.              */
/* ------------------------------------------------------------------ */

export interface DetectedGap {
  id: string;
  type: "gap" | "strength";
  severity: "p0" | "p1" | "p2" | "p3";
  dimension:
    | "access_control"
    | "data_protection"
    | "operational_readiness"
    | "change_management"
    | "documentation";
  title: string;
  description: string;
  sourceQuestion: string;
  stage: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Safely read a top-level answer value. */
function get(answers: Record<string, unknown>, key: string): unknown {
  return answers[key] ?? undefined;
}

/** Check if an array answer is exactly ["None"]. */
function isNoneArray(val: unknown): boolean {
  return Array.isArray(val) && val.length === 1 && val[0] === "None";
}

/** Check if an array includes a value (case-sensitive). */
function arrIncludes(val: unknown, needle: string): boolean {
  return Array.isArray(val) && val.includes(needle);
}

/** Read a nested field from an object answer, e.g. q4_1.mfa */
function nested(answers: Record<string, unknown>, key: string, field: string): unknown {
  const obj = answers[key];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return (obj as Record<string, unknown>)[field] ?? undefined;
  }
  return undefined;
}

/** Lowercase string check with includes(). */
function strIncludes(val: unknown, needle: string): boolean {
  return typeof val === "string" && val.toLowerCase().includes(needle.toLowerCase());
}

function strEquals(val: unknown, expected: string): boolean {
  return typeof val === "string" && val === expected;
}

/* ------------------------------------------------------------------ */
/*  Detection rules                                                    */
/* ------------------------------------------------------------------ */

export function detectGaps(answers: Record<string, unknown>): DetectedGap[] {
  const results: DetectedGap[] = [];

  /* ------ Stage 2 ------ */

  if (isNoneArray(get(answers, "q2_3_identity"))) {
    results.push({
      id: "gap_no_identity_provider",
      type: "gap",
      severity: "p1",
      dimension: "access_control",
      title: "No Centralized Identity Provider",
      description:
        "Without a centralized identity provider, user access is harder to manage and audit across systems.",
      sourceQuestion: "q2_3_identity",
      stage: 2,
    });
  }

  if (isNoneArray(get(answers, "q2_3_monitoring"))) {
    results.push({
      id: "gap_no_monitoring",
      type: "gap",
      severity: "p1",
      dimension: "operational_readiness",
      title: "No Centralized Monitoring",
      description:
        "Lack of centralized monitoring makes it difficult to detect incidents and maintain visibility into system health.",
      sourceQuestion: "q2_3_monitoring",
      stage: 2,
    });
  }

  if (isNoneArray(get(answers, "q2_3_endpoint"))) {
    results.push({
      id: "gap_no_endpoint_mgmt",
      type: "gap",
      severity: "p2",
      dimension: "access_control",
      title: "No Endpoint Management",
      description:
        "Without endpoint management, device security and compliance cannot be enforced consistently.",
      sourceQuestion: "q2_3_endpoint",
      stage: 2,
    });
  }

  if (isNoneArray(get(answers, "q2_3_cicd"))) {
    results.push({
      id: "gap_no_cicd",
      type: "gap",
      severity: "p2",
      dimension: "change_management",
      title: "No CI/CD Pipeline",
      description:
        "Without CI/CD, changes lack automated testing and controlled deployment, increasing risk of defects.",
      sourceQuestion: "q2_3_cicd",
      stage: 2,
    });
  }

  // q2_5 strength: Code Review + Automated Tests
  const q2_5 = get(answers, "q2_5");
  if (q2_5 && typeof q2_5 === "object" && !Array.isArray(q2_5)) {
    const obj = q2_5 as Record<string, unknown>;
    if (strEquals(obj["Code Review"], "Yes") && strEquals(obj["Automated Tests"], "Yes")) {
      results.push({
        id: "strength_strong_cicd",
        type: "strength",
        severity: "p3",
        dimension: "change_management",
        title: "Strong CI/CD Pipeline",
        description:
          "Code reviews and automated tests are in place, reducing the risk of undetected defects reaching production.",
        sourceQuestion: "q2_5",
        stage: 2,
      });
    }
  }

  /* ------ Stage 3 ------ */

  if (strEquals(get(answers, "q3_1"), "Nobody has explicit security ownership")) {
    results.push({
      id: "gap_no_security_owner",
      type: "gap",
      severity: "p1",
      dimension: "access_control",
      title: "No Security Ownership",
      description:
        "Without explicit security ownership, accountability for security decisions and incident response is unclear.",
      sourceQuestion: "q3_1",
      stage: 3,
    });
  }

  if (strEquals(get(answers, "q3_4"), "Yes") && arrIncludes(get(answers, "q3_4_access"), "Customer data")) {
    results.push({
      id: "gap_contractors_customer_data",
      type: "gap",
      severity: "p2",
      dimension: "data_protection",
      title: "Contractors Access Customer Data",
      description:
        "Contractors with access to customer data require additional controls, agreements, and monitoring.",
      sourceQuestion: "q3_4",
      stage: 3,
    });
  }

  /* ------ Stage 4 ------ */

  // q4_1 sub-fields
  const q4_1_mfa = nested(answers, "q4_1", "mfa");
  const q4_1_access_reviews = nested(answers, "q4_1", "access_reviews");
  const q4_1_sso = nested(answers, "q4_1", "sso");

  if (strEquals(q4_1_mfa, "Not in place")) {
    results.push({
      id: "gap_no_mfa",
      type: "gap",
      severity: "p0",
      dimension: "access_control",
      title: "Multi-Factor Authentication Not Enforced",
      description:
        "MFA is a foundational access control. Without it, accounts are vulnerable to credential-based attacks.",
      sourceQuestion: "q4_1",
      stage: 4,
    });
  }

  if (strEquals(q4_1_access_reviews, "Never")) {
    results.push({
      id: "gap_no_access_reviews",
      type: "gap",
      severity: "p1",
      dimension: "access_control",
      title: "No Regular Access Reviews",
      description:
        "Without periodic access reviews, stale or excessive permissions accumulate over time.",
      sourceQuestion: "q4_1",
      stage: 4,
    });
  }

  if (strEquals(q4_1_sso, "No")) {
    results.push({
      id: "gap_no_sso",
      type: "gap",
      severity: "p2",
      dimension: "access_control",
      title: "No Single Sign-On",
      description:
        "SSO simplifies access management and improves security by centralizing authentication.",
      sourceQuestion: "q4_1",
      stage: 4,
    });
  }

  if (strEquals(q4_1_mfa, "Enforced for everyone") && strIncludes(q4_1_sso, "all")) {
    results.push({
      id: "strength_strong_access",
      type: "strength",
      severity: "p3",
      dimension: "access_control",
      title: "Strong Access Controls",
      description:
        "MFA enforced for all users and SSO deployed broadly — a solid access control foundation.",
      sourceQuestion: "q4_1",
      stage: 4,
    });
  }

  if (strEquals(get(answers, "q4_2_offboarding"), "No formal process")) {
    results.push({
      id: "gap_no_offboarding",
      type: "gap",
      severity: "p1",
      dimension: "access_control",
      title: "No Formal Offboarding Process",
      description:
        "Without a formal offboarding process, departed employees may retain access to systems and data.",
      sourceQuestion: "q4_2_offboarding",
      stage: 4,
    });
  }

  // q4_3 sub-fields
  if (strEquals(nested(answers, "q4_3", "encryption_rest"), "No")) {
    results.push({
      id: "gap_no_encryption_rest",
      type: "gap",
      severity: "p1",
      dimension: "data_protection",
      title: "No Encryption at Rest",
      description:
        "Data at rest without encryption is exposed if storage media is compromised or improperly decommissioned.",
      sourceQuestion: "q4_3",
      stage: 4,
    });
  }

  if (strEquals(nested(answers, "q4_3", "data_classification"), "No")) {
    results.push({
      id: "gap_no_data_classification",
      type: "gap",
      severity: "p2",
      dimension: "data_protection",
      title: "No Data Classification Policy",
      description:
        "Without data classification, sensitive data may not receive the protection it requires.",
      sourceQuestion: "q4_3",
      stage: 4,
    });
  }

  // q4_4 incident response
  if (strEquals(get(answers, "q4_4_plan"), "No")) {
    results.push({
      id: "gap_no_ir_plan",
      type: "gap",
      severity: "p0",
      dimension: "operational_readiness",
      title: "No Incident Response Plan",
      description:
        "Without an incident response plan, the team has no structured process for handling security events.",
      sourceQuestion: "q4_4_plan",
      stage: 4,
    });
  }

  if (strIncludes(get(answers, "q4_4_plan"), "tested")) {
    results.push({
      id: "strength_ir_tested",
      type: "strength",
      severity: "p3",
      dimension: "operational_readiness",
      title: "IR Plan Documented and Tested",
      description:
        "An incident response plan that has been tested demonstrates mature operational readiness.",
      sourceQuestion: "q4_4_plan",
      stage: 4,
    });
  }

  // q4_5 backups / DR
  if (strEquals(get(answers, "q4_5_backups"), "No")) {
    results.push({
      id: "gap_no_backups",
      type: "gap",
      severity: "p0",
      dimension: "operational_readiness",
      title: "No Regular Backups",
      description:
        "Without regular backups, data loss from any cause could be permanent and unrecoverable.",
      sourceQuestion: "q4_5_backups",
      stage: 4,
    });
  }

  if (strEquals(get(answers, "q4_5_tested_restore"), "No")) {
    results.push({
      id: "gap_untested_restore",
      type: "gap",
      severity: "p1",
      dimension: "operational_readiness",
      title: "Backup Restore Never Tested",
      description:
        "Backups that have never been tested may fail when needed most during an actual recovery event.",
      sourceQuestion: "q4_5_tested_restore",
      stage: 4,
    });
  }

  if (strEquals(get(answers, "q4_5_dr_plan"), "No")) {
    results.push({
      id: "gap_no_dr_plan",
      type: "gap",
      severity: "p1",
      dimension: "operational_readiness",
      title: "No Disaster Recovery Plan",
      description:
        "Without a disaster recovery plan, extended outages may result from infrastructure failures.",
      sourceQuestion: "q4_5_dr_plan",
      stage: 4,
    });
  }

  // q4_6 vulnerability / patch
  if (strEquals(get(answers, "q4_6_scanning"), "No")) {
    results.push({
      id: "gap_no_vuln_scanning",
      type: "gap",
      severity: "p1",
      dimension: "change_management",
      title: "No Vulnerability Scanning",
      description:
        "Without vulnerability scanning, known exploitable weaknesses may go undetected in your environment.",
      sourceQuestion: "q4_6_scanning",
      stage: 4,
    });
  }

  const q4_6_patch = get(answers, "q4_6_patch_speed");
  if (strIncludes(q4_6_patch, "get to it") || strIncludes(q4_6_patch, "don't track")) {
    results.push({
      id: "gap_no_patch_timeline",
      type: "gap",
      severity: "p1",
      dimension: "change_management",
      title: "No Patch Management Timeline",
      description:
        "Without a defined patch timeline, critical vulnerabilities may remain unpatched indefinitely.",
      sourceQuestion: "q4_6_patch_speed",
      stage: 4,
    });
  }

  // q4_7 change approval
  if (strIncludes(get(answers, "q4_7_approval"), "directly")) {
    results.push({
      id: "gap_no_change_approval",
      type: "gap",
      severity: "p1",
      dimension: "change_management",
      title: "No Change Approval Process",
      description:
        "Deploying changes without approval increases the risk of unreviewed or unauthorized modifications.",
      sourceQuestion: "q4_7_approval",
      stage: 4,
    });
  }

  // q4_9 logging
  if (strEquals(get(answers, "q4_9_logging"), "No")) {
    results.push({
      id: "gap_no_logging",
      type: "gap",
      severity: "p1",
      dimension: "operational_readiness",
      title: "No Centralized Logging",
      description:
        "Without centralized logging, investigating incidents and proving compliance is significantly harder.",
      sourceQuestion: "q4_9_logging",
      stage: 4,
    });
  }

  const q4_9_retention = get(answers, "q4_9_retention");
  if (strIncludes(q4_9_retention, "don't") || strIncludes(q4_9_retention, "no retention")) {
    results.push({
      id: "gap_insufficient_retention",
      type: "gap",
      severity: "p1",
      dimension: "operational_readiness",
      title: "Insufficient Log Retention",
      description:
        "Insufficient log retention means historical evidence may be unavailable for audits or investigations.",
      sourceQuestion: "q4_9_retention",
      stage: 4,
    });
  }

  /* ------ Stage 6 ------ */

  const q6_1 = get(answers, "q6_1");
  if (q6_1 && typeof q6_1 === "object" && !Array.isArray(q6_1)) {
    const docs = q6_1 as Record<string, unknown>;
    let haveCount = 0;

    for (const [docName, status] of Object.entries(docs)) {
      if (strEquals(status, "Don't have it")) {
        results.push({
          id: `gap_doc_missing_${docName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          type: "gap",
          severity: "p2",
          dimension: "documentation",
          title: `${docName} Missing`,
          description: `The "${docName}" document is not yet in place and will need to be created for compliance.`,
          sourceQuestion: "q6_1",
          stage: 6,
        });
      }
      if (strEquals(status, "Have it")) {
        haveCount++;
      }
    }

    if (haveCount >= 8) {
      results.push({
        id: "strength_strong_docs",
        type: "strength",
        severity: "p3",
        dimension: "documentation",
        title: "Strong Documentation Coverage",
        description:
          "Having 8 or more key documents in place shows strong documentation maturity.",
        sourceQuestion: "q6_1",
        stage: 6,
      });
    }
  }

  return results;
}
