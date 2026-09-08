export const DATA_TO_VERIFY = "Donnée 2026 à vérifier" as const;

export const ROLES = ["apprenant", "formateur"] as const;
export type Role = (typeof ROLES)[number];

export const ASSISTANCE_LEVELS = [
  "debutant",
  "intermediaire",
  "autonome",
  "expert",
] as const;
export type AssistanceLevel = (typeof ASSISTANCE_LEVELS)[number];

export const ASSISTANCE_LEVEL_LABELS: Record<AssistanceLevel, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  autonome: "Autonome",
  expert: "Expert",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export const ROLE_LABELS: Record<Role, string> = {
  apprenant: "Apprenant",
  formateur: "Formateur",
};

export const MEMBER_ROLE_LABELS: Record<string, string> = {
  adherent: "Adhérent principal",
  conjoint: "Conjoint(e)",
  enfant: "Enfant",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  decompte_amo: "Décompte AMO",
  facture_acquittee: "Facture acquittée",
  ordonnance: "Ordonnance",
  facture_optique: "Facture optique",
  devis_dentaire: "Devis dentaire",
  facture_dentaire: "Facture dentaire",
  devis_optique: "Devis optique",
  demande_pec_hospitaliere: "Demande de prise en charge hospitalière",
  devis_audiologie: "Devis audiologie",
  courrier_reclamation: "Courrier de réclamation",
  rib: "RIB",
  attestation_droits: "Attestation de droits",
  prescription: "Prescription médicale",
};

export const DOCUMENT_STATUS_FLOW = [
  "importe",
  "a_qualifier",
  "associe",
  "controle",
  "conforme",
  "incomplet",
  "anomalie",
  "traite",
  "archive",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUS_FLOW)[number];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  importe: "Importé",
  a_qualifier: "À qualifier",
  associe: "Associé",
  controle: "Contrôlé",
  conforme: "Conforme",
  incomplet: "Incomplet",
  anomalie: "Anomalie",
  traite: "Traité",
  archive: "Archivé",
};

/**
 * Vocabulaire canonique des anomalies (fusion du générateur de cas et des 12 cas seedés),
 * réutilisé par le moteur de scoring et par le futur générateur dynamique (P2).
 */
export const ANOMALY_CODES = [
  "aucune",
  "piece_manquante",
  "doublon",
  "mauvais_beneficiaire",
  "droits_fermes",
  "facture_non_acquittee",
  "ordonnance_absente",
  "incoherence_devis_facture",
  "plafond_a_controler",
  "acte_non_garanti",
  "document_illisible",
  "rib_invalide",
  "date_incoherente",
  "code_acte_a_controler",
  "prescription_manquante",
  "reclamation",
] as const;
export type AnomalyCode = (typeof ANOMALY_CODES)[number];

export const ANOMALY_LABELS: Record<AnomalyCode, string> = {
  aucune: "Aucune anomalie",
  piece_manquante: "Pièce manquante",
  doublon: "Doublon de prestation",
  mauvais_beneficiaire: "Mauvais bénéficiaire",
  droits_fermes: "Droits fermés à la date des soins",
  facture_non_acquittee: "Facture non acquittée",
  ordonnance_absente: "Ordonnance absente",
  incoherence_devis_facture: "Incohérence devis / facture",
  plafond_a_controler: "Plafond annuel à contrôler",
  acte_non_garanti: "Acte non garanti au contrat",
  document_illisible: "Document illisible",
  rib_invalide: "RIB / IBAN invalide",
  date_incoherente: "Date incohérente",
  code_acte_a_controler: "Code acte à contrôler",
  prescription_manquante: "Prescription manquante",
  reclamation: "Réclamation à instruire",
};

export const VALUE_FIELD_LABELS: Record<
  string,
  { label: string; type: "currency" | "number" | "date"; unit?: string }
> = {
  billed: { label: "Montant facturé", type: "currency" },
  brss: { label: "Base de remboursement SS (BRSS)", type: "currency" },
  amo: { label: "Remboursement AMO", type: "currency" },
  devis_total: { label: "Total du devis", type: "currency" },
  monture: { label: "Montant monture", type: "currency" },
  verres: { label: "Montant verres", type: "currency" },
  total: { label: "Total du dossier", type: "currency" },
  nights: { label: "Nombre de nuitées", type: "number", unit: "nuit(s)" },
  room_per_night: { label: "Chambre particulière / nuit", type: "currency" },
  amount: { label: "Montant à retenir", type: "currency" },
  already_used: { label: "Plafond déjà consommé", type: "currency" },
  rights_closed: { label: "Date de fermeture des droits", type: "date" },
  service_date: { label: "Date des soins", type: "date" },
};
