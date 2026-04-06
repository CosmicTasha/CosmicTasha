'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getBigEdClient } from './index';
import type { FleetStatus, InferenceRequest, InferenceResponse } from './types';

// ── useBigEdStatus ──────────────────────────────────────────────────

const STATUS_POLL_INTERVAL_MS = 30_000;

export function useBigEdStatus() {
  const [status, setStatus] = useState<FleetStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      const client = getBigEdClient();
      const data = await client.getStatus();
      setStatus(data);
      setIsConnected(true);
      setError(null);
    } catch (err: unknown) {
      setIsConnected(false);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetch();
    const id = setInterval(fetch, STATUS_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetch]);

  return { status, isConnected, error } as const;
}

// ── useBigEdInference ───────────────────────────────────────────────

export function useBigEdInference(request: InferenceRequest | null) {
  const [result, setResult] = useState<InferenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Stable reference to avoid re-triggering on object identity changes
  const requestJson = request ? JSON.stringify(request) : null;
  const lastRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!requestJson || requestJson === lastRequestRef.current) return;
    lastRequestRef.current = requestJson;

    const parsed = JSON.parse(requestJson) as InferenceRequest;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const client = getBigEdClient();
    client
      .inference(parsed)
      .then((res) => {
        if (!cancelled) {
          setResult(res);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestJson]);

  return { result, isLoading, error } as const;
}
