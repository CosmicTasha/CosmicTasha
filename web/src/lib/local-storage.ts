const STORAGE_KEY = 'cosmictasha_intake';

export interface StoredState {
  sessionId: string;
  answers: Record<string, unknown>;
  currentStage: number;
  persona: string | null;
  readinessScore: number | null;
  stageCompletion: Record<number, string>;
  lastActivityAt: string;
}

export function saveToLocalStorage(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      lastActivityAt: new Date().toISOString(),
    }));
  } catch { /* quota exceeded, ignore */ }
}

export function loadFromLocalStorage(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateLocalSessionId(): string {
  return 'local_' + Math.random().toString(36).substring(2, 15);
}
