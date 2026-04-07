import type { InferenceProvider, InferenceResult, InferenceOpts } from "../types";

// BigEdClient interface (actual client wired in Task 19)
interface BigEdClientLike {
  healthCheck(): Promise<boolean>;
  dispatchTask(request: {
    skill: string;
    payload?: Record<string, unknown>;
    priority?: number;
  }): Promise<{ task_id: number }>;
  getTask(
    taskId: number
  ): Promise<{
    status: string;
    result?: { text?: string; model?: string };
    error?: string;
  }>;
}

export class BigEdProvider implements InferenceProvider {
  name = "biged-rs";
  private getClient: () => BigEdClientLike;

  constructor(clientFactory: () => BigEdClientLike) {
    this.getClient = clientFactory;
  }

  async available(): Promise<boolean> {
    try {
      return await this.getClient().healthCheck();
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
    const client = this.getClient();

    const dispatch = await client.dispatchTask({
      skill: "inference",
      payload: {
        prompt,
        system,
        temperature: opts?.temperature ?? 0.4,
        max_tokens: opts?.maxTokens ?? 500,
        model: opts?.model,
      },
      priority: 5,
    });

    // Poll for completion (v1 — SSE upgrade later)
    let result = await client.getTask(dispatch.task_id);
    let attempts = 0;
    while (
      result.status !== "DONE" &&
      result.status !== "FAILED" &&
      attempts < 60
    ) {
      await new Promise((r) => setTimeout(r, 2_000));
      result = await client.getTask(dispatch.task_id);
      attempts++;
    }

    if (result.status === "FAILED") {
      throw new Error(`biged-rs task failed: ${result.error}`);
    }

    return {
      text: result.result?.text ?? "",
      model: result.result?.model ?? "unknown",
      provider: "biged-rs",
      duration_ms: Date.now() - start,
    };
  }
}
