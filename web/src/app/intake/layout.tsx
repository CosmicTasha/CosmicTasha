"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { IntakeProvider, STAGE_NAMES, TOTAL_STAGES, useIntake } from "./_context/intake-context";
import type { SaveStatus } from "./_context/intake-context";
import { ReadinessRing } from "./_components/readiness-ring";
import { SaveProgress } from "./_components/save-progress";
import { InviteModal } from "./_components/invite-modal";
import { DevTierSwitcher } from "./_components/dev-tier-switcher";

/* ------------------------------------------------------------------ */
/*  Sidebar stage item                                                 */
/* ------------------------------------------------------------------ */

function StageItem({ stage }: { stage: number }) {
  const { currentStage, stageCompletion, goToStage } = useIntake();
  const status = stageCompletion[stage];
  const isCurrent = currentStage === stage;
  const isLocked = status === "locked";
  const isCompleted = status === "completed";

  const handleClick = useCallback(() => {
    if (!isLocked) goToStage(stage);
  }, [isLocked, goToStage, stage]);

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        isCurrent
          ? "bg-ct-surface-raised text-ct-text-primary"
          : isLocked
            ? "cursor-not-allowed text-ct-text-tertiary"
            : "text-ct-text-secondary hover:bg-ct-surface-raised hover:text-ct-text-primary"
      }`}
    >
      {/* Status icon */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-ct-status-strength" />
        ) : isLocked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight
            className={`h-3.5 w-3.5 ${isCurrent ? "text-ct-accent" : ""}`}
          />
        )}
      </span>

      {/* Label */}
      <span className="flex-1 truncate">
        <span className="text-ct-text-tertiary mr-1.5 text-xs">
          {stage}.
        </span>
        {STAGE_NAMES[stage]}
      </span>

      {/* Mini progress indicator for current */}
      {isCurrent && (
        <span className="h-1.5 w-1.5 rounded-full bg-ct-accent" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Left sidebar                                                       */
/* ------------------------------------------------------------------ */

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 px-5 text-xs text-ct-text-tertiary">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle2 className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertTriangle className="h-3 w-3" />
          <span>Save failed</span>
        </>
      )}
    </div>
  );
}

function LeftSidebar() {
  const { readinessScore, currentStage, saveStatus } = useIntake();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[280px] flex-col border-r border-white/[0.06] bg-ct-surface">
      {/* Wordmark */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-lg font-bold tracking-tight text-ct-accent">
          CosmicTasha
        </h2>
        <p className="mt-0.5 text-xs text-ct-text-tertiary">
          SOC 2 Intake Assessment
        </p>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* Overall progress */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between text-xs text-ct-text-tertiary">
          <span>Progress</span>
          <span>
            Stage {currentStage + 1} / {TOTAL_STAGES}
          </span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ct-surface-raised">
          <div
            className="h-full rounded-full bg-ct-accent transition-all duration-500 ease-out"
            style={{
              width: `${((currentStage) / (TOTAL_STAGES - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* Stage list */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {Array.from({ length: TOTAL_STAGES }, (_, i) => (
          <StageItem key={i} stage={i} />
        ))}
      </nav>

      {/* Invite teammate button */}
      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ct-text-secondary transition-colors hover:bg-ct-surface-raised hover:text-ct-text-primary"
        >
          <Users className="h-4 w-4" />
          Invite Teammate
        </button>
      </div>

      {/* Invite modal */}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        currentStage={currentStage}
        stageName={STAGE_NAMES[currentStage] ?? `Stage ${currentStage}`}
      />

      {/* Save progress (shown for unauthenticated users) */}
      <div className="px-3 pt-2">
        <SaveProgress />
      </div>

      <Separator className="mt-3 bg-white/[0.06]" />

      {/* Save status indicator */}
      <SaveStatusIndicator status={saveStatus} />

      {/* Bottom section */}
      <div className="flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-ct-text-secondary transition-colors hover:text-ct-text-primary"
        >
          <LogOut className="h-4 w-4" />
          Save & Exit
        </Link>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ReadinessRing score={readinessScore} size={44} />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-ct-surface-raised text-ct-text-primary border border-white/[0.06]"
            >
              <p className="text-xs">
                {readinessScore !== null
                  ? `Readiness: ${readinessScore}%`
                  : "Readiness score — available after Stage 1"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Right sidebar (readiness insights)                                 */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Severity helpers                                                   */
/* ------------------------------------------------------------------ */

const SEVERITY_ORDER: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };

const SEVERITY_BORDER: Record<string, string> = {
  p0: "border-l-[#F97316]",
  p1: "border-l-[#F5A623]",
  p2: "border-l-[#60A5FA]",
  p3: "border-l-gray-500",
};

const SEVERITY_LABEL: Record<string, string> = {
  p0: "P0 Critical",
  p1: "P1 High",
  p2: "P2 Medium",
  p3: "P3 Low",
};

function dimensionLabel(dim: string): string {
  return dim
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ------------------------------------------------------------------ */
/*  Right sidebar (readiness insights)                                 */
/* ------------------------------------------------------------------ */

function RightSidebar() {
  const { currentStage, gaps, readinessScore } = useIntake();

  if (currentStage < 1) return null;

  const strengths = gaps.filter((g) => g.type === "strength");
  const gapItems = gaps
    .filter((g) => g.type === "gap" || !g.type)
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));

  const totalGaps = gapItems.length;
  const totalStrengths = strengths.length;
  const hasDetections = totalGaps > 0 || totalStrengths > 0;

  return (
    <aside className="fixed right-0 top-0 z-30 hidden h-screen w-[300px] flex-col border-l border-white/[0.06] bg-ct-surface xl:flex">
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-sm font-semibold text-ct-text-primary">
          Readiness Insights
        </h3>
        <p className="mt-0.5 text-xs text-ct-text-tertiary">
          Live analysis of your responses
        </p>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* Readiness ring */}
      <div className="flex justify-center py-6">
        <ReadinessRing score={readinessScore} size={120} />
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* Insights list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!hasDetections ? (
          <p className="text-center text-xs text-ct-text-tertiary">
            Insights will appear as you answer questions
          </p>
        ) : (
          <>
            {/* Summary line */}
            <p className="mb-3 text-xs text-ct-text-tertiary">
              {totalGaps > 0 && (
                <span>
                  <AlertTriangle className="mr-1 inline h-3 w-3 text-[#F5A623]" />
                  {totalGaps} gap{totalGaps !== 1 ? "s" : ""} identified
                </span>
              )}
              {totalGaps > 0 && totalStrengths > 0 && <span className="mx-1.5">&middot;</span>}
              {totalStrengths > 0 && (
                <span>
                  <ShieldCheck className="mr-1 inline h-3 w-3 text-[#34D399]" />
                  {totalStrengths} strength{totalStrengths !== 1 ? "s" : ""}
                </span>
              )}
            </p>

            {/* Strengths first */}
            {strengths.map((s) => (
              <div
                key={s.id ?? s.title}
                className="animate-in fade-in duration-300 mb-2 rounded-md border-l-[3px] border-l-[#34D399] bg-[#34D399]/[0.06] px-3 py-2"
              >
                <p className="flex items-center gap-1.5 text-xs font-medium text-ct-text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#34D399]" />
                  {s.title}
                </p>
                {s.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-ct-text-secondary">
                    {s.description}
                  </p>
                )}
                <span className="mt-1.5 inline-block rounded-full bg-[#34D399]/10 px-2 py-0.5 text-[10px] text-[#34D399]">
                  {dimensionLabel(s.dimension)}
                </span>
              </div>
            ))}

            {/* Gaps sorted by severity */}
            {gapItems.map((g) => (
              <div
                key={g.id ?? g.title}
                className={`animate-in fade-in duration-300 mb-2 rounded-md border-l-[3px] bg-ct-surface-raised px-3 py-2 ${
                  SEVERITY_BORDER[g.severity] ?? "border-l-gray-500"
                }`}
              >
                <p className="text-xs font-medium text-ct-text-primary">
                  {g.title}
                </p>
                {g.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-ct-text-secondary">
                    {g.description}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-block rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ct-text-tertiary">
                    {dimensionLabel(g.dimension)}
                  </span>
                  <span className="text-[10px] text-ct-text-tertiary">
                    {SEVERITY_LABEL[g.severity] ?? g.severity}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Layout shell                                                       */
/* ------------------------------------------------------------------ */

function IntakeShell({ children }: { children: React.ReactNode }) {
  const { currentStage } = useIntake();
  const showRight = currentStage >= 1;

  return (
    <div className="min-h-screen bg-ct-base">
      <LeftSidebar />
      <RightSidebar />

      <main
        className={`ml-[280px] min-h-screen transition-[margin] duration-300 ${
          showRight ? "xl:mr-[300px]" : ""
        }`}
      >
        <div className="mx-auto max-w-[720px] px-8 py-12">{children}</div>
      </main>

      <DevTierSwitcher />
    </div>
  );
}

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isResumePage = pathname === "/intake/resume";

  // The resume page renders full-screen centered — skip the shell
  if (isResumePage) {
    return <>{children}</>;
  }

  return (
    <IntakeProvider>
      <IntakeShell>{children}</IntakeShell>
    </IntakeProvider>
  );
}
