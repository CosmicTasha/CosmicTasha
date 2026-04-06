"use client";

import * as React from "react";
import {
  Building2,
  ShieldCheck,
  Users,
  Compass,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionCard } from "../_components/question-card";
import { SelectCard } from "../_components/select-card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Stage0Props {
  answers: Record<string, unknown>;
  onAnswer: (questionId: string, value: unknown) => void;
  onContinue?: () => void;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ROLE_OPTIONS = [
  {
    id: "founder",
    title: "Founder / CEO",
    description: "I'm leading our compliance effort",
    icon: <Building2 className="size-5" />,
  },
  {
    id: "engineering",
    title: "Engineering / Security",
    description: "I was asked to handle SOC 2",
    icon: <ShieldCheck className="size-5" />,
  },
  {
    id: "consultant",
    title: "Compliance Consultant",
    description: "Working with a client",
    icon: <Users className="size-5" />,
  },
  {
    id: "exploring",
    title: "Just Exploring",
    description: "Not sure if we need SOC 2 yet",
    icon: <Compass className="size-5" />,
  },
] as const;

const EXPERIENCE_OPTIONS = [
  { id: "first-time", label: "No, first time" },
  { id: "renewing", label: "Yes, renewing" },
  { id: "switching", label: "Switching tools" },
] as const;

const TIMELINE_OPTIONS = [
  {
    id: "customer-requires",
    title: "A customer or prospect requires it",
    hasDeadline: true,
  },
  {
    id: "fundraising",
    title: "Fundraising \u2014 investors want to see compliance",
    hasDeadline: false,
  },
  {
    id: "legal",
    title: "Legal or insurance requirement",
    hasDeadline: false,
  },
  {
    id: "proactive",
    title: "Being proactive \u2014 no immediate deadline",
    hasDeadline: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Stage0({ answers, onAnswer, onContinue }: Stage0Props) {
  const role = answers["q0.1"] as string | undefined;
  const experience = answers["q0.2"] as string | undefined;
  const timeline = answers["q0.3"] as string | undefined;
  const deadline = answers["q0.3.deadline"] as string | undefined;

  const allAnswered = Boolean(role && experience && timeline);

  const selectedTimelineOption = TIMELINE_OPTIONS.find(
    (o) => o.id === timeline
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Q0.1 — Role */}
      <QuestionCard id="q0.1" label="Who are you?">
        <div className="grid grid-cols-2 gap-3 max-w-[400px]">
          {ROLE_OPTIONS.map((option) => (
            <SelectCard
              key={option.id}
              icon={option.icon}
              title={option.title}
              description={option.description}
              selected={role === option.id}
              onClick={() => onAnswer("q0.1", option.id)}
              className="w-full"
            />
          ))}
        </div>
      </QuestionCard>

      {/* Q0.2 — Experience (shown after Q0.1 is answered) */}
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          role
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {role && (
          <QuestionCard
            id="q0.2"
            label="Have you been through a SOC 2 audit before?"
          >
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map((option) => {
                const isSelected = experience === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onAnswer("q0.2", option.id)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
                      isSelected
                        ? "border-ct-accent bg-ct-accent/15 text-ct-accent"
                        : "border-ct-border-subtle bg-ct-surface text-ct-text-secondary hover:border-ct-border-default hover:text-ct-text-primary"
                    )}
                    aria-pressed={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </QuestionCard>
        )}
      </div>

      {/* Q0.3 — Timeline (shown after Q0.2 is answered) */}
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          experience
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {experience && (
          <QuestionCard
            id="q0.3"
            label="What's driving your timeline?"
          >
            <div className="flex flex-col gap-3 max-w-lg">
              {TIMELINE_OPTIONS.map((option) => {
                const isSelected = timeline === option.id;
                return (
                  <div key={option.id} className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onAnswer("q0.3", option.id)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200",
                        "bg-ct-surface hover:bg-ct-surface-raised",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
                        isSelected
                          ? "border-ct-accent shadow-[0_0_0_1px_var(--ct-accent)]"
                          : "border-ct-border-subtle hover:border-ct-border-default"
                      )}
                      aria-pressed={isSelected}
                    >
                      <span
                        className={cn(
                          "transition-colors duration-200",
                          isSelected
                            ? "text-ct-text-primary"
                            : "text-ct-text-secondary"
                        )}
                      >
                        {option.title}
                      </span>
                    </button>

                    {/* Deadline follow-up for "customer requires" */}
                    {isSelected && option.hasDeadline && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-300 ml-4 flex items-center gap-3">
                        <CalendarDays className="size-4 shrink-0 text-ct-text-secondary" />
                        <label className="text-sm text-ct-text-secondary whitespace-nowrap">
                          Do they have a deadline?
                        </label>
                        <Input
                          type="date"
                          value={deadline ?? ""}
                          onChange={(e) =>
                            onAnswer("q0.3.deadline", e.target.value)
                          }
                          className="max-w-[180px] border-ct-border-subtle bg-ct-surface text-ct-text-primary"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </QuestionCard>
        )}
      </div>

      {/* Continue button */}
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          allAnswered
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {allAnswered && (
          <Button
            onClick={onContinue}
            className="h-10 gap-2 rounded-xl bg-ct-accent px-6 text-sm font-medium text-white hover:bg-ct-accent/90"
          >
            Continue to Company Profile
            <span aria-hidden="true">&rarr;</span>
          </Button>
        )}
      </div>
    </div>
  );
}
