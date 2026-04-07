import type { InferenceProvider, InferenceResult, InferenceOpts } from "../types";

export class LocalOllamaProvider implements InferenceProvider {
  name = "local-ollama";
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl = process.env.OLLAMA_URL ?? "http://localhost:11434",
    model = process.env.OLLAMA_MODEL ?? "qwen3:8b"
  ) {
    this.baseUrl = baseUrl;
    this.defaultModel = model;
  }

  async available(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3_000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(
    prompt: string,
    system: string,
    opts?: InferenceOpts
  ): Promise<InferenceResult> {
    const start = Date.now();
    const model = opts?.model ?? this.defaultModel;
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `/no_think\n${prompt}` },
        ],
        stream: false,
        options: {
          temperature: opts?.temperature ?? 0.4,
          num_predict: opts?.maxTokens ?? 500,
        },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    return {
      text: data.message?.content ?? "",
      model,
      provider: "local-ollama",
      duration_ms: Date.now() - start,
    };
  }
}
