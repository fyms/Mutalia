import { round2 } from "./reimbursement";

export interface AnnualCapInput {
  annualCap: number;
  alreadyUsed: number;
  requestedAmount: number;
}

export interface AnnualCapResult {
  annualCap: number;
  alreadyUsed: number;
  available: number;
  requestedAmount: number;
  coveredAmount: number;
  overCapAmount: number;
  capReached: boolean;
}

export function computeAnnualCap(input: AnnualCapInput): AnnualCapResult {
  const { annualCap, alreadyUsed, requestedAmount } = input;
  if (annualCap < 0 || alreadyUsed < 0 || requestedAmount < 0) {
    throw new Error("Les montants de plafond doivent être positifs.");
  }
  const available = round2(Math.max(0, annualCap - alreadyUsed));
  const coveredAmount = round2(Math.min(available, requestedAmount));
  const overCapAmount = round2(Math.max(0, requestedAmount - available));
  return {
    annualCap: round2(annualCap),
    alreadyUsed: round2(alreadyUsed),
    available,
    requestedAmount: round2(requestedAmount),
    coveredAmount,
    overCapAmount,
    capReached: available <= 0,
  };
}
