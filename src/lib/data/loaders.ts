import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  AnswerKeySchema,
  FaqEntrySchema,
  LexiconEntrySchema,
  TrainingCaseSchema,
  type AcademyModule,
  type AnswerKey,
  type FaqEntry,
  type LexiconEntry,
  type TrainingCase,
} from "@/lib/domain/types";

const SEED_DIR = path.join(process.cwd(), "src", "lib", "data", "seed");
const ANSWER_KEY_DIR = path.join(process.cwd(), "src", "lib", "data", "private", "answer-keys");

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

let casesCache: TrainingCase[] | null = null;
export function getAllCases(): TrainingCase[] {
  if (casesCache) return casesCache;
  const dir = path.join(SEED_DIR, "cases");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  casesCache = files.map((f) => TrainingCaseSchema.parse(readJson(path.join(dir, f))));
  return casesCache;
}

export function getCaseById(caseId: string): TrainingCase | undefined {
  return getAllCases().find((c) => c.case_id === caseId);
}

/** Réservé au serveur : ne jamais transmettre ce résultat brut à un client en mode apprenant. */
export function getAnswerKey(caseId: string): AnswerKey | undefined {
  const filePath = path.join(ANSWER_KEY_DIR, `${caseId}.json`);
  if (!fs.existsSync(filePath)) return undefined;
  return AnswerKeySchema.parse(readJson(filePath));
}

let lexiconCache: LexiconEntry[] | null = null;
export function getLexicon(): LexiconEntry[] {
  if (lexiconCache) return lexiconCache;
  const raw = readJson<unknown[]>(path.join(SEED_DIR, "lexicon.json"));
  lexiconCache = raw.map((e) => LexiconEntrySchema.parse(e));
  return lexiconCache;
}

let faqCache: FaqEntry[] | null = null;
export function getFaq(): FaqEntry[] {
  if (faqCache) return faqCache;
  const raw = readJson<unknown[]>(path.join(SEED_DIR, "faq.json"));
  faqCache = raw.map((e) => FaqEntrySchema.parse(e));
  return faqCache;
}

export interface AcademyCurriculum {
  track: { id: string; title: string };
  levels: string[];
  modules: AcademyModule[];
  lesson_flow: string[];
  scoring_dimensions: string[];
}

let academyCache: AcademyCurriculum | null = null;
export function getAcademyCurriculum(): AcademyCurriculum {
  if (academyCache) return academyCache;
  academyCache = readJson<AcademyCurriculum>(path.join(SEED_DIR, "academy.json"));
  return academyCache;
}

export interface Harmonie2026Referential {
  metadata: {
    provider: string;
    product_family: string;
    reference_year: number;
    verified_on: string;
    scope: string;
    source_of_truth_policy: string;
    official_sources: string[];
  };
  canonical_2026_architecture: {
    regime_general: { formula: string; soins_stars: number; equipements_stars: number }[];
    reflexe_eco_pharmacie_et_chambre: string[];
    reflexe_eco_pharmacie: string[];
    regime_local: { formula: string; soins_stars: number; equipements_stars: number }[];
  };
  verified_live_quote_2026_sample: {
    warning: string;
    compared_formulas: string[];
    benefits: Record<string, string>[];
  };
  training_rules: string[];
}

let harmonieCache: Harmonie2026Referential | null = null;
export function getHarmonieReferential(): Harmonie2026Referential {
  if (harmonieCache) return harmonieCache;
  harmonieCache = readJson<Harmonie2026Referential>(path.join(SEED_DIR, "harmonie-2026.json"));
  return harmonieCache;
}

export interface TrainingMode {
  id: string;
  context_help: string;
  hints: boolean;
  tooltips: string;
}

let trainingModesCache: TrainingMode[] | null = null;
export function getTrainingModes(): TrainingMode[] {
  if (trainingModesCache) return trainingModesCache;
  const raw = readJson<{ modes: TrainingMode[] }>(path.join(SEED_DIR, "training-modes.json"));
  trainingModesCache = raw.modes;
  return trainingModesCache;
}
