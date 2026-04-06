"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionCard } from "../_components/question-card";
import { SelectCard } from "../_components/select-card";
import { SegmentSelector } from "../_components/segment-selector";
import { ChipMultiSelect } from "../_components/chip-multi-select";
import { cn } from "@/lib/utils";
import { InlineInsight } from "../_components/inline-insight";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Stage3Props {
  answers: Record<string, unknown>;
  onAnswer: (questionId: string, value: unknown) => void;
  onContinue?: () => void;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const SECURITY_OWNER_OPTIONS = [
  "We have a dedicated security person (CISO, Head of Security)",
  "CTO/VP Engineering handles security alongside other duties",
  "CEO/founder handles it",
  "Split across several people informally",
  "Nobody has explicit security ownership yet",
] as const;

const ENGINEER_COUNT_OPTIONS = [
  "0",
  "1-3",
  "4-10",
  "11-25",
  "26-50",
  "50+",
];

const WORK_LOCATION_OPTIONS = [
  {
    title: "Fully remote",
    helper: "We'll focus on endpoint management and remote access policies",
  },
  {
    title: "Office-based",
    helper: "We'll include physical security questions",
  },
  {
    title: "Hybrid (mix of remote and office)",
    helper: "We'll cover both remote and physical security",
  },
] as const;

const CONTRACTOR_ACCESS_OPTIONS = [
  "Source code",
  "Production systems",
  "Customer data",
  "Internal tools only",
  "Other",
];

const DEPARTMENT_OPTIONS = [
  "HR/People Ops",
  "Legal",
  "Finance",
  "Customer Support",
  "Sales",
  "Marketing",
  "Product",
  "QA/Testing",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Stage3({
  answers,
  onAnswer,
  onContinue,
}: Stage3Props) {
  // Derived state from answers
  const companySize = answers["q1.3"] as string | undefined;
  const isSmallCompany =
    companySize === "1-5" || companySize === "6-15";

  const securityOwner = (answers["q3.1"] as string) ?? "";
  const leadName = (answers["q3.1_lead_name"] as string) ?? "";
  const leadEmail = (answers["q3.1_lead_email"] as string) ?? "";
  const engineerCount = (answers["q3.2"] as string) ?? null;
  const workLocation = (answers["q3.3"] as string) ?? "";
  const hasContractors = (answers["q3.4"] as string) ?? "";
  const contractorAccess = (answers["q3.4_access"] as string[]) ?? [];
  const departments = (answers["q3.5"] as string[]) ?? [];

  const nobodySelected =
    securityOwner === "Nobody has explicit security ownership yet";

  const canContinue =
    securityOwner !== "" &&
    engineerCount !== null &&
    workLocation !== "" &&
    hasContractors !== "" &&
    // If nobody owns security, require lead name + email
    (!nobodySelected || (leadName.trim() !== "" && leadEmail.trim() !== "")) &&
    // If contractors exist, require access selection
    (hasContractors !== "Yes" || contractorAccess.length > 0);

  return (
    <div className="flex flex-col gap-10">
      {/* Early-stage banner */}
      {isSmallCompany && (
        <div className="rounded-xl border border-ct-accent/25 bg-ct-accent/5 px-5 py-4">
          <p className="text-sm leading-relaxed text-ct-text-secondary">
            At early-stage companies, people wear a lot of hats. That&apos;s
            totally normal for SOC 2 &mdash; we just need to know who&apos;s
            wearing which hats.
          </p>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Q3.1 — Security ownership                                         */}
      {/* ----------------------------------------------------------------- */}
      <QuestionCard
        id="q3.1"
        label="Who is responsible for security?"
        required
      >
        <div className="flex flex-col gap-2">
          {SECURITY_OWNER_OPTIONS.map((option) => (
            <SelectCard
              key={option}
              title={option}
              selected={securityOwner === option}
              onClick={() => onAnswer("q3.1", option)}
            />
          ))}
        </div>

        {nobodySelected && (
          <InlineInsight
            type="gap"
            title="No Security Ownership"
            description="Without explicit security ownership, accountability for security decisions and incident response is unclear."
          />
        )}

        {/* Follow-up when "Nobody" is selected */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            nobodySelected
              ? "mt-4 max-h-60 opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          <div className="rounded-xl border border-ct-border-subtle bg-ct-surface p-4">
            <p className="mb-4 text-sm leading-relaxed text-ct-text-secondary">
              That&apos;s more common than you&apos;d think at your stage.
              We&apos;ll designate a &ldquo;Security Lead&rdquo; role in your
              policies &mdash; who would be the best fit?
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Input
                value={leadName}
                onChange={(e) =>
                  onAnswer("q3.1_lead_name", e.target.value)
                }
                placeholder="Full name"
                className="max-w-xs border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
              />
              <Input
                type="email"
                value={leadEmail}
                onChange={(e) =>
                  onAnswer("q3.1_lead_email", e.target.value)
                }
                placeholder="Email"
                className="max-w-xs border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
              />
            </div>
          </div>
        </div>
      </QuestionCard>

      {/* ----------------------------------------------------------------- */}
      {/* Q3.2 — Engineer count                                             */}
      {/* ----------------------------------------------------------------- */}
      <QuestionCard
        id="q3.2"
        label="How many engineers do you have?"
        required
      >
        <SegmentSelector
          options={ENGINEER_COUNT_OPTIONS}
          value={engineerCount}
          onChange={(val) => onAnswer("q3.2", val)}
        />
      </QuestionCard>

      {/* ----------------------------------------------------------------- */}
      {/* Q3.3 — Work location                                              */}
      {/* ----------------------------------------------------------------- */}
      <QuestionCard
        id="q3.3"
        label="Where does your team work?"
        required
      >
        <div className="flex flex-col gap-2">
          {WORK_LOCATION_OPTIONS.map((option) => (
            <SelectCard
              key={option.title}
              title={option.title}
              description={option.helper}
              selected={workLocation === option.title}
              onClick={() => onAnswer("q3.3", option.title)}
            />
          ))}
        </div>
      </QuestionCard>

      {/* ----------------------------------------------------------------- */}
      {/* Q3.4 — Contractors                                                */}
      {/* ----------------------------------------------------------------- */}
      <QuestionCard
        id="q3.4"
        label="Do you work with contractors or outsourced teams?"
        required
      >
        <div className="flex gap-2">
          <SelectCard
            title="Yes"
            selected={hasContractors === "Yes"}
            onClick={() => onAnswer("q3.4", "Yes")}
          />
          <SelectCard
            title="No"
            selected={hasContractors === "No"}
            onClick={() => onAnswer("q3.4", "No")}
          />
        </div>

        {/* Follow-up for contractor access */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            hasContractors === "Yes"
              ? "mt-4 max-h-40 opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ct-text-secondary">
              What do contractors have access to?
            </p>
            <ChipMultiSelect
              options={CONTRACTOR_ACCESS_OPTIONS}
              selected={contractorAccess}
              onChange={(val) => onAnswer("q3.4_access", val)}
            />
            {contractorAccess.includes("Customer data") && (
              <InlineInsight
                type="gap"
                title="Contractors Access Customer Data"
                description="Contractors with access to customer data require additional controls, agreements, and monitoring."
              />
            )}
          </div>
        </div>
      </QuestionCard>

      {/* ----------------------------------------------------------------- */}
      {/* Q3.5 — Departments (optional)                                     */}
      {/* ----------------------------------------------------------------- */}
      <QuestionCard
        id="q3.5"
        label="Do you have any of these departments or functions?"
      >
        <ChipMultiSelect
          options={DEPARTMENT_OPTIONS}
          selected={departments}
          onChange={(val) => onAnswer("q3.5", val)}
        />
      </QuestionCard>

      {/* ----------------------------------------------------------------- */}
      {/* Continue button                                                    */}
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
          Continue to Security Posture
          <span aria-hidden="true">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}
