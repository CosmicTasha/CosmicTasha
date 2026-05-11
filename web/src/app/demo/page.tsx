"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Demo seed data — realistic Series A SaaS startup for investor walkthrough
// ---------------------------------------------------------------------------

const DEMO_ANSWERS: Record<string, unknown> = {
  // Stage 0 — Welcome & Routing
  "q0.1": "founder",
  "q0.2": "first_time",
  "q0.3": "3_months",

  // Stage 1 — Company Profile
  "q1.1": "NovaBridge",
  "q1.2": "novabridge.io",
  "q1.3": "25",
  "q1.4":
    "We provide an API-first identity verification platform for fintech companies. Our product handles KYC/AML checks, document verification, and fraud scoring for banks and neobanks.",
  "q1.5": ["FinTech", "SaaS"],
  "q1.6": "2023",

  // Stage 2 — Technical Environment
  "q2_1": ["AWS"],
  "q2_1a_aws": ["EC2", "RDS", "S3", "Lambda", "CloudFront", "SQS"],
  "q2_2": "microservices",
  "q2_3_identity": "Okta",
  "q2_3_source_code": "GitHub",
  "q2_3_cicd": "GitHub Actions",
  "q2_3_monitoring": "Datadog",
  "q2_3_project": "Linear",
  "q2_3_communication": "Slack",
  "q2_3_hr": "Rippling",
  "q2_3_endpoint": "Jamf",
  "q2_4": [
    "Customer PII",
    "Government-issued ID documents",
    "Financial records",
    "Authentication credentials",
  ],
  "q2_5": {
    "Code Review / PR": { status: "Yes", tool: "GitHub PRs" },
    "Automated Testing": { status: "Yes", tool: "Jest + Playwright" },
    "Staging Validation": { status: "Yes", tool: "Staging environment" },
    "Deployment": { status: "Automated", tool: "GitHub Actions → ECS" },
  },
  "q2_6": [
    { name: "Production", isolated: "Yes — separate AWS account" },
    { name: "Staging", isolated: "Yes — separate VPC" },
    { name: "Development", isolated: "Yes — local + dev account" },
  ],

  // Stage 3 — Organizational Structure
  "q3.1": "CTO",
  "q3.1_lead_name": "Jordan Park",
  "q3.1_lead_email": "jordan@novabridge.io",
  "q3.2": "14",
  "q3.3": "Remote-first (US timezones)",
  "q3.4": "Yes",
  "q3.4_access": ["Production monitoring (read-only)", "CI/CD pipelines"],
  "q3.5": ["Engineering", "Product", "Customer Success", "Legal/Compliance"],

  // Stage 4 — Security Posture
  "q4_1": {
    mfa: { status: "Yes" },
    sso: { status: "Yes, via Okta" },
    rbac: { status: "In progress" },
    password_policy: { status: "Yes — 16 char minimum" },
  },
  "q4_2_onboarding": [
    "Background check",
    "NDA signing",
    "Security training",
    "Laptop provisioning (Jamf)",
  ],
  "q4_2_offboarding": "Within 4 hours of separation",
  "q4_3": {
    transit: { status: "TLS 1.3 everywhere" },
    rest: { status: "AES-256 (RDS + S3)" },
    key_mgmt: { status: "AWS KMS" },
  },
  "q4_4_plan": "Documented, reviewed quarterly",
  "q4_4_last_updated": "2026-01",
  "q4_4_had_incident": "No production incidents",
  "q4_4_post_review": "Yes — all incidents get a blameless retrospective",
  "q4_5_backups": "Daily automated (RDS snapshots + S3 versioning)",
  "q4_5_tested_restore": "Last tested 2026-02",
  "q4_5_backup_location": "Cross-region (us-east-1 → us-west-2)",
  "q4_5_downtime_impact": "Revenue loss, customer SLA breach",
  "q4_5_dr_plan": "Documented — 4hr RTO, 1hr RPO",
  "q4_6_scanning": "Weekly automated (Snyk + Trivy)",
  "q4_6_scan_types": ["SAST", "SCA", "Container scanning"],
  "q4_6_patch_speed": "Critical: 24hr, High: 7 days",
  "q4_6_pentest": "Annual third-party (last: Q4 2025)",
  "q4_7_approval": "PR review required, 2 approvals for infrastructure",
  "q4_7_audit_trail": "Full Git history + GitHub audit log",
  "q4_8": {
    awareness_training: { status: "Yes — quarterly via KnowBe4" },
    secure_coding: { status: "Yes — OWASP top 10 onboarding" },
    phishing_tests: { status: "Yes — monthly" },
  },
  "q4_9_logging": "Centralized in Datadog (application + infrastructure)",
  "q4_9_alerts": "PagerDuty escalation + Datadog monitors",
  "q4_9_retention": "12 months (CloudWatch → S3 Glacier)",

  // Stage 5 — Scope & Trust Services
  "q5_1": ["security", "availability", "confidentiality"],
  "q5_2_systems": [
    { name: "Identity Verification API", status: "Production" },
    { name: "Admin Dashboard", status: "Production" },
    { name: "Document Processing Pipeline", status: "Production" },
    { name: "Fraud Scoring Engine", status: "Production" },
  ],
  "q5_2_other": "",
  "q5_3": "Internal corporate IT (email, G Suite) is excluded from scope",
  "q5_4": ["SOC 2 Type II", "PCI DSS (planned Q3 2026)"],

  // Stage 6 — Policy & Documentation
  "q6_1": [
    { name: "Information Security Policy", status: "Draft" },
    { name: "Acceptable Use Policy", status: "Draft" },
    { name: "Incident Response Plan", status: "Documented" },
  ],
  "q6_2": "CTO",
  "q6_2_name": "Jordan Park",
  "q6_2_email": "jordan@novabridge.io",
  "q6_2_title": "Chief Technology Officer",
  "q6_3": "Annually",
  "q6_4": "Markdown in GitHub repo",
  "q6_5": "",
};

const DEMO_STATE = {
  sessionId: "demo_investor_" + Date.now(),
  answers: DEMO_ANSWERS,
  currentStage: 6,
  persona: "founder",
  readinessScore: null, // calculated by context on load
  stageCompletion: {
    0: "completed",
    1: "completed",
    2: "completed",
    3: "completed",
    4: "completed",
    5: "completed",
    6: "completed",
  },
  lastActivityAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Demo page — seeds localStorage and redirects to results
// ---------------------------------------------------------------------------

export default function DemoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "redirecting">(
    "loading"
  );

  useEffect(() => {
    localStorage.setItem("cosmictasha_intake", JSON.stringify(DEMO_STATE));
    // Side effect of seeding demo data — must run on mount; setState reflects completion
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("ready");

    // Short pause so the user sees the seed confirmation, then redirect
    const timer = setTimeout(() => {
      setStatus("redirecting");
      router.push("/intake/results");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-ct-base flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl font-bold text-ct-text-primary">
          {status === "loading" && "Loading demo..."}
          {status === "ready" && "Demo data loaded"}
          {status === "redirecting" && "Redirecting to results..."}
        </div>
        <p className="text-ct-text-secondary text-lg">
          {status === "ready"
            ? "NovaBridge — Series A fintech startup, 25 employees, SOC 2 Type II"
            : "Preparing investor walkthrough..."}
        </p>
        <div className="flex justify-center gap-2 pt-4">
          <div
            className={`w-2 h-2 rounded-full ${
              status !== "loading"
                ? "bg-ct-status-strength"
                : "bg-ct-text-tertiary"
            }`}
          />
          <div
            className={`w-2 h-2 rounded-full ${
              status === "redirecting"
                ? "bg-ct-status-strength"
                : "bg-ct-text-tertiary"
            }`}
          />
          <div className="w-2 h-2 rounded-full bg-ct-text-tertiary" />
        </div>
      </div>
    </div>
  );
}
