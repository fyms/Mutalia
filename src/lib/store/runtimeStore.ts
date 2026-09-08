import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { DocumentStatus } from "@/lib/domain/constants";
import type { CaseSubmissionResult } from "@/lib/domain/types";

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

export interface RuntimeStoreShape {
  version: 2;
  documents: Record<string, DocumentState>;
  submissions: Record<string, CaseSubmissionResult[]>;
  quizAttempts: Record<string, QuizAttempt[]>;
}

function defaultStore(): RuntimeStoreShape {
  return { version: 2, documents: {}, submissions: {}, quizAttempts: {} };
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

export async function recordSubmission(
  caseId: string,
  result: CaseSubmissionResult,
): Promise<void> {
  await withStore((store) => {
    const list = store.submissions[caseId] ?? [];
    list.push(result);
    store.submissions[caseId] = list;
  });
}

export function getSubmissions(caseId: string): CaseSubmissionResult[] {
  const store = readStore();
  return store.submissions[caseId] ?? [];
}

export function getLatestSubmission(caseId: string): CaseSubmissionResult | undefined {
  const list = getSubmissions(caseId);
  return list[list.length - 1];
}

export function getAllSubmissions(): Record<string, CaseSubmissionResult[]> {
  return readStore().submissions;
}

export async function recordQuizAttempt(moduleId: string, attempt: QuizAttempt): Promise<void> {
  await withStore((store) => {
    const list = store.quizAttempts[moduleId] ?? [];
    list.push(attempt);
    store.quizAttempts[moduleId] = list;
  });
}

export function getQuizAttempts(moduleId: string): QuizAttempt[] {
  const store = readStore();
  return store.quizAttempts[moduleId] ?? [];
}

export function getAllQuizAttempts(): Record<string, QuizAttempt[]> {
  return readStore().quizAttempts;
}

/** Réinitialise le prototype (statuts documents, annotations, soumissions, quiz) sans toucher aux seeds. */
export async function resetRuntimeStore(): Promise<void> {
  await withStore((store) => {
    store.documents = {};
    store.submissions = {};
    store.quizAttempts = {};
  });
}
