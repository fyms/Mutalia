import "server-only";
import { randomUUID } from "node:crypto";
import { ManualHouseholdInputSchema, type ManualHousehold } from "@/lib/domain/manualHouseholds";
import { getHouseholdFormulas } from "@/lib/domain/householdFormulas";
import { db } from "@/lib/db";
import type { DocumentStatus } from "@/lib/domain/constants";
import type { CaseSubmissionResult } from "@/lib/domain/types";

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

export interface RuntimeStoreShape {
  version: 1;
  manualHouseholds?: Record<string, ManualHousehold>;
  documents: Record<string, DocumentState>;
  submissions: Record<string, CaseSubmissionResult[]>;
}

function defaultStore(): RuntimeStoreShape {
  return { version: 1, documents: {}, submissions: {} };
}

// Separate P0 state from the extended historical payload; never overwrite it.
function readStore(owner: string): RuntimeStoreShape {
  if (!owner) throw new Error("Compte requis");
  const row = db.prepare("SELECT payload FROM codex_learner_work WHERE owner=?").get(owner) as {payload: string} | undefined;
  return row ? JSON.parse(row.payload) : defaultStore();
}
function writeStore(owner: string, store: RuntimeStoreShape): void {
  db.prepare("INSERT INTO codex_learner_work(owner,payload) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET payload=excluded.payload").run(owner, JSON.stringify(store));
}
function withStore<T>(owner: string, mutator: (store: RuntimeStoreShape) => T): T {
  return db.transaction(() => {
    const store = readStore(owner);
    const result = mutator(store);
    writeStore(owner, store);
    return result;
  })();
}

function emptyDocumentState(): DocumentState {
  return { viewedAt: [], annotations: [] };
}

export function getDocumentState(owner: string, documentId: string): DocumentState {
  const store = readStore(owner);
  return store.documents[documentId] ?? emptyDocumentState();
}

export async function markDocumentViewed(owner: string, documentId: string): Promise<void> {
  await withStore(owner, (store) => {
    const current = store.documents[documentId] ?? emptyDocumentState();
    current.viewedAt.push(new Date().toISOString());
    store.documents[documentId] = current;
  });
}

export async function setDocumentStatus(owner: string, documentId: string, status: DocumentStatus): Promise<void> {
  await withStore(owner, (store) => {
    const current = store.documents[documentId] ?? emptyDocumentState();
    current.status = status;
    store.documents[documentId] = current;
  });
}

export async function addDocumentAnnotation(
  owner: string,
  documentId: string,
  text: string,
  author: string,
): Promise<void> {
  await withStore(owner, (store) => {
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

export function getViewedDocumentIds(owner: string, documentIds: string[]): Set<string> {
  const store = readStore(owner);
  const viewed = new Set<string>();
  for (const id of documentIds) {
    if ((store.documents[id]?.viewedAt.length ?? 0) > 0) viewed.add(id);
  }
  return viewed;
}

export async function recordSubmission(
  owner: string,
  caseId: string,
  result: CaseSubmissionResult,
): Promise<void> {
  await withStore(owner, (store) => {
    const list = store.submissions[caseId] ?? [];
    list.push(result);
    store.submissions[caseId] = list;
  });
}

export function getSubmissions(owner: string, caseId: string): CaseSubmissionResult[] {
  const store = readStore(owner);
  return store.submissions[caseId] ?? [];
}

export function getLatestSubmission(owner: string, caseId: string): CaseSubmissionResult | undefined {
  const list = getSubmissions(owner, caseId);
  return list[list.length - 1];
}

export function getAllSubmissions(owner: string): Record<string, CaseSubmissionResult[]> {
  return readStore(owner).submissions;
}

/** Réinitialise le prototype (statuts documents, annotations, soumissions) sans toucher aux seeds. */
export async function resetRuntimeStore(owner: string): Promise<void> {
  await withStore(owner, (store) => {
    store.documents = {};
    store.submissions = {};
  });
}

export function recordSubmissionOnce(
  ownerId: string,
  revision: number,
  result: CaseSubmissionResult,
): CaseSubmissionResult {
  return db.transaction(() => {
    const prior = db
      .prepare(
        "SELECT payload FROM codex_submission_receipt WHERE owner=? AND case_id=? AND revision=?",
      )
      .get(ownerId, result.caseId, revision) as { payload: string } | undefined;
    if (prior) return JSON.parse(prior.payload) as CaseSubmissionResult;
    const store = readStore(ownerId);
    store.submissions[result.caseId] = [...(store.submissions[result.caseId] ?? []), result];
    db.prepare(
      "INSERT INTO codex_learner_work(owner,payload) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET payload=excluded.payload",
    ).run(ownerId, JSON.stringify(store));
    db.prepare(
      "INSERT INTO codex_submission_receipt(owner,case_id,revision,payload) VALUES(?,?,?,?)",
    ).run(ownerId, result.caseId, revision, JSON.stringify(result));
    return result;
  })();
}

export function getManualHouseholds(owner: string): ManualHousehold[] {
  return Object.values(readStore(owner).manualHouseholds ?? {}).filter(h => !h.deletedAt);
}

export function createManualHousehold(owner: string, raw: unknown): ManualHousehold {
  const input = ManualHouseholdInputSchema.parse(raw);
  if (!getHouseholdFormulas().some(f => f.key === input.formulaKey))
    throw new Error("Choisissez une formule du référentiel Harmonie 2026.");
  return withStore(owner, store => {
    const now = new Date().toISOString();
    const household: ManualHousehold = {
      ...input, id: `FOY-M-${randomUUID()}`, memberId: `MEM-M-${randomUUID()}`,
      source: "manual", referenceYear: 2026, createdAt: now, updatedAt: now,
      revision: 1, deletedAt: null,
    };
    store.manualHouseholds ??= {};
    store.manualHouseholds[household.id] = household;
    return household;
  });
}
