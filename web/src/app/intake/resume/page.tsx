"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { loadFromLocalStorage, type StoredState } from "@/lib/local-storage";
import { ReadinessRing } from "../_components/readiness-ring";

/* ------------------------------------------------------------------ */
/*  Stage definitions (mirrored from intake-context)                   */
/* ------------------------------------------------------------------ */

const STAGE_NAMES: Record<number, string> = {
  0: "Welcome & Routing",
  1: "Company Profile",
  2: "Technical Environment",
  3: "Organizational Structure",
  4: "Security Posture",
  5: "Scope & Trust Services",
  6: "Policy & Documentation",
};

const TOTAL_STAGES = 7;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatRelativeTime(isoString: string): string {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;

  return new Date(isoString).toLocaleDateString();
}

/* ------------------------------------------------------------------ */
/*  Resume page                                                        */
/* ------------------------------------------------------------------ */

export default function ResumePage() {
  const router = useRouter();
  const [saved, setSaved] = useState<StoredState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = loadFromLocalStorage();
    if (!data) {
      router.replace("/intake");
      return;
    }
    // Initial localStorage read on mount — must be deferred to avoid SSR mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(data);
    setLoading(false);
  }, [router]);

  if (loading || !saved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ct-base">
        <p className="text-sm text-ct-text-tertiary">Loading...</p>
      </div>
    );
  }

  const companyName =
    (saved.answers?.["company_name"] as string) || "Your Assessment";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ct-base px-4">
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <h1 className="text-center text-2xl font-bold tracking-tight text-ct-accent">
          CosmicTasha
        </h1>

        {/* Welcome */}
        <h2 className="mt-6 text-center text-xl font-semibold text-ct-text-primary">
          Welcome back
        </h2>
        <p className="mt-1 text-center text-sm text-ct-text-secondary">
          {companyName}
        </p>

        {/* Progress card */}
        <div className="mt-8 rounded-xl border border-white/[0.08] bg-ct-surface p-6">
          {/* Readiness ring */}
          <div className="flex justify-center">
            <ReadinessRing score={saved.readinessScore} size={100} />
          </div>

          {/* Stage completion list */}
          <div className="mt-6 space-y-2">
            {Array.from({ length: TOTAL_STAGES }, (_, i) => {
              const status = saved.stageCompletion[i] ?? "locked";
              const isCompleted = status === "completed";

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md px-3 py-1.5"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-ct-status-strength" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-ct-text-tertiary/30" />
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      isCompleted
                        ? "text-ct-text-primary"
                        : "text-ct-text-tertiary"
                    }`}
                  >
                    <span className="mr-1.5 text-xs text-ct-text-tertiary">
                      {i}.
                    </span>
                    {STAGE_NAMES[i]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Last activity */}
          {saved.lastActivityAt && (
            <p className="mt-4 text-center text-xs text-ct-text-tertiary">
              Last activity: {formatRelativeTime(saved.lastActivityAt)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            href="/intake"
            className="inline-flex w-full items-center justify-center rounded-lg bg-ct-accent px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Continue Where You Left Off &rarr;
          </Link>

          <Link
            href="/intake"
            onClick={() => {
              // Clear saved state so intake starts fresh
              try {
                localStorage.removeItem("cosmictasha_intake");
              } catch {
                /* ignore */
              }
            }}
            className="text-sm text-ct-text-secondary transition-colors hover:text-ct-text-primary"
          >
            Start a New Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
