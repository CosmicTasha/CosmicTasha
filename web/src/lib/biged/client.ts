import { log } from '@/lib/logger';
import type {
  ComplianceProfile,
  FleetStatus,
  HwState,
  InferenceRequest,
  InferenceResponse,
  OllamaStatus,
  SkillRequest,
  Task,
  TaskDispatchRequest,
  TaskDispatchResponse,
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
    const url = baseUrl ?? process.env.BIGED_URL ?? 'http://localhost:5555';
    // Strip trailing slash for consistent URL building
    this.baseUrl = url.replace(/\/+$/, '');
    if (
      process.env.NODE_ENV === 'production' &&
      !this.baseUrl.startsWith('https')
    ) {
      log.warn('biged-rs connection is not HTTPS in production');
    }
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
    return this.request<Task>('POST', '/api/tasks', {
      skill: request.skill,
      payload: request.payload,
    });
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

  /**
   * @deprecated biged-rs does not expose /api/inference.
   * Use `ollamaGenerate()` from `@/lib/ollama/client` instead.
   */
  async inference(_request: InferenceRequest): Promise<InferenceResponse> {
    throw new BigEdError(
      'inference() is deprecated — use ollamaGenerate() from @/lib/ollama/client',
      501,
      '/api/inference',
    );
  }

  /** Submit a compliance profile for storage. */
  async submitProfile(
    data: Record<string, unknown>,
  ): Promise<ComplianceProfile> {
    return this.request<ComplianceProfile>(
      'POST',
      '/api/compliance/profiles',
      data,
    );
  }

  /** Verify an existing compliance profile by ID. */
  async verifyProfile(
    profileId: string,
  ): Promise<{ profile_id: string; valid: boolean }> {
    return this.request<{ profile_id: string; valid: boolean }>(
      'GET',
      `/api/compliance/profiles/${profileId}/verify`,
    );
  }

  /** Dispatch a task to a specific skill with optional priority and assignment. */
  async dispatchTask(
    request: TaskDispatchRequest,
  ): Promise<TaskDispatchResponse> {
    return this.request<TaskDispatchResponse>(
      'POST',
      '/api/tasks/dispatch',
      request,
    );
  }

  /** Get the current Ollama process status and loaded models. */
  async ollamaStatus(): Promise<OllamaStatus> {
    return this.request<OllamaStatus>('GET', '/api/ollama/status');
  }

  /** Start the Ollama process. Uses a longer timeout as startup may take time. */
  async ollamaStart(): Promise<{ status: string }> {
    return this.request<{ status: string }>(
      'POST',
      '/api/ollama/start',
      undefined,
      30_000,
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
