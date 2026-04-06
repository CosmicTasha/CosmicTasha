"use client";

import { useMemo } from "react";
import { detectGaps, type DetectedGap } from "@/lib/gap-detector";

export function useInsights(
  answers: Record<string, unknown>,
  questionIds: string[]
): DetectedGap[] {
  return useMemo(() => {
    const allGaps = detectGaps(answers);
    return allGaps.filter((g) => questionIds.includes(g.sourceQuestion));
  }, [answers, questionIds]);
}
