import type { FleetEvent } from './types';

type EventCallback = (event: FleetEvent) => void;
type EventType = FleetEvent['type'];

const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

/**
 * SSE client for the biged-rs `/api/stream` endpoint.
 *
 * Parses incoming server-sent events into typed `FleetEvent` objects and
 * auto-reconnects with exponential backoff on disconnect.
 */
export class BigEdEventSource {
  private readonly url: string;
  private listeners = new Map<EventType | '*', Set<EventCallback>>();
  private controller: AbortController | null = null;
  private backoff = INITIAL_BACKOFF_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _connected = false;

  constructor(baseUrl: string) {
    const base = baseUrl.replace(/\/+$/, '');
    this.url = `${base}/api/stream`;
  }

  /** Whether the SSE connection is currently open. */
  get connected(): boolean {
    return this._connected;
  }

  // ── Public API ────────────────────────────────────────────────────

  /** Open the SSE connection. Safe to call multiple times. */
  connect(): void {
    if (this.controller) return; // already connected / connecting
    this.controller = new AbortController();
    this.consume(this.controller.signal);
  }

  /** Cleanly close the SSE connection and stop reconnecting. */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    this._connected = false;
  }

  /**
   * Register a callback for a specific event type, or '*' for all events.
   * Returns an unsubscribe function.
   */
  on(eventType: EventType | '*', callback: EventCallback): () => void {
    let set = this.listeners.get(eventType);
    if (!set) {
      set = new Set();
      this.listeners.set(eventType, set);
    }
    set.add(callback);
    return () => {
      set!.delete(callback);
      if (set!.size === 0) this.listeners.delete(eventType);
    };
  }

  // ── Internals ─────────────────────────────────────────────────────

  private emit(event: FleetEvent): void {
    // Fire type-specific listeners
    const typed = this.listeners.get(event.type);
    if (typed) typed.forEach((cb) => cb(event));

    // Fire wildcard listeners
    const wild = this.listeners.get('*');
    if (wild) wild.forEach((cb) => cb(event));
  }

  private async consume(signal: AbortSignal): Promise<void> {
    try {
      const res = await fetch(this.url, {
        headers: { Accept: 'text/event-stream' },
        signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`SSE connect failed: ${res.status}`);
      }

      this._connected = true;
      this.backoff = INITIAL_BACKOFF_MS; // reset on successful connect

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        // Keep the last (possibly incomplete) chunk in the buffer
        buffer = parts.pop() ?? '';

        for (const raw of parts) {
          const event = this.parseSSE(raw);
          if (event) this.emit(event);
        }
      }
    } catch (error: unknown) {
      // AbortError means intentional disconnect — don't reconnect
      if (signal.aborted) return;

      const message =
        error instanceof Error ? error.message : String(error);
      console.warn(`[BigEdEventSource] connection lost: ${message}`);
    } finally {
      this._connected = false;
    }

    // Schedule reconnect if we weren't intentionally disconnected
    if (!signal.aborted) {
      this.scheduleReconnect();
    }
  }

  private parseSSE(raw: string): FleetEvent | null {
    let data = '';
    for (const line of raw.split('\n')) {
      if (line.startsWith('data:')) {
        data += line.slice(5).trim();
      }
    }
    if (!data) return null;

    try {
      return JSON.parse(data) as FleetEvent;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.warn(`[BigEdEventSource] failed to parse event: ${message}`);
      return null;
    }
  }

  private scheduleReconnect(): void {
    // Clean up old controller so connect() can create a fresh one
    this.controller = null;

    console.warn(
      `[BigEdEventSource] reconnecting in ${this.backoff}ms...`,
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.backoff);

    // Exponential backoff capped at MAX_BACKOFF_MS
    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
  }
}
