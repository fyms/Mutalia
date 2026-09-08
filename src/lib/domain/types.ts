import { z } from "zod";

export const MemberSchema = z.object({
  member_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  birth_date: z.string(),
  role: z.enum(["adherent", "conjoint", "enfant"]),
  household_id: z.string().optional(),
  synthetic: z.boolean().optional(),
});
export type Member = z.infer<typeof MemberSchema>;

export const HouseholdSchema = z.object({
  household_id: z.string(),
  members: z.array(MemberSchema),
});
export type Household = z.infer<typeof HouseholdSchema>;

export const ContractSchema = z.object({
  provider: z.string(),
  year: z.number(),
  exercise_formula: z.string(),
  status: z.string(),
  synthetic: z.boolean().optional(),
});
export type Contract = z.infer<typeof ContractSchema>;

export const CaseDocumentSchema = z.object({
  document_id: z.string(),
  case_id: z.string(),
  document_type: z.string(),
  file_name: z.string(),
  beneficiary_id: z.string().optional(),
  document_date: z.string().optional(),
  synthetic: z.boolean().optional(),
  status: z.string(),
  anomalies: z.array(z.string()).default([]),
});
export type CaseDocument = z.infer<typeof CaseDocumentSchema>;

export const TrainingCaseSchema = z.object({
  case_id: z.string(),
  seed: z.number().optional(),
  difficulty: z.enum(["debutant", "intermediaire", "avance"]),
  scenario_type: z.string(),
  household: HouseholdSchema,
  target_beneficiary_id: z.string(),
  contract: ContractSchema,
  documents: z.array(CaseDocumentSchema),
  objectives: z.array(z.string()),
  learner_instructions: z.string().optional(),
  visible_in_learner_mode: z.boolean().default(true),
  synthetic: z.boolean().optional(),
});
export type TrainingCase = z.infer<typeof TrainingCaseSchema>;

export const AnswerKeySchema = z.object({
  case_id: z.string(),
  scenario_type: z.string().optional(),
  anomalies: z.array(z.string()).default([]),
  expected_actions: z.array(z.string()).default([]),
  expected_values: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  scoring: z.record(z.string(), z.number()),
  trainer_notes: z.string().optional(),
});
export type AnswerKey = z.infer<typeof AnswerKeySchema>;

export const LexiconEntrySchema = z.object({
  id: z.string(),
  acronym: z.string().optional(),
  term: z.string(),
  category: z.string(),
  level: z.string(),
  definition_simple: z.string(),
  definition_metier: z.string(),
  example: z.string().optional(),
  common_mistake: z.string().optional(),
  related_terms: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  updated_at: z.string().optional(),
});
export type LexiconEntry = z.infer<typeof LexiconEntrySchema>;

export const FaqEntrySchema = z.object({
  id: z.string(),
  question: z.string(),
  category: z.string(),
  short_answer: z.string().default(""),
  detailed_answer: z.string().default(""),
  procedure_steps: z.array(z.string()).default([]),
  documents_required: z.array(z.string()).default([]),
  escalation_conditions: z.array(z.string()).default([]),
  common_mistakes: z.array(z.string()).default([]),
  linked_lexicon_ids: z.array(z.string()).default([]),
  linked_case_ids: z.array(z.string()).default([]),
  level: z.string(),
});
export type FaqEntry = z.infer<typeof FaqEntrySchema>;

export const AcademyModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
});
export type AcademyModule = z.infer<typeof AcademyModuleSchema>;

/** Réponses libres soumises par l'apprenant pour un cas pratique. */
export interface CaseSubmissionInput {
  caseId: string;
  completedObjectives: string[];
  selectedAnomalies: string[];
  values: Record<string, string>;
  explanation: string;
}

export interface CaseSubmissionResult {
  caseId: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  breakdown: {
    dimension: string;
    label: string;
    points: number;
    maxPoints: number;
    comment: string;
  }[];
  correction: {
    anomalies: string[];
    expectedActions: string[];
    expectedValues: Record<string, string | number>;
    trainerNotes?: string;
  };
}

/**
 * Retour envoyé au client en mode apprenant : score et commentaires dérivés
 * uniquement, jamais le contenu brut du corrigé (`correction`).
 */
export type LearnerFeedback = Omit<CaseSubmissionResult, "correction">;
