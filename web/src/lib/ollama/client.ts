const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';

export interface OllamaGenerateRequest {
  prompt: string;
  model?: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface OllamaGenerateResponse {
  response: string;
  model: string;
  total_duration?: number;
  eval_count?: number;
}

export async function ollamaGenerate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000); // 90s for generation

  try {
    // Use /api/chat with /no_think prefix — qwen3 models use thinking mode
    // by default which puts output in the thinking field instead of response.
    // /no_think disables this and returns direct output.
    const messages: { role: string; content: string }[] = [];
    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    messages.push({ role: 'user', content: `/no_think ${request.prompt}` });

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model || DEFAULT_MODEL,
        messages,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.4,
          num_predict: request.max_tokens ?? 500,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return {
      response: data.message?.content || '',
      model: data.model || request.model || DEFAULT_MODEL,
      total_duration: data.total_duration,
      eval_count: data.eval_count,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function ollamaHealthCheck(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

export async function ollamaListModels(): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = await res.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  } catch {
    return [];
  }
}
