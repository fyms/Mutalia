"use server";

import { revalidatePath } from "next/cache";
import {
  createComplaint,
  createPecRecord,
  setCotisationStatus,
  updateComplaintStatus,
} from "@/lib/store/runtimeStore";
import type { ComplaintStatus, CotisationStatus } from "@/lib/domain/constants";
import { getSession } from "@/lib/store/session";

export async function createComplaintAction(input: {
  householdId: string;
  caseId?: string;
  motif: string;
}): Promise<void> {
  if (!input.motif.trim()) throw new Error("Le motif de la réclamation est requis.");
  await createComplaint(input);
  revalidatePath("/relation-adherent");
  revalidatePath(`/adherents/${input.householdId}`);
  revalidatePath("/pilotage");
}

export async function updateComplaintStatusAction(
  id: string,
  householdId: string,
  status: ComplaintStatus,
  resolutionNote?: string,
): Promise<void> {
  await updateComplaintStatus(id, status, resolutionNote);
  revalidatePath("/relation-adherent");
  revalidatePath(`/adherents/${householdId}`);
  revalidatePath("/pilotage");
}

export async function setCotisationStatusAction(
  householdId: string,
  status: CotisationStatus,
  note?: string,
): Promise<void> {
  const session = await getSession();
  if (session.role !== "formateur") {
    throw new Error("Seul le mode Formateur peut simuler un changement de statut de cotisation.");
  }
  await setCotisationStatus(householdId, status, note);
  revalidatePath("/cotisations");
  revalidatePath(`/adherents/${householdId}`);
}

export async function createPecRecordAction(input: {
  householdId: string;
  caseId?: string;
  beneficiaryId: string;
  acte: string;
  etablissement: string;
  dateSoins: string;
  montantGaranti: number | null;
}): Promise<void> {
  if (!input.acte.trim() || !input.etablissement.trim() || !input.dateSoins) {
    throw new Error("Acte, établissement et date des soins sont requis.");
  }
  const session = await getSession();
  await createPecRecord({ ...input, createdBy: session.role === "formateur" ? "Formateur" : "Apprenant" });
  revalidatePath("/pec-devis");
  revalidatePath(`/adherents/${input.householdId}`);
}
