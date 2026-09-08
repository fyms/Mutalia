import { describe, expect, it } from "vitest";
import { computeAnnualCap } from "./caps";

describe("computeAnnualCap", () => {
  it("matches CASE-012 (plafond 1200, déjà consommé 600)", () => {
    const result = computeAnnualCap({
      annualCap: 1200,
      alreadyUsed: 600,
      requestedAmount: 900,
    });
    expect(result.available).toBe(600);
    expect(result.coveredAmount).toBe(600);
    expect(result.overCapAmount).toBe(300);
    expect(result.capReached).toBe(false);
  });

  it("flags the cap as reached when consumption meets the ceiling", () => {
    const result = computeAnnualCap({
      annualCap: 300,
      alreadyUsed: 300,
      requestedAmount: 100,
    });
    expect(result.available).toBe(0);
    expect(result.coveredAmount).toBe(0);
    expect(result.overCapAmount).toBe(100);
    expect(result.capReached).toBe(true);
  });
});
