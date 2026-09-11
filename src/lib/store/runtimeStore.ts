import { getAllCases } from "@/lib/data/loaders";
import { LifecycleChangeSchema, emptyLifecycle, activeLifecycle, type HouseholdLifecycle } from "@/lib/domain/householdLifecycle";
import { complaintTransitions, type Contact, type Complaint } from "@/lib/domain/relationAdherent";
import { cotisationSummary, type Cotisation } from "@/lib/domain/cotisations";
import { isRefused, type DevisPec } from "@/lib/domain/devisPec";
import { describeControl, AnomalyUpdateSchema, type OperationalAnomaly } from "@/lib/domain/operationalAnomalies";
import type { Prestation } from "@/lib/domain/prestations";
import { DossierStateSchema, type DossierState } from "@/lib/domain/dossiers";
import "server-only";
import { randomUUID } from "node:crypto";
import { BeneficiaryInputSchema, ManualHouseholdInputSchema, type ManualHousehold } from "@/lib/domain/manualHouseholds";
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
  householdLifecycles?: Record<string, HouseholdLifecycle>;
  contacts?: Record<string, Contact>;
  complaints?: Record<string, Complaint>;
  cotisations?: Record<string, Cotisation>;
  operationalAnomalies?: Record<string, OperationalAnomaly>;
  devisPec?: Record<string, DevisPec>;
  prestations?: Record<string, Prestation>;
  dossiers?: Record<string, DossierState>;
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
    const seedIds = new Set(getAllCases().map(c => c.household.household_id));
    for (const id of Object.keys(store.householdLifecycles ?? {})) if (seedIds.has(id)) delete store.householdLifecycles![id];
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

export class HouseholdEditError extends Error {}
function editManualHousehold(owner: string, id: string, revision: number, edit: (h: ManualHousehold) => void) {
  return withStore(owner, store => {
    const h = store.manualHouseholds?.[id];
    if (!h || h.deletedAt || h.source !== "manual") throw new HouseholdEditError("Foyer introuvable.");
    if (!Number.isInteger(revision) || h.revision !== revision)
      throw new HouseholdEditError("Le foyer a changé dans un autre onglet. Rechargez la fiche avant de reprendre.");
    edit(h);
    h.revision++;
    h.updatedAt = new Date().toISOString();
    return h;
  });
}
export function updateManualHousehold(owner: string, id: string, revision: number, raw: unknown) {
  const input = ManualHouseholdInputSchema.parse(raw);
  if (!getHouseholdFormulas().some(f => f.key === input.formulaKey))
    throw new HouseholdEditError("Choisissez une formule du référentiel Harmonie 2026.");
  return editManualHousehold(owner, id, revision, h => { Object.assign(h, input); });
}
export function saveManualBeneficiary(owner: string, id: string, revision: number, beneficiaryId: string | null, raw: unknown) {
  const input = BeneficiaryInputSchema.parse(raw);
  return editManualHousehold(owner, id, revision, h => {
    h.beneficiaries ??= [];
    if (beneficiaryId) {
      const b = h.beneficiaries.find(b => b.id === beneficiaryId);
      if (!b) throw new HouseholdEditError("Bénéficiaire introuvable.");
      Object.assign(b, input);
    } else h.beneficiaries.push({...input, id: `MEM-M-${randomUUID()}`});
  });
}
export function removeManualBeneficiary(owner: string, id: string, revision: number, beneficiaryId: string) {
  return editManualHousehold(owner, id, revision, h => {
    if (!h.beneficiaries?.some(b => b.id === beneficiaryId)) throw new HouseholdEditError("Bénéficiaire introuvable.");
    throw new HouseholdEditError("Utilisez Modifier le statut : aucun bénéficiaire ne peut être supprimé.");
  });
}

export function getDossierStates(owner: string): Record<string, DossierState> {
  return readStore(owner).dossiers ?? {};
}
export function saveDossierState(owner: string, id: string, revision: number, raw: unknown) {
  const input = DossierStateSchema.parse(raw);
  return withStore(owner, store => {
    if (!Number.isInteger(revision) || (store.dossiers?.[id]?.revision ?? 0) !== revision)
      throw new HouseholdEditError("Ce dossier a changé. Rechargez la page avant de reprendre.");
    store.dossiers ??= {};
    return store.dossiers[id] = {...input, revision: revision + 1, updatedAt: new Date().toISOString()};
  });
}

export function getPrestations(owner: string): Prestation[] {
  return Object.values(readStore(owner).prestations ?? {}).sort((a,b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}
export function createStoredPrestation(owner: string, value: Omit<Prestation, "id" | "dossierId" | "revision" | "createdAt" | "updatedAt" | "history">): Prestation {
  return withStore(owner, store => {
    const id = `PRE-${randomUUID()}`;
    const at = new Date().toISOString();
    const record: Prestation = {...value, id, dossierId: `DOS-${id}`, revision: 1,
      createdAt: at, updatedAt: at, history: [{at, status: "Reçue", event: "Prestation reçue"}]};
    store.prestations ??= {};
    store.prestations[id] = record;
    syncOperationalAnomalies(store, record);
    syncPrestationDossier(store, record);
    return record;
  });
}
export function changeStoredPrestation(owner: string, id: string, revision: number, change: (value: Prestation) => void): Prestation {
  return withStore(owner, store => {
    const value = store.prestations?.[id];
    if (!value) throw new HouseholdEditError("Prestation introuvable.");
    if (!Number.isInteger(revision) || revision !== value.revision) throw new HouseholdEditError("Prestation modifiée dans un autre onglet. Rechargez la page.");
    change(value);
    value.revision++;
    value.updatedAt = new Date().toISOString();
    syncOperationalAnomalies(store, value);
    syncPrestationDossier(store, value);
    return value;
  });
}
function syncPrestationDossier(store: RuntimeStoreShape, value: Prestation | DevisPec) {
  store.dossiers ??= {};
  const old = store.dossiers[value.dossierId];
  const refused = "kind" in value && isRefused(value);
  const done = ["Validée", "Payée", "Clôturée", "Accepté", "Accordée", "Clôturé"].includes(value.status);
  store.dossiers[value.dossierId] = {
    status: refused ? "Terminé" : value.anomalies.length || Object.values(store.operationalAnomalies ?? {}).some(a => (a.quoteId ?? a.prestationId) === value.id && a.conditionActive) ? "Incomplet" : Object.values(store.operationalAnomalies ?? {}).some(a => (a.quoteId ?? a.prestationId) === value.id && a.status !== "Résolue") ? "À traiter" : done ? "Terminé" : "À traiter",
    priority: old?.priority ?? "Normal", revision: (old?.revision ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
}

function syncOperationalAnomalies(store: RuntimeStoreShape, p: Prestation | DevisPec): boolean {
  store.operationalAnomalies ??= {};
  let changed = false;
  const active = new Set<string>();
  if ("kind" in p && isRefused(p)) {
    for(const a of Object.values(store.operationalAnomalies)) {
      if(a.quoteId === p.id && (a.status !== "Résolue" || a.conditionActive)) {
        a.conditionActive=false; a.status="Résolue"; a.resolution=`Refus motivé, sans accord : ${p.refusalReason}`;
        a.updatedAt=p.updatedAt; a.revision++;
        a.history.push({at:p.updatedAt,status:a.status,event:"Clôture administrative par refus ; donnée source conservée",resolution:a.resolution});
        changed=true;
      }
    }
    return changed;
  }
  for (const message of p.anomalies) {
    const control = describeControl(message);
    const id = `ANO-${p.id}-${control.code}`;
    active.add(id);
    const prior = store.operationalAnomalies[id];
    if (!prior) {
      const at = p.updatedAt;
      store.operationalAnomalies[id] = {
        id, ...("kind" in p ? {quoteId:p.id} : {prestationId:p.id}), dossierId:p.dossierId, householdId:p.householdId, adherentName:p.adherentName,
        type:control.type, severity:"Bloquante", status:"À analyser", cause:control.cause,
        impact:control.impact, recommendation:control.recommendation, conditionActive:true,
        createdAt:at, updatedAt:at, revision:1, resolution:"",
        history:[{at,status:"À analyser",event:"Contrôle bloquant détecté",resolution:""}],
      };
      changed = true;
    } else if (!prior.conditionActive || prior.status === "Résolue") {
      prior.conditionActive = true;
      if (prior.status === "Résolue") {prior.status="À analyser"; prior.resolution="";}
      prior.updatedAt=p.updatedAt; prior.revision++;
      prior.history.push({at:p.updatedAt,status:prior.status,event:"Contrôle bloquant détecté à nouveau",resolution:prior.resolution});
      changed = true;
    }
  }
  for (const a of Object.values(store.operationalAnomalies)) {
    if ((a.quoteId ?? a.prestationId) === p.id && a.conditionActive && !active.has(a.id)) {
      // Monetary corrections are confirmed only by a successful engine calculation.
      if (a.id.endsWith("-amo") && !p.result) continue;
      a.conditionActive=false; a.updatedAt=p.updatedAt; a.revision++;
      a.history.push({at:p.updatedAt,status:a.status,event:"Cause corrigée dans la source ; résolution à documenter",resolution:a.resolution});
      changed=true;
    }
  }
  return changed;
}
export function getOperationalAnomalies(owner:string): OperationalAnomaly[] {
  return withStore(owner, store => {
    // Backfill controls from prestations already saved before this step, once.
    for (const p of [...Object.values(store.prestations ?? {}), ...Object.values(store.devisPec ?? {})]) {
      if (syncOperationalAnomalies(store,p)) syncPrestationDossier(store,p);
    }
    return Object.values(store.operationalAnomalies ?? {});
  });
}
export function updateOperationalAnomaly(owner:string, id:string, revision:number, raw:unknown) {
  const input = AnomalyUpdateSchema.parse(raw);
  return withStore(owner, store => {
    const a=store.operationalAnomalies?.[id];
    if (!a) throw new HouseholdEditError("Anomalie introuvable.");
    const p=a.quoteId ? store.devisPec?.[a.quoteId] : a.prestationId ? store.prestations?.[a.prestationId] : undefined;
    if (!p) throw new HouseholdEditError("Source liée introuvable.");
    syncOperationalAnomalies(store,p);
    if (!Number.isInteger(revision) || a.revision !== revision) throw new HouseholdEditError("Anomalie modifiée dans un autre onglet. Rechargez la page.");
    if (input.status === "Résolue" && a.conditionActive) throw new HouseholdEditError("Corrigez d’abord la cause dans la source liée.");
    if (input.status === "Résolue" && input.resolution.length < 10) throw new HouseholdEditError("Décrivez la résolution (10 caractères minimum).");
    a.status=input.status; a.resolution=input.resolution; a.revision++; a.updatedAt=new Date().toISOString();
    a.history.push({at:a.updatedAt,status:a.status,event:"Traitement de l’anomalie mis à jour",resolution:a.resolution});
    syncPrestationDossier(store,p);
    return a;
  });
}

export function getDevisPec(owner:string):DevisPec[] {
  return Object.values(readStore(owner).devisPec ?? {}).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
}
export function createStoredDevisPec(owner:string,value:Omit<DevisPec,"id"|"dossierId"|"revision"|"createdAt"|"updatedAt"|"history">):DevisPec {
  return withStore(owner,store=>{
    const id=`${value.kind === "devis" ? "DEV" : "PEC"}-${randomUUID()}`, at=new Date().toISOString();
    const record:DevisPec={...value,id,dossierId:`DOS-${id}`,revision:1,createdAt:at,updatedAt:at,history:[{at,status:value.status,event:"Demande enregistrée"}]};
    store.devisPec ??= {}; store.devisPec[id]=record;
    syncOperationalAnomalies(store,record);syncPrestationDossier(store,record);return record;
  });
}
export function changeStoredDevisPec(owner:string,id:string,revision:number,change:(p:DevisPec)=>void):DevisPec {
  return withStore(owner,store=>{
    const p=store.devisPec?.[id];
    if(!p)throw new HouseholdEditError("Devis / PEC introuvable.");
    if(!Number.isInteger(revision)||revision!==p.revision)throw new HouseholdEditError("Demande modifiée dans un autre onglet. Rechargez la page.");
    change(p);p.revision++;p.updatedAt=new Date().toISOString();
    syncOperationalAnomalies(store,p);syncPrestationDossier(store,p);return p;
  });
}

function syncCotisationDossier(store:RuntimeStoreShape,p:Cotisation) {
 const summary=cotisationSummary(p);
 if(!summary.overdue && !p.dossierId)return;
 p.dossierId ??= `DOS-${p.id}`;store.dossiers ??= {};
 const old=store.dossiers[p.dossierId];
 const status=summary.overdue ? "À traiter" : "Terminé";
 if(old?.status===status)return;
 store.dossiers[p.dossierId]={status,priority:old?.priority ?? "Normal",revision:(old?.revision ?? 0)+1,updatedAt:new Date().toISOString()};
}
export function getCotisations(owner:string):Cotisation[] {
 return withStore(owner,store=>{
  const rows=Object.values(store.cotisations ?? {});
  for(const p of rows)syncCotisationDossier(store,p);
  return rows.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.id.localeCompare(b.id));
 });
}
export function createStoredCotisation(owner:string,input:Pick<Cotisation,"householdId"|"adherentName"|"period"|"expectedCents"|"dueDate">) {
 return withStore(owner,store=>{
  const at=new Date().toISOString();
  const p:Cotisation={...input,id:`COT-${randomUUID()}`,revision:1,createdAt:at,updatedAt:at,entries:[]};
  store.cotisations ??= {};store.cotisations[p.id]=p;syncCotisationDossier(store,p);return p;
 });
}
export function addStoredCotisationEntry(owner:string,id:string,revision:number,entry:Omit<Cotisation["entries"][number],"id"|"createdAt">) {
 return withStore(owner,store=>{
  const p=store.cotisations?.[id];
  if(!p)throw new HouseholdEditError("Échéance introuvable.");
  if(!Number.isInteger(revision)||p.revision!==revision)throw new HouseholdEditError("Échéance modifiée dans un autre onglet. Rechargez la page.");
  if(!Number.isSafeInteger(entry.cents)||entry.cents<=0||entry.cents>cotisationSummary(p).balance)throw new HouseholdEditError("Le montant doit être positif et ne pas dépasser le solde.");
  p.updatedAt=new Date().toISOString();p.revision++;
  p.entries.push({...entry,id:`REG-${randomUUID()}`,createdAt:p.updatedAt});
  syncCotisationDossier(store,p);return p;
 });
}

export function getContacts(owner:string):Contact[] {
 return Object.values(readStore(owner).contacts ?? {}).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
}
export function createStoredContact(owner:string,input:Omit<Contact,"id"|"createdAt">) {
 return withStore(owner,store=>{
  const p:Contact={...input,id:`CONTACT-${randomUUID()}`,createdAt:new Date().toISOString()};
  store.contacts ??= {};store.contacts[p.id]=p;return p;
 });
}
export function getComplaints(owner:string):Complaint[] {
 return Object.values(readStore(owner).complaints ?? {}).sort((a,b)=>b.receivedDate.localeCompare(a.receivedDate)||a.id.localeCompare(b.id));
}
function syncComplaintDossier(store:RuntimeStoreShape,p:Complaint) {
 store.dossiers ??= {};const old=store.dossiers[p.dossierId];
 store.dossiers[p.dossierId]={status:["Résolue","Clôturée"].includes(p.status) ? "Terminé" : p.status==="En attente adhérent" ? "En attente" : "À traiter",priority:p.priority,revision:(old?.revision ?? 0)+1,updatedAt:p.updatedAt};
}
export function createStoredComplaint(owner:string,input:Omit<Complaint,"id"|"dossierId"|"status"|"response"|"revision"|"createdAt"|"updatedAt"|"history">) {
 return withStore(owner,store=>{
  const id=`REC-${randomUUID()}`,at=new Date().toISOString();
  const p:Complaint={...input,id,dossierId:`DOS-${id}`,status:"Nouvelle",response:"",revision:1,createdAt:at,updatedAt:at,history:[{at,status:"Nouvelle",priority:input.priority,response:""}]};
  store.complaints ??= {};store.complaints[id]=p;syncComplaintDossier(store,p);return p;
 });
}
export function updateStoredComplaint(owner:string,id:string,revision:number,input:Pick<Complaint,"status"|"priority"|"response">) {
 return withStore(owner,store=>{
  const p=store.complaints?.[id];if(!p)throw new HouseholdEditError("Réclamation introuvable.");
  if(!Number.isInteger(revision)||p.revision!==revision)throw new HouseholdEditError("Réclamation modifiée dans un autre onglet. Rechargez la page.");
  if(!complaintTransitions(p.status).includes(input.status))throw new HouseholdEditError("Transition non autorisée.");
  Object.assign(p,input);p.revision++;p.updatedAt=new Date().toISOString();
  p.history.push({at:p.updatedAt,...input});syncComplaintDossier(store,p);return p;
 });
}

export function getHouseholdLifecycles(owner: string): Record<string, HouseholdLifecycle> {
  return readStore(owner).householdLifecycles ?? {};
}
export function changeHouseholdLifecycle(owner: string, id: string, revision: number, memberId: string | null, raw: unknown) {
  const input = LifecycleChangeSchema.parse(raw);
  const beneficiary = memberId !== null;
  const allowed = beneficiary ? ["active","inactive","deceased"] : ["active","terminated","deceased","archived"];
  const reasons = beneficiary ? ["detached","divorce","deceased","age_limit","other"] : ["termination","death","duplicate","error","other"];
  if (!allowed.includes(input.status) || !reasons.includes(input.endReason) ||
      (input.status === "deceased") !== (input.endReason === (beneficiary ? "deceased" : "death")))
    throw new HouseholdEditError("Statut et motif incompatibles.");
  return withStore(owner, store => {
    const manual = store.manualHouseholds?.[id];
    const seed = getAllCases().find(c => c.household.household_id === id)?.household;
    if ((!manual || manual.deletedAt) && !seed) throw new HouseholdEditError("Foyer introuvable.");
    const birthDate = memberId ? manual?.beneficiaries?.find(b=>b.id===memberId)?.birthDate ?? seed?.members.find(m=>m.member_id===memberId && m.role!=="adherent")?.birth_date : manual?.birthDate ?? seed?.members.find(m=>m.role==="adherent")?.birth_date;
    if (!birthDate) throw new HouseholdEditError("Bénéficiaire introuvable.");
    if (input.endDate < birthDate || (!memberId && manual && input.endDate < manual.effectiveDate)) throw new HouseholdEditError("Date de sortie antérieure à la naissance ou à l’adhésion.");
    store.householdLifecycles ??= {};
    const lifecycle = store.householdLifecycles[id] ?? emptyLifecycle();
    if (!Number.isInteger(revision) || revision !== lifecycle.revision) throw new HouseholdEditError("Statut modifié dans un autre onglet. Rechargez la fiche.");
    const previous = memberId ? lifecycle.beneficiaries[memberId] ?? activeLifecycle() : lifecycle.adherent;
    if (previous.endDate && input.endDate < previous.endDate) throw new HouseholdEditError("Le changement ne peut pas précéder le dernier changement de statut.");
    const next = {...input,history:[...previous.history,{...input,at:new Date().toISOString()}]};
    if (memberId) lifecycle.beneficiaries[memberId]=next; else lifecycle.adherent=next;
    lifecycle.revision++;
    store.householdLifecycles[id]=lifecycle;
    return lifecycle;
  });
}

/** Suppression exceptionnelle : création manuelle erronée sans aucune pièce métier liée. */
export function deleteErroneousHousehold(owner:string,id:string,confirmation:string) {
 return withStore(owner,store=>{
  const h=store.manualHouseholds?.[id];
  if(!h || h.deletedAt || h.source!=="manual")throw new HouseholdEditError("Création manuelle introuvable.");
  if(confirmation!==`SUPPRIMER ${id}`)throw new HouseholdEditError("Confirmation renforcée incorrecte.");
  if(store.householdLifecycles?.[id]?.adherent.endReason!=="error")throw new HouseholdEditError("Clôturez d’abord l’adhérent avec le motif Création par erreur.");
  const related=[store.prestations,store.devisPec,store.cotisations,store.contacts,store.complaints,store.dossiers,store.operationalAnomalies];
  // Inspect all identifiers in the existing records, including nested links.
  const identifiers=new Set([id,h.memberId,...(h.beneficiaries??[]).map(b=>b.id)]);
  const contains=(value:unknown):boolean=>typeof value==="string" ? identifiers.has(value) : value!==null && typeof value==="object" && Object.values(value).some(contains);
  if(store.dossiers?.[`DOS-${id}`] || related.some(records=>contains(records)))throw new HouseholdEditError("Suppression interdite : historique métier associé. Conservez la clôture.");
  delete store.manualHouseholds![id];
  if(store.householdLifecycles)delete store.householdLifecycles[id];
 });
}
