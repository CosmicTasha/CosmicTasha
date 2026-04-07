import { describe, it, expect } from "vitest";

describe("lucia", () => {
  it("exports lucia instance with expected methods", async () => {
    const { lucia } = await import("@/lib/auth/lucia");
    expect(lucia).toBeDefined();
    expect(typeof lucia.createSession).toBe("function");
    expect(typeof lucia.validateSession).toBe("function");
    expect(typeof lucia.createSessionCookie).toBe("function");
    expect(typeof lucia.createBlankSessionCookie).toBe("function");
  });
});
