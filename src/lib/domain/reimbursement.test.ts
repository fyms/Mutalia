import { describe, expect, it } from "vitest";
import { computeReimbursement } from "./reimbursement";

describe("computeReimbursement", () => {
  it("matches the verified CASE-001 answer key (billed 80, brss 35, amo 24.5)", () => {
    const result = computeReimbursement({
      billed: 80,
      brss: 35,
      amoRate: 0.7,
      guaranteeMode: "percent_brss",
      guaranteeValue: 150,
    });
    expect(result.amoReimbursement).toBe(24.5);
    expect(result.amcTargetTotal).toBe(52.5);
    expect(result.amcReimbursement).toBe(28);
    expect(result.remainingCharge).toBe(27.5);
  });

  it("never lets AMC push the reimbursement above the billed amount", () => {
    const result = computeReimbursement({
      billed: 30,
      brss: 35,
      amoRate: 0.7,
      guaranteeMode: "percent_brss",
      guaranteeValue: 200,
    });
    expect(result.amoReimbursement + result.amcReimbursement).toBeLessThanOrEqual(30);
    expect(result.remainingCharge).toBe(0);
  });

  it("handles frais réels by covering the full remaining balance", () => {
    const result = computeReimbursement({
      billed: 200,
      brss: 120,
      amoRate: 0.8,
      guaranteeMode: "frais_reels",
    });
    expect(result.amoReimbursement).toBe(96);
    expect(result.amcReimbursement).toBe(104);
    expect(result.remainingCharge).toBe(0);
  });

  it("caps a forfait euros guarantee to the remaining balance", () => {
    const result = computeReimbursement({
      billed: 40,
      brss: 0,
      amoRate: 0,
      guaranteeMode: "forfait_euros",
      guaranteeValue: 50,
    });
    expect(result.amcReimbursement).toBe(40);
    expect(result.remainingCharge).toBe(0);
  });

  it("flags missing guarantee value as data to verify instead of inventing it", () => {
    const result = computeReimbursement({
      billed: 100,
      brss: 60,
      amoRate: 0.7,
      guaranteeMode: "percent_brss",
    });
    expect(result.dataToVerify).toBe(true);
    expect(result.amcReimbursement).toBe(0);
  });

  it("rejects an AMO rate outside [0, 1]", () => {
    expect(() =>
      computeReimbursement({
        billed: 10,
        brss: 10,
        amoRate: 1.5,
        guaranteeMode: "frais_reels",
      }),
    ).toThrow();
  });
});
