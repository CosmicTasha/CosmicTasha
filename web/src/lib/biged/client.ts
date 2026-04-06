import type {
  FleetStatus,
  HwState,
  InferenceRequest,
  InferenceResponse,
  SkillRequest,
  Task,
} from './types';

export class BigEdError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
  ) {
    super(message);
    this.name = 'BigEdError';
  }
}

export class BigEdConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BigEdConnectionError';
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

export class BigEdClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    const url = baseUrl ?? process.env.BIGED_URL;
    if (!url) {
      throw new BigEdConnectionError(
        'BIGED_URL environment variable is not set and no baseUrl was provided',
      );
    }
    // Strip trailing slash for consistent URL building
    this.baseUrl = url.replace(/\/+$/, '');
  }

  // ── HTTP helpers ──────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '(no body)');
        throw new BigEdError(
          `${method} ${path} returned ${res.status}: ${text}`,
          res.status,
          path,
        );
      }

      return (await res.json()) as T;
    } catch (error: unknown) {
      if (error instanceof BigEdError) throw error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new BigEdConnectionError(
          `Request to ${path} timed out after ${timeoutMs}ms`,
        );
      }

      const message =
        error instanceof Error ? error.message : String(error);
      throw new BigEdConnectionError(
        `Failed to reach biged-rs at ${url}: ${message}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  /** Dispatch a new task to the fleet. */
  async postTask(request: SkillRequest): Promise<Task> {
    return this.request<Task>('POST', '/api/tasks', request);
  }

  /** Get the current status of a task by ID. */
  async getTask(id: number): Promise<Task> {
    return this.request<Task>('GET', `/api/tasks/${id}`);
  }

  /** Get overall fleet status (agents, queue depth, etc). */
  async getStatus(): Promise<FleetStatus> {
    return this.request<FleetStatus>('GET', '/api/status');
  }

  /** Get current hardware / thermal state. */
  async getHwState(): Promise<HwState> {
    return this.request<HwState>('GET', '/api/hw');
  }

  /** Run an AI inference request through the fleet's Ollama router. */
  async inference(request: InferenceRequest): Promise<InferenceResponse> {
    return this.request<InferenceResponse>(
      'POST',
      '/api/inference',
      request,
    );
  }

  /** Quick health check — resolves true if biged-rs is reachable. */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request<unknown>('GET', '/api/health');
      return true;
    } catch (error: unknown) {
      // Log the failure so it's never silently swallowed
      const message =
        error instanceof Error ? error.message : String(error);
      console.warn(`[BigEdClient] health check failed: ${message}`);
      return false;
    }
  }
}
