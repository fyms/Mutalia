import type { AnswerKey, CaseDocument, Member, TrainingCase } from "@/lib/domain/types";
import type { AnomalyCode } from "@/lib/domain/constants";

/**
 * Générateur pédagogique de cas dynamiques, port TypeScript du principe de
 * `docs/mutalia-spec/generator/generate_cases.py` : mêmes familles de scénarios et
 * d'anomalies, mêmes réserves de prénoms/noms fictifs, seed obligatoire pour la
 * reproductibilité. Ne génère jamais d'identifiant administratif ou bancaire valide.
 */

const FIRST_NAMES = [
  "Nadia", "Sophie", "Élodie", "Aïcha", "Camille", "Julie", "Fatou", "Claire", "Lina", "Sarah",
  "Thomas", "Karim", "Julien", "Marc", "David", "Mehdi", "Lucas", "Nicolas", "Yann", "Hugo",
];
const LAST_NAMES = [
  "Benali", "Martin", "Durand", "Morel", "Diallo", "Petit", "Lefèvre", "Robert", "Garnier", "Mercier",
  "Roux", "Fontaine",
];

interface ScenarioTemplate {
  scenarioType: string;
  documentTypes: string[];
  anomalies: AnomalyCode[];
  objectives: string[];
  valueFields: { key: string; min: number; max: number }[];
  difficulty: "debutant" | "intermediaire" | "avance";
}

const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    scenarioType: "consultation_specialiste",
    documentTypes: ["decompte_amo", "facture_acquittee"],
    anomalies: [],
    objectives: ["Identifier BRSS et remboursement AMO", "Appliquer la garantie d exercice", "Calculer le reste à charge"],
    valueFields: [{ key: "billed", min: 50, max: 150 }, { key: "brss", min: 25, max: 46 }],
    difficulty: "debutant",
  },
  {
    scenarioType: "orthodontie_enfant",
    documentTypes: ["devis_dentaire"],
    anomalies: ["code_acte_a_controler"],
    objectives: ["Contrôler l âge et l accord préalable", "Identifier le code acte", "Vérifier la garantie orthodontie"],
    valueFields: [{ key: "devis_total", min: 800, max: 1600 }],
    difficulty: "intermediaire",
  },
  {
    scenarioType: "optique_conjoint",
    documentTypes: ["ordonnance", "facture_optique"],
    anomalies: [],
    objectives: ["Vérifier l ordonnance", "Distinguer monture et verres", "Calculer le total du devis"],
    valueFields: [{ key: "monture", min: 60, max: 180 }, { key: "verres", min: 150, max: 400 }],
    difficulty: "intermediaire",
  },
  {
    scenarioType: "hospitalisation",
    documentTypes: ["demande_pec_hospitaliere"],
    anomalies: [],
    objectives: ["Contrôler les droits", "Vérifier la garantie hospitalisation", "Calculer la limite de chambre particulière"],
    valueFields: [{ key: "nights", min: 1, max: 6 }, { key: "room_per_night", min: 60, max: 90 }],
    difficulty: "intermediaire",
  },
  {
    scenarioType: "audiologie",
    documentTypes: ["devis_audiologie"],
    anomalies: ["prescription_manquante"],
    objectives: ["Repérer la prescription manquante", "Contrôler la classe d appareil", "Chiffrer le montant à retenir"],
    valueFields: [{ key: "amount", min: 900, max: 1700 }],
    difficulty: "avance",
  },
  {
    scenarioType: "reclamation",
    documentTypes: ["courrier_reclamation"],
    anomalies: ["reclamation"],
    objectives: ["Recontrôler le dossier initial", "Recalculer le remboursement", "Répondre avec une explication précise"],
    valueFields: [{ key: "billed", min: 60, max: 200 }],
    difficulty: "intermediaire",
  },
  {
    scenarioType: "piece_manquante",
    documentTypes: ["facture_optique"],
    anomalies: ["piece_manquante"],
    objectives: ["Identifier la pièce manquante", "Mettre le dossier en attente", "Formuler une demande de complément"],
    valueFields: [{ key: "total", min: 100, max: 500 }],
    difficulty: "debutant",
  },
  {
    scenarioType: "doublon",
    documentTypes: ["facture_optique", "facture_optique"],
    anomalies: ["doublon"],
    objectives: ["Détecter le doublon", "Ne pas liquider deux fois", "Tracer l anomalie"],
    valueFields: [{ key: "total", min: 200, max: 600 }],
    difficulty: "intermediaire",
  },
  {
    scenarioType: "mauvais_beneficiaire",
    documentTypes: ["facture_acquittee"],
    anomalies: ["mauvais_beneficiaire"],
    objectives: ["Repérer le mauvais bénéficiaire", "Ne pas traiter sur le dossier courant", "Réaffecter ou demander clarification"],
    valueFields: [{ key: "amount", min: 40, max: 150 }],
    difficulty: "intermediaire",
  },
  {
    scenarioType: "droits_fermes",
    documentTypes: ["attestation_droits"],
    anomalies: ["droits_fermes"],
    objectives: ["Comparer date des soins et période de droits", "Refuser traitement automatique", "Rechercher mise à jour ou expliquer"],
    valueFields: [],
    difficulty: "avance",
  },
  {
    scenarioType: "rib_invalide",
    documentTypes: ["rib"],
    anomalies: ["rib_invalide"],
    objectives: ["Repérer IBAN invalide", "Ne pas l enregistrer comme moyen réel", "Demander un RIB conforme dans le scénario"],
    valueFields: [],
    difficulty: "debutant",
  },
  {
    scenarioType: "plafond_a_controler",
    documentTypes: ["devis_dentaire"],
    anomalies: ["plafond_a_controler"],
    objectives: ["Récupérer le plafond 2026", "Tenir compte de la consommation", "Calculer le disponible", "Expliquer le RAC"],
    valueFields: [{ key: "amount", min: 800, max: 1500 }, { key: "already_used", min: 100, max: 700 }],
    difficulty: "avance",
  },
];

/** PRNG déterministe (mulberry32) : même seed => même séquence, sur toute plateforme. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomBirthDate(rng: () => number, minAge: number, maxAge: number): string {
  const age = randomInt(rng, minAge, maxAge);
  const year = new Date().getFullYear() - age;
  const month = randomInt(rng, 1, 12);
  const day = randomInt(rng, 1, 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function randomDate2026(rng: () => number): string {
  const month = randomInt(rng, 1, 8);
  const day = randomInt(rng, 1, 28);
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export interface GeneratedCase {
  trainingCase: TrainingCase;
  answerKey: AnswerKey;
}

export function generateCase(seed: number, sequence: number): GeneratedCase {
  const rng = createRng(seed + sequence * 7919);
  const caseId = `CASE-GEN-${seed}-${String(sequence).padStart(3, "0")}`;
  const householdId = `FOY-GEN-${seed}-${sequence}`;
  const template = pick(rng, SCENARIO_TEMPLATES);

  const adherent: Member = {
    member_id: `${householdId}-A`,
    first_name: pick(rng, FIRST_NAMES),
    last_name: pick(rng, LAST_NAMES),
    birth_date: randomBirthDate(rng, 28, 68),
    role: "adherent",
    household_id: householdId,
    synthetic: true,
  };
  const conjoint: Member = {
    member_id: `${householdId}-B`,
    first_name: pick(rng, FIRST_NAMES),
    last_name: pick(rng, LAST_NAMES),
    birth_date: randomBirthDate(rng, 26, 68),
    role: "conjoint",
    household_id: householdId,
    synthetic: true,
  };
  const members: Member[] = [adherent, conjoint];
  const childCount = randomInt(rng, 0, 2);
  for (let i = 0; i < childCount; i++) {
    members.push({
      member_id: `${householdId}-C${i + 1}`,
      first_name: pick(rng, FIRST_NAMES),
      last_name: pick(rng, LAST_NAMES),
      birth_date: randomBirthDate(rng, 0, 17),
      role: "enfant",
      household_id: householdId,
      synthetic: true,
    });
  }

  const targetBeneficiary = pick(rng, members);

  const documents: CaseDocument[] = template.documentTypes.map((docType, idx) => ({
    document_id: `${caseId}-${String(idx + 1).padStart(2, "0")}`,
    case_id: caseId,
    document_type: docType,
    file_name: `${String(idx + 1).padStart(2, "0")}_${docType}${idx > 0 && template.documentTypes[0] === docType ? "_doublon" : ""}.pdf`,
    beneficiary_id: targetBeneficiary.member_id,
    document_date: randomDate2026(rng),
    synthetic: true,
    status: "importe",
    anomalies: template.anomalies,
  }));

  const expectedValues: Record<string, string | number> = {};
  for (const field of template.valueFields) {
    expectedValues[field.key] = randomInt(rng, field.min, field.max);
  }

  const trainingCase: TrainingCase = {
    case_id: caseId,
    seed,
    difficulty: template.difficulty,
    scenario_type: template.scenarioType,
    household: { household_id: householdId, members },
    target_beneficiary_id: targetBeneficiary.member_id,
    contract: {
      provider: "Harmonie Mutuelle",
      year: 2026,
      exercise_formula: "À lier au référentiel 2026",
      status: "actif",
      synthetic: true,
    },
    documents,
    objectives: template.objectives,
    learner_instructions: "Traiter le dossier sans consulter answer_key.json.",
    visible_in_learner_mode: true,
    synthetic: true,
  };

  const answerKey: AnswerKey = {
    case_id: caseId,
    scenario_type: template.scenarioType,
    anomalies: template.anomalies,
    expected_actions: template.objectives,
    expected_values: expectedValues,
    scoring: {
      document_reading: 20,
      anomaly_detection: 25,
      procedure: 25,
      calculation_or_analysis: 20,
      explanation: 10,
    },
    trainer_notes: "Cas généré dynamiquement. Utiliser le référentiel 2026 pour toute valeur contractuelle exacte.",
  };

  return { trainingCase, answerKey };
}
