import { z } from "zod";
import { computeReimbursement, type ReimbursementResult } from "./reimbursement";
import { DATA_TO_VERIFY } from "./constants";
export const PRESTATION_STATUSES = ["Reçue", "À contrôler", "Calculée", "Validée", "Payée", "Clôturée"] as const;
export type PrestationStatus = typeof PRESTATION_STATUSES[number];
export const PrestationInputSchema = z.object({
  householdId: z.string().min(1).max(100), memberId: z.string().min(1).max(100),
  act: z.string().trim().min(1, "Acte requis.").max(150),
  careDate: z.iso.date().refine(d => d <= new Date().toISOString().slice(0,10), "La date de soins ne peut pas être future."),
  billed: z.number().nonnegative().max(100000000), brss: z.number().nonnegative().max(100000000),
  amoRate: z.number().min(0).max(1),
  guaranteeMode: z.enum(["percent_brss", "forfait_euros", "frais_reels"]).optional(),
  guaranteeValue: z.number().nonnegative().max(100000000).optional(),
  contractSource: z.string().trim().max(500).default(""), contractVerified: z.boolean().default(false),
});
export type PrestationInput = z.infer<typeof PrestationInputSchema>;
export interface Prestation extends PrestationInput {
  id: string; dossierId: string; adherentName: string; beneficiaryName: string;
  status: PrestationStatus; revision: number; createdAt: string; updatedAt: string;
  result: ReimbursementResult | null; anomalies: string[];
  history: {at: string; status: PrestationStatus; event: string}[];
}
export function contractAnomalies(input: PrestationInput): string[] {
  return !input.contractVerified || !input.contractSource || !input.guaranteeMode ||
    (input.guaranteeMode !== "frais_reels" && input.guaranteeValue === undefined) ? [DATA_TO_VERIFY] : [];
}
export function calculatePrestation(input: PrestationInput) {
  const anomalies = contractAnomalies(input);
  if (anomalies.length) return {result: null, anomalies};
  const result = computeReimbursement({...input, guaranteeMode: input.guaranteeMode!});
  if (result.dataToVerify) return {result: null, anomalies: [DATA_TO_VERIFY]};
  if (result.amoReimbursement > result.billed) return {result: null, anomalies: ["AMO supérieure au montant facturé : contrôler les montants."]};
  return {result, anomalies: []};
}
export function nextPrestationStatus(status: PrestationStatus): PrestationStatus | undefined {
  return PRESTATION_STATUSES[PRESTATION_STATUSES.indexOf(status) + 1];
}
