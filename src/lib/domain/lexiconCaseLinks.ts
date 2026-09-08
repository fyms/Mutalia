/**
 * Association pédagogique entre une catégorie de lexique et un cas pratique
 * dont le scénario illustre concrètement la notion (bouton « Voir dans un cas
 * pratique »). Uniquement renseigné lorsque le lien est réel et vérifiable
 * dans les 12 cas seedés.
 */
export const LEXICON_CATEGORY_TO_CASE: Record<string, string> = {
  Remboursement: "CASE-001",
  Optique: "CASE-003",
  Dentaire: "CASE-002",
  Hospitalisation: "CASE-005",
  Audiologie: "CASE-006",
  Adhésion: "CASE-007",
  GED: "CASE-004",
  "100 % Santé": "CASE-002",
  Cotisations: "CASE-010",
  Contrat: "CASE-011",
};
