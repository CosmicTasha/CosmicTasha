import { describe, it, expect } from "vitest";

describe("arctic providers", () => {
  it("returns empty object when no env vars set", async () => {
    const { getProviders } = await import("@/lib/auth/arctic");
    const providers = getProviders();
    expect(Object.keys(providers).length).toBe(0);
  });

  it("exports OAuthProvider type and getProviders function", async () => {
    const mod = await import("@/lib/auth/arctic");
    expect(typeof mod.getProviders).toBe("function");
  });
});
