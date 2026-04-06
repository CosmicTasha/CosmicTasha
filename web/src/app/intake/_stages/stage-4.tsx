"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionCard } from "../_components/question-card";
import { ChipMultiSelect } from "../_components/chip-multi-select";
import { cn } from "@/lib/utils";
import { InlineInsight } from "../_components/inline-insight";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Stage4Props {
  answers: Record<string, unknown>;
  onAnswer: (questionId: string, value: unknown) => void;
  onContinue?: () => void;
}

// ---------------------------------------------------------------------------
// Inline: StatusSelector — horizontal pill selector for checklist rows
// ---------------------------------------------------------------------------

function StatusSelector({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isSelected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
              isSelected
                ? "bg-ct-accent text-white shadow-sm"
                : "bg-ct-surface-raised text-ct-text-secondary hover:text-ct-text-primary"
            )}
            aria-pressed={isSelected}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline: SecuritySection — collapsible card section
// ---------------------------------------------------------------------------

function SecuritySection({
  title,
  isOpen,
  onToggle,
  children,
  isComplete,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isComplete: boolean;
}) {
  return (
    <div className="rounded-xl border border-ct-border-subtle bg-ct-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-ct-surface-raised"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ct-text-primary">
            {title}
          </span>
          {isComplete && (
            <span className="flex size-5 items-center justify-center rounded-full bg-[#34D399]/15 text-[#34D399]">
              <Check className="size-3" />
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-ct-text-tertiary transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-8 px-5 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline: remediation note
// ---------------------------------------------------------------------------

function RemediationNote() {
  return (
    <p className="mt-1 text-xs text-ct-text-tertiary italic">
      We&apos;ll include a remediation plan for this.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Inline: truthfulness nudge
// ---------------------------------------------------------------------------

function TruthfulnessNudge({
  children,
  variant = "amber",
}: {
  children: React.ReactNode;
  variant?: "amber" | "green";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border-l-2 bg-ct-surface p-3 transition-opacity duration-300",
        variant === "green"
          ? "border-[#34D399]"
          : "border-ct-accent-secondary"
      )}
    >
      <p className="text-xs text-ct-text-secondary">{children}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline: checklist helper text (shown before checklist sections)
// ---------------------------------------------------------------------------

function ChecklistHelperText() {
  return (
    <p className="text-xs text-ct-text-tertiary italic mb-2">
      Check what&apos;s actually in place today, not what you&apos;re planning.
      We&apos;ll document your roadmap for the rest.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Inline: normalizing nudge (per-row contextual text for gaps)
// ---------------------------------------------------------------------------

function NormalizingNudge({
  percentage,
  controlName,
}: {
  percentage: string;
  controlName: string;
}) {
  return (
    <p className="text-xs text-ct-text-tertiary mt-1 transition-opacity duration-300">
      That&apos;s useful to know &mdash; {percentage} of companies your size
      don&apos;t have {controlName} either. We&apos;ll include a remediation
      timeline.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Helpers: normalizing percentage lookup by company size
// ---------------------------------------------------------------------------

type SizeRange = "1-5" | "6-15" | "16-50" | "51+";

const NORMALIZING_PERCENTAGES: Record<
  string,
  Record<SizeRange, string>
> = {
  mfa: { "1-5": "60%", "6-15": "45%", "16-50": "25%", "51+": "10%" },
  sso: { "1-5": "70%", "6-15": "55%", "16-50": "30%", "51+": "15%" },
  access_reviews: {
    "1-5": "75%",
    "6-15": "55%",
    "16-50": "35%",
    "51+": "20%",
  },
};

function getNormalizingPercentage(
  control: string,
  companySize: string
): string | null {
  const sizeMap = NORMALIZING_PERCENTAGES[control];
  if (!sizeMap) return null;
  return sizeMap[companySize as SizeRange] ?? null;
}

// ---------------------------------------------------------------------------
// Inline: SOC 2 note
// ---------------------------------------------------------------------------

function Soc2Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-[#34D399] bg-ct-surface px-4 py-3">
      <p className="text-xs text-ct-text-secondary">{children}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist row — label + status selector + optional remediation note
// ---------------------------------------------------------------------------

function ChecklistRow({
  label,
  options,
  value,
  onChange,
  remediationTriggers,
  children,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  remediationTriggers?: string[];
  children?: React.ReactNode;
}) {
  const showRemediation =
    value !== null &&
    remediationTriggers &&
    remediationTriggers.includes(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-ct-text-primary shrink-0">{label}</span>
        <StatusSelector options={options} value={value} onChange={onChange} />
      </div>
      {showRemediation && <RemediationNote />}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getObj(
  answers: Record<string, unknown>,
  key: string
): Record<string, string> {
  return (answers[key] as Record<string, string>) ?? {};
}

function setField(
  answers: Record<string, unknown>,
  key: string,
  field: string,
  value: string,
  onAnswer: (k: string, v: unknown) => void
) {
  const obj = getObj(answers, key);
  onAnswer(key, { ...obj, [field]: value });
}

// ---------------------------------------------------------------------------
// Completeness checks per section
// ---------------------------------------------------------------------------

function isQ41Complete(answers: Record<string, unknown>): boolean {
  const obj = getObj(answers, "q4_1");
  return !!(
    obj.mfa &&
    obj.sso &&
    obj.unique_accounts &&
    obj.access_levels &&
    obj.access_reviews
  );
}

function isQ42Complete(answers: Record<string, unknown>): boolean {
  const onboarding = (answers["q4_2_onboarding"] as string[]) ?? [];
  const offboarding = (answers["q4_2_offboarding"] as string) ?? "";
  return onboarding.length > 0 && offboarding.length > 0;
}

function isQ43Complete(answers: Record<string, unknown>): boolean {
  const obj = getObj(answers, "q4_3");
  return !!(
    obj.encrypted_at_rest &&
    obj.encrypted_in_transit &&
    obj.classification &&
    obj.deletion
  );
}

function isQ44Complete(answers: Record<string, unknown>): boolean {
  const plan = (answers["q4_4_plan"] as string) ?? "";
  const incident = (answers["q4_4_had_incident"] as string) ?? "";
  return plan.length > 0 && incident.length > 0;
}

function isQ45Complete(answers: Record<string, unknown>): boolean {
  const backups = (answers["q4_5_backups"] as string) ?? "";
  const downtime = (answers["q4_5_downtime_impact"] as string) ?? "";
  const dr = (answers["q4_5_dr_plan"] as string) ?? "";
  return backups.length > 0 && downtime.length > 0 && dr.length > 0;
}

function isQ46Complete(answers: Record<string, unknown>): boolean {
  const scanning = (answers["q4_6_scanning"] as string) ?? "";
  const patch = (answers["q4_6_patch_speed"] as string) ?? "";
  const pentest = (answers["q4_6_pentest"] as string) ?? "";
  return scanning.length > 0 && patch.length > 0 && pentest.length > 0;
}

function isQ47Complete(answers: Record<string, unknown>): boolean {
  const approval = (answers["q4_7_approval"] as string) ?? "";
  const trail = (answers["q4_7_audit_trail"] as string) ?? "";
  return approval.length > 0 && trail.length > 0;
}

function isQ48Complete(answers: Record<string, unknown>): boolean {
  const obj = getObj(answers, "q4_8");
  return !!(obj.waf && obj.ids_ips && obj.segmentation && obj.vpn);
}

function isQ49Complete(answers: Record<string, unknown>): boolean {
  const logging = (answers["q4_9_logging"] as string) ?? "";
  const alerts = (answers["q4_9_alerts"] as string) ?? "";
  const retention = (answers["q4_9_retention"] as string) ?? "";
  return logging.length > 0 && alerts.length > 0 && retention.length > 0;
}

// ---------------------------------------------------------------------------
// Should Q4.8 be skipped? (serverless-only on Heroku/Vercel/Netlify)
// ---------------------------------------------------------------------------

function shouldSkipQ48(answers: Record<string, unknown>): boolean {
  const hosting = (answers["q2_1"] as string[]) ?? [];
  const arch = (answers["q2_2"] as string) ?? "";

  const serverlessOnlyHosts = ["Heroku", "Vercel", "Netlify"];
  const isOnlyServerlessHosts =
    hosting.length > 0 &&
    hosting.every((h) => serverlessOnlyHosts.includes(h));
  const isServerless = arch === "Serverless";

  return isOnlyServerlessHosts && isServerless;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Stage4({
  answers,
  onAnswer,
  onContinue,
}: Stage4Props) {
  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >({
    q41: true,
    q42: false,
    q43: false,
    q44: false,
    q45: false,
    q46: false,
    q47: false,
    q48: false,
    q49: false,
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Q4.1 object
  const q41 = getObj(answers, "q4_1");

  // Q4.2
  const q42Onboarding = (answers["q4_2_onboarding"] as string[]) ?? [];
  const q42Offboarding = (answers["q4_2_offboarding"] as string) ?? "";

  // Q4.3 object
  const q43 = getObj(answers, "q4_3");

  // Q4.4
  const q44Plan = (answers["q4_4_plan"] as string) ?? "";
  const q44LastUpdated = (answers["q4_4_last_updated"] as string) ?? "";
  const q44HadIncident = (answers["q4_4_had_incident"] as string) ?? "";
  const q44PostReview = (answers["q4_4_post_review"] as string) ?? "";

  // Q4.5
  const q45Backups = (answers["q4_5_backups"] as string) ?? "";
  const q45TestedRestore = (answers["q4_5_tested_restore"] as string) ?? "";
  const q45BackupLocation = (answers["q4_5_backup_location"] as string) ?? "";
  const q45DowntimeImpact = (answers["q4_5_downtime_impact"] as string) ?? "";
  const q45DrPlan = (answers["q4_5_dr_plan"] as string) ?? "";

  // Q4.6
  const q46Scanning = (answers["q4_6_scanning"] as string) ?? "";
  const q46ScanTypes = (answers["q4_6_scan_types"] as string[]) ?? [];
  const q46PatchSpeed = (answers["q4_6_patch_speed"] as string) ?? "";
  const q46Pentest = (answers["q4_6_pentest"] as string) ?? "";

  // Q4.7
  const q47Approval = (answers["q4_7_approval"] as string) ?? "";
  const q47AuditTrail = (answers["q4_7_audit_trail"] as string) ?? "";

  // Q4.8 object
  const q48 = getObj(answers, "q4_8");
  const skipQ48 = shouldSkipQ48(answers);

  // Q4.9
  const q49Logging = (answers["q4_9_logging"] as string) ?? "";
  const q49Alerts = (answers["q4_9_alerts"] as string) ?? "";
  const q49Retention = (answers["q4_9_retention"] as string) ?? "";

  // Company size from Stage 1 (used for normalizing nudges)
  const companySize = (answers["q1_3"] as string) ?? "";

  // Has a documented/informal plan (any answer that isn't "No")
  const hasPlan = q44Plan !== "" && q44Plan !== "No";
  const hasBackups = q45Backups !== "" && q45Backups !== "No";
  const hasScanning =
    q46Scanning !== "" && q46Scanning !== "No";

  // Q4.1 — all-positive detection for truthfulness nudge #2
  const q41AllPositive =
    q41.mfa === "Enforced for everyone" &&
    q41.sso === "Yes, all apps" &&
    q41.unique_accounts === "Yes" &&
    q41.access_levels === "Formally documented" &&
    q41.access_reviews === "Quarterly+";

  // Q4.1 — per-control gap detection for normalizing nudges (#3)
  const mfaGap = q41.mfa === "Not in place";
  const ssoGap = q41.sso === "No";
  const accessReviewsGap = q41.access_reviews === "Never";

  // Aspirational answer detector (#6)
  const isSmallCompany =
    companySize === "1-5" || companySize === "6-15";
  const matureSignals = [
    q41.mfa === "Enforced for everyone",
    q41.sso === "Yes, all apps",
    q41.access_levels === "Formally documented",
    q41.access_reviews === "Quarterly+",
    q43.encrypted_at_rest === "All",
    q44Plan === "Documented + tested",
    q45Backups === "Automated daily+",
    q46Scanning === "Automated + regular",
  ].filter(Boolean).length;
  const showAspirationalNudge = isSmallCompany && matureSignals >= 4;

  // Continue gate: Q4.1-Q4.7 must have at least partial answers
  const canContinue =
    isQ41Complete(answers) &&
    isQ42Complete(answers) &&
    isQ43Complete(answers) &&
    isQ44Complete(answers) &&
    isQ45Complete(answers) &&
    isQ46Complete(answers) &&
    isQ47Complete(answers);

  return (
    <div className="flex flex-col gap-6">
      {/* Opening prompt */}
      <p className="text-sm italic text-ct-text-secondary leading-relaxed">
        This is the section where honesty matters most. Your SOC 2 auditor will
        test whether your practices match your policies — so the more accurate
        you are here, the better your documents will be. Gaps are expected and
        totally fine.
      </p>

      {/* Invite hint */}
      <p className="text-xs text-ct-text-tertiary -mt-2">
        Tip: You can{" "}
        <span className="text-ct-accent">invite a teammate</span> to fill in
        this section using the sidebar.
      </p>

      {/* ----------------------------------------------------------------- */}
      {/* Q4.1 — Authentication & Access Control                            */}
      {/* ----------------------------------------------------------------- */}
      <SecuritySection
        title="Q4.1 — Authentication & Access Control"
        isOpen={openSections.q41}
        onToggle={() => toggle("q41")}
        isComplete={isQ41Complete(answers)}
      >
        <ChecklistHelperText />
        <div className="flex flex-col gap-5">
          <ChecklistRow
            label="Multi-factor authentication (MFA)"
            options={[
              "Enforced for everyone",
              "Enforced for some",
              "Available but optional",
              "Not in place",
            ]}
            value={q41.mfa ?? null}
            onChange={(v) => setField(answers, "q4_1", "mfa", v, onAnswer)}
            remediationTriggers={["Not in place"]}
          >
            {mfaGap && getNormalizingPercentage("mfa", companySize) && (
              <NormalizingNudge
                percentage={getNormalizingPercentage("mfa", companySize)!}
                controlName="MFA"
              />
            )}
          </ChecklistRow>
          <ChecklistRow
            label="Single Sign-On (SSO)"
            options={["Yes, all apps", "Yes, some apps", "No"]}
            value={q41.sso ?? null}
            onChange={(v) => setField(answers, "q4_1", "sso", v, onAnswer)}
          >
            {ssoGap && getNormalizingPercentage("sso", companySize) && (
              <NormalizingNudge
                percentage={getNormalizingPercentage("sso", companySize)!}
                controlName="SSO"
              />
            )}
          </ChecklistRow>
          <ChecklistRow
            label="Unique accounts (no shared logins)"
            options={["Yes", "Mostly", "Some shared accounts"]}
            value={q41.unique_accounts ?? null}
            onChange={(v) =>
              setField(answers, "q4_1", "unique_accounts", v, onAnswer)
            }
          />
          <ChecklistRow
            label="Documented access levels/roles"
            options={["Formally documented", "Informally understood", "No"]}
            value={q41.access_levels ?? null}
            onChange={(v) =>
              setField(answers, "q4_1", "access_levels", v, onAnswer)
            }
          />
          <ChecklistRow
            label="Regular access reviews"
            options={[
              "Quarterly+",
              "Annually",
              "When someone leaves",
              "Never",
            ]}
            value={q41.access_reviews ?? null}
            onChange={(v) =>
              setField(answers, "q4_1", "access_reviews", v, onAnswer)
            }
            remediationTriggers={["Never"]}
          >
            {accessReviewsGap &&
              getNormalizingPercentage("access_reviews", companySize) && (
                <NormalizingNudge
                  percentage={
                    getNormalizingPercentage("access_reviews", companySize)!
                  }
                  controlName="regular access reviews"
                />
              )}
          </ChecklistRow>
        </div>
        {q41AllPositive && (
          <TruthfulnessNudge>
            Nice &mdash; sounds like you&apos;ve got this area covered. Just
            double-checking: would your auditor find evidence for all of these if
            they asked today?
          </TruthfulnessNudge>
        )}
        {q41.mfa === "Enforced for everyone" && q41.sso?.toLowerCase().includes("all") && (
          <InlineInsight
            type="strength"
            title="Strong Access Controls"
            description="MFA enforced for all users and SSO deployed broadly — a solid access control foundation."
          />
        )}
        {q41.mfa === "Not in place" && (
          <InlineInsight
            type="gap"
            title="Multi-Factor Authentication Not Enforced"
            description="MFA is a foundational access control. Without it, accounts are vulnerable to credential-based attacks."
          />
        )}
        {q41.access_reviews === "Never" && (
          <InlineInsight
            type="gap"
            title="No Regular Access Reviews"
            description="Without periodic access reviews, stale or excessive permissions accumulate over time."
          />
        )}
      </SecuritySection>

      {/* ----------------------------------------------------------------- */}
      {/* Q4.2 — Employee Lifecycle                                         */}
      {/* ----------------------------------------------------------------- */}
      <SecuritySection
        title="Q4.2 — Employee Lifecycle"
        isOpen={openSections.q42}
        onToggle={() => toggle("q42")}
        isComplete={isQ42Complete(answers)}
      >
        <QuestionCard
          id="q4_2_onboarding"
          label="When a new employee joins, what happens?"
          required
        >
          <ChipMultiSelect
            options={[
              "Automated provisioning",
              "IT manually creates accounts",
              "Manager gives credentials",
              "No formal process",
            ]}
            selected={q42Onboarding}
            onChange={(val) => onAnswer("q4_2_onboarding", val)}
          />
        </QuestionCard>

        <QuestionCard
          id="q4_2_offboarding"
          label="When someone leaves, how quickly are accounts deactivated?"
          required
        >
          <StatusSelector
            options={[
              "Same day",
              "Within a week",
              "It depends",
              "No formal process",
            ]}
            value={q42Offboarding || null}
            onChange={(val) => onAnswer("q4_2_offboarding", val)}
          />
        </QuestionCard>
      </SecuritySection>

      {/* ----------------------------------------------------------------- */}
      {/* Q4.3 — Data Protection                                            */}
      {/* ----------------------------------------------------------------- */}
      <SecuritySection
        title="Q4.3 — Data Protection"
        isOpen={openSections.q43}
        onToggle={() => toggle("q43")}
        isComplete={isQ43Complete(answers)}
      >
        <ChecklistHelperText />
        <div className="flex flex-col gap-5">
          <ChecklistRow
            label="Data encrypted at rest?"
            options={["All", "Some", "No", "Don't know"]}
            value={q43.encrypted_at_rest ?? null}
            onChange={(v) =>
              setField(answers, "q4_3", "encrypted_at_rest", v, onAnswer)
            }
          />
          <ChecklistRow
            label="Data encrypted in transit?"
            options={["Yes", "Mostly", "Not sure"]}
            value={q43.encrypted_in_transit ?? null}
            onChange={(v) =>
              setField(answers, "q4_3", "encrypted_in_transit", v, onAnswer)
            }
          />
          <ChecklistRow
            label="Data classification policy?"
            options={["Documented", "Informal", "No"]}
            value={q43.classification ?? null}
            onChange={(v) =>
              setField(answers, "q4_3", "classification", v, onAnswer)
            }
          />
          <ChecklistRow
            label="Data deletion request handling?"
            options={["Formal process", "Case by case", "Haven't had to yet"]}
            value={q43.deletion ?? null}
            onChange={(v) =>
              setField(answers, "q4_3", "deletion", v, onAnswer)
            }
          />
        </div>
      </SecuritySection>

      {/* ----------------------------------------------------------------- */}
      {/* Q4.4 — Incident Response                                          */}
      {/* ----------------------------------------------------------------- */}
      <SecuritySection
        title="Q4.4 — Incident Response"
        isOpen={openSections.q44}
        onToggle={() => toggle("q44")}
        isComplete={isQ44Complete(answers)}
      >
        <QuestionCard
          id="q4_4_plan"
          label="Do you have an incident response plan?"
          required
        >
          <StatusSelector
            options={[
              "Documented + tested",
              "Documented, not tested",
              "Informal",
              "No",
            ]}
            value={q44Plan || null}
            onChange={(val) => onAnswer("q4_4_plan", val)}
          />
        </QuestionCard>

        {hasPlan && (
          <QuestionCard
            id="q4_4_last_updated"
            label="When was it last updated?"
          >
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={q44LastUpdated === "I don't know" ? "" : q44LastUpdated}
                onChange={(e) => onAnswer("q4_4_last_updated", e.target.value)}
                className="max-w-xs border-ct-border-subtle bg-ct-surface text-ct-text-primary"
                disabled={q44LastUpdated === "I don't know"}
              />
              <button
                type="button"
                onClick={() =>
                  onAnswer(
                    "q4_4_last_updated",
                    q44LastUpdated === "I don't know" ? "" : "I don't know"
                  )
                }
                className={cn(
                  "text-xs transition-colors duration-200",
                  q44LastUpdated === "I don't know"
                    ? "text-ct-accent font-medium"
                    : "text-ct-text-secondary hover:text-ct-text-primary underline underline-offset-2"
                )}
              >
                I don&apos;t know
              </button>
            </div>
          </QuestionCard>
        )}

        <QuestionCard
          id="q4_4_had_incident"
          label="Have you ever had a security incident?"
          required
        >
          <StatusSelector
            options={["Yes", "No", "Not sure"]}
            value={q44HadIncident || null}
            onChange={(val) => onAnswer("q4_4_had_incident", val)}
          />
        </QuestionCard>

        {q44HadIncident === "Yes" && (
          <QuestionCard
            id="q4_4_post_review"
            label="Was a post-incident review conducted?"
          >
            <StatusSelector
              options={["Yes", "No"]}
              value={q44PostReview || null}
              onChange={(val) => onAnswer("q4_4_post_review", val)}
            />
          </QuestionCard>
        )}

        <TruthfulnessNudge>
          &ldquo;Incident&rdquo; doesn&apos;t mean you got breached &mdash; it
          includes things like a phishing attempt, an employee clicking a
          suspicious link, or an accidental data exposure. Most companies have
          had at least one.
        </TruthfulnessNudge>
        {q44Plan === "No" && (
          <InlineInsight
            type="gap"
            title="No Incident Response Plan"
            description="Without an incident response plan, the team has no structured process for handling security events."
          />
        )}
        {q44Plan.toLowerCase().includes("tested") && (
          <InlineInsight
            type="strength"
            title="IR Plan Documented and Tested"
            description="An incident response plan that has been tested demonstrates mature operational readiness."
          />
        )}
      </SecuritySection>

      {/* ----------------------------------------------------------------- */}
      {/* Q4.5 — Business Continuity & DR                                   */}
      {/* ----------------------------------------------------------------- */}
      <SecuritySection
        title="Q4.5 — Business Continuity & DR"
        isOpen={openSections.q45}
        onToggle={() => toggle("q45")}
        isComplete={isQ45Complete(answers)}
      >
        <QuestionCard
          id="q4_5_backups"
          label="Do you have regular backups?"
          required
        >
          <StatusSelector
            options={[
              "Automated daily+",
              "Automated weekly",
              "Manual/ad hoc",
              "No",
            ]}
            value={q45Backups || null}
            onChange={(val) => onAnswer("q4_5_backups", val)}
          />
        </QuestionCard>

        {hasBackups && (
          <>
            <QuestionCard
              id="q4_5_tested_restore"
              label="Have you tested a restore in the past year?"
            >
              <StatusSelector
                options={["Yes", "No"]}
                value={q45TestedRestore || null}
                onChange={(val) => onAnswer("q4_5_tested_restore", val)}
              />
            </QuestionCard>

            <QuestionCard
              id="q4_5_backup_location"
              label="Where are backups stored?"
            >
              <StatusSelector
                options={[
                  "Different region",
                  "Different provider",
                  "Same region",
                  "Don't know",
                ]}
                value={q45BackupLocation || null}
                onChange={(val) => onAnswer("q4_5_backup_location", val)}
              />
            </QuestionCard>
          </>
        )}

        <QuestionCard
          id="q4_5_downtime_impact"
          label="If your primary system goes down, how long until customer impact?"
          required
        >
          <StatusSelector
            options={["Minutes", "Hours", "A day+", "Don't know"]}
            value={q45DowntimeImpact || null}
            onChange={(val) => onAnswer("q4_5_downtime_impact", val)}
          />
        </QuestionCard>

        <QuestionCard
          id="q4_5_dr_plan"
          label="Do you have a documented disaster recovery plan?"
          required
        >
          <StatusSelector
            options={["Yes", "Informal", "No"]}
            value={q45DrPlan || null}
            onChange={(val) => onAnswer("q4_5_dr_plan", val)}
          />
        </QuestionCard>
        {q45Backups === "No" && (
          <InlineInsight
            type="gap"
            title="No Regular Backups"
            description="Without regular backups, data loss from any cause could be permanent and unrecoverable."
          />
        )}
      </SecuritySection>

      {/* ----------------------------------------------------------------- */}
      {/* Q4.6 — Vulnerability Management                                   */}
      {/* ----------------------------------------------------------------- */}
      <SecuritySection
        title="Q4.6 — Vulnerability Management"
        isOpen={openSections.q46}
        onToggle={() => toggle("q46")}
        isComplete={isQ46Complete(answers)}
      >
        <QuestionCard
          id="q4_6_scanning"
          label="Do you scan for vulnerabilities?"
          required
        >
          <StatusSelector
            options={["Automated + regular", "Occasionally", "No"]}
            value={q46Scanning || null}
            onChange={(val) => onAnswer("q4_6_scanning", val)}
          />
        </QuestionCard>

        {hasScanning && (
          <QuestionCard
            id="q4_6_scan_types"
            label="What do you scan?"
          >
            <ChipMultiSelect
              options={[
                "App code (SAST/DAST)",
                "Dependencies (SCA)",
                "Infrastructure",
                "Container images",
              ]}
              selected={q46ScanTypes}
              onChange={(val) => onAnswer("q4_6_scan_types", val)}
            />
          </QuestionCard>
        )}

        <QuestionCard
          id="q4_6_patch_speed"
          label="How quickly do you patch critical vulnerabilities?"
          required
        >
          <StatusSelector
            options={[
              "24h",
              "Within a week",
              "30 days",
              "When we get to it",
              "Don't track",
            ]}
            value={q46PatchSpeed || null}
            onChange={(val) => onAnswer("q4_6_patch_speed", val)}
          />
        </QuestionCard>

        <QuestionCard
          id="q4_6_pentest"
          label="Penetration testing?"
          required
        >
          <StatusSelector
            options={["Annually+", "Occasionally", "Never", "Planning to"]}
            value={q46Pentest || null}
            onChange={(val) => onAnswer("q4_6_pentest", val)}
          />
        </QuestionCard>
      </SecuritySection>

      {/* ----------------------------------------------------------------- */}
      {/* Q4.7 — Change Management                                          */}
      {/* ----------------------------------------------------------------- */}
      <SecuritySection
        title="Q4.7 — Change Management"
        isOpen={openSections.q47}
        onToggle={() => toggle("q47")}
        isComplete={isQ47Complete(answers)}
      >
        <QuestionCard
          id="q4_7_approval"
          label="How are production changes approved?"
          required
        >
          <StatusSelector
            options={[
              "Formal approval + sign-off",
              "Code review required",
              "Informal review",
              "Direct deploy",
            ]}
            value={q47Approval || null}
            onChange={(val) => onAnswer("q4_7_approval", val)}
          />
        </QuestionCard>

        <QuestionCard
          id="q4_7_audit_trail"
          label="Are changes logged and auditable?"
          required
        >
          <StatusSelector
            options={["Yes via CI/CD", "Yes manually", "No"]}
            value={q47AuditTrail || null}
            onChange={(val) => onAnswer("q4_7_audit_trail", val)}
          />
        </QuestionCard>

        <TruthfulnessNudge>
          Remember that Friday afternoon deploy question from Stage 2? Same
          principle here &mdash; what actually happens is more useful than what
          should happen.
        </TruthfulnessNudge>
      </SecuritySection>

      {/* ----------------------------------------------------------------- */}
      {/* Q4.8 — Network & Infrastructure Security (conditional)            */}
      {/* ----------------------------------------------------------------- */}
      {!skipQ48 && (
        <SecuritySection
          title="Q4.8 — Network & Infrastructure Security"
          isOpen={openSections.q48}
          onToggle={() => toggle("q48")}
          isComplete={isQ48Complete(answers)}
        >
          <ChecklistHelperText />
          <div className="flex flex-col gap-5">
            <ChecklistRow
              label="Web Application Firewall (WAF)?"
              options={["Yes", "No", "Don't know"]}
              value={q48.waf ?? null}
              onChange={(v) =>
                setField(answers, "q4_8", "waf", v, onAnswer)
              }
            />
            <ChecklistRow
              label="IDS/IPS?"
              options={["Yes", "No", "Don't know"]}
              value={q48.ids_ips ?? null}
              onChange={(v) =>
                setField(answers, "q4_8", "ids_ips", v, onAnswer)
              }
            />
            <ChecklistRow
              label="Network segmented?"
              options={["Yes", "No", "Don't know"]}
              value={q48.segmentation ?? null}
              onChange={(v) =>
                setField(answers, "q4_8", "segmentation", v, onAnswer)
              }
            />
            <ChecklistRow
              label="VPN or zero-trust access?"
              options={["Yes", "No", "Don't know", "Working on it"]}
              value={q48.vpn ?? null}
              onChange={(v) =>
                setField(answers, "q4_8", "vpn", v, onAnswer)
              }
            />
          </div>
        </SecuritySection>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Q4.9 — Logging & Monitoring                                       */}
      {/* ----------------------------------------------------------------- */}
      <SecuritySection
        title="Q4.9 — Logging & Monitoring"
        isOpen={openSections.q49}
        onToggle={() => toggle("q49")}
        isComplete={isQ49Complete(answers)}
      >
        <QuestionCard
          id="q4_9_logging"
          label="Centralized logging?"
          required
        >
          <StatusSelector
            options={["Yes", "Partial", "No"]}
            value={q49Logging || null}
            onChange={(val) => onAnswer("q4_9_logging", val)}
          />
        </QuestionCard>

        <QuestionCard
          id="q4_9_alerts"
          label="Security event alerts?"
          required
        >
          <StatusSelector
            options={["Automated", "Some manual", "No"]}
            value={q49Alerts || null}
            onChange={(val) => onAnswer("q4_9_alerts", val)}
          />
        </QuestionCard>

        <QuestionCard
          id="q4_9_retention"
          label="Log retention?"
          required
        >
          <StatusSelector
            options={[
              "30 days",
              "90 days",
              "1 year+",
              "Don't know",
              "No retention",
            ]}
            value={q49Retention || null}
            onChange={(val) => onAnswer("q4_9_retention", val)}
          />
        </QuestionCard>

        {q49Retention &&
          q49Retention !== "1 year+" &&
          q49Retention !== "" && (
            <Soc2Note>
              SOC 2 typically requires at least 1 year of log retention.
            </Soc2Note>
          )}
        {(q49Retention === "Don't know" || q49Retention === "No retention") && (
          <InlineInsight
            type="gap"
            title="Insufficient Log Retention"
            description="Insufficient log retention means historical evidence may be unavailable for audits or investigations."
          />
        )}
      </SecuritySection>

      {/* ----------------------------------------------------------------- */}
      {/* Aspirational answer detector                                      */}
      {/* ----------------------------------------------------------------- */}
      {showAspirationalNudge && (
        <TruthfulnessNudge variant="green">
          Your security posture is impressive for a team your size! To make sure
          your docs match reality, we&apos;ll ask for a quick evidence check
          during document review.
        </TruthfulnessNudge>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Continue button                                                   */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          canContinue
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <Button
          onClick={onContinue}
          disabled={!canContinue}
          className="h-10 gap-2 rounded-xl bg-ct-accent px-6 text-sm font-medium text-white hover:bg-ct-accent/90"
        >
          Continue to Scope & Trust Services
          <span aria-hidden="true">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}
