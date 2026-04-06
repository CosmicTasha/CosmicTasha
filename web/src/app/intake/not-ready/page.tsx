"use client";

import { useRouter } from "next/navigation";
import { useIntake } from "../_context/intake-context";
import { ReadinessRing } from "../_components/readiness-ring";
import { clearLocalStorage } from "@/lib/local-storage";
import { checkQualification } from "@/lib/qualification";

const CHECKLIST_ITEMS = [
  "Enforce MFA for all employees",
  "Set up centralized logging (1 year retention)",
  "Create an incident response plan",
  "Implement regular access reviews",
  "Document your change management process",
  "Establish data backup & test restores",
] as const;

export default function NotReadyPage() {
  const router = useRouter();
  const { readinessScore, answers } = useIntake();
  const result = checkQualification(answers, readinessScore);

  function handleStartOver() {
    clearLocalStorage();
    router.push("/intake");
    // Force a full reload so IntakeProvider re-initializes from scratch
    window.location.href = "/intake";
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12">
      {/* Readiness ring — orange tint for low scores */}
      <div className="mb-8">
        <ReadinessRing score={readinessScore} size={140} />
      </div>

      {/* Title */}
      <h1 className="mb-4 text-center text-2xl font-semibold text-ct-text-primary">
        You may want to build some foundations first
      </h1>

      {/* Explanation */}
      {result.reason && (
        <p className="mb-4 text-center text-ct-text-secondary">
          {result.reason}
        </p>
      )}

      {/* Disqualifiers */}
      {result.disqualifiers.length > 0 && (
        <ul className="mb-6 space-y-1.5 text-sm text-ct-text-secondary">
          {result.disqualifiers.map((d) => (
            <li key={d} className="flex items-start gap-2">
              <span className="mt-0.5 text-ct-status-gap-critical">&#x2717;</span>
              {d}
            </li>
          ))}
        </ul>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <ul className="mb-8 space-y-1.5 text-sm text-ct-text-secondary">
          {result.suggestions.map((s) => (
            <li key={s} className="flex items-start gap-2">
              <span className="mt-0.5 text-ct-accent-secondary">&#x26A0;</span>
              {s}
            </li>
          ))}
        </ul>
      )}

      {/* Checklist card */}
      <div className="mb-8 w-full rounded-xl border border-white/[0.08] bg-ct-surface-raised p-6">
        <h2 className="mb-4 text-lg font-medium text-ct-text-primary">
          SOC 2 Readiness Checklist
        </h2>
        <ul className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-ct-text-secondary">
              <input
                type="checkbox"
                disabled={false}
                defaultChecked={false}
                className="h-4 w-4 rounded border-white/20 bg-ct-surface-base accent-ct-accent-primary"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex w-full flex-col items-center gap-3">
        {/* Download PDF — disabled / coming soon */}
        <button
          disabled
          className="w-full rounded-lg bg-ct-accent-primary/40 px-5 py-2.5 text-sm font-medium text-ct-text-primary/50 cursor-not-allowed"
        >
          Download Checklist (PDF) &mdash; Coming Soon
        </button>

        {/* Continue anyway */}
        <button
          onClick={() => router.push("/intake")}
          className="w-full rounded-lg border border-white/[0.08] bg-transparent px-5 py-2.5 text-sm font-medium text-ct-text-secondary transition-colors hover:bg-ct-surface-raised hover:text-ct-text-primary"
        >
          Continue Assessment Anyway &rarr;
        </button>

        {/* Start over */}
        <button
          onClick={handleStartOver}
          className="text-sm text-ct-text-tertiary transition-colors hover:text-ct-text-secondary"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
