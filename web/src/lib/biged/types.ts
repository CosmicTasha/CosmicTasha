// Task management
export interface Task {
  id: number;
  skill: string;
  payload: Record<string, unknown>;
  status:
    | 'pending'
    | 'running'
    | 'done'
    | 'failed'
    | 'waiting_human'
    | 'review'
    | 'forwarded';
  result?: Record<string, unknown>;
  agent?: string;
  created_at: string;
  updated_at: string;
}

// Skill execution request
export interface SkillRequest {
  skill: string;
  payload: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

// AI inference
export interface InferenceRequest {
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system_prompt?: string;
  response_format?: 'text' | 'json';
}

export interface InferenceResponse {
  text: string;
  model: string;
  tokens_used: number;
  duration_ms: number;
}

// Fleet status
export interface FleetStatus {
  agents: Agent[];
  queue_depth: number;
  active_tasks: number;
  uptime_seconds: number;
}

export interface Agent {
  name: string;
  role: string;
  status: 'idle' | 'busy' | 'quarantined' | 'offline';
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
