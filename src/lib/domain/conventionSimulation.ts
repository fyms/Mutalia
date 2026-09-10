import { getConvention } from "@/lib/data/harmonie/conventions";
import { round2 } from "./reimbursement";
export interface ConventionInput {
  idcc: string; year: number; level: string; benefit: string;
  billed: number; brss: number; amo: number; eligible: boolean;
}
export function simulateConvention(input: ConventionInput) {
  const convention = getConvention(input.idcc);
  if (!convention || input.year !== convention.year) throw new Error("Convention ou millésime non disponible.");
  const level = convention.levels.indexOf(input.level);
  const benefit = convention.benefits.find(b => b.id === input.benefit);
  if (level < 0 || !benefit) throw new Error("Niveau ou prestation absent de cette convention.");
  if (!input.eligible) throw new Error("Vérifiez les conditions du poste et les droits avant calcul.");
  if (![input.billed, input.brss, input.amo].every(v => Number.isFinite(v) && v >= 0) || input.brss === 0 || input.amo > input.billed || input.amo > input.brss)
    throw new Error("Montants invalides : BR positive et AMO au plus égale à la BR et aux frais.");
  const rate = benefit.rates[level];
  const totalCeiling = round2(input.brss * rate / 100);
  const amc = round2(Math.max(0, Math.min(input.billed - input.amo, totalCeiling - input.amo)));
  return {rate, totalCeiling, amc, rac: round2(Math.max(0,input.billed-input.amo-amc))};
}
