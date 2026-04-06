"use client";

import { useCallback } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Flag,
  FileText,
  ShieldCheck,
  BookOpen,
  Lightbulb,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { ReviewProvider, useReview } from "./_context/review-context";
import { getComplianceContext } from "@/lib/review/mock-data";
import { COACHING_PROMPTS } from "@/lib/review/types";
import type { ReviewDocument } from "@/lib/review/types";

/* ------------------------------------------------------------------ */
/*  Document nav item                                                  */
/* ------------------------------------------------------------------ */

function DocNavItem({ doc }: { doc: ReviewDocument }) {
  const { currentDoc, selectDocument } = useReview();
  const isCurrent = currentDoc?.id === doc.id;

  const handleClick = useCallback(() => {
    selectDocument(doc.id);
  }, [selectDocument, doc.id]);

  return (
    <button
      onClick={handleClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        isCurrent
          ? "bg-ct-surface-raised text-ct-text-primary"
          : "text-ct-text-secondary hover:bg-ct-surface-raised hover:text-ct-text-primary"
      }`}
    >
      {/* Status icon */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {doc.status === "approved" ? (
          <CheckCircle2 className="h-4 w-4 text-ct-status-strength" />
        ) : isCurrent ? (
          <ChevronRight className="h-3.5 w-3.5 text-ct-accent" />
        ) : (
          <Circle className="h-3.5 w-3.5 text-ct-text-tertiary" />
        )}
      </span>

      {/* Name and meta */}
      <span className="flex-1 truncate">{doc.name}</span>

      {/* Flag count */}
      {doc.reviewFlags > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-[#F5A623]/10 px-1.5 py-0.5 text-[10px] text-[#F5A623]">
          <Flag className="h-2.5 w-2.5" />
          {doc.reviewFlags}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Left panel — Document navigation                                   */
/* ------------------------------------------------------------------ */

function DocumentNav() {
  const { documents } = useReview();

  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const totalCount = documents.length;

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[260px] flex-col border-r border-white/[0.06] bg-ct-surface">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h2 className="text-sm font-semibold text-ct-text-primary">
          Documents for Review
        </h2>
        <p className="mt-1 text-xs text-ct-text-tertiary">
          {approvedCount} of {totalCount} approved
        </p>
        {/* Progress bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ct-surface-raised">
          <div
            className="h-full rounded-full bg-ct-status-strength transition-all duration-500 ease-out"
            style={{
              width: totalCount > 0 ? `${(approvedCount / totalCount) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* Document list */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {documents.map((doc) => (
          <DocNavItem key={doc.id} doc={doc} />
        ))}
      </nav>

      <Separator className="bg-white/[0.06]" />

      {/* Footer */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-ct-text-tertiary">
          <FileText className="h-3.5 w-3.5" />
          <span>Priority 1 Document Set</span>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Right panel — Compliance context                                   */
/* ------------------------------------------------------------------ */

function CompliancePanel() {
  const { currentSection } = useReview();
  const context = getComplianceContext(currentSection);

  // Determine coaching prompt type from section content/title
  const coachingPrompt = getCoachingForSection(currentSection);

  return (
    <aside className="fixed right-0 top-0 z-30 hidden h-screen w-[340px] flex-col border-l border-white/[0.06] bg-ct-surface xl:flex">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-ct-accent" />
          <h3 className="text-sm font-semibold text-ct-text-primary">
            Compliance Context
          </h3>
        </div>
        <p className="mt-0.5 text-xs text-ct-text-tertiary">
          TSC criteria and auditor guidance
        </p>
      </div>

      <Separator className="bg-white/[0.06]" />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!currentSection ? (
          <p className="text-center text-xs text-ct-text-tertiary">
            Select a section to view compliance context
          </p>
        ) : !context ? (
          <p className="text-center text-xs text-ct-text-tertiary">
            No compliance context available for this section
          </p>
        ) : (
          <div className="space-y-4">
            {/* TSC Criteria cards */}
            {context.criteria.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ct-text-secondary">
                  <BookOpen className="h-3.5 w-3.5" />
                  TSC Criteria
                </h4>
                <div className="space-y-2">
                  {context.criteria.map((c) => (
                    <div
                      key={c.code}
                      className="rounded-md border border-white/[0.06] bg-ct-surface-raised px-3 py-2.5"
                    >
                      <span className="inline-block rounded bg-ct-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-ct-accent">
                        {c.code}
                      </span>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-ct-text-secondary">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auditor Expectations */}
            {context.auditorExpectation && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ct-text-secondary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Auditor Expectations
                </h4>
                <div className="rounded-md border border-white/[0.06] bg-ct-surface-raised px-3 py-2.5">
                  <p className="text-[11px] leading-relaxed text-ct-text-secondary">
                    {context.auditorExpectation}
                  </p>
                </div>
              </div>
            )}

            {/* Evidence Examples */}
            {context.evidenceExamples.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ct-text-secondary">
                  <FileText className="h-3.5 w-3.5" />
                  Evidence Examples
                </h4>
                <ul className="space-y-1">
                  {context.evidenceExamples.map((ex, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-md bg-ct-surface-raised px-3 py-2 text-[11px] text-ct-text-secondary"
                    >
                      <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-ct-text-tertiary" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Coaching prompt for [REVIEW] tagged sections */}
            {currentSection.hasReviewTag && coachingPrompt && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#F5A623]">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Auditor Coaching
                </h4>
                <div className="rounded-md border border-[#F5A623]/20 bg-[#F5A623]/[0.06] px-3 py-2.5">
                  <p className="text-[11px] font-medium text-ct-text-primary">
                    {coachingPrompt.question}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {coachingPrompt.specificQuestions.map((q, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[11px] leading-relaxed text-ct-text-secondary"
                      >
                        <span className="mt-1 text-[#F5A623]">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

/**
 * Determine the coaching prompt type from a section's title/content.
 */
function getCoachingForSection(
  section: { title: string; content: string; hasReviewTag: boolean } | null
) {
  if (!section || !section.hasReviewTag) return null;

  const titleLower = section.title.toLowerCase();
  const contentLower = section.content.toLowerCase();

  if (titleLower.includes("classification") || titleLower.includes("severity"))
    return COACHING_PROMPTS["incident-classification"];
  if (titleLower.includes("response") || titleLower.includes("procedure"))
    return COACHING_PROMPTS["response-procedures"];
  if (titleLower.includes("communication") || titleLower.includes("notification"))
    return COACHING_PROMPTS["communication-plan"];
  if (titleLower.includes("access") && (titleLower.includes("review") || titleLower.includes("control")))
    return COACHING_PROMPTS["access-control"];
  if (titleLower.includes("change") || titleLower.includes("deployment"))
    return COACHING_PROMPTS["change-management"];
  if (titleLower.includes("risk") || contentLower.includes("risk treatment"))
    return COACHING_PROMPTS["risk-assessment"];

  // Default: use risk-assessment as generic fallback
  return COACHING_PROMPTS["risk-assessment"];
}

/* ------------------------------------------------------------------ */
/*  Layout shell                                                       */
/* ------------------------------------------------------------------ */

function ReviewShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ct-base">
      <DocumentNav />
      <CompliancePanel />

      <main className="ml-[260px] min-h-screen xl:mr-[340px]">
        <div className="mx-auto max-w-[860px] px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReviewProvider>
      <ReviewShell>{children}</ReviewShell>
    </ReviewProvider>
  );
}
