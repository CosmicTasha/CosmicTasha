// ---------------------------------------------------------------------------
// Sanitization state management
// All state lives in React component memory — NEVER persisted unsanitized.
// ---------------------------------------------------------------------------

import type { ScanResult } from './scanner';

export type DecisionType = 'accept' | 'edit' | 'skip';

export interface SanitizationDecision {
  resultId: string;
  action: DecisionType;
  customRedaction?: string;
  timestamp: number;
}

export interface SanitizationState {
  originalText: string;
  filename?: string;
  results: ScanResult[];
  decisions: Map<string, DecisionType>;
  customRedactions: Map<string, string>;
  auditTrail: SanitizationDecision[];
}

export function createInitialState(
  text: string,
  results: ScanResult[],
  filename?: string,
): SanitizationState {
  return {
    originalText: text,
    filename,
    results,
    decisions: new Map(),
    customRedactions: new Map(),
    auditTrail: [],
  };
}

export function recordDecision(
  state: SanitizationState,
  resultId: string,
  action: DecisionType,
  customRedaction?: string,
): SanitizationState {
  const decisions = new Map(state.decisions);
  const customRedactions = new Map(state.customRedactions);

  decisions.set(resultId, action);

  if (action === 'edit' && customRedaction) {
    customRedactions.set(resultId, customRedaction);
  } else {
    customRedactions.delete(resultId);
  }

  const decision: SanitizationDecision = {
    resultId,
    action,
    customRedaction,
    timestamp: Date.now(),
  };

  return {
    ...state,
    decisions,
    customRedactions,
    auditTrail: [...state.auditTrail, decision],
  };
}

/**
 * Apply all accepted/edited redactions to the original text.
 * Sorts by position descending to avoid offset drift.
 */
export function applySanitization(state: SanitizationState): string {
  const toApply = state.results
    .filter((r) => {
      const decision = state.decisions.get(r.id);
      return decision === 'accept' || decision === 'edit';
    })
    .sort((a, b) => b.position.start - a.position.start); // reverse order

  let text = state.originalText;

  for (const result of toApply) {
    const decision = state.decisions.get(result.id);
    const replacement =
      decision === 'edit'
        ? (state.customRedactions.get(result.id) ?? result.redacted)
        : result.redacted;

    text =
      text.slice(0, result.position.start) +
      replacement +
      text.slice(result.position.end);
  }

  return text;
}

/**
 * Stats for the summary panel.
 */
export function getStats(state: SanitizationState) {
  const total = state.results.length;
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  const unresolvedCritical: number[] = [];

  for (const r of state.results) {
    bySeverity[r.severity]++;
    if (r.severity === 'critical' && !state.decisions.has(r.id)) {
      unresolvedCritical.push(1);
    }
  }

  const resolved = state.decisions.size;

  return {
    total,
    resolved,
    remaining: total - resolved,
    criticalRemaining: unresolvedCritical.length,
    ...bySeverity,
  };
}
