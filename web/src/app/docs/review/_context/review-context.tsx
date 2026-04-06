"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ReviewDocument, ReviewSection, ReviewState } from "@/lib/review/types";
import { MOCK_DOCUMENTS } from "@/lib/review/mock-data";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ReviewStats {
  totalApproved: number;
  totalPending: number;
  totalFlagged: number;
}

interface ReviewContextValue extends ReviewStats {
  documents: ReviewDocument[];
  currentDoc: ReviewDocument | null;
  currentSection: ReviewSection | null;
  selectDocument: (id: string) => void;
  selectSection: (id: string) => void;
  approveSection: (docId: string, sectionId: string) => void;
  flagSection: (docId: string, sectionId: string, comment: string) => void;
  requestChanges: (docId: string, sectionId: string, comment: string) => void;
  approveDocument: (docId: string) => void;
  approveAllUnflagged: (docId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ReviewContext = createContext<ReviewContextValue | null>(null);

const STORAGE_KEY = "cosmictasha_review";

function persistState(state: ReviewState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_e: unknown) {
    /* quota exceeded — ignore */
  }
}

function loadState(): ReviewState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReviewState;
  } catch (_e: unknown) {
    return null;
  }
}

function recomputeDocMeta(doc: ReviewDocument): ReviewDocument {
  const approvedSections = doc.sections.filter((s) => s.status === "approved").length;
  const reviewFlags = doc.sections.filter(
    (s) => s.status === "flagged" || s.status === "changes_requested"
  ).length;

  let status: ReviewDocument["status"] = "pending";
  if (approvedSections === doc.sections.length) {
    status = "approved";
  } else if (reviewFlags > 0) {
    status = "changes_requested";
  } else if (approvedSections > 0) {
    status = "in_review";
  }

  return {
    ...doc,
    approvedSections,
    totalSections: doc.sections.length,
    reviewFlags,
    status,
  };
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReviewState>(() => {
    const persisted = loadState();
    if (persisted) return persisted;

    return {
      documents: MOCK_DOCUMENTS,
      currentDocId: MOCK_DOCUMENTS[0]?.id ?? null,
      currentSectionId: MOCK_DOCUMENTS[0]?.sections[0]?.id ?? null,
    };
  });

  // Persist on every state change
  useEffect(() => {
    persistState(state);
  }, [state]);

  /* ---- Selectors ---- */

  const currentDoc = useMemo(
    () => state.documents.find((d) => d.id === state.currentDocId) ?? null,
    [state.documents, state.currentDocId]
  );

  const currentSection = useMemo(() => {
    if (!currentDoc) return null;
    return currentDoc.sections.find((s) => s.id === state.currentSectionId) ?? null;
  }, [currentDoc, state.currentSectionId]);

  /* ---- Stats ---- */

  const stats = useMemo<ReviewStats>(() => {
    let totalApproved = 0;
    let totalPending = 0;
    let totalFlagged = 0;

    for (const doc of state.documents) {
      for (const section of doc.sections) {
        if (section.status === "approved") totalApproved++;
        else if (section.status === "flagged" || section.status === "changes_requested")
          totalFlagged++;
        else totalPending++;
      }
    }

    return { totalApproved, totalPending, totalFlagged };
  }, [state.documents]);

  /* ---- Actions ---- */

  const selectDocument = useCallback((id: string) => {
    setState((prev) => {
      const doc = prev.documents.find((d) => d.id === id);
      return {
        ...prev,
        currentDocId: id,
        currentSectionId: doc?.sections[0]?.id ?? null,
      };
    });
  }, []);

  const selectSection = useCallback((id: string) => {
    setState((prev) => ({ ...prev, currentSectionId: id }));
  }, []);

  const updateSection = useCallback(
    (
      docId: string,
      sectionId: string,
      updater: (s: ReviewSection) => ReviewSection
    ) => {
      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((doc) => {
          if (doc.id !== docId) return doc;
          const updated = {
            ...doc,
            sections: doc.sections.map((s) =>
              s.id === sectionId ? updater(s) : s
            ),
          };
          return recomputeDocMeta(updated);
        }),
      }));
    },
    []
  );

  const approveSection = useCallback(
    (docId: string, sectionId: string) => {
      updateSection(docId, sectionId, (s) => ({
        ...s,
        status: "approved",
        customerComment: undefined,
      }));
    },
    [updateSection]
  );

  const flagSection = useCallback(
    (docId: string, sectionId: string, comment: string) => {
      updateSection(docId, sectionId, (s) => ({
        ...s,
        status: "flagged",
        customerComment: comment,
      }));
    },
    [updateSection]
  );

  const requestChanges = useCallback(
    (docId: string, sectionId: string, comment: string) => {
      updateSection(docId, sectionId, (s) => ({
        ...s,
        status: "changes_requested",
        customerComment: comment,
      }));
    },
    [updateSection]
  );

  const approveDocument = useCallback((docId: string) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) => {
        if (doc.id !== docId) return doc;
        const updated = {
          ...doc,
          sections: doc.sections.map((s) => ({
            ...s,
            status: "approved" as const,
            customerComment: undefined,
          })),
        };
        return recomputeDocMeta(updated);
      }),
    }));
  }, []);

  const approveAllUnflagged = useCallback((docId: string) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) => {
        if (doc.id !== docId) return doc;
        const updated = {
          ...doc,
          sections: doc.sections.map((s) => {
            if (s.hasReviewTag || s.status === "flagged" || s.status === "changes_requested") {
              return s;
            }
            return { ...s, status: "approved" as const };
          }),
        };
        return recomputeDocMeta(updated);
      }),
    }));
  }, []);

  /* ---- Value ---- */

  const value = useMemo<ReviewContextValue>(
    () => ({
      documents: state.documents,
      currentDoc,
      currentSection,
      selectDocument,
      selectSection,
      approveSection,
      flagSection,
      requestChanges,
      approveDocument,
      approveAllUnflagged,
      ...stats,
    }),
    [
      state.documents,
      currentDoc,
      currentSection,
      selectDocument,
      selectSection,
      approveSection,
      flagSection,
      requestChanges,
      approveDocument,
      approveAllUnflagged,
      stats,
    ]
  );

  return (
    <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
  );
}

export function useReview(): ReviewContextValue {
  const ctx = useContext(ReviewContext);
  if (!ctx) {
    throw new Error("useReview must be used within a ReviewProvider");
  }
  return ctx;
}
