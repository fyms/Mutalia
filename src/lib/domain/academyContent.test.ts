import { describe, expect, it } from "vitest";
import { ACADEMY_MODULE_CONTENT } from "./academyContent";

describe("ACADEMY_MODULE_CONTENT", () => {
  it("covers all 19 curriculum modules exactly once", () => {
    const ids = ACADEMY_MODULE_CONTENT.map((m) => m.moduleId);
    expect(ids).toHaveLength(19);
    expect(new Set(ids).size).toBe(19);
  });

  it("gives every module at least a course, an example and a quiz", () => {
    for (const academyModule of ACADEMY_MODULE_CONTENT) {
      expect(academyModule.course.length).toBeGreaterThan(0);
      expect(academyModule.example.length).toBeGreaterThan(0);
      expect(academyModule.quiz.length).toBeGreaterThan(0);
    }
  });

  it("has a valid correctIndex within the options range for every quiz question", () => {
    for (const academyModule of ACADEMY_MODULE_CONTENT) {
      for (const question of academyModule.quiz) {
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(question.options.length);
      }
    }
  });

  it("gives module M19 (cas complexes) the three advanced-difficulty cases", () => {
    const m19 = ACADEMY_MODULE_CONTENT.find((m) => m.moduleId === "M19");
    expect(m19?.linkedCaseIds.sort()).toEqual(["CASE-006", "CASE-011", "CASE-012"]);
  });
});
