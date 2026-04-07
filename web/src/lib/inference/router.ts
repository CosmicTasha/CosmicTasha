import type { InferenceProvider, InferenceResult, InferenceOpts } from "./types";
import { MockProvider } from "./providers/mock";
import { LocalOllamaProvider } from "./providers/local-ollama";
import { log } from "@/lib/logger";

export class InferenceRouter {
  private providers: InferenceProvider[];

  constructor(providers?: InferenceProvider[]) {
    if (providers) {
      this.providers = providers;
    } else {
      this.providers = this.buildDefaultProviders();
    }
  }

  private buildDefaultProviders(): InferenceProvider[] {
    const providers: InferenceProvider[] = [];

    // BigEdProvider requires a client factory — skip in default if not wired yet
    // It will be added via constructor injection when the client is ready

    providers.push(new LocalOllamaProvider());

    // OllamaCloudProvider only if configured
    if (process.env.OLLAMA_CLOUD_HOST) {
      try {
        const { OllamaCloudProvider } = require("./providers/ollama-cloud");
        providers.push(new OllamaCloudProvider());
      } catch {
        // OLLAMA_CLOUD_HOST set but provider failed to construct
      }
    }

    providers.push(new MockProvider()); // always last — always available
    return providers;
  }

  async generate(
    prompt: string,
    system: string,
    opts?: InferenceOpts
  ): Promise<InferenceResult> {
    for (const provider of this.providers) {
      try {
        if (await provider.available()) {
          log.info({ provider: provider.name }, "Using inference provider");
          return await provider.generate(prompt, system, opts);
        }
      } catch (error) {
        log.warn({ provider: provider.name, error }, "Provider failed, trying next");
      }
    }
    throw new Error("All inference providers failed");
  }

  async status(): Promise<{ providers: Array<{ name: string; available: boolean }> }> {
    const results = await Promise.all(
      this.providers.map(async (p) => ({
        name: p.name,
        available: await p.available().catch(() => false),
      }))
    );
    return { providers: results };
  }
}
