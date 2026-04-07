// Task management
export interface Task {
  id: number;
  skill: string;
  payload: Record<string, unknown>;
  status:
    | 'PENDING'
    | 'RUNNING'
    | 'DONE'
    | 'FAILED'
    | 'CANCELLED'
    | 'WAITING';
  result?: Record<string, unknown>;
  agent?: string;
  created_at?: string;
  updated_at?: string;
}

// Skill execution request
export interface SkillRequest {
  skill: string;
  payload: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * @deprecated Use `ollamaGenerate()` from `@/lib/ollama/client` instead.
 * biged-rs does not expose an /api/inference endpoint.
 */
export interface InferenceRequest {
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system_prompt?: string;
  response_format?: 'text' | 'json';
}

/**
 * @deprecated Use `OllamaGenerateResponse` from `@/lib/ollama/client` instead.
 */
export interface InferenceResponse {
  text: string;
  model: string;
  tokens_used: number;
  duration_ms: number;
}

// Fleet status — matches biged-rs GET /api/status response
export interface FleetStatus {
  agents: Agent[];
  tasks: {
    PENDING: number;
    RUNNING: number;
    DONE: number;
    FAILED: number;
    CANCELLED: number;
    WAITING: number;
  };
}

export interface Agent {
  name: string;
  role: string;
  status: 'IDLE' | 'BUSY' | 'DISABLED';
  current_task?: string;
}

// Hardware/thermal state
export interface HwState {
  gpu_temp: number;
  vram_used: number;
  vram_total: number;
  cpu_temp: number;
  cpu_percent: number;
  ram_used: number;
  ram_total: number;
}

// Compliance profiles
export interface ComplianceProfile {
  profile_id: string;
  sha256: string;
  stored_at: string;
}

// Task dispatch
export interface TaskDispatchRequest {
  skill: string;
  payload?: Record<string, unknown>;
  priority?: number;
  assigned_to?: string;
}

export interface TaskDispatchResponse {
  status: 'ok';
  task_id: number;
  skill: string;
  priority: number;
}

// Ollama management
export interface OllamaStatus {
  running: boolean;
  host: string;
  loaded_models: Array<{ name: string; size: number }>;
}

// SSE events
export type FleetEvent =
  | { type: 'task_completed'; task_id: number; skill: string; agent: string }
  | { type: 'agent_state_change'; agent: string; from: string; to: string }
  | { type: 'thermal_alert'; gpu_temp: number; action: string }
  | {
      type: 'inference_complete';
      request_id: string;
      result: InferenceResponse;
    };
