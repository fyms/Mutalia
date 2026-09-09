"use server";

import { revalidatePath } from "next/cache";
import { setLevel, setNewHireMode, setProfileId, setRole } from "@/lib/store/session";
import type { AssistanceLevel, Role } from "@/lib/domain/constants";
import {
  addDocumentAnnotation,
  createProfile,
  markDocumentViewed,
  resetRuntimeStore,
  setDocumentStatus,
  type LearnerProfile,
} from "@/lib/store/runtimeStore";
import type { DocumentStatus } from "@/lib/domain/constants";

export async function updateRoleAction(formData: FormData): Promise<void> {
  const role = formData.get("role") as Role;
  await setRole(role);
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

export async function switchProfileAction(profileId: string): Promise<void> {
  await setProfileId(profileId);
  revalidatePath("/", "layout");
}

export async function createProfileAction(name: string): Promise<LearnerProfile> {
  const profile = await createProfile(name);
  await setProfileId(profile.id);
  revalidatePath("/", "layout");
  return profile;
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
