"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession, setLevel, setNewHireMode, setRolePreview } from "@/lib/store/session";
import type { AssistanceLevel, Role } from "@/lib/domain/constants";
import {
  addDocumentAnnotation,
  markDocumentViewed,
  resetRuntimeStore,
  setDocumentStatus,
} from "@/lib/store/runtimeStore";
import type { DocumentStatus } from "@/lib/domain/constants";

export async function updateRoleAction(formData: FormData): Promise<void> {
  // L'aperçu de rôle ne s'applique jamais qu'aux comptes réellement Formateur
  // (voir getAuthSession) : ce contrôle applicatif évite en plus qu'un compte
  // Apprenant ne dépose inutilement le cookie d'aperçu.
  const session = await getAuthSession();
  if (!session || session.accountRole !== "formateur") return;
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
  await markDocumentViewed(documentId);
  revalidatePath(`/cas-pratiques/${caseId}`);
  revalidatePath("/documents");
}

export async function setDocumentStatusAction(
  documentId: string,
  caseId: string,
  status: DocumentStatus,
): Promise<void> {
  await setDocumentStatus(documentId, status);
  revalidatePath(`/cas-pratiques/${caseId}`);
  revalidatePath("/documents");
}

export async function resetRuntimeStoreAction(): Promise<void> {
  await resetRuntimeStore();
  revalidatePath("/", "layout");
}

export async function addDocumentAnnotationAction(
  documentId: string,
  caseId: string,
  text: string,
  author: string,
): Promise<void> {
  if (!text.trim()) return;
  await addDocumentAnnotation(documentId, text, author);
  revalidatePath(`/cas-pratiques/${caseId}`);
  revalidatePath("/documents");
}
