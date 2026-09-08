import { describe, expect, it } from "vitest";
import { computeCotisationRegularisation } from "./cotisations";

describe("computeCotisationRegularisation", () => {
  it("prorates a mid-month formula change across a 30-day month", () => {
    const result = computeCotisationRegularisation({
      previousMonthlyAmount: 60,
      newMonthlyAmount: 90,
      effectiveDate: "2026-04-16",
    });
    expect(result.daysInMonth).toBe(30);
    expect(result.daysAtPreviousRate).toBe(15);
    expect(result.daysAtNewRate).toBe(15);
    expect(result.totalDueForMonth).toBe(75);
    expect(result.regularisationAmount).toBe(15);
  });

  it("returns zero regularisation when the amount does not change", () => {
    const result = computeCotisationRegularisation({
      previousMonthlyAmount: 60,
      newMonthlyAmount: 60,
      effectiveDate: "2026-06-10",
    });
    expect(result.regularisationAmount).toBe(0);
  });

  it("rejects a negative cotisation amount", () => {
    expect(() =>
      computeCotisationRegularisation({
        previousMonthlyAmount: -10,
        newMonthlyAmount: 50,
        effectiveDate: "2026-01-01",
      }),
    ).toThrow();
  });
});
