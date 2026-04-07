import { describe, it, expect } from "vitest";

describe("logger", () => {
  it("exports a pino logger instance", async () => {
    const { log } = await import("@/lib/logger");
    expect(log).toBeDefined();
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
  });
});
