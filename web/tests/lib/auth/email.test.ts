import { describe, it, expect } from "vitest";

describe("email provider", () => {
  it("console provider logs magic link without throwing", async () => {
    const { ConsoleProvider } = await import("@/lib/auth/email/console");
    const provider = new ConsoleProvider();
    await expect(
      provider.sendMagicLink("test@example.com", "tok123", "http://localhost:3000/verify")
    ).resolves.toBeUndefined();
  });

  it("getEmailProvider returns ConsoleProvider by default", async () => {
    const { getEmailProvider } = await import("@/lib/auth/email/provider");
    const provider = getEmailProvider();
    expect(provider.constructor.name).toBe("ConsoleProvider");
  });
});
