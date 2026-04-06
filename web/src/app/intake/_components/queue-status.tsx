'use client';

import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Queue status indicator — shows biged-rs health and queue depth
// ---------------------------------------------------------------------------

interface StatusData {
  connected: boolean;
  tasks?: {
    PENDING?: number;
    RUNNING?: number;
    DONE?: number;
    FAILED?: number;
    CANCELLED?: number;
    WAITING?: number;
  };
  agents?: Array<{ name: string; status: string }>;
}

const POLL_INTERVAL_MS = 30_000;

export function QueueStatus() {
  const [status, setStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5_000);
        const res = await fetch('/api/biged/status', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!cancelled) {
          const data = await res.json();
          setStatus(data);
        }
      } catch {
        if (!cancelled) {
          setStatus({ connected: false });
        }
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!status) {
    return (
      <div className="text-xs text-muted-foreground px-3 py-2">
        Checking biged-rs...
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="text-xs text-muted-foreground px-3 py-2 flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
        biged-rs offline (mock mode)
      </div>
    );
  }

  const pending = status.tasks?.PENDING ?? 0;
  const running = status.tasks?.RUNNING ?? 0;

  return (
    <div className="text-xs text-muted-foreground px-3 py-2 flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
      <span>
        biged-rs connected
        {pending > 0 && <> &middot; {pending} pending</>}
        {running > 0 && <> &middot; {running} running</>}
      </span>
    </div>
  );
}
