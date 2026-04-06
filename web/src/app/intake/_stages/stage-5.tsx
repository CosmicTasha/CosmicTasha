"use client";

import * as React from "react";
import { Shield, Server, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuestionCard } from "../_components/question-card";
import { SegmentSelector } from "../_components/segment-selector";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Stage5Props {
  answers: Record<string, unknown>;
  onAnswer: (questionId: string, value: unknown) => void;
  onContinue?: () => void;
}

interface SystemEntry {
  name: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Data — Q5.1 Trust Services Criteria
// ---------------------------------------------------------------------------

interface TrustCriteria {
  id: string;
  name: string;
  description: string;
  commonWhen: string;
  required?: boolean;
}

const TRUST_CRITERIA: TrustCriteria[] = [
  {
    id: "security",
    name: "Security (Common Criteria)",
    description:
      "Your systems are protected against unauthorized access.",
    commonWhen: "",
    required: true,
  },
  {
    id: "availability",
    name: "Availability",
    description:
      "Systems available for operation as committed.",
    commonWhen: "SLA commitments, uptime guarantees",
  },
  {
    id: "processing_integrity",
    name: "Processing Integrity",
    description:
      "Processing is complete, valid, accurate, and authorized.",
    commonWhen: "Financial transactions, data transformations",
  },
  {
    id: "confidentiality",
    name: "Confidentiality",
    description: "Confidential information is protected as committed.",
    commonWhen: "Trade secrets, NDA data",
  },
  {
    id: "privacy",
    name: "Privacy",
    description:
      "Personal information collected/used/retained per commitments.",
    commonWhen: "PII from end users",
  },
];

// ---------------------------------------------------------------------------
// Data — Q5.4 Additional frameworks
// ---------------------------------------------------------------------------

const FRAMEWORK_OPTIONS = [
  "ISO 27001",
  "HIPAA",
  "GDPR",
  "PCI DSS",
  "None / Not sure yet",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAAS_CATEGORY_KEYS = [
  "q2_3_identity",
  "q2_3_source_code",
  "q2_3_cicd",
  "q2_3_monitoring",
  "q2_3_project",
  "q2_3_communication",
  "q2_3_hr",
  "q2_3_endpoint",
] as const;

const PROVIDER_LABELS: Record<string, string> = {
  aws: "AWS",
  gcp: "Google Cloud",
  azure: "Microsoft Azure",
  heroku: "Heroku",
  "vercel-netlify": "Vercel / Netlify",
  digitalocean: "DigitalOcean",
  "on-prem": "On-premises",
  other: "Other cloud provider",
};

const SCOPE_STATUS_OPTIONS = ["In scope", "Out of scope", "Not sure"];

function collectScopeSystems(
  answers: Record<string, unknown>
): string[] {
  const systems: string[] = [];

  // Cloud providers
  const providers = (answers["q2_1"] as string[]) ?? [];
  for (const p of providers) {
    systems.push(PROVIDER_LABELS[p] ?? p);
  }

  // SaaS tools
  for (const key of SAAS_CATEGORY_KEYS) {
    const tools = (answers[key] as string[]) ?? [];
    for (const tool of tools) {
      if (tool !== "None" && tool !== "Other" && !systems.includes(tool)) {
        systems.push(tool);
      }
    }
  }

  return systems;
}

function getRecommendedCriteria(
  answers: Record<string, unknown>
): Set<string> {
  const recommended = new Set<string>();
  const industries = (answers["q1.5"] as string[]) ?? [];
  const headcount = (answers["q1.3"] as string) ?? "";
  const dataTypes = (answers["q2_4"] as string[]) ?? [];
  const contractorAccess = (answers["q3.4_access"] as string[]) ?? [];

  // Availability
  if (
    industries.includes("Financial Services") ||
    industries.includes("Healthcare") ||
    ["51-100", "101-200", "200+"].includes(headcount)
  ) {
    recommended.add("availability");
  }

  // Processing Integrity
  if (dataTypes.includes("financial")) {
    recommended.add("processing_integrity");
  }

  // Confidentiality
  if (
    dataTypes.includes("ip") ||
    contractorAccess.includes("Source code")
  ) {
    recommended.add("confidentiality");
  }

  // Privacy
  if (dataTypes.includes("pii")) {
    recommended.add("privacy");
  }

  return recommended;
}

function getRecommendedFrameworks(
  answers: Record<string, unknown>
): Set<string> {
  const recommended = new Set<string>();
  const headcount = (answers["q1.3"] as string) ?? "";
  const dataTypes = (answers["q2_4"] as string[]) ?? [];
  const industries = (answers["q1.5"] as string[]) ?? [];

  // ISO 27001 — company > 50
  if (["51-100", "101-200", "200+"].includes(headcount)) {
    recommended.add("ISO 27001");
  }

  // HIPAA — PHI
  if (dataTypes.includes("phi")) {
    recommended.add("HIPAA");
  }

  // GDPR — international presence (proxy: check industries hint or just flag if non-US-only)
  if (
    industries.includes("Enterprise SaaS") ||
    industries.includes("E-commerce") ||
    industries.includes("Media & Entertainment")
  ) {
    recommended.add("GDPR");
  }

  // PCI DSS — financial data
  if (dataTypes.includes("financial")) {
    recommended.add("PCI DSS");
  }

  return recommended;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Stage5({
  answers,
  onAnswer,
  onContinue,
}: Stage5Props) {
  // -- Q5.1 Trust criteria --
  const selectedCriteria = (answers["q5_1"] as string[]) ?? ["security"];

  // Always include security
  React.useEffect(() => {
    if (!selectedCriteria.includes("security")) {
      onAnswer("q5_1", ["security", ...selectedCriteria]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recommendedCriteria = React.useMemo(
    () => getRecommendedCriteria(answers),
    [answers]
  );

  const toggleCriteria = (id: string) => {
    if (id === "security") return; // Cannot deselect
    const next = selectedCriteria.includes(id)
      ? selectedCriteria.filter((c) => c !== id)
      : [...selectedCriteria, id];
    onAnswer("q5_1", next);
  };

  // -- Q5.2 Systems in scope --
  const scopeSystems = React.useMemo(
    () => collectScopeSystems(answers),
    [answers]
  );
  const systemEntries =
    (answers["q5_2_systems"] as SystemEntry[]) ?? [];
  const scopeOther = (answers["q5_2_other"] as string) ?? "";

  const getSystemStatus = (name: string): string => {
    return systemEntries.find((s) => s.name === name)?.status ?? "";
  };

  const setSystemStatus = (name: string, status: string) => {
    const existing = systemEntries.find((s) => s.name === name);
    if (existing) {
      onAnswer(
        "q5_2_systems",
        systemEntries.map((s) =>
          s.name === name ? { ...s, status } : s
        )
      );
    } else {
      onAnswer("q5_2_systems", [
        ...systemEntries,
        { name, status },
      ]);
    }
  };

  // -- Q5.3 Carve-outs --
  const carveOuts = (answers["q5_3"] as string) ?? "";

  // -- Q5.4 Additional frameworks --
  const frameworks = (answers["q5_4"] as string[]) ?? [];
  const recommendedFrameworks = React.useMemo(
    () => getRecommendedFrameworks(answers),
    [answers]
  );

  // -- Continue logic --
  const canContinue =
    selectedCriteria.length > 0 &&
    systemEntries.length > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Contextual intro */}
      <div className="rounded-xl border border-ct-accent/25 bg-ct-accent/5 px-5 py-4">
        <p className="text-sm leading-relaxed text-ct-text-secondary">
          SOC 2 has one mandatory category (Security) and four optional ones.
          Most first-time audits stick with Security only &mdash; but your
          customers might require others.
        </p>
      </div>

      {/* ================================================================= */}
      {/* Q5.1 — Trust Services Criteria                                    */}
      {/* ================================================================= */}
      <QuestionCard
        id="q5_1"
        label="Which Trust Services Criteria should be in scope?"
        required
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_CRITERIA.map((tc) => {
            const isSelected = selectedCriteria.includes(tc.id);
            const isRecommended = recommendedCriteria.has(tc.id);
            const isRequired = tc.required;

            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => toggleCriteria(tc.id)}
                disabled={isRequired}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
                  isSelected
                    ? "border-ct-accent bg-ct-surface shadow-[0_0_0_1px_var(--ct-accent)]"
                    : "border-ct-border-subtle bg-ct-surface hover:bg-ct-surface-raised opacity-60 hover:opacity-80",
                  isRequired && "cursor-default"
                )}
                aria-pressed={isSelected}
              >
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <Shield
                    className={cn(
                      "size-4 shrink-0",
                      isSelected
                        ? "text-ct-accent"
                        : "text-ct-text-tertiary"
                    )}
                  />
                  <span className="text-sm font-medium text-ct-text-primary">
                    {tc.name}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {isRequired && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ct-accent/15 px-2 py-0.5 text-xs font-medium text-ct-accent">
                      <CheckCircle className="size-3" />
                      Required
                    </span>
                  )}
                  {!isRequired && isRecommended && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      <AlertCircle className="size-3" />
                      Recommended
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-ct-text-secondary">
                  {tc.description}
                </p>

                {tc.commonWhen && (
                  <p className="text-xs text-ct-text-tertiary">
                    Common when: {tc.commonWhen}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q5.2 — Systems in scope                                           */}
      {/* ================================================================= */}
      <QuestionCard
        id="q5_2"
        label="Which systems should be in scope for the audit?"
        required
      >
        {scopeSystems.length > 0 ? (
          <div className="flex flex-col gap-2 max-w-lg">
            {scopeSystems.map((system, i) => {
              const status = getSystemStatus(system);
              return (
                <div
                  key={system}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-xl border px-4 py-3",
                    "border-ct-border-subtle",
                    i % 2 === 0
                      ? "bg-ct-surface"
                      : "bg-ct-surface-raised"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Server className="size-4 shrink-0 text-ct-text-tertiary" />
                    <span className="text-sm font-medium text-ct-text-primary">
                      {system}
                    </span>
                  </div>
                  <SegmentSelector
                    options={SCOPE_STATUS_OPTIONS}
                    value={status || null}
                    onChange={(val) => setSystemStatus(system, val)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm italic text-ct-text-tertiary">
            No systems detected from earlier answers. Add them below.
          </p>
        )}

        <div className="mt-4">
          <p className="mb-2 text-sm text-ct-text-secondary">
            Any other systems that should be in scope?
          </p>
          <Textarea
            value={scopeOther}
            onChange={(e) => onAnswer("q5_2_other", e.target.value)}
            placeholder="e.g., internal admin dashboard, data warehouse, third-party payment processor..."
            rows={3}
            className="max-w-lg border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
          />
        </div>
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q5.3 — Carve-outs                                                 */}
      {/* ================================================================= */}
      <QuestionCard
        id="q5_3"
        label="Are there systems or business units to explicitly exclude from the audit scope?"
      >
        <Textarea
          value={carveOuts}
          onChange={(e) => onAnswer("q5_3", e.target.value)}
          placeholder="e.g., marketing website, legacy internal tool being sunset, R&D sandbox..."
          rows={3}
          className="max-w-lg border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
        />
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q5.4 — Additional frameworks                                      */}
      {/* ================================================================= */}
      <QuestionCard
        id="q5_4"
        label="Are you targeting any additional compliance frameworks?"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {FRAMEWORK_OPTIONS.map((fw) => {
              const isSelected = frameworks.includes(fw);
              const isRecommended = recommendedFrameworks.has(fw);
              return (
                <button
                  key={fw}
                  type="button"
                  onClick={() => {
                    if (fw === "None / Not sure yet") {
                      onAnswer("q5_4", isSelected ? [] : [fw]);
                    } else {
                      const without = frameworks.filter(
                        (f) => f !== "None / Not sure yet"
                      );
                      const next = isSelected
                        ? without.filter((f) => f !== fw)
                        : [...without, fw];
                      onAnswer("q5_4", next);
                    }
                  }}
                  className={cn(
                    "relative rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
                    isSelected
                      ? "border-ct-accent bg-ct-accent/15 text-ct-accent"
                      : "border-ct-border-subtle bg-ct-surface text-ct-text-secondary hover:border-ct-border-default hover:text-ct-text-primary"
                  )}
                  aria-pressed={isSelected}
                >
                  <span className="flex items-center gap-1.5">
                    {fw}
                    {isRecommended && !isSelected && (
                      <span className="inline-flex size-1.5 rounded-full bg-emerald-400" />
                    )}
                    {isRecommended && isSelected && (
                      <span className="text-xs text-emerald-400">
                        (rec)
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs italic text-ct-text-tertiary">
            We&apos;ll note these in your profile. CosmicTasha generates
            policies with multi-framework mapping.
          </p>
        </div>
      </QuestionCard>

      {/* ================================================================= */}
      {/* Continue                                                           */}
      {/* ================================================================= */}
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
          Continue to Documentation Status
          <span aria-hidden="true">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}
