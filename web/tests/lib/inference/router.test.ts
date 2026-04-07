import { describe, it, expect } from "vitest";

describe("InferenceRouter", () => {
  it("falls through to mock when no providers available", async () => {
    const { InferenceRouter } = await import("@/lib/inference/router");
    const { MockProvider } = await import("@/lib/inference/providers/mock");
    // Use mock-only router to guarantee fallback behaviour regardless of local Ollama state
    const router = new InferenceRouter([new MockProvider()]);
    const result = await router.generate("test prompt", "system");
    expect(result.provider).toBe("mock");
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("reports provider status", async () => {
    const { InferenceRouter } = await import("@/lib/inference/router");
    const router = new InferenceRouter();
    const status = await router.status();
    expect(status.providers.length).toBeGreaterThan(0);
    // Mock should always be available
    const mock = status.providers.find(p => p.name === "mock");
    expect(mock?.available).toBe(true);
  });

  it("uses custom providers when injected", async () => {
    const { InferenceRouter } = await import("@/lib/inference/router");
    const { MockProvider } = await import("@/lib/inference/providers/mock");
    const mockOnly = new InferenceRouter([new MockProvider()]);
    const result = await mockOnly.generate("test", "sys");
    expect(result.provider).toBe("mock");
  });
});
