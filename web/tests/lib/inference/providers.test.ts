import { describe, it, expect } from "vitest";

describe("MockProvider", () => {
  it("is always available", async () => {
    const { MockProvider } = await import("@/lib/inference/providers/mock");
    const provider = new MockProvider();
    expect(await provider.available()).toBe(true);
  });

  it("generates prose for any prompt", async () => {
    const { MockProvider } = await import("@/lib/inference/providers/mock");
    const provider = new MockProvider();
    const result = await provider.generate("Write about incident response", "system");
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.provider).toBe("mock");
    expect(result.model).toBe("mockProse");
  });

  it("returns different text for different topics", async () => {
    const { MockProvider } = await import("@/lib/inference/providers/mock");
    const provider = new MockProvider();
    const ir = await provider.generate("incident response plan", "system");
    const ac = await provider.generate("access control policy", "system");
    expect(ir.text).not.toBe(ac.text);
  });
});

describe("LocalOllamaProvider", () => {
  it("reports unavailable when Ollama is not running", async () => {
    const { LocalOllamaProvider } = await import("@/lib/inference/providers/local-ollama");
    const provider = new LocalOllamaProvider("http://localhost:99999");
    expect(await provider.available()).toBe(false);
  });
});
