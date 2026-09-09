import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { ComplaintStatus, CotisationStatus, DocumentStatus, Role } from "@/lib/domain/constants";
import type { AnswerKey, CaseSubmissionResult, Household, TrainingCase } from "@/lib/domain/types";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

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

export interface LearnerProfile {
  id: string;
  name: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: Role;
  displayName: string;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export const CLIENT_STATUSES = ["prospect", "actif", "resilie"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export interface ClientRecord {
  id: string;
  household: Household;
  formulaCode: string | null;
  formulaCatalog: "psi_general" | "psi_local" | "pli_verifie" | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface QuoteRecord {
  id: string;
  clientId: string;
  formulaCode: string;
  formulaCatalog: "psi_general" | "psi_local" | "pli_verifie";
  monthlyPremium: number | null;
  createdAt: string;
  createdBy: string;
  validUntil: string;
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

const RUNTIME_STORE_VERSION = 5;

export interface RuntimeStoreShape {
  version: typeof RUNTIME_STORE_VERSION;
  documents: Record<string, DocumentState>;
  /** Soumissions par profil apprenant (= identifiant de compte), puis par cas. */
  submissions: Record<string, Record<string, CaseSubmissionResult[]>>;
  /** Tentatives de quiz par profil apprenant, puis par module. */
  quizAttempts: Record<string, Record<string, QuizAttempt[]>>;
  users: Record<string, UserAccount>;
  sessions: Record<string, SessionRecord>;
  clients: Record<string, ClientRecord>;
  quotes: Record<string, QuoteRecord>;
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
    users: {},
    sessions: {},
    clients: {},
    quotes: {},
    complaints: [],
    cotisations: {},
    pecRecords: [],
    fluxEvents: [],
    generatedCases: {},
  };
}

/** Comptes de démonstration créés une seule fois, à l'initialisation du magasin (mots de passe fictifs). */
function seedDemoUsers(): Record<string, UserAccount> {
  const now = new Date().toISOString();
  const accounts: Array<{ id: string; email: string; password: string; displayName: string; role: Role }> = [
    {
      id: "usr-demo-formateur",
      email: "formateur.demo@mutalia.local",
      password: "Formateur2026!",
      displayName: "Formateur Démo",
      role: "formateur",
    },
    {
      id: "usr-demo-apprenant",
      email: "apprenant.demo@mutalia.local",
      password: "Apprenant2026!",
      displayName: "Apprenant Démo",
      role: "apprenant",
    },
  ];
  const users: Record<string, UserAccount> = {};
  for (const account of accounts) {
    const { hash, salt } = hashPassword(account.password);
    users[account.id] = {
      id: account.id,
      email: account.email,
      passwordHash: hash,
      passwordSalt: salt,
      role: account.role,
      displayName: account.displayName,
      createdAt: now,
    };
  }
  return users;
}

/** Initialise le fichier de persistance de manière idempotente (ne réécrit rien s'il existe déjà). */
function ensureStoreFile(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    const store = defaultStore();
    store.users = seedDemoUsers();
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  }
}

function readStore(): RuntimeStoreShape {
  ensureStoreFile();
  const raw = fs.readFileSync(STORE_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Partial<RuntimeStoreShape>;
    // Un changement de version de schéma (ex. passage des soumissions à un
    // scope par profil apprenant) rend l'ancienne forme incompatible : on
    // repart d'un store vide (re-seedé et persisté immédiatement, de façon
    // idempotente) plutôt que de fusionner des données mal formées.
    if (parsed.version !== RUNTIME_STORE_VERSION) {
      const fresh = defaultStore();
      fresh.users = seedDemoUsers();
      writeStore(fresh);
      return fresh;
    }
    return { ...defaultStore(), ...parsed };
  } catch {
    const fresh = defaultStore();
    fresh.users = seedDemoUsers();
    writeStore(fresh);
    return fresh;
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

/**
 * Un « profil apprenant » (utilisé pour le scope des soumissions/quiz et le
 * pilotage multi-apprenants) correspond désormais à un compte utilisateur réel :
 * il n'existe plus de profil libre sans authentification.
 */
export function getProfiles(): LearnerProfile[] {
  const store = readStore();
  return Object.values(store.users)
    .map((u) => ({ id: u.id, name: u.displayName, createdAt: u.createdAt }))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export function getProfile(profileId: string): LearnerProfile {
  const store = readStore();
  const user = store.users[profileId];
  return user
    ? { id: user.id, name: user.displayName, createdAt: user.createdAt }
    : { id: profileId, name: profileId, createdAt: new Date(0).toISOString() };
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(input: {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}): Promise<UserAccount> {
  const email = normaliseEmail(input.email);
  if (!email || !input.password || !input.displayName.trim()) {
    throw new Error("Email, mot de passe et nom sont requis.");
  }
  if (input.password.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }
  return withStore((store) => {
    const exists = Object.values(store.users).some((u) => u.email === email);
    if (exists) {
      throw new Error("Un compte existe déjà avec cet email.");
    }
    const { hash, salt } = hashPassword(input.password);
    const user: UserAccount = {
      id: `usr-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      role: input.role,
      displayName: input.displayName.trim(),
      createdAt: new Date().toISOString(),
    };
    store.users[user.id] = user;
    return user;
  });
}

export function getUserByEmail(email: string): UserAccount | undefined {
  const normalised = normaliseEmail(email);
  return Object.values(readStore().users).find((u) => u.email === normalised);
}

export function getUserById(userId: string): UserAccount | undefined {
  return readStore().users[userId];
}

export function getAllUsers(): UserAccount[] {
  return Object.values(readStore().users).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export async function verifyCredentials(email: string, password: string): Promise<UserAccount | null> {
  const user = getUserByEmail(email);
  if (!user) return null;
  const ok = verifyPassword(password, user.passwordHash, user.passwordSalt);
  return ok ? user : null;
}

export async function createSession(userId: string): Promise<string> {
  const id = `sess-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const now = new Date();
  const record: SessionRecord = {
    id,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
  };
  await withStore((store) => {
    store.sessions[id] = record;
  });
  return id;
}

export function getValidSession(sessionId: string): SessionRecord | undefined {
  const record = readStore().sessions[sessionId];
  if (!record) return undefined;
  if (new Date(record.expiresAt).getTime() < Date.now()) return undefined;
  return record;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await withStore((store) => {
    delete store.sessions[sessionId];
  });
}

export async function recordSubmission(
  profileId: string,
  caseId: string,
  result: CaseSubmissionResult,
): Promise<void> {
  await withStore((store) => {
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

export async function createClient(input: {
  household: Household;
  createdBy: string;
}): Promise<ClientRecord> {
  const now = new Date().toISOString();
  const record: ClientRecord = {
    id: `CLI-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    household: input.household,
    formulaCode: null,
    formulaCatalog: null,
    status: "prospect",
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
  };
  await withStore((store) => {
    store.clients[record.id] = record;
  });
  return record;
}

export async function updateClient(
  clientId: string,
  updates: Partial<Pick<ClientRecord, "household" | "formulaCode" | "formulaCatalog" | "status">>,
): Promise<ClientRecord> {
  return withStore((store) => {
    const record = store.clients[clientId];
    if (!record) throw new Error("Client introuvable.");
    Object.assign(record, updates, { updatedAt: new Date().toISOString() });
    return record;
  });
}

export async function deleteClient(clientId: string): Promise<void> {
  await withStore((store) => {
    delete store.clients[clientId];
    for (const quoteId of Object.keys(store.quotes)) {
      if (store.quotes[quoteId].clientId === clientId) delete store.quotes[quoteId];
    }
  });
}

export function getClients(): ClientRecord[] {
  return Object.values(readStore().clients).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getClientById(clientId: string): ClientRecord | undefined {
  return readStore().clients[clientId];
}

export async function createQuote(input: Omit<QuoteRecord, "id" | "createdAt">): Promise<QuoteRecord> {
  const record: QuoteRecord = {
    ...input,
    id: `DEV-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  await withStore((store) => {
    store.quotes[record.id] = record;
  });
  return record;
}

export function getQuotes(clientId?: string): QuoteRecord[] {
  const store = readStore();
  const all = Object.values(store.quotes).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return clientId ? all.filter((q) => q.clientId === clientId) : all;
}

export function getQuoteById(quoteId: string): QuoteRecord | undefined {
  return readStore().quotes[quoteId];
}

/** Réinitialise les données de démonstration (statuts documents, soumissions, quiz, portefeuille clients, P2)
 *  sans toucher aux seeds pédagogiques ni aux comptes utilisateurs / sessions. */
export async function resetRuntimeStore(): Promise<void> {
  await withStore((store) => {
    store.documents = {};
    store.submissions = {};
    store.quizAttempts = {};
    store.clients = {};
    store.quotes = {};
    store.complaints = [];
    store.cotisations = {};
    store.pecRecords = [];
    store.fluxEvents = [];
    store.generatedCases = {};
  });
}
