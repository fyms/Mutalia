import { round2 } from "@/lib/domain/reimbursement";

export interface CotisationRegularisationInput {
  previousMonthlyAmount: number;
  newMonthlyAmount: number;
  /** Date d'effet du changement (format YYYY-MM-DD), à l'intérieur du mois régularisé. */
  effectiveDate: string;
}

export interface CotisationRegularisationResult {
  previousMonthlyAmount: number;
  newMonthlyAmount: number;
  daysInMonth: number;
  daysAtPreviousRate: number;
  daysAtNewRate: number;
  regularisationAmount: number;
  totalDueForMonth: number;
}

/**
 * Calcule la régularisation d'un mois de cotisation lors d'un changement de formule
 * en cours de mois : prorata jour par jour entre l'ancien et le nouveau montant
 * mensuel. Mécanique générale de proration, indépendante de toute grille tarifaire
 * propriétaire (le pack ne fournit aucune grille de cotisations 2026).
 */
export function computeCotisationRegularisation(
  input: CotisationRegularisationInput,
): CotisationRegularisationResult {
  const { previousMonthlyAmount, newMonthlyAmount, effectiveDate } = input;
  if (previousMonthlyAmount < 0 || newMonthlyAmount < 0) {
    throw new Error("Les montants de cotisation doivent être positifs.");
  }
  const date = new Date(effectiveDate);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date d'effet invalide.");
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfChange = date.getDate();

  const daysAtPreviousRate = dayOfChange - 1;
  const daysAtNewRate = daysInMonth - daysAtPreviousRate;

  const previousDaily = previousMonthlyAmount / daysInMonth;
  const newDaily = newMonthlyAmount / daysInMonth;

  const totalDueForMonth = round2(previousDaily * daysAtPreviousRate + newDaily * daysAtNewRate);
  const regularisationAmount = round2(totalDueForMonth - previousMonthlyAmount);

  return {
    previousMonthlyAmount: round2(previousMonthlyAmount),
    newMonthlyAmount: round2(newMonthlyAmount),
    daysInMonth,
    daysAtPreviousRate,
    daysAtNewRate,
    regularisationAmount,
    totalDueForMonth,
  };
}
