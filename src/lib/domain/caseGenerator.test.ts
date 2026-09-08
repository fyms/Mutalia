import { describe, expect, it } from "vitest";
import { generateCase } from "./caseGenerator";

describe("generateCase", () => {
  it("is fully deterministic for a given seed and sequence", () => {
    const a = generateCase(12345, 1);
    const b = generateCase(12345, 1);
    expect(a).toEqual(b);
  });

  it("produces a different case for a different sequence with the same seed", () => {
    const a = generateCase(12345, 1);
    const b = generateCase(12345, 2);
    expect(a.trainingCase.case_id).not.toBe(b.trainingCase.case_id);
  });

  it("never fabricates a valid-looking IBAN or social security number", () => {
    const { trainingCase } = generateCase(999, 1);
    const serialized = JSON.stringify(trainingCase);
    expect(serialized).not.toMatch(/FR\d{2}\d{10}[0-9A-Z]{11}\d{2}/);
    expect(serialized).not.toMatch(/\b[12]\d{2}(0[1-9]|1[0-2])\d{2}\d{3}\d{3}\d{2}\b/);
  });

  it("always marks generated members and documents as synthetic", () => {
    const { trainingCase } = generateCase(42, 1);
    for (const member of trainingCase.household.members) {
      expect(member.synthetic).toBe(true);
    }
    for (const doc of trainingCase.documents) {
      expect(doc.synthetic).toBe(true);
    }
  });

  it("gives the answer key a scoring total of 100 points, matching the seeded cases", () => {
    const { answerKey } = generateCase(2026, 1);
    const total = Object.values(answerKey.scoring).reduce((a, b) => a + Number(b), 0);
    expect(total).toBe(100);
  });
});
