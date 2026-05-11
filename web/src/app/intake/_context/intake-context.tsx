"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { calculateReadiness, type ReadinessResult } from "@/lib/readiness";
import { detectGaps } from "@/lib/gap-detector";
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  generateLocalSessionId,
} from "@/lib/local-storage";
import { track } from "@/lib/analytics";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Gap {
  dimension: string;
  severity: string;
  title: string;
  type?: "gap" | "strength";
  description?: string;
  id?: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface IntakeState {
  sessionId: string | null;
  currentStage: number;
  answers: Record<string, unknown>;
  stageCompletion: Record<number, "locked" | "current" | "completed">;
  persona: string | null;
  readinessScore: number | null;
  readinessResult: ReadinessResult | null;
  gaps: Gap[];
  saveStatus: SaveStatus;
}

interface IntakeActions {
  setAnswer: (questionId: string, value: unknown) => void;
  completeStage: (stage: number) => void;
  goToStage: (stage: number) => void;
  setPersona: (persona: string) => void;
  updateReadinessScore: (score: number) => void;
}

type IntakeContextValue = IntakeState & IntakeActions;

/* ------------------------------------------------------------------ */
/*  Stages                                                             */
/* ------------------------------------------------------------------ */

export const STAGE_NAMES: Record<number, string> = {
  0: "Welcome & Routing",
  1: "Company Profile",
  2: "Technical Environment",
  3: "Organizational Structure",
  4: "Security Posture",
  5: "Scope & Trust Services",
  6: "Policy & Documentation",
};

export const TOTAL_STAGES = 7;

/* ------------------------------------------------------------------ */
/*  Initial state                                                      */
/* ------------------------------------------------------------------ */

function buildInitialCompletion(): Record<
  number,
  "locked" | "current" | "completed"
> {
  const map: Record<number, "locked" | "current" | "completed"> = {};
  for (let i = 0; i < TOTAL_STAGES; i++) {
    map[i] = i === 0 ? "current" : "locked";
  }
  return map;
}

const initialState: IntakeState = {
  sessionId: null,
  currentStage: 0,
  answers: {},
  stageCompletion: buildInitialCompletion(),
  persona: null,
  readinessScore: null,
  readinessResult: null,
  gaps: [],
  saveStatus: "idle",
};

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const IntakeContext = createContext<IntakeContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Persistence helpers                                                */
/* ------------------------------------------------------------------ */

async function ensureSession(
  setState: React.Dispatch<React.SetStateAction<IntakeState>>,
  stateRef: React.MutableRefObject<IntakeState>,
): Promise<string> {
  if (stateRef.current.sessionId) return stateRef.current.sessionId;

  try {
    const res = await fetch("/api/intake/session", { method: "POST" });
    if (!res.ok) throw new Error("Failed to create session");
    const { id } = await res.json();
    setState((prev) => ({ ...prev, sessionId: id }));
    stateRef.current = { ...stateRef.current, sessionId: id };
    return id;
  } catch {
    // API unavailable — generate a local session ID
    const id = generateLocalSessionId();
    setState((prev) => ({ ...prev, sessionId: id }));
    stateRef.current = { ...stateRef.current, sessionId: id };
    return id;
  }
}

async function persistAnswer(
  sessionId: string,
  questionId: string,
  stage: number,
  value: unknown,
): Promise<void> {
  const res = await fetch("/api/intake/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, questionId, stage, value }),
  });
  if (!res.ok) throw new Error("Failed to save answer");
}

async function persistProgress(
  sessionId: string,
  stage: number,
  readinessScore: number | null,
  persona: string | null,
): Promise<void> {
  const body: Record<string, unknown> = { sessionId, stage };
  if (readinessScore !== null) body.readinessScore = readinessScore;
  if (persona !== null) body.persona = persona;

  const res = await fetch("/api/intake/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to save progress");
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

/** Snapshot current state to localStorage. */
function snapshotToLocalStorage(s: IntakeState): void {
  saveToLocalStorage({
    sessionId: s.sessionId ?? generateLocalSessionId(),
    answers: s.answers,
    currentStage: s.currentStage,
    persona: s.persona,
    readinessScore: s.readinessScore,
    stageCompletion: s.stageCompletion as Record<number, string>,
    lastActivityAt: new Date().toISOString(),
  });
}

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<IntakeState>(() => {
    // Try to restore from localStorage on first render (SSR-safe)
    if (typeof window === "undefined") return initialState;
    const stored = loadFromLocalStorage();
    if (!stored || stored.currentStage === 0) return initialState;
    // Rebuild completion map with proper typing
    const completion: Record<number, "locked" | "current" | "completed"> = {};
    for (let i = 0; i < TOTAL_STAGES; i++) {
      const raw = stored.stageCompletion[i];
      if (raw === "completed" || raw === "current" || raw === "locked") {
        completion[i] = raw;
      } else {
        completion[i] = i === 0 ? "current" : "locked";
      }
    }
    return {
      ...initialState,
      sessionId: stored.sessionId,
      answers: stored.answers,
      currentStage: stored.currentStage,
      stageCompletion: completion,
      persona: stored.persona,
      readinessScore: stored.readinessScore,
    };
  });
  const stateRef = useRef(state);

  // Keep ref in sync so async helpers see latest state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Pending answer queue for debounced saves
  const pendingRef = useRef<
    Map<string, { questionId: string; stage: number; value: unknown }>
  >(new Map());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flush pending answers to the API
  const flushPending = useCallback(async () => {
    const entries = Array.from(pendingRef.current.entries());
    if (entries.length === 0) return;

    // Track answered questions when the debounced flush fires (not per keystroke)
    for (const [, { questionId }] of entries) {
      track("question_answered", { questionId });
    }

    pendingRef.current.clear();

    setState((prev) => ({ ...prev, saveStatus: "saving" }));
    try {
      const sessionId = await ensureSession(setState, stateRef);
      await Promise.all(
        entries.map(([, { questionId, stage, value }]) =>
          persistAnswer(sessionId, questionId, stage, value),
        ),
      );
      setState((prev) => ({ ...prev, saveStatus: "saved" }));
    } catch (error: unknown) {
      console.warn("Failed to persist answers, falling back to localStorage:", error);
      // Fall back to localStorage — still mark as saved so the user sees success
      snapshotToLocalStorage(stateRef.current);
      setState((prev) => ({ ...prev, saveStatus: "saved" }));
    }
  }, []);

  // Schedule a debounced flush
  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void flushPending();
    }, 500);
  }, [flushPending]);

  const setAnswer = useCallback(
    (questionId: string, value: unknown) => {
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [questionId]: value },
      }));
      // Queue for debounced persistence
      pendingRef.current.set(questionId, {
        questionId,
        stage: stateRef.current.currentStage,
        value,
      });
      scheduleSave();
    },
    [scheduleSave],
  );

  const completeStage = useCallback(
    (stage: number) => {
      setState((prev) => {
        const next = stage + 1;
        const completion = {
          ...prev.stageCompletion,
          [stage]: "completed" as const,
        };
        if (next < TOTAL_STAGES && completion[next] === "locked") {
          completion[next] = "current";
        }
        return {
          ...prev,
          stageCompletion: completion,
          currentStage: next < TOTAL_STAGES ? next : prev.currentStage,
        };
      });

      // Analytics — fire-and-forget
      track("stage_completed", {
        stage,
        readinessScore: stateRef.current.readinessScore ?? 0,
      });

      // Persist progress — fire-and-forget with error logging
      void (async () => {
        try {
          // Flush any pending answers first so stage progress is consistent
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          await flushPending();

          const sessionId = await ensureSession(setState, stateRef);
          const nextStage = stage + 1 < TOTAL_STAGES ? stage + 1 : stage;
          await persistProgress(
            sessionId,
            nextStage,
            stateRef.current.readinessScore,
            stateRef.current.persona,
          );
        } catch (error: unknown) {
          console.warn("Failed to persist progress, falling back to localStorage:", error);
          snapshotToLocalStorage(stateRef.current);
        }
      })();
    },
    [flushPending],
  );

  const goToStage = useCallback((stage: number) => {
    setState((prev) => {
      if (prev.stageCompletion[stage] === "locked") return prev;
      return { ...prev, currentStage: stage };
    });
  }, []);

  const setPersona = useCallback((persona: string) => {
    setState((prev) => ({ ...prev, persona }));
  }, []);

  const updateReadinessScore = useCallback((score: number) => {
    setState((prev) => ({ ...prev, readinessScore: score }));
  }, []);

  // Recalculate readiness score and detect gaps whenever answers change.
  // TODO: derive readinessResult/gaps in render via useMemo and drop them
  // from state — that's the React 19 idiom for derived state.
  useEffect(() => {
    const result = calculateReadiness(state.answers);
    const detected = detectGaps(state.answers);
    const mappedGaps: Gap[] = detected.map((g) => ({
      dimension: g.dimension,
      severity: g.severity,
      title: g.title,
      type: g.type,
      description: g.description,
      id: g.id,
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((prev) => ({
      ...prev,
      readinessScore: result.overall,
      readinessResult: result,
      gaps: mappedGaps,
    }));
  }, [state.answers]);

  // Debounced localStorage backup whenever answers or currentStage change
  const lsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (lsTimerRef.current) clearTimeout(lsTimerRef.current);
    lsTimerRef.current = setTimeout(() => {
      snapshotToLocalStorage(stateRef.current);
    }, 1000);
    return () => {
      if (lsTimerRef.current) clearTimeout(lsTimerRef.current);
    };
  }, [state.answers, state.currentStage]);

  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      void flushPending();
    };
  }, [flushPending]);

  const value = useMemo<IntakeContextValue>(
    () => ({
      ...state,
      setAnswer,
      completeStage,
      goToStage,
      setPersona,
      updateReadinessScore,
    }),
    [state, setAnswer, completeStage, goToStage, setPersona, updateReadinessScore],
  );

  return (
    <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>
  );
}

export function useIntake(): IntakeContextValue {
  const ctx = useContext(IntakeContext);
  if (!ctx) {
    throw new Error("useIntake must be used within an IntakeProvider");
  }
  return ctx;
}
