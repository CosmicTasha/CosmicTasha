'use client';

import { useEffect, useState } from 'react';

import type { FleetStatus } from './types';

// ── useBigEdStatus ──────────────────────────────────────────────────
// Polls the Next.js proxy at /api/biged/status (which calls biged-rs
// server-side) so we don't need CORS or exposing BIGED_URL to the browser.

const STATUS_POLL_INTERVAL_MS = 30_000;

interface BigEdStatusResult {
  connected: boolean;
  status: FleetStatus | null;
}

export function useBigEdStatus() {
  const [data, setData] = useState<BigEdStatusResult>({
    connected: false,
    status: null,
  });
  const [error, setError] = useState<Error | null>(null);

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
        const json = await res.json();

        if (!cancelled) {
          if (json.connected) {
            setData({
              connected: true,
              status: {
                agents: json.agents ?? [],
                tasks: json.tasks ?? {
                  PENDING: 0,
                  RUNNING: 0,
                  DONE: 0,
                  FAILED: 0,
                  CANCELLED: 0,
                  WAITING: 0,
                },
              },
            });
            setError(null);
          } else {
            setData({ connected: false, status: null });
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setData({ connected: false, status: null });
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    poll();
    const id = setInterval(poll, STATUS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return {
    status: data.status,
    isConnected: data.connected,
    error,
  } as const;
}
