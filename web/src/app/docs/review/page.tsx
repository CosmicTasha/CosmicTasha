"use client";

import { useCallback, useState } from "react";
import {
  CheckCircle2,
  Flag,
  MessageSquare,
  PartyPopper,
  FileDown,
  Zap,
} from "lucide-react";

import { useReview } from "./_context/review-context";
import type { ReviewSection } from "@/lib/review/types";
import { exportToPdf } from "@/lib/export/pdf";
import { exportToDocx } from "@/lib/export/docx";

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: ReviewSection["status"] | string }) {
  const styles: Record<string, string> = {
    pending: "bg-white/[0.06] text-ct-text-tertiary",
    in_review: "bg-ct-accent/10 text-ct-accent",
    approved: "bg-ct-status-strength/10 text-ct-status-strength",
    changes_requested: "bg-ct-status-gap-critical/10 text-ct-status-gap-critical",
    flagged: "bg-[#F5A623]/10 text-[#F5A623]",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    in_review: "In Review",
    approved: "Approved",
    changes_requested: "Changes Requested",
    flagged: "Flagged",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] ?? styles.pending}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Comment input                                                      */
/* ------------------------------------------------------------------ */

function CommentInput({
  onSubmit,
  onCancel,
  placeholder,
  submitLabel,
}: {
  onSubmit: (comment: string) => void;
  onCancel: () => void;
  placeholder: string;
  submitLabel: string;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setValue("");
    }
  }, [value, onSubmit]);

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none rounded-md border border-white/[0.06] bg-ct-surface px-3 py-2 text-xs text-ct-text-primary placeholder:text-ct-text-tertiary focus:border-ct-accent focus:outline-none focus:ring-1 focus:ring-ct-accent"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="rounded-md bg-ct-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ct-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs text-ct-text-secondary transition-colors hover:text-ct-text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section card                                                       */
/* ------------------------------------------------------------------ */

function SectionCard({
  section,
  docId,
}: {
  section: ReviewSection;
  docId: string;
}) {
  const { approveSection, flagSection, requestChanges, selectSection, currentSection } =
    useReview();
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [showChangesInput, setShowChangesInput] = useState(false);

  const isApproved = section.status === "approved";
  const isFlagged = section.status === "flagged";
  const isChangesRequested = section.status === "changes_requested";
  const isSelected = currentSection?.id === section.id;

  // Left border color based on status
  const borderColor = isApproved
    ? "border-l-ct-status-strength"
    : isFlagged
      ? "border-l-[#F5A623]"
      : isChangesRequested
        ? "border-l-ct-status-gap-critical"
        : section.hasReviewTag
          ? "border-l-ct-accent"
          : "border-l-ct-border-subtle";

  const handleClick = useCallback(() => {
    selectSection(section.id);
  }, [selectSection, section.id]);

  const handleApprove = useCallback(() => {
    approveSection(docId, section.id);
    setShowFlagInput(false);
    setShowChangesInput(false);
  }, [approveSection, docId, section.id]);

  const handleFlag = useCallback(
    (comment: string) => {
      flagSection(docId, section.id, comment);
      setShowFlagInput(false);
    },
    [flagSection, docId, section.id]
  );

  const handleRequestChanges = useCallback(
    (comment: string) => {
      requestChanges(docId, section.id, comment);
      setShowChangesInput(false);
    },
    [requestChanges, docId, section.id]
  );

  return (
    <div
      onClick={handleClick}
      className={`group rounded-lg border-l-[3px] ${borderColor} border border-white/[0.06] bg-ct-surface transition-colors cursor-pointer ${
        isSelected ? "ring-1 ring-ct-accent/30" : "hover:border-white/[0.1]"
      } ${isApproved ? "opacity-80" : ""}`}
    >
      <div className="px-5 py-4">
        {/* Section header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-ct-text-primary">
              {section.title}
            </h3>
            {section.hasReviewTag && (
              <span className="inline-flex items-center rounded bg-ct-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-ct-accent">
                REVIEW
              </span>
            )}
          </div>
          <StatusBadge status={section.status} />
        </div>

        {/* Review note (from the AI) */}
        {section.reviewNote && section.hasReviewTag && (
          <div className="mt-3 rounded-md bg-ct-accent/[0.06] border border-ct-accent/10 px-3 py-2">
            <p className="text-[11px] leading-relaxed text-ct-accent/80">
              {section.reviewNote}
            </p>
          </div>
        )}

        {/* Section content */}
        <div className="mt-3 max-h-[300px] overflow-y-auto rounded-md bg-ct-base/50 px-4 py-3">
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-ct-text-secondary">
            {section.content.replace(/^\[REVIEW\]\s*/m, "")}
          </pre>
        </div>

        {/* Customer comment (if flagged or changes requested) */}
        {section.customerComment && (isFlagged || isChangesRequested) && (
          <div
            className={`mt-3 rounded-md px-3 py-2 ${
              isFlagged
                ? "bg-[#F5A623]/[0.06] border border-[#F5A623]/10"
                : "bg-ct-status-gap-critical/[0.06] border border-ct-status-gap-critical/10"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="h-3 w-3 text-ct-text-tertiary" />
              <span className="text-[10px] font-medium text-ct-text-tertiary">
                Your Comment
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-ct-text-secondary">
              {section.customerComment}
            </p>
          </div>
        )}

        {/* Approved badge */}
        {isApproved && (
          <div className="mt-3 flex items-center gap-1.5 text-ct-status-strength">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Approved</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleApprove();
            }}
            disabled={isApproved}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isApproved
                ? "bg-ct-status-strength/10 text-ct-status-strength/50 cursor-not-allowed"
                : "bg-ct-status-strength/10 text-ct-status-strength hover:bg-ct-status-strength/20"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve Section
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFlagInput((v) => !v);
              setShowChangesInput(false);
            }}
            disabled={isApproved}
            className={`flex items-center gap-1.5 rounded-md border border-white/[0.06] px-3 py-1.5 text-xs text-ct-text-secondary transition-colors ${
              isApproved
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-[#F5A623]/30 hover:text-[#F5A623]"
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            Flag for Review
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowChangesInput((v) => !v);
              setShowFlagInput(false);
            }}
            disabled={isApproved}
            className={`flex items-center gap-1.5 rounded-md border border-white/[0.06] px-3 py-1.5 text-xs text-ct-text-secondary transition-colors ${
              isApproved
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-ct-status-gap-critical/30 hover:text-ct-status-gap-critical"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Request Changes
          </button>
        </div>

        {/* Comment inputs */}
        {showFlagInput && !isApproved && (
          <div onClick={(e) => e.stopPropagation()}>
            <CommentInput
              onSubmit={handleFlag}
              onCancel={() => setShowFlagInput(false)}
              placeholder="What should be reviewed? Be specific about your concern..."
              submitLabel="Flag Section"
            />
          </div>
        )}

        {showChangesInput && !isApproved && (
          <div onClick={(e) => e.stopPropagation()}>
            <CommentInput
              onSubmit={handleRequestChanges}
              onCancel={() => setShowChangesInput(false)}
              placeholder="What changes are needed? Describe what should be different..."
              submitLabel="Request Changes"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Document complete banner                                           */
/* ------------------------------------------------------------------ */

function CompleteBanner({ docId: _docId }: { docId: string }) {
  const { currentDoc } = useReview();

  const handleExportPdf = useCallback(() => {
    if (!currentDoc) return;
    const sections = currentDoc.sections.map((s) => ({
      title: s.title,
      content: s.content,
    }));
    exportToPdf(currentDoc.name, sections);
  }, [currentDoc]);

  const handleExportDocx = useCallback(async () => {
    if (!currentDoc) return;
    const sections = currentDoc.sections.map((s) => ({
      title: s.title,
      content: s.content,
    }));
    await exportToDocx(currentDoc.name, "Your Company", sections);
  }, [currentDoc]);

  return (
    <div className="rounded-lg border border-ct-status-strength/20 bg-ct-status-strength/[0.06] px-6 py-5">
      <div className="flex items-center gap-3">
        <PartyPopper className="h-6 w-6 text-ct-status-strength" />
        <div>
          <h3 className="text-sm font-semibold text-ct-text-primary">
            All sections approved!
          </h3>
          <p className="mt-0.5 text-xs text-ct-text-secondary">
            This document is ready for export.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button className="flex items-center gap-1.5 rounded-md bg-ct-status-strength px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-ct-status-strength/80">
          <CheckCircle2 className="h-3.5 w-3.5" />
          I Approve &amp; Finalize This Document
        </button>
        <button
          onClick={handleExportPdf}
          className="flex items-center gap-1.5 rounded-md border border-white/[0.06] px-4 py-2 text-xs text-ct-text-secondary transition-colors hover:border-ct-accent/30 hover:text-ct-accent"
        >
          <FileDown className="h-3.5 w-3.5" />
          Export as PDF
        </button>
        <button
          onClick={handleExportDocx}
          className="flex items-center gap-1.5 rounded-md border border-white/[0.06] px-4 py-2 text-xs text-ct-text-secondary transition-colors hover:border-ct-accent/30 hover:text-ct-accent"
        >
          <FileDown className="h-3.5 w-3.5" />
          Export as DOCX
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ReviewPage() {
  const { currentDoc, approveAllUnflagged } = useReview();

  if (!currentDoc) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-ct-text-tertiary">
          Select a document from the sidebar to begin your review. You approve every section before it&apos;s finalized.
        </p>
      </div>
    );
  }

  const allApproved = currentDoc.approvedSections === currentDoc.totalSections;
  const hasPendingUnflagged = currentDoc.sections.some(
    (s) =>
      s.status === "pending" && !s.hasReviewTag
  );

  return (
    <div className="space-y-6">
      {/* Document header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-ct-text-primary">
              {currentDoc.name}
            </h1>
            <StatusBadge status={currentDoc.status} />
            {currentDoc.reviewFlags > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-[#F5A623]/10 px-2 py-0.5 text-[10px] text-[#F5A623]">
                <Flag className="h-2.5 w-2.5" />
                {currentDoc.reviewFlags} flag
                {currentDoc.reviewFlags !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="text-xs text-ct-text-tertiary">
            {currentDoc.approvedSections} / {currentDoc.totalSections} sections
            approved
          </div>
        </div>

        {/* Batch action */}
        {hasPendingUnflagged && !allApproved && (
          <button
            onClick={() => approveAllUnflagged(currentDoc.id)}
            className="mt-3 flex items-center gap-1.5 rounded-md border border-ct-status-strength/20 bg-ct-status-strength/[0.06] px-3 py-1.5 text-xs font-medium text-ct-status-strength transition-colors hover:bg-ct-status-strength/10"
          >
            <Zap className="h-3.5 w-3.5" />
            I Approve All Unflagged Sections
          </button>
        )}
      </div>

      {/* Complete banner */}
      {allApproved && <CompleteBanner docId={currentDoc.id} />}

      {/* Sections */}
      <div className="space-y-4">
        {currentDoc.sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            docId={currentDoc.id}
          />
        ))}
      </div>
    </div>
  );
}
