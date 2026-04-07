export interface InferenceOpts {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface InferenceResult {
  text: string;
  model: string;
  provider: "biged-rs" | "local-ollama" | "ollama-cloud" | "mock";
  duration_ms: number;
}

export interface InferenceProvider {
  name: string;
  available(): Promise<boolean>;
  generate(
    prompt: string,
    system: string,
    opts?: InferenceOpts
  ): Promise<InferenceResult>;
}
