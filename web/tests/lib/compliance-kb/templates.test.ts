import { describe, it, expect } from "vitest";

describe("compliance templates", () => {
  it("exports 14 templates", async () => {
    const { soc2Templates } = await import("@/lib/compliance-kb/soc2/templates");
    expect(soc2Templates).toHaveLength(14);
  });

  it("each template has required fields", async () => {
    const { soc2Templates } = await import("@/lib/compliance-kb/soc2/templates");
    for (const t of soc2Templates) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.tsc.length).toBeGreaterThan(0);
      expect(t.sections.length).toBeGreaterThan(0);
      expect(["critical", "high", "medium", "low"]).toContain(t.auditRisk);
    }
  });

  it("critical templates have ai_generate sections with review tags", async () => {
    const { soc2Templates } = await import("@/lib/compliance-kb/soc2/templates");
    const critical = soc2Templates.filter(t => t.auditRisk === "critical");
    expect(critical.length).toBeGreaterThanOrEqual(2);
    for (const t of critical) {
      const aiSections = t.sections.filter(s => s.type === "ai_generate");
      expect(aiSections.length).toBeGreaterThan(0);
      expect(aiSections.some(s => s.reviewTag)).toBe(true);
    }
  });

  it("template IDs are unique", async () => {
    const { soc2Templates } = await import("@/lib/compliance-kb/soc2/templates");
    const ids = soc2Templates.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
