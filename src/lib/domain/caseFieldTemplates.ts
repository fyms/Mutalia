/**
 * Champs chiffrés/datés attendus par cas pratique, pour construire le formulaire
 * de résolution côté apprenant. Ce mapping ne provient jamais de la lecture du
 * fichier answer_key.json à l'exécution : il est défini statiquement dans le
 * code applicatif (scaffolding de formulaire), jamais depuis le corrigé privé.
 */
export const CASE_VALUE_FIELDS: Record<string, string[]> = {
  "CASE-001": ["billed", "brss", "amo"],
  "CASE-002": ["devis_total"],
  "CASE-003": ["monture", "verres", "total"],
  "CASE-004": ["total"],
  "CASE-005": ["nights", "room_per_night"],
  "CASE-006": ["amount"],
  "CASE-007": ["amount"],
  "CASE-008": ["billed"],
  "CASE-009": ["total"],
  "CASE-010": [],
  "CASE-011": ["rights_closed", "service_date"],
  "CASE-012": ["amount", "already_used"],
};
