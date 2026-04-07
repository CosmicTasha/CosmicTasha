import { describe, it, expect } from "vitest";

describe("OAuth routes exist", () => {
  it("google login exports GET", async () => {
    const { GET } = await import("@/app/api/auth/login/google/route");
    expect(typeof GET).toBe("function");
  });
  it("github login exports GET", async () => {
    const { GET } = await import("@/app/api/auth/login/github/route");
    expect(typeof GET).toBe("function");
  });
  it("microsoft login exports GET", async () => {
    const { GET } = await import("@/app/api/auth/login/microsoft/route");
    expect(typeof GET).toBe("function");
  });
  it("google callback exports GET", async () => {
    const { GET } = await import("@/app/api/auth/callback/google/route");
    expect(typeof GET).toBe("function");
  });
  it("github callback exports GET", async () => {
    const { GET } = await import("@/app/api/auth/callback/github/route");
    expect(typeof GET).toBe("function");
  });
  it("microsoft callback exports GET", async () => {
    const { GET } = await import("@/app/api/auth/callback/microsoft/route");
    expect(typeof GET).toBe("function");
  });
});
