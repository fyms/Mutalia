import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { ComplaintStatus, CotisationStatus, DocumentStatus } from "@/lib/domain/constants";
import type { AnswerKey, CaseSubmissionResult, TrainingCase } from "@/lib/domain/types";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "runtime-store.json");

export interface DocumentAnnotation {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface DocumentState {
  status?: DocumentStatus;
  viewedAt: string[];
  annotations: DocumentAnnotation[];
}

export interface QuizAttempt {
  score: number;
  maxScore: number;
  submittedAt: string;
}

export const DEFAULT_PROFILE_ID = "default";

export interface LearnerProfile {
  id: string;
  name: string;
  createdAt: string;
}

export interface ComplaintRecord {
  id: string;
  householdId: string;
  caseId?: string;
  motif: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolutionNote?: string;
}

export interface CotisationState {
  status: CotisationStatus;
  updatedAt: string;
  note?: string;
}

export interface PecRecord {
  id: string;
  householdId: string;
  caseId?: string;
  beneficiaryId: string;
  acte: string;
  etablissement: string;
  dateSoins: string;
  montantGaranti: number | null;
  createdAt: string;
  createdBy: string;
}

export const FLUX_EVENT_TYPES = ["teletransmission_simulee", "retour_anomalie", "controle_manuel"] as const;
export type FluxEventType = (typeof FLUX_EVENT_TYPES)[number];

export interface FluxEvent {
  id: string;
  type: FluxEventType;
  documentId?: string;
  caseId?: string;
  label: string;
  createdAt: string;
}

export interface GeneratedCaseRecord {
  case: TrainingCase;
  answerKey: AnswerKey;
  seed: number;
  createdAt: string;
}

const RUNTIME_STORE_VERSION = 4;

export interface RuntimeStoreShape {
  version: typeof RUNTIME_STORE_VERSION;
  documents: Record<string, DocumentState>;
  /** Soumissions par profil apprenant, puis par cas — permet un pilotage multi-apprenants réel. */
  submissions: Record<string, Record<string, CaseSubmissionResult[]>>;
  /** Tentatives de quiz par profil apprenant, puis par module. */
  quizAttempts: Record<string, Record<string, QuizAttempt[]>>;
  profiles: Record<string, LearnerProfile>;
  complaints: ComplaintRecord[];
  cotisations: Record<string, CotisationState>;
  pecRecords: PecRecord[];
  fluxEvents: FluxEvent[];
  generatedCases: Record<string, GeneratedCaseRecord>;
}

function defaultStore(): RuntimeStoreShape {
  return {
    version: RUNTIME_STORE_VERSION,
    documents: {},
    submissions: {},
    quizAttempts: {},
    profiles: {},
    complaints: [],
    cotisations: {},
    pecRecords: [],
    fluxEvents: [],
    generatedCases: {},
  };
}

/** Initialise le fichier de persistance de manière idempotente (ne réécrit rien s'il existe déjà). */
function ensureStoreFile(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(defaultStore(), null, 2), "utf-8");
  }
}

function readStore(): RuntimeStoreShape {
  ensureStoreFile();
  const raw = fs.readFileSync(STORE_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Partial<RuntimeStoreShape>;
    // Un changement de version de schéma (ex. passage des soumissions à un
    // scope par profil apprenant) rend l'ancienne forme incompatible : on
    // repart d'un store vide plutôt que de fusionner des données mal formées.
    if (parsed.version !== RUNTIME_STORE_VERSION) {
      return defaultStore();
    }
    return { ...defaultStore(), ...parsed };
  } catch {
    return defaultStore();
  }
}

function writeStore(store: RuntimeStoreShape): void {
  ensureStoreFile();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

/** Sérialise les écritures pour éviter les écrasements concurrents (process Node unique en développement). */
let writeQueue: Promise<unknown> = Promise.resolve();
function withStore<T>(mutator: (store: RuntimeStoreShape) => T): Promise<T> {
  const run = writeQueue.then(() => {
    const store = readStore();
    const result = mutator(store);
    writeStore(store);
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

function emptyDocumentState(): DocumentState {
  return { viewedAt: [], annotations: [] };
}

export function getDocumentState(documentId: string): DocumentState {
  const store = readStore();
  return store.documents[documentId] ?? emptyDocumentState();
}

export async function markDocumentViewed(documentId: string): Promise<void> {
  await withStore((store) => {
    const current = store.documents[documentId] ?? emptyDocumentState();
    current.viewedAt.push(new Date().toISOString());
    store.documents[documentId] = current;
  });
}

export async function setDocumentStatus(documentId: string, status: DocumentStatus): Promise<void> {
  await withStore((store) => {
    const current = store.documents[documentId] ?? emptyDocumentState();
    current.status = status;
    store.documents[documentId] = current;
    if (status === "anomalie") {
      store.fluxEvents.push({
        id: `FLUX-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        type: "retour_anomalie",
        documentId,
        label: `Retour en anomalie simulé sur le document ${documentId}`,
        createdAt: new Date().toISOString(),
      });
    }
  });
}

export async function addDocumentAnnotation(
  documentId: string,
  text: string,
  author: string,
): Promise<void> {
  await withStore((store) => {
    const current = store.documents[documentId] ?? emptyDocumentState();
    current.annotations.push({
      id: `ANNOT-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      text,
      author,
      createdAt: new Date().toISOString(),
    });
    store.documents[documentId] = current;
  });
}

export function getViewedDocumentIds(documentIds: string[]): Set<string> {
  const store = readStore();
  const viewed = new Set<string>();
  for (const id of documentIds) {
    if ((store.documents[id]?.viewedAt.length ?? 0) > 0) viewed.add(id);
  }
  return viewed;
}

function ensureProfileRecord(store: RuntimeStoreShape, profileId: string): void {
  if (store.profiles[profileId]) return;
  store.profiles[profileId] = {
    id: profileId,
    name: profileId === DEFAULT_PROFILE_ID ? "Apprenant" : profileId,
    createdAt: new Date().toISOString(),
  };
}

export async function createProfile(name: string): Promise<LearnerProfile> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Le nom du profil est requis.");
  const id = `profil-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const profile: LearnerProfile = { id, name: trimmed, createdAt: new Date().toISOString() };
  await withStore((store) => {
    store.profiles[id] = profile;
  });
  return profile;
}

export function getProfiles(): LearnerProfile[] {
  const store = readStore();
  ensureProfileRecord(store, DEFAULT_PROFILE_ID);
  return Object.values(store.profiles).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export function getProfile(profileId: string): LearnerProfile {
  const store = readStore();
  return (
    store.profiles[profileId] ?? {
      id: profileId,
      name: profileId === DEFAULT_PROFILE_ID ? "Apprenant" : profileId,
      createdAt: new Date(0).toISOString(),
    }
  );
}

export async function recordSubmission(
  profileId: string,
  caseId: string,
  result: CaseSubmissionResult,
): Promise<void> {
  await withStore((store) => {
    ensureProfileRecord(store, profileId);
    const byCase = store.submissions[profileId] ?? {};
    const list = byCase[caseId] ?? [];
    list.push(result);
    byCase[caseId] = list;
    store.submissions[profileId] = byCase;
  });
}

export function getSubmissions(profileId: string, caseId: string): CaseSubmissionResult[] {
  const store = readStore();
  return store.submissions[profileId]?.[caseId] ?? [];
}

export function getLatestSubmission(profileId: string, caseId: string): CaseSubmissionResult | undefined {
  const list = getSubmissions(profileId, caseId);
  return list[list.length - 1];
}

/** Soumissions du profil demandé, par cas. */
export function getSubmissionsForProfile(profileId: string): Record<string, CaseSubmissionResult[]> {
  return readStore().submissions[profileId] ?? {};
}

/** Toutes les soumissions, tous profils confondus — réservé au pilotage formateur. */
export function getAllSubmissions(): Record<string, Record<string, CaseSubmissionResult[]>> {
  return readStore().submissions;
}

export async function recordQuizAttempt(
  profileId: string,
  moduleId: string,
  attempt: QuizAttempt,
): Promise<void> {
  await withStore((store) => {
    ensureProfileRecord(store, profileId);
    const byModule = store.quizAttempts[profileId] ?? {};
    const list = byModule[moduleId] ?? [];
    list.push(attempt);
    byModule[moduleId] = list;
    store.quizAttempts[profileId] = byModule;
  });
}

export function getQuizAttempts(profileId: string, moduleId: string): QuizAttempt[] {
  const store = readStore();
  return store.quizAttempts[profileId]?.[moduleId] ?? [];
}

export function getQuizAttemptsForProfile(profileId: string): Record<string, QuizAttempt[]> {
  return readStore().quizAttempts[profileId] ?? {};
}

/** Toutes les tentatives de quiz, tous profils confondus — réservé au pilotage formateur. */
export function getAllQuizAttempts(): Record<string, Record<string, QuizAttempt[]>> {
  return readStore().quizAttempts;
}

export async function createComplaint(input: {
  householdId: string;
  caseId?: string;
  motif: string;
}): Promise<ComplaintRecord> {
  const now = new Date().toISOString();
  const record: ComplaintRecord = {
    id: `RECL-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    householdId: input.householdId,
    caseId: input.caseId,
    motif: input.motif,
    status: "ouverte",
    createdAt: now,
    updatedAt: now,
  };
  await withStore((store) => {
    store.complaints.push(record);
  });
  return record;
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  resolutionNote?: string,
): Promise<void> {
  await withStore((store) => {
    const record = store.complaints.find((c) => c.id === id);
    if (!record) return;
    record.status = status;
    record.updatedAt = new Date().toISOString();
    if (resolutionNote) record.resolutionNote = resolutionNote;
  });
}

export function getComplaints(householdId?: string): ComplaintRecord[] {
  const store = readStore();
  return householdId ? store.complaints.filter((c) => c.householdId === householdId) : store.complaints;
}

export async function setCotisationStatus(
  householdId: string,
  status: CotisationStatus,
  note?: string,
): Promise<void> {
  await withStore((store) => {
    store.cotisations[householdId] = { status, updatedAt: new Date().toISOString(), note };
  });
}

export function getCotisationState(householdId: string): CotisationState {
  const store = readStore();
  return store.cotisations[householdId] ?? { status: "a_jour", updatedAt: new Date(0).toISOString() };
}

export function getAllCotisationStates(): Record<string, CotisationState> {
  return readStore().cotisations;
}

export async function createPecRecord(
  input: Omit<PecRecord, "id" | "createdAt">,
): Promise<PecRecord> {
  const record: PecRecord = {
    ...input,
    id: `PEC-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  await withStore((store) => {
    store.pecRecords.push(record);
  });
  return record;
}

export function getPecRecords(householdId?: string): PecRecord[] {
  const store = readStore();
  return householdId ? store.pecRecords.filter((p) => p.householdId === householdId) : store.pecRecords;
}

export async function logFluxEvent(input: Omit<FluxEvent, "id" | "createdAt">): Promise<void> {
  await withStore((store) => {
    store.fluxEvents.push({
      ...input,
      id: `FLUX-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    });
  });
}

export function getFluxEvents(): FluxEvent[] {
  return readStore().fluxEvents.slice().reverse();
}

export async function saveGeneratedCase(record: GeneratedCaseRecord): Promise<void> {
  await withStore((store) => {
    store.generatedCases[record.case.case_id] = record;
  });
}

export function getGeneratedCases(): GeneratedCaseRecord[] {
  return Object.values(readStore().generatedCases);
}

export function getGeneratedCase(caseId: string): GeneratedCaseRecord | undefined {
  return readStore().generatedCases[caseId];
}

/** Réinitialise le prototype (statuts documents, annotations, soumissions, quiz, profils, P2) sans toucher aux seeds. */
export async function resetRuntimeStore(): Promise<void> {
  await withStore((store) => {
    store.documents = {};
    store.submissions = {};
    store.quizAttempts = {};
    store.profiles = {};
    store.complaints = [];
    store.cotisations = {};
    store.pecRecords = [];
    store.fluxEvents = [];
    store.generatedCases = {};
  });
}
