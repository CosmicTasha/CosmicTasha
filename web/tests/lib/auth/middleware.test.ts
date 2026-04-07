import { describe, it, expect, vi } from "vitest";

// Mock next/headers since we're not in a Next.js runtime
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
  }),
}));

// Mock lucia
vi.mock("@/lib/auth/lucia", () => ({
  lucia: {
    sessionCookieName: "auth_session",
    validateSession: vi.fn(),
    createSessionCookie: vi.fn(),
  },
}));

describe("withAuth", () => {
  it("returns 401 when no session cookie", async () => {
    const { withAuth } = await import("@/lib/auth/middleware");
    const handler = withAuth(async () => Response.json({ ok: true }));
    const req = new Request("http://localhost:3000/api/test");
    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});

describe("session-ownership", () => {
  it("exports verifyOwnership and claimSession", async () => {
    const mod = await import("@/lib/auth/session-ownership");
    expect(typeof mod.verifyOwnership).toBe("function");
    expect(typeof mod.claimSession).toBe("function");
  });
});
