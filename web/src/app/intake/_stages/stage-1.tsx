"use client";

import * as React from "react";
import { ChevronDown, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuestionCard } from "../_components/question-card";
import { SegmentSelector } from "../_components/segment-selector";
import { ChipMultiSelect } from "../_components/chip-multi-select";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Stage1Props {
  answers: Record<string, unknown>;
  onAnswer: (questionId: string, value: unknown) => void;
  onContinue?: () => void;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const HEADCOUNT_OPTIONS = [
  "1-5",
  "6-15",
  "16-50",
  "51-100",
  "101-200",
  "200+",
];

const INDUSTRY_OPTIONS = [
  "Financial Services",
  "Healthcare",
  "Education",
  "Government",
  "Enterprise SaaS",
  "E-commerce",
  "Media & Entertainment",
];

const YEAR_OPTIONS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) =>
  String(2026 - i)
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Stage1({ answers, onAnswer, onContinue }: Stage1Props) {
  const [aiPreviewOpen, setAiPreviewOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewSource, setPreviewSource] = React.useState<'ai' | 'mock' | null>(null);
  const [previewError, setPreviewError] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchIdRef = React.useRef(0);

  const companyName = (answers["q1.1"] as string) ?? "";
  const website = (answers["q1.2"] as string) ?? "";
  const headcount = (answers["q1.3"] as string) ?? null;
  const description = (answers["q1.4"] as string) ?? "";
  const industries = (answers["q1.5"] as string[]) ?? [];
  const founded = (answers["q1.6"] as string) ?? "";

  // -- AI preview fetch logic --
  const fetchPreview = React.useCallback(
    async (desc: string) => {
      const id = ++fetchIdRef.current;
      setPreviewLoading(true);
      setPreviewError(false);

      try {
        const res = await fetch("/api/intake/ai-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: desc,
            companyName: companyName || undefined,
            industry: industries.length > 0 ? industries : undefined,
          }),
        });

        // Stale request guard
        if (id !== fetchIdRef.current) return;

        if (!res.ok) {
          setPreviewError(true);
          setPreviewLoading(false);
          return;
        }

        const data = await res.json();
        setPreview(data.preview);
        setPreviewSource(data.source);
        setAiPreviewOpen(true);
      } catch (_err: unknown) {
        if (id !== fetchIdRef.current) return;
        setPreviewError(true);
      } finally {
        if (id === fetchIdRef.current) {
          setPreviewLoading(false);
        }
      }
    },
    [companyName, industries],
  );

  // Debounced effect: trigger preview when description changes
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (description.trim().length < 20) {
      // Clear preview when description is too short
      setPreview(null);
      setPreviewSource(null);
      setPreviewError(false);
      setAiPreviewOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchPreview(description);
    }, 1500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [description, fetchPreview]);

  const canContinue =
    companyName.trim().length > 0 &&
    headcount !== null &&
    description.trim().length > 0 &&
    industries.length > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Q1.1 — Company name */}
      <QuestionCard id="q1.1" label="Company name" required>
        <Input
          value={companyName}
          onChange={(e) => onAnswer("q1.1", e.target.value)}
          onBlur={() => onAnswer("q1.1", companyName)}
          placeholder="Acme Corp"
          className="max-w-sm border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
        />
      </QuestionCard>

      {/* Q1.2 — Company website */}
      <QuestionCard
        id="q1.2"
        label="Company website"
        description="We'll use this to auto-detect some details about your stack"
      >
        <Input
          type="url"
          value={website}
          onChange={(e) => onAnswer("q1.2", e.target.value)}
          onBlur={() => onAnswer("q1.2", website)}
          placeholder="https://acme.com"
          className="max-w-sm border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
        />
      </QuestionCard>

      {/* Q1.3 — Headcount */}
      <QuestionCard
        id="q1.3"
        label="How many people work at your company?"
        required
      >
        <SegmentSelector
          options={HEADCOUNT_OPTIONS}
          value={headcount}
          onChange={(val) => onAnswer("q1.3", val)}
        />
      </QuestionCard>

      {/* Q1.4 — What does your company do */}
      <QuestionCard
        id="q1.4"
        label="What does your company do?"
        required
      >
        <Textarea
          value={description}
          onChange={(e) => onAnswer("q1.4", e.target.value)}
          onBlur={() => onAnswer("q1.4", description)}
          placeholder="Describe what your product or service does in 1-2 sentences"
          rows={4}
          className="max-w-lg border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
        />

        {/* AI Preview collapsible */}
        <div className="mt-3 max-w-lg">
          <button
            type="button"
            onClick={() => setAiPreviewOpen(!aiPreviewOpen)}
            className="flex items-center gap-2 text-sm text-ct-text-secondary hover:text-ct-text-primary transition-colors duration-200"
            aria-expanded={aiPreviewOpen}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                aiPreviewOpen && "rotate-180"
              )}
            />
            <span>
              {aiPreviewOpen
                ? "AI Preview"
                : "We'll show you how this reads in SOC 2 language"}
            </span>
          </button>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              aiPreviewOpen ? "mt-2 max-h-60 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="rounded-xl border border-ct-border-subtle bg-ct-surface p-4">
              {previewLoading && (
                <p className="text-sm text-ct-text-secondary animate-pulse">
                  Generating SOC 2 preview...
                </p>
              )}

              {!previewLoading && previewError && (
                <p className="text-sm text-ct-text-tertiary">
                  Preview unavailable
                </p>
              )}

              {!previewLoading && !previewError && preview && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm italic text-ct-text-secondary">
                      {preview}
                    </p>
                    <button
                      type="button"
                      onClick={() => fetchPreview(description)}
                      className="shrink-0 flex items-center gap-1 text-xs text-ct-text-tertiary hover:text-ct-text-secondary transition-colors duration-200"
                      title="Regenerate preview"
                    >
                      <RotateCw className="size-3" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-ct-text-tertiary">
                      We&apos;ll refine this during document generation.
                    </span>
                    {previewSource === 'ai' && (
                      <span className="rounded-full bg-ct-accent/10 px-2 py-0.5 text-[10px] font-medium text-ct-accent">
                        AI Generated
                      </span>
                    )}
                    {previewSource === 'mock' && (
                      <span className="rounded-full bg-ct-border-subtle px-2 py-0.5 text-[10px] font-medium text-ct-text-tertiary">
                        Template Preview
                      </span>
                    )}
                  </div>
                </>
              )}

              {!previewLoading && !previewError && !preview && (
                <p className="text-sm italic text-ct-text-tertiary">
                  Type at least 20 characters to see a SOC 2 preview...
                </p>
              )}
            </div>
          </div>
        </div>
      </QuestionCard>

      {/* Q1.5 — Industry */}
      <QuestionCard
        id="q1.5"
        label="What industry best describes your customers?"
        required
      >
        <ChipMultiSelect
          options={INDUSTRY_OPTIONS}
          selected={industries}
          onChange={(val) => onAnswer("q1.5", val)}
          allowOther
        />
      </QuestionCard>

      {/* Q1.6 — Founded year */}
      <QuestionCard id="q1.6" label="When was your company founded?">
        <div className="flex items-center gap-3">
          <select
            value={founded}
            onChange={(e) => onAnswer("q1.6", e.target.value)}
            className={cn(
              "h-8 w-32 rounded-lg border border-ct-border-subtle bg-ct-surface px-2.5 text-sm transition-colors",
              "focus-visible:border-ct-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
              founded ? "text-ct-text-primary" : "text-ct-text-tertiary"
            )}
          >
            <option value="" disabled>
              Year
            </option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year} className="bg-ct-surface text-ct-text-primary">
                {year}
              </option>
            ))}
          </select>
          {!founded && (
            <button
              type="button"
              onClick={() => onAnswer("q1.6", "skip")}
              className="text-sm text-ct-text-secondary hover:text-ct-text-primary transition-colors duration-200 underline underline-offset-2"
            >
              Skip
            </button>
          )}
        </div>
      </QuestionCard>

      {/* Continue button */}
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
          Continue to Technical Environment
          <span aria-hidden="true">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}
