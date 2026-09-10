"use server";

import { getCaseById } from "@/lib/data/loaders";
import { DOCUMENT_STATUS_FLOW } from "@/lib/domain/constants";
import { revalidatePath } from "next/cache";
import { setLevel, setNewHireMode, setRolePreview, getSession } from "@/lib/store/session";
import type { AssistanceLevel, Role } from "@/lib/domain/constants";
import {
  addDocumentAnnotation,
  markDocumentViewed,
  resetRuntimeStore,
  setDocumentStatus,
} from "@/lib/store/runtimeStore";
import type { DocumentStatus } from "@/lib/domain/constants";

export async function updateRoleAction(formData: FormData): Promise<void> {
  const role = formData.get("role") as Role;
  await setRolePreview(role);
  revalidatePath("/", "layout");
}

export async function updateLevelAction(formData: FormData): Promise<void> {
  const level = formData.get("level") as AssistanceLevel;
  await setLevel(level);
  revalidatePath("/", "layout");
}

export async function toggleNewHireModeAction(formData: FormData): Promise<void> {
  const enabled = formData.get("enabled") === "1";
  await setNewHireMode(enabled);
  revalidatePath("/", "layout");
}

export async function markDocumentViewedAction(documentId: string, caseId: string): Promise<void> {
  const s = await documentSession(documentId, caseId);
  await markDocumentViewed(s.userId, documentId);
  revalidatePath(`/cas-pratiques/${caseId}`);
  revalidatePath("/documents");
}

export async function setDocumentStatusAction(
  documentId: string,
  caseId: string,
  status: DocumentStatus,
): Promise<void> {
  const s = await documentSession(documentId, caseId);
  if (!DOCUMENT_STATUS_FLOW.includes(status)) throw new Error("Statut invalide");
  await setDocumentStatus(s.userId, documentId, status);
  revalidatePath(`/cas-pratiques/${caseId}`);
  revalidatePath("/documents");
}

export async function resetRuntimeStoreAction(): Promise<void> {
  await resetRuntimeStore((await getSession()).userId);
  revalidatePath("/", "layout");
}

export async function addDocumentAnnotationAction(
  documentId: string,
  caseId: string,
  text: string,
): Promise<void> {
  if (!text.trim()) return;
  const s = await documentSession(documentId, caseId);
  if (text.length > 5000) throw new Error("Annotation trop longue");
  await addDocumentAnnotation(s.userId, documentId, text.trim(), s.displayName);
  revalidatePath(`/cas-pratiques/${caseId}`);
  revalidatePath("/documents");
}

async function documentSession(documentId: string, caseId: string) {
  const s = await getSession();
  if (!getCaseById(caseId)?.documents.some(d => d.document_id === documentId)) throw new Error("Pièce introuvable");
  return s;
}
