/* ------------------------------------------------------------------ */
/*  Review Gate — Domain Types                                         */
/* ------------------------------------------------------------------ */

export interface ReviewState {
  documents: ReviewDocument[];
  currentDocId: string | null;
  currentSectionId: string | null;
}

export interface ReviewDocument {
  id: string;
  name: string;
  priority: number;
  sections: ReviewSection[];
  status: "pending" | "in_review" | "approved" | "changes_requested";
  approvedSections: number;
  totalSections: number;
  reviewFlags: number;
}

export interface ReviewSection {
  id: string;
  title: string;
  content: string; // Markdown
  status: "pending" | "approved" | "flagged" | "changes_requested";
  hasReviewTag: boolean;
  reviewNote?: string;
  customerComment?: string;
  tscCriteria?: string[];
  auditorExpectation?: string;
}

export interface ComplianceContext {
  criteria: { code: string; text: string }[];
  auditorExpectation: string;
  evidenceExamples: string[];
}

/** Coaching prompts shown for [REVIEW] tagged sections */
export interface CoachingPrompt {
  question: string;
  specificQuestions: string[];
}

/** Map of section types to coaching prompts */
export const COACHING_PROMPTS: Record<string, CoachingPrompt> = {
  "incident-classification": {
    question: "What would an auditor ask about this section?",
    specificQuestions: [
      "How do you differentiate between a P0 and P1 incident?",
      "Can you provide an example of each severity level from your operations?",
      "What criteria trigger an automatic escalation?",
    ],
  },
  "response-procedures": {
    question: "What would an auditor ask about this section?",
    specificQuestions: [
      "Walk me through what happens in the first 15 minutes after a P0 incident.",
      "Who has authority to declare an incident?",
      "How do you ensure the on-call engineer acknowledges within the SLA?",
    ],
  },
  "communication-plan": {
    question: "What would an auditor ask about this section?",
    specificQuestions: [
      "How do you notify affected customers?",
      "What's your SLA for breach notification?",
      "How do you document the communication timeline for auditors?",
    ],
  },
  "access-control": {
    question: "What would an auditor ask about this section?",
    specificQuestions: [
      "How frequently do you review access permissions?",
      "What is your process for revoking access on termination?",
      "How do you handle emergency access grants?",
    ],
  },
  "change-management": {
    question: "What would an auditor ask about this section?",
    specificQuestions: [
      "How do you ensure all production changes are reviewed before deployment?",
      "What is your rollback procedure if a change causes an incident?",
      "How do you track which changes were deployed and by whom?",
    ],
  },
  "risk-assessment": {
    question: "What would an auditor ask about this section?",
    specificQuestions: [
      "How often do you reassess your risk register?",
      "What methodology do you use to score risks?",
      "How do you track risk mitigation progress?",
    ],
  },
};
