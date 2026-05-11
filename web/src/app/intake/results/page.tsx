"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  AlertTriangle,
  Key,
  GitBranch,
  Search,
  FolderLock,
  Server,
  Users,
  Lock,
  BookOpen,
  GraduationCap,
  ClipboardList,
  UserCheck,
  Sparkles,
  Download,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIntake } from "../_context/intake-context";
import { ReadinessRing } from "../_components/readiness-ring";
import { BlurredContent } from "../_components/gated-content";
import {
  generateGapsFromResult,
  type GeneratedGap,
} from "@/lib/gap-generator";
import { getCurrentTier, isPaidTier } from "@/lib/tier";
import { exportToPdf } from "@/lib/export/pdf";

// ---------------------------------------------------------------------------
// Tier display config
// ---------------------------------------------------------------------------

const TIER_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  "audit-ready": {
    label: "Audit Ready",
    color: "text-ct-status-strength",
    bg: "bg-ct-status-strength/15",
  },
  "almost-there": {
    label: "Almost There",
    color: "text-ct-status-strength",
    bg: "bg-ct-status-strength/15",
  },
  "building-momentum": {
    label: "Building Momentum",
    color: "text-ct-accent-secondary",
    bg: "bg-ct-accent-secondary/15",
  },
  "getting-started": {
    label: "Getting Started",
    color: "text-ct-status-gap-critical",
    bg: "bg-ct-status-gap-critical/15",
  },
  "not-ready": {
    label: "Not Ready",
    color: "text-ct-status-gap-critical",
    bg: "bg-ct-status-gap-critical/15",
  },
};

// ---------------------------------------------------------------------------
// Gap severity config
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  string,
  { label: string; border: string; badge: string; badgeText: string }
> = {
  P0: {
    label: "Critical",
    border: "border-l-[#F97316]",
    badge: "bg-[#F97316]/15",
    badgeText: "text-[#F97316]",
  },
  P1: {
    label: "High",
    border: "border-l-[#F5A623]",
    badge: "bg-[#F5A623]/15",
    badgeText: "text-[#F5A623]",
  },
  P2: {
    label: "Medium",
    border: "border-l-[#60A5FA]",
    badge: "bg-[#60A5FA]/15",
    badgeText: "text-[#60A5FA]",
  },
  P3: {
    label: "Low",
    border: "border-l-[#6B6B76]",
    badge: "bg-[#6B6B76]/15",
    badgeText: "text-[#6B6B76]",
  },
};

// ---------------------------------------------------------------------------
// Document roadmap data
// ---------------------------------------------------------------------------

interface RoadmapDocument {
  name: string;
  icon: LucideIcon;
  q61Key: string; // matches the document name from Q6.1
}

const PRIORITY_1: RoadmapDocument[] = [
  { name: "System Description", icon: FileText, q61Key: "" },
  {
    name: "Information Security Policy",
    icon: Shield,
    q61Key: "Information Security Policy",
  },
  {
    name: "Incident Response Plan",
    icon: AlertTriangle,
    q61Key: "Incident Response Plan",
  },
  {
    name: "Access Control Policy",
    icon: Key,
    q61Key: "Access Control Policy",
  },
  {
    name: "Change Management Policy",
    icon: GitBranch,
    q61Key: "Change Management Policy",
  },
];

const PRIORITY_2: RoadmapDocument[] = [
  { name: "Risk Assessment", icon: Search, q61Key: "Risk Assessment" },
  {
    name: "Data Classification & Handling Policy",
    icon: FolderLock,
    q61Key: "Data Classification Policy",
  },
  { name: "Business Continuity / DR Plan", icon: Server, q61Key: "BC/DR Plan" },
  {
    name: "Vendor Management Policy",
    icon: Users,
    q61Key: "Vendor Management Policy",
  },
  {
    name: "Encryption Policy",
    icon: Lock,
    q61Key: "Encryption Policy",
  },
];

const PRIORITY_3: RoadmapDocument[] = [
  {
    name: "Acceptable Use Policy",
    icon: BookOpen,
    q61Key: "Acceptable Use Policy",
  },
  {
    name: "Security Awareness Training Plan",
    icon: GraduationCap,
    q61Key: "",
  },
  {
    name: "Audit Log Review Procedures",
    icon: ClipboardList,
    q61Key: "",
  },
  { name: "Access Review Templates", icon: UserCheck, q61Key: "" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDocStatus(
  q61Key: string,
  answers: Record<string, unknown>
): string {
  if (!q61Key) return "Generate from scratch";
  const docs = answers["q6_1"] as
    | Array<{ document: string; status: string }>
    | undefined;
  if (!docs) return "Generate from scratch";
  const entry = docs.find((d) => d.document === q61Key);
  if (!entry) return "Generate from scratch";
  if (entry.status === "Have it") return "Upgrade existing";
  if (entry.status === "Sort of") return "Formalize from existing";
  return "Generate from scratch";
}

function getBarColor(score: number): string {
  if (score >= 70) return "bg-ct-status-strength";
  if (score >= 40) return "bg-ct-accent-secondary";
  return "bg-ct-status-gap-critical";
}

function getBarTrackGlow(score: number): string {
  if (score >= 70) return "shadow-[0_0_8px_rgba(52,211,153,0.15)]";
  if (score >= 40) return "shadow-[0_0_8px_rgba(245,166,35,0.15)]";
  return "shadow-[0_0_8px_rgba(249,115,22,0.15)]";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DimensionBar({
  label,
  score,
  weight,
  signals,
}: {
  label: string;
  score: number;
  weight: number;
  signals: string[];
}) {
  return (
    <div className="group rounded-xl border border-white/[0.06] bg-ct-surface p-5 transition-colors hover:border-white/[0.1] hover:bg-ct-surface-raised/60">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-ct-text-primary">{label}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-ct-text-tertiary">
            {Math.round(weight * 100)}% weight
          </span>
          <span className="text-sm font-bold text-ct-text-primary">
            {score}
            <span className="text-ct-text-tertiary font-normal">/100</span>
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ct-surface-raised">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(score)} ${getBarTrackGlow(score)}`}
          style={{ width: `${Math.max(score, 2)}%` }}
        />
      </div>

      {/* Signals */}
      {signals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {signals.map((signal) => (
            <span
              key={signal}
              className="inline-flex items-center rounded-md bg-ct-surface-raised px-2 py-0.5 text-xs text-ct-text-secondary"
            >
              {signal}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GapCard({ gap, gated }: { gap: GeneratedGap; gated?: boolean }) {
  const config = SEVERITY_CONFIG[gap.severity] ?? SEVERITY_CONFIG.P3;

  return (
    <div
      className={`rounded-xl border border-white/[0.06] border-l-[3px] ${config.border} bg-ct-surface p-5 transition-colors hover:bg-ct-surface-raised/60`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-ct-text-primary">
          {gap.title}
        </h4>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badge} ${config.badgeText}`}
        >
          {config.label}
        </span>
      </div>
      <p className="mt-1 text-xs text-ct-text-tertiary">{gap.dimensionLabel}</p>
      {gated ? (
        <BlurredContent tier="discovery" blurMessage="Upgrade to see gap details">
          <p className="mt-2.5 text-sm leading-relaxed text-ct-text-secondary">
            {gap.description}
          </p>
          <div className="mt-3 rounded-lg bg-ct-accent/5 border border-ct-accent/10 px-3.5 py-2.5">
            <p className="text-xs font-medium text-ct-accent">Remediation</p>
            <p className="mt-1 text-xs leading-relaxed text-ct-text-secondary">
              {gap.remediation}
            </p>
          </div>
        </BlurredContent>
      ) : (
        <>
          <p className="mt-2.5 text-sm leading-relaxed text-ct-text-secondary">
            {gap.description}
          </p>
          <div className="mt-3 rounded-lg bg-ct-accent/5 border border-ct-accent/10 px-3.5 py-2.5">
            <p className="text-xs font-medium text-ct-accent">Remediation</p>
            <p className="mt-1 text-xs leading-relaxed text-ct-text-secondary">
              {gap.remediation}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  status,
  locked,
}: {
  doc: RoadmapDocument;
  status: string;
  locked?: boolean;
}) {
  const Icon = doc.icon;
  const statusColor = locked
    ? "text-ct-text-tertiary"
    : status === "Upgrade existing"
      ? "text-ct-status-strength"
      : status === "Formalize from existing"
        ? "text-ct-accent-secondary"
        : "text-ct-accent";

  return (
    <div className={`group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-ct-surface px-4 py-3.5 transition-colors hover:border-white/[0.1] hover:bg-ct-surface-raised/60 ${locked ? "opacity-60" : ""}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ct-accent/10">
        <Icon className="h-4.5 w-4.5 text-ct-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-ct-text-primary">{doc.name}</p>
          {locked && <Lock className="h-3 w-3 shrink-0 text-ct-text-tertiary" />}
        </div>
        <p className={`mt-0.5 text-xs ${statusColor}`}>
          {locked ? "Upgrade to generate" : status}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const LOADING_MESSAGES = [
  "Analyzing your responses...",
  "Calculating readiness score...",
  "Identifying gaps...",
  "Building document roadmap...",
];

export default function ResultsPage() {
  const { readinessResult, readinessScore, answers, gaps: contextGaps } =
    useIntake();

  const tier = getCurrentTier();
  const isDiscovery = !isPaidTier(tier);

  const [isLoading, setIsLoading] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 400);

    const loadTimer = setTimeout(() => {
      clearInterval(messageInterval);
      setIsLoading(false);
    }, 1500);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(loadTimer);
    };
  }, []);

  const companyName =
    (answers["q1.1"] as string) || "Your Company";

  const tierConfig = readinessResult
    ? TIER_CONFIG[readinessResult.tier] ?? TIER_CONFIG["not-ready"]
    : TIER_CONFIG["not-ready"];

  // Generate gaps if context doesn't have them
  const gaps: GeneratedGap[] = useMemo(() => {
    if (contextGaps && contextGaps.length > 0) {
      // Convert context gaps to GeneratedGap format
      return contextGaps.map((g, i) => ({
        id: `ctx-${i}`,
        title: g.title,
        dimension: g.dimension,
        dimensionLabel: g.dimension,
        severity: (g.severity === "critical" ? "P0" : "P1") as GeneratedGap["severity"],
        description: "",
        remediation: "",
      }));
    }
    if (readinessResult) {
      return generateGapsFromResult(readinessResult, answers);
    }
    return [];
  }, [contextGaps, readinessResult, answers]);

  // Count total documents
  const totalDocs =
    PRIORITY_1.length + PRIORITY_2.length + PRIORITY_3.length;

  // Group gaps by severity for rendering
  const gapsBySeverity = useMemo(() => {
    const groups: Record<string, GeneratedGap[]> = {
      P0: [],
      P1: [],
      P2: [],
      P3: [],
    };
    for (const gap of gaps) {
      (groups[gap.severity] ?? groups.P3).push(gap);
    }
    return groups;
  }, [gaps]);

  if (isLoading) {
    return (
      <div className="-mx-8 -my-12 flex min-h-screen items-center justify-center bg-ct-base">
        <div className="flex flex-col items-center gap-6">
          {/* Spinner */}
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-ct-surface-raised" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-ct-accent" />
          </div>

          <p className="text-sm font-medium text-ct-text-secondary transition-opacity duration-200">
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-8 -my-12 min-h-screen bg-ct-base animate-in fade-in duration-500">
      <div className="mx-auto max-w-[960px] px-6 py-16">
        {/* ============================================================= */}
        {/* Section 1: Hero / Score Overview                               */}
        {/* ============================================================= */}
        <section className="flex flex-col items-center text-center">
          {/* Gradient glow behind ring */}
          <div className="relative">
            <div
              className="absolute inset-0 -m-12 rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(108,99,255,0.4) 0%, rgba(108,99,255,0) 70%)",
              }}
            />
            <ReadinessRing score={readinessScore} size={180} />
          </div>

          <h1 className="mt-8 text-3xl font-bold tracking-tight text-ct-text-primary">
            Your Readiness Score:{" "}
            <span className="text-ct-accent">
              {readinessScore !== null ? Math.round(readinessScore) : "--"}
            </span>
            <span className="text-ct-text-tertiary">/100</span>
          </h1>

          {/* Tier badge */}
          {readinessResult && (
            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${tierConfig.bg} ${tierConfig.color}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {tierConfig.label}
            </div>
          )}

          {/* Tier message */}
          {readinessResult && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ct-text-secondary">
              {readinessResult.message}
            </p>
          )}

          {/* Company name */}
          <p className="mt-2 text-xs text-ct-text-tertiary">
            Compliance Profile for{" "}
            <span className="font-medium text-ct-text-secondary">
              {companyName}
            </span>
          </p>
        </section>

        {/* ============================================================= */}
        {/* Section 2: Dimension Breakdown                                 */}
        {/* ============================================================= */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-ct-text-primary">
            Dimension Breakdown
          </h2>
          <p className="mt-1.5 text-sm text-ct-text-secondary">
            Your score across the five SOC 2 readiness dimensions
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {readinessResult?.dimensions.map((dim) => (
              <DimensionBar
                key={dim.dimension}
                label={dim.label}
                score={dim.score}
                weight={dim.weight}
                signals={dim.signals}
              />
            ))}
          </div>
        </section>

        {/* ============================================================= */}
        {/* Section 3: Gap Analysis Summary                                */}
        {/* ============================================================= */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-ct-text-primary">
              Identified Gaps
            </h2>
            <span className="rounded-full bg-ct-surface-raised px-3 py-1 text-xs font-medium text-ct-text-secondary">
              {gaps.length} {gaps.length === 1 ? "gap" : "gaps"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ct-text-secondary">
            Issues identified from your assessment, ordered by priority
          </p>

          <div className="mt-6 flex flex-col gap-8">
            {(["P0", "P1", "P2", "P3"] as const).map((severity) => {
              const group = gapsBySeverity[severity];
              if (!group || group.length === 0) return null;
              const config = SEVERITY_CONFIG[severity];

              // Discovery tier: P2/P3 show count-only summary
              if (isDiscovery && (severity === "P2" || severity === "P3")) {
                return (
                  <div key={severity}>
                    <h3
                      className={`mb-3 text-xs font-semibold uppercase tracking-wider ${config.badgeText}`}
                    >
                      {severity} &mdash; {config.label}
                    </h3>
                    <div className="rounded-xl border border-white/[0.06] bg-ct-surface p-5 text-center">
                      <p className="text-sm text-ct-text-secondary">
                        <span className="font-semibold text-ct-text-primary">{group.length}</span>{" "}
                        {severity === "P2" ? "medium" : "low"}{" "}
                        {group.length === 1 ? "gap" : "gaps"} identified
                      </p>
                      <Link
                        href="/pricing"
                        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-ct-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ct-accent/90"
                      >
                        Upgrade to see details &rarr;
                      </Link>
                    </div>
                  </div>
                );
              }

              return (
                <div key={severity}>
                  <h3
                    className={`mb-3 text-xs font-semibold uppercase tracking-wider ${config.badgeText}`}
                  >
                    {severity} &mdash; {config.label} ({group.length})
                  </h3>
                  <div className="flex flex-col gap-3">
                    {group.map((gap) => (
                      <GapCard
                        key={gap.id}
                        gap={gap}
                        gated={isDiscovery && severity === "P1"}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {gaps.length === 0 && (
              <div className="rounded-xl border border-ct-status-strength/20 bg-ct-status-strength/5 p-6 text-center">
                <p className="text-sm font-medium text-ct-status-strength">
                  No significant gaps identified
                </p>
                <p className="mt-1 text-xs text-ct-text-secondary">
                  Your current security posture is strong across all dimensions.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================= */}
        {/* Section 4: Executive Summary                                   */}
        {/* ============================================================= */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-ct-text-primary">
            Executive Summary
          </h2>

          <div className="mt-6 rounded-xl border border-white/[0.06] bg-ct-surface p-6 space-y-5">
            {/* Company name */}
            <h3 className="text-lg font-semibold text-ct-text-primary">
              {companyName}
            </h3>

            {/* Meta details */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ct-text-tertiary">
                  Industry
                </p>
                <p className="mt-1 text-sm text-ct-text-secondary">
                  {(() => {
                    const ind = answers["q1_5"] as string[] | undefined;
                    return ind && ind.length > 0 ? ind.join(", ") : "Not specified";
                  })()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ct-text-tertiary">
                  Company Size
                </p>
                <p className="mt-1 text-sm text-ct-text-secondary">
                  {(answers["q1_3"] as string) || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ct-text-tertiary">
                  Audit Experience
                </p>
                <p className="mt-1 text-sm text-ct-text-secondary">
                  {(() => {
                    const exp = answers["q0_2"] as string | undefined;
                    if (exp === "first_time") return "First SOC 2";
                    if (exp === "renewing") return "Renewal";
                    if (exp === "switching") return "Switching tools";
                    return exp || "Not specified";
                  })()}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06]" />

            {/* Top 3 Strengths */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ct-text-tertiary">
                Top 3 Strengths
              </p>
              {(() => {
                const strengths =
                  readinessResult?.dimensions
                    .filter((d) => d.score >= 70)
                    .slice(0, 3) ?? [];
                if (strengths.length === 0) {
                  return (
                    <p className="mt-2 text-sm text-ct-text-secondary">
                      Strengths will emerge as you improve your security posture.
                    </p>
                  );
                }
                return (
                  <ul className="mt-2 space-y-1">
                    {strengths.map((s) => (
                      <li
                        key={s.dimension}
                        className="flex items-center gap-2 text-sm text-ct-text-secondary"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ct-status-strength" />
                        {s.label}{" "}
                        <span className="text-xs text-ct-text-tertiary">
                          ({s.score}/100)
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            {/* Top 5 Gaps */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ct-text-tertiary">
                Top 5 Gaps
              </p>
              {gaps.length === 0 ? (
                <p className="mt-2 text-sm text-ct-text-secondary">
                  No gaps identified — you&apos;re in great shape!
                </p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {gaps.slice(0, 5).map((g) => {
                    const cfg = SEVERITY_CONFIG[g.severity] ?? SEVERITY_CONFIG.P3;
                    return (
                      <div
                        key={g.id}
                        className="flex items-center gap-2 text-sm text-ct-text-secondary"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ct-status-gap-critical" />
                        {g.title}
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.badge} ${cfg.badgeText}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* Section 5: Detailed Gap Analysis Table                         */}
        {/* ============================================================= */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-ct-text-primary">
            Detailed Gap Analysis
          </h2>
          <p className="mt-1.5 text-sm text-ct-text-secondary">
            Full breakdown of identified control gaps with priority and
            estimated remediation effort
          </p>

          {gaps.length === 0 ? (
            <div className="mt-6 rounded-xl border border-ct-status-strength/20 bg-ct-status-strength/5 p-6 text-center">
              <p className="text-sm font-medium text-ct-status-strength">
                No gaps identified &mdash; you&apos;re in great shape!
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.06]">
              {/* Table header */}
              <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_0.7fr_1fr] gap-px bg-ct-surface-raised px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ct-text-tertiary">
                <span>Control Area</span>
                <span>Current State</span>
                <span>Gap</span>
                <span>Priority</span>
                <span>Effort</span>
              </div>

              {/* Table rows */}
              {gaps.map((g, i) => {
                const cfg = SEVERITY_CONFIG[g.severity] ?? SEVERITY_CONFIG.P3;
                const effort =
                  g.severity === "P0"
                    ? "High (2-4 weeks)"
                    : g.severity === "P1"
                      ? "Medium (1-2 weeks)"
                      : g.severity === "P2"
                        ? "Low (days)"
                        : "Minimal";
                const rowBg =
                  i % 2 === 0 ? "bg-ct-surface" : "bg-ct-base";
                const isBlurredRow = isDiscovery && g.severity !== "P0";
                return (
                  <div
                    key={g.id}
                    className={`grid grid-cols-[1.5fr_1.5fr_1.5fr_0.7fr_1fr] gap-px ${rowBg} px-5 py-3.5 text-sm ${isBlurredRow ? "blur-sm opacity-40 select-none" : ""}`}
                  >
                    <span className="text-ct-text-secondary font-medium">
                      {g.dimensionLabel}
                    </span>
                    <span className="text-ct-text-tertiary text-xs leading-relaxed">
                      {g.description
                        ? g.description.length > 80
                          ? g.description.slice(0, 80) + "..."
                          : g.description
                        : "Needs improvement"}
                    </span>
                    <span className="text-ct-text-secondary">{g.title}</span>
                    <span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badge} ${cfg.badgeText}`}
                      >
                        {g.severity}
                      </span>
                    </span>
                    <span className="text-ct-text-tertiary text-xs">
                      {effort}
                    </span>
                  </div>
                );
              })}
              {isDiscovery && gaps.some((g) => g.severity !== "P0") && (
                <div className="flex items-center justify-center gap-2 bg-ct-surface px-5 py-4">
                  <Lock className="h-3.5 w-3.5 text-ct-text-tertiary" />
                  <span className="text-xs text-ct-text-secondary">
                    P1+ rows are blurred &mdash;{" "}
                  </span>
                  <Link
                    href="/pricing"
                    className="text-xs font-semibold text-ct-accent hover:underline"
                  >
                    Upgrade to see full table &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ============================================================= */}
        {/* Section 6: Remediation Timeline                                */}
        {/* ============================================================= */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-ct-text-primary">
            Recommended Remediation Timeline
          </h2>
          <p className="mt-1.5 text-sm text-ct-text-secondary">
            A phased approach to closing your compliance gaps
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Week 1-2: Critical Foundations (P0) */}
            <div className="rounded-xl border border-white/[0.06] border-l-[3px] border-l-[#F97316] bg-ct-surface p-5">
              <h4 className="text-sm font-semibold text-ct-text-primary">
                Week 1&ndash;2: Critical Foundations
              </h4>
              {gapsBySeverity.P0.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {gapsBySeverity.P0.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-start gap-2 text-xs text-ct-text-secondary"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F97316]" />
                      {g.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-ct-text-tertiary">
                  No critical gaps &mdash; great start!
                </p>
              )}
            </div>

            {/* Week 3-4: Core Controls (P1) */}
            <div className="rounded-xl border border-white/[0.06] border-l-[3px] border-l-[#F5A623] bg-ct-surface p-5">
              <h4 className="text-sm font-semibold text-ct-text-primary">
                Week 3&ndash;4: Core Controls
              </h4>
              {gapsBySeverity.P1.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {gapsBySeverity.P1.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-start gap-2 text-xs text-ct-text-secondary"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5A623]" />
                      {g.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-ct-text-tertiary">
                  No high-priority gaps remaining.
                </p>
              )}
            </div>

            {/* Week 5-6: Process Formalization (P2) */}
            <div className="rounded-xl border border-white/[0.06] border-l-[3px] border-l-[#60A5FA] bg-ct-surface p-5">
              <h4 className="text-sm font-semibold text-ct-text-primary">
                Week 5&ndash;6: Process Formalization
              </h4>
              {gapsBySeverity.P2.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {gapsBySeverity.P2.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-start gap-2 text-xs text-ct-text-secondary"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#60A5FA]" />
                      {g.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-ct-text-tertiary">
                  No medium-priority gaps remaining.
                </p>
              )}
            </div>

            {/* Week 7-8: Documentation & Polish (P3) */}
            <div className="rounded-xl border border-white/[0.06] border-l-[3px] border-l-[#6B6B76] bg-ct-surface p-5">
              <h4 className="text-sm font-semibold text-ct-text-primary">
                Week 7&ndash;8: Documentation &amp; Polish
              </h4>
              <ul className="mt-3 space-y-1.5">
                {gapsBySeverity.P3.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-start gap-2 text-xs text-ct-text-secondary"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6B6B76]" />
                    {g.title}
                  </li>
                ))}
                <li className="flex items-start gap-2 text-xs text-ct-text-secondary">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6B6B76]" />
                  Final review preparation
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-xs text-ct-text-tertiary italic">
            This timeline assumes dedicated effort. Your actual timeline may
            vary.
          </p>
        </section>

        {/* ============================================================= */}
        {/* Section 7: Document Roadmap                                    */}
        {/* ============================================================= */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-ct-text-primary">
            Your Document Roadmap
          </h2>
          <p className="mt-1.5 text-sm text-ct-text-secondary">
            Based on your profile, we&apos;ll generate these compliance
            documents:
          </p>

          {/* Priority 1 */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ct-status-gap-critical/15 text-xs font-bold text-ct-status-gap-critical">
                1
              </span>
              <h3 className="text-sm font-semibold text-ct-text-primary">
                Critical Priority
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRIORITY_1.map((doc) => (
                <DocumentCard
                  key={doc.name}
                  doc={doc}
                  status={getDocStatus(doc.q61Key, answers)}
                  locked={isDiscovery}
                />
              ))}
            </div>
          </div>

          {/* Priority 2 */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ct-accent-secondary/15 text-xs font-bold text-ct-accent-secondary">
                2
              </span>
              <h3 className="text-sm font-semibold text-ct-text-primary">
                Important
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRIORITY_2.map((doc) => (
                <DocumentCard
                  key={doc.name}
                  doc={doc}
                  status={getDocStatus(doc.q61Key, answers)}
                  locked={isDiscovery}
                />
              ))}
            </div>
          </div>

          {/* Priority 3 */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ct-accent/15 text-xs font-bold text-ct-accent">
                3
              </span>
              <h3 className="text-sm font-semibold text-ct-text-primary">
                Recommended
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRIORITY_3.map((doc) => (
                <DocumentCard
                  key={doc.name}
                  doc={doc}
                  status={getDocStatus(doc.q61Key, answers)}
                  locked={isDiscovery}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* Section 8: CTA                                                 */}
        {/* ============================================================= */}
        <section className="mt-16 mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-ct-accent/20 bg-gradient-to-br from-ct-accent/10 via-ct-surface to-ct-surface p-8 text-center">
            {/* Decorative glow */}
            <div
              className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 opacity-20 blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(108,99,255,0.6) 0%, transparent 70%)",
              }}
            />

            <h2 className="relative text-2xl font-bold text-ct-text-primary">
              Ready to generate your compliance documents?
            </h2>
            <p className="relative mt-3 text-sm text-ct-text-secondary">
              We&apos;ll create{" "}
              <span className="font-semibold text-ct-accent">{totalDocs}</span>{" "}
              documents tailored to {companyName}&apos;s technology stack,
              organizational structure, and security posture.
            </p>

            <div className="relative mt-8 flex flex-col items-center gap-3">
              {isDiscovery ? (
                <>
                  <Link
                    href="/pricing"
                    className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-ct-accent px-8 text-base font-semibold text-white transition-all hover:bg-ct-accent/90"
                  >
                    Upgrade to Start Generating
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                  <p className="text-xs text-ct-text-tertiary">
                    Document generation requires a paid plan
                  </p>
                </>
              ) : (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <button
                          disabled
                          className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-ct-accent px-8 text-base font-semibold text-white opacity-75 cursor-not-allowed transition-all"
                        >
                          Start Generating Documents
                          <span aria-hidden="true">&rarr;</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="border border-white/[0.06] bg-ct-surface-raised text-ct-text-primary"
                      >
                        <p className="text-xs">Coming Soon</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <button
                    onClick={() => {
                      const sections: { title: string; content: string }[] = [];

                      // Score overview
                      sections.push({
                        title: "Readiness Score Overview",
                        content: [
                          `**Overall Score:** ${readinessScore !== null ? Math.round(readinessScore) : "--"}/100`,
                          readinessResult ? `**Tier:** ${tierConfig.label}` : "",
                          readinessResult ? `\n${readinessResult.message}` : "",
                          `\n**Company:** ${companyName}`,
                        ]
                          .filter(Boolean)
                          .join("\n"),
                      });

                      // Dimension breakdown
                      if (readinessResult?.dimensions) {
                        const dimLines = readinessResult.dimensions.map(
                          (d) =>
                            `- **${d.label}:** ${d.score}/100 (${Math.round(d.weight * 100)}% weight)${d.signals.length > 0 ? " -- " + d.signals.join(", ") : ""}`,
                        );
                        sections.push({
                          title: "Dimension Breakdown",
                          content: dimLines.join("\n"),
                        });
                      }

                      // Gap analysis
                      if (gaps.length > 0) {
                        const severityLabels: Record<string, string> = {
                          P0: "Critical",
                          P1: "High",
                          P2: "Medium",
                          P3: "Low",
                        };
                        const gapTable = [
                          "| Gap | Severity | Dimension |",
                          "| --- | --- | --- |",
                          ...gaps.map(
                            (g) =>
                              `| ${g.title} | ${g.severity} - ${severityLabels[g.severity] ?? g.severity} | ${g.dimensionLabel} |`,
                          ),
                        ];
                        sections.push({
                          title: "Identified Gaps",
                          content: gapTable.join("\n"),
                        });
                      }

                      // Timeline
                      const timelineLines: string[] = [];
                      if (gapsBySeverity.P0.length > 0) {
                        timelineLines.push("## Week 1-2: Critical Foundations");
                        gapsBySeverity.P0.forEach((g) => timelineLines.push(`- ${g.title}`));
                      }
                      if (gapsBySeverity.P1.length > 0) {
                        timelineLines.push("## Week 3-4: Core Controls");
                        gapsBySeverity.P1.forEach((g) => timelineLines.push(`- ${g.title}`));
                      }
                      if (gapsBySeverity.P2.length > 0) {
                        timelineLines.push("## Week 5-6: Process Formalization");
                        gapsBySeverity.P2.forEach((g) => timelineLines.push(`- ${g.title}`));
                      }
                      if (gapsBySeverity.P3.length > 0) {
                        timelineLines.push("## Week 7-8: Documentation & Polish");
                        gapsBySeverity.P3.forEach((g) => timelineLines.push(`- ${g.title}`));
                      }
                      if (timelineLines.length > 0) {
                        sections.push({
                          title: "Recommended Remediation Timeline",
                          content: timelineLines.join("\n"),
                        });
                      }

                      exportToPdf(`${companyName} - Compliance Profile`, sections);
                    }}
                    className="inline-flex items-center gap-1.5 text-sm text-ct-text-secondary transition-colors hover:text-ct-accent"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export Compliance Profile as PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
