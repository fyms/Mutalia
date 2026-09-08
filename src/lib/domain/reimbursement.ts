/**
 * Moteur pédagogique de calcul BRSS / AMO / AMC / RAC.
 *
 * Méthode générale (mécanique publique du remboursement complémentaire santé,
 * indépendante de tout barème propriétaire) :
 *  - remboursement AMO = BRSS x taux AMO
 *  - garantie AMC exprimée en % BRSS => remboursement total visé = BRSS x taux garanti
 *    remboursement AMC = max(0, remboursement total visé - remboursement AMO), plafonné
 *    par le principe indemnitaire (RAC ne peut pas devenir négatif).
 *  - garantie "frais réels" => AMC comble l'intégralité du solde après AMO.
 *  - garantie exprimée en forfait € => AMC = min(forfait, solde après AMO).
 */

export type GuaranteeMode = "percent_brss" | "frais_reels" | "forfait_euros";

export interface ReimbursementInput {
  billed: number;
  brss: number;
  amoRate: number;
  guaranteeMode: GuaranteeMode;
  guaranteeValue?: number;
}

export interface ReimbursementResult {
  billed: number;
  brss: number;
  amoRate: number;
  amoReimbursement: number;
  ticketModerateur: number;
  amcTargetTotal: number | null;
  amcReimbursement: number;
  remainingCharge: number;
  overBrssNotCovered: number;
  dataToVerify: boolean;
}

export function computeReimbursement(input: ReimbursementInput): ReimbursementResult {
  const { billed, brss, amoRate, guaranteeMode, guaranteeValue } = input;

  if (billed < 0 || brss < 0) {
    throw new Error("Les montants facturés et la BRSS doivent être positifs.");
  }
  if (amoRate < 0 || amoRate > 1) {
    throw new Error("Le taux AMO doit être compris entre 0 et 1.");
  }

  const amoReimbursement = round2(brss * amoRate);
  const ticketModerateur = round2(brss - amoReimbursement);
  const solde = round2(Math.max(0, billed - amoReimbursement));

  let dataToVerify = false;
  let amcTargetTotal: number | null = null;
  let amcReimbursement = 0;

  if (guaranteeMode === "frais_reels") {
    amcReimbursement = solde;
  } else if (guaranteeMode === "forfait_euros") {
    if (guaranteeValue === undefined) {
      dataToVerify = true;
    } else {
      amcReimbursement = round2(Math.min(guaranteeValue, solde));
    }
  } else {
    if (guaranteeValue === undefined) {
      dataToVerify = true;
    } else {
      amcTargetTotal = round2(brss * (guaranteeValue / 100));
      const amcVise = Math.max(0, amcTargetTotal - amoReimbursement);
      amcReimbursement = round2(Math.min(amcVise, solde));
    }
  }

  const remainingCharge = round2(Math.max(0, billed - amoReimbursement - amcReimbursement));
  const overBrssNotCovered = round2(Math.max(0, billed - Math.max(brss, billed)));

  return {
    billed: round2(billed),
    brss: round2(brss),
    amoRate,
    amoReimbursement,
    ticketModerateur,
    amcTargetTotal,
    amcReimbursement,
    remainingCharge,
    overBrssNotCovered,
    dataToVerify,
  };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const AMO_RATE_PRESETS = [
  { id: "soins_courants", label: "Soins courants (généraliste / spécialiste hors ALD)", rate: 0.7 },
  { id: "auxiliaires", label: "Auxiliaires médicaux (infirmier, kiné, sage-femme)", rate: 0.6 },
  { id: "hospitalisation", label: "Hospitalisation", rate: 0.8 },
  { id: "ald", label: "Affection longue durée / maternité", rate: 1 },
  { id: "pharmacie_65", label: "Pharmacie remboursée à 65 %", rate: 0.65 },
  { id: "pharmacie_30", label: "Pharmacie remboursée à 30 %", rate: 0.3 },
  { id: "personnalise", label: "Taux personnalisé", rate: NaN },
] as const;
