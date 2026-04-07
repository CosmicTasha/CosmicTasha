import { LocalOllamaProvider } from "./local-ollama";
import type { InferenceResult, InferenceOpts } from "../types";

export class OllamaCloudProvider extends LocalOllamaProvider {
  constructor() {
    const host = process.env.OLLAMA_CLOUD_HOST;
    if (!host) throw new Error("OLLAMA_CLOUD_HOST not configured");
    super(host, process.env.OLLAMA_MODEL ?? "qwen3:8b");
    this.name = "ollama-cloud";
  }

  override async generate(
    prompt: string,
    system: string,
    opts?: InferenceOpts
  ): Promise<InferenceResult> {
    const result = await super.generate(prompt, system, opts);
    return { ...result, provider: "ollama-cloud" as const };
  }
}
