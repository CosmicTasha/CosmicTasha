"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useIntake, STAGE_NAMES, TOTAL_STAGES } from "./_context/intake-context";
import { checkQualification } from "@/lib/qualification";
import { track } from "@/lib/analytics";
import { StageHeader } from "./_components/stage-header";
import Stage0 from "./_stages/stage-0";
import Stage1 from "./_stages/stage-1";
import Stage2 from "./_stages/stage-2";
import Stage3 from "./_stages/stage-3";
import Stage4 from "./_stages/stage-4";
import Stage5 from "./_stages/stage-5";
import Stage6 from "./_stages/stage-6";

const STAGE_SUBTITLES: Record<number, string> = {
  0: "Let's get started",
  1: "Tell me about your company",
  2: "Let's map your tech stack",
  3: "Who does what at your company?",
  4: "What security practices do you have today?",
  5: "Let's define your SOC 2 scope",
  6: "What documentation do you already have?",
};

export default function IntakePage() {
  const router = useRouter();
  const { currentStage, answers, setAnswer, completeStage, goToStage, readinessScore, gaps } =
    useIntake();
  const stageName = STAGE_NAMES[currentStage];
  const isLastStage = currentStage === TOTAL_STAGES - 1;

  // Track intake_started once on mount
  const trackedStart = useRef(false);
  useEffect(() => {
    if (!trackedStart.current) {
      trackedStart.current = true;
      track("intake_started");
    }
  }, []);

  function handleContinue() {
    if (isLastStage) {
      track("intake_completed", {
        readinessScore: readinessScore ?? 0,
        gapCount: gaps.length,
      });
      completeStage(currentStage);
      const qualification = checkQualification(answers, readinessScore);
      if (!qualification.qualified) {
        router.push("/intake/not-ready");
      } else {
        router.push("/intake/results");
      }
      return;
    }
    completeStage(currentStage);
  }

  const stageProps = { answers, onAnswer: setAnswer, onContinue: handleContinue };

  function renderStage() {
    switch (currentStage) {
      case 0: return <Stage0 {...stageProps} />;
      case 1: return <Stage1 {...stageProps} />;
      case 2: return <Stage2 {...stageProps} />;
      case 3: return <Stage3 {...stageProps} />;
      case 4: return <Stage4 {...stageProps} />;
      case 5: return <Stage5 {...stageProps} />;
      case 6: return <Stage6 {...stageProps} />;
      default: return null;
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex-1">
        <StageHeader
          title={currentStage === 0 ? "Welcome & Routing" : stageName}
          subtitle={STAGE_SUBTITLES[currentStage] ?? `Complete the ${stageName.toLowerCase()} section to continue.`}
          tipText={currentStage === 0 ? "We'll ask a few quick questions to tailor the assessment to your role and organization. The intake takes about 25-30 minutes. Your readiness score and gap analysis are typically ready within an hour after you finish." : undefined}
        />

        <div key={currentStage} className="animate-in fade-in duration-300">
          {renderStage()}
        </div>
      </div>

      {/* Back button for stages > 0 (stages handle their own Continue button) */}
      {currentStage > 0 && (
        <div className="mt-12">
          <button
            onClick={() => goToStage(currentStage - 1)}
            className="rounded-lg border border-white/[0.08] bg-transparent px-5 py-2.5 text-sm font-medium text-ct-text-secondary transition-colors hover:bg-ct-surface-raised hover:text-ct-text-primary"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
