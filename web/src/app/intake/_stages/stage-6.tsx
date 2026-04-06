"use client";

import * as React from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuestionCard } from "../_components/question-card";
import { SelectCard } from "../_components/select-card";
import { SegmentSelector } from "../_components/segment-selector";
import { ChipMultiSelect } from "../_components/chip-multi-select";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Stage6Props {
  answers: Record<string, unknown>;
  onAnswer: (questionId: string, value: unknown) => void;
  onContinue?: () => void;
}

interface DocumentEntry {
  document: string;
  status: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Data — Q6.1 Documents
// ---------------------------------------------------------------------------

const DOCUMENTS = [
  "Information Security Policy",
  "Acceptable Use Policy",
  "Access Control Policy",
  "Change Management Policy",
  "Incident Response Plan",
  "BC/DR Plan",
  "Risk Assessment",
  "Vendor Management Policy",
  "Data Classification Policy",
  "Employee Handbook / Code of Conduct",
  "Password / Authentication Policy",
  "Encryption Policy",
  "Asset Management Inventory",
] as const;

const DOC_STATUS_OPTIONS = ["Have it", "Sort of", "Don't have it"];

// ---------------------------------------------------------------------------
// Data — Q6.2 Policy owner
// ---------------------------------------------------------------------------

const OWNER_OPTIONS = [
  "Same as security lead",
  "Different person",
  "Multiple people (by policy area)",
] as const;

// ---------------------------------------------------------------------------
// Data — Q6.3 Review frequency
// ---------------------------------------------------------------------------

const REVIEW_OPTIONS = ["Annually", "Semi-annually", "Quarterly"];

// ---------------------------------------------------------------------------
// Data — Q6.4 Doc format
// ---------------------------------------------------------------------------

const FORMAT_OPTIONS = [
  "PDF",
  "Google Docs",
  "Notion",
  "Confluence",
  "Markdown",
  "Word (.docx)",
  "No preference",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Stage6({
  answers,
  onAnswer,
  onContinue,
}: Stage6Props) {
  // -- Q6.1 Document inventory --
  const docEntries = (answers["q6_1"] as DocumentEntry[]) ?? [];

  const getDocEntry = (doc: string): DocumentEntry | undefined =>
    docEntries.find((d) => d.document === doc);

  const setDocStatus = (doc: string, status: string) => {
    const existing = docEntries.find((d) => d.document === doc);
    if (existing) {
      onAnswer(
        "q6_1",
        docEntries.map((d) =>
          d.document === doc
            ? { ...d, status, description: status === "Sort of" ? d.description : undefined }
            : d
        )
      );
    } else {
      onAnswer("q6_1", [
        ...docEntries,
        { document: doc, status },
      ]);
    }
  };

  const setDocDescription = (doc: string, description: string) => {
    onAnswer(
      "q6_1",
      docEntries.map((d) =>
        d.document === doc ? { ...d, description } : d
      )
    );
  };

  // -- Q6.2 Policy owner --
  const policyOwner = (answers["q6_2"] as string) ?? "";
  const ownerName = (answers["q6_2_name"] as string) ?? "";
  const ownerEmail = (answers["q6_2_email"] as string) ?? "";
  const ownerTitle = (answers["q6_2_title"] as string) ?? "";
  const securityLead = (answers["q3.1"] as string) ?? "";

  // -- Q6.3 Review frequency --
  const reviewFreq = (answers["q6_3"] as string) ?? "";

  // Set default to Annually on mount
  React.useEffect(() => {
    if (!reviewFreq) {
      onAnswer("q6_3", "Annually");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Q6.4 Doc format --
  const docFormat = (answers["q6_4"] as string) ?? "";

  // -- Q6.5 Anything else --
  const anythingElse = (answers["q6_5"] as string) ?? "";

  // -- Continue logic --
  const answeredDocs = docEntries.filter((d) => d.status).length;
  const canContinue = answeredDocs >= 5 && reviewFreq !== "";

  return (
    <div className="flex flex-col gap-10">
      {/* Opening prompt */}
      <div className="rounded-xl border border-ct-accent/25 bg-ct-accent/5 px-5 py-4">
        <p className="text-sm leading-relaxed text-ct-text-secondary">
          Even informal docs count &mdash; a Google Doc titled &ldquo;How We
          Deploy&rdquo; or a Notion page about onboarding. We can import and
          upgrade anything you have.
        </p>
      </div>

      {/* ================================================================= */}
      {/* Q6.1 — Document inventory                                         */}
      {/* ================================================================= */}
      <QuestionCard
        id="q6_1"
        label="What documentation do you have today?"
        required
      >
        <div className="flex flex-col gap-0 rounded-xl border border-ct-border-subtle overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 bg-ct-surface-raised px-4 py-2.5 border-b border-ct-border-subtle">
            <span className="text-xs font-semibold uppercase tracking-wider text-ct-text-tertiary">
              Document
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-ct-text-tertiary w-[280px] text-center">
              Status
            </span>
          </div>

          {DOCUMENTS.map((doc, i) => {
            const entry = getDocEntry(doc);
            const status = entry?.status ?? "";

            return (
              <div key={doc} className="flex flex-col">
                <div
                  className={cn(
                    "grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3",
                    i % 2 === 0 ? "bg-ct-surface" : "bg-ct-surface-raised/50",
                    i < DOCUMENTS.length - 1 &&
                      "border-b border-ct-border-subtle/50"
                  )}
                >
                  <span className="text-sm font-medium text-ct-text-primary">
                    {doc}
                  </span>
                  <div className="w-[280px]">
                    <SegmentSelector
                      options={DOC_STATUS_OPTIONS}
                      value={status || null}
                      onChange={(val) => setDocStatus(doc, val)}
                    />
                  </div>
                </div>

                {/* "Have it" → upload prompt */}
                {status === "Have it" && (
                  <div
                    className={cn(
                      "animate-in fade-in slide-in-from-top-1 duration-200",
                      "flex items-center gap-3 px-4 py-2.5",
                      i % 2 === 0 ? "bg-ct-surface" : "bg-ct-surface-raised/50"
                    )}
                  >
                    <p className="text-xs text-ct-text-secondary">
                      Want to upload it? We&apos;ll scan it for sensitive data first.
                    </p>
                    <Link
                      href="/docs/sanitize"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ct-accent/30 bg-ct-accent/10 px-3 py-1.5 text-xs font-medium text-ct-accent hover:bg-ct-accent/20 transition-colors"
                    >
                      <Upload className="size-3" />
                      Upload &amp; Sanitize
                    </Link>
                  </div>
                )}

                {/* "Sort of" → describe it */}
                {status === "Sort of" && (
                  <div
                    className={cn(
                      "animate-in fade-in slide-in-from-top-1 duration-200",
                      "px-4 py-2.5",
                      i % 2 === 0 ? "bg-ct-surface" : "bg-ct-surface-raised/50"
                    )}
                  >
                    <Input
                      value={entry?.description ?? ""}
                      onChange={(e) =>
                        setDocDescription(doc, e.target.value)
                      }
                      placeholder="Describe what you have..."
                      className="max-w-md border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary text-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q6.2 — Policy owner                                               */}
      {/* ================================================================= */}
      <QuestionCard
        id="q6_2"
        label="Who will own and approve compliance policies?"
      >
        <div className="flex flex-col gap-2 max-w-lg">
          {OWNER_OPTIONS.map((option) => {
            const label =
              option === "Same as security lead" && securityLead
                ? `Same as security lead (${securityLead})`
                : option;

            return (
              <SelectCard
                key={option}
                title={label}
                selected={policyOwner === option}
                onClick={() => onAnswer("q6_2", option)}
              />
            );
          })}
        </div>

        {/* Different person follow-up */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            policyOwner === "Different person"
              ? "mt-4 max-h-60 opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          <div className="rounded-xl border border-ct-border-subtle bg-ct-surface p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Input
                value={ownerName}
                onChange={(e) =>
                  onAnswer("q6_2_name", e.target.value)
                }
                placeholder="Full name"
                className="max-w-xs border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
              />
              <Input
                type="email"
                value={ownerEmail}
                onChange={(e) =>
                  onAnswer("q6_2_email", e.target.value)
                }
                placeholder="Email"
                className="max-w-xs border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
              />
              <Input
                value={ownerTitle}
                onChange={(e) =>
                  onAnswer("q6_2_title", e.target.value)
                }
                placeholder="Title"
                className="max-w-xs border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
              />
            </div>
          </div>
        </div>
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q6.3 — Review frequency                                           */}
      {/* ================================================================= */}
      <QuestionCard
        id="q6_3"
        label="How often should policies be formally reviewed?"
        required
      >
        <SegmentSelector
          options={REVIEW_OPTIONS}
          value={reviewFreq || null}
          onChange={(val) => onAnswer("q6_3", val)}
        />
        {reviewFreq === "Annually" && (
          <p className="mt-2 text-xs italic text-ct-text-tertiary">
            Annual review is standard for most SOC 2 audits.
          </p>
        )}
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q6.4 — Preferred doc format                                       */}
      {/* ================================================================= */}
      <QuestionCard
        id="q6_4"
        label="What format do you prefer for compliance documents?"
      >
        <ChipMultiSelect
          options={FORMAT_OPTIONS}
          selected={docFormat ? [docFormat] : []}
          onChange={(val) => {
            // Single select behavior: take the last-selected value
            const latest = val[val.length - 1];
            onAnswer("q6_4", latest ?? "");
          }}
        />
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q6.5 — Anything else                                              */}
      {/* ================================================================= */}
      <QuestionCard
        id="q6_5"
        label="Anything else that would help us build better documents?"
        description="Specific audit firm, customer requirements, concerns..."
      >
        <Textarea
          value={anythingElse}
          onChange={(e) => onAnswer("q6_5", e.target.value)}
          placeholder="e.g., our customer Acme Corp requires SOC 2 Type II by Q3, we're working with Drata as our GRC platform..."
          rows={4}
          className="max-w-lg border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
        />
      </QuestionCard>

      {/* ================================================================= */}
      {/* Complete Assessment                                                */}
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
          className="h-12 gap-2 rounded-xl bg-ct-accent px-8 text-base font-semibold text-white hover:bg-ct-accent/90"
        >
          Complete Assessment
          <span aria-hidden="true">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}
