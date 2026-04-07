import { describe, it, expect, vi } from "vitest";

// Mock db to avoid Neon connection
vi.mock("@/db", () => ({
  db: {
    query: {
      subscriptions: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

describe("getTierFromDb", () => {
  it("returns discovery when no subscription exists", async () => {
    const { getTierFromDb } = await import("@/lib/tier");
    const tier = await getTierFromDb("00000000-0000-0000-0000-000000000000");
    expect(tier).toBe("discovery");
  });

  it("exports existing getCurrentTier for client-side", async () => {
    const { getCurrentTier } = await import("@/lib/tier");
    expect(typeof getCurrentTier).toBe("function");
  });
});
