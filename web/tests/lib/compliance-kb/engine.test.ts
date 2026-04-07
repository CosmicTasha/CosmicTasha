import { describe, it, expect } from "vitest";
import type { Dimension } from "@/lib/compliance-kb/types";

describe("ScoreEngine", () => {
  it("computes weighted score from dimensions", async () => {
    const { ScoreEngine } = await import("@/lib/compliance-kb/engine");

    const mockDim: Dimension = {
      id: "test",
      name: "Test Dimension",
      tsc: ["CC1.1"],
      weight: 1.0,
      evaluate: () => ({
        score: 0.75,
        findings: [],
        strengths: ["Good"],
        confidence: 0.9,
      }),
    };

    const engine = new ScoreEngine([mockDim]);
    const result = engine.score({});
    expect(result.overall).toBe(75);
    expect(result.band).toBe("almost-there");
    expect(result.strengths).toContain("Good");
  });

  it("aggregates findings from all dimensions", async () => {
    const { ScoreEngine } = await import("@/lib/compliance-kb/engine");

    const dim: Dimension = {
      id: "test",
      name: "Test",
      tsc: ["CC1.1"],
      weight: 1.0,
      evaluate: () => ({
        score: 0.5,
        findings: [
          { gap: "Missing MFA", severity: "P0", tsc: "CC6.1", remediation: "Enable MFA", effort: "hours" },
        ],
        strengths: [],
        confidence: 0.8,
      }),
    };

    const engine = new ScoreEngine([dim]);
    const result = engine.score({});
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].gap).toBe("Missing MFA");
  });

  it("handles multiple weighted dimensions", async () => {
    const { ScoreEngine } = await import("@/lib/compliance-kb/engine");

    const dim1: Dimension = {
      id: "a", name: "A", tsc: ["CC1"], weight: 0.6,
      evaluate: () => ({ score: 1.0, findings: [], strengths: ["Perfect A"], confidence: 1.0 }),
    };
    const dim2: Dimension = {
      id: "b", name: "B", tsc: ["CC2"], weight: 0.4,
      evaluate: () => ({ score: 0.5, findings: [], strengths: [], confidence: 1.0 }),
    };

    const engine = new ScoreEngine([dim1, dim2]);
    const result = engine.score({});
    // 0.6*1.0 + 0.4*0.5 = 0.8 → 80
    expect(result.overall).toBe(80);
    expect(result.band).toBe("audit-ready");
  });

  it("returns not-ready for zero scores", async () => {
    const { ScoreEngine } = await import("@/lib/compliance-kb/engine");
    const dim: Dimension = {
      id: "z", name: "Z", tsc: ["CC1"], weight: 1.0,
      evaluate: () => ({ score: 0, findings: [], strengths: [], confidence: 0 }),
    };
    const engine = new ScoreEngine([dim]);
    expect(engine.score({}).band).toBe("not-ready");
  });
});
